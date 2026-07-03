// Router de pantallas de la app (ver docs/10-interfaz.md):
// Salón → Preparación de Run → Duelo, y Compendio como colección compartida.
// El estado DEL JUEGO vive en el motor; aquí solo navegación y meta-progresión.

import { useCallback, useState } from 'react';
import { GameDef } from '../engine';
import { discoverPieces, loadMeta, MetaState, recordDuel, saveMeta } from '../game/meta';
import { CompendiumScreen } from './screens/CompendiumScreen';
import { DuelScreen } from './screens/DuelScreen';
import { RunSetupScreen } from './screens/RunSetupScreen';
import { SalonScreen } from './screens/SalonScreen';

type Screen =
  | { name: 'salon' }
  | { name: 'setup' }
  | { name: 'compendio' }
  | { name: 'duel'; game: GameDef };

export function App() {
  const [screen, setScreen] = useState<Screen>({ name: 'salon' });
  const [meta, setMeta] = useState<MetaState>(() => loadMeta());

  const updateMeta = useCallback((fn: (m: MetaState) => MetaState) => {
    setMeta((prev) => {
      const next = fn(prev);
      if (next !== prev) saveMeta(next);
      return next;
    });
  }, []);

  const startDuel = useCallback(
    (game: GameDef) => {
      // Las piezas del tablero inicial quedan descubiertas en el Compendio.
      const types = [...new Set(game.createInitialBoard().flatMap((p) => (p ? [p.type] : [])))];
      updateMeta((m) => discoverPieces(m, game.id, types));
      setScreen({ name: 'duel', game });
    },
    [updateMeta],
  );

  const handleDuelEnd = useCallback(
    (won: boolean) => updateMeta((m) => recordDuel(m, won)),
    [updateMeta],
  );

  switch (screen.name) {
    case 'salon':
      return (
        <SalonScreen
          onPlay={() => setScreen({ name: 'setup' })}
          onCompendium={() => setScreen({ name: 'compendio' })}
        />
      );
    case 'setup':
      return <RunSetupScreen onStart={startDuel} onBack={() => setScreen({ name: 'salon' })} />;
    case 'compendio':
      return <CompendiumScreen meta={meta} onBack={() => setScreen({ name: 'salon' })} />;
    case 'duel':
      return (
        <DuelScreen
          game={screen.game}
          onDuelEnd={handleDuelEnd}
          onExit={() => setScreen({ name: 'salon' })}
        />
      );
  }
}
