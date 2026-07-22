# 02 — Mecánicas Core

Este es el documento más importante: define **cómo se gana un combate** y **cómo se estructura un run**. Todo lo demás (economía, piezas, tableros) cuelga de aquí.

---

## 1. El problema a resolver

El ajedrez normal es binario: jaque mate o tablas. Eso no da una "palanca" para una economía tipo Balatro. Necesitamos una métrica continua que:

- suba durante la partida con jugadas buenas,
- se pueda **multiplicar/modificar** con cartas (fichas × mult),
- cree metas intermedias (no depender solo del mate).

Esa métrica es la **Presión**.

## 2. Presión (el motor de puntaje)

Cada **Duelo** (combate) tiene una **Meta de Presión** y un **límite de turnos**. Ganas si alcanzas la meta antes de que se acaben los turnos. También ganas **al instante** si das jaque mate (con bonus grande). Pierdes si te dan mate, o si se acaban los turnos sin llegar a la meta.

### Cómo se genera Presión

Presión de una acción = **`Base × Multiplicador`** (igual que fichas × mult en Balatro).

**Base (fichas)** — valor bruto de la acción:
| Acción | Base sugerida |
|---|---|
| Capturar peón | 1 |
| Capturar caballo/alfil | 3 |
| Capturar torre | 5 |
| Capturar dama | 9 |
| Dar jaque | +2 |
| Promover un peón | +8 |
| Controlar una casilla central (por turno) | +1 |
| Enroque | +3 |

**Multiplicador (mult)** — empieza en `×1` y lo suben **jokers, clases y poderes**. Ejemplos:
- Joker "Cazador": +2 mult a capturas hechas con caballo.
- Clase "Verdugo" en la dama: ×2 mult si captura estando en territorio enemigo.
- Planeta que sube el nivel del "tipo peón": cada captura de peón vale más base.

> **Diseño de la sensación:** el jugador no piensa "voy a dar mate", piensa "voy a montar una jugada que dispare mi mult". El mate sigue existiendo como remate glorioso, pero el 80% de los combates se ganan **acumulando Presión**, lo que da espacio a builds no-ortodoxas.

### Ejemplo de una jugada puntuando

> Caballo (clase *Cazador*) captura una torre en casilla central.
> `Base = 5 (torre) + 1 (centro) = 6`
> `Mult = 1 (base) + 2 (joker Cazador) = 3`
> **Presión ganada = 6 × 3 = 18**

## 3. Estructura de un combate (Duelo)

Un Duelo no es una partida completa hasta el mate; es un **escenario acotado**:

- **Posición inicial:** tu ejército actual vs. el ejército del rival (definido por el rival, ver abajo).
- **Meta de Presión + límite de turnos.**
- **Regla de derrota:** te dan mate, o pierdes tu Rey (en tableros sin mate clásico), o se acaba el tiempo sin llegar a la meta.
- Al ganar: **recompensa** (oro escalado por sobrepasar la meta, + cartas ofrecidas).

### Tipos de rival (como los blinds)

| Tipo | Rol | Característica |
|---|---|---|
| **Rival Menor** | calentamiento | meta baja, se puede *saltar* renunciando a su recompensa (como el skip de Balatro) |
| **Rival Mayor** | reto real | meta más alta, mejor recompensa |
| **Jefe** | pico de acto | meta alta + **Cláusula** (regla que te estorba) |

### Cláusulas de Jefe (equivalente a boss blinds)

Implementadas ✅ (aleatoria por run, con semilla; se anuncia en la Tienda previa y en el HUD del Jefe — `src/engine/clauses.ts`):
- **"Ley marcial"** ✅: tus peones no generan Presión.
- **"Gravedad"** ✅: no puedes mover a la misma pieza dos turnos seguidos.
- **"Fortaleza"** ✅: el Jefe empieza con 2 torres extra protegiendo a su rey.
- **"Maldición arcana"** ✅: tus Estandartes rinden la mitad.

Ideas pendientes:
- **"Niebla":** no ves las piezas del rival hasta que están adyacentes.
- **"Impuesto de sangre":** cada captura que haces cura una pieza del rival.
- **"Espejo":** el rival copia tu última jugada si es legal.

> Cada cláusula engancha uno de tres puntos del motor: puntaje (`adjustScore`), movimiento (`filterMoves`) o tablero inicial (`setupBoard`). Añadir una cláusula = añadir una entrada al registro. Desde **Corona II** ✅ ([progresión meta](06-progresion-meta.md)) el Jefe trae **2 cláusulas a la vez**: `DuelState.clauses` es un array y se aplican en cadena.

Las cláusulas fuerzan a **cambiar la build**, que es el corazón de la rejugabilidad.

## 4. Estructura de un run

Un run son **Actos**, cada Acto son varios Duelos:

```
Acto I  (Tablero 8x8 clásico)   → Menor, Menor, Mayor, JEFE
Acto II (se desbloquea variante)→ Menor, Mayor, Mayor, JEFE
Acto III(tablero exótico)       → Mayor, Mayor, JEFE FINAL
```

- Entre Duelos: pantalla de **Tienda** (ver [economía](03-economia-recursos.md)).
- La **dificultad escala:** metas de Presión más altas, rivales con mejores piezas, cláusulas más duras.
- El run **termina** al perder un Duelo o al vencer al Jefe Final. Cada final otorga desbloqueos meta (ver [progresión](06-progresion-meta.md)).

## 5. El rival: enfoque híbrido ✅ (decidido)

Se usarán **ambos** enfoques, en dos capas:

- **B) Encuentro diseñado (base del roguelike, y lo del MVP):** el rival tiene un ejército fijo + una IA de heurística simple con "personalidad" (agresivo, defensivo, tramposo). Controlable, temático y balanceable — entiende piezas con poderes no estándar porque la heurística se diseña a mano.
- **A) IA de ajedrez real (modo "puro" / dificultad extrema, post-MVP):** motor tipo minimax adaptado, para quien quiera un rival genuinamente hábil. Solo viable en subconjuntos de reglas donde el motor entienda las piezas.

Implicación técnica: la IA vive en `/engine/ai` detrás de una **interfaz común** (`elegirJugada(estado) → comando`), con dos implementaciones intercambiables (heurística y minimax). El MVP solo implementa la heurística.

> **Para el MVP:** solo encuentros diseñados con heurística. El minimax se añade cuando el motor y las reglas estén estables.

## 6. Notas de balance (para más adelante)

- La Presión debe estar calibrada para que **una build promedio** llegue justa a la meta y una **build optimizada** la reviente (satisfacción de romper el juego).
- Cuidado con el *snowball*: si capturar da Presión y Presión da oro y oro da mejores piezas, un buen inicio puede volverse imparable. Balatro lo controla con metas que escalan exponencialmente. Copiar ese freno.
- El mate instantáneo debe dar buen bonus pero **no** ser siempre óptimo, o la gente ignora el sistema de Presión.
