import { describe, expect, it } from 'vitest';
import { CHESS, createRng } from '../engine';
import {
  buildDuelBoard,
  createRun,
  duelReward,
  forgeCost,
  forgeOptions,
  forgePiece,
  RUN_PLANS,
} from './run';

describe('run: creación y roster', () => {
  it('el roster arranca con las 16 piezas blancas', () => {
    const run = createRun(CHESS, CHESS.createInitialBoard());
    expect(run.roster).toHaveLength(16);
    expect(run.gold).toBeGreaterThan(0);
    expect(run.duelIndex).toBe(0);
  });
});

describe('run: construcción de duelos', () => {
  it('el Duelo Menor retira piezas rivales; el Jefe no', () => {
    const run = createRun(CHESS, CHESS.createInitialBoard());
    const menor = buildDuelBoard(CHESS, run.roster, RUN_PLANS[0], createRng(1));
    const jefe = buildDuelBoard(CHESS, run.roster, RUN_PLANS[2], createRng(1));
    const blackMenor = menor.filter((p) => p?.color === 'black').length;
    const blackJefe = jefe.filter((p) => p?.color === 'black').length;
    expect(blackMenor).toBe(16 - RUN_PLANS[0].enemyDrop);
    expect(blackJefe).toBe(16);
    // El rey rival nunca se retira.
    expect(menor.some((p) => p?.color === 'black' && p.type === 'king')).toBe(true);
  });

  it('es determinista con la misma semilla', () => {
    const run = createRun(CHESS, CHESS.createInitialBoard());
    const a = buildDuelBoard(CHESS, run.roster, RUN_PLANS[0], createRng(7));
    const b = buildDuelBoard(CHESS, run.roster, RUN_PLANS[0], createRng(7));
    expect(a.map((p) => p?.type ?? '.')).toEqual(b.map((p) => p?.type ?? '.'));
  });
});

describe('run: forja por casta', () => {
  it('solo ofrece cambios dentro de la misma casta', () => {
    // El peón (infantería) solo puede forjarse a Berolina, nunca a Dama.
    const opciones = forgeOptions(CHESS, 'pawn');
    expect(opciones).toContain('berolina');
    expect(opciones).not.toContain('queen');
    // El caballo (menor) tiene varias opciones menores.
    expect(forgeOptions(CHESS, 'knight')).toEqual(
      expect.arrayContaining(['bishop', 'grasshopper', 'archbishop', 'camel']),
    );
    // El rey no es forjable.
    expect(forgeOptions(CHESS, 'king')).toHaveLength(0);
  });

  it('la forja de una casta superior cuesta más', () => {
    expect(forgeCost(CHESS, 'pawn')).toBeLessThan(forgeCost(CHESS, 'knight'));
    expect(forgeCost(CHESS, 'knight')).toBeLessThan(forgeCost(CHESS, 'queen'));
  });

  it('forgePiece cambia solo la pieza indicada', () => {
    const run = createRun(CHESS, CHESS.createInitialBoard());
    const knightIndex = run.roster.findIndex((e) => e.type === 'knight');
    const forged = forgePiece(run, knightIndex, 'camel');
    expect(forged.roster[knightIndex].type).toBe('camel');
    expect(forged.roster.filter((e) => e.type === 'knight')).toHaveLength(1); // había 2
    expect(run.roster[knightIndex].type).toBe('knight'); // no muta el original
  });
});

describe('run: recompensa', () => {
  it('paga más por superar la meta y por el Jefe', () => {
    const base = duelReward(RUN_PLANS[0], RUN_PLANS[0].target);
    const over = duelReward(RUN_PLANS[0], RUN_PLANS[0].target + 24);
    const jefe = duelReward(RUN_PLANS[2], RUN_PLANS[2].target);
    expect(over).toBeGreaterThan(base);
    expect(jefe).toBeGreaterThan(base);
  });
});
