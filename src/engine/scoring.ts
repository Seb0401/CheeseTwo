// Puntaje de una jugada: Presión = Base × Mult (el corazón estilo Balatro).
// El propio juego aporta base y mult (GameDef.scoreForMove: ej. cadenas de damas);
// los Estandartes equipados suman/multiplican encima; y una Cláusula de Jefe
// puede recortar cualquiera de esas partes. Determinista y sin estado.

import { BANNERS } from './banners';
import { CLAUSES, ScoreParts } from './clauses';
import { DuelState, GameDef, Move, ScoreBreakdown } from './types';

/**
 * Puntúa la jugada del jugador con los Estandartes equipados y la Cláusula activa.
 * Debe llamarse ANTES de aplicar el movimiento al tablero (los efectos
 * necesitan ver la pieza que mueve en su casilla de origen).
 *
 * base  = gameBase + bannerBase
 * mult  = (1 + gameMultAdd + bannerMultAdd) × gameMultTimes × bannerMultTimes
 * total = ⌊base × mult⌋
 */
export function scoreMove(game: GameDef, state: DuelState, move: Move): ScoreBreakdown {
  const g = game.scoreForMove(move);
  const parts: ScoreParts = {
    gameBase: g.base,
    gameMultAdd: g.multAdd ?? 0,
    gameMultTimes: g.multTimes ?? 1,
    bannerBase: 0,
    bannerMultAdd: 0,
    bannerMultTimes: 1,
    notes: [...g.notes],
    pieceType: state.board[move.from]?.type,
  };

  for (const id of state.banners) {
    const banner = BANNERS[id];
    if (!banner) continue;
    const bonus = banner.apply({ game, state, move });
    if (!bonus) continue;
    parts.bannerBase += bonus.addBase ?? 0;
    parts.bannerMultAdd += bonus.addMult ?? 0;
    parts.bannerMultTimes *= bonus.timesMult ?? 1;
    parts.notes.push({ source: `${banner.icon} ${banner.name}`, detail: bonus.detail });
  }

  if (state.clause) CLAUSES[state.clause]?.adjustScore?.(parts);

  const base = parts.gameBase + parts.bannerBase;
  const mult =
    (1 + parts.gameMultAdd + parts.bannerMultAdd) * parts.gameMultTimes * parts.bannerMultTimes;
  return { base, mult, total: Math.floor(base * mult), notes: parts.notes };
}
