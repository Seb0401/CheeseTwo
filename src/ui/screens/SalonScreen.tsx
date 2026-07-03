// El Salón: pantalla de título y menú principal (ver docs/10-interfaz.md).

interface SalonScreenProps {
  onPlay: () => void;
  onCompendium: () => void;
}

export function SalonScreen({ onPlay, onCompendium }: SalonScreenProps) {
  return (
    <main className="screen salon">
      <h1 className="salon-title">CheeseTwo</h1>
      <p className="salon-tagline">Salón de juegos de mesa roguelike</p>

      <div className="salon-menu">
        <button className="btn btn-primary" onClick={onPlay}>
          Jugar
        </button>
        <button className="btn" onClick={onCompendium}>
          Compendio
        </button>
        <button className="btn" disabled title="Próximamente">
          Opciones
        </button>
      </div>

      <p className="salon-footer">Prototipo · Hito 0 — motor multi-juego</p>
    </main>
  );
}
