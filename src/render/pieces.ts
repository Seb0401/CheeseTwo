import { Container, Graphics } from 'pixi.js';
import { Color, PieceType } from '../engine';

// ─── Fichas con estética LOW-POLY ────────────────────────────────────────────
// Cada pieza se dibuja como una "gema/moneda" facetada (caras de luz y sombra
// desde arriba-izquierda) con un emblema geométrico encima y una sombra
// proyectada. Las piezas especiales (heréticas) llevan un aro dorado. Todo es
// vectorial (PixiJS Graphics), así que escala sin pixelarse y es fácil añadir
// piezas nuevas: basta con registrar su emblema en EMBLEMS.

interface Palette {
  base: number;
  light: number;
  dark: number;
  rim: number;
  emblem: number;
  emblemHi: number;
}

const WHITE_P: Palette = {
  base: 0xe7dabc,
  light: 0xfbf5e6,
  dark: 0xbfa982,
  rim: 0x4a3a26,
  emblem: 0x4a3a26,
  emblemHi: 0x6d5636,
};
const BLACK_P: Palette = {
  base: 0x3c3c48,
  light: 0x5a5a6b,
  dark: 0x232029,
  rim: 0xece3d0,
  emblem: 0xf2ecdf,
  emblemHi: 0xffffff,
};

const GOLD = 0xd8b24a;

/** Piezas "especiales" (heréticas/nuevas): llevan aro dorado para destacar. */
const FAIRY = new Set<PieceType>([
  'chancellor',
  'archbishop',
  'grasshopper',
  'camel',
  'cannon',
  'amazon',
  'berolina',
]);

function lerpColor(a: number, b: number, t: number): number {
  const ar = (a >> 16) & 0xff;
  const ag = (a >> 8) & 0xff;
  const ab = a & 0xff;
  const br = (b >> 16) & 0xff;
  const bg = (b >> 8) & 0xff;
  const bb = b & 0xff;
  const r = Math.round(ar + (br - ar) * t);
  const g = Math.round(ag + (bg - ag) * t);
  const bl = Math.round(ab + (bb - ab) * t);
  return (r << 16) | (g << 8) | bl;
}

/** Moneda facetada de N lados, iluminada desde arriba-izquierda. */
function facetedToken(g: Graphics, r: number, pal: Palette): void {
  const N = 8;
  const verts: [number, number][] = [];
  for (let i = 0; i < N; i++) {
    const a = -Math.PI / 2 + (i * 2 * Math.PI) / N + Math.PI / N;
    verts.push([Math.cos(a) * r, Math.sin(a) * r]);
  }
  // Luz desde arriba-izquierda (normalizada).
  const lx = -0.7;
  const ly = -0.7;
  for (let i = 0; i < N; i++) {
    const [ax, ay] = verts[i];
    const [bx, by] = verts[(i + 1) % N];
    const mx = (ax + bx) / 2;
    const my = (ay + by) / 2;
    const len = Math.hypot(mx, my) || 1;
    const t = (mx / len) * lx + (my / len) * ly; // -1..1, 1 = mira a la luz
    const shade = lerpColor(pal.dark, pal.light, (t + 1) / 2);
    g.poly([0, 0, ax, ay, bx, by]).fill(shade);
  }
  const outline: number[] = [];
  for (const [x, y] of verts) outline.push(x, y);
  g.poly(outline).stroke({ color: pal.rim, width: r * 0.09, alignment: 0.5 });
}

// ─── Emblemas ────────────────────────────────────────────────────────────────
// Se dibujan en una caja de 100 unidades centrada en (0,0), Y hacia abajo
// (arriba = negativo). `u` escala esa caja al tamaño real de la casilla.

type Emblem = (g: Graphics, pal: Palette, u: number) => void;

const poly = (g: Graphics, pts: number[], u: number, col: number) =>
  g.poly(pts.map((v) => v * u)).fill(col);
const circle = (g: Graphics, cx: number, cy: number, r: number, u: number, col: number) =>
  g.circle(cx * u, cy * u, r * u).fill(col);

const pawn: Emblem = (g, p, u) => {
  poly(g, [-14, 30, 14, 30, 9, 2, 7, -4, -7, -4, -9, 2], u, p.emblem);
  poly(g, [-12, 4, 12, 4, 10, -3, -10, -3], u, p.emblem);
  circle(g, 0, -15, 12, u, p.emblem);
};

const rook: Emblem = (g, p, u) => {
  poly(g, [-15, 30, 15, 30, 12, -4, -12, -4], u, p.emblem);
  // almenas
  poly(
    g,
    [-17, -4, -17, -20, -10, -20, -10, -13, -4, -13, -4, -20, 4, -20, 4, -13, 10, -13, 10, -20, 17, -20, 17, -4],
    u,
    p.emblem,
  );
};

const bishop: Emblem = (g, p, u) => {
  poly(g, [0, -28, 12, -6, 10, 24, -10, 24, -12, -6], u, p.emblem);
  circle(g, 0, -30, 4.5, u, p.emblem);
  // hendidura diagonal (color de la moneda, aquí simulada con highlight)
  poly(g, [-2, -14, 6, -2, 3, 2, -5, -10], u, p.emblemHi);
};

const knight: Emblem = (g, p, u) => {
  // Cabeza de caballo estilizada mirando a la izquierda: base, cuello, oreja y
  // hocico. Puntos en sentido horario desde abajo-izquierda.
  poly(
    g,
    [
      -15, 30, 15, 30, 13, 4, 15, -10, 6, -13, 11, -27, 2, -21, -3, -28,
      -18, -15, -11, -7, -16, -2, -9, 4, -12, 15,
    ],
    u,
    p.emblem,
  );
  circle(g, 4, -17, 2.4, u, p.emblemHi); // ojo
};

const queen: Emblem = (g, p, u) => {
  poly(g, [-15, 28, 15, 28, 12, 6, -12, 6], u, p.emblem);
  poly(g, [-15, 8, -12, -16, -6, 0, 0, -22, 6, 0, 12, -16, 15, 8], u, p.emblem);
  circle(g, -12, -16, 3.2, u, p.emblem);
  circle(g, 0, -22, 3.4, u, p.emblem);
  circle(g, 12, -16, 3.2, u, p.emblem);
};

const king: Emblem = (g, p, u) => {
  poly(g, [-14, 28, 14, 28, 11, 6, -11, 6], u, p.emblem);
  poly(g, [-14, 8, -12, -10, -5, 0, 5, 0, 12, -10, 14, 8], u, p.emblem);
  poly(g, [-2.5, -30, 2.5, -30, 2.5, -14, -2.5, -14], u, p.emblem); // cruz vertical
  poly(g, [-8, -25, 8, -25, 8, -20, -8, -20], u, p.emblem); // cruz horizontal
};

// Emblemas de las piezas especiales (compuestos: base + acento).
const chancellor: Emblem = (g, p, u) => {
  rook(g, p, u);
  poly(g, [11, -20, 22, -26, 18, -11], u, p.emblem); // "oreja" de caballo
};

const archbishop: Emblem = (g, p, u) => {
  bishop(g, p, u);
  poly(g, [9, -18, 20, -23, 16, -8], u, p.emblem);
};

const grasshopper: Emblem = (g, p, u) => {
  circle(g, 0, 6, 9, u, p.emblem); // cuerpo
  poly(g, [-6, 0, -24, -14, -17, 4], u, p.emblem); // ala izq
  poly(g, [6, 0, 24, -14, 17, 4], u, p.emblem); // ala der
  poly(g, [-3, -2, -10, -20, -6, -20], u, p.emblem); // antena
  poly(g, [3, -2, 10, -20, 6, -20], u, p.emblem);
};

const camel: Emblem = (g, p, u) => {
  poly(g, [-18, 28, 18, 28, 15, 10, -15, 10], u, p.emblem); // base/patas
  poly(g, [-15, 12, -9, -12, -1, 6, 6, -16, 15, 12], u, p.emblem); // dos jorobas
  poly(g, [12, 4, 24, -4, 21, 12], u, p.emblem); // cabeza/cuello
};

const cannon: Emblem = (g, p, u) => {
  poly(g, [-18, 28, 18, 28, 14, 18, -14, 18], u, p.emblem); // afuste
  circle(g, -8, 6, 11, u, p.emblem); // rueda / recámara
  circle(g, -8, 6, 4, u, p.emblemHi);
  poly(g, [-6, -2, 16, -12, 20, -4, -2, 12], u, p.emblem); // barril apuntando arriba-derecha
  circle(g, 18, -8, 3.2, u, p.emblemHi); // boca del barril
};

const amazon: Emblem = (g, p, u) => {
  poly(g, [-14, 28, 14, 28, 11, 8, -11, 8], u, p.emblem);
  poly(g, [-14, 10, -11, -14, -5, 0, 0, -26, 5, 0, 11, -14, 14, 10], u, p.emblem);
  poly(g, [10, -18, 22, -28, 18, -12], u, p.emblem); // oreja de caballo (dama+caballo)
  circle(g, 0, -26, 3.2, u, p.emblem);
};

const berolina: Emblem = (g, p, u) => {
  poly(g, [0, 30, 16, 6, 0, -18, -16, 6], u, p.emblem); // rombo (peón "espejo")
  circle(g, 0, -4, 8, u, p.emblem);
  poly(g, [-14, 10, -20, 2, -12, 2], u, p.emblemHi); // chevrones diagonales
  poly(g, [14, 10, 20, 2, 12, 2], u, p.emblemHi);
};

const man: Emblem = (g, p, u) => {
  g.circle(0, 0, 19 * u).stroke({ color: p.emblem, width: 6 * u });
  circle(g, 0, 0, 7, u, p.emblem);
};

const damasKing: Emblem = (g, p, u) => {
  g.circle(0, 0, 19 * u).stroke({ color: p.emblem, width: 6 * u });
  poly(g, [-12, 6, 12, 6, 9, -6, 3, 2, 0, -12, -3, 2, -9, -6], u, p.emblem); // coronita
};

const EMBLEMS: Record<string, Emblem> = {
  pawn,
  rook,
  bishop,
  knight,
  queen,
  king,
  chancellor,
  archbishop,
  grasshopper,
  camel,
  cannon,
  amazon,
  berolina,
  man,
  king_damas: damasKing,
};

/** Emblema para tipos sin diseño propio: un rombo neutro (nunca debería verse). */
const fallback: Emblem = (g, p, u) => poly(g, [0, -20, 16, 0, 0, 20, -16, 0], u, p.emblem);

/**
 * Dibuja una pieza como Container listo para posicionar. `size` = lado de la
 * casilla. El emblema del Rey de damas se elige por tipo 'king' + gameId, pero
 * como el núcleo usa 'king' para ambos, damas registra su rey aparte; aquí lo
 * resolvemos por el conjunto de piezas del juego vía `emblemKey`.
 */
export function drawPiece(type: PieceType, color: Color, size: number, emblemKey?: string): Container {
  const c = new Container();
  const pal = color === 'white' ? WHITE_P : BLACK_P;
  const r = size * 0.34;
  const u = size / 100;

  // Sombra proyectada.
  const shadow = new Graphics();
  shadow.ellipse(size * 0.04, r * 0.62, r * 1.02, r * 0.5).fill({ color: 0x000000, alpha: 0.28 });
  c.addChild(shadow);

  // Moneda facetada.
  const token = new Graphics();
  facetedToken(token, r, pal);
  c.addChild(token);

  // Aro dorado para piezas especiales.
  if (FAIRY.has(type)) {
    const ring = new Graphics();
    ring.circle(0, 0, r * 0.82).stroke({ color: GOLD, width: size * 0.028 });
    c.addChild(ring);
  }

  // Emblema.
  const em = new Graphics();
  (EMBLEMS[emblemKey ?? type] ?? EMBLEMS[type] ?? fallback)(em, pal, u);
  c.addChild(em);

  return c;
}

export { FAIRY };
