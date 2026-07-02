import { Move, PieceType } from './types';

/**
 * Valor base ("fichas") por capturar cada tipo de pieza.
 * En el futuro los Planetas subirán estos valores por tipo.
 */
export const CAPTURE_VALUE: Record<PieceType, number> = {
  pawn: 1,
  knight: 3,
  bishop: 3,
  rook: 5,
  queen: 9,
  king: 0, // capturar al rey termina el Duelo; no puntúa como Presión.
};

// Casillas centrales d4, e4, d5, e5.
const CENTER = new Set<number>([27, 28, 35, 36]);

/**
 * Presión generada por una jugada = Base × Mult.
 * Hito 0: mult fijo en 1. Jokers, clases y poderes modificarán base y mult.
 */
export function pressureForMove(move: Move): number {
  let base = 0;
  if (move.captured) base += CAPTURE_VALUE[move.captured.type];
  if (move.promotion) base += 8;
  if (CENTER.has(move.to)) base += 1;

  const mult = 1;
  return base * mult;
}
