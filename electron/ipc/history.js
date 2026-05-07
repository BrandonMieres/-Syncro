import { ipcMain } from 'electron';
import { localSql } from '../../lib/localDb.js';

export function setupHistoryHandlers() {
  // --- OBTENER LOGS ---
  ipcMain.handle('history:getLogs', async (event, { userId, channelId }) => {
    try {
      const logs = localSql.query(
        'SELECT * FROM publish_logs WHERE user_id = ? AND channel_id = ? ORDER BY created_at DESC LIMIT 100',
        [userId.toString(), channelId]
      );
      return { success: true, logs };
    } catch (error) {
      console.error('Error obteniendo historial:', error);
      return { success: false, message: error.message };
    }
  });

  // --- LIMPIAR LOGS ---
  ipcMain.handle('history:clearLogs', async (event, { userId, channelId }) => {
    try {
      localSql.run('DELETE FROM publish_logs WHERE user_id = ? AND channel_id = ?', [userId.toString(), channelId]);
      return { success: true };
    } catch (error) {
      return { success: false, message: error.message };
    }
  });
}
