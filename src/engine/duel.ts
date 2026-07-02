import { createInitialBoard } from './board';
import { pseudoLegalMoves } from './moves';
import { pressureForMove } from './pressure';
import { Board, Color, DuelState, DuelStatus, Move, SquareIndex } from './types';

export interface DuelConfig {
  target?: number;
  turnLimit?: number;
}

export function createDuel(config: DuelConfig = {}): DuelState {
  return {
    board: createInitialBoard(),
    turn: 'white',
    turnsUsed: 0,
    turnLimit: config.turnLimit ?? 24,
    pressure: 0,
    target: config.target ?? 25,
    status: 'playing',
  };
}

/** Aplica un movimiento devolviendo un tablero NUEVO (no muta el original). */
export function applyMoveToBoard(board: Board, move: Move): Board {
  const next = board.slice();
  const piece = next[move.from]!;
  next[move.to] = move.promotion ? { ...piece, type: 'queen' } : piece;
  next[move.from] = null;
  return next;
}

/** Movimientos jugables desde una casilla, respetando el turno y el estado. */
export function legalMovesFrom(state: DuelState, from: SquareIndex): Move[] {
  if (state.status !== 'playing') return [];
  const piece = state.board[from];
  if (!piece || piece.color !== state.turn) return [];
  return pseudoLegalMoves(state.board, from);
}

/**
 * Transición pura del Duelo: aplica el movimiento del jugador de turno,
 * actualiza la Presión y resuelve las condiciones de fin.
 * Determinista: mismo estado + mismo movimiento → mismo resultado.
 */
export function applyMove(state: DuelState, move: Move): DuelState {
  if (state.status !== 'playing') return state;

  const mover = state.turn;
  const board = applyMoveToBoard(state.board, move);

  let pressure = state.pressure;
  if (mover === 'white') pressure += pressureForMove(move);

  let status: DuelStatus = 'playing';

  // Capturar al rey termina el Duelo de inmediato.
  if (move.captured?.type === 'king') {
    status = mover === 'white' ? 'won' : 'lost';
  }
  // Alcanzar la meta de Presión gana el Duelo.
  if (status === 'playing' && pressure >= state.target) {
    status = 'won';
  }

  const nextTurn: Color = mover === 'white' ? 'black' : 'white';
  let turnsUsed = state.turnsUsed;

  // Una ronda se completa cuando las negras (rival) terminan de mover.
  if (mover === 'black') {
    turnsUsed += 1;
    if (status === 'playing' && turnsUsed >= state.turnLimit && pressure < state.target) {
      status = 'lost';
    }
  }

  return { ...state, board, turn: nextTurn, pressure, turnsUsed, status };
}
