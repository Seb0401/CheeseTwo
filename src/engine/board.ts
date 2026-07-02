import { Board, Color, PieceType, SquareIndex } from './types';

export const BOARD_SIZE = 8;

export function fileOf(sq: SquareIndex): number {
  return sq % BOARD_SIZE;
}

export function rankOf(sq: SquareIndex): number {
  return Math.floor(sq / BOARD_SIZE);
}

export function toIndex(file: number, rank: number): SquareIndex {
  return rank * BOARD_SIZE + file;
}

export function inBounds(file: number, rank: number): boolean {
  return file >= 0 && file < BOARD_SIZE && rank >= 0 && rank < BOARD_SIZE;
}

const BACK_RANK: PieceType[] = [
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
export function createInitialBoard(): Board {
  const board: Board = new Array(BOARD_SIZE * BOARD_SIZE).fill(null);
  let id = 1;
  const make = (type: PieceType, color: Color) => ({ id: id++, type, color });

  for (let f = 0; f < BOARD_SIZE; f++) {
    board[toIndex(f, 0)] = make(BACK_RANK[f], 'white');
    board[toIndex(f, 1)] = make('pawn', 'white');
    board[toIndex(f, 6)] = make('pawn', 'black');
    board[toIndex(f, 7)] = make(BACK_RANK[f], 'black');
  }
  return board;
}
