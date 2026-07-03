import { fileOf, inBounds, rankOf, toIndex } from '../geometry';
import { defaultApplyToBoard } from '../duel';
import { Board, Color, GameDef, Move, PieceInfo, SquareIndex } from '../types';

// ─── Ajedrez: el primer juego de la plataforma ──────────────────────────────
// Reglas clásicas (pseudo-legales en el Hito 0: jaques/clavadas son un TODO).

export type ChessPieceType = 'pawn' | 'knight' | 'bishop' | 'rook' | 'queen' | 'king';

const PIECES: Record<ChessPieceType, PieceInfo> = {
  pawn: { name: 'Peón', captureValue: 1, glyph: { white: '♙', black: '♟' } },
  knight: { name: 'Caballo', captureValue: 3, glyph: { white: '♘', black: '♞' } },
  bishop: { name: 'Alfil', captureValue: 3, glyph: { white: '♗', black: '♝' } },
  rook: { name: 'Torre', captureValue: 5, glyph: { white: '♖', black: '♜' } },
  queen: { name: 'Dama', captureValue: 9, glyph: { white: '♕', black: '♛' } },
  // Capturar al rey termina el Duelo; no puntúa como Presión.
  king: { name: 'Rey', captureValue: 0, objective: true, glyph: { white: '♔', black: '♚' } },
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
  }
}

// Casillas centrales d4, e4, d5, e5.
const CENTER = new Set<number>([27, 28, 35, 36]);

/**
 * Presión generada por una jugada = Base × Mult.
 * Hito 0: mult fijo en 1. Jokers, clases y poderes modificarán base y mult.
 */
function pressureForMove(move: Move): number {
  let base = 0;
  if (move.captured) base += PIECES[move.captured.type as ChessPieceType].captureValue;
  if (move.promotion) base += 8;
  if (CENTER.has(move.to)) base += 1;

  const mult = 1;
  return base * mult;
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
  pressureForMove,
  applyToBoard,
};
