import { fileOf, rankOf } from './board';
import { allMoves } from './moves';
import { CAPTURE_VALUE } from './pressure';
import { Color, DuelState, Move } from './types';

/**
 * Rival del MVP: heurística voraz y DETERMINISTA (para replays/PvP futuro).
 * Prioriza capturar (sobre todo al rey), con leve preferencia por el centro.
 * Es el enfoque "encuentro diseñado"; la IA minimax vendrá en un módulo aparte.
 */
export function chooseAiMove(state: DuelState, color: Color): Move | null {
  const moves = allMoves(state.board, color);
  if (moves.length === 0) return null;

  let best: Move | null = null;
  let bestScore = -Infinity;

  moves.forEach((move, i) => {
    let score = 0;
    if (move.captured) {
      score += move.captured.type === 'king' ? 1000 : CAPTURE_VALUE[move.captured.type] * 10;
    }
    // Preferencia leve por acercarse al centro del tablero.
    const distToCenter = Math.abs(fileOf(move.to) - 3.5) + Math.abs(rankOf(move.to) - 3.5);
    score += (7 - distToCenter) * 0.1;
    // Desempate determinista por orden de generación.
    score -= i * 1e-6;

    if (score > bestScore) {
      bestScore = score;
      best = move;
    }
  });

  return best;
}
