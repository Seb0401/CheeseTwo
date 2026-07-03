# 09 — Plataforma Multi-juego: Damas, Ludo y más

CheeseTwo crece de "ajedrez roguelike" a **salón de juegos de mesa roguelike**: cada juego clásico (ajedrez, damas, ludo…) es un **modo de run** con las mismas palancas — Presión, tienda, cartas, sinergias — y con mecánicas nuevas que lo hacen coleccionable y rejugable.

**Decisiones tomadas ✅**
- **Modos separados, meta compartida.** Cada juego es su propio run (como los personajes de Slay the Spire), pero colección, compendio y desbloqueos son globales. Un modo mixto (runs que combinan juegos) queda como posible desbloqueo endgame; la arquitectura no lo impide.
- **Presión universal.** Todos los juegos puntúan con `Base × Mult` y sus propias tablas de acciones, para que las cartas compartidas funcionen en todos. Queda abierta la búsqueda de una métrica aún más divertida (ver §6) — cualquier reemplazo debe ser también universal.
- **Damas es el siguiente juego en código.** Ludo se diseña ya, se implementa después (necesita azar con semilla y 4 asientos).

---

## 1. Qué convierte un juego clásico en un modo CheeseTwo

Regla de diseño (hermana de la de tableros): **un juego nuevo debe traer una fantasía de build propia, no solo reglas distintas.** En ajedrez la fantasía es "mi ejército evoluciona"; cada juego necesita la suya:

| Juego | Fantasía de build |
|---|---|
| Ajedrez | *general*: piezas con clases y poderes |
| Damas | *combero*: cadenas de captura como combos que disparan el mult |
| Ludo | *tramposo del destino*: manipular el azar con dados coleccionables |

### Checklist de diseño para añadir un juego

1. **Tabla de Presión propia:** qué acciones generan base (capturas, avances, metas parciales).
2. **Mecánica estrella:** el gancho que la Presión amplifica (cadenas en damas, dados en ludo).
3. **3+ mecánicas nuevas** sobre las reglas clásicas (poderes de pieza, terreno, recursos).
4. **Jokers propios** + revisar qué **jokers universales** aplican tal cual.
5. **Cláusulas de jefe** que fuercen a cambiar la build.
6. **Encaje en la meta compartida:** cómo se desbloquea el modo y qué aporta al compendio.

### Checklist técnico (el contrato `GameDef`)

El motor ya es multi-juego: el núcleo (Duelo, Presión, IA voraz, render) es agnóstico y cada juego implementa `GameDef` en `src/engine/games/`:

- `pieces` — catálogo data-driven (nombre, valor de captura, glifo, si es pieza *objetivo*).
- `createInitialBoard()` — posición inicial.
- `movesFrom(board, from)` — generación de movimientos.
- `pressureForMove(move)` — la tabla de Presión del juego.
- `applyToBoard?` — transformaciones especiales (coronaciones, capturas múltiples).
- `winsOnMove?` — victoria inmediata propia del juego (además de capturar la pieza objetivo y de la meta de Presión).

> Añadir un juego = un archivo nuevo + registrarlo en `GAMES`. El resto (HUD, tablero, IA básica, tests del núcleo) funciona sin cambios.

## 2. Meta compartida entre modos

- **Compendio único:** piezas/cartas/dados de todos los juegos en una sola colección.
- **Desbloqueos cruzados:** "gana tu primer run de ajedrez" desbloquea el modo damas; retos de un juego dan cartas para otro. Esto empuja a probar todos los modos.
- **Cartas universales vs. específicas:** cada carta lleva etiqueta de juego. Las universales hablan el idioma de la Presión ("+2 mult a capturas") y valen en todo; las específicas hablan el idioma del juego ("+1 mult por salto de cadena").
- **Oro y economía viven dentro del run** (no se comparten entre runs ni entre modos); lo que persiste es colección y desbloqueos, como en Balatro.

## 3. Damas Roguelike (siguiente en código)

### Base clásica

Damas **8×8 sobre casillas oscuras** (variante anglosajona como base, por simplicidad): fichas que avanzan en diagonal, capturan saltando, encadenan saltos y **coronan** a Dama al llegar al fondo. **La captura es obligatoria** — se mantiene, porque los sacrificios forzados son el alma táctica de las damas (y dan diseño de cláusulas y cartas: ver "Desobediencia").

### Tabla de Presión (borrador)

| Acción | Base sugerida |
|---|---|
| Capturar ficha | 2 |
| Capturar Dama | 6 |
| Coronar | +8 |
| Cada salto extra de una cadena | ver mult ↓ |
| Llegar a la mitad rival (por ficha, una vez) | +1 |

**La mecánica estrella: cadenas = combo.** Una cadena de captura resuelve todos sus saltos como **una sola jugada** cuyo mult crece con cada salto: `mult = 1 + (saltos − 1)`. Capturar 3 fichas en cadena = `(2+2+2) × 3 = 18`. Toda la build de damas gira en torno a **fabricar cadenas** — y los jokers lo amplifican.

### Mecánicas nuevas (mínimo viable: 3)

1. **Clases de ficha:** *Saltadora* (puede saltar fichas propias sin capturarlas), *Pesada* (no puede ser capturada por fichas simples, pero no encadena), *Chispa* (al ser capturada, genera +2 de Presión para ti).
2. **Coronación con elección:** al coronar eliges entre Dama clásica o una **corona especial** desbloqueada (Dama Fantasma: atraviesa 1 ficha; Dama Imán: atrae fichas rivales 1 casilla al final del turno).
3. **Terreno heredado del ajedrez:** casillas +mult, portales y muros funcionan tal cual (mismo motor).

### Jokers propios (ideas)

- **"Dominó":** +1 mult por cada ficha propia en una misma diagonal continua.
- **"Desobediencia":** una vez por Duelo puedes ignorar una captura obligatoria (rompe trampas rivales).
- **"Eco":** la primera cadena de cada Duelo cuenta sus saltos dos veces para el mult.

### Cláusulas de jefe (ideas)

- **"Marea":** cada 4 turnos, la fila trasera rival repone una ficha.
- **"Suelo pegajoso":** tus cadenas se cortan a un máximo de 2 saltos.
- **"Ley del talión":** cuando capturas fuera de cadena, el rival recupera una ficha capturada.

### Notas técnicas

- `Move` necesita generalizar `captured` a **lista de capturas + camino** (`captures: Piece[]`, `path: SquareIndex[]`) para las cadenas; el ajedrez seguirá usando una sola. Es el único cambio previsto en el núcleo.
- `winsOnMove`: dejar al rival sin fichas (o sin movimientos) gana el Duelo.
- La captura obligatoria se implementa filtrando `movesFrom` a nivel del juego (el núcleo no cambia).
- La IA voraz genérica ya prioriza capturas por valor; con las cadenas puntuando más, funciona como rival Menor sin trabajo extra.

## 4. Ludo Roguelike (diseño ahora, código después)

### Base clásica

Carrera de 4 fichas por un circuito con casa, salida, casillas seguras y meta. Tiras dado, avanzas, **comes** fichas rivales que caen en tu casilla (vuelven a su casa). En el run single-player: tú contra 1-3 rivales IA con personalidades.

### La fantasía: trampear al destino

En ludo el azar manda — así que la colección gira en torno a **domar los dados**:

- **Dados coleccionables** (slot de equipo, como los jokers): *Dado Par* (solo 2/4/6), *Dado Gemelo* (repite la tirada anterior si quieres), *Dado Codicioso* (+2 al valor, pero al sacar 1 pierdes el turno), *Dado Partido* (divide la tirada entre dos fichas).
- **Fichas con poderes:** *Escudo* (no puede ser comida en su primera vuelta), *Vampira* (comer le da +1 movimiento inmediato), *Gemela* (al salir de casa, salen dos).
- **Terreno del circuito:** atajos desbloqueables, casillas +mult, casillas trampa.

### Tabla de Presión (borrador)

| Acción | Base sugerida |
|---|---|
| Comer una ficha rival | 5 |
| Meter una ficha en la meta | 8 |
| Sacar ficha de casa | 1 |
| Caer en casilla segura con rival adyacente | +1 |
| Escapar de una ficha que podía comerte | +2 |

La meta de Presión sustituye al "gana la carrera" binario: puedes ganar el Duelo **dominando** (comiendo, presionando) aunque no metas las 4 fichas — igual que el mate no es la única vía en ajedrez.

### Cláusulas de jefe (ideas)

- **"Casa embrujada":** tus fichas comidas tardan 2 turnos en poder volver a salir.
- **"Dado de plomo":** tus 6 no repiten turno.
- **"Alianza":** dos rivales IA nunca se comen entre sí (hasta que uno de ellos te coma a ti).

### Retos técnicos (por eso va después de damas)

1. **Azar con semilla:** el motor debe seguir siendo determinista → RNG con semilla dentro del `DuelState` (necesario igualmente para todo el roguelike: tienda, cartas). Es el primer trabajo previo.
2. **Más de 2 asientos:** generalizar `Color` a `Seat` (n jugadores) — también lo necesita el ajedrez multi-jugador del doc 05, así que el trabajo se amortiza.
3. **Turno ≠ mover pieza:** el turno de ludo es "tira dado → elige ficha", una acción en dos fases. Encaja en la arquitectura de **comandos** ya prevista para replays/PvP.

## 5. Otros candidatos (backlog, sin diseñar)

| Juego | Gancho roguelike en una línea |
|---|---|
| **Reversi/Othello** | conversiones en masa como combos; Presión por fichas volteadas de una jugada |
| **Backgammon** | comparte con ludo el motor de dados/carrera; apuestas con el cubo como mecánica de riesgo |
| **Dominó** | cadenas literales; la mano como "mazo" que se draftea |
| **Go (mini 9×9)** | territorio como Presión por turno; alto riesgo de complejidad — solo si el resto funciona |

## 6. ¿Presión para siempre? — métricas universales alternativas

La Presión es la métrica v1 y todo se diseña sobre ella. Pero queda registrada la búsqueda de algo aún más divertido. Criterios que **cualquier** candidata debe cumplir:

1. Universal: tiene sentido en todos los juegos del salón.
2. Modificable por cartas (la palanca de la economía).
3. Crea metas intermedias (no depende de ganar la partida clásica).
4. Legible en 1 frase para un jugador nuevo.

**Candidatas anotadas:**

- **Contratos (apuestas):** antes del Duelo eliges promesas ("capturaré 3 fichas en cadena", "coronaré antes del turno 10"); cumplirlas multiplica la recompensa. *Aditiva: puede montarse ENCIMA de la Presión sin reemplazarla — es la candidata a prototipar primero.*
- **Tempo:** las acciones generan/gastan tiempo y el Duelo es contra un reloj de arena común; las cartas roban o congelan tempo. Más radical, cambia la sensación de todo el juego.
- **Racha global:** un combo persistente que crece con cada jugada "buena" y se rompe al fallar (muy arcade). Riesgo: castiga jugar posicional.

**Decisión:** la Presión se mantiene; **prototipar Contratos como capa opcional** cuando el Hito 1 esté jugable, y evaluar con playtesting si merece subir a mecánica central. Revisitar tras validar la primera hora de juego.

## 7. Secuencia recomendada

1. ✅ Motor multi-juego (`GameDef`) con el ajedrez como primer juego — hecho.
2. **Damas jugable** como segundo `GameDef` (cadenas + captura obligatoria + coronación). Valida que "un juego nuevo = contenido, no motor".
3. Hito 1 del roguelike (run completo) **sobre ajedrez**, con la tienda/cartas ya etiquetadas por juego.
4. Selección de modo al iniciar run (ajedrez / damas) + desbloqueo cruzado.
5. RNG con semilla + asientos N → **Ludo**.
6. Prototipo de **Contratos** sobre la Presión.
