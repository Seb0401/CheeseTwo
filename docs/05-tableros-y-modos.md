# 05 — Tableros y Modos

La evolución del **tablero** es la capa de rejugabilidad "macro". Empieza en 8×8 clásico y se abre. Regla de diseño: **un tablero nuevo debe cambiar cómo piensas, no solo cómo se ve.**

> Este doc cubre variantes de tablero **dentro del ajedrez**. Los **otros juegos** del salón (damas, ludo, …) — que reutilizan estas ideas de terreno y geometría — viven en [09-otros-juegos.md](09-otros-juegos.md).

---

## Filosofía de introducción

- **Run 1 = tutorial:** ajedrez normal (o simplificado, ver abajo). Cero piezas raras, cero cartas. Solo se enseña "Presión" sobre reglas conocidas.
- Los tableros nuevos se **desbloquean** en meta-progresión y aparecen como **Actos** más avanzados o como **modificadores de run** elegibles.

## Ajedrez simplificado (posible tutorial / primeros pasos)

Para bajar la barrera de entrada antes del 8×8 completo:
- **Mini 5×5 ("Silverman"/Gardner-like):** sin dama o con set reducido. Partidas cortas, ideal para enseñar Presión.
- **Solo peones + un tipo de pieza:** enseña un mecanismo a la vez.
- Decisión abierta: ¿el tutorial ES un ajedrez simplificado, o el 8×8 normal con tooltips? Recomiendo **mini-tablero** para que el primer combate dure 1-2 min.

## Catálogo de tableros

| Tablero | Qué cambia | Complejidad |
|---|---|---|
| **8×8 clásico** | base | ⭐ |
| **Simplificado 5×5 / 6×6** | partidas cortas, tutorial | ⭐ |
| **Grandes (10×10, 12×12)** | más piezas, builds de enjambre | ⭐⭐ |
| **Formas raras (cruz, círculo, con huecos)** | rutas y bloqueos no triviales | ⭐⭐ |
| **Hexagonal (Gliński)** | 6 direcciones, re-piensa cada pieza | ⭐⭐⭐ |
| **3D (multi-capa)** | movimiento vertical entre planos | ⭐⭐⭐⭐ |
| **Multi-jugador (3-4 bandos)** | alianzas, rey compartido, turnos rotados | ⭐⭐⭐⭐ |
| **Con terreno** | casillas especiales: fuego, portal, muro, +mult | ⭐⭐⭐ |

## Notas por tablero exótico

### Hexagonal
- Cada pieza necesita **redefinir su movimiento** en 6 direcciones. Trabajo de diseño real, pero muy distintivo.
- Los poderes posicionales (adyacencias, líneas) cambian de sabor.

### 3D (multi-capa)
- Modelo recomendado para empezar: **N tableros 8×8 apilados** con reglas de movimiento vertical limitadas (no full 3D libre, es ingobernable). Piezas ganan "movimiento entre capas" como poder.
- Riesgo: legibilidad. Necesita muy buena UI/cámara. Considerar dejarlo para post-MVP.

### Multi-jugador (3-4 bandos)
- En un run single-player, los otros bandos son rivales IA que también luchan entre sí → política y caos.
- La Presión se puede ganar por capturar a **cualquier** bando.
- Gran fuente de momentos memorables, pero complejo de balancear. Post-MVP.

### Terreno / casillas especiales
- La forma más barata de variar sin reinventar el movimiento: casillas que dan +mult, portales que teletransportan, muros destructibles, casillas de fuego que dañan.
- Recomendado como **primer paso de "evolución del tablero"** porque es fácil de implementar sobre el 8×8 y ya se siente distinto.

## Recomendación de secuencia de desarrollo

1. **8×8 clásico** (MVP).
2. **Casillas especiales / terreno** (máximo impacto, mínimo costo).
3. **Tableros grandes y formas raras** (reusa el motor 2D).
4. **Hexagonal** (requiere motor de movimiento parametrizado).
5. **3D y multi-jugador** (proyectos grandes, post-lanzamiento).

> Consejo de arquitectura: diseña el **motor de movimiento desacoplado de la geometría** desde el día 1 (ver [roadmap técnico](07-roadmap-tecnico.md)). Si el movimiento se define como "vectores sobre un grafo de casillas", pasar de 2D a hex a 3D es mucho menos doloroso.
