# 06 — Progresión Meta

Lo que persiste **entre runs** y le da razón para volver. Inspirado en el sistema de desbloqueos de Balatro (barajas, jokers, apuestas/stakes) y StS (personajes, ascensiones).

> **Estado (implementado):** la meta persiste en localStorage (`src/game/meta.ts`): piezas **descubiertas**, **Runs ganados**, Duelos G/P, **desbloqueos** y **Corona máxima**. Ganar un run concede ejércitos nuevos en cadena: 1ª victoria → **Enjambre**; ganar con Enjambre → **Realeza**; ganar con Realeza → **Mercader**. Los ejércitos ya tienen efecto real (ver abajo) y el Compendio muestra todo. **Coronas** (`src/game/crowns.ts`) ya son jugables: se eligen en la Preparación de Run (hasta la máxima desbloqueada) y ganar en tu Corona actual desbloquea la siguiente. Pendiente: desbloqueo de piezas/cartas para el pool, y retos.

---

## Qué se desbloquea (meta)

- **Piezas nuevas** para el pool de la tienda (jugando runs, cumpliendo retos).
- **Clases y poderes** nuevos.
- **Cartas** (Jokers, Planetas, Tarots, Espectros) que empiezan a aparecer.
- **Tableros** (ver [05](05-tableros-y-modos.md)).
- **Ejércitos iniciales** ("barajas").
- **Niveles de dificultad** ("Apuestas / Coronas").

## Ejércitos iniciales (barajas)

Cada uno define con qué empiezas y sesga tu estrategia (✅ = implementado con efecto real):
- **Clásico** ✅: set estándar. Balanceado, para aprender.
- **Herético** ✅: flanco de dama corrompido (Canciller, Saltamontes, Arzobispo). Desde el inicio.
- **Enjambre** ✅: dama y torres → caballos (5 caballos, sin piezas mayores). Sinergia con el Estandarte *Enjambre*.
- **Realeza** ✅: dama → **Amazona** (dama+caballo) pero sin ambos caballos. Pocas piezas, una superpieza.
- **Mercader** ✅: ejército más débil (−1 torre, −1 alfil) pero **+6 de oro inicial**. Build económica.

## Dificultad ascendente (Apuestas / Coronas) ✅

Como los *stakes* de Balatro: capas de dificultad que se ACUMULAN al ganar (`src/game/crowns.ts`). Se elige la Corona en la Preparación de Run (nunca por encima de la máxima desbloqueada); ganar un run jugando en tu Corona máxima actual desbloquea la siguiente (`meta.maxCrown`, ver `recordRunWin` en `meta.ts`):
- **Corona I** ✅: metas de Presión +20%.
- **Corona II** ✅: el Jefe trae **2 Cláusulas** a la vez en lugar de 1.
- **Corona III** ✅: rerolar la Tienda cuesta 1 oro más.
- **Corona IV** ✅: la recompensa de oro por Duelo baja un 25% (no hay intereses implementados aún — ver [economía](03-economia-recursos.md)).

Ideas pendientes: recompensas cosméticas/de colección por Corona.

## Colección y descubrimiento

- **Compendio** de piezas/cartas/poderes descubiertos (incentivo de completismo).
- **Logros/retos** que desbloquean contenido ("gana un run sin capturar con la dama").
- **Estadísticas** de builds (qué combos usó el jugador) — bueno para retención y para *tu* balance.

## Curva de la primera hora (importantísima)

1. **Combate 1 (mini-tablero, sin cartas):** solo aprende Presión. Gana fácil.
2. **Primera tienda:** compra 1 cosa. Aprende a gastar.
3. **Primer Joker:** siente la primera sinergia pequeña.
4. **Primer Jefe con cláusula:** primer momento de "tengo que adaptarme".
5. **Fin del primer run:** desbloquea un ejército inicial nuevo → razón para el run 2.

> Si esta primera hora funciona, el juego funciona. Priorizar validarla en el prototipo antes que la amplitud de contenido.

## Riesgos de retención a vigilar

- **Parálisis por opciones:** demasiados sistemas de golpe. Mitigar con desbloqueo gradual.
- **Builds dominantes:** si un combo es siempre el mejor, muere la rejugabilidad. Necesita telemetría + nerfs.
- **Falta de "momentos WOW":** el juice y los combos rotos son la recompensa emocional. No escatimar en feedback visual/sonoro.
