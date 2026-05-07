import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import electron from 'vite-plugin-electron';

export default defineConfig({
  plugins: [
    react(),
    electron([
      {
        // Main process entry
        entry: 'electron/main.js',
        vite: {
          build: {
            rollupOptions: {
              external: [
                'bcrypt', 
                'node-machine-id', 
                'sharp', 
                'snoowrap', 
                'twitter-api-v2',
                'node-fetch',
                '@neondatabase/serverless',
                'better-sqlite3'
              ],
            }
          }
        }
      }
    ]),
    {
      name: 'copy-preload',
      buildStart() {
        import('fs').then(fs => {
          if (!fs.existsSync('dist-electron')) {
            fs.mkdirSync('dist-electron', { recursive: true });
          }
          fs.copyFileSync('electron/preload.cjs', 'dist-electron/preload.cjs');
        });
      }
    }
  ],
  resolve: {
    alias: {
      '@': '/src',
    },
  },
  build: {
    rollupOptions: {
      // Frontend external (though frontend shouldn't import these)
      external: ['mock-aws-s3', 'aws-sdk', 'nock'],
    },
  },
  optimizeDeps: {
    exclude: ['electron'],
  },
});
