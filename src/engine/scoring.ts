// Puntaje de una jugada: Presión = Base × Mult (el corazón estilo Balatro).
// El propio juego aporta base y mult (GameDef.scoreForMove: ej. cadenas de damas);
// los Estandartes equipados suman base, suman mult o multiplican el mult.
// Determinista y sin estado.

import { BANNERS } from './banners';
import { DuelState, GameDef, Move, ScoreBreakdown, ScoreNote } from './types';

/**
 * Puntúa la jugada del jugador con los Estandartes equipados en el estado.
 * Debe llamarse ANTES de aplicar el movimiento al tablero (los efectos
 * necesitan ver la pieza que mueve en su casilla de origen).
 *
 * Orden de cálculo: base = base del juego + Σ addBase;
 * mult = (1 + multAdd_juego + Σ addMult) × multTimes_juego × Π timesMult;
 * total = base × mult.
 */
export function scoreMove(game: GameDef, state: DuelState, move: Move): ScoreBreakdown {
  const gameScore = game.scoreForMove(move);
  let base = gameScore.base;
  let multAdd = gameScore.multAdd ?? 0;
  let multTimes = gameScore.multTimes ?? 1;
  const notes: ScoreNote[] = [...gameScore.notes];

  for (const id of state.banners) {
    const banner = BANNERS[id];
    if (!banner) continue;
    const bonus = banner.apply({ game, state, move });
    if (!bonus) continue;
    base += bonus.addBase ?? 0;
    multAdd += bonus.addMult ?? 0;
    multTimes *= bonus.timesMult ?? 1;
    notes.push({ source: `${banner.icon} ${banner.name}`, detail: bonus.detail });
  }

  const mult = (1 + multAdd) * multTimes;
  return { base, mult, total: base * mult, notes };
}
