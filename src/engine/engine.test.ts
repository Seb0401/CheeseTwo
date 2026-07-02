import { describe, expect, it } from 'vitest';
import {
  applyMove,
  chooseAiMove,
  createDuel,
  createInitialBoard,
  pressureForMove,
  pseudoLegalMoves,
  toIndex,
} from './index';

describe('tablero inicial', () => {
  it('coloca 32 piezas', () => {
    const board = createInitialBoard();
    expect(board.filter(Boolean).length).toBe(32);
  });
});

describe('generación de movimientos', () => {
  it('el caballo de b1 tiene 2 salidas iniciales', () => {
    const board = createInitialBoard();
    const moves = pseudoLegalMoves(board, toIndex(1, 0));
    expect(moves).toHaveLength(2);
  });

  it('el peón de e2 puede avanzar una o dos casillas', () => {
    const board = createInitialBoard();
    const tos = pseudoLegalMoves(board, toIndex(4, 1))
      .map((m) => m.to)
      .sort((a, b) => a - b);
    expect(tos).toEqual([toIndex(4, 2), toIndex(4, 3)].sort((a, b) => a - b));
  });
});

describe('presión', () => {
  it('capturar una torre da 5 de base', () => {
    const p = pressureForMove({
      from: 0,
      to: 63,
      captured: { id: 1, type: 'rook', color: 'black' },
    });
    expect(p).toBe(5);
  });

  it('capturar en el centro suma bonus', () => {
    // Caballo (3) capturado en d4 (índice 27) => 3 + 1 = 4.
    const p = pressureForMove({
      from: 0,
      to: 27,
      captured: { id: 1, type: 'knight', color: 'black' },
    });
    expect(p).toBe(4);
  });
});

describe('duelo', () => {
  it('gana al alcanzar la meta de presión', () => {
    let state = createDuel({ target: 3, turnLimit: 10 });
    const move = {
      from: toIndex(0, 0),
      to: 27,
      captured: { id: 99, type: 'knight' as const, color: 'black' as const },
    };
    state = applyMove(state, move);
    expect(state.status).toBe('won');
  });

  it('la IA devuelve un movimiento válido en la posición inicial', () => {
    const state = createDuel();
    const move = chooseAiMove(state, 'black');
    expect(move).not.toBeNull();
  });
});
