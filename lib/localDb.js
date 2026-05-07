import Database from 'better-sqlite3';
import path from 'path';
import { app } from 'electron';
import fs from 'fs';
import { encrypt } from './crypto.js';

let db;

function getDb() {
  if (!db) {
    const userDataPath = app.getPath('userData');
    const dbPath = path.join(userDataPath, 'local_data.db');
    db = new Database(dbPath);
    db.pragma('foreign_keys = ON');
    
    // Configurar WAL mode para mayor seguridad contra corrupciones
    db.pragma('journal_mode = WAL');
  }
  return db;
}

/**
 * Cierra la conexión a la base de datos de forma segura
 */
export function closeLocalDb() {
  if (db) {
    try {
      db.close();
      db = null;
    } catch (err) {
      console.error('❌ Error al cerrar la base de datos:', err);
    }
  }
}

/**
 * Inicializa las tablas locales si no existen
 */
export function initLocalDb() {
  const db = getDb();

  // --- MIGRACIÓN DE DATOS (Multi-canal y Columnas faltantes) ---
  
  // 1. Migrar youtube_accounts (añadir uploads_playlist_id si falta)
  const youtubeInfo = db.prepare("PRAGMA table_info(youtube_accounts)").all();
  if (youtubeInfo.length > 0) {
    const hasUploadsPlaylist = youtubeInfo.some(col => col.name === 'uploads_playlist_id');
    if (!hasUploadsPlaylist) {
      db.exec('ALTER TABLE youtube_accounts ADD COLUMN uploads_playlist_id TEXT');
    }
  }

  // Migrar publish_logs (añadir channel_id si falta)
  const historyInfo = db.prepare("PRAGMA table_info(publish_logs)").all();
  if (historyInfo.length > 0) {
    const hasChannelIdLog = historyInfo.some(col => col.name === 'channel_id');
    if (!hasChannelIdLog) {
      db.exec("ALTER TABLE publish_logs ADD COLUMN channel_id TEXT DEFAULT 'unknown'");
    }
  }

  // 1.5 Adoptar historial huérfano de forma inteligente
  try {
    const unknownLogs = db.prepare("SELECT id, user_id, video_id FROM publish_logs WHERE channel_id = 'unknown'").all();
    
    unknownLogs.forEach(log => {
      // Intentar encontrar el canal real a través de la caché de videos
      const cachedVideo = db.prepare("SELECT channel_id FROM video_cache WHERE video_id = ? LIMIT 1").get(log.video_id);
      
      if (cachedVideo) {
        // Encontrado por caché: precisión 100%
        db.prepare("UPDATE publish_logs SET channel_id = ? WHERE id = ?").run(cachedVideo.channel_id, log.id);
      } else {
        // No encontrado en caché: buscar el primer canal del usuario como fallback
        const firstChannel = db.prepare("SELECT channel_id FROM youtube_accounts WHERE user_id = ? LIMIT 1").get(log.user_id);
        if (firstChannel) {
          db.prepare("UPDATE publish_logs SET channel_id = ? WHERE id = ?").run(firstChannel.channel_id, log.id);
        }
      }
    });
  } catch (e) {
    console.warn('⚠️ Error en adopción inteligente de historial:', e.message);
  }

  // 2. Migrar social_accounts y caption_templates
  const socialInfo = db.prepare("PRAGMA table_info(social_accounts)").all();
  const hasChannelId = socialInfo.some(col => col.name === 'channel_id');
  
  if (socialInfo.length > 0 && !hasChannelId) {
    db.transaction(() => {
      // Migrar social_accounts
      db.exec(`
        CREATE TABLE social_accounts_new (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id TEXT NOT NULL,
          channel_id TEXT NOT NULL DEFAULT 'global',
          platform TEXT NOT NULL,
          credentials TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(user_id, channel_id, platform)
        );
        INSERT INTO social_accounts_new (id, user_id, channel_id, platform, credentials, created_at)
        SELECT id, user_id, 'global', platform, credentials, created_at FROM social_accounts;
        DROP TABLE social_accounts;
        ALTER TABLE social_accounts_new RENAME TO social_accounts;
      `);

      // Migrar caption_templates
      const templateInfo = db.prepare("PRAGMA table_info(caption_templates)").all();
      if (templateInfo.length > 0) {
        db.exec(`
          CREATE TABLE caption_templates_new (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id TEXT NOT NULL,
            channel_id TEXT NOT NULL DEFAULT 'global',
            platform TEXT NOT NULL,
            template TEXT,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(user_id, channel_id, platform)
          );
          INSERT INTO caption_templates_new (id, user_id, channel_id, platform, template, updated_at)
          SELECT id, user_id, 'global', platform, template, updated_at FROM caption_templates;
          DROP TABLE caption_templates;
          ALTER TABLE caption_templates_new RENAME TO caption_templates;
        `);
      }
    })();
  }
    
  // 3. Limpiar IDs de usuario (corrección de '1.0' a '1')
  try {
    const tables = ['youtube_accounts', 'social_accounts', 'caption_templates', 'settings', 'publish_logs'];
    tables.forEach(table => {
      // Verificar si la tabla existe antes de intentar el update
      const tableExists = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name=?").get(table);
      if (tableExists) {
        db.prepare(`UPDATE ${table} SET user_id = '1' WHERE user_id = '1.0' OR user_id = 1`).run();
      }
    });
  } catch (e) {
    console.warn('⚠️ Error limpiando IDs:', e.message);
  }

  // 4. Migrar credenciales globales y de placeholders a canales reales
  try {
      const makeSettings = db.prepare("SELECT user_id, value as webhook_url FROM settings WHERE key = 'make_webhook_url'").all();
      
      makeSettings.forEach(s => {
        const makeApiKey = db.prepare("SELECT value FROM settings WHERE user_id = ? AND key = 'make_api_key'").get(s.user_id);
        const creds = encrypt(JSON.stringify({
          webhook_url: s.webhook_url,
          api_key: makeApiKey ? makeApiKey.value : ''
        }));
        
        db.prepare(`
          INSERT INTO social_accounts (user_id, channel_id, platform, credentials)
          VALUES (?, 'global', 'make', ?)
          ON CONFLICT(user_id, channel_id, platform) DO NOTHING
        `).run(s.user_id, creds);
        
        db.prepare("DELETE FROM settings WHERE user_id = ? AND key IN ('make_webhook_url', 'make_api_key')").run(s.user_id);
      });

      const usersWithGlobal = db.prepare("SELECT DISTINCT user_id FROM social_accounts WHERE channel_id = 'global' UNION SELECT DISTINCT user_id FROM caption_templates WHERE channel_id = 'global'").all();
      
      usersWithGlobal.forEach(u => {
        const firstChannel = db.prepare("SELECT channel_id, channel_name FROM youtube_accounts WHERE user_id = ? LIMIT 1").get(u.user_id);
        if (firstChannel) {
          // Mover social_accounts (usando INSERT OR IGNORE para no pisar si ya existe algo en el canal real)
          db.prepare(`
            INSERT OR IGNORE INTO social_accounts (user_id, channel_id, platform, credentials)
            SELECT user_id, ?, platform, credentials FROM social_accounts WHERE user_id = ? AND channel_id = 'global'
          `).run(firstChannel.channel_id, u.user_id);
          
          // Mover caption_templates
          db.prepare(`
            INSERT OR IGNORE INTO caption_templates (user_id, channel_id, platform, template)
            SELECT user_id, ?, platform, template FROM caption_templates WHERE user_id = ? AND channel_id = 'global'
          `).run(firstChannel.channel_id, u.user_id);

          // Una vez migrados, podemos limpiar 'global' para ese usuario si queremos, 
          // pero por seguridad lo dejamos o lo borramos solo si el insert funcionó.
          db.prepare("DELETE FROM social_accounts WHERE user_id = ? AND channel_id = 'global'").run(u.user_id);
          db.prepare("DELETE FROM caption_templates WHERE user_id = ? AND channel_id = 'global'").run(u.user_id);
        }
      });
  } catch (e) {
    console.warn('⚠️ Error en la migración de datos:', e.message);
  }

  // --- INICIALIZACIÓN ESTÁNDAR ---
  db.exec(`
    CREATE TABLE IF NOT EXISTS youtube_accounts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      channel_id TEXT NOT NULL,
      channel_name TEXT,
      thumbnail_url TEXT,
      api_key TEXT,
      uploads_playlist_id TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, channel_id)
    );

    CREATE TABLE IF NOT EXISTS social_accounts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      channel_id TEXT NOT NULL,
      platform TEXT NOT NULL,
      credentials TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, channel_id, platform)
    );

    CREATE TABLE IF NOT EXISTS caption_templates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      channel_id TEXT NOT NULL,
      platform TEXT NOT NULL,
      template TEXT,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, channel_id, platform)
    );

    CREATE TABLE IF NOT EXISTS publish_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      channel_id TEXT NOT NULL DEFAULT 'unknown',
      video_id TEXT,
      video_title TEXT,
      video_url TEXT,
      platform TEXT,
      status TEXT,
      post_url TEXT,
      error_msg TEXT,
      caption_used TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS video_cache (
      channel_id TEXT NOT NULL,
      video_id TEXT NOT NULL,
      title TEXT,
      description TEXT,
      thumbnail TEXT,
      url TEXT,
      published_at DATETIME,
      video_type TEXT, -- 'video', 'short', 'live'
      PRIMARY KEY(channel_id, video_id)
    );

    CREATE TABLE IF NOT EXISTS settings (
      user_id TEXT NOT NULL,
      key TEXT NOT NULL,
      value TEXT,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY(user_id, key)
    );
  `);
}

/**
 * Wrapper para simular una interfaz similar a lo que usábamos con Neon/sql
 * pero adaptado a SQLite (Better-SQLite3)
 */
export const localSql = {
  // Para queries simples (select)
  query: (text, params = []) => {
    return getDb().prepare(text).all(...params);
  },
  // Para una sola fila
  get: (text, params = []) => {
    return getDb().prepare(text).get(...params);
  },
  // Para ejecutar (insert/update/delete)
  run: (text, params = []) => {
    return getDb().prepare(text).run(...params);
  },
  // Para transacciones simples
  transaction: (fn) => {
    return getDb().transaction(fn)();
  }
};

export default getDb;