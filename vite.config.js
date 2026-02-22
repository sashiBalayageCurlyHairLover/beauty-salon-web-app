import { defineConfig } from 'vite';
import { resolve } from 'node:path';

export default defineConfig({
  root: 'src',
  envDir: '..',
  appType: 'mpa',
  build: {
    outDir: '../dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        index: resolve(__dirname, 'src/index.html'),
        profile: resolve(__dirname, 'src/profile/index.html'),
        login: resolve(__dirname, 'src/login/index.html'),
        register: resolve(__dirname, 'src/register/index.html')
      }
    }
  }
});
