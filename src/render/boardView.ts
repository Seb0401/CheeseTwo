import { Application, Container, Graphics, Text, TextStyle } from 'pixi.js';
import { Board, fileOf, rankOf, SquareIndex, toIndex } from '../engine';

const SQUARE = 72;
const LIGHT = 0xead9b8;
const DARK = 0xb07a4e;
const SELECT = 0x6fb36f;
const TARGET = 0x84c084;

const GLYPH: Record<string, string> = {
  'white-king': '♔',
  'white-queen': '♕',
  'white-rook': '♖',
  'white-bishop': '♗',
  'white-knight': '♘',
  'white-pawn': '♙',
  'black-king': '♚',
  'black-queen': '♛',
  'black-rook': '♜',
  'black-bishop': '♝',
  'black-knight': '♞',
  'black-pawn': '♟',
};

export interface BoardViewCallbacks {
  onSquareClick: (sq: SquareIndex) => void;
}

/**
 * Capa de presentación con PixiJS. NO contiene reglas de juego: solo dibuja el
 * estado que le pasa la UI y reporta clics de casilla vía callback.
 */
export class BoardView {
  readonly app = new Application();
  private readonly squaresLayer = new Container();
  private readonly highlightLayer = new Container();
  private readonly piecesLayer = new Container();
  private readonly cb: BoardViewCallbacks;

  constructor(cb: BoardViewCallbacks) {
    this.cb = cb;
  }

  async init(): Promise<HTMLCanvasElement> {
    await this.app.init({
      width: SQUARE * 8,
      height: SQUARE * 8,
      background: 0x2b2b2b,
      antialias: true,
    });
    this.app.stage.addChild(this.squaresLayer, this.highlightLayer, this.piecesLayer);
    this.drawSquares();
    return this.app.canvas;
  }

  /** rank 0 (blancas) se dibuja abajo, así que invertimos la Y de pantalla. */
  private screenY(rank: number): number {
    return (7 - rank) * SQUARE;
  }

  private drawSquares(): void {
    for (let rank = 0; rank < 8; rank++) {
      for (let file = 0; file < 8; file++) {
        const sq = toIndex(file, rank);
        const g = new Graphics()
          .rect(0, 0, SQUARE, SQUARE)
          .fill((file + rank) % 2 === 0 ? DARK : LIGHT);
        g.x = file * SQUARE;
        g.y = this.screenY(rank);
        g.eventMode = 'static';
        g.cursor = 'pointer';
        g.on('pointerdown', () => this.cb.onSquareClick(sq));
        this.squaresLayer.addChild(g);
      }
    }
  }

  private mark(sq: SquareIndex, color: number, alpha: number): Graphics {
    const g = new Graphics().rect(0, 0, SQUARE, SQUARE).fill({ color, alpha });
    g.x = fileOf(sq) * SQUARE;
    g.y = this.screenY(rankOf(sq));
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
      const text = new Text({
        text: GLYPH[`${piece.color}-${piece.type}`],
        style: new TextStyle({
          fontSize: SQUARE * 0.82,
          fill: piece.color === 'white' ? 0xffffff : 0x111111,
        }),
      });
      text.anchor.set(0.5);
      text.x = fileOf(sq) * SQUARE + SQUARE / 2;
      text.y = this.screenY(rankOf(sq)) + SQUARE / 2;
      this.piecesLayer.addChild(text);
    }
  }

  destroy(): void {
    this.app.destroy(true, { children: true });
  }
}
