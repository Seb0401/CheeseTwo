import { DuelState, GameDef } from '../engine';

interface HudProps {
  game: GameDef;
  state: DuelState;
  onRestart: () => void;
  onExit: () => void;
}

export function Hud({ game, state, onRestart, onExit }: HudProps) {
  const pct = Math.min(100, Math.round((state.pressure / state.target) * 100));

  return (
    <aside className="hud">
      <h1>
        CheeseTwo <span className="sub">— {game.name} · Hito 0</span>
      </h1>

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

      {state.status !== 'playing' && (
        <div className={`banner ${state.status}`}>
          {state.status === 'won' ? '¡Meta alcanzada! 🏆' : 'Derrota 💀'}
        </div>
      )}

      <button className="restart" onClick={onRestart}>
        Nuevo Duelo
      </button>
      <button className="exit" onClick={onExit}>
        Volver al Salón
      </button>

      <p className="hint">
        Juegas con las <strong>blancas</strong> (abajo). {game.hint}
      </p>
    </aside>
  );
}
