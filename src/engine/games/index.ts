import { GameDef } from '../types';
import { CHESS } from './chess';

export { CHESS } from './chess';

/** Registro de juegos disponibles. Añadir un juego = añadir su GameDef aquí. */
export const GAMES: Record<string, GameDef> = {
  [CHESS.id]: CHESS,
};
