// Catálogo de MODOS (juegos jugables como run) y EJÉRCITOS INICIALES.
// Contenido de UI dirigido por datos: la Preparación de Run y el Compendio
// se dibujan desde aquí. Ver docs/09 (juegos) y docs/10 (interfaz).

import { Board, CHESS, DAMAS, GameDef, toIndex } from '../engine';

export type ModeStatus = 'playable' | 'locked';

export interface ModeInfo {
  id: string;
  name: string;
  /** Glifo placeholder hasta tener arte. */
  icon: string;
  tagline: string;
  status: ModeStatus;
  /** GameDef si el modo ya es jugable. */
  game?: GameDef;
  /** Cómo se desbloquea (se muestra en la carta bloqueada). */
  unlockHint?: string;
}

export const MODES: ModeInfo[] = [
  {
    id: CHESS.id,
    name: CHESS.name,
    icon: '♞',
    tagline: 'Tu ejército evoluciona: clases, poderes y cartas.',
    status: 'playable',
    game: CHESS,
  },
  {
    id: DAMAS.id,
    name: DAMAS.name,
    icon: '⛃',
    tagline: 'Cadenas de captura como combos que disparan el mult.',
    status: 'playable',
    game: DAMAS,
  },
  {
    id: 'ludo',
    name: 'Ludo',
    icon: '🎲',
    tagline: 'Doma el azar con dados coleccionables.',
    status: 'locked',
    unlockHint: 'En diseño — llegará después de las Damas.',
  },
];

export interface ArmyInfo {
  id: string;
  name: string;
  icon: string;
  description: string;
  /** Id de desbloqueo; sin definir = disponible desde el inicio. Ver meta.ts. */
  unlockId?: string;
  /** Pista mostrada mientras está bloqueado. */
  unlockHint?: string;
  /** Si se define, el ejército solo aplica a ese modo. Sin definir = universal. */
  gameId?: string;
  /** Oro inicial extra que otorga (Mercader). */
  startingGoldBonus?: number;
  /** Transforma el tablero inicial del juego (solo el bando del jugador). */
  apply?: (board: Board) => Board;
}

/** Ejércitos que tienen sentido para un modo (los universales + los suyos). */
export function armiesForMode(modeId: string): ArmyInfo[] {
  return ARMIES.filter((a) => !a.gameId || a.gameId === modeId);
}

/** Cambia el tipo de una pieza blanca en una casilla (helper de `apply`). */
function swapWhite(board: Board, sq: number, type: string): void {
  const p = board[sq];
  if (p && p.color === 'white') board[sq] = { ...p, type };
}

/** Ejércitos iniciales ("barajas", ver docs/06). */
export const ARMIES: ArmyInfo[] = [
  {
    id: 'clasico',
    name: 'Clásico',
    icon: '♜',
    description: 'El set estándar. Balanceado, para aprender.',
  },
  {
    id: 'heretico',
    name: 'Herético',
    icon: '⚜',
    description:
      'Tu flanco de dama se corrompe: Canciller (torre+caballo), Saltamontes y Arzobispo (alfil+caballo) sustituyen a torre, caballo y alfil.',
    gameId: 'chess',
    apply: (board) => {
      const next = board.slice();
      swapWhite(next, toIndex(0, 0), 'chancellor'); // a1: torre → Canciller
      swapWhite(next, toIndex(1, 0), 'grasshopper'); // b1: caballo → Saltamontes
      swapWhite(next, toIndex(2, 0), 'archbishop'); // c1: alfil → Arzobispo
      return next;
    },
  },
  {
    id: 'enjambre',
    name: 'Enjambre',
    icon: '♟',
    description: 'Dama y torres se vuelven caballos: 5 caballos, sin piezas mayores.',
    gameId: 'chess',
    unlockId: 'enjambre',
    unlockHint: 'Gana tu primer run.',
    apply: (board) => {
      const next = board.slice();
      swapWhite(next, toIndex(0, 0), 'knight'); // a1: torre → Caballo
      swapWhite(next, toIndex(7, 0), 'knight'); // h1: torre → Caballo
      swapWhite(next, toIndex(3, 0), 'knight'); // d1: dama → Caballo
      return next;
    },
  },
  {
    id: 'realeza',
    name: 'Realeza',
    icon: '♛',
    description: 'Tu dama se vuelve Amazona (dama+caballo), pero pierdes ambos caballos. Alto riesgo.',
    gameId: 'chess',
    unlockId: 'realeza',
    unlockHint: 'Gana un run con el Enjambre.',
    apply: (board) => {
      const next = board.slice();
      swapWhite(next, toIndex(3, 0), 'amazon'); // d1: dama → Amazona
      next[toIndex(1, 0)] = null; // b1: sin caballo
      next[toIndex(6, 0)] = null; // g1: sin caballo
      return next;
    },
  },
  {
    id: 'mercader',
    name: 'Mercader',
    icon: '⛁',
    description: 'Ejército más débil (sin una torre y un alfil) pero +6 de oro inicial.',
    gameId: 'chess',
    unlockId: 'mercader',
    unlockHint: 'Gana un run con Realeza.',
    startingGoldBonus: 6,
    apply: (board) => {
      const next = board.slice();
      next[toIndex(0, 0)] = null; // a1: sin torre
      next[toIndex(2, 0)] = null; // c1: sin alfil
      return next;
    },
  },
];
