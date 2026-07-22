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
| **3D (multi-capa)** ✅ | movimiento vertical entre planos | ⭐⭐⭐⭐ |
| **Multi-jugador (3-4 bandos)** | alianzas, rey compartido, turnos rotados | ⭐⭐⭐⭐ |
| **Con terreno** | casillas especiales: fuego, portal, muro, +mult | ⭐⭐⭐ |

## Notas por tablero exótico

### Hexagonal
- Cada pieza necesita **redefinir su movimiento** en 6 direcciones. Trabajo de diseño real, pero muy distintivo.
- Los poderes posicionales (adyacencias, líneas) cambian de sabor.

### 3D (multi-capa) ✅ implementado — "Ajedrez 3D" (`src/engine/games/tridchess.ts`)

Adaptación del ajedrez tridimensional de Bartmess/Star Fleet Technical Manual (el de Star Trek): 7 tableros en 5 niveles — 3 principales 4×4 apilados (Bottom/Middle/Top) + 4 "Attack Boards" 2×2 en las esquinas —, 64 casillas en total, igual que el ajedrez clásico.

- **Movimiento real en 3D:** torres y damas se deslizan también en el eje vertical; los alfiles ganan diagonales de 3 ejes ("triagonales", cambian file+rank+level a la vez) además de las diagonales planas de cada par de ejes; los caballos saltan combinando cualquier par de ejes, así que pueden cambiar de nivel (incluso saltarse un tablero entero); los peones "suben" a través de los 3 tableros principales como una escalera continua (12 escalones) y coronan al llegar al tablero rival.
- **Mecánica estrella:** el Middle board arranca vacío — territorio neutral disputado — y aterrizar ahí da un bonus de Presión, empujando a pelear por el centro vertical.
- **Simplificación deliberada:** los Attack Boards NO se deslizan ni rotan durante el Duelo (a diferencia del juego original) — el motor asume un tablero fijo por Duelo, y soportar tableros móviles habría significado una reescritura grande e incierta. Lo que se mantiene fiel es la posición inicial real y el movimiento en 3D, que es el corazón táctico del juego.
- **Render:** como el tablero no es una rejilla 8×8, `GameDef.layout` (nuevo, opcional) le dice a `BoardView` dónde dibujar cada casilla — los 3 tableros principales se muestran lado a lado con los Attack Boards en sus esquinas, sin piezas 3D (ver [interfaz](10-interfaz.md)).
- Riesgo de legibilidad: mitigado dibujando el "mapa desplegado" de los 7 tableros en 2D en vez de una cámara 3D real.

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
