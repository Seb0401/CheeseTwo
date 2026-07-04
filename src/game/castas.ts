// Castas: rangos de pieza que agrupan fichas de poder similar.
// Regla de la Forja (tienda): solo se intercambia una pieza por otra de su MISMA
// casta — así el oro compra variedad, no poder bruto (un peón nunca se vuelve dama).
// Ver docs/04 (piezas) y docs/10 (interfaz).

export interface CastaInfo {
  id: string;
  name: string;
  icon: string;
  /** Coste en oro de forjar (cambiar) una pieza de esta casta en la tienda. */
  forgeCost: number;
}

export const CASTAS: Record<string, CastaInfo> = {
  infanteria: { id: 'infanteria', name: 'Infantería', icon: '♟', forgeCost: 2 },
  menor: { id: 'menor', name: 'Menor', icon: '♞', forgeCost: 4 },
  mayor: { id: 'mayor', name: 'Mayor', icon: '♜', forgeCost: 6 },
  elite: { id: 'elite', name: 'Élite', icon: '♛', forgeCost: 9 },
};

export function castaOf(id: string | undefined): CastaInfo | undefined {
  return id ? CASTAS[id] : undefined;
}
