import { fileOf, inBounds, rankOf, toIndex } from '../geometry';
import { defaultApplyToBoard } from '../duel';
import { Board, capturesOf, Color, GameDef, Move, MoveScore, PieceInfo, SquareIndex } from '../types';

// ─── Damas: segundo juego de la plataforma ───────────────────────────────────
// Reglas anglosajonas (8×8, casillas oscuras). La mecánica estrella: las CADENAS
// de captura se resuelven como UNA jugada cuyo mult crece con cada salto
// (×saltos). El peón corona a Dama al llegar al fondo. Ver docs/09.

type DamasPieceType = 'man' | 'king';

const PIECES: Record<DamasPieceType, PieceInfo> = {
  man: { name: 'Peón', captureValue: 2, glyph: { white: '⛀', black: '⛂' } },
  king: { name: 'Dama', captureValue: 6, glyph: { white: '⛁', black: '⛃' } },
};

type Dir = [number, number];
const ALL_DIAG: Dir[] = [
  [1, 1],
  [1, -1],
  [-1, 1],
  [-1, -1],
];

const isDark = (sq: SquareIndex): boolean => (fileOf(sq) + rankOf(sq)) % 2 === 0;
const promoRank = (color: Color): number => (color === 'white' ? 7 : 0);

/** Direcciones en las que una pieza puede moverse/capturar. El peón, solo hacia adelante. */
function dirsFor(color: Color, type: DamasPieceType): Dir[] {
  if (type === 'king') return ALL_DIAG;
  const dr = color === 'white' ? 1 : -1;
  return [
    [1, dr],
    [-1, dr],
  ];
}

/** 12 peones por bando en las casillas oscuras de sus tres primeras filas. */
function createInitialBoard(): Board {
  const board: Board = new Array(64).fill(null);
  let id = 1;
  for (let sq = 0; sq < 64; sq++) {
    if (!isDark(sq)) continue;
    const r = rankOf(sq);
    if (r <= 2) board[sq] = { id: id++, type: 'man', color: 'white' };
    else if (r >= 5) board[sq] = { id: id++, type: 'man', color: 'black' };
  }
  return board;
}

/** Movimientos simples (sin captura): un paso diagonal a casilla vacía. */
function simpleMoves(board: Board, from: SquareIndex): Move[] {
  const piece = board[from]!;
  const moves: Move[] = [];
  const f0 = fileOf(from);
  const r0 = rankOf(from);
  for (const [df, dr] of dirsFor(piece.color, piece.type as DamasPieceType)) {
    const f = f0 + df;
    const r = r0 + dr;
    if (!inBounds(f, r)) continue;
    const to = toIndex(f, r);
    if (!board[to]) {
      const promotion = piece.type === 'man' && r === promoRank(piece.color) ? true : undefined;
      moves.push({ from, to, promotion });
    }
  }
  return moves;
}

/**
 * Cadenas de captura maximales desde `from` (DFS). Cada resultado es UNA jugada
 * que salta sobre varias piezas: `captures` lista las víctimas, `path` las
 * casillas de aterrizaje. La coronación (peón que acaba en el fondo) marca `promotion`.
 */
function captureChains(board: Board, from: SquareIndex): Move[] {
  const piece = board[from]!;
  const dirs = dirsFor(piece.color, piece.type as DamasPieceType);
  const results: Move[] = [];

  const dfs = (
    sq: SquareIndex,
    work: Board,
    captured: NonNullable<Board[number]>[],
    path: SquareIndex[],
  ) => {
    let extended = false;
    const f0 = fileOf(sq);
    const r0 = rankOf(sq);
    for (const [df, dr] of dirs) {
      const mf = f0 + df;
      const mr = r0 + dr;
      const lf = f0 + 2 * df;
      const lr = r0 + 2 * dr;
      if (!inBounds(lf, lr)) continue;
      const midSq = toIndex(mf, mr);
      const landSq = toIndex(lf, lr);
      const mid = work[midSq];
      if (!mid || mid.color === piece.color) continue;
      if (captured.some((c) => c.id === mid.id)) continue; // no recapturar en la misma cadena
      if (work[landSq]) continue; // el aterrizaje debe estar vacío
      const nb = work.slice();
      nb[landSq] = nb[sq];
      nb[sq] = null;
      nb[midSq] = null;
      extended = true;
      dfs(landSq, nb, [...captured, mid], [...path, landSq]);
    }
    if (!extended && captured.length > 0) {
      const promotion =
        piece.type === 'man' && rankOf(sq) === promoRank(piece.color) ? true : undefined;
      results.push({ from, to: sq, captures: captured, path, promotion });
    }
  };

  dfs(from, board, [], []);
  return results;
}

/** ¿Tiene ese color alguna captura disponible en el tablero? (regla de captura obligatoria) */
function colorHasCapture(board: Board, color: Color): boolean {
  for (let sq = 0; sq < board.length; sq++) {
    const p = board[sq];
    if (p && p.color === color && captureChains(board, sq).length > 0) return true;
  }
  return false;
}

function movesFrom(board: Board, from: SquareIndex): Move[] {
  const piece = board[from];
  if (!piece) return [];
  const captures = captureChains(board, from);
  // Captura obligatoria: si el bando puede capturar, solo se permiten capturas.
  if (colorHasCapture(board, piece.color)) return captures;
  return simpleMoves(board, from);
}

/** Presión de damas: suma de lo capturado, ×saltos si es cadena, +coronar. */
function scoreForMove(move: Move): MoveScore {
  const caps = capturesOf(move);
  let base = 0;
  const notes = [];
  for (const cap of caps) {
    const info = PIECES[cap.type as DamasPieceType];
    base += info.captureValue;
    notes.push({ source: `Captura: ${info.name}`, detail: `+${info.captureValue} base` });
  }
  if (move.promotion) {
    base += 6;
    notes.push({ source: 'Coronación', detail: '+6 base' });
  }
  let multTimes: number | undefined;
  if (caps.length >= 2) {
    multTimes = caps.length;
    notes.push({ source: `Cadena de ${caps.length}`, detail: `×${caps.length} mult` });
  }
  return { base, multTimes, notes };
}

/** Mueve la pieza, elimina TODAS las capturadas (por id) y corona si toca. */
function applyToBoard(board: Board, move: Move): Board {
  const next = defaultApplyToBoard(board, move);
  for (const cap of capturesOf(move)) {
    const idx = next.findIndex((p) => p?.id === cap.id);
    if (idx >= 0) next[idx] = null;
  }
  if (move.promotion) next[move.to] = { ...next[move.to]!, type: 'king' };
  return next;
}

/** Se gana el Duelo si el rival se queda sin piezas. */
function winsOnMove(boardAfter: Board, move: Move): boolean {
  const mover = boardAfter[move.to]?.color;
  if (!mover) return false;
  const enemy: Color = mover === 'white' ? 'black' : 'white';
  return !boardAfter.some((p) => p?.color === enemy);
}

export const DAMAS: GameDef = {
  id: 'damas',
  name: 'Damas',
  pieces: PIECES,
  defaults: { target: 18, turnLimit: 30 },
  hint:
    'Mueve en diagonal y captura saltando. La captura es obligatoria. Encadena ' +
    'saltos: cada salto extra multiplica tu Presión. Corona al llegar al fondo.',
  createInitialBoard,
  movesFrom,
  scoreForMove,
  applyToBoard,
  winsOnMove,
};
