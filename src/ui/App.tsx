// Router de pantallas de la app (ver docs/10-interfaz.md):
// Salón → Preparación de Run → RunScreen (Tienda ↔ Duelo ↔ Resultado),
// y Compendio como colección compartida.
// El estado DEL JUEGO vive en el motor; aquí solo navegación y meta-progresión.

import { useCallback, useState } from 'react';
import { Board, GameDef, PieceType } from '../engine';
import {
  discoverPieces,
  loadMeta,
  MetaState,
  recordDuel,
  recordRunWin,
  saveMeta,
} from '../game/meta';
import { ArmyInfo } from '../game/modes';
import { CompendiumScreen } from './screens/CompendiumScreen';
import { RunScreen } from './screens/RunScreen';
import { RunSetupScreen } from './screens/RunSetupScreen';
import { SalonScreen } from './screens/SalonScreen';

type Screen =
  | { name: 'salon' }
  | { name: 'setup' }
  | { name: 'compendio' }
  | { name: 'run'; game: GameDef; army: ArmyInfo; board: Board; seed: number };

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

  /** Preparación lista → arrancar el run con el ejército elegido aplicado. */
  const startRun = useCallback((game: GameDef, army: ArmyInfo) => {
    const base = game.createInitialBoard();
    const board = army.apply ? army.apply(base) : base;
    setScreen({ name: 'run', game, army, board, seed: (Date.now() ^ (Math.random() * 1e9)) >>> 0 });
  }, []);

  const discover = useCallback(
    (gameId: string, types: PieceType[]) => updateMeta((m) => discoverPieces(m, gameId, types)),
    [updateMeta],
  );
  const recordDuelResult = useCallback(
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
      return (
        <RunSetupScreen
          meta={meta}
          onStart={startRun}
          onBack={() => setScreen({ name: 'salon' })}
        />
      );
    case 'compendio':
      return <CompendiumScreen meta={meta} onBack={() => setScreen({ name: 'salon' })} />;
    case 'run':
      return (
        <RunScreen
          game={screen.game}
          initialBoard={screen.board}
          seed={screen.seed}
          goldBonus={screen.army.startingGoldBonus}
          onDiscoverPieces={discover}
          onRecordDuel={recordDuelResult}
          onRunEnd={(won) => {
            if (won) updateMeta((m) => recordRunWin(m, screen.game.id, screen.army.id));
          }}
          onExit={() => setScreen({ name: 'salon' })}
        />
      );
  }
}
