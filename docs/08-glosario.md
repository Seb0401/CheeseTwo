# 08 — Glosario y Decisiones Abiertas

## Términos del juego

| Término | Significado |
|---|---|
| **Run** | una partida roguelike completa, de principio a fin |
| **Duelo** | un combate individual de ajedrez con meta de Presión |
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

## Decisiones aún abiertas

5. **Nombre definitivo:** "CheeseTwo" es el nombre de trabajo (ver candidatos arriba).
6. **Tickets:** ¿recurso de run o de meta? (recomendado: meta).
7. **Tutorial:** ¿ajedrez simplificado en mini-tablero o 8×8 con tooltips? (recomendado: mini-tablero).
8. **Tono estético:** A (coleccionista), B (arcano), C (absurdo/humor). (recomendado: A + juice de B/C).
9. **Mate instantáneo:** ¿remate con bonus o Duelo *solo* de Presión? (recomendado: mantenerlo, con bonus que no lo haga siempre óptimo).

## Cómo evolucionará este documento

Estos docs son un punto de partida vivo. A medida que decidamos las preguntas abiertas y prototipemos, hay que:
- fijar valores concretos de Base/Mult tras probar el Hito 0,
- convertir las listas de ideas (jokers, poderes, piezas) en **tablas de datos** reales,
- mover balance a hojas/telemetría.
