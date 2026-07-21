import { describe, expect, it } from 'vitest';
import { Board, CHESS, createDuel, DAMAS, legalMovesFrom, scoreMove, toIndex } from './index';

const emptyWith = (entries: [number, Board[number]][]): Board => {
  const b: Board = new Array(64).fill(null);
  for (const [sq, p] of entries) b[sq] = p;
  return b;
};
const chessState = (board: Board, banners: string[]) => ({
  ...createDuel(CHESS, { target: 999, banners }),
  board,
});

describe('Estandarte Herejía', () => {
  it('+2 mult a capturas con pieza herética, no con clásicas', () => {
    // Canciller (herético) en d4 captura una torre a su izquierda.
    const board = emptyWith([
      [toIndex(3, 3), { id: 1, type: 'chancellor', color: 'white' }],
      [toIndex(0, 3), { id: 2, type: 'rook', color: 'black' }],
    ]);
    const s = chessState(board, ['herejia']);
    const move = legalMovesFrom(CHESS, s, toIndex(3, 3)).find((m) => m.captured)!;
    // base 5 (torre), mult (1+2)=3 → 15.
    expect(scoreMove(CHESS, s, move).total).toBe(15);

    // Una torre clásica capturando lo mismo no recibe el bonus.
    const classic = emptyWith([
      [toIndex(3, 3), { id: 1, type: 'rook', color: 'white' }],
      [toIndex(0, 3), { id: 2, type: 'rook', color: 'black' }],
    ]);
    const s2 = chessState(classic, ['herejia']);
    const m2 = legalMovesFrom(CHESS, s2, toIndex(3, 3)).find((m) => m.captured)!;
    expect(scoreMove(CHESS, s2, m2).total).toBe(5);
  });
});

describe('Estandarte Reina Roja', () => {
  it('×2 mult a capturas de la Dama', () => {
    const board = emptyWith([
      [toIndex(3, 3), { id: 1, type: 'queen', color: 'white' }],
      [toIndex(3, 6), { id: 2, type: 'rook', color: 'black' }],
    ]);
    const s = chessState(board, ['reina-roja']);
    const move = legalMovesFrom(CHESS, s, toIndex(3, 3)).find((m) => m.captured)!;
    expect(scoreMove(CHESS, s, move).total).toBe(10); // 5 × 2
  });
});

describe('Estandarte Enjambre', () => {
  it('+2 mult a capturas con un tipo del que tienes 3+', () => {
    const board = emptyWith([
      [toIndex(0, 1), { id: 1, type: 'pawn', color: 'white' }],
      [toIndex(2, 1), { id: 2, type: 'pawn', color: 'white' }],
      [toIndex(4, 1), { id: 3, type: 'pawn', color: 'white' }],
      [toIndex(1, 2), { id: 4, type: 'knight', color: 'black' }],
    ]);
    const s = chessState(board, ['enjambre']);
    const move = legalMovesFrom(CHESS, s, toIndex(0, 1)).find((m) => m.captured)!;
    // caballo=3 base, mult (1+2)=3 → 9.
    expect(scoreMove(CHESS, s, move).total).toBe(9);
  });
});

describe('Estandarte Coleccionista', () => {
  it('+1 base por cada tipo distinto en tu ejército, en capturas', () => {
    // Ejército con 3 tipos distintos (rook, knight, bishop). La torre captura.
    const board = emptyWith([
      [toIndex(3, 3), { id: 1, type: 'rook', color: 'white' }],
      [toIndex(5, 5), { id: 2, type: 'knight', color: 'white' }],
      [toIndex(6, 6), { id: 3, type: 'bishop', color: 'white' }],
      [toIndex(3, 6), { id: 4, type: 'knight', color: 'black' }],
    ]);
    const s = chessState(board, ['coleccionista']);
    const move = legalMovesFrom(CHESS, s, toIndex(3, 3)).find((m) => m.captured)!;
    // base 3 (caballo) + 3 (tres tipos) = 6.
    expect(scoreMove(CHESS, s, move).base).toBe(6);
  });
});

describe('Estandarte Eslabón (damas)', () => {
  it('suma +1 mult por salto extra, encima del ×saltos de la cadena', () => {
    const board = emptyWith([
      [toIndex(2, 2), { id: 1, type: 'man', color: 'white' }],
      [toIndex(3, 3), { id: 2, type: 'man', color: 'black' }],
      [toIndex(5, 5), { id: 3, type: 'man', color: 'black' }],
    ]);
    const s = { ...createDuel(DAMAS, { target: 999, banners: ['eslabon'] }), board };
    const chain = legalMovesFrom(DAMAS, s, toIndex(2, 2)).find((m) => (m.captures?.length ?? 0) === 2)!;
    // base 4; mult = (1 + 1 eslabón) × 2 cadena = 4 → total 16 (vs 8 sin Eslabón).
    expect(scoreMove(DAMAS, s, chain)).toMatchObject({ base: 4, mult: 4, total: 16 });
  });
});
