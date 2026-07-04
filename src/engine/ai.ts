import { BOARD_SIZE, fileOf, rankOf } from './geometry';
import { capturesOf, Color, DuelState, GameDef, Move } from './types';

/**
 * Rival del MVP: heurística voraz y DETERMINISTA (para replays/PvP futuro),
 * genérica para cualquier GameDef: prioriza capturar (sobre todo la pieza
 * objetivo), con leve preferencia por el centro. Es el enfoque "encuentro
 * diseñado"; la IA minimax vendrá en un módulo aparte.
 */
export function chooseAiMove(game: GameDef, state: DuelState, color: Color): Move | null {
  const moves: Move[] = [];
  for (let sq = 0; sq < state.board.length; sq++) {
    const piece = state.board[sq];
    if (piece && piece.color === color) moves.push(...game.movesFrom(state.board, sq));
  }
  if (moves.length === 0) return null;

  const center = (BOARD_SIZE - 1) / 2;
  let best: Move | null = null;
  let bestScore = -Infinity;

  moves.forEach((move, i) => {
    let score = 0;
    // Suma el valor de todo lo capturado (una cadena de damas cuenta cada salto).
    for (const cap of capturesOf(move)) {
      const info = game.pieces[cap.type];
      score += info?.objective ? 1000 : (info?.captureValue ?? 0) * 10;
    }
    // Preferencia leve por acercarse al centro del tablero.
    const distToCenter = Math.abs(fileOf(move.to) - center) + Math.abs(rankOf(move.to) - center);
    score += (BOARD_SIZE - 1 - distToCenter) * 0.1;
    // Desempate determinista por orden de generación.
    score -= i * 1e-6;

    if (score > bestScore) {
      bestScore = score;
      best = move;
    }
  });

  return best;
}
