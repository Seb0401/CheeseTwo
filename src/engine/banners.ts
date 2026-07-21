// Estandartes (las cartas tipo "joker", ver glosario). Contenido data-driven:
// cada uno reacciona a la jugada del jugador y aporta bonus de base/mult.
// Nota Hito 0: los efectos asumen que el jugador es 'white' (abajo del tablero).

import { fileOf, rankOf } from './geometry';
import { capturesOf, DuelState, GameDef, Move, PieceType } from './types';

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

/** Tipos de pieza heréticos (no clásicos), para sinergias. */
const HERETIC_TYPES = new Set<PieceType>([
  'chancellor',
  'archbishop',
  'grasshopper',
  'camel',
  'cannon',
  'amazon',
  'berolina',
]);

/** Cuenta las piezas del jugador (blancas) de un tipo dado. */
const countOwn = (ctx: BannerCtx, type: PieceType): number =>
  ctx.state.board.filter((p) => p?.color === 'white' && p.type === type).length;

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
  herejia: {
    id: 'herejia',
    name: 'Herejía',
    icon: '⛧',
    description: '+2 mult a las capturas hechas con una pieza herética.',
    gameId: 'chess',
    apply: (ctx) => {
      const t = moverType(ctx);
      return ctx.move.captured && t && HERETIC_TYPES.has(t) ? { addMult: 2, detail: '+2 mult' } : null;
    },
  },
  eslabon: {
    id: 'eslabon',
    name: 'Eslabón',
    icon: '⛓️',
    description: '+1 mult por cada salto extra de una cadena (además del ×saltos de las damas).',
    gameId: 'damas',
    apply: (ctx) => {
      const jumps = capturesOf(ctx.move).length;
      return jumps >= 2 ? { addMult: jumps - 1, detail: `+${jumps - 1} mult` } : null;
    },
  },
  'reina-roja': {
    id: 'reina-roja',
    name: 'Reina Roja',
    icon: '👹',
    description: '×2 mult a las capturas de la Dama o la Amazona.',
    gameId: 'chess',
    apply: (ctx) => {
      const t = moverType(ctx);
      return ctx.move.captured && (t === 'queen' || t === 'amazon')
        ? { timesMult: 2, detail: '×2 mult' }
        : null;
    },
  },
  coleccionista: {
    id: 'coleccionista',
    name: 'Coleccionista',
    icon: '🎴',
    description: '+1 base por cada tipo de pieza distinto en tu ejército (en tus capturas).',
    apply: (ctx) => {
      if (!ctx.move.captured) return null;
      const types = new Set<PieceType>();
      for (const p of ctx.state.board) if (p?.color === 'white') types.add(p.type);
      return { addBase: types.size, detail: `+${types.size} base` };
    },
  },
  enjambre: {
    id: 'enjambre',
    name: 'Enjambre',
    icon: '🐝',
    description: '+2 mult a una captura si tienes 3+ piezas de ese mismo tipo.',
    apply: (ctx) => {
      const t = moverType(ctx);
      return ctx.move.captured && t && countOwn(ctx, t) >= 3 ? { addMult: 2, detail: '+2 mult' } : null;
    },
  },
};

/** Estandartes que pueden aparecer para un juego dado (universales + propios). */
export function bannersForGame(gameId: string): Banner[] {
  return Object.values(BANNERS).filter((b) => !b.gameId || b.gameId === gameId);
}
