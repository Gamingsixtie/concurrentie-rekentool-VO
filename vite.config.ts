import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { devApiPlugin } from './vite-api-plugin';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const apiKey = env.VITE_ANTHROPIC_API_KEY;

  return {
    plugins: [
      react(),
      tailwindcss(),
      ...(apiKey ? [devApiPlugin(apiKey)] : []),
    ],
    resolve: { alias: { '@': '/src' } },
    server: { port: 3000 },
  };
});
