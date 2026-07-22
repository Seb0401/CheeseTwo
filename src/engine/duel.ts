import { CLAUSES } from './clauses';
import { scoreMove } from './scoring';
import {
  Board,
  capturesOf,
  Color,
  DuelState,
  DuelStatus,
  GameDef,
  Move,
  SquareIndex,
} from './types';

export interface DuelConfig {
  target?: number;
  turnLimit?: number;
  /** Estandartes equipados por el jugador. */
  banners?: string[];
  /** Tablero inicial alternativo (ejércitos iniciales lo modifican). */
  board?: Board;
  /** Cláusulas de Jefe activas (ids). */
  clauses?: string[];
}

export function createDuel(game: GameDef, config: DuelConfig = {}): DuelState {
  return {
    gameId: game.id,
    board: config.board ?? game.createInitialBoard(),
    turn: 'white',
    turnsUsed: 0,
    turnLimit: config.turnLimit ?? game.defaults.turnLimit,
    pressure: 0,
    target: config.target ?? game.defaults.target,
    status: 'playing',
    banners: config.banners ?? [],
    lastScore: null,
    clauses: config.clauses ?? [],
  };
}

/** Aplicación por defecto: mover la pieza, devolviendo un tablero NUEVO. */
export function defaultApplyToBoard(board: Board, move: Move): Board {
  const next = board.slice();
  next[move.to] = next[move.from];
  next[move.from] = null;
  return next;
}

/** Movimientos jugables desde una casilla, respetando el turno, el estado y la cláusula. */
export function legalMovesFrom(game: GameDef, state: DuelState, from: SquareIndex): Move[] {
  if (state.status !== 'playing') return [];
  const piece = state.board[from];
  if (!piece || piece.color !== state.turn) return [];
  let moves = game.movesFrom(state.board, from);
  // Las cláusulas solo estorban al jugador (blancas), no al rival.
  if (piece.color === 'white') {
    for (const id of state.clauses ?? []) {
      moves = CLAUSES[id]?.filterMoves?.(state, from, moves) ?? moves;
    }
  }
  return moves;
}

/**
 * Transición pura del Duelo: aplica el movimiento del jugador de turno,
 * actualiza la Presión y resuelve las condiciones de fin.
 * Determinista: mismo estado + mismo movimiento → mismo resultado.
 */
export function applyMove(game: GameDef, state: DuelState, move: Move): DuelState {
  if (state.status !== 'playing') return state;

  const mover = state.turn;

  // Puntuar ANTES de aplicar al tablero (los efectos ven la pieza en su origen).
  let pressure = state.pressure;
  let lastScore = state.lastScore;
  let lastPlayerTo = state.lastPlayerTo;
  if (mover === 'white') {
    const score = scoreMove(game, state, move);
    pressure += score.total;
    lastScore = score;
    lastPlayerTo = move.to; // para la cláusula Gravedad
  }

  const board = (game.applyToBoard ?? defaultApplyToBoard)(state.board, move);

  let status: DuelStatus = 'playing';

  // Victoria inmediata: capturar la pieza objetivo (rey) o la condición propia del juego.
  const capturedObjective = capturesOf(move).some((c) => game.pieces[c.type]?.objective);
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

  return { ...state, board, turn: nextTurn, pressure, turnsUsed, status, lastScore, lastPlayerTo };
}
