import { ipcMain } from 'electron';
import { localSql } from '../../lib/localDb.js';
import { encrypt, decrypt } from '../../lib/crypto.js';

export function setupSocialHandlers() {
  // --- GUARDAR CUENTA ---
  ipcMain.handle('social:saveAccount', async (event, { userId, channelId, platform, credentials }) => {
    try {
      if (!channelId) throw new Error('Se requiere el ID del canal de YouTube (channelId).');
      const encryptedCreds = encrypt(JSON.stringify(credentials));
      
      localSql.run(`
        INSERT INTO social_accounts (user_id, channel_id, platform, credentials)
        VALUES (?, ?, ?, ?)
        ON CONFLICT (user_id, channel_id, platform) DO UPDATE 
        SET credentials = EXCLUDED.credentials
      `, [userId, channelId, platform, encryptedCreds]);

      return { success: true };
    } catch (error) {
      console.error('Error guardando cuenta social:', error);
      return { success: false, message: error.message };
    }
  });

  // --- OBTENER ESTADO DE CUENTAS ---
  ipcMain.handle('social:getAccountsStatus', async (event, { userId, channelId }) => {
    try {
      if (!channelId) return { success: true, status: { reddit: false, x: false, facebook: false, instagram: false, make: false } };
      
      const rows = localSql.query(
        'SELECT platform, credentials FROM social_accounts WHERE user_id = ? AND channel_id = ?',
        [userId.toString(), channelId]
      );

      const status = {
        reddit: false,
        x: false,
        facebook: false,
        instagram: false,
        make: false,
      };

      const accounts = {};

      rows.forEach(row => {
        status[row.platform] = true;
        try {
          if (row.credentials) {
            const decrypted = decrypt(row.credentials);
            accounts[row.platform] = JSON.parse(decrypted);
          }
        } catch (e) {
          console.error(`❌ Error desencriptando ${row.platform}:`, e.message);
        }
      });

      return { success: true, status, accounts };
    } catch (error) {
      console.error('❌ Error en social:getAccountsStatus:', error.message);
      return { success: false, message: error.message };
    }
  });

  // --- ELIMINAR CUENTA ---
  ipcMain.handle('social:deleteAccount', async (event, { userId, channelId, platform }) => {
    try {
      if (!channelId) throw new Error('Se requiere channelId.');
      localSql.run(
        'DELETE FROM social_accounts WHERE user_id = ? AND channel_id = ? AND platform = ?',
        [userId.toString(), channelId, platform]
      );
      return { success: true };
    } catch (error) {
      return { success: false, message: error.message };
    }
  });

  // --- OBTENER TODAS LAS CREDENCIALES (Para los formularios) ---
  ipcMain.handle('social:getAllAccountsCredentials', async (event, { userId, channelId }) => {
    try {
      if (!channelId) return { success: true, accounts: {} };
      const rows = localSql.query('SELECT platform, credentials FROM social_accounts WHERE user_id = ? AND channel_id = ?', [userId.toString(), channelId]);
      const accounts = {};
      rows.forEach(row => {
        try {
          accounts[row.platform] = JSON.parse(decrypt(row.credentials));
        } catch (e) { console.error(`Error decodificando ${row.platform}:`, e); }
      });
      return { success: true, accounts };
    } catch (error) {
      return { success: false, message: error.message };
    }
  });

  // --- GUARDAR PLANTILLAS ---
  ipcMain.handle('templates:save', async (event, { userId, channelId, platform, template }) => {
    try {
      if (!channelId) throw new Error('Se requiere channelId para guardar la plantilla.');
      localSql.run(`
        INSERT INTO caption_templates (user_id, channel_id, platform, template)
        VALUES (?, ?, ?, ?)
        ON CONFLICT (user_id, channel_id, platform) DO UPDATE 
        SET template = EXCLUDED.template
      `, [userId.toString(), channelId, platform, template]);
      return { success: true };
    } catch (error) {
      console.error('Error guardando plantilla:', error);
      return { success: false, message: error.message };
    }
  });

  // --- OBTENER PLANTILLAS ---
  ipcMain.handle('templates:get', async (event, { userId, channelId }) => {
    try {
      if (!channelId) return { success: true, templates: {} };
      const rows = localSql.query('SELECT platform, template FROM caption_templates WHERE user_id = ? AND channel_id = ?', [userId.toString(), channelId]);
      const templates = {};
      rows.forEach(row => {
        templates[row.platform] = row.template;
      });
      return { success: true, templates };
    } catch (error) {
      return { success: false, message: error.message };
    }
  });

  // --- GUARDAR AJUSTES GENERALES (Make.com, etc) ---
  ipcMain.handle('settings:save', async (event, { userId, settings }) => {
    try {
      for (const [key, value] of Object.entries(settings)) {
        localSql.run(`
          INSERT INTO settings (user_id, key, value)
          VALUES (?, ?, ?)
          ON CONFLICT (user_id, key) DO UPDATE SET value = EXCLUDED.value
        `, [userId.toString(), key, value]);
      }
      return { success: true };
    } catch (error) {
      console.error('Error guardando ajustes:', error);
      return { success: false, message: error.message };
    }
  });

  // --- OBTENER AJUSTES GENERALES ---
  ipcMain.handle('settings:get', async (event, { userId, keys }) => {
    try {
      const results = {};
      for (const key of keys) {
        const row = localSql.get('SELECT value FROM settings WHERE user_id = ? AND key = ?', [userId.toString(), key]);
        results[key] = row ? row.value : null;
      }
      return { success: true, settings: results };
    } catch (error) {
      return { success: false, message: error.message };
    }
  });
}