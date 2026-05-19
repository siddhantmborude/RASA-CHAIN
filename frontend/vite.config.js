import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'https://rasa-chain-backend.onrender.com',
        changeOrigin: true,
      },
      '/uploads': {
        target: 'https://rasa-chain-backend.onrender.com',
        changeOrigin: true,
      },
      '/socket.io': {
        target: 'https://rasa-chain-backend.onrender.com',
        ws: true,
        changeOrigin: true,
      },
    },
  },
});
