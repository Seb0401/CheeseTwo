// Tipos núcleo del motor. Deliberadamente simples y serializables:
// un DuelState debe poder guardarse/reproducirse (base para replays y PvP futuro).
//
// El núcleo NO conoce ningún juego concreto: las reglas de ajedrez, damas, etc.
// viven en `games/` como implementaciones de `GameDef`. Ver docs/09-otros-juegos.md.

export type Color = 'white' | 'black';

/** Id de tipo de pieza. Cada juego define los suyos ('pawn', 'man', 'token'…). */
export type PieceType = string;

export interface Piece {
  id: number;
  type: PieceType;
  color: Color;
}

/** Índice de casilla 0..N-1 = rank*ancho + file. rank 0 = fila de las blancas. */
export type SquareIndex = number;

export interface Move {
  from: SquareIndex;
  to: SquareIndex;
  /** Pieza capturada, si la hay. (Damas encadenará varias: se ampliará a lista.) */
  captured?: Piece;
  /** La pieza se transforma al llegar (peón corona, ficha de damas asciende). */
  promotion?: boolean;
}

/** Tablero denso. En el futuro se generalizará a un grafo de casillas (hex, 3D). */
export type Board = (Piece | null)[];

export type DuelStatus = 'playing' | 'won' | 'lost';

export interface DuelState {
  /** Juego al que pertenece este Duelo (id del GameDef). */
  gameId: string;
  board: Board;
  /** De quién es el turno. El jugador siempre es 'white' en el Hito 0. */
  turn: Color;
  /** Rondas completas usadas (una ronda = jugada del jugador + del rival). */
  turnsUsed: number;
  turnLimit: number;
  /** Presión acumulada por el jugador (blancas). El motor de puntaje. */
  pressure: number;
  /** Meta de Presión a alcanzar para ganar el Duelo. */
  target: number;
  status: DuelStatus;
}

/** Datos de un tipo de pieza — contenido dirigido por datos, no por código. */
export interface PieceInfo {
  name: string;
  /** Base de Presión que otorga capturarla. */
  captureValue: number;
  /** Pieza objetivo: capturarla gana el Duelo al instante para quien mueve. */
  objective?: boolean;
  /** Glifo con el que se dibuja (placeholder hasta tener arte). */
  glyph: Record<Color, string>;
}

/**
 * Definición de un juego jugable como Duelo del roguelike.
 * Añadir un juego = implementar esta interfaz (ver docs/09-otros-juegos.md);
 * el núcleo (duelo, Presión, IA, render) funciona sin cambios.
 */
export interface GameDef {
  id: string;
  name: string;
  /** Catálogo de piezas del juego. */
  pieces: Record<PieceType, PieceInfo>;
  /** Meta y límite de turnos por defecto de un Duelo suelto. */
  defaults: { target: number; turnLimit: number };
  /** Instrucción de una línea para el HUD. */
  hint: string;

  createInitialBoard(): Board;
  /** Movimientos pseudo-legales desde `from` (el núcleo filtra turno/estado). */
  movesFrom(board: Board, from: SquareIndex): Move[];
  /** Presión (Base × Mult) generada por una jugada. Mult fijo en 1 en el Hito 0. */
  pressureForMove(move: Move): number;
  /**
   * Aplica el movimiento devolviendo un tablero NUEVO. Opcional: si se omite,
   * el núcleo mueve la pieza tal cual (suficiente si no hay promociones ni
   * capturas fuera de la casilla destino).
   */
  applyToBoard?(board: Board, move: Move): Board;
  /**
   * Victoria inmediata adicional a capturar una pieza `objective` y a la meta
   * de Presión (ej. damas: dejar al rival sin fichas). Opcional.
   */
  winsOnMove?(boardAfter: Board, move: Move): boolean;
}
