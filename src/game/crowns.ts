// Coronas: dificultad ascendente estilo "stakes" de Balatro (ver docs/06).
// Cada Corona ACUMULA los efectos de las anteriores. Se elige en la Preparación
// de Run (hasta la máxima desbloqueada) y ganar un run en tu Corona máxima
// desbloquea la siguiente (ver game/meta.ts: recordRunWin).

export interface Crown {
  level: number; // 1..4
  name: string;
  icon: string;
  description: string;
}

export const CROWNS: Crown[] = [
  { level: 1, name: 'Corona I', icon: '👑', description: 'Metas de Presión +20%.' },
  { level: 2, name: 'Corona II', icon: '👑👑', description: 'El Jefe trae 2 Cláusulas a la vez.' },
  { level: 3, name: 'Corona III', icon: '👑👑👑', description: 'Rerolar la Tienda cuesta 1 oro más.' },
  {
    level: 4,
    name: 'Corona IV',
    icon: '👑👑👑👑',
    description: 'La recompensa de oro por Duelo baja un 25%.',
  },
];

export const MAX_CROWN = CROWNS.length;

export function crownAtLevel(level: number): Crown | undefined {
  return CROWNS.find((c) => c.level === level);
}
