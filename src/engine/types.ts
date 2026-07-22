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
  /** Pieza capturada en una captura simple (ajedrez). Para cadenas, usar `captures`. */
  captured?: Piece;
  /** Piezas capturadas por una jugada de captura múltiple (cadena de damas). */
  captures?: Piece[];
  /** Casillas intermedias por las que pasa una cadena (para animar/depurar). */
  path?: SquareIndex[];
  /** La pieza se transforma al llegar (peón corona, ficha de damas asciende). */
  promotion?: boolean;
}

/** Todas las piezas que captura una jugada, unificando `captured` y `captures`. */
export function capturesOf(move: Move): Piece[] {
  if (move.captures) return move.captures;
  return move.captured ? [move.captured] : [];
}

/** Tablero denso. En el futuro se generalizará a un grafo de casillas (hex, 3D). */
export type Board = (Piece | null)[];

export type DuelStatus = 'playing' | 'won' | 'lost';

/** Una línea del desglose de puntaje, para mostrar en el HUD ("Captura: Torre — +5 base"). */
export interface ScoreNote {
  source: string;
  detail: string;
}

/**
 * Contribución de puntaje del propio juego a una jugada, antes de los Estandartes.
 * `multAdd` suma al mult (se acumula con +mult de Estandartes) y `multTimes` lo
 * multiplica (ej. cadenas de damas: ×saltos). El núcleo (scoring.ts) los combina.
 */
export interface MoveScore {
  base: number;
  multAdd?: number;
  multTimes?: number;
  notes: ScoreNote[];
}

/** Resultado de puntuar una jugada: Presión = base × mult, con su desglose. */
export interface ScoreBreakdown {
  base: number;
  mult: number;
  total: number;
  notes: ScoreNote[];
}

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
  /** Ids de los Estandartes (jokers) equipados por el jugador. */
  banners: string[];
  /** Desglose de la última jugada del jugador (para el HUD). */
  lastScore: ScoreBreakdown | null;
  /** Cláusulas de Jefe activas (ids), si las hay. Estorban al jugador. Ver clauses.ts. */
  clauses?: string[];
  /** Casilla donde aterrizó la última pieza del jugador (para la cláusula Gravedad). */
  lastPlayerTo?: SquareIndex;
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
  /**
   * Casta (rango) de la pieza: agrupa piezas de poder similar. En la Forja de la
   * tienda solo se intercambian piezas de la MISMA casta (un peón nunca se vuelve
   * dama). Ver src/game/castas.ts. Sin casta = no forjable (ej. el Rey).
   */
  casta?: string;
}

/**
 * Cómo dibujar un tablero que NO es la rejilla 8×8 estándar (ej. los 7
 * tableros/64 casillas del ajedrez 3D). `cellAt` ubica cada `SquareIndex` en
 * una rejilla de celdas (columna, fila) — puede ser dispersa: no todas las
 * celdas (col, row) necesitan corresponder a una casilla real. Si un
 * `GameDef` no define `layout`, el render usa la rejilla 8×8 de siempre.
 */
export interface BoardLayout {
  cols: number;
  rows: number;
  /** Número de casillas válidas (== board.length). */
  count: number;
  cellAt(sq: SquareIndex): { col: number; row: number };
  /** Color alterno de la casilla (patrón de tablero). */
  isDark(sq: SquareIndex): boolean;
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
  /** Disposición de render si el tablero no es la rejilla 8×8 estándar. */
  layout?: BoardLayout;

  createInitialBoard(): Board;
  /** Movimientos pseudo-legales desde `from` (el núcleo filtra turno/estado). */
  movesFrom(board: Board, from: SquareIndex): Move[];
  /**
   * Puntaje que el propio juego aporta a una jugada (base + mult + desglose).
   * Los Estandartes/poderes se suman encima en el núcleo (scoring.ts).
   */
  scoreForMove(move: Move): MoveScore;
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
