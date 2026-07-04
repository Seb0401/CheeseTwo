# CheeseTwo — Salón de Juegos Roguelike (Working Title)

> Un **salón de juegos de mesa roguelike** que empieza por el ajedrez: run tras run, tu ejército, tus reglas y hasta el tablero evolucionan. Compra piezas, define clases, mejora poderes y combina recursos al estilo *Balatro* — y desbloquea otros juegos clásicos (damas, ludo…) reinventados con las mismas palancas.

---

## 🎯 Visión en una frase

**"Balatro, pero de juegos de mesa" (el primero: ajedrez):** cada combate es una partida donde generas *puntaje* (Presión) capturando y presionando; entre combates gastas los recursos ganados en una tienda para construir un ejército cada vez más roto, con sinergias entre piezas, clases y cartas. Cada juego clásico es un **modo de run** con su propia fantasía de build y una **colección compartida** (ver [docs/09](docs/09-otros-juegos.md)).

## 🧭 Pilares de diseño

1. **Evoluciona desde lo familiar.** El primer contacto es ajedrez de verdad (o una versión simplificada como tutorial). La complejidad se *desbloquea*, no se impone.
2. **El ejército es tuyo.** Compras piezas, las mejoras, defines clases y las llevas de combate en combate dentro de un *run*.
3. **Sinergias sobre estadísticas.** Como en Balatro, lo divertido no es "+1 de daño" sino combos que rompen las reglas (jokers, clases, poderes que interactúan).
4. **Rejugabilidad por capas.** Tableros distintos (2D, hexagonal, 3D, multijugador), otros juegos como modos (damas, ludo), ejércitos iniciales y modificadores hacen que ningún run se sienta igual.
5. **Legible primero, profundo después.** Cada capa nueva se introduce sola; nunca se abruma al jugador con todos los sistemas a la vez.

## 🌀 El bucle central (resumido)

```
INICIO DE RUN  →  elige ejército inicial + tablero
      │
      ▼
   COMBATE (Duelo)  ── genera PRESIÓN capturando/presionando
      │                alcanza la meta antes del límite de turnos
      ▼
   RECOMPENSA  ── oro + cartas
      │
      ▼
    TIENDA  ── compra piezas, jokers, planetas, tarots, mejoras, rerolls
      │
      ▼
  (siguiente combate, más difícil)  ──►  ...  ──►  JEFE  ──►  siguiente Acto
      │
      ▼
  DERROTA o VICTORIA FINAL  →  desbloqueos meta  →  nuevo run
```

## 📚 Documentos de diseño

| Archivo | Contenido |
|---|---|
| [docs/01-concepto.md](docs/01-concepto.md) | Fantasía, público objetivo, referentes, tono |
| [docs/02-mecanicas-core.md](docs/02-mecanicas-core.md) | Sistema de Presión, estructura de un run, combates y jefes |
| [docs/03-economia-recursos.md](docs/03-economia-recursos.md) | Oro, tickets, cartas Planeta / Tarot / Joker / Espectro |
| [docs/04-piezas-poderes-clases.md](docs/04-piezas-poderes-clases.md) | Piezas, poderes, mejoras y sistema de clases |
| [docs/05-tableros-y-modos.md](docs/05-tableros-y-modos.md) | Tableros alternativos: hex, 3D, multijugador, formas raras |
| [docs/06-progresion-meta.md](docs/06-progresion-meta.md) | Desbloqueos, ejércitos iniciales, dificultad, colección |
| [docs/07-roadmap-tecnico.md](docs/07-roadmap-tecnico.md) | Stack, arquitectura, alcance del MVP, hitos |
| [docs/08-glosario.md](docs/08-glosario.md) | Nombres, términos y decisiones abiertas |
| [docs/09-otros-juegos.md](docs/09-otros-juegos.md) | Plataforma multi-juego: marco, Damas, Ludo, métricas alternativas |
| [docs/10-interfaz.md](docs/10-interfaz.md) | Interfaz: mapa de pantallas, Salón, Compendio, descubrimiento |

## 🚦 Estado actual

**Fase: Hito 1 en curso — el bucle roguelike jugable.** Un **run** son **3 Duelos** de dificultad creciente (Rival Menor → Mayor → **JEFE**) con una **Tienda** antes de cada uno. Ganas Duelos generando **Presión** (`Base × Mult` estilo Balatro); el oro se gasta en Estandartes y en **forjar** tu ejército.

El motor es **multi-juego**: el núcleo (Duelo, Presión, IA) es agnóstico y cada juego es un `GameDef` en `src/engine/games/`. Ya hay **dos modos jugables**: **Ajedrez** y **Damas** (con cadenas de captura que multiplican la Presión). Ver [docs/09](docs/09-otros-juegos.md).

Interfaz ([docs/10](docs/10-interfaz.md)): **Salón** → **Preparación de Run** (modo + ejército) → **Tienda ↔ Duelo** ×3 → **Resultado**, más el **Compendio** estilo Balatro donde las piezas se *descubren* jugando (persistencia en localStorage).

Contenido y sistemas ya jugables:
- **6 Estandartes** (jokers) con efectos `Base × Mult` data-driven (`src/engine/banners.ts`); el HUD muestra el **desglose de cada jugada**.
- **Piezas heréticas** coleccionables: Canciller, Arzobispo, Saltamontes, Camello, Cañón, Amazona y Berolina.
- **Castas** (Infantería/Menor/Mayor/Élite) y la **Forja**: cambias una ficha por otra **de su misma casta** pagando oro — un peón nunca se vuelve dama.
- **Fichas low-poly**: piezas vectoriales facetadas (moneda con luz/sombra + emblema), con **aro dorado** en las heréticas para que destaquen (`src/render/pieces.ts`).

### ▶️ Cómo ejecutarlo

```bash
npm install
npm run dev      # servidor de desarrollo (Vite) → abre el link que imprime
npm test         # tests del motor (Vitest)
npm run build    # typecheck + build de producción
```

Desde el **Salón**, entra a *Jugar*, elige modo (Ajedrez o Damas) y ejército, y empieza el run. En la **Tienda** compra Estandartes y **forja** tus fichas; luego juega el Duelo. Juegas con las **blancas**: clic en una pieza y luego en una casilla resaltada. Captura para subir la Presión — el HUD muestra el desglose `Base × Mult` de cada jugada — y alcanza la meta antes de que se acaben los turnos. Las piezas que uses quedan **descubiertas** en el *Compendio*.

### 🗂️ Estructura del código

```
src/
  engine/         ← motor de reglas: TS PURO, determinista, testeable (sin React ni Pixi)
    games/        ← un GameDef por juego (chess.ts, damas.ts)
    scoring.ts    ← Presión = Base × Mult; banners.ts = Estandartes; rng.ts = azar con semilla
  game/           ← run/tienda (run.ts), castas (castas.ts), modos/ejércitos, meta-progresión
  render/         ← capa PixiJS: dibuja el estado del engine, reporta clics
  ui/             ← componentes React
    screens/      ← Salón, Preparación, Tienda, Duelo (RunScreen las orquesta), Compendio
```

> El `engine` no importa nada de `render`/`ui`: esa separación es lo que hará viable añadir tableros, cartas y PvP más adelante. Ver [roadmap técnico](docs/07-roadmap-tecnico.md).

## ✅ Decisiones tomadas

- **Stack:** TypeScript + React (UI/tienda) + PixiJS (tablero). Web-first, portable a desktop con Tauri.
- **Rival:** híbrido — encuentros diseñados con heurística para el roguelike + IA de ajedrez real para un modo "puro"/dificultad extrema. El MVP arranca con encuentros diseñados.
- **Alcance:** single-player roguelike primero, **diseñando desde ya los hooks para PvP asíncrono** con ejércitos construidos.
- **Multi-juego:** modos separados por juego con **meta/colección compartida**; **Presión** como métrica universal (Contratos en evaluación como capa extra); **damas** es el siguiente juego en código, ludo después. Ver [docs/09](docs/09-otros-juegos.md).
- **Repositorio:** público en GitHub.

## ❓ Decisiones aún abiertas

- ¿Nombre definitivo? (ver [glosario](docs/08-glosario.md))
- Tono estético (A coleccionista / B arcano / C absurdo).
- ¿Tickets como recurso de run o de meta?
- ¿Tutorial en mini-tablero o 8×8 con tooltips?
