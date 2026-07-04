// Estado y lógica de un RUN: una secuencia de Duelos con Tienda entre medias.
// Todo aquí es lógica PURA y determinista (el azar entra por un Rng con semilla),
// para que sea testeable y, en el futuro, reproducible. La UI vive en RunScreen.
// Ver docs/02 (estructura de run) y docs/10 (interfaz).

import {
  Banner,
  bannersForGame,
  Board,
  Color,
  GameDef,
  PieceType,
  pickN,
  Rng,
  SquareIndex,
} from '../engine';
import { castaOf } from './castas';

export interface RosterEntry {
  square: SquareIndex;
  type: PieceType;
}

export type DuelKind = 'menor' | 'mayor' | 'jefe';

export interface DuelPlan {
  kind: DuelKind;
  label: string;
  /** Meta de Presión del Duelo. */
  target: number;
  turnLimit: number;
  /** Cuántas piezas rivales retirar (dificultad: más = más fácil). */
  enemyDrop: number;
}

/** Los tres Duelos de un run (dificultad ascendente). Ver docs/02. */
export const RUN_PLANS: DuelPlan[] = [
  { kind: 'menor', label: 'Rival Menor', target: 16, turnLimit: 22, enemyDrop: 6 },
  { kind: 'mayor', label: 'Rival Mayor', target: 28, turnLimit: 24, enemyDrop: 2 },
  { kind: 'jefe', label: 'JEFE', target: 44, turnLimit: 26, enemyDrop: 0 },
];

export interface RunState {
  gameId: string;
  /** El ejército del jugador, que persiste y se forja a lo largo del run. */
  roster: RosterEntry[];
  gold: number;
  banners: string[];
  /** Índice del Duelo actual dentro de RUN_PLANS. */
  duelIndex: number;
  /** Máximo de Estandartes equipables a la vez. */
  bannerSlots: number;
}

const STARTING_GOLD = 6;
export const BANNER_COST = 5;
export const REROLL_COST = 1;

export function rosterFromBoard(board: Board, color: Color): RosterEntry[] {
  const out: RosterEntry[] = [];
  board.forEach((p, sq) => {
    if (p && p.color === color) out.push({ square: sq, type: p.type });
  });
  return out;
}

export function createRun(game: GameDef, board: Board): RunState {
  return {
    gameId: game.id,
    roster: rosterFromBoard(board, 'white'),
    gold: STARTING_GOLD,
    banners: [],
    duelIndex: 0,
    bannerSlots: 3,
  };
}

/** Piezas (tipos) únicas del roster — para descubrir en el Compendio. */
export function rosterTypes(run: RunState): PieceType[] {
  return [...new Set(run.roster.map((e) => e.type))];
}

/**
 * Construye el tablero de un Duelo: las piezas del jugador vienen del roster;
 * el rival es el bando negro estándar del juego, al que se le retiran
 * `enemyDrop` piezas (nunca la pieza objetivo) para escalar la dificultad.
 */
export function buildDuelBoard(
  game: GameDef,
  roster: RosterEntry[],
  plan: DuelPlan,
  rng: Rng,
): Board {
  const std = game.createInitialBoard();
  const board: Board = new Array(std.length).fill(null);
  let id = 1;
  for (const e of roster) board[e.square] = { id: id++, type: e.type, color: 'white' };

  const objectiveType = Object.entries(game.pieces).find(([, i]) => i.objective)?.[0];
  const blackSquares: SquareIndex[] = [];
  std.forEach((p, sq) => {
    if (p && p.color === 'black') blackSquares.push(sq);
  });
  const droppable = blackSquares.filter((sq) => std[sq]!.type !== objectiveType);
  const dropped = new Set(pickN(droppable, Math.min(plan.enemyDrop, droppable.length), rng));

  let bid = 1000;
  for (const sq of blackSquares) {
    if (dropped.has(sq)) continue;
    board[sq] = { id: bid++, type: std[sq]!.type, color: 'black' };
  }
  return board;
}

/** Oro ganado por vencer un Duelo: base + bonus por superar la meta + extra de Jefe. */
export function duelReward(plan: DuelPlan, pressure: number): number {
  const overflow = Math.max(0, pressure - plan.target);
  return 3 + Math.floor(overflow / 8) + (plan.kind === 'jefe' ? 3 : 0);
}

// ─── Forja (cambiar una pieza por otra de su misma casta) ────────────────────

/** Tipos a los que se puede forjar una pieza: misma casta, distinto tipo. */
export function forgeOptions(game: GameDef, type: PieceType): PieceType[] {
  const casta = game.pieces[type]?.casta;
  if (!casta) return [];
  return Object.entries(game.pieces)
    .filter(([t, info]) => info.casta === casta && t !== type)
    .map(([t]) => t);
}

export function forgeCost(game: GameDef, type: PieceType): number {
  return castaOf(game.pieces[type]?.casta)?.forgeCost ?? Infinity;
}

/** Cambia la pieza del roster en `index` por `newType` (asume misma casta ya validada). */
export function forgePiece(run: RunState, index: number, newType: PieceType): RunState {
  const roster = run.roster.map((e, i) => (i === index ? { ...e, type: newType } : e));
  return { ...run, roster };
}

// ─── Oferta de Estandartes de la tienda ──────────────────────────────────────

/** Estandartes ofrecidos: los del juego que el jugador aún no tiene, barajados. */
export function bannerOffer(run: RunState, rng: Rng, n = 2): Banner[] {
  const pool = bannersForGame(run.gameId).filter((b) => !run.banners.includes(b.id));
  return pickN(pool, n, rng);
}

export function canBuyBanner(run: RunState): boolean {
  return run.gold >= BANNER_COST && run.banners.length < run.bannerSlots;
}
