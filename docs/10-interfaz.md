# 10 — Interfaz: pantallas y conceptos

Define el **mapa de pantallas** y el vocabulario de UI para que la interfaz tenga sentido desde el Hito 0 y escale hasta el juego completo. Regla de diseño: **la interfaz enseña el juego** — cada pantalla introduce un concepto y esconde los que aún no tocan (desbloqueo gradual, ver [06](06-progresion-meta.md)).

---

## 1. Conceptos de interfaz (vocabulario)

| Concepto | Qué es | Equivalente Balatro |
|---|---|---|
| **El Salón** | pantalla de título / menú principal del "salón de juegos" | Main Menu |
| **Preparación de Run** | elegir **Modo** (juego) + **Ejército inicial** (+ **Corona** más adelante) | selección de Deck + Stake |
| **Tienda** | entre Duelos: comprar Estandartes, **forjar** fichas, rerollar | the Shop |
| **Forja** | cambiar una ficha por otra de su **misma casta** pagando oro | — (aporte propio) |
| **Duelo** | la pantalla de combate: tablero + HUD de Presión | la mano jugándose |
| **Resultado** | pantalla de fin de run (venciste al Jefe / caíste) | win/lose screen |
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
      ┌────────► TIENDA ◄──────────┐   (comprar Estandartes · Forja · reroll)
      │             │              │
      │             ▼              │
      │          DUELO ── ganas ───┘   (×3: Menor → Mayor → JEFE)
      │             │
      │          pierdes / vences al Jefe
      │             ▼
      └────────  RESULTADO ──► Salón
             (tablero + HUD)             │
                    ▲                    │
                    └────────────────────┘
```

- **Actual (Hito 1 en curso):** Preparación → **run de 3 Duelos** (Menor → Mayor → JEFE) con una **Tienda** antes de cada Duelo. Ganar da oro; perder cualquier Duelo termina el run. El `RunScreen` posee el estado del run (roster, oro, Estandartes) y orquesta las transiciones.
- **Siguiente:** Actos múltiples, cláusulas de Jefe, y persistir/continuar un run desde el Salón.

## 3. Qué muestra cada pantalla hoy (Hito 0)

### El Salón (`SalonScreen`)
Título + tres acciones: **Jugar**, **Compendio**, **Opciones** (deshabilitado). Es deliberadamente mínimo: la primera decisión del jugador nuevo es una sola (Jugar).

### Preparación de Run (`RunSetupScreen`)
- **Modo:** cartas de juego desde el catálogo `MODES` (`src/game/modes.ts`): Ajedrez jugable; Damas y Ludo bloqueados con su pista ("gana tu primer run de Ajedrez" / "en diseño").
- **Ejército inicial:** cartas desde `ARMIES` ([06](06-progresion-meta.md)): Clásico jugable; Enjambre/Realeza/Mercader bloqueados con pistas.
- Aviso honesto de alcance ("el run es un único Duelo de prueba") + **Empezar Duelo**.
- Futuro: selector de **Corona** (dificultad) cuando exista la meta-progresión real.

### Tienda (`ShopScreen`)
Entre Duelos. Tres bloques: **Estandartes** (2 ofertas con RNG por semilla, comprar por oro, slots limitados, **reroll**), **Forja** (tu ejército agrupado por tipo; eliges una ficha y la cambias por otra de su misma **casta**, pagando según la casta), y **Continuar** al siguiente Duelo. Cabecera con el oro. La lógica pura vive en `src/game/run.ts`.

### Fichas (render `src/render/pieces.ts`)
Las piezas se dibujan con estética **low-poly**: cada una es una "moneda" facetada (caras de luz/sombra desde arriba-izquierda) con un **emblema geométrico** vectorial encima y una sombra proyectada. Las piezas **heréticas** llevan un **aro dorado** que las hace destacar como especiales/coleccionables. Todo es vectorial (PixiJS Graphics), sin glifos de texto, y data-driven: añadir una ficha = registrar su emblema en `EMBLEMS`. (El Compendio y la Tienda aún muestran los glifos Unicode del `GameDef`; migrarlos a mini-fichas low-poly es un pendiente.)

### Duelo (`DuelScreen`)
Tablero PixiJS + **HUD**: subtítulo del Duelo (ej. "Rival Menor · Duelo 1/3"), **oro**, barra de Presión (actual/meta), turnos (usados/límite), **chips de Estandartes** equipados (tooltip con su efecto), **desglose de la última jugada** (`Base × Mult = total` con sus notas: "Captura: Torre +5 base", "🏹 Cazador +2 mult", "Cadena de 3 ×3 mult"…), banner de victoria/derrota, y al terminar un botón **Continuar →** (a la tienda o al resultado). El texto de ayuda sale del `GameDef` activo (`game.hint`), así cada juego explica el suyo.

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
