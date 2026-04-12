import { defineConfig } from 'vite';
import swc from 'unplugin-swc';
import { resolve } from 'node:path';

export default defineConfig({
  plugins: [swc.vite({ jsc: { target: 'es2022', parser: { syntax: 'typescript' } } })],
  build: {
    target: 'es2022',
    minify: 'esbuild',
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        proxy: resolve(__dirname, 'proxy.html'),
        games: resolve(__dirname, 'games.html'),
        apps: resolve(__dirname, 'apps.html'),
        emulator: resolve(__dirname, 'emulator.html'),
        play: resolve(__dirname, 'play.html'),
        settings: resolve(__dirname, 'settings.html'),
        history: resolve(__dirname, 'history.html'),
        notfound: resolve(__dirname, '404.html'),
      },
    },
  },
  server: {
    port: 5173,
    host: true,
    proxy: {
      '/bare': { target: 'http://localhost:3000', changeOrigin: true, ws: true },
    },
  },
  assetsInclude: ['**/*.wasm'],
});
