// El Compendio: la colección compartida entre modos (estilo Balatro).
// Lo no descubierto se muestra como silueta "?" — jugar es lo que revela.

import { GameDef } from '../../engine';
import { isDiscovered, MetaState } from '../../game/meta';
import { MODES } from '../../game/modes';

interface CompendiumScreenProps {
  meta: MetaState;
  onBack: () => void;
}

/** Ranura misteriosa para categorías que aún no existen (Estandartes, etc.). */
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
          Duelos ganados: <strong>{meta.duelsWon}</strong>
        </span>
        <span className="chip">
          Duelos perdidos: <strong>{meta.duelsLost}</strong>
        </span>
      </div>

      <section>
        <h3 className="section-title">Modos</h3>
        <div className="card-row">
          {MODES.map((m) => (
            <div key={m.id} className={`select-card static ${m.status === 'locked' ? 'locked' : ''}`}>
              <span className="card-icon">{m.status === 'locked' ? '🔒' : m.icon}</span>
              <span className="card-name">{m.name}</span>
              <span className="card-desc">
                {m.status === 'locked' ? m.unlockHint : m.tagline}
              </span>
            </div>
          ))}
        </div>
      </section>

      {playableModes.map((m) => (
        <section key={m.id}>
          <h3 className="section-title">Piezas — {m.name}</h3>
          <PieceGrid game={m.game!} meta={meta} />
        </section>
      ))}

      <section>
        <h3 className="section-title">Estandartes (Jokers)</h3>
        <div className="card-row">
          {[1, 2, 3, 4, 5].map((n) => (
            <MysterySlot key={n} label="Llegan en el Hito 1" />
          ))}
        </div>
      </section>
    </main>
  );
}
