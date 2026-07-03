import { SquareIndex } from './types';

// Geometría del tablero denso 8×8. Siguiente paso del roadmap: convertir esto
// en un grafo de casillas parametrizado (tableros grandes, formas raras, hex).
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
