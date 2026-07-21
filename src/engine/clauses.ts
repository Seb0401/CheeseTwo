// Cláusulas de Jefe: reglas que ESTORBAN al jugador durante el Duelo del Jefe.
// Son el momento "adáptate" del roguelike (ver docs/02). Data-driven como los
// Estandartes: cada cláusula engancha uno de tres puntos del motor —
//  · adjustScore: modifica el puntaje de la jugada del jugador (scoring.ts)
//  · filterMoves: restringe sus movimientos legales (duel.ts)
//  · setupBoard: transforma el tablero al crear el Duelo (run.ts)

import { fileOf, rankOf } from './geometry';
import { Board, DuelState, Move, ScoreNote, SquareIndex } from './types';

/**
 * Componentes del puntaje de una jugada, separando lo que aporta el JUEGO de lo
 * que aportan los ESTANDARTES, para que una cláusula pueda atacar cada parte.
 * `scoring.ts` los rellena y una cláusula los muta in situ.
 */
export interface ScoreParts {
  gameBase: number;
  gameMultAdd: number;
  gameMultTimes: number;
  bannerBase: number;
  bannerMultAdd: number;
  bannerMultTimes: number;
  notes: ScoreNote[];
  /** Tipo de la pieza que mueve (para cláusulas dependientes de la pieza). */
  pieceType?: string;
}

export interface Clause {
  id: string;
  name: string;
  icon: string;
  description: string;
  /** Si se define, la cláusula solo aparece en runs de ese juego. */
  gameId?: string;
  adjustScore?(parts: ScoreParts): void;
  filterMoves?(state: DuelState, from: SquareIndex, moves: Move[]): Move[];
  setupBoard?(board: Board): Board;
}

export const CLAUSES: Record<string, Clause> = {
  'ley-marcial': {
    id: 'ley-marcial',
    name: 'Ley marcial',
    icon: '⚖️',
    description: 'Tus peones no generan Presión. Puntúa con las piezas mayores.',
    gameId: 'chess',
    adjustScore: (p) => {
      if (p.pieceType !== 'pawn') return;
      p.gameBase = 0;
      p.bannerBase = 0;
      p.gameMultAdd = 0;
      p.bannerMultAdd = 0;
      p.gameMultTimes = 1;
      p.bannerMultTimes = 1;
      p.notes.push({ source: '⚖️ Ley marcial', detail: 'peón: 0' });
    },
  },
  'maldicion-arcana': {
    id: 'maldicion-arcana',
    name: 'Maldición arcana',
    icon: '🔮',
    description: 'Tus Estandartes rinden la mitad (su base y mult extra se reducen).',
    adjustScore: (p) => {
      const active = p.bannerBase > 0 || p.bannerMultAdd > 0 || p.bannerMultTimes > 1;
      p.bannerBase = Math.floor(p.bannerBase / 2);
      p.bannerMultAdd = p.bannerMultAdd / 2;
      p.bannerMultTimes = 1 + (p.bannerMultTimes - 1) / 2;
      if (active) p.notes.push({ source: '🔮 Maldición', detail: 'Estandartes ½' });
    },
  },
  gravedad: {
    id: 'gravedad',
    name: 'Gravedad',
    icon: '🕳️',
    description: 'No puedes mover la misma pieza dos turnos seguidos.',
    filterMoves: (state, from, moves) => (from === state.lastPlayerTo ? [] : moves),
  },
  fortaleza: {
    id: 'fortaleza',
    name: 'Fortaleza',
    icon: '🏰',
    description: 'El Jefe empieza con 2 torres extra protegiendo a su rey.',
    gameId: 'chess',
    setupBoard: (board) => {
      const kingSq = board.findIndex((p) => p?.color === 'black' && p.type === 'king');
      if (kingSq < 0) return board;
      const kf = fileOf(kingSq);
      const kr = rankOf(kingSq);
      // Las 2 casillas VACÍAS más cercanas al rey (en un tablero lleno, las de
      // delante); así siempre coloca las torres aunque el rey esté rodeado.
      const empties = board
        .map((p, sq) => (p ? -1 : sq))
        .filter((sq) => sq >= 0)
        .sort(
          (a, b) =>
            Math.abs(fileOf(a) - kf) +
            Math.abs(rankOf(a) - kr) -
            (Math.abs(fileOf(b) - kf) + Math.abs(rankOf(b) - kr)),
        );
      const next = board.slice();
      let id = 2000;
      for (const sq of empties.slice(0, 2)) next[sq] = { id: id++, type: 'rook', color: 'black' };
      return next;
    },
  },
};

/** Cláusulas aplicables a un juego (universales + las suyas). */
export function clausesForGame(gameId: string): Clause[] {
  return Object.values(CLAUSES).filter((c) => !c.gameId || c.gameId === gameId);
}
