import { describe, expect, it } from 'vitest';
import { applyMove, Board, createDuel, legalMovesFrom, scoreMove } from './index';
import { squareAt, TRIDCHESS } from './games/tridchess';

const emptyBoard = (): Board => new Array(64).fill(null);

describe('ajedrez 3D: tablero inicial', () => {
  it('64 casillas, 16 piezas por bando, Middle board (nivel 2) vacío', () => {
    const board = TRIDCHESS.createInitialBoard();
    expect(board).toHaveLength(64);
    expect(board.filter((p) => p?.color === 'white')).toHaveLength(16);
    expect(board.filter((p) => p?.color === 'black')).toHaveLength(16);

    for (let file = 1; file <= 4; file++) {
      for (let rank = 1; rank <= 4; rank++) {
        expect(board[squareAt(file, rank, 2)!]).toBeNull();
      }
    }
  });

  it('cada bando reparte Torre+Caballo en sus 2 Attack Boards', () => {
    const board = TRIDCHESS.createInitialBoard();
    expect(board[squareAt(1, 1, 0)!]?.type).toBe('rook'); // WQL
    expect(board[squareAt(1, 0, 0)!]?.type).toBe('knight');
    expect(board[squareAt(4, 1, 0)!]?.type).toBe('rook'); // WKL
    expect(board[squareAt(4, 0, 0)!]?.type).toBe('knight');
    expect(board[squareAt(1, 4, 4)!]?.type).toBe('rook'); // BQL
    expect(board[squareAt(4, 4, 4)!]?.type).toBe('rook'); // BKL
  });
});

describe('ajedrez 3D: torre — desliza también en vertical', () => {
  it('sube en línea recta desde un Attack Board hasta el Bottom board', () => {
    const board = emptyBoard();
    const rookSq = squareAt(1, 1, 0)!; // WQL, esquina interior
    board[rookSq] = { id: 1, type: 'rook', color: 'white' };
    const moves = TRIDCHESS.movesFrom(board, rookSq).map((m) => m.to);
    // Sube por (file=1, rank=1) a través de los 3 niveles principales.
    expect(moves).toContain(squareAt(1, 1, 1)!);
    expect(moves).toContain(squareAt(1, 1, 2)!);
    expect(moves).toContain(squareAt(1, 1, 3)!);
    // No puede alcanzar el Attack Board alto de negras (fuera de la columna).
    expect(moves).not.toContain(squareAt(1, 4, 4));
  });

  it('una pieza propia bloquea el deslizamiento vertical', () => {
    const board = emptyBoard();
    const rookSq = squareAt(2, 2, 1)!;
    board[rookSq] = { id: 1, type: 'rook', color: 'white' };
    board[squareAt(2, 2, 2)!] = { id: 2, type: 'pawn', color: 'white' };
    const moves = TRIDCHESS.movesFrom(board, rookSq).map((m) => m.to);
    expect(moves).not.toContain(squareAt(2, 2, 2)!);
    expect(moves).not.toContain(squareAt(2, 2, 3)!);
  });
});

describe('ajedrez 3D: alfil — diagonales planas y "triagonales"', () => {
  it('se mueve en diagonal dentro de un mismo nivel (plano file-rank)', () => {
    const board = emptyBoard();
    const bishopSq = squareAt(2, 2, 2)!;
    board[bishopSq] = { id: 1, type: 'bishop', color: 'white' };
    const moves = TRIDCHESS.movesFrom(board, bishopSq).map((m) => m.to);
    expect(moves).toContain(squareAt(3, 3, 2)!);
    expect(moves).toContain(squareAt(1, 1, 2)!);
  });

  it('se mueve "triagonal" (los 3 ejes a la vez), cambiando de nivel', () => {
    const board = emptyBoard();
    const bishopSq = squareAt(2, 2, 1)!;
    board[bishopSq] = { id: 1, type: 'bishop', color: 'white' };
    const moves = TRIDCHESS.movesFrom(board, bishopSq).map((m) => m.to);
    // (2,2,1) + (1,1,1) = (3,3,2): cambia file, rank Y nivel en un solo paso.
    expect(moves).toContain(squareAt(3, 3, 2)!);
  });
});

describe('ajedrez 3D: caballo — salta cambiando de nivel', () => {
  it('puede aterrizar en un nivel distinto usando el eje vertical como "2"', () => {
    const board = emptyBoard();
    const knightSq = squareAt(1, 1, 0)!; // WQL
    board[knightSq] = { id: 1, type: 'knight', color: 'white' };
    const moves = TRIDCHESS.movesFrom(board, knightSq).map((m) => m.to);
    // (1,1,0) + (1,0,2) = (2,1,2): salta directo al Middle board.
    expect(moves).toContain(squareAt(2, 1, 2)!);
  });
});

describe('ajedrez 3D: peón — escalera a través de los 3 tableros', () => {
  it('avanza recto y corona al llegar al Top board (rank 4)', () => {
    const board = emptyBoard();
    const pawnSq = squareAt(2, 4, 1)!; // a un paso de subir al Middle board
    board[pawnSq] = { id: 1, type: 'pawn', color: 'white' };
    let state = { ...createDuel(TRIDCHESS, { target: 999, turnLimit: 200 }), board };

    let steps = 0;
    while (steps < 10) {
      const from = state.board.findIndex((p) => p?.type === 'pawn' && p?.color === 'white');
      if (from < 0) break; // ya coronó (cambió de tipo a 'queen')
      const moves = legalMovesFrom(TRIDCHESS, state, from);
      expect(moves.length).toBeGreaterThan(0);
      state = applyMove(TRIDCHESS, state, moves[0]);
      state = { ...state, turn: 'white' }; // sin piezas negras en el tablero, no hay réplica
      steps++;
    }

    const promoted = state.board.find((p) => p?.color === 'white' && p.type === 'queen');
    expect(promoted).toBeDefined();
  });

  it('captura en diagonal cruzando el borde de un tablero', () => {
    const board = emptyBoard();
    const pawnSq = squareAt(2, 4, 1)!;
    board[pawnSq] = { id: 1, type: 'pawn', color: 'white' };
    board[squareAt(3, 1, 2)!] = { id: 2, type: 'knight', color: 'black' };
    const moves = TRIDCHESS.movesFrom(board, pawnSq);
    const capture = moves.find((m) => m.to === squareAt(3, 1, 2)!);
    expect(capture?.captured?.type).toBe('knight');
  });

  it('doble paso solo desde las casillas de inicio', () => {
    const board = emptyBoard();
    const pawnSq = squareAt(2, 2, 1)!; // v=2, casilla de inicio
    board[pawnSq] = { id: 1, type: 'pawn', color: 'white' };
    const moves = TRIDCHESS.movesFrom(board, pawnSq).map((m) => m.to);
    expect(moves).toContain(squareAt(2, 4, 1)!); // avance doble hasta v=4
  });
});

describe('ajedrez 3D: puntaje', () => {
  it('capturar suma la base de la pieza capturada', () => {
    const board = emptyBoard();
    const rookSq = squareAt(2, 2, 2)!;
    board[rookSq] = { id: 1, type: 'rook', color: 'white' };
    board[squareAt(2, 3, 2)!] = { id: 2, type: 'knight', color: 'black' };
    const state = { ...createDuel(TRIDCHESS, { target: 999, turnLimit: 20 }), board };
    const move = legalMovesFrom(TRIDCHESS, state, rookSq).find((m) => m.captured)!;
    const score = scoreMove(TRIDCHESS, state, move);
    // Caballo (3 base) + bonus de Middle board (2 base) = 5.
    expect(score.total).toBe(5);
  });

  it('aterrizar en el Middle board da un bonus de base aunque no capture', () => {
    const board = emptyBoard();
    const rookSq = squareAt(2, 1, 1)!;
    board[rookSq] = { id: 1, type: 'rook', color: 'white' };
    const state = { ...createDuel(TRIDCHESS, { target: 999, turnLimit: 20 }), board };
    // Deslizamiento vertical puro (mismo file/rank, sube de nivel): Bottom → Middle.
    const toMiddle = legalMovesFrom(TRIDCHESS, state, rookSq).find(
      (m) => m.to === squareAt(2, 1, 2)!,
    )!;
    expect(scoreMove(TRIDCHESS, state, toMiddle).total).toBe(2);
  });
});

describe('ajedrez 3D: deslizamientos siempre terminan (guarda contra bordes abiertos)', () => {
  it('cada pieza deslizante del tablero inicial genera movimientos acotados a las 64 casillas', () => {
    // Regresión: los Attack Boards acotan `file` a {0,1,4,5}, no a "file<=1 ||
    // file>=4" (abierto por los extremos) — con el rango abierto, una torre
    // deslizando lateralmente en nivel 0/4 nunca encontraba el borde y el
    // bucle no terminaba.
    const board = TRIDCHESS.createInitialBoard();
    for (let sq = 0; sq < board.length; sq++) {
      if (!board[sq]) continue;
      const moves = TRIDCHESS.movesFrom(board, sq);
      expect(moves.length).toBeLessThan(64);
      for (const m of moves) {
        expect(m.to).toBeGreaterThanOrEqual(0);
        expect(m.to).toBeLessThan(64);
      }
    }
  });
});

describe('ajedrez 3D: rey es la pieza objetivo', () => {
  it('capturar al rey gana el Duelo al instante (vía la meta de Presión)', () => {
    expect(TRIDCHESS.pieces.king.objective).toBe(true);
  });
});
