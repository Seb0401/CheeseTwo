import { describe, expect, it } from 'vitest';
import {
  applyMove,
  bannersForGame,
  Board,
  CHESS,
  chooseAiMove,
  createDuel,
  createRng,
  GameDef,
  legalMovesFrom,
  pickN,
  scoreMove,
  toIndex,
} from './index';

describe('ajedrez: tablero inicial', () => {
  it('coloca 32 piezas', () => {
    const board = CHESS.createInitialBoard();
    expect(board.filter(Boolean).length).toBe(32);
  });
});

describe('ajedrez: generación de movimientos', () => {
  it('el caballo de b1 tiene 2 salidas iniciales', () => {
    const board = CHESS.createInitialBoard();
    const moves = CHESS.movesFrom(board, toIndex(1, 0));
    expect(moves).toHaveLength(2);
  });

  it('el peón de e2 puede avanzar una o dos casillas', () => {
    const board = CHESS.createInitialBoard();
    const tos = CHESS.movesFrom(board, toIndex(4, 1))
      .map((m) => m.to)
      .sort((a, b) => a - b);
    expect(tos).toEqual([toIndex(4, 2), toIndex(4, 3)].sort((a, b) => a - b));
  });
});

describe('ajedrez: presión base', () => {
  it('capturar una torre da 5 de base, con su nota de desglose', () => {
    const { base, notes } = CHESS.scoreForMove({
      from: 0,
      to: 63,
      captured: { id: 1, type: 'rook', color: 'black' },
    });
    expect(base).toBe(5);
    expect(notes).toHaveLength(1);
    expect(notes[0].source).toContain('Torre');
  });

  it('capturar en el centro suma bonus', () => {
    // Caballo (3) capturado en d4 (índice 27) => 3 + 1 = 4.
    const { base } = CHESS.scoreForMove({
      from: 0,
      to: 27,
      captured: { id: 1, type: 'knight', color: 'black' },
    });
    expect(base).toBe(4);
  });
});

describe('duelo (núcleo genérico, con ajedrez)', () => {
  it('gana al alcanzar la meta de presión', () => {
    let state = createDuel(CHESS, { target: 3, turnLimit: 10 });
    const move = {
      from: toIndex(0, 0),
      to: 27,
      captured: { id: 99, type: 'knight' as const, color: 'black' as const },
    };
    state = applyMove(CHESS, state, move);
    expect(state.status).toBe('won');
  });

  it('capturar la pieza objetivo (rey) gana al instante', () => {
    let state = createDuel(CHESS, { target: 999, turnLimit: 10 });
    const move = {
      from: toIndex(0, 0),
      to: toIndex(4, 7),
      captured: { id: 99, type: 'king' as const, color: 'black' as const },
    };
    state = applyMove(CHESS, state, move);
    expect(state.status).toBe('won');
  });

  it('la IA devuelve un movimiento válido en la posición inicial', () => {
    const state = createDuel(CHESS);
    const move = chooseAiMove(CHESS, state, 'black');
    expect(move).not.toBeNull();
  });

  it('un peón que corona se convierte en dama', () => {
    let state = createDuel(CHESS, { target: 999, turnLimit: 10 });
    const board: Board = new Array(64).fill(null);
    board[toIndex(0, 6)] = { id: 1, type: 'pawn', color: 'white' };
    board[toIndex(7, 0)] = { id: 2, type: 'king', color: 'white' };
    board[toIndex(7, 7)] = { id: 3, type: 'king', color: 'black' };
    state = { ...state, board };

    const move = legalMovesFrom(CHESS, state, toIndex(0, 6)).find((m) => m.promotion);
    expect(move).toBeDefined();
    state = applyMove(CHESS, state, move!);
    expect(state.board[move!.to]?.type).toBe('queen');
  });
});

// ─── Un juego de juguete demuestra que el núcleo es agnóstico al juego ───────
// Una sola pieza por bando que avanza un rank; capturar la ficha rival (objetivo) gana.
const TOY: GameDef = {
  id: 'toy',
  name: 'Juguete',
  pieces: {
    token: { name: 'Ficha', captureValue: 2, objective: true, glyph: { white: '●', black: '○' } },
  },
  defaults: { target: 10, turnLimit: 5 },
  hint: 'Avanza y captura.',
  createInitialBoard() {
    const board: Board = new Array(64).fill(null);
    board[toIndex(0, 0)] = { id: 1, type: 'token', color: 'white' };
    board[toIndex(0, 7)] = { id: 2, type: 'token', color: 'black' };
    return board;
  },
  movesFrom(board, from) {
    const piece = board[from]!;
    const to = from + (piece.color === 'white' ? 8 : -8);
    if (to < 0 || to >= 64) return [];
    const occupant = board[to];
    if (occupant?.color === piece.color) return [];
    return [{ from, to, captured: occupant ?? undefined }];
  },
  scoreForMove(move) {
    return { base: move.captured ? 2 : 1, notes: [] };
  },
};

describe('duelo con otro GameDef (juguete)', () => {
  it('el núcleo corre el juego de juguete sin cambios', () => {
    let state = createDuel(TOY, { target: 3, turnLimit: 10 });
    // Blancas avanzan (1 de Presión), negras avanzan, blancas avanzan (2 acumulada)…
    for (let i = 0; i < 2; i++) {
      const white = legalMovesFrom(TOY, state, state.board.findIndex((p) => p?.color === 'white'));
      state = applyMove(TOY, state, white[0]);
      const black = chooseAiMove(TOY, state, 'black');
      state = applyMove(TOY, state, black!);
    }
    expect(state.pressure).toBe(2);
    expect(state.status).toBe('playing');
  });

  it('capturar la ficha objetivo del juguete gana el duelo', () => {
    let state = createDuel(TOY, { target: 999, turnLimit: 10 });
    const board: Board = new Array(64).fill(null);
    board[toIndex(0, 3)] = { id: 1, type: 'token', color: 'white' };
    board[toIndex(0, 4)] = { id: 2, type: 'token', color: 'black' };
    state = { ...state, board };

    const capture = legalMovesFrom(TOY, state, toIndex(0, 3))[0];
    expect(capture.captured).toBeDefined();
    state = applyMove(TOY, state, capture);
    expect(state.status).toBe('won');
  });
});

// ─── Piezas heréticas ────────────────────────────────────────────────────────

describe('ajedrez: piezas heréticas', () => {
  const emptyWith = (entries: [number, Board[number]][]): Board => {
    const board: Board = new Array(64).fill(null);
    for (const [sq, piece] of entries) board[sq] = piece;
    return board;
  };

  it('el canciller combina torre y caballo', () => {
    // Canciller en d4 (27), tablero vacío: 14 de torre + 8 de caballo = 22.
    const board = emptyWith([[27, { id: 1, type: 'chancellor', color: 'white' }]]);
    expect(CHESS.movesFrom(board, 27)).toHaveLength(22);
  });

  it('el arzobispo combina alfil y caballo', () => {
    // Arzobispo en d4 (27), tablero vacío: 13 de alfil + 8 de caballo = 21.
    const board = emptyWith([[27, { id: 1, type: 'archbishop', color: 'white' }]]);
    expect(CHESS.movesFrom(board, 27)).toHaveLength(21);
  });

  it('el saltamontes solo se mueve saltando sobre una pieza', () => {
    // Saltamontes en d1 (3) sin nada alrededor: cero movimientos.
    const solo = emptyWith([[3, { id: 1, type: 'grasshopper', color: 'white' }]]);
    expect(CHESS.movesFrom(solo, 3)).toHaveLength(0);

    // Con un peón propio en d3 (19): salta y aterriza en d4 (27).
    const board = emptyWith([
      [3, { id: 1, type: 'grasshopper', color: 'white' }],
      [19, { id: 2, type: 'pawn', color: 'white' }],
    ]);
    const moves = CHESS.movesFrom(board, 3);
    expect(moves).toHaveLength(1);
    expect(moves[0].to).toBe(27);
  });

  it('el saltamontes captura al aterrizar', () => {
    const board = emptyWith([
      [3, { id: 1, type: 'grasshopper', color: 'white' }],
      [19, { id: 2, type: 'pawn', color: 'white' }],
      [27, { id: 3, type: 'rook', color: 'black' }],
    ]);
    const moves = CHESS.movesFrom(board, 3);
    expect(moves).toHaveLength(1);
    expect(moves[0].captured?.type).toBe('rook');
  });
});

// ─── Estandartes y puntaje Base × Mult ───────────────────────────────────────

describe('estandartes: puntaje', () => {
  const knightCaptureInCenter = (banners: string[]) => {
    let state = createDuel(CHESS, { target: 999, turnLimit: 10, banners });
    const board: Board = new Array(64).fill(null);
    board[toIndex(2, 2)] = { id: 1, type: 'knight', color: 'white' }; // c3
    board[toIndex(3, 4)] = { id: 2, type: 'rook', color: 'black' }; // d5 (centro)
    state = { ...state, board };
    const move = legalMovesFrom(CHESS, state, toIndex(2, 2)).find((m) => m.captured)!;
    return { state, move };
  };

  it('sin estandartes: mult 1 (torre 5 + centro 1 = 6)', () => {
    const { state, move } = knightCaptureInCenter([]);
    const score = scoreMove(CHESS, state, move);
    expect(score).toMatchObject({ base: 6, mult: 1, total: 6 });
  });

  it('Cazador: +2 mult a capturas con caballo (6 × 3 = 18, el ejemplo del doc 02)', () => {
    const { state, move } = knightCaptureInCenter(['cazador']);
    const score = scoreMove(CHESS, state, move);
    expect(score).toMatchObject({ base: 6, mult: 3, total: 18 });
    expect(score.notes.some((n) => n.source.includes('Cazador'))).toBe(true);
  });

  it('los estandartes se combinan: Cazador + Verdugo + Cartógrafo', () => {
    // base = 6 + 2 (Cartógrafo) = 8; mult = (1 + 2) × 2 (Verdugo, captura en d5) = 6.
    const { state, move } = knightCaptureInCenter(['cazador', 'verdugo', 'cartografo']);
    const score = scoreMove(CHESS, state, move);
    expect(score).toMatchObject({ base: 8, mult: 6, total: 48 });
  });

  it('El Monje no aplica a capturas, sí a jugadas tranquilas', () => {
    const { state, move } = knightCaptureInCenter(['monje']);
    expect(scoreMove(CHESS, state, move).total).toBe(6);

    const quiet = legalMovesFrom(CHESS, state, toIndex(2, 2)).find((m) => !m.captured)!;
    const score = scoreMove(CHESS, state, quiet);
    expect(score.base).toBeGreaterThanOrEqual(1);
    expect(score.notes.some((n) => n.source.includes('Monje'))).toBe(true);
  });

  it('applyMove acumula el total y guarda el desglose en lastScore', () => {
    const { state, move } = knightCaptureInCenter(['cazador']);
    const next = applyMove(CHESS, state, move);
    expect(next.pressure).toBe(18);
    expect(next.lastScore?.total).toBe(18);
  });

  it('bannersForGame filtra por juego', () => {
    const forChess = bannersForGame('chess');
    const forDamas = bannersForGame('damas');
    expect(forChess.length).toBeGreaterThan(forDamas.length);
    expect(forDamas.every((b) => !b.gameId)).toBe(true);
  });
});

describe('rng con semilla', () => {
  it('misma semilla → misma secuencia', () => {
    const a = createRng(42);
    const b = createRng(42);
    for (let i = 0; i < 5; i++) expect(a()).toBe(b());
  });

  it('pickN es determinista y sin repetidos', () => {
    const pool = ['a', 'b', 'c', 'd', 'e', 'f'];
    const pick1 = pickN(pool, 3, createRng(7));
    const pick2 = pickN(pool, 3, createRng(7));
    expect(pick1).toEqual(pick2);
    expect(new Set(pick1).size).toBe(3);
  });
});

// ─── Fichas nuevas: Camello, Cañón, Amazona, Berolina ────────────────────────

describe('ajedrez: fichas nuevas', () => {
  const emptyWith = (entries: [number, Board[number]][]): Board => {
    const board: Board = new Array(64).fill(null);
    for (const [sq, piece] of entries) board[sq] = piece;
    return board;
  };

  it('el camello es un saltador (3,1)', () => {
    // Camello en d4 (3,3): 8 saltos, todos dentro del tablero.
    const board = emptyWith([[toIndex(3, 3), { id: 1, type: 'camel', color: 'white' }]]);
    const tos = CHESS.movesFrom(board, toIndex(3, 3)).map((m) => m.to);
    expect(tos).toContain(toIndex(4, 6)); // (+1,+3)
    expect(tos).toContain(toIndex(0, 2)); // (-3,-1)
    expect(tos).toHaveLength(8);
  });

  it('la amazona combina dama y caballo', () => {
    // Amazona en d4 (27), tablero vacío: 27 de dama + 8 de caballo = 35.
    const board = emptyWith([[27, { id: 1, type: 'amazon', color: 'white' }]]);
    expect(CHESS.movesFrom(board, 27)).toHaveLength(35);
  });

  it('el cañón se desliza sin capturar y captura saltando una pantalla', () => {
    // Cañón en a1 (0); pantalla propia en a3 (16); enemigo en a5 (32).
    const board = emptyWith([
      [toIndex(0, 0), { id: 1, type: 'cannon', color: 'white' }],
      [toIndex(0, 2), { id: 2, type: 'pawn', color: 'white' }],
      [toIndex(0, 4), { id: 3, type: 'rook', color: 'black' }],
    ]);
    const moves = CHESS.movesFrom(board, toIndex(0, 0));
    const capture = moves.find((m) => m.captured);
    expect(capture?.to).toBe(toIndex(0, 4)); // salta la pantalla y toma la torre
    // No puede capturar sin pantalla: mover la pantalla deja al enemigo intocable.
    const noScreen = emptyWith([
      [toIndex(0, 0), { id: 1, type: 'cannon', color: 'white' }],
      [toIndex(0, 4), { id: 3, type: 'rook', color: 'black' }],
    ]);
    expect(CHESS.movesFrom(noScreen, toIndex(0, 0)).some((m) => m.captured)).toBe(false);
  });

  it('la berolina avanza en diagonal y captura de frente', () => {
    const board = emptyWith([
      [toIndex(3, 1), { id: 1, type: 'berolina', color: 'white' }], // d2
      [toIndex(3, 2), { id: 2, type: 'pawn', color: 'black' }], // d3, de frente
    ]);
    const moves = CHESS.movesFrom(board, toIndex(3, 1));
    const capture = moves.find((m) => m.captured);
    expect(capture?.to).toBe(toIndex(3, 2)); // captura recta
    expect(moves.some((m) => m.to === toIndex(2, 2))).toBe(true); // avance diagonal c3
    expect(moves.some((m) => m.to === toIndex(4, 2))).toBe(true); // avance diagonal e3
  });

  it('todas las piezas del ajedrez tienen casta salvo el Rey', () => {
    for (const [type, info] of Object.entries(CHESS.pieces)) {
      if (type === 'king') expect(info.casta).toBeUndefined();
      else expect(info.casta).toBeDefined();
    }
  });
});
