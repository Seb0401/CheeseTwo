import { describe, expect, it } from 'vitest';
import {
  applyMove,
  Board,
  CHESS,
  chooseAiMove,
  createDuel,
  GameDef,
  legalMovesFrom,
  toIndex,
} from './index';

describe('ajedrez: tablero inicial', () => {
  it('coloca 32 piezas', () => {
    const board = CHESS.createInitialBoard();
    expect(board.filter(Boolean).length).toBe(32);
  });
});

describe('ajedrez: generación de movimientos', () => {
  it('el caballo de b1 tiene 2 salidas iniciales', () => {
    const board = CHESS.createInitialBoard();
    const moves = CHESS.movesFrom(board, toIndex(1, 0));
    expect(moves).toHaveLength(2);
  });

  it('el peón de e2 puede avanzar una o dos casillas', () => {
    const board = CHESS.createInitialBoard();
    const tos = CHESS.movesFrom(board, toIndex(4, 1))
      .map((m) => m.to)
      .sort((a, b) => a - b);
    expect(tos).toEqual([toIndex(4, 2), toIndex(4, 3)].sort((a, b) => a - b));
  });
});

describe('ajedrez: presión', () => {
  it('capturar una torre da 5 de base', () => {
    const p = CHESS.pressureForMove({
      from: 0,
      to: 63,
      captured: { id: 1, type: 'rook', color: 'black' },
    });
    expect(p).toBe(5);
  });

  it('capturar en el centro suma bonus', () => {
    // Caballo (3) capturado en d4 (índice 27) => 3 + 1 = 4.
    const p = CHESS.pressureForMove({
      from: 0,
      to: 27,
      captured: { id: 1, type: 'knight', color: 'black' },
    });
    expect(p).toBe(4);
  });
});

describe('duelo (núcleo genérico, con ajedrez)', () => {
  it('gana al alcanzar la meta de presión', () => {
    let state = createDuel(CHESS, { target: 3, turnLimit: 10 });
    const move = {
      from: toIndex(0, 0),
      to: 27,
      captured: { id: 99, type: 'knight' as const, color: 'black' as const },
    };
    state = applyMove(CHESS, state, move);
    expect(state.status).toBe('won');
  });

  it('capturar la pieza objetivo (rey) gana al instante', () => {
    let state = createDuel(CHESS, { target: 999, turnLimit: 10 });
    const move = {
      from: toIndex(0, 0),
      to: toIndex(4, 7),
      captured: { id: 99, type: 'king' as const, color: 'black' as const },
    };
    state = applyMove(CHESS, state, move);
    expect(state.status).toBe('won');
  });

  it('la IA devuelve un movimiento válido en la posición inicial', () => {
    const state = createDuel(CHESS);
    const move = chooseAiMove(CHESS, state, 'black');
    expect(move).not.toBeNull();
  });

  it('un peón que corona se convierte en dama', () => {
    let state = createDuel(CHESS, { target: 999, turnLimit: 10 });
    const board: Board = new Array(64).fill(null);
    board[toIndex(0, 6)] = { id: 1, type: 'pawn', color: 'white' };
    board[toIndex(7, 0)] = { id: 2, type: 'king', color: 'white' };
    board[toIndex(7, 7)] = { id: 3, type: 'king', color: 'black' };
    state = { ...state, board };

    const move = legalMovesFrom(CHESS, state, toIndex(0, 6)).find((m) => m.promotion);
    expect(move).toBeDefined();
    state = applyMove(CHESS, state, move!);
    expect(state.board[move!.to]?.type).toBe('queen');
  });
});

// ─── Un juego de juguete demuestra que el núcleo es agnóstico al juego ───────
// Una sola pieza por bando que avanza un rank; capturar la ficha rival (objetivo) gana.
const TOY: GameDef = {
  id: 'toy',
  name: 'Juguete',
  pieces: {
    token: { name: 'Ficha', captureValue: 2, objective: true, glyph: { white: '●', black: '○' } },
  },
  defaults: { target: 10, turnLimit: 5 },
  hint: 'Avanza y captura.',
  createInitialBoard() {
    const board: Board = new Array(64).fill(null);
    board[toIndex(0, 0)] = { id: 1, type: 'token', color: 'white' };
    board[toIndex(0, 7)] = { id: 2, type: 'token', color: 'black' };
    return board;
  },
  movesFrom(board, from) {
    const piece = board[from]!;
    const to = from + (piece.color === 'white' ? 8 : -8);
    if (to < 0 || to >= 64) return [];
    const occupant = board[to];
    if (occupant?.color === piece.color) return [];
    return [{ from, to, captured: occupant ?? undefined }];
  },
  pressureForMove(move) {
    return move.captured ? 2 : 1;
  },
};

describe('duelo con otro GameDef (juguete)', () => {
  it('el núcleo corre el juego de juguete sin cambios', () => {
    let state = createDuel(TOY, { target: 3, turnLimit: 10 });
    // Blancas avanzan (1 de Presión), negras avanzan, blancas avanzan (2 acumulada)…
    for (let i = 0; i < 2; i++) {
      const white = legalMovesFrom(TOY, state, state.board.findIndex((p) => p?.color === 'white'));
      state = applyMove(TOY, state, white[0]);
      const black = chooseAiMove(TOY, state, 'black');
      state = applyMove(TOY, state, black!);
    }
    expect(state.pressure).toBe(2);
    expect(state.status).toBe('playing');
  });

  it('capturar la ficha objetivo del juguete gana el duelo', () => {
    let state = createDuel(TOY, { target: 999, turnLimit: 10 });
    const board: Board = new Array(64).fill(null);
    board[toIndex(0, 3)] = { id: 1, type: 'token', color: 'white' };
    board[toIndex(0, 4)] = { id: 2, type: 'token', color: 'black' };
    state = { ...state, board };

    const capture = legalMovesFrom(TOY, state, toIndex(0, 3))[0];
    expect(capture.captured).toBeDefined();
    state = applyMove(TOY, state, capture);
    expect(state.status).toBe('won');
  });
});
