import { Board, Color, DuelState, DuelStatus, GameDef, Move, SquareIndex } from './types';

export interface DuelConfig {
  target?: number;
  turnLimit?: number;
}

export function createDuel(game: GameDef, config: DuelConfig = {}): DuelState {
  return {
    gameId: game.id,
    board: game.createInitialBoard(),
    turn: 'white',
    turnsUsed: 0,
    turnLimit: config.turnLimit ?? game.defaults.turnLimit,
    pressure: 0,
    target: config.target ?? game.defaults.target,
    status: 'playing',
  };
}

/** Aplicación por defecto: mover la pieza, devolviendo un tablero NUEVO. */
export function defaultApplyToBoard(board: Board, move: Move): Board {
  const next = board.slice();
  next[move.to] = next[move.from];
  next[move.from] = null;
  return next;
}

/** Movimientos jugables desde una casilla, respetando el turno y el estado. */
export function legalMovesFrom(game: GameDef, state: DuelState, from: SquareIndex): Move[] {
  if (state.status !== 'playing') return [];
  const piece = state.board[from];
  if (!piece || piece.color !== state.turn) return [];
  return game.movesFrom(state.board, from);
}

/**
 * Transición pura del Duelo: aplica el movimiento del jugador de turno,
 * actualiza la Presión y resuelve las condiciones de fin.
 * Determinista: mismo estado + mismo movimiento → mismo resultado.
 */
export function applyMove(game: GameDef, state: DuelState, move: Move): DuelState {
  if (state.status !== 'playing') return state;

  const mover = state.turn;
  const board = (game.applyToBoard ?? defaultApplyToBoard)(state.board, move);

  let pressure = state.pressure;
  if (mover === 'white') pressure += game.pressureForMove(move);

  let status: DuelStatus = 'playing';

  // Victoria inmediata: capturar la pieza objetivo (rey) o la condición propia del juego.
  const capturedObjective = move.captured && game.pieces[move.captured.type]?.objective;
  if (capturedObjective || game.winsOnMove?.(board, move)) {
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
