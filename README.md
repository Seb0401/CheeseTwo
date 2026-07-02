# CheeseTwo — Ajedrez Evolucionado (Working Title)

> Un **ajedrez roguelike**: empiezas jugando ajedrez normal y, run tras run, tu ejército, tus reglas y hasta el tablero evolucionan. Compra piezas, define clases, mejora poderes y combina recursos al estilo *Balatro*.

---

## 🎯 Visión en una frase

**"Balatro, pero de ajedrez":** cada combate es una partida de ajedrez donde generas *puntaje* capturando y presionando; entre combates gastas los recursos ganados en una tienda para construir un ejército cada vez más roto, con sinergias entre piezas, clases y cartas.

## 🧭 Pilares de diseño

1. **Evoluciona desde lo familiar.** El primer contacto es ajedrez de verdad (o una versión simplificada como tutorial). La complejidad se *desbloquea*, no se impone.
2. **El ejército es tuyo.** Compras piezas, las mejoras, defines clases y las llevas de combate en combate dentro de un *run*.
3. **Sinergias sobre estadísticas.** Como en Balatro, lo divertido no es "+1 de daño" sino combos que rompen las reglas (jokers, clases, poderes que interactúan).
4. **Rejugabilidad por capas.** Tableros distintos (2D, hexagonal, 3D, multijugador), ejércitos iniciales, y modificadores hacen que ningún run se sienta igual.
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

## 🚦 Estado actual

**Fase: concepto / pre-producción.** Nada de código todavía. El siguiente paso recomendado está en el [roadmap técnico](docs/07-roadmap-tecnico.md): un prototipo jugable de *un solo combate con Presión* para validar que el bucle es divertido antes de construir toda la economía.

## ✅ Decisiones tomadas

- **Stack:** TypeScript + React (UI/tienda) + PixiJS (tablero). Web-first, portable a desktop con Tauri.
- **Rival:** híbrido — encuentros diseñados con heurística para el roguelike + IA de ajedrez real para un modo "puro"/dificultad extrema. El MVP arranca con encuentros diseñados.
- **Alcance:** single-player roguelike primero, **diseñando desde ya los hooks para PvP asíncrono** con ejércitos construidos.
- **Repositorio:** público en GitHub.

## ❓ Decisiones aún abiertas

- ¿Nombre definitivo? (ver [glosario](docs/08-glosario.md))
- Tono estético (A coleccionista / B arcano / C absurdo).
- ¿Tickets como recurso de run o de meta?
- ¿Tutorial en mini-tablero o 8×8 con tooltips?
