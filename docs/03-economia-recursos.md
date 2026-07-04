# 03 — Economía y Recursos

Inspirado en la "sopa de cartas" de Balatro (dinero, planetas, tarots, jokers, espectros), pero cada recurso mapea a algo del ajedrez. La regla de oro: **cada recurso debe tener un rol distinto y no pisarse con otro.**

> **Estado (Hito 1 en curso):** el bucle económico ya es jugable en un **mini-run de 3 Duelos** con **Tienda** entre cada uno. Implementado: **Oro** (se gana por Duelo, escalado por superar la meta), compra de **Estandartes** con slots limitados, **reroll**, y la **Forja** (ver abajo). Pendiente: Planetas, Tarots, Espectros, Tickets e intereses.

---

## Tabla resumen

| Recurso | Rol | Persistencia | Análogo Balatro |
|---|---|---|---|
| **Oro** | moneda para comprar en la tienda | durante el run | dinero ($) |
| **Tickets** | moneda premium/meta para packs raros y rerolls garantizados | meta (entre runs) o escaso en run | — (aporte propio) |
| **Cartas Planeta** | mejoran un **tipo de pieza** (todos tus caballos) | consumible | Planetas |
| **Cartas Tarot** | transforman/mejoran una **pieza concreta** | consumible | Tarots |
| **Cartas Joker / Estandarte** | modificadores pasivos permanentes (mult, reglas) | todo el run | Jokers |
| **Cartas Espectro** | efectos raros y potentes con coste/riesgo | consumible raro | Espectros |
| **Reliquias / Blasones** | pasivas de run obtenidas en eventos, no compradas | todo el run | (tipo StS relics) |

---

## Oro 🪙

- Se gana al **ganar Duelos** (más por sobrepasar la meta de Presión), y por **intereses** (como Balatro: guardar oro genera un pequeño % — incentiva no gastar todo).
- Se gasta en la **Tienda**: piezas, cartas, mejoras, rerolls, y comprar espacios (slots) de Joker.

## Tickets 🎟️

Recurso de aporte propio para diferenciarse. Propuesta de rol: **"favores del destino"**.
- Se ganan raramente (Jefes, eventos, logros de run).
- Sirven para: **reroll garantizado** de la tienda, abrir un **pack de rareza alta**, o **rescatar** un run (revivir una pieza clave / saltar una cláusula de Jefe).
- Decisión abierta: ¿son de *run* (se reinician) o de *meta* (se acumulan entre partidas para desbloqueos)? → Recomiendo **meta**, para no inflar la economía dentro del run.

## Forja ⚒️ — cambiar fichas por CASTA (implementado)

La Forja de la Tienda deja **cambiar una ficha de tu ejército por otra de su misma casta**, pagando oro. Es la vía barata para meter piezas heréticas y raras en tu build sin romper el equilibrio.

- **Casta = rango de pieza** (Infantería, Menor, Mayor, Élite). Ver [04](04-piezas-poderes-clases.md#castas).
- **Regla clave:** solo se forja dentro de la misma casta. Un Peón (Infantería) puede volverse Berolina, pero **nunca** una Dama por mucho oro que tengas — así el oro compra *variedad y sinergia*, no *poder bruto*.
- El coste sube con la casta (Infantería 2 → Menor 4 → Mayor 6 → Élite 9). El Rey no es forjable.
- No pisa a los **Tarots** (que transforman una pieza a otra cosa vía magia/azar): la Forja es una compra directa y acotada; los Tarots serán intervenciones más raras y potentes.

## Cartas Planeta 🪐 — mejoran TIPOS de pieza

Suben el "nivel" de una categoría de pieza para **todo tu ejército**:
- *Planeta "Marte" (Caballos):* +base y +mult cuando capturas con cualquier caballo. Nivel 2, 3, 4...
- *Planeta "Venus" (Alfiles):* alcance y valor de captura de todos los alfiles sube.

Esto premia builds "mono-tipo" (ejército de puros caballos) sin obligar a ello.

## Cartas Tarot 🃏 — transforman PIEZAS concretas

Efectos de un solo uso sobre una pieza que eliges:
- *El Mago:* otorga un **poder** aleatorio de gama baja a una pieza.
- *La Muerte:* fusiona dos piezas en una más fuerte (sacrificas una).
- *La Emperatriz:* asciende un peón a una pieza sin tener que promover.
- *La Rueda de la Fortuna:* reroll de la clase/poderes de una pieza.
- *El Ahorcado:* destruye una pieza tuya a cambio de oro/mult permanente (curva de riesgo).

## Cartas Joker / Estandarte 🎴 — el corazón de las sinergias

Modificadores **pasivos y permanentes** durante el run. Ocupan **slots limitados** (comprar más slots es una decisión económica). Son donde vive la locura de combos.

Ejemplos por arquetipo:
- **Numéricos:** "+3 mult por cada torre en el tablero", "×2 Presión si no perdiste ninguna pieza este Duelo".
- **Condicionales/posicionales:** "capturas en la fila 5 dan +5 base", "primera captura de cada turno da mult doble".
- **Que cambian reglas:** "tus peones pueden moverse hacia atrás", "tu rey puede saltar como caballo una vez por Duelo".
- **Escalantes (crecen durante el run):** "gana +1 mult permanente cada vez que promueves un peón".
- **Económicos:** "gana +2 oro por cada jaque", "los rerolls cuestan 1 menos".

> Igual que en Balatro, el diseño de Jokers es donde se define la profundidad. Ver [piezas y poderes](04-piezas-poderes-clases.md) para cómo interactúan con las clases.

## Cartas Espectro 👻 — raras y peligrosas

Poderosas con coste:
- *Eclipse:* convierte todas tus piezas menores en un tipo elegido (all-in mono-tipo).
- *Ánima:* da un poder legendario a una pieza pero reduce tu límite de turnos.
- *Vacío:* elimina una cláusula de Jefe permanentemente este run, a cambio de sacrificar una pieza.

## Principios de balance económico

1. **Tensión de gasto:** el jugador nunca debe poder comprar todo. Slots de Joker limitados + intereses por ahorrar = decisiones reales.
2. **Rareza y descubrimiento:** la mayoría de la potencia viene de encontrar sinergias, no de acumular recursos.
3. **Anti-snowball:** metas de Presión escalan más rápido que el poder promedio, así que hay que *construir bien*, no solo *jugar mucho*.
4. **Cada recurso, un momento:** Planetas = decisión de "en qué tipo invierto"; Tarots = intervención quirúrgica; Jokers = identidad de la build; Espectros = apuestas.
