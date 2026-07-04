// Estandartes (las cartas tipo "joker", ver glosario). Contenido data-driven:
// cada uno reacciona a la jugada del jugador y aporta bonus de base/mult.
// Nota Hito 0: los efectos asumen que el jugador es 'white' (abajo del tablero).

import { fileOf, rankOf } from './geometry';
import { DuelState, GameDef, Move, PieceType } from './types';

/** Contexto que ve un Estandarte al puntuar una jugada (ANTES de aplicarla al tablero). */
export interface BannerCtx {
  game: GameDef;
  state: DuelState;
  move: Move;
}

/** Bonus que aporta un Estandarte a una jugada. `detail` se muestra en el HUD. */
export interface BannerBonus {
  addBase?: number;
  addMult?: number;
  timesMult?: number;
  detail: string;
}

export interface Banner {
  id: string;
  name: string;
  icon: string;
  description: string;
  /** Juego al que pertenece; sin definir = universal (vale en todos los modos). */
  gameId?: string;
  /** Devuelve el bonus si el Estandarte aplica a esta jugada, o null. */
  apply(ctx: BannerCtx): BannerBonus | null;
}

const moverType = (ctx: BannerCtx): PieceType | undefined => ctx.state.board[ctx.move.from]?.type;

/** Casillas centrales de un tablero 8×8 (d4/e4/d5/e5), por geometría. */
const inCenter = (sq: number): boolean => {
  const f = fileOf(sq);
  const r = rankOf(sq);
  return (f === 3 || f === 4) && (r === 3 || r === 4);
};

export const BANNERS: Record<string, Banner> = {
  cazador: {
    id: 'cazador',
    name: 'Cazador',
    icon: '🏹',
    description: '+2 mult a las capturas hechas con un caballo.',
    gameId: 'chess',
    apply: (ctx) =>
      ctx.move.captured && moverType(ctx) === 'knight' ? { addMult: 2, detail: '+2 mult' } : null,
  },
  turba: {
    id: 'turba',
    name: 'La Turba',
    icon: '🔥',
    description: '+3 mult a las capturas hechas con un peón.',
    gameId: 'chess',
    apply: (ctx) =>
      ctx.move.captured && moverType(ctx) === 'pawn' ? { addMult: 3, detail: '+3 mult' } : null,
  },
  verdugo: {
    id: 'verdugo',
    name: 'Verdugo',
    icon: '🪓',
    description: '×2 mult si capturas en territorio enemigo (la mitad rival del tablero).',
    apply: (ctx) =>
      ctx.move.captured && rankOf(ctx.move.to) >= 4 ? { timesMult: 2, detail: '×2 mult' } : null,
  },
  coronista: {
    id: 'coronista',
    name: 'El Coronista',
    icon: '👑',
    description: '+3 mult a la jugada que corona una pieza.',
    apply: (ctx) => (ctx.move.promotion ? { addMult: 3, detail: '+3 mult' } : null),
  },
  cartografo: {
    id: 'cartografo',
    name: 'Cartógrafo',
    icon: '🗺️',
    description: '+2 base si la jugada termina en una casilla central.',
    apply: (ctx) => (inCenter(ctx.move.to) ? { addBase: 2, detail: '+2 base' } : null),
  },
  monje: {
    id: 'monje',
    name: 'El Monje',
    icon: '🕯️',
    description: '+1 base a cada jugada tuya sin captura. La paciencia también presiona.',
    apply: (ctx) => (!ctx.move.captured ? { addBase: 1, detail: '+1 base' } : null),
  },
};

/** Estandartes que pueden aparecer para un juego dado (universales + propios). */
export function bannersForGame(gameId: string): Banner[] {
  return Object.values(BANNERS).filter((b) => !b.gameId || b.gameId === gameId);
}
