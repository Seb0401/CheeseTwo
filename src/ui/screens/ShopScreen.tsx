// La Tienda: pantalla entre Duelos. Compra Estandartes y FORJA tus fichas
// (cambiarlas por otras de su misma casta). Ver docs/10-interfaz.md.

import { useMemo, useState } from 'react';
import { Banner, Clause, GameDef, PieceType } from '../../engine';
import { CASTAS } from '../../game/castas';
import {
  BANNER_COST,
  bannerOffer,
  canBuyBanner,
  DuelPlan,
  forgeCost,
  forgeOptions,
  rerollCost,
  RunState,
} from '../../game/run';
import { createRng } from '../../engine';

interface ShopScreenProps {
  game: GameDef;
  run: RunState;
  nextPlan: DuelPlan;
  duelNumber: number;
  totalDuels: number;
  /** Semilla de la oferta (cambia al rerollar). */
  offerSeed: number;
  /** Cláusulas del Jefe, si el siguiente Duelo es el Jefe (para avisar; Corona II trae 2). */
  bossClauses?: Clause[];
  onBuyBanner: (banner: Banner) => void;
  onReroll: () => void;
  onForge: (rosterIndex: number, newType: PieceType) => void;
  onContinue: () => void;
  onExit: () => void;
}

export function ShopScreen({
  game,
  run,
  nextPlan,
  duelNumber,
  totalDuels,
  offerSeed,
  bossClauses = [],
  onBuyBanner,
  onReroll,
  onForge,
  onContinue,
  onExit,
}: ShopScreenProps) {
  const offer = useMemo(() => bannerOffer(run, createRng(offerSeed)), [run, offerSeed]);
  const reroll = rerollCost(run);
  // Pieza del roster seleccionada para forjar (índice), o null.
  const [forging, setForging] = useState<number | null>(null);

  // Agrupa el roster por tipo para mostrar el ejército de forma compacta.
  const byType = useMemo(() => {
    const map = new Map<PieceType, number[]>();
    run.roster.forEach((e, i) => {
      const list = map.get(e.type) ?? [];
      list.push(i);
      map.set(e.type, list);
    });
    return [...map.entries()];
  }, [run.roster]);

  const forgingType = forging !== null ? run.roster[forging].type : null;
  const forgingCost = forgingType ? forgeCost(game, forgingType) : 0;
  const options = forgingType ? forgeOptions(game, forgingType) : [];

  return (
    <main className="screen">
      <header className="topbar">
        <button className="btn btn-back" onClick={onExit}>
          ← Abandonar
        </button>
        <h2>Tienda</h2>
        <span className="chip gold-chip">🪙 {run.gold}</span>
      </header>

      <p className="hint">
        Siguiente: <strong>{nextPlan.label}</strong> · Duelo {duelNumber}/{totalDuels} · meta{' '}
        {nextPlan.target} de Presión.
      </p>

      {bossClauses.length > 0 && (
        <div className="clause-warning">
          {bossClauses.map((c) => (
            <div key={c.id} className="clause-entry">
              <span className="clause-title">
                ⚠️ {c.icon} Cláusula del Jefe: {c.name}
              </span>
              <span className="clause-desc">{c.description} — prepara tu build en consecuencia.</span>
            </div>
          ))}
        </div>
      )}

      <section>
        <h3 className="section-title">Estandartes ({run.banners.length}/{run.bannerSlots})</h3>
        <div className="card-row">
          {offer.length === 0 && <p className="hint">No quedan Estandartes nuevos que ofrecer.</p>}
          {offer.map((b) => {
            const affordable = canBuyBanner(run);
            return (
              <div key={b.id} className="select-card static shop-card">
                <span className="card-icon">{b.icon}</span>
                <span className="card-name">{b.name}</span>
                <span className="card-desc">{b.description}</span>
                <button
                  className="btn btn-buy"
                  disabled={!affordable}
                  onClick={() => onBuyBanner(b)}
                >
                  Comprar · 🪙 {BANNER_COST}
                </button>
              </div>
            );
          })}
        </div>
        <button className="btn btn-reroll" disabled={run.gold < reroll} onClick={onReroll}>
          🎲 Rerollar · 🪙 {reroll}
        </button>
      </section>

      <section>
        <h3 className="section-title">Forja — cambia una ficha por otra de su casta</h3>
        <div className="card-row">
          {byType.map(([type, indices]) => {
            const info = game.pieces[type];
            const casta = info.casta ? CASTAS[info.casta] : undefined;
            const forgeable = forgeOptions(game, type).length > 0;
            return (
              <div key={type} className="piece-card forge-piece">
                <span className="piece-glyph">{info.glyph.white}</span>
                <span className="piece-name">
                  {info.name} ×{indices.length}
                </span>
                <span className="piece-sub">{casta ? `Casta ${casta.name}` : 'No forjable'}</span>
                {forgeable && (
                  <button
                    className="btn btn-forge"
                    onClick={() => setForging(forging === indices[0] ? null : indices[0])}
                  >
                    Forjar · 🪙 {forgeCost(game, type)}
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {forging !== null && forgingType && (
          <div className="forge-panel">
            <p className="hint">
              Forjar un <strong>{game.pieces[forgingType].name}</strong> (casta{' '}
              {CASTAS[game.pieces[forgingType].casta!].name}) por · 🪙 {forgingCost}:
            </p>
            <div className="card-row">
              {options.map((opt) => {
                const info = game.pieces[opt];
                const affordable = run.gold >= forgingCost;
                return (
                  <button
                    key={opt}
                    className="select-card forge-option"
                    disabled={!affordable}
                    onClick={() => {
                      onForge(forging, opt);
                      setForging(null);
                    }}
                  >
                    <span className="card-icon">{info.glyph.white}</span>
                    <span className="card-name">{info.name}</span>
                    <span className="card-desc">Captura: {info.captureValue} de base</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </section>

      <footer className="setup-footer">
        <p className="hint">
          Tu ejército del run se conserva Duelo tras Duelo. Gastar en la forja es apostar por
          sinergias con tus Estandartes.
        </p>
        <button className="btn btn-primary btn-start" onClick={onContinue}>
          Al Duelo — {nextPlan.label} →
        </button>
      </footer>
    </main>
  );
}
