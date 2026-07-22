import { GameDef } from '../types';
import { CHESS } from './chess';
import { DAMAS } from './damas';
import { TRIDCHESS } from './tridchess';

export { CHESS } from './chess';
export { DAMAS } from './damas';
export { TRIDCHESS } from './tridchess';

/** Registro de juegos disponibles. Añadir un juego = añadir su GameDef aquí. */
export const GAMES: Record<string, GameDef> = {
  [CHESS.id]: CHESS,
  [DAMAS.id]: DAMAS,
  [TRIDCHESS.id]: TRIDCHESS,
};
