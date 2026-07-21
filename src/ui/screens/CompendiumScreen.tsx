// El Compendio: la colección compartida entre modos (estilo Balatro).
// Lo no descubierto se muestra como silueta "?" — jugar es lo que revela.

import { BANNERS, GameDef } from '../../engine';
import { isDiscovered, isUnlocked, MetaState } from '../../game/meta';
import { ARMIES, MODES } from '../../game/modes';

interface CompendiumScreenProps {
  meta: MetaState;
  onBack: () => void;
}

/** Ranura misteriosa para piezas aún no descubiertas. */
function MysterySlot({ label }: { label: string }) {
  return (
    <div className="piece-card unknown">
      <span className="piece-glyph">?</span>
      <span className="piece-name">???</span>
      <span className="piece-sub">{label}</span>
    </div>
  );
}

function PieceGrid({ game, meta }: { game: GameDef; meta: MetaState }) {
  return (
    <div className="card-row">
      {Object.entries(game.pieces).map(([type, info]) => {
        const known = isDiscovered(meta, game.id, type);
        if (!known) {
          return <MysterySlot key={type} label="Juega un Duelo para descubrirla" />;
        }
        return (
          <div key={type} className="piece-card">
            <span className="piece-glyph">{info.glyph.white}</span>
            <span className="piece-name">{info.name}</span>
            <span className="piece-sub">
              {info.objective ? 'Pieza objetivo' : `Captura: ${info.captureValue} de base`}
            </span>
          </div>
        );
      })}
    </div>
  );
}

export function CompendiumScreen({ meta, onBack }: CompendiumScreenProps) {
  const playableModes = MODES.filter((m) => m.game);
  const totalPieces = playableModes.reduce((n, m) => n + Object.keys(m.game!.pieces).length, 0);
  const discovered = meta.discovered.length;
  const banners = Object.values(BANNERS);

  return (
    <main className="screen">
      <header className="topbar">
        <button className="btn btn-back" onClick={onBack}>
          ← Salón
        </button>
        <h2>Compendio</h2>
      </header>

      <div className="stats-row">
        <span className="chip">
          Descubierto: <strong>{discovered}</strong> / {totalPieces}
        </span>
        <span className="chip">
          Runs ganados: <strong>{meta.runsWon}</strong>
        </span>
        <span className="chip">
          Duelos G/P: <strong>{meta.duelsWon}</strong> / {meta.duelsLost}
        </span>
      </div>

      <section>
        <h3 className="section-title">Modos</h3>
        <div className="card-row">
          {MODES.map((m) => (
            <div key={m.id} className={`select-card static ${m.status === 'locked' ? 'locked' : ''}`}>
              <span className="card-icon">{m.status === 'locked' ? '🔒' : m.icon}</span>
              <span className="card-name">{m.name}</span>
              <span className="card-desc">{m.status === 'locked' ? m.unlockHint : m.tagline}</span>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h3 className="section-title">Ejércitos</h3>
        <div className="card-row">
          {ARMIES.map((a) => {
            const locked = !isUnlocked(meta, a.unlockId);
            return (
              <div key={a.id} className={`select-card static ${locked ? 'locked' : ''}`}>
                <span className="card-icon">{locked ? '🔒' : a.icon}</span>
                <span className="card-name">{a.name}</span>
                <span className="card-desc">{locked ? a.unlockHint : a.description}</span>
              </div>
            );
          })}
        </div>
      </section>

      {playableModes.map((m) => (
        <section key={m.id}>
          <h3 className="section-title">Piezas — {m.name}</h3>
          <PieceGrid game={m.game!} meta={meta} />
        </section>
      ))}

      <section>
        <h3 className="section-title">Estandartes ({banners.length})</h3>
        <div className="card-row">
          {banners.map((b) => (
            <div key={b.id} className="piece-card">
              <span className="piece-glyph">{b.icon}</span>
              <span className="piece-name">{b.name}</span>
              <span className="piece-sub">{b.description}</span>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
