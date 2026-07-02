# 07 — Roadmap Técnico

Objetivo: llegar rápido a un **prototipo jugable** que valide el bucle, sin sobre-construir sistemas antes de saber si son divertidos.

---

## Stack elegido ✅

**TypeScript + React (UI) + PixiJS (tablero).** Web-first, portable a desktop con Tauri.

- **React** → menús, tienda, cartas, HUD, todo lo que es UI declarativa.
- **PixiJS** → render del tablero y piezas (Canvas/WebGL), animaciones y *juice*.
- **TypeScript** en todo → el motor de juego es TS puro y tipado.
- **Tauri** (más adelante) → empaquetado a desktop ligero.

Pila concreta sugerida para arrancar:
- **Vite** como bundler/dev server (HMR instantáneo).
- **Vitest** para tests del motor.
- **Zustand** (o Redux Toolkit) para estado de UI/meta; el estado *del juego* vive en el motor, no en React.
- **pnpm** como gestor de paquetes.
- **ESLint + Prettier**.

Estructura de carpetas propuesta:
```
/src
  /engine        ← motor de reglas: TS PURO, sin React ni Pixi, determinista
    /geometry    ← grafo de casillas (soporta 8x8, hex, 3D)
    /pieces      ← definiciones data-driven
    /effects     ← sistema eventos→efectos (jokers, poderes)
    /scoring     ← cálculo de Presión
    /ai          ← rivales: heurística (MVP) + minimax (modo puro)
  /game          ← orquestación de run/duelo/tienda (usa engine)
  /render        ← capa PixiJS (dibuja el estado del engine)
  /ui            ← componentes React (tienda, HUD, menús)
  /content       ← datos: piezas, jokers, planetas, tarots (JSON/TS)
  /net           ← (stub) hooks para PvP futuro — ver nota abajo
/tests
```

## Nota PvP (alcance: SP primero, hooks desde ya)

El juego es single-player al inicio, pero se decidió **dejar preparados los hooks para PvP asíncrono**. Cómo hacerlo sin sobre-ingeniería:

- Mantener el motor **determinista** y dirigido por una **lista de acciones/comandos** (no por mutaciones directas). Un Duelo = estado inicial + secuencia de comandos → esto hace triviales replays *y* validación de partidas PvP en servidor después.
- Serializar el ejército/build a un formato de datos limpio (un "roster" exportable) → base para PvP asíncrono con ejércitos construidos.
- Aislar cualquier acceso a red tras una interfaz en `/net` (stub local por ahora). No construir backend todavía.

> No se construye red en el MVP; solo se evita tomar decisiones que la imposibiliten (estado no determinista, lógica en la UI, etc.).

## Principio de arquitectura #1: separa REGLAS de PRESENTACIÓN

El **motor de juego** (estado, movimientos legales, resolución de poderes, cálculo de Presión) debe ser **lógica pura, sin render**, y **determinista** (mismo estado + misma jugada → mismo resultado). Beneficios: testeable, replays, IA, y poder cambiar el render sin tocar reglas.

## Principio de arquitectura #2: geometría parametrizada

No hardcodees "8×8". Modela el tablero como un **grafo de casillas** y los movimientos como **reglas sobre direcciones/vectores**. Así 8×8, 10×10, hex y (con más trabajo) 3D comparten motor. Esto es lo que hace viable la evolución de tableros.

## Principio de arquitectura #3: contenido dirigido por datos (data-driven)

Piezas, poderes, clases, jokers, planetas, tarots → definidos en **datos** (JSON/recursos), no en código. Un "poder" es un conjunto de *efectos* que reaccionan a *eventos* (onCapture, onMove, onTurnStart, onScore). Así puedes añadir 200 cartas sin reescribir el motor, y balancear tocando números.

> Este sistema de **eventos + efectos** es el núcleo técnico del juego (igual que el motor de jokers de Balatro). Diséñalo bien y todo lo demás es contenido.

## Alcance por hitos

### 🥚 Hito 0 — Prototipo del bucle (validar diversión)
- Un solo tablero 8×8 (o 6×6), reglas de ajedrez básicas.
- Sistema de **Presión** funcionando (base × mult, meta, límite de turnos).
- Rival simple (heurística tonta o scripts).
- **3-5 Jokers** y **2-3 poderes** hardcodeados para probar sinergias.
- Un Duelo → una "tienda" mínima → otro Duelo. Sin arte, todo placeholder.
- **Meta del hito:** responder "¿es divertido acumular Presión y combinar 2 cartas?". Si no, iterar aquí antes de seguir.

### 🐣 Hito 1 — Un run completo
- Estructura de Acto (Menor/Mayor/Jefe) + cláusulas de Jefe.
- Tienda real con oro, rerolls, slots de Joker.
- 15-20 Jokers, 8-10 poderes, sistema de clases básico, mejoras de pieza.
- Motor **data-driven** (mover el contenido a datos).
- Pantalla de derrota/victoria + 1 desbloqueo meta.

### 🐥 Hito 2 — Profundidad y variedad
- Planetas, Tarots, Espectros.
- Ejércitos iniciales múltiples + dificultad ascendente.
- Casillas especiales / terreno (primer paso de evolución de tablero).
- Compendio/colección.

### 🐔 Hito 3 — Expansión de tableros
- Tableros grandes, formas raras, hexagonal.
- (Post-lanzamiento) 3D y multi-jugador.

## Testing y balance

- **Tests unitarios del motor** desde el hito 0 (legalidad de movimientos, cálculo de Presión, resolución de efectos). Es lo que evita que el juego se rompa al añadir cartas.
- **Simulación / autoplay** para balance: bots que juegan miles de runs y reportan win-rate por build → detectar combos rotos (a lo Balatro).
- **Telemetría** de qué compra y usa la gente.

## Primeros pasos concretos (cuando quieras arrancar a programar)

1. `pnpm create vite` (plantilla React + TS) + configurar Vitest, ESLint/Prettier, PixiJS.
2. Modelar `EstadoDeJuego`, `Casilla`, `Pieza`, `Movimiento` como datos puros en `/engine`.
3. Generar movimientos legales para las 6 piezas clásicas.
4. Implementar el cálculo de **Presión** sobre una jugada.
5. Meta de Presión + límite de turnos + condición de victoria/derrota.
6. UI mínima para hacer clic y mover. → **Ya tienes el Hito 0.**
