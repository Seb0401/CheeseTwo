import { describe, expect, it } from 'vitest';
import { MAX_CROWN } from './crowns';
import {
  discoverPieces,
  emptyMeta,
  isDiscovered,
  isUnlocked,
  loadMeta,
  recordDuel,
  recordRunWin,
  saveMeta,
} from './meta';

describe('meta: descubrimiento', () => {
  it('marca piezas como descubiertas una sola vez', () => {
    let meta = emptyMeta();
    meta = discoverPieces(meta, 'chess', ['pawn', 'king']);
    expect(isDiscovered(meta, 'chess', 'pawn')).toBe(true);
    expect(isDiscovered(meta, 'chess', 'queen')).toBe(false);

    const again = discoverPieces(meta, 'chess', ['pawn']);
    expect(again).toBe(meta); // sin novedades → mismo objeto
  });

  it('distingue piezas por juego', () => {
    const meta = discoverPieces(emptyMeta(), 'chess', ['pawn']);
    expect(isDiscovered(meta, 'damas', 'pawn')).toBe(false);
  });
});

describe('meta: estadísticas', () => {
  it('cuenta duelos ganados y perdidos', () => {
    let meta = emptyMeta();
    meta = recordDuel(meta, true);
    meta = recordDuel(meta, false);
    meta = recordDuel(meta, true);
    expect(meta.duelsWon).toBe(2);
    expect(meta.duelsLost).toBe(1);
  });
});

describe('meta: persistencia', () => {
  it('guarda y recarga por round-trip', () => {
    const fake = new Map<string, string>();
    const storage = {
      getItem: (k: string) => fake.get(k) ?? null,
      setItem: (k: string, v: string) => void fake.set(k, v),
    };

    let meta = discoverPieces(emptyMeta(), 'chess', ['rook']);
    meta = recordDuel(meta, true);
    saveMeta(meta, storage);

    const loaded = loadMeta(storage);
    expect(loaded).toEqual(meta);
  });

  it('devuelve meta vacía ante datos corruptos o ausentes', () => {
    expect(loadMeta(null)).toEqual(emptyMeta());
    expect(loadMeta({ getItem: () => '{{{' })).toEqual(emptyMeta());
    expect(loadMeta({ getItem: () => '{"version":99}' })).toEqual(emptyMeta());
  });
});

describe('meta: desbloqueos por victoria de run', () => {
  it('la primera victoria desbloquea Enjambre; ganar con Enjambre desbloquea Realeza', () => {
    let meta = emptyMeta();
    expect(isUnlocked(meta, 'enjambre')).toBe(false);

    meta = recordRunWin(meta, 'chess', 'clasico');
    expect(meta.runsWon).toBe(1);
    expect(isUnlocked(meta, 'enjambre')).toBe(true);
    expect(isUnlocked(meta, 'realeza')).toBe(false);

    meta = recordRunWin(meta, 'chess', 'enjambre');
    expect(isUnlocked(meta, 'realeza')).toBe(true);
    expect(isUnlocked(meta, 'mercader')).toBe(false);

    meta = recordRunWin(meta, 'chess', 'realeza');
    expect(isUnlocked(meta, 'mercader')).toBe(true);
    expect(meta.runsWon).toBe(3);
  });

  it('isUnlocked es verdadero para contenido sin id de desbloqueo', () => {
    expect(isUnlocked(emptyMeta(), undefined)).toBe(true);
  });

  it('no duplica desbloqueos al repetir victorias', () => {
    let meta = recordRunWin(emptyMeta(), 'chess', 'clasico');
    meta = recordRunWin(meta, 'chess', 'clasico');
    expect(meta.unlocks.filter((u) => u === 'enjambre')).toHaveLength(1);
  });
});

describe('meta: Coronas', () => {
  it('ganar en tu Corona máxima desbloquea la siguiente; ganar por debajo no', () => {
    let meta = emptyMeta();
    expect(meta.maxCrown).toBe(0);

    meta = recordRunWin(meta, 'chess', 'clasico', 0);
    expect(meta.maxCrown).toBe(1);

    // Repetir la victoria en una Corona por debajo de tu máxima no la sube más.
    meta = recordRunWin(meta, 'chess', 'clasico', 0);
    expect(meta.maxCrown).toBe(1);

    meta = recordRunWin(meta, 'chess', 'clasico', 1);
    expect(meta.maxCrown).toBe(2);
  });

  it('no sube más allá de la Corona máxima del juego', () => {
    let meta = emptyMeta();
    for (let i = 0; i < 10; i++) {
      meta = recordRunWin(meta, 'chess', 'clasico', meta.maxCrown);
    }
    expect(meta.maxCrown).toBe(MAX_CROWN);
  });
});
