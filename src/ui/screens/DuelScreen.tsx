import { useCallback, useEffect, useRef, useState } from 'react';
import { BoardView } from '../../render/boardView';
import {
  applyMove,
  chooseAiMove,
  createDuel,
  DuelConfig,
  DuelState,
  GameDef,
  legalMovesFrom,
  SquareIndex,
} from '../../engine';
import { Hud } from '../Hud';

interface DuelScreenProps {
  game: GameDef;
  /** Tablero, Estandartes, meta y límite de turnos de este Duelo. */
  config?: DuelConfig;
  /** Subtítulo del Duelo (ej. "Rival Menor · Duelo 1/3"). */
  title?: string;
  gold?: number;
  /** Se llama una sola vez cuando el Duelo termina, con el estado final. */
  onResult: (state: DuelState) => void;
  /** Avanza tras el Duelo (a la tienda o al resultado del run). */
  onContinue: () => void;
  onExit: () => void;
  exitLabel?: string;
}

export function DuelScreen({
  game,
  config,
  title,
  gold,
  onResult,
  onContinue,
  onExit,
  exitLabel,
}: DuelScreenProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<BoardView | null>(null);

  const [state, setState] = useState<DuelState>(() => createDuel(game, config));
  const [selected, setSelected] = useState<SquareIndex | null>(null);

  // Espejo de refs para que el callback de Pixi (creado una sola vez) lea lo actual.
  const stateRef = useRef(state);
  const selectedRef = useRef(selected);
  stateRef.current = state;
  selectedRef.current = selected;

  // Reporta el resultado una sola vez por Duelo.
  const reportedRef = useRef(false);
  const onResultRef = useRef(onResult);
  onResultRef.current = onResult;
  useEffect(() => {
    if (state.status !== 'playing' && !reportedRef.current) {
      reportedRef.current = true;
      onResultRef.current(state);
    }
  }, [state]);

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

  // Inicializa el tablero de Pixi una sola vez.
  useEffect(() => {
    const view = new BoardView({
      onSquareClick: handleSquareClick,
      // Damas reutiliza el tipo 'king' para su Dama: le damos su propio emblema.
      emblemKeyFor: (piece) =>
        game.id === 'damas' && piece.type === 'king' ? 'king_damas' : piece.type,
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
      <Hud
        game={game}
        state={state}
        title={title}
        gold={gold}
        onContinue={onContinue}
        onExit={onExit}
        exitLabel={exitLabel}
      />
    </main>
  );
}
