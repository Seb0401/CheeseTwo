// RNG con semilla (mulberry32): todo azar del juego debe pasar por aquí para
// que runs, replays y PvP futuro sean reproducibles. NUNCA usar Math.random
// en lógica de juego.

export type Rng = () => number;

/** Crea un generador determinista [0,1) a partir de una semilla entera. */
export function createRng(seed: number): Rng {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Elige `n` elementos distintos de `pool`, en orden aleatorio (Fisher-Yates parcial). */
export function pickN<T>(pool: readonly T[], n: number, rng: Rng): T[] {
  const copy = pool.slice();
  const count = Math.min(n, copy.length);
  for (let i = 0; i < count; i++) {
    const j = i + Math.floor(rng() * (copy.length - i));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy.slice(0, count);
}
