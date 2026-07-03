# 08 — Glosario y Decisiones Abiertas

## Términos del juego

| Término | Significado |
|---|---|
| **Run** | una partida roguelike completa, de principio a fin |
| **Modo** | juego clásico jugable como run (ajedrez, damas, ludo…); ver [09](09-otros-juegos.md) |
| **GameDef** | contrato técnico que define un juego dentro del motor multi-juego |
| **Duelo** | un combate individual (de cualquier modo) con meta de Presión |
| **Presión** | el puntaje que generas jugando; motor de toda la economía |
| **Meta de Presión** | umbral que hay que alcanzar para ganar un Duelo |
| **Base / Mult** | componentes de la Presión (fichas × multiplicador) |
| **Rival** | oponente de un Duelo (Menor / Mayor / Jefe) |
| **Cláusula** | regla que impone un Jefe para estorbarte |
| **Acto** | grupo de Duelos que termina en un Jefe |
| **Clase** | arquetipo/loadout de poderes de una pieza |
| **Poder** | habilidad concreta de una pieza |
| **Estandarte** | nombre propuesto para las cartas tipo "Joker" |
| **Ejército inicial** | equivalente a una "baraja" de Balatro |
| **Corona** | nivel de dificultad ascendente |
| **El Salón** | menú principal del salón de juegos; ver [10](10-interfaz.md) |
| **Preparación de Run** | pantalla de elegir Modo + Ejército antes de jugar |
| **Compendio** | colección global; lo no visto aparece como silueta "?" hasta *descubrirse* jugando |

## Nombres candidatos para el juego

La carpeta se llama **CheeseTwo** (juego de palabras Chess/Cheese). Opciones:
- **CheeseTwo / Chess Two** — mantener el nombre de trabajo, simpático y memorable.
- **Gambito** — evoca ajedrez + apuesta/riesgo (encaja con la economía).
- **Jaque Roto / Broken Check** — apunta al fantasy de "romper el ajedrez".
- **Coronación** — tema de promoción/progresión.
- **Peón & Planeta** — guiña a las cartas de recursos.

> Decisión pendiente. "CheeseTwo" es un buen nombre de trabajo; el humor puede volverse identidad (dirección estética C).

## Decisiones tomadas ✅

1. **Stack:** TypeScript + React + PixiJS (web-first, Tauri para desktop). [ver 07](07-roadmap-tecnico.md#stack-elegido-).
2. **Rival:** híbrido — encuentros diseñados (heurística) para el MVP + IA real (minimax) en modo "puro" post-MVP. [ver 02](02-mecanicas-core.md#5-el-rival-enfoque-híbrido--decidido).
3. **Alcance:** single-player primero, con hooks de arquitectura para PvP asíncrono futuro. [ver 07](07-roadmap-tecnico.md#nota-pvp-alcance-sp-primero-hooks-desde-ya).
4. **Repositorio:** público en GitHub.
5. **Multi-juego:** el proyecto es un *salón de juegos roguelike* — modos separados por juego (damas, ludo…) con meta/colección compartida, Presión como métrica universal, y damas como siguiente juego en código. [ver 09](09-otros-juegos.md).

## Decisiones aún abiertas

6. **Nombre definitivo:** "CheeseTwo" es el nombre de trabajo (ver candidatos arriba).
7. **Tickets:** ¿recurso de run o de meta? (recomendado: meta).
8. **Tutorial:** ¿ajedrez simplificado en mini-tablero o 8×8 con tooltips? (recomendado: mini-tablero).
9. **Tono estético:** A (coleccionista), B (arcano), C (absurdo/humor). (recomendado: A + juice de B/C).
10. **Mate instantáneo:** ¿remate con bonus o Duelo *solo* de Presión? (recomendado: mantenerlo, con bonus que no lo haga siempre óptimo).
11. **¿Presión para siempre?** Evaluar *Contratos* (apuestas pre-Duelo) como capa encima de la Presión tras el Hito 1. [ver 09 §6](09-otros-juegos.md#6-presión-para-siempre--métricas-universales-alternativas).

## Cómo evolucionará este documento

Estos docs son un punto de partida vivo. A medida que decidamos las preguntas abiertas y prototipemos, hay que:
- fijar valores concretos de Base/Mult tras probar el Hito 0,
- convertir las listas de ideas (jokers, poderes, piezas) en **tablas de datos** reales,
- mover balance a hojas/telemetría.
