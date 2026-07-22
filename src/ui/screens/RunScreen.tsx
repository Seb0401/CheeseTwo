// Controlador de un RUN: encadena Tienda → Duelo → Tienda … → Resultado.
// Posee el RunState (roster, oro, Estandartes) y decide las transiciones.
// La lógica pura vive en src/game/run.ts; aquí solo va el pegamento de React.

import { useCallback, useMemo, useState } from 'react';
import {
  Banner,
  Board,
  CLAUSES,
  createRng,
  DuelConfig,
  DuelState,
  GameDef,
  PieceType,
  setupBoardForClauses,
} from '../../engine';
import {
  BANNER_COST,
  buildDuelBoard,
  canBuyBanner,
  createRun,
  duelReward,
  forgeCost,
  forgePiece,
  isBossDuel,
  plansForCrown,
  rerollCost,
  rosterTypes,
} from '../../game/run';
import { DuelScreen } from './DuelScreen';
import { ShopScreen } from './ShopScreen';

interface RunScreenProps {
  game: GameDef;
  /** Tablero inicial (ya con el ejército aplicado). */
  initialBoard: Board;
  /** Semilla del run (fija las cláusulas del Jefe). */
  seed: number;
  /** Nivel de Corona elegido (0 = sin Corona). Ver game/crowns.ts. */
  crown: number;
  /** Oro inicial extra del ejército (Mercader). */
  goldBonus?: number;
  onDiscoverPieces: (gameId: string, types: PieceType[]) => void;
  onRecordDuel: (won: boolean) => void;
  onRunEnd: (won: boolean) => void;
  onExit: () => void;
}

type Phase = 'shop' | 'duel' | 'result';

export function RunScreen({
  game,
  initialBoard,
  seed,
  crown,
  goldBonus = 0,
  onDiscoverPieces,
  onRecordDuel,
  onRunEnd,
  onExit,
}: RunScreenProps) {
  const [run, setRun] = useState(() => createRun(game, initialBoard, seed, goldBonus, crown));
  const [phase, setPhase] = useState<Phase>('shop');
  const [rerolls, setRerolls] = useState(0);
  const [outcome, setOutcome] = useState<'won' | 'lost' | null>(null);
  const [duelConfig, setDuelConfig] = useState<DuelConfig | null>(null);

  const plans = useMemo(() => plansForCrown(run.crown), [run.crown]);
  const plan = plans[run.duelIndex];
  const isLast = run.duelIndex === plans.length - 1;

  // ── Tienda ────────────────────────────────────────────────────────────────
  const buyBanner = useCallback((banner: Banner) => {
    setRun((r) =>
      canBuyBanner(r)
        ? { ...r, gold: r.gold - BANNER_COST, banners: [...r.banners, banner.id] }
        : r,
    );
  }, []);

  const reroll = useCallback(() => {
    setRun((r) => {
      const cost = rerollCost(r);
      return r.gold >= cost ? { ...r, gold: r.gold - cost } : r;
    });
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
    const duelSeed = 1000 + run.duelIndex * 97;
    let board = buildDuelBoard(game, run.roster, plan, createRng(duelSeed));
    // El Jefe aplica sus cláusulas: pueden transformar el tablero inicial.
    const bossIds = isBossDuel(run) ? run.clauseIds : [];
    if (bossIds.length > 0) board = setupBoardForClauses(bossIds, board);
    onDiscoverPieces(game.id, rosterTypes(run));
    setDuelConfig({
      board,
      banners: run.banners,
      target: plan.target,
      turnLimit: plan.turnLimit,
      clauses: bossIds,
    });
    setOutcome(null);
    setPhase('duel');
  }, [game, run, plan, onDiscoverPieces]);

  const handleResult = useCallback(
    (state: DuelState) => {
      const won = state.status === 'won';
      onRecordDuel(won);
      if (won) {
        setRun((r) => ({ ...r, gold: r.gold + duelReward(plan, state.pressure, r.crown) }));
      }
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
  // Las cláusulas solo se revelan en la Tienda previa al Jefe (y en su Duelo).
  const bossClauses = isBossDuel(run)
    ? run.clauseIds.map((id) => CLAUSES[id]).filter((c): c is NonNullable<typeof c> => Boolean(c))
    : [];

  if (phase === 'shop') {
    return (
      <ShopScreen
        game={game}
        run={run}
        nextPlan={plan}
        duelNumber={run.duelIndex + 1}
        totalDuels={plans.length}
        offerSeed={offerSeed}
        bossClauses={bossClauses}
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
        title={`${plan.label} · Duelo ${run.duelIndex + 1}/${plans.length}`}
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
