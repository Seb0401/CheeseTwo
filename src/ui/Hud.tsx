import { DuelState } from '../engine';

interface HudProps {
  state: DuelState;
  onRestart: () => void;
}

export function Hud({ state, onRestart }: HudProps) {
  const pct = Math.min(100, Math.round((state.pressure / state.target) * 100));

  return (
    <aside className="hud">
      <h1>
        CheeseTwo <span className="sub">— Hito 0</span>
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

      <p className="hint">
        Juegas con las <strong>blancas</strong> (abajo). Captura piezas para generar{' '}
        <strong>Presión</strong> y alcanza la meta antes de que se acaben los turnos. Capturar al
        rey rival gana el Duelo al instante.
      </p>
    </aside>
  );
}
