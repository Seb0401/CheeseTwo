// Preparación de Run: elegir Modo (juego) y Ejército inicial antes de jugar.
// Se dibuja desde los catálogos data-driven de src/game/modes.ts.

import { useMemo, useState } from 'react';
import { GameDef } from '../../engine';
import { armiesForMode, ArmyInfo, MODES } from '../../game/modes';

interface RunSetupScreenProps {
  onStart: (game: GameDef, army: ArmyInfo) => void;
  onBack: () => void;
}

export function RunSetupScreen({ onStart, onBack }: RunSetupScreenProps) {
  const [modeId, setModeId] = useState(MODES.find((m) => m.status === 'playable')!.id);
  const [armyId, setArmyId] = useState('clasico');

  const mode = MODES.find((m) => m.id === modeId)!;
  // Los ejércitos dependen del modo (Herético solo tiene sentido en Ajedrez).
  const armies = useMemo(() => armiesForMode(modeId), [modeId]);
  const army = armies.find((a) => a.id === armyId) ?? armies[0];

  return (
    <main className="screen">
      <header className="topbar">
        <button className="btn btn-back" onClick={onBack}>
          ← Salón
        </button>
        <h2>Preparación de Run</h2>
      </header>

      <section>
        <h3 className="section-title">Modo</h3>
        <div className="card-row">
          {MODES.map((m) => (
            <button
              key={m.id}
              className={`select-card ${m.status === 'locked' ? 'locked' : ''} ${
                m.id === modeId ? 'selected' : ''
              }`}
              disabled={m.status === 'locked'}
              onClick={() => setModeId(m.id)}
            >
              <span className="card-icon">{m.status === 'locked' ? '🔒' : m.icon}</span>
              <span className="card-name">{m.name}</span>
              <span className="card-desc">
                {m.status === 'locked' ? m.unlockHint : m.tagline}
              </span>
            </button>
          ))}
        </div>
      </section>

      <section>
        <h3 className="section-title">Ejército inicial</h3>
        <div className="card-row">
          {armies.map((a) => (
            <button
              key={a.id}
              className={`select-card ${a.status === 'locked' ? 'locked' : ''} ${
                a.id === armyId ? 'selected' : ''
              }`}
              disabled={a.status === 'locked'}
              onClick={() => setArmyId(a.id)}
            >
              <span className="card-icon">{a.status === 'locked' ? '🔒' : a.icon}</span>
              <span className="card-name">{a.name}</span>
              <span className="card-desc">
                {a.status === 'locked' ? a.unlockHint : a.description}
              </span>
            </button>
          ))}
        </div>
      </section>

      <footer className="setup-footer">
        <p className="hint">
          El run son <strong>3 Duelos</strong> de dificultad creciente hasta el <strong>Jefe</strong>
          , con una <strong>Tienda</strong> entre cada uno para comprar Estandartes y{' '}
          <strong>forjar</strong> tus fichas.
        </p>
        <button className="btn btn-primary btn-start" onClick={() => onStart(mode.game!, army)}>
          Empezar run — {mode.name} · {army.name}
        </button>
      </footer>
    </main>
  );
}
