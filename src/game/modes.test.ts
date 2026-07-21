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

describe('ejércitos desbloqueables', () => {
  const army = (id: string) => ARMIES.find((a) => a.id === id)!;

  it('Enjambre convierte dama y torres en caballos (5 caballos)', () => {
    const board = army('enjambre').apply!(CHESS.createInitialBoard());
    const knights = board.filter((p) => p?.color === 'white' && p.type === 'knight').length;
    expect(knights).toBe(5);
    expect(board.some((p) => p?.color === 'white' && p.type === 'queen')).toBe(false);
  });

  it('Realeza sube la dama a Amazona y quita ambos caballos', () => {
    const board = army('realeza').apply!(CHESS.createInitialBoard());
    expect(board[toIndex(3, 0)]?.type).toBe('amazon');
    expect(board.filter((p) => p?.color === 'white' && p.type === 'knight')).toHaveLength(0);
  });

  it('Mercader debilita el ejército y da oro extra', () => {
    const merc = army('mercader');
    const board = merc.apply!(CHESS.createInitialBoard());
    expect(board[toIndex(0, 0)]).toBeNull();
    expect(board[toIndex(2, 0)]).toBeNull();
    expect(merc.startingGoldBonus).toBeGreaterThan(0);
  });

  it('los ejércitos desbloqueables tienen unlockId y pista', () => {
    for (const id of ['enjambre', 'realeza', 'mercader']) {
      expect(army(id).unlockId).toBeDefined();
      expect(army(id).unlockHint).toBeTruthy();
    }
  });
});
