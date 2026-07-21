import { describe, expect, it } from 'vitest';
import {
  applyMove,
  Board,
  CHESS,
  chooseAiMove,
  CLAUSES,
  clausesForGame,
  createDuel,
  legalMovesFrom,
  scoreMove,
  toIndex,
} from './index';

const withClause = (clause: string, board: Board, banners: string[] = []) => ({
  ...createDuel(CHESS, { target: 999, turnLimit: 20, banners, clause }),
  board,
});
const emptyWith = (entries: [number, Board[number]][]): Board => {
  const b: Board = new Array(64).fill(null);
  for (const [sq, p] of entries) b[sq] = p;
  return b;
};

describe('cláusula Ley marcial', () => {
  it('anula la Presión de los peones pero no de otras piezas', () => {
    // Peón blanco captura → 0. Torre blanca captura → normal.
    const pawnBoard = emptyWith([
      [toIndex(3, 3), { id: 1, type: 'pawn', color: 'white' }],
      [toIndex(4, 4), { id: 2, type: 'knight', color: 'black' }],
    ]);
    const s1 = withClause('ley-marcial', pawnBoard);
    const pawnCap = legalMovesFrom(CHESS, s1, toIndex(3, 3)).find((m) => m.captured)!;
    expect(scoreMove(CHESS, s1, pawnCap).total).toBe(0);

    const rookBoard = emptyWith([
      [toIndex(3, 3), { id: 1, type: 'rook', color: 'white' }],
      [toIndex(3, 6), { id: 2, type: 'knight', color: 'black' }],
    ]);
    const s2 = withClause('ley-marcial', rookBoard);
    const rookCap = legalMovesFrom(CHESS, s2, toIndex(3, 3)).find((m) => m.captured)!;
    expect(scoreMove(CHESS, s2, rookCap).total).toBeGreaterThan(0);
  });
});

describe('cláusula Maldición arcana', () => {
  it('reduce a la mitad el aporte de los Estandartes', () => {
    // Caballo captura torre en centro con Cazador (+2 mult).
    const board = emptyWith([
      [toIndex(2, 2), { id: 1, type: 'knight', color: 'white' }],
      [toIndex(3, 4), { id: 2, type: 'rook', color: 'black' }],
    ]);
    const move = legalMovesFrom(CHESS, withClause('maldicion-arcana', board, ['cazador']), toIndex(2, 2)).find(
      (m) => m.captured,
    )!;
    // Sin maldición: base 6, mult (1+2)=3 → 18. Con maldición: mult (1 + 2/2)=2 → 12.
    const normal = scoreMove(CHESS, withClause('gravedad', board, ['cazador']), move);
    const cursed = scoreMove(CHESS, withClause('maldicion-arcana', board, ['cazador']), move);
    expect(normal.total).toBe(18);
    expect(cursed.total).toBe(12);
  });
});

describe('cláusula Gravedad', () => {
  it('impide mover la misma pieza dos turnos seguidos', () => {
    const board = emptyWith([
      [toIndex(1, 0), { id: 1, type: 'knight', color: 'white' }],
      [toIndex(7, 7), { id: 9, type: 'king', color: 'black' }],
      [toIndex(4, 0), { id: 8, type: 'king', color: 'white' }],
    ]);
    let state = withClause('gravedad', board);
    const first = legalMovesFrom(CHESS, state, toIndex(1, 0))[0];
    state = applyMove(CHESS, state, first); // jugador mueve → turno del rival
    const reply = chooseAiMove(CHESS, state, 'black');
    state = applyMove(CHESS, state, reply!); // rival responde → vuelve al jugador
    expect(state.turn).toBe('white');
    // La pieza recién movida (ahora en first.to) está bloqueada este turno.
    expect(legalMovesFrom(CHESS, state, first.to)).toHaveLength(0);
  });
});

describe('cláusula Fortaleza', () => {
  it('añade 2 torres negras junto al rey rival', () => {
    const board = CHESS.createInitialBoard();
    const before = board.filter((p) => p?.color === 'black' && p.type === 'rook').length;
    const after = CLAUSES['fortaleza'].setupBoard!(board);
    const rooks = after.filter((p) => p?.color === 'black' && p.type === 'rook').length;
    expect(rooks).toBe(before + 2);
  });
});

describe('pool de cláusulas por juego', () => {
  it('el ajedrez tiene más cláusulas que las damas (algunas son solo suyas)', () => {
    expect(clausesForGame('chess').length).toBeGreaterThan(clausesForGame('damas').length);
    expect(clausesForGame('damas').every((c) => !c.gameId)).toBe(true);
  });
});
