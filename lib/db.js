import { neon } from '@neondatabase/serverless';
import 'dotenv/config';

if (!process.env.DATABASE_URL) {
  console.warn('⚠️ DATABASE_URL no está definida en el entorno.');
}

export const sql = process.env.DATABASE_URL 
  ? neon(process.env.DATABASE_URL) 
  : (...args) => { 
      console.error('❌ Database connection failed: DATABASE_URL is missing.');
      throw new Error('DATABASE_URL is not defined. Please check your .env file.');
    };