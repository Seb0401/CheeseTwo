// Meta-progresión: lo que persiste ENTRE runs (colección, estadísticas).
// Vive fuera del engine (el motor no conoce la persistencia) y se guarda en
// localStorage. Lógica pura + un par de helpers de carga/guardado.

export interface MetaState {
  version: 1;
  /** Piezas descubiertas, como claves `gameId/pieceType` (estilo compendio de Balatro). */
  discovered: string[];
  duelsWon: number;
  duelsLost: number;
}

export function emptyMeta(): MetaState {
  return { version: 1, discovered: [], duelsWon: 0, duelsLost: 0 };
}

export function discoveryKey(gameId: string, pieceType: string): string {
  return `${gameId}/${pieceType}`;
}

export function isDiscovered(meta: MetaState, gameId: string, pieceType: string): boolean {
  return meta.discovered.includes(discoveryKey(gameId, pieceType));
}

/** Marca piezas como descubiertas. Devuelve el mismo objeto si no hay novedades. */
export function discoverPieces(meta: MetaState, gameId: string, types: string[]): MetaState {
  const news = types
    .map((t) => discoveryKey(gameId, t))
    .filter((k) => !meta.discovered.includes(k));
  if (news.length === 0) return meta;
  return { ...meta, discovered: [...meta.discovered, ...news] };
}

export function recordDuel(meta: MetaState, won: boolean): MetaState {
  return won ? { ...meta, duelsWon: meta.duelsWon + 1 } : { ...meta, duelsLost: meta.duelsLost + 1 };
}

// ─── Persistencia ────────────────────────────────────────────────────────────

const STORAGE_KEY = 'cheesetwo-meta-v1';

export function loadMeta(storage: Pick<Storage, 'getItem'> | null = defaultStorage()): MetaState {
  try {
    const raw = storage?.getItem(STORAGE_KEY);
    if (!raw) return emptyMeta();
    const parsed = JSON.parse(raw) as MetaState;
    if (parsed.version !== 1 || !Array.isArray(parsed.discovered)) return emptyMeta();
    return { ...emptyMeta(), ...parsed };
  } catch {
    return emptyMeta();
  }
}

export function saveMeta(
  meta: MetaState,
  storage: Pick<Storage, 'setItem'> | null = defaultStorage(),
): void {
  try {
    storage?.setItem(STORAGE_KEY, JSON.stringify(meta));
  } catch {
    // Sin almacenamiento disponible (SSR, privacidad): la meta vive solo en memoria.
  }
}

function defaultStorage(): Storage | null {
  return typeof localStorage === 'undefined' ? null : localStorage;
}
