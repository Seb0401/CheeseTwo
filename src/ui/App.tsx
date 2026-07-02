import { useCallback, useEffect, useRef, useState } from 'react';
import { BoardView } from '../render/boardView';
import {
  applyMove,
  chooseAiMove,
  createDuel,
  DuelState,
  legalMovesFrom,
  SquareIndex,
} from '../engine';
import { Hud } from './Hud';

export function App() {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<BoardView | null>(null);

  const [state, setState] = useState<DuelState>(() => createDuel());
  const [selected, setSelected] = useState<SquareIndex | null>(null);

  // Espejo de refs para que el callback de Pixi (creado una sola vez) lea lo actual.
  const stateRef = useRef(state);
  const selectedRef = useRef(selected);
  stateRef.current = state;
  selectedRef.current = selected;

  const handleSquareClick = useCallback((sq: SquareIndex) => {
    const s = stateRef.current;
    if (s.status !== 'playing' || s.turn !== 'white') return;

    const sel = selectedRef.current;

    // Sin selección: intentar seleccionar una pieza propia con movimientos.
    if (sel === null) {
      if (legalMovesFrom(s, sq).length > 0) setSelected(sq);
      return;
    }

    // Con selección: ¿el clic es un destino legal?
    const move = legalMovesFrom(s, sel).find((m) => m.to === sq);
    if (move) {
      let next = applyMove(s, move);
      setSelected(null);

      // Respuesta del rival (negras) en la misma ronda.
      if (next.status === 'playing') {
        const ai = chooseAiMove(next, 'black');
        next = ai ? applyMove(next, ai) : { ...next, status: 'won' };
      }
      setState(next);
      return;
    }

    // Reseleccionar otra pieza propia, o deseleccionar.
    if (legalMovesFrom(s, sq).length > 0) setSelected(sq);
    else setSelected(null);
  }, []);

  const restart = useCallback(() => {
    setState(createDuel());
    setSelected(null);
  }, []);

  // Inicializa el tablero de Pixi una sola vez.
  useEffect(() => {
    const view = new BoardView({ onSquareClick: handleSquareClick });
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
  }, [handleSquareClick]);

  // Redibuja cuando cambian el estado o la selección.
  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;
    const targets = selected !== null ? legalMovesFrom(state, selected).map((m) => m.to) : [];
    view.render(state.board, selected, targets);
  }, [state, selected]);

  return (
    <main className="layout">
      <div className="board" ref={containerRef} />
      <Hud state={state} onRestart={restart} />
    </main>
  );
}
