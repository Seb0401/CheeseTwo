import { useCallback, useEffect, useRef, useState } from 'react';
import { BoardView } from '../../render/boardView';
import {
  applyMove,
  chooseAiMove,
  createDuel,
  DuelState,
  GameDef,
  legalMovesFrom,
  SquareIndex,
} from '../../engine';
import { Hud } from '../Hud';

interface DuelScreenProps {
  game: GameDef;
  /** Se llama una sola vez por Duelo terminado (ganado o perdido). */
  onDuelEnd: (won: boolean) => void;
  onExit: () => void;
}

export function DuelScreen({ game, onDuelEnd, onExit }: DuelScreenProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<BoardView | null>(null);

  const [state, setState] = useState<DuelState>(() => createDuel(game));
  const [selected, setSelected] = useState<SquareIndex | null>(null);

  // Espejo de refs para que el callback de Pixi (creado una sola vez) lea lo actual.
  const stateRef = useRef(state);
  const selectedRef = useRef(selected);
  stateRef.current = state;
  selectedRef.current = selected;

  // Reporta el resultado a la meta-progresión una sola vez por Duelo.
  const reportedRef = useRef(false);
  const onDuelEndRef = useRef(onDuelEnd);
  onDuelEndRef.current = onDuelEnd;
  useEffect(() => {
    if (state.status !== 'playing' && !reportedRef.current) {
      reportedRef.current = true;
      onDuelEndRef.current(state.status === 'won');
    }
  }, [state.status]);

  const handleSquareClick = useCallback(
    (sq: SquareIndex) => {
      const s = stateRef.current;
      if (s.status !== 'playing' || s.turn !== 'white') return;

      const sel = selectedRef.current;

      // Sin selección: intentar seleccionar una pieza propia con movimientos.
      if (sel === null) {
        if (legalMovesFrom(game, s, sq).length > 0) setSelected(sq);
        return;
      }

      // Con selección: ¿el clic es un destino legal?
      const move = legalMovesFrom(game, s, sel).find((m) => m.to === sq);
      if (move) {
        let next = applyMove(game, s, move);
        setSelected(null);

        // Respuesta del rival (negras) en la misma ronda.
        if (next.status === 'playing') {
          const ai = chooseAiMove(game, next, 'black');
          next = ai ? applyMove(game, next, ai) : { ...next, status: 'won' };
        }
        setState(next);
        return;
      }

      // Reseleccionar otra pieza propia, o deseleccionar.
      if (legalMovesFrom(game, s, sq).length > 0) setSelected(sq);
      else setSelected(null);
    },
    [game],
  );

  const restart = useCallback(() => {
    reportedRef.current = false;
    setState(createDuel(game));
    setSelected(null);
  }, [game]);

  // Inicializa el tablero de Pixi una sola vez.
  useEffect(() => {
    const view = new BoardView({
      onSquareClick: handleSquareClick,
      glyphFor: (piece) => game.pieces[piece.type]?.glyph[piece.color] ?? '?',
    });
    viewRef.current = view;
    let mounted = true;

    view.init().then((canvas) => {
      const host = containerRef.current;
      if (mounted && host) {
        host.replaceChildren(canvas);
      }
    });

    return () => {
      mounted = false;
      view.destroy();
      viewRef.current = null;
    };
  }, [game, handleSquareClick]);

  // Redibuja cuando cambian el estado o la selección.
  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;
    const targets =
      selected !== null ? legalMovesFrom(game, state, selected).map((m) => m.to) : [];
    view.render(state.board, selected, targets);
  }, [game, state, selected]);

  return (
    <main className="layout">
      <div className="board" ref={containerRef} />
      <Hud game={game} state={state} onRestart={restart} onExit={onExit} />
    </main>
  );
}
