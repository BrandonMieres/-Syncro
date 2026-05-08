import { neon } from '@neondatabase/serverless';
import 'dotenv/config';

let dbUrl = process.env.DATABASE_URL;

// En producción, extraer la URL ofuscada inyectada por Vite
if (!dbUrl && typeof import.meta.env.OBF_DB_URL === 'string' && import.meta.env.OBF_DB_URL.length > 0) {
  dbUrl = Buffer.from(import.meta.env.OBF_DB_URL, 'base64').toString('utf8');
}

if (!dbUrl) {
  console.warn('⚠️ DATABASE_URL no está definida en el entorno.');
}

export const sql = dbUrl 
  ? neon(dbUrl) 
  : (...args) => { 
      console.error('❌ Database connection failed: DATABASE_URL is missing.');
      throw new Error('DATABASE_URL is not defined. Please check your .env file.');
    };