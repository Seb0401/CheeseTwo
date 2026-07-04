// Controlador de un RUN: encadena Tienda → Duelo → Tienda … → Resultado.
// Posee el RunState (roster, oro, Estandartes) y decide las transiciones.
// La lógica pura vive en src/game/run.ts; aquí solo va el pegamento de React.

import { useCallback, useMemo, useState } from 'react';
import { Banner, Board, createRng, DuelConfig, DuelState, GameDef, PieceType } from '../../engine';
import {
  BANNER_COST,
  buildDuelBoard,
  canBuyBanner,
  createRun,
  duelReward,
  forgeCost,
  forgePiece,
  REROLL_COST,
  rosterTypes,
  RUN_PLANS,
} from '../../game/run';
import { DuelScreen } from './DuelScreen';
import { ShopScreen } from './ShopScreen';

interface RunScreenProps {
  game: GameDef;
  /** Tablero inicial (ya con el ejército aplicado). */
  initialBoard: Board;
  onDiscoverPieces: (gameId: string, types: PieceType[]) => void;
  onRecordDuel: (won: boolean) => void;
  onRunEnd: (won: boolean) => void;
  onExit: () => void;
}

type Phase = 'shop' | 'duel' | 'result';

export function RunScreen({
  game,
  initialBoard,
  onDiscoverPieces,
  onRecordDuel,
  onRunEnd,
  onExit,
}: RunScreenProps) {
  const [run, setRun] = useState(() => createRun(game, initialBoard));
  const [phase, setPhase] = useState<Phase>('shop');
  const [rerolls, setRerolls] = useState(0);
  const [outcome, setOutcome] = useState<'won' | 'lost' | null>(null);
  const [duelConfig, setDuelConfig] = useState<DuelConfig | null>(null);

  const plan = RUN_PLANS[run.duelIndex];
  const isLast = run.duelIndex === RUN_PLANS.length - 1;

  // ── Tienda ────────────────────────────────────────────────────────────────
  const buyBanner = useCallback((banner: Banner) => {
    setRun((r) =>
      canBuyBanner(r)
        ? { ...r, gold: r.gold - BANNER_COST, banners: [...r.banners, banner.id] }
        : r,
    );
  }, []);

  const reroll = useCallback(() => {
    setRun((r) => (r.gold >= REROLL_COST ? { ...r, gold: r.gold - REROLL_COST } : r));
    setRerolls((x) => x + 1);
  }, []);

  const forge = useCallback(
    (index: number, newType: PieceType) => {
      setRun((r) => {
        const cost = forgeCost(game, r.roster[index].type);
        if (r.gold < cost) return r;
        return { ...forgePiece(r, index, newType), gold: r.gold - cost };
      });
    },
    [game],
  );

  // ── Transiciones Duelo ──────────────────────────────────────────────────────
  const startDuel = useCallback(() => {
    const seed = 1000 + run.duelIndex * 97;
    const board = buildDuelBoard(game, run.roster, plan, createRng(seed));
    onDiscoverPieces(game.id, rosterTypes(run));
    setDuelConfig({
      board,
      banners: run.banners,
      target: plan.target,
      turnLimit: plan.turnLimit,
    });
    setOutcome(null);
    setPhase('duel');
  }, [game, run, plan, onDiscoverPieces]);

  const handleResult = useCallback(
    (state: DuelState) => {
      const won = state.status === 'won';
      onRecordDuel(won);
      if (won) setRun((r) => ({ ...r, gold: r.gold + duelReward(plan, state.pressure) }));
      setOutcome(won ? 'won' : 'lost');
    },
    [plan, onRecordDuel],
  );

  const handleContinue = useCallback(() => {
    if (outcome === 'lost') {
      onRunEnd(false);
      setPhase('result');
    } else if (isLast) {
      onRunEnd(true);
      setPhase('result');
    } else {
      setRun((r) => ({ ...r, duelIndex: r.duelIndex + 1 }));
      setRerolls(0);
      setPhase('shop');
    }
  }, [outcome, isLast, onRunEnd]);

  const offerSeed = useMemo(() => run.duelIndex * 100 + rerolls, [run.duelIndex, rerolls]);

  if (phase === 'shop') {
    return (
      <ShopScreen
        game={game}
        run={run}
        nextPlan={plan}
        duelNumber={run.duelIndex + 1}
        totalDuels={RUN_PLANS.length}
        offerSeed={offerSeed}
        onBuyBanner={buyBanner}
        onReroll={reroll}
        onForge={forge}
        onContinue={startDuel}
        onExit={onExit}
      />
    );
  }

  if (phase === 'duel' && duelConfig) {
    return (
      <DuelScreen
        key={run.duelIndex}
        game={game}
        config={duelConfig}
        title={`${plan.label} · Duelo ${run.duelIndex + 1}/${RUN_PLANS.length}`}
        gold={run.gold}
        onResult={handleResult}
        onContinue={handleContinue}
        onExit={onExit}
        exitLabel="Abandonar run"
      />
    );
  }

  // phase === 'result'
  const won = outcome === 'won' && isLast;
  return (
    <main className="screen result-screen">
      <h1 className="salon-title">{won ? '¡Run completado! 🏆' : 'Run terminado 💀'}</h1>
      <p className="salon-tagline">
        {won
          ? `Venciste al JEFE con ${game.name}. Tu ejército evolucionó a través de la Forja.`
          : `Caíste en el ${plan.label}. Cada run enseña una build nueva.`}
      </p>
      <div className="salon-menu">
        <button className="btn btn-primary" onClick={onExit}>
          Volver al Salón
        </button>
      </div>
    </main>
  );
}
