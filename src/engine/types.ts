// Tipos núcleo del motor. Deliberadamente simples y serializables:
// un DuelState debe poder guardarse/reproducirse (base para replays y PvP futuro).

export type Color = 'white' | 'black';

export type PieceType = 'pawn' | 'knight' | 'bishop' | 'rook' | 'queen' | 'king';

export interface Piece {
  id: number;
  type: PieceType;
  color: Color;
}

/** Índice de casilla 0..63 = rank*8 + file. file 0..7 (a..h); rank 0 = fila de las blancas. */
export type SquareIndex = number;

export interface Move {
  from: SquareIndex;
  to: SquareIndex;
  /** Pieza capturada, si la hay. */
  captured?: Piece;
  /** Un peón que corona (auto-dama en el Hito 0). */
  promotion?: boolean;
}

/** Tablero denso de 64 posiciones. En el futuro se generalizará a un grafo de casillas. */
export type Board = (Piece | null)[];

export type DuelStatus = 'playing' | 'won' | 'lost';

export interface DuelState {
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
