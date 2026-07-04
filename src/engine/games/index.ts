import { GameDef } from '../types';
import { CHESS } from './chess';
import { DAMAS } from './damas';

export { CHESS } from './chess';
export { DAMAS } from './damas';

/** Registro de juegos disponibles. Añadir un juego = añadir su GameDef aquí. */
export const GAMES: Record<string, GameDef> = {
  [CHESS.id]: CHESS,
  [DAMAS.id]: DAMAS,
};
