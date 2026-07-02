import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

// Config compartida Vite + Vitest.
// El motor (`src/engine`) es TS puro y se testea en entorno node.
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
});
