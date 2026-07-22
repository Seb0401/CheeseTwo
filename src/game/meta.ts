// Meta-progresión: lo que persiste ENTRE runs (colección, estadísticas).
// Vive fuera del engine (el motor no conoce la persistencia) y se guarda en
// localStorage. Lógica pura + un par de helpers de carga/guardado.

import { MAX_CROWN } from './crowns';

export interface MetaState {
  version: 1;
  /** Piezas descubiertas, como claves `gameId/pieceType` (estilo compendio de Balatro). */
  discovered: string[];
  duelsWon: number;
  duelsLost: number;
  /** Runs ganados (venciste al Jefe). */
  runsWon: number;
  /** Contenido desbloqueado (ids de ejércitos, etc.). */
  unlocks: string[];
  /** Corona máxima jugable (0 = sin Corona; ver game/crowns.ts). Sube ganando en tu Corona actual. */
  maxCrown: number;
}

export function emptyMeta(): MetaState {
  return {
    version: 1,
    discovered: [],
    duelsWon: 0,
    duelsLost: 0,
    runsWon: 0,
    unlocks: [],
    maxCrown: 0,
  };
}

/**
 * Reglas de desbloqueo al GANAR un run. Cada regla, si su condición se cumple,
 * concede un desbloqueo (id de ejército). Encadena: ganar con un ejército
 * desbloquea el siguiente. Data-driven: añadir contenido = añadir una regla.
 */
const RUN_WIN_UNLOCKS: { when: (gameId: string, armyId: string) => boolean; grant: string }[] = [
  { when: () => true, grant: 'enjambre' }, // cualquier victoria
  { when: (_g, a) => a === 'enjambre', grant: 'realeza' },
  { when: (_g, a) => a === 'realeza', grant: 'mercader' },
];

/**
 * Registra un run ganado: suma la victoria, concede los desbloqueos que
 * toquen y, si ganaste jugando en tu Corona máxima actual, desbloquea la
 * siguiente (estilo stakes de Balatro — ver crowns.ts).
 */
export function recordRunWin(
  meta: MetaState,
  gameId: string,
  armyId: string,
  crown = 0,
): MetaState {
  let unlocks = meta.unlocks;
  for (const rule of RUN_WIN_UNLOCKS) {
    if (rule.when(gameId, armyId) && !unlocks.includes(rule.grant)) {
      unlocks = [...unlocks, rule.grant];
    }
  }
  const maxCrown =
    crown === meta.maxCrown && meta.maxCrown < MAX_CROWN ? meta.maxCrown + 1 : meta.maxCrown;
  return { ...meta, runsWon: meta.runsWon + 1, unlocks, maxCrown };
}

export function isUnlocked(meta: MetaState, unlockId: string | undefined): boolean {
  return !unlockId || meta.unlocks.includes(unlockId);
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
    const parsed = JSON.parse(raw) as Partial<MetaState>;
    if (parsed.version !== 1 || !Array.isArray(parsed.discovered)) return emptyMeta();
    const meta = { ...emptyMeta(), ...parsed };
    // Sanea campos añadidos en versiones nuevas por si el guardado es antiguo.
    if (!Array.isArray(meta.unlocks)) meta.unlocks = [];
    if (typeof meta.runsWon !== 'number') meta.runsWon = 0;
    if (typeof meta.maxCrown !== 'number') meta.maxCrown = 0;
    return meta;
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
