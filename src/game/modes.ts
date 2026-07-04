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
  status: 'playable' | 'locked';
  unlockHint?: string;
  /** Si se define, el ejército solo aplica a ese modo. Sin definir = universal. */
  gameId?: string;
  /** Transforma el tablero inicial del juego (solo el bando del jugador). */
  apply?: (board: Board) => Board;
}

/** Ejércitos que tienen sentido para un modo (los universales + los suyos). */
export function armiesForMode(modeId: string): ArmyInfo[] {
  return ARMIES.filter((a) => !a.gameId || a.gameId === modeId);
}

/** Ejércitos iniciales ("barajas", ver docs/06). */
export const ARMIES: ArmyInfo[] = [
  {
    id: 'clasico',
    name: 'Clásico',
    icon: '♜',
    description: 'El set estándar. Balanceado, para aprender.',
    status: 'playable',
  },
  {
    id: 'heretico',
    name: 'Herético',
    icon: '⚜',
    description:
      'Tu flanco de dama se corrompe: Canciller (torre+caballo), Saltamontes y Arzobispo (alfil+caballo) sustituyen a torre, caballo y alfil.',
    status: 'playable',
    gameId: 'chess',
    apply: (board) => {
      const next = board.slice();
      const swap = (sq: number, type: string) => {
        const piece = next[sq];
        if (piece && piece.color === 'white') next[sq] = { ...piece, type };
      };
      swap(toIndex(0, 0), 'chancellor'); // a1: torre → Canciller
      swap(toIndex(1, 0), 'grasshopper'); // b1: caballo → Saltamontes
      swap(toIndex(2, 0), 'archbishop'); // c1: alfil → Arzobispo
      return next;
    },
  },
  {
    id: 'enjambre',
    name: 'Enjambre',
    icon: '♟',
    description: 'Menos piezas mayores, más peones y caballos.',
    status: 'locked',
    unlockHint: 'Gana tu primer run.',
  },
  {
    id: 'realeza',
    name: 'Realeza',
    icon: '♛',
    description: 'Dama mejorada pero pocas piezas. Alto riesgo.',
    status: 'locked',
    unlockHint: 'Gana un run con el Enjambre.',
  },
  {
    id: 'mercader',
    name: 'Mercader',
    icon: '⛁',
    description: 'Más oro inicial, ejército débil. Build económica.',
    status: 'locked',
    unlockHint: 'Acumula 100 de oro en un run.',
  },
];
