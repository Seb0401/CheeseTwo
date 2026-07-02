import { fileOf, inBounds, rankOf, toIndex } from './board';
import { Board, Color, Move, SquareIndex } from './types';

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
export function pseudoLegalMoves(board: Board, from: SquareIndex): Move[] {
  const piece = board[from];
  if (!piece) return [];
  switch (piece.type) {
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

/** Todos los movimientos pseudo-legales de un color. */
export function allMoves(board: Board, color: Color): Move[] {
  const moves: Move[] = [];
  for (let sq = 0; sq < board.length; sq++) {
    const piece = board[sq];
    if (piece && piece.color === color) moves.push(...pseudoLegalMoves(board, sq));
  }
  return moves;
}
