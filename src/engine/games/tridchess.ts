import { defaultApplyToBoard } from '../duel';
import {
  Board,
  BoardLayout,
  capturesOf,
  Color,
  GameDef,
  Move,
  MoveScore,
  PieceInfo,
  ScoreNote,
  SquareIndex,
} from '../types';

// ─── Ajedrez 3D (estilo Star Trek) ───────────────────────────────────────────
// Adaptación de las reglas de tablero múltiple de Bartmess/Star Fleet Technical
// Manual: 7 tableros en 5 niveles — 3 tableros principales 4×4 apilados
// (Bottom/Middle/Top) más 4 "Attack Boards" 2×2 (uno por esquina), 64 casillas
// en total, igual que el ajedrez clásico. A diferencia del juego original, los
// Attack Boards NO se deslizan ni rotan durante el Duelo (ver docs/05 — es la
// simplificación deliberada para encajar en un motor de tablero fijo por
// Duelo); lo que SÍ es fiel es el movimiento real en 3D: torres/damas se
// deslizan también en vertical, los alfiles ganan diagonales de 3 ejes
// ("triagonales") y los caballos saltan combinando cualquier par de ejes
// (pueden cambiar de nivel). Este archivo define su propia geometría local
// (no la rejilla 8×8 de `geometry.ts`) porque el tablero no es rectangular.

export type TridPieceType = 'pawn' | 'knight' | 'bishop' | 'rook' | 'queen' | 'king';

const PIECES: Record<TridPieceType, PieceInfo> = {
  pawn: { name: 'Peón', captureValue: 1, casta: 'infanteria', glyph: { white: '♙', black: '♟' } },
  knight: { name: 'Caballo', captureValue: 3, casta: 'menor', glyph: { white: '♘', black: '♞' } },
  bishop: { name: 'Alfil', captureValue: 3, casta: 'menor', glyph: { white: '♗', black: '♝' } },
  rook: { name: 'Torre', captureValue: 5, casta: 'mayor', glyph: { white: '♖', black: '♜' } },
  queen: { name: 'Dama', captureValue: 9, casta: 'elite', glyph: { white: '♕', black: '♛' } },
  king: { name: 'Rey', captureValue: 0, objective: true, glyph: { white: '♔', black: '♚' } },
};

// ─── Geometría 3D: (file, rank, level) ───────────────────────────────────────
// file 0-5, rank 0-5, level 0-4 (0=Attack Boards bajos de blancas,
// 1=Bottom, 2=Middle, 3=Top, 4=Attack Boards altos de negras).

function isMainLevel(level: number): boolean {
  return level === 1 || level === 2 || level === 3;
}

// OJO: el file de un Attack Board está acotado a {0,1,4,5} — nunca uses
// `file <= 1 || file >= 4` aquí, o el rango queda abierto por los extremos y
// un deslizamiento lateral (torre/dama) en nivel 0/4 nunca encuentra el borde
// (bucle infinito real, no solo un bug de datos).
function isLowAttack(file: number, rank: number): boolean {
  return (rank === 0 || rank === 1) && (file === 0 || file === 1 || file === 4 || file === 5);
}

function isHighAttack(file: number, rank: number): boolean {
  return (rank === 4 || rank === 5) && (file === 0 || file === 1 || file === 4 || file === 5);
}

function validCell(file: number, rank: number, level: number): boolean {
  if (isMainLevel(level)) return file >= 1 && file <= 4 && rank >= 1 && rank <= 4;
  if (level === 0) return isLowAttack(file, rank);
  if (level === 4) return isHighAttack(file, rank);
  return false;
}

/** Las 64 casillas válidas, en un orden fijo: su posición en este array ES el SquareIndex. */
const CELLS: [number, number, number][] = [];
const INDEX_OF = new Map<number, number>();
const keyOf = (f: number, r: number, l: number) => f * 100 + r * 10 + l;

for (let level = 0; level <= 4; level++) {
  for (let rank = 0; rank <= 5; rank++) {
    for (let file = 0; file <= 5; file++) {
      if (!validCell(file, rank, level)) continue;
      INDEX_OF.set(keyOf(file, rank, level), CELLS.length);
      CELLS.push([file, rank, level]);
    }
  }
}

function coordOf(sq: SquareIndex): [number, number, number] {
  return CELLS[sq];
}

/** (file, rank, level) → SquareIndex, o null si la celda no pertenece a ningún tablero. */
export function squareAt(file: number, rank: number, level: number): SquareIndex | null {
  const i = INDEX_OF.get(keyOf(file, rank, level));
  return i === undefined ? null : i;
}

const toIdx = squareAt;

function inBounds3(file: number, rank: number, level: number): boolean {
  return validCell(file, rank, level);
}

// ─── Direcciones (vectores [dFile, dRank, dLevel]) ───────────────────────────

type Dir3 = [number, number, number];

const ROOK_DIRS: Dir3[] = [
  [1, 0, 0],
  [-1, 0, 0],
  [0, 1, 0],
  [0, -1, 0],
  [0, 0, 1],
  [0, 0, -1],
];

// Diagonales "planas" (un eje fijo, los otros dos ±1) + "triagonales" (los 3
// ejes ±1 a la vez) — la generalización completa de "diagonal" a 3D.
const BISHOP_DIRS: Dir3[] = [
  [1, 1, 0],
  [1, -1, 0],
  [-1, 1, 0],
  [-1, -1, 0],
  [1, 0, 1],
  [1, 0, -1],
  [-1, 0, 1],
  [-1, 0, -1],
  [0, 1, 1],
  [0, 1, -1],
  [0, -1, 1],
  [0, -1, -1],
  [1, 1, 1],
  [1, 1, -1],
  [1, -1, 1],
  [1, -1, -1],
  [-1, 1, 1],
  [-1, 1, -1],
  [-1, -1, 1],
  [-1, -1, -1],
];

const QUEEN_DIRS: Dir3[] = [...ROOK_DIRS, ...BISHOP_DIRS];
const KING_DIRS: Dir3[] = QUEEN_DIRS;

// Caballo: el salto clásico (1,2)/(2,1) generalizado a CUALQUIER par de ejes
// (file-rank, file-level, rank-level) — así el caballo puede saltar entre
// niveles, incluso saltándose un tablero entero.
const KNIGHT_2D: [number, number][] = [
  [1, 2],
  [2, 1],
  [-1, 2],
  [-2, 1],
  [1, -2],
  [2, -1],
  [-1, -2],
  [-2, -1],
];
const KNIGHT_JUMPS: Dir3[] = [
  ...KNIGHT_2D.map(([a, b]): Dir3 => [a, b, 0]),
  ...KNIGHT_2D.map(([a, b]): Dir3 => [a, 0, b]),
  ...KNIGHT_2D.map(([a, b]): Dir3 => [0, a, b]),
];

function slide3D(board: Board, from: SquareIndex, dirs: Dir3[]): Move[] {
  const moves: Move[] = [];
  const piece = board[from]!;
  const [f0, r0, l0] = coordOf(from);
  for (const [df, dr, dl] of dirs) {
    let f = f0 + df;
    let r = r0 + dr;
    let l = l0 + dl;
    while (inBounds3(f, r, l)) {
      const to = toIdx(f, r, l)!;
      const occupant = board[to];
      if (!occupant) {
        moves.push({ from, to });
      } else {
        if (occupant.color !== piece.color) moves.push({ from, to, captured: occupant });
        break;
      }
      f += df;
      r += dr;
      l += dl;
    }
  }
  return moves;
}

function step3D(board: Board, from: SquareIndex, dirs: Dir3[]): Move[] {
  const moves: Move[] = [];
  const piece = board[from]!;
  const [f0, r0, l0] = coordOf(from);
  for (const [df, dr, dl] of dirs) {
    const f = f0 + df;
    const r = r0 + dr;
    const l = l0 + dl;
    if (!inBounds3(f, r, l)) continue;
    const to = toIdx(f, r, l)!;
    const occupant = board[to];
    if (!occupant) moves.push({ from, to });
    else if (occupant.color !== piece.color) moves.push({ from, to, captured: occupant });
  }
  return moves;
}

// ─── Peones: escalera vertical a través de los 3 tableros principales ───────
// v = (level-1)*4 + rank, level∈{1,2,3} rank∈{1..4} → v∈{1..12}. Un peón
// "avanza" subiendo v; al cruzar el borde de un tablero (rank 4→1) sube de
// nivel en el mismo paso — así el peón sigue "de frente" al cruzar tableros.
// Las blancas suben v (Bottom→Middle→Top); las negras lo bajan.

function vOf(rank: number, level: number): number {
  return (level - 1) * 4 + rank;
}

function fromV(v: number): { rank: number; level: number } {
  const level = 1 + Math.floor((v - 1) / 4);
  const rank = ((v - 1) % 4) + 1;
  return { rank, level };
}

const WHITE_START_V = new Set([2, 3]);
const BLACK_START_V = new Set([10, 11]);

function pawnMoves(board: Board, from: SquareIndex): Move[] {
  const moves: Move[] = [];
  const piece = board[from]!;
  const [f0, r0, l0] = coordOf(from);
  const v0 = vOf(r0, l0);
  const dir = piece.color === 'white' ? 1 : -1;
  const startVs = piece.color === 'white' ? WHITE_START_V : BLACK_START_V;
  const promoV = piece.color === 'white' ? 12 : 1;

  const targetOf = (v: number, file: number): SquareIndex | null => {
    if (v < 1 || v > 12) return null;
    const { rank, level } = fromV(v);
    return toIdx(file, rank, level);
  };

  const push = (to: SquareIndex, v: number, captured?: Board[number]) => {
    const promotion = v === promoV || undefined;
    moves.push({ from, to, captured: captured ?? undefined, promotion });
  };

  // Avance recto (sin captura), con doble paso desde las casillas de inicio.
  const to1 = targetOf(v0 + dir, f0);
  if (to1 !== null && !board[to1]) {
    push(to1, v0 + dir);
    if (startVs.has(v0)) {
      const to2 = targetOf(v0 + 2 * dir, f0);
      if (to2 !== null && !board[to2]) moves.push({ from, to: to2 });
    }
  }

  // Capturas en diagonal (mismo escalón de la escalera, file ± 1).
  for (const df of [-1, 1]) {
    const to = targetOf(v0 + dir, f0 + df);
    if (to === null) continue;
    const occupant = board[to];
    if (occupant && occupant.color !== piece.color) push(to, v0 + dir, occupant);
  }

  return moves;
}

/** Posición inicial: 16 piezas por bando, repartidas entre su Attack Board y
 * su tablero principal; el Middle board arranca vacío (territorio neutral). */
function createInitialBoard(): Board {
  const board: Board = new Array(CELLS.length).fill(null);
  let id = 1;
  const put = (file: number, rank: number, level: number, type: TridPieceType, color: Color) => {
    const sq = toIdx(file, rank, level)!;
    board[sq] = { id: id++, type, color };
  };

  // Attack Boards: Torre + Caballo cada uno (blancas abajo, negras arriba).
  put(1, 1, 0, 'rook', 'white'); // WQL, esquina interior
  put(1, 0, 0, 'knight', 'white');
  put(4, 1, 0, 'rook', 'white'); // WKL
  put(4, 0, 0, 'knight', 'white');
  put(1, 4, 4, 'rook', 'black'); // BQL
  put(1, 5, 4, 'knight', 'black');
  put(4, 4, 4, 'rook', 'black'); // BKL
  put(4, 5, 4, 'knight', 'black');

  // Bottom board (blancas): fila trasera + 2 filas de peones.
  put(1, 1, 1, 'bishop', 'white');
  put(2, 1, 1, 'queen', 'white');
  put(3, 1, 1, 'king', 'white');
  put(4, 1, 1, 'bishop', 'white');
  for (let f = 1; f <= 4; f++) put(f, 2, 1, 'pawn', 'white');
  for (let f = 1; f <= 4; f++) put(f, 3, 1, 'pawn', 'white');

  // Top board (negras), simétrico.
  put(1, 4, 3, 'bishop', 'black');
  put(2, 4, 3, 'queen', 'black');
  put(3, 4, 3, 'king', 'black');
  put(4, 4, 3, 'bishop', 'black');
  for (let f = 1; f <= 4; f++) put(f, 3, 3, 'pawn', 'black');
  for (let f = 1; f <= 4; f++) put(f, 2, 3, 'pawn', 'black');

  return board;
}

function movesFrom(board: Board, from: SquareIndex): Move[] {
  const piece = board[from];
  if (!piece) return [];
  switch (piece.type as TridPieceType) {
    case 'pawn':
      return pawnMoves(board, from);
    case 'knight':
      return step3D(board, from, KNIGHT_JUMPS);
    case 'bishop':
      return slide3D(board, from, BISHOP_DIRS);
    case 'rook':
      return slide3D(board, from, ROOK_DIRS);
    case 'queen':
      return slide3D(board, from, QUEEN_DIRS);
    case 'king':
      return step3D(board, from, KING_DIRS);
  }
}

// El Middle board (nivel 2) es territorio neutral disputado por ambos bandos.
const CENTER_LEVEL = 2;

function scoreForMove(move: Move): MoveScore {
  let base = 0;
  const notes: ScoreNote[] = [];
  for (const cap of capturesOf(move)) {
    const info = PIECES[cap.type as TridPieceType];
    base += info.captureValue;
    notes.push({ source: `Captura: ${info.name}`, detail: `+${info.captureValue} base` });
  }
  if (move.promotion) {
    base += 8;
    notes.push({ source: 'Coronación', detail: '+8 base' });
  }
  const [, , toLevel] = coordOf(move.to);
  if (toLevel === CENTER_LEVEL) {
    base += 2;
    notes.push({ source: 'Tablero central', detail: '+2 base' });
  }
  return { base, notes };
}

function applyToBoard(board: Board, move: Move): Board {
  const next = defaultApplyToBoard(board, move);
  if (move.promotion) next[move.to] = { ...next[move.to]!, type: 'queen' };
  return next;
}

// ─── Layout de render: 3 tableros lado a lado + los 4 Attack Boards ─────────
// en sus esquinas. cols 0-3 = Bottom, 5-8 = Middle, 10-13 = Top; rows 0-1 =
// Attack Boards de blancas, 2-5 = los 3 tableros principales, 6-7 = Attack
// Boards de negras.

function cellPos(file: number, rank: number, level: number): { col: number; row: number } {
  if (level === 0) {
    const col = file <= 1 ? file : file - 2; // WQL: 0-1, WKL: 2-3
    return { col, row: rank };
  }
  if (level === 4) {
    const col = file <= 1 ? file + 10 : file + 8; // BQL: 10-11, BKL: 12-13
    return { col, row: rank + 2 };
  }
  const colBase = level === 1 ? -1 : level === 2 ? 4 : 9;
  return { col: file + colBase, row: rank + 1 };
}

const LAYOUT: BoardLayout = {
  cols: 14,
  rows: 8,
  count: CELLS.length,
  cellAt: (sq) => {
    const [f, r, l] = coordOf(sq);
    return cellPos(f, r, l);
  },
  isDark: (sq) => {
    const [f, r] = coordOf(sq);
    return (f + r) % 2 === 0;
  },
};

export const TRIDCHESS: GameDef = {
  id: 'tridchess',
  name: 'Ajedrez 3D',
  pieces: PIECES,
  defaults: { target: 28, turnLimit: 28 },
  hint:
    'Muévete en 3 dimensiones: torres y damas también se deslizan en vertical, los ' +
    'alfiles ganan diagonales de 3 ejes y los caballos saltan cambiando de nivel. El ' +
    'tablero central (Middle) es neutral: plántate ahí para sumar Presión extra.',
  layout: LAYOUT,
  createInitialBoard,
  movesFrom,
  scoreForMove,
  applyToBoard,
};
