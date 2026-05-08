import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import electron from 'vite-plugin-electron';
import { config } from 'dotenv';

config();
const dbUrl = process.env.DATABASE_URL || '';
const obfDbUrl = Buffer.from(dbUrl).toString('base64');

export default defineConfig({
  plugins: [
    react(),
    electron([
      {
        // Main process entry
        entry: 'electron/main.js',
        vite: {
          define: {
            'import.meta.env.OBF_DB_URL': JSON.stringify(obfDbUrl)
          },
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
          
          // Copiar el icono .ico para que esté disponible en producción
          if (fs.existsSync('build/icon.ico')) {
            if (!fs.existsSync('dist/assets')) fs.mkdirSync('dist/assets', { recursive: true });
            fs.copyFileSync('build/icon.ico', 'dist/assets/icon.ico');
          }
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
