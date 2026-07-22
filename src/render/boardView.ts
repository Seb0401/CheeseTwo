import { Application, Container, Graphics } from 'pixi.js';
import { Board, BoardLayout, fileOf, Piece, rankOf, SquareIndex } from '../engine';
import { drawPiece } from './pieces';

const SQUARE = 72;
const LIGHT = 0xead9b8;
const DARK = 0xb07a4e;
const SELECT = 0x6fb36f;
const TARGET = 0x84c084;

/** Rejilla 8×8 de siempre (ajedrez, damas): usada si el juego no trae `layout`. */
const STANDARD_LAYOUT: BoardLayout = {
  cols: 8,
  rows: 8,
  count: 64,
  cellAt: (sq) => ({ col: fileOf(sq), row: rankOf(sq) }),
  isDark: (sq) => (fileOf(sq) + rankOf(sq)) % 2 === 0,
};

export interface BoardViewCallbacks {
  onSquareClick: (sq: SquareIndex) => void;
  /** Clave del emblema a dibujar (normalmente el tipo; damas distingue su rey). */
  emblemKeyFor: (piece: Piece) => string;
  /** Disposición de casillas; por defecto la rejilla 8×8 estándar. */
  layout?: BoardLayout;
}

/**
 * Capa de presentación con PixiJS. NO contiene reglas de juego: solo dibuja el
 * estado que le pasa la UI y reporta clics de casilla vía callback. La
 * posición de cada casilla viene de `layout` (por defecto, 8×8), lo que
 * permite tableros no rectangulares (ver ajedrez 3D en `engine/games`).
 */
export class BoardView {
  readonly app = new Application();
  private readonly squaresLayer = new Container();
  private readonly highlightLayer = new Container();
  private readonly piecesLayer = new Container();
  private readonly cb: BoardViewCallbacks;
  private readonly layout: BoardLayout;

  constructor(cb: BoardViewCallbacks) {
    this.cb = cb;
    this.layout = cb.layout ?? STANDARD_LAYOUT;
  }

  async init(): Promise<HTMLCanvasElement> {
    await this.app.init({
      width: SQUARE * this.layout.cols,
      height: SQUARE * this.layout.rows,
      background: 0x2b2b2b,
      antialias: true,
    });
    this.app.stage.addChild(this.squaresLayer, this.highlightLayer, this.piecesLayer);
    this.drawSquares();
    return this.app.canvas;
  }

  /** row 0 (blancas) se dibuja abajo, así que invertimos la Y de pantalla. */
  private screenY(row: number): number {
    return (this.layout.rows - 1 - row) * SQUARE;
  }

  private drawSquares(): void {
    for (let sq = 0; sq < this.layout.count; sq++) {
      const { col, row } = this.layout.cellAt(sq);
      const g = new Graphics()
        .rect(0, 0, SQUARE, SQUARE)
        .fill(this.layout.isDark(sq) ? DARK : LIGHT);
      g.x = col * SQUARE;
      g.y = this.screenY(row);
      g.eventMode = 'static';
      g.cursor = 'pointer';
      g.on('pointerdown', () => this.cb.onSquareClick(sq));
      this.squaresLayer.addChild(g);
    }
  }

  private mark(sq: SquareIndex, color: number, alpha: number): Graphics {
    const { col, row } = this.layout.cellAt(sq);
    const g = new Graphics().rect(0, 0, SQUARE, SQUARE).fill({ color, alpha });
    g.x = col * SQUARE;
    g.y = this.screenY(row);
    return g;
  }

  render(board: Board, selected: SquareIndex | null, targets: SquareIndex[]): void {
    this.highlightLayer.removeChildren();
    this.piecesLayer.removeChildren();

    if (selected !== null) this.highlightLayer.addChild(this.mark(selected, SELECT, 0.5));
    for (const t of targets) this.highlightLayer.addChild(this.mark(t, TARGET, 0.45));

    for (let sq = 0; sq < board.length; sq++) {
      const piece = board[sq];
      if (!piece) continue;
      const { col, row } = this.layout.cellAt(sq);
      const sprite = drawPiece(piece.type, piece.color, SQUARE, this.cb.emblemKeyFor(piece));
      sprite.x = col * SQUARE + SQUARE / 2;
      sprite.y = this.screenY(row) + SQUARE / 2;
      this.piecesLayer.addChild(sprite);
    }
  }

  destroy(): void {
    this.app.destroy(true, { children: true });
  }
}
