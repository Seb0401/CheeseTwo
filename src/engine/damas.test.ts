import { describe, expect, it } from 'vitest';
import { applyMove, Board, createDuel, DAMAS, legalMovesFrom, scoreMove, toIndex } from './index';

const emptyWith = (entries: [number, Board[number]][]): Board => {
  const board: Board = new Array(64).fill(null);
  for (const [sq, piece] of entries) board[sq] = piece;
  return board;
};

describe('damas: tablero inicial', () => {
  it('coloca 12 peones por bando en casillas oscuras', () => {
    const board = DAMAS.createInitialBoard();
    const white = board.filter((p) => p?.color === 'white');
    const black = board.filter((p) => p?.color === 'black');
    expect(white).toHaveLength(12);
    expect(black).toHaveLength(12);
    // Todas las piezas están en casillas oscuras (file+rank par).
    board.forEach((p, sq) => {
      if (p) expect(((sq % 8) + Math.floor(sq / 8)) % 2).toBe(0);
    });
  });
});

describe('damas: movimiento y captura', () => {
  it('un peón avanza en diagonal cuando no hay capturas', () => {
    const board = emptyWith([[toIndex(1, 2), { id: 1, type: 'man', color: 'white' }]]);
    const state = { ...createDuel(DAMAS), board };
    const tos = legalMovesFrom(DAMAS, state, toIndex(1, 2))
      .map((m) => m.to)
      .sort((a, b) => a - b);
    expect(tos).toEqual([toIndex(0, 3), toIndex(2, 3)].sort((a, b) => a - b));
  });

  it('la captura es obligatoria: si hay salto, no se ofrecen movimientos simples', () => {
    // Peón blanco en c3 con enemigo en d4 y aterrizaje libre en e5.
    const board = emptyWith([
      [toIndex(2, 2), { id: 1, type: 'man', color: 'white' }],
      [toIndex(3, 3), { id: 2, type: 'man', color: 'black' }],
    ]);
    const state = { ...createDuel(DAMAS), board };
    const moves = legalMovesFrom(DAMAS, state, toIndex(2, 2));
    expect(moves).toHaveLength(1);
    expect(moves[0].to).toBe(toIndex(4, 4));
    expect(moves[0].captures).toHaveLength(1);
  });

  it('encadena saltos y el mult crece con cada salto', () => {
    // Doble captura: c3 salta d4 (→e5) y luego f6 (→g7).
    const board = emptyWith([
      [toIndex(2, 2), { id: 1, type: 'man', color: 'white' }],
      [toIndex(3, 3), { id: 2, type: 'man', color: 'black' }],
      [toIndex(5, 5), { id: 3, type: 'man', color: 'black' }],
    ]);
    const state = { ...createDuel(DAMAS, { target: 999 }), board };
    const chain = legalMovesFrom(DAMAS, state, toIndex(2, 2)).find((m) => (m.captures?.length ?? 0) === 2);
    expect(chain).toBeDefined();
    // base = 2 + 2 = 4; mult = ×2 (cadena) → 8.
    const score = scoreMove(DAMAS, state, chain!);
    expect(score).toMatchObject({ base: 4, mult: 2, total: 8 });
    // Al aplicarla, ambas piezas negras desaparecen.
    const next = applyMove(DAMAS, state, chain!);
    expect(next.board.filter((p) => p?.color === 'black')).toHaveLength(0);
    expect(next.pressure).toBe(8);
  });

  it('un peón que llega al fondo corona a Dama', () => {
    const board = emptyWith([
      [toIndex(1, 6), { id: 1, type: 'man', color: 'white' }],
      [toIndex(4, 4), { id: 9, type: 'man', color: 'black' }],
    ]);
    const state = { ...createDuel(DAMAS, { target: 999 }), board };
    const promo = legalMovesFrom(DAMAS, state, toIndex(1, 6)).find((m) => m.promotion);
    expect(promo).toBeDefined();
    const next = applyMove(DAMAS, state, promo!);
    expect(next.board[promo!.to]?.type).toBe('king');
  });

  it('gana el Duelo al dejar al rival sin piezas', () => {
    const board = emptyWith([
      [toIndex(2, 2), { id: 1, type: 'man', color: 'white' }],
      [toIndex(3, 3), { id: 2, type: 'man', color: 'black' }],
    ]);
    const state = { ...createDuel(DAMAS, { target: 999 }), board };
    const capture = legalMovesFrom(DAMAS, state, toIndex(2, 2))[0];
    const next = applyMove(DAMAS, state, capture);
    expect(next.status).toBe('won');
  });
});
