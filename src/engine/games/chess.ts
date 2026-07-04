import { fileOf, inBounds, rankOf, toIndex } from '../geometry';
import { defaultApplyToBoard } from '../duel';
import {
  Board,
  capturesOf,
  Color,
  GameDef,
  Move,
  MoveScore,
  PieceInfo,
  ScoreNote,
  SquareIndex,
} from '../types';

// ─── Ajedrez: el primer juego de la plataforma ──────────────────────────────
// Reglas clásicas (pseudo-legales en el Hito 0: jaques/clavadas son un TODO),
// más las piezas HERÉTICAS: variantes coleccionables que entran por ejércitos
// iniciales y por la Forja de la tienda (ver docs/04). Cada pieza pertenece a una
// CASTA (ver src/game/castas.ts); en la Forja solo se cambia dentro de la casta.

export type ChessPieceType =
  | 'pawn'
  | 'berolina'
  | 'knight'
  | 'bishop'
  | 'rook'
  | 'queen'
  | 'king'
  | 'chancellor'
  | 'archbishop'
  | 'grasshopper'
  | 'camel'
  | 'cannon'
  | 'amazon';

const PIECES: Record<ChessPieceType, PieceInfo> = {
  pawn: { name: 'Peón', captureValue: 1, casta: 'infanteria', glyph: { white: '♙', black: '♟' } },
  knight: { name: 'Caballo', captureValue: 3, casta: 'menor', glyph: { white: '♘', black: '♞' } },
  bishop: { name: 'Alfil', captureValue: 3, casta: 'menor', glyph: { white: '♗', black: '♝' } },
  rook: { name: 'Torre', captureValue: 5, casta: 'mayor', glyph: { white: '♖', black: '♜' } },
  queen: { name: 'Dama', captureValue: 9, casta: 'elite', glyph: { white: '♕', black: '♛' } },
  // Capturar al rey termina el Duelo; no puntúa como Presión. Sin casta (no forjable).
  king: { name: 'Rey', captureValue: 0, objective: true, glyph: { white: '♔', black: '♚' } },
  // Piezas heréticas (fairy chess). Canciller = torre+caballo; Arzobispo =
  // alfil+caballo; Saltamontes salta sobre la primera pieza en línea de dama y
  // aterriza justo detrás; Camello = saltador (3,1); Cañón (xiangqi) se desliza
  // como torre pero captura saltando sobre exactamente una pieza; Amazona = dama+caballo.
  berolina: {
    name: 'Berolina',
    captureValue: 1,
    casta: 'infanteria',
    glyph: { white: '⬟', black: '⬟' },
  },
  grasshopper: {
    name: 'Saltamontes',
    captureValue: 3,
    casta: 'menor',
    glyph: { white: '❖', black: '❖' },
  },
  camel: { name: 'Camello', captureValue: 3, casta: 'menor', glyph: { white: '⟁', black: '⟁' } },
  archbishop: {
    name: 'Arzobispo',
    captureValue: 7,
    casta: 'menor',
    glyph: { white: '✠', black: '✠' },
  },
  chancellor: {
    name: 'Canciller',
    captureValue: 8,
    casta: 'mayor',
    glyph: { white: '⚜', black: '⚜' },
  },
  cannon: { name: 'Cañón', captureValue: 5, casta: 'mayor', glyph: { white: '◎', black: '◎' } },
  amazon: { name: 'Amazona', captureValue: 12, casta: 'elite', glyph: { white: '✸', black: '✸' } },
};

// Direcciones como vectores [dFile, dRank]. Modelar el movimiento como vectores
// facilita generalizar a otras geometrías (grande, hexagonal) más adelante.
type Dir = [number, number];

const ROOK_DIRS: Dir[] = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
];
const BISHOP_DIRS: Dir[] = [
  [1, 1],
  [1, -1],
  [-1, 1],
  [-1, -1],
];
const QUEEN_DIRS: Dir[] = [...ROOK_DIRS, ...BISHOP_DIRS];
const KING_DIRS: Dir[] = QUEEN_DIRS;
const KNIGHT_JUMPS: Dir[] = [
  [1, 2],
  [2, 1],
  [-1, 2],
  [-2, 1],
  [1, -2],
  [2, -1],
  [-1, -2],
  [-2, -1],
];
// Camello: saltador (3,1), como un caballo largo.
const CAMEL_JUMPS: Dir[] = [
  [1, 3],
  [3, 1],
  [-1, 3],
  [-3, 1],
  [1, -3],
  [3, -1],
  [-1, -3],
  [-3, -1],
];

const BACK_RANK: ChessPieceType[] = [
  'rook',
  'knight',
  'bishop',
  'queen',
  'king',
  'bishop',
  'knight',
  'rook',
];

/** Posición estándar de ajedrez. Las blancas ocupan los ranks 0-1; las negras, 6-7. */
function createInitialBoard(): Board {
  const board: Board = new Array(64).fill(null);
  let id = 1;
  const make = (type: ChessPieceType, color: Color) => ({ id: id++, type, color });

  for (let f = 0; f < 8; f++) {
    board[toIndex(f, 0)] = make(BACK_RANK[f], 'white');
    board[toIndex(f, 1)] = make('pawn', 'white');
    board[toIndex(f, 6)] = make('pawn', 'black');
    board[toIndex(f, 7)] = make(BACK_RANK[f], 'black');
  }
  return board;
}

/** Movimientos deslizantes (torre, alfil, dama): avanzan hasta chocar. */
function slide(board: Board, from: SquareIndex, dirs: Dir[]): Move[] {
  const moves: Move[] = [];
  const piece = board[from]!;
  const f0 = fileOf(from);
  const r0 = rankOf(from);

  for (const [df, dr] of dirs) {
    let f = f0 + df;
    let r = r0 + dr;
    while (inBounds(f, r)) {
      const to = toIndex(f, r);
      const occupant = board[to];
      if (!occupant) {
        moves.push({ from, to });
      } else {
        if (occupant.color !== piece.color) moves.push({ from, to, captured: occupant });
        break;
      }
      f += df;
      r += dr;
    }
  }
  return moves;
}

/** Movimientos de un solo paso (caballo, rey). */
function step(board: Board, from: SquareIndex, dirs: Dir[]): Move[] {
  const moves: Move[] = [];
  const piece = board[from]!;
  const f0 = fileOf(from);
  const r0 = rankOf(from);

  for (const [df, dr] of dirs) {
    const f = f0 + df;
    const r = r0 + dr;
    if (!inBounds(f, r)) continue;
    const to = toIndex(f, r);
    const occupant = board[to];
    if (!occupant) moves.push({ from, to });
    else if (occupant.color !== piece.color) moves.push({ from, to, captured: occupant });
  }
  return moves;
}

/**
 * Saltamontes: se mueve en líneas de dama, pero SOLO saltando sobre la primera
 * pieza que encuentre (propia o rival) y aterrizando en la casilla siguiente.
 * Puede capturar lo que haya en la casilla de aterrizaje.
 */
function hop(board: Board, from: SquareIndex, dirs: Dir[]): Move[] {
  const moves: Move[] = [];
  const piece = board[from]!;
  const f0 = fileOf(from);
  const r0 = rankOf(from);

  for (const [df, dr] of dirs) {
    let f = f0 + df;
    let r = r0 + dr;
    // Avanza hasta la primera pieza (el "trampolín").
    while (inBounds(f, r) && !board[toIndex(f, r)]) {
      f += df;
      r += dr;
    }
    // Aterriza justo detrás del trampolín.
    const fl = f + df;
    const rl = r + dr;
    if (!inBounds(f, r) || !inBounds(fl, rl)) continue;
    const to = toIndex(fl, rl);
    const occupant = board[to];
    if (!occupant) moves.push({ from, to });
    else if (occupant.color !== piece.color) moves.push({ from, to, captured: occupant });
  }
  return moves;
}

/**
 * Cañón (xiangqi): se desliza como una torre a casillas VACÍAS (sin capturar);
 * para capturar debe saltar sobre exactamente una pieza-pantalla (de cualquier
 * color) y toma la primera pieza enemiga que haya detrás.
 */
function cannonMoves(board: Board, from: SquareIndex): Move[] {
  const moves: Move[] = [];
  const piece = board[from]!;
  const f0 = fileOf(from);
  const r0 = rankOf(from);

  for (const [df, dr] of ROOK_DIRS) {
    let f = f0 + df;
    let r = r0 + dr;
    // Fase 1: desliza sobre casillas vacías (movimientos sin captura).
    while (inBounds(f, r) && !board[toIndex(f, r)]) {
      moves.push({ from, to: toIndex(f, r) });
      f += df;
      r += dr;
    }
    if (!inBounds(f, r)) continue; // no hay pantalla en esta dirección
    // (f,r) es la pantalla. Fase 2: busca la primera pieza detrás de ella.
    f += df;
    r += dr;
    while (inBounds(f, r) && !board[toIndex(f, r)]) {
      f += df;
      r += dr;
    }
    if (!inBounds(f, r)) continue;
    const target = board[toIndex(f, r)]!;
    if (target.color !== piece.color) moves.push({ from, to: toIndex(f, r), captured: target });
  }
  return moves;
}

/**
 * Berolina: peón espejo. Avanza en diagonal (sin capturar) y captura de frente
 * en línea recta. Doble paso diagonal desde su casilla inicial. Corona al fondo.
 */
function berolinaMoves(board: Board, from: SquareIndex): Move[] {
  const moves: Move[] = [];
  const piece = board[from]!;
  const dir = piece.color === 'white' ? 1 : -1;
  const startRank = piece.color === 'white' ? 1 : 6;
  const promoRank = piece.color === 'white' ? 7 : 0;
  const f0 = fileOf(from);
  const r0 = rankOf(from);

  const push = (to: SquareIndex, captured?: Board[number]) => {
    const promotion = rankOf(to) === promoRank || undefined;
    moves.push({ from, to, captured: captured ?? undefined, promotion });
  };

  // Avance diagonal (sin captura), con doble paso desde la casilla inicial.
  for (const df of [-1, 1]) {
    const f = f0 + df;
    const r = r0 + dir;
    if (inBounds(f, r) && !board[toIndex(f, r)]) {
      push(toIndex(f, r));
      const f2 = f0 + 2 * df;
      const r2 = r0 + 2 * dir;
      if (r0 === startRank && inBounds(f2, r2) && !board[toIndex(f2, r2)]) {
        moves.push({ from, to: toIndex(f2, r2) });
      }
    }
  }

  // Captura recta hacia adelante.
  const rc = r0 + dir;
  if (inBounds(f0, rc)) {
    const occ = board[toIndex(f0, rc)];
    if (occ && occ.color !== piece.color) push(toIndex(f0, rc), occ);
  }

  return moves;
}

function pawnMoves(board: Board, from: SquareIndex): Move[] {
  const moves: Move[] = [];
  const piece = board[from]!;
  const dir = piece.color === 'white' ? 1 : -1;
  const startRank = piece.color === 'white' ? 1 : 6;
  const promoRank = piece.color === 'white' ? 7 : 0;
  const f0 = fileOf(from);
  const r0 = rankOf(from);

  const push = (to: SquareIndex, captured?: Board[number]) => {
    const promotion = rankOf(to) === promoRank || undefined;
    moves.push({ from, to, captured: captured ?? undefined, promotion });
  };

  // Avance simple (y doble desde la casilla de inicio).
  const r1 = r0 + dir;
  if (inBounds(f0, r1) && !board[toIndex(f0, r1)]) {
    push(toIndex(f0, r1));
    const r2 = r0 + 2 * dir;
    if (r0 === startRank && !board[toIndex(f0, r2)]) {
      moves.push({ from, to: toIndex(f0, r2) });
    }
  }

  // Capturas en diagonal.
  for (const df of [-1, 1]) {
    const f = f0 + df;
    const r = r0 + dir;
    if (!inBounds(f, r)) continue;
    const to = toIndex(f, r);
    const occupant = board[to];
    if (occupant && occupant.color !== piece.color) push(to, occupant);
  }

  return moves;
}

/**
 * Movimientos pseudo-legales (no se filtran los que dejan al rey en jaque).
 * Suficiente para el Hito 0; la legalidad estricta (jaques/clavadas) es un TODO.
 */
function movesFrom(board: Board, from: SquareIndex): Move[] {
  const piece = board[from];
  if (!piece) return [];
  switch (piece.type as ChessPieceType) {
    case 'pawn':
      return pawnMoves(board, from);
    case 'berolina':
      return berolinaMoves(board, from);
    case 'knight':
      return step(board, from, KNIGHT_JUMPS);
    case 'bishop':
      return slide(board, from, BISHOP_DIRS);
    case 'rook':
      return slide(board, from, ROOK_DIRS);
    case 'queen':
      return slide(board, from, QUEEN_DIRS);
    case 'king':
      return step(board, from, KING_DIRS);
    case 'chancellor':
      return [...slide(board, from, ROOK_DIRS), ...step(board, from, KNIGHT_JUMPS)];
    case 'archbishop':
      return [...slide(board, from, BISHOP_DIRS), ...step(board, from, KNIGHT_JUMPS)];
    case 'grasshopper':
      return hop(board, from, QUEEN_DIRS);
    case 'camel':
      return step(board, from, CAMEL_JUMPS);
    case 'cannon':
      return cannonMoves(board, from);
    case 'amazon':
      return [...slide(board, from, QUEEN_DIRS), ...step(board, from, KNIGHT_JUMPS)];
  }
}

// Casillas centrales d4, e4, d5, e5.
const CENTER = new Set<number>([27, 28, 35, 36]);

/** Presión que aporta el ajedrez a una jugada, con desglose para el HUD. */
function scoreForMove(move: Move): MoveScore {
  let base = 0;
  const notes: ScoreNote[] = [];
  for (const cap of capturesOf(move)) {
    const info = PIECES[cap.type as ChessPieceType];
    base += info.captureValue;
    notes.push({ source: `Captura: ${info.name}`, detail: `+${info.captureValue} base` });
  }
  if (move.promotion) {
    base += 8;
    notes.push({ source: 'Coronación', detail: '+8 base' });
  }
  if (CENTER.has(move.to)) {
    base += 1;
    notes.push({ source: 'Centro', detail: '+1 base' });
  }
  return { base, notes };
}

/** Igual que el movimiento por defecto, pero un peón que corona se vuelve dama. */
function applyToBoard(board: Board, move: Move): Board {
  const next = defaultApplyToBoard(board, move);
  if (move.promotion) next[move.to] = { ...next[move.to]!, type: 'queen' };
  return next;
}

export const CHESS: GameDef = {
  id: 'chess',
  name: 'Ajedrez',
  pieces: PIECES,
  defaults: { target: 25, turnLimit: 24 },
  hint:
    'Captura piezas para generar Presión y alcanza la meta antes de que se acaben ' +
    'los turnos. Capturar al rey rival gana el Duelo al instante.',
  createInitialBoard,
  movesFrom,
  scoreForMove,
  applyToBoard,
};
