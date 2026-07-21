import { BANNERS, CLAUSES, DuelState, GameDef } from '../engine';

interface HudProps {
  game: GameDef;
  state: DuelState;
  /** Subtítulo del Duelo dentro del run (ej. "Rival Menor · Duelo 1/3"). */
  title?: string;
  /** Oro actual del run (se muestra como chip). */
  gold?: number;
  /** Botón que avanza cuando el Duelo termina (a la tienda o al resultado). */
  onContinue: () => void;
  onExit: () => void;
  exitLabel?: string;
}

export function Hud({ game, state, title, gold, onContinue, onExit, exitLabel }: HudProps) {
  const pct = Math.min(100, Math.round((state.pressure / state.target) * 100));
  const banners = state.banners.map((id) => BANNERS[id]).filter(Boolean);
  const clause = state.clause ? CLAUSES[state.clause] : undefined;
  const score = state.lastScore;
  const ended = state.status !== 'playing';

  return (
    <aside className="hud">
      <h1>
        CheeseTwo <span className="sub">— {title ?? game.name}</span>
      </h1>

      {gold !== undefined && (
        <div className="stat">
          <span>Oro</span>
          <strong>🪙 {gold}</strong>
        </div>
      )}

      <div className="stat">
        <span>Presión</span>
        <strong>
          {state.pressure} / {state.target}
        </strong>
      </div>
      <div className="bar">
        <div className="bar-fill" style={{ width: `${pct}%` }} />
      </div>

      <div className="stat">
        <span>Turnos</span>
        <strong>
          {state.turnsUsed} / {state.turnLimit}
        </strong>
      </div>

      {clause && (
        <div className="clause-box" title={clause.description}>
          <span className="clause-title">
            {clause.icon} Cláusula: {clause.name}
          </span>
          <span className="clause-desc">{clause.description}</span>
        </div>
      )}

      {banners.length > 0 && (
        <div className="hud-banners">
          {banners.map((b) => (
            <span key={b.id} className="hud-banner-chip" title={b.description}>
              {b.icon} {b.name}
            </span>
          ))}
        </div>
      )}

      {score && score.total > 0 && (
        <div className="score-box">
          <div className="score-line">
            <span>Última jugada</span>
            <strong>
              {score.base} × {score.mult} = {score.total}
            </strong>
          </div>
          {score.notes.map((n, i) => (
            <div key={i} className="score-note">
              <span>{n.source}</span>
              <span>{n.detail}</span>
            </div>
          ))}
        </div>
      )}

      {ended && (
        <div className={`banner ${state.status}`}>
          {state.status === 'won' ? '¡Duelo ganado! 🏆' : 'Derrota 💀'}
        </div>
      )}

      {ended && (
        <button className="restart" onClick={onContinue}>
          Continuar →
        </button>
      )}
      <button className="exit" onClick={onExit}>
        {exitLabel ?? 'Volver al Salón'}
      </button>

      <p className="hint">
        Juegas con las <strong>blancas</strong> (abajo). {game.hint}
      </p>
    </aside>
  );
}
