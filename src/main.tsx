import { createRoot } from 'react-dom/client';
import { App } from './ui/App';
import './styles.css';

// Sin StrictMode a propósito: evita la doble inicialización del canvas de Pixi
// en desarrollo. Se puede reactivar cuando el montaje sea idempotente.
createRoot(document.getElementById('root')!).render(<App />);
