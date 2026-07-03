# 10 — Interfaz: pantallas y conceptos

Define el **mapa de pantallas** y el vocabulario de UI para que la interfaz tenga sentido desde el Hito 0 y escale hasta el juego completo. Regla de diseño: **la interfaz enseña el juego** — cada pantalla introduce un concepto y esconde los que aún no tocan (desbloqueo gradual, ver [06](06-progresion-meta.md)).

---

## 1. Conceptos de interfaz (vocabulario)

| Concepto | Qué es | Equivalente Balatro |
|---|---|---|
| **El Salón** | pantalla de título / menú principal del "salón de juegos" | Main Menu |
| **Preparación de Run** | elegir **Modo** (juego) + **Ejército inicial** (+ **Corona** más adelante) | selección de Deck + Stake |
| **Duelo** | la pantalla de combate: tablero + HUD de Presión | la mano jugándose |
| **HUD** | panel lateral del Duelo: Presión/meta, turnos, acciones | marcador fichas × mult |
| **Compendio** | la colección global: piezas, cartas, modos — descubiertos u ocultos | Collection |
| **Descubrir** | un elemento visto por primera vez jugando pasa de silueta "?" a carta visible | descubrir jokers |
| **Bloqueado 🔒** | contenido existente pero no desbloqueado; muestra su **pista de desbloqueo** | "Locked: win a run with..." |

Reglas transversales:

- **Todo lo no descubierto se muestra como silueta "?"** — la curiosidad es parte de la recompensa. Nunca listas vacías: ranuras misteriosas que prometen contenido.
- **Todo lo bloqueado dice cómo desbloquearse** (pista concreta, no "???"), porque los desbloqueos son objetivos de juego.
- **Placeholder honesto:** lo que aún no existe (Opciones, tienda) aparece deshabilitado con "próximamente", no se oculta — enseña la forma final del juego.

## 2. Mapa de pantallas y flujo

```
            ┌──────────── EL SALÓN ────────────┐
            │  Jugar · Compendio · Opciones     │
            └───────┬───────────────┬──────────┘
                    │               │
                    ▼               ▼
        PREPARACIÓN DE RUN      COMPENDIO
        (Modo → Ejército        (Modos, Piezas por juego,
         → [Corona])             Estandartes, estadísticas)
                    │
                    ▼
                 DUELO  ──────►  [futuro: RECOMPENSA → TIENDA → mapa de Acto]
             (tablero + HUD)             │
                    ▲                    │
                    └────────────────────┘
```

- **Hito 0 (actual):** Preparación → un único Duelo suelto → volver al Salón. Ganar/perder solo actualiza estadísticas y descubrimientos.
- **Hito 1:** entre Duelo y Duelo entran **Recompensa** y **Tienda**, y la Preparación desemboca en un run de verdad (Actos). El Salón gana "Continuar run".

## 3. Qué muestra cada pantalla hoy (Hito 0)

### El Salón (`SalonScreen`)
Título + tres acciones: **Jugar**, **Compendio**, **Opciones** (deshabilitado). Es deliberadamente mínimo: la primera decisión del jugador nuevo es una sola (Jugar).

### Preparación de Run (`RunSetupScreen`)
- **Modo:** cartas de juego desde el catálogo `MODES` (`src/game/modes.ts`): Ajedrez jugable; Damas y Ludo bloqueados con su pista ("gana tu primer run de Ajedrez" / "en diseño").
- **Ejército inicial:** cartas desde `ARMIES` ([06](06-progresion-meta.md)): Clásico jugable; Enjambre/Realeza/Mercader bloqueados con pistas.
- Aviso honesto de alcance ("el run es un único Duelo de prueba") + **Empezar Duelo**.
- Futuro: selector de **Corona** (dificultad) cuando exista la meta-progresión real.

### Duelo (`DuelScreen`)
Tablero PixiJS + **HUD**: nombre del modo, barra de Presión (actual/meta), turnos (usados/límite), banner de victoria/derrota, "Nuevo Duelo" y "Volver al Salón". El texto de ayuda sale del `GameDef` activo (`game.hint`), así cada juego explica el suyo.

### Compendio (`CompendiumScreen`)
- **Chips de estadísticas:** descubierto X/Y, duelos ganados/perdidos.
- **Modos:** los mismos del catálogo, con estado.
- **Piezas por juego jugable:** desde `game.pieces` (data-driven). Descubierta → glifo, nombre, base de captura o insignia "Pieza objetivo". No descubierta → "?" con "Juega un Duelo para descubrirla".
- **Estandartes (Jokers):** 5 ranuras misteriosas "Llegan en el Hito 1" — la promesa visible de la siguiente capa.
- Futuro: secciones de Planetas/Tarots/Espectros, logros y estadísticas de builds ([06](06-progresion-meta.md)).

## 4. Meta-progresión de la UI (persistencia)

`src/game/meta.ts` guarda en `localStorage` lo que persiste entre sesiones (fuera del motor, que sigue puro):

- **`discovered`** — claves `juego/pieza` reveladas en el Compendio. Se descubre **jugando**: al empezar un Duelo se revelan las piezas de su tablero inicial (las futuras piezas raras se revelarán al verlas por primera vez).
- **`duelsWon` / `duelsLost`** — estadísticas.
- Futuro: modos/ejércitos/cartas desbloqueados, Coronas alcanzadas, logros.

## 5. Deudas y siguientes pasos de UI

1. **Recompensa + Tienda** (Hito 1): la pantalla que cierra el bucle económico.
2. **Selector de Corona** en la Preparación cuando exista dificultad ascendente.
3. **Animaciones de Presión** en el HUD (el "juice" de fichas × mult es la recompensa emocional — no escatimar).
4. Accesibilidad: navegación por teclado en el tablero, tamaños de fuente.
