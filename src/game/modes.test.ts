import { describe, expect, it } from 'vitest';
import { CHESS, toIndex } from '../engine';
import { ARMIES } from './modes';

describe('ejército Herético', () => {
  const heretico = ARMIES.find((a) => a.id === 'heretico')!;

  it('sustituye el flanco de dama blanco por piezas heréticas', () => {
    const board = heretico.apply!(CHESS.createInitialBoard());
    expect(board[toIndex(0, 0)]?.type).toBe('chancellor');
    expect(board[toIndex(1, 0)]?.type).toBe('grasshopper');
    expect(board[toIndex(2, 0)]?.type).toBe('archbishop');
    // El bando negro queda intacto.
    expect(board[toIndex(0, 7)]?.type).toBe('rook');
    expect(board.filter(Boolean)).toHaveLength(32);
  });

  it('no muta el tablero original', () => {
    const original = CHESS.createInitialBoard();
    heretico.apply!(original);
    expect(original[toIndex(0, 0)]?.type).toBe('rook');
  });
});
