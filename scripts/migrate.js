import 'dotenv/config';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

async function migrate() {
  console.log('🚀 Iniciando migración de base de datos NUBE (Neon)...');
  console.log('--- NOTA: Solo mantendremos la tabla de usuarios y registro de MAC en la nube ---');

  try {
    // 1. Tabla de Usuarios (Nube)
    await sql(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        mac1 TEXT,
        mac2 TEXT,
        mac3 TEXT,
        status TEXT DEFAULT 'desactivado',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ Tabla "users" verificada.');

    // 2. Registro Global de MACs (Nube - para evitar duplicados entre cuentas)
    await sql(`
      CREATE TABLE IF NOT EXISTS mac_registry (
        mac_hash TEXT PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ Tabla "mac_registry" verificada.');

    console.log('\n✨ Migración de NUBE completada con éxito.');
    console.log('💡 El resto de datos (YouTube, Redes, Logs) ahora se gestionan localmente en la App.');
  } catch (error) {
    console.error('❌ Error en la migración:', error);
    process.exit(1);
  }
}

migrate();
