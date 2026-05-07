import { ipcMain } from 'electron';
import { localSql } from '../../lib/localDb.js';
import { getChannelInfo, getLatestVideos } from '../../lib/youtube.js';

export function setupYoutubeHandlers() {
  // --- AÑADIR CANAL ---
  ipcMain.handle('youtube:addChannel', async (event, { userId, apiKey, channelId }) => {
    try {
      // 1. Validar con YouTube API
      const info = await getChannelInfo(apiKey, channelId);

      // 2. Guardar en DB Local
      localSql.run(`
        INSERT INTO youtube_accounts (user_id, channel_id, channel_name, thumbnail_url, api_key, uploads_playlist_id)
        VALUES (?, ?, ?, ?, ?, ?)
        ON CONFLICT (user_id, channel_id) DO UPDATE 
        SET channel_name = EXCLUDED.channel_name, 
            thumbnail_url = EXCLUDED.thumbnail_url, 
            api_key = EXCLUDED.api_key,
            uploads_playlist_id = EXCLUDED.uploads_playlist_id
      `, [userId.toString(), info.channelId, info.title, info.thumbnail, apiKey, info.uploadsPlaylistId]);

      const newChannel = localSql.get(
        'SELECT * FROM youtube_accounts WHERE user_id = ? AND channel_id = ?',
        [userId.toString(), info.channelId]
      );

      return { success: true, channel: newChannel };
    } catch (error) {
      console.error('Error añadiendo canal:', error);
      return { success: false, message: error.message };
    }
  });

  // --- LISTAR CANALES ---
  ipcMain.handle('youtube:getChannels', async (event, userId) => {
    try {
      let channels = localSql.query(
        'SELECT * FROM youtube_accounts WHERE user_id = ? ORDER BY created_at DESC',
        [userId]
      );

      // Si el usuario no tiene canales, pero existen canales con el ID legado '1', adoptarlos
      if (channels.length === 0 && userId !== '1') {
        const legacyChannels = localSql.query('SELECT id FROM youtube_accounts WHERE user_id = \'1\'');
        if (legacyChannels.length > 0) {
          const tables = ['youtube_accounts', 'social_accounts', 'caption_templates', 'settings', 'publish_logs'];
          localSql.transaction(() => {
            tables.forEach(table => {
              localSql.run(`UPDATE ${table} SET user_id = ? WHERE user_id = '1'`, [userId.toString()]);
            });
          });
          
          // Volver a consultar ahora que están migrados
          channels = localSql.query(
            'SELECT * FROM youtube_accounts WHERE user_id = ? ORDER BY created_at DESC',
            [userId.toString()]
          );
        }
      }

      return { success: true, channels };
    } catch (error) {
      console.error('Error listando canales:', error);
      return { success: false, message: 'Error al consultar la base de datos local.' };
    }
  });

  // --- OBTENER VIDEOS ---
  ipcMain.handle('youtube:getVideos', async (event, { apiKey, channelId, forceRefresh = false, timeRange = '7days' }) => {
    try {
      // 1. Intentar leer de caché si no es forceRefresh
      // Nota: Para simplificar, si el usuario cambia el rango de tiempo, forzamos un refresco 
      // o filtramos lo que ya tenemos. Por ahora, si es 7days/30days y tenemos caché, servimos.
      if (!forceRefresh) {
        const cached = localSql.query(
          'SELECT * FROM video_cache WHERE channel_id = ? ORDER BY published_at DESC',
          [channelId]
        );
        
        if (cached && cached.length > 0) {
          let filtered = cached;
          if (timeRange === '7days') {
            const limit = new Date();
            limit.setDate(limit.getDate() - 7);
            filtered = cached.filter(v => new Date(v.published_at) >= limit);
          } else if (timeRange === '30days') {
            const limit = new Date();
            limit.setDate(limit.getDate() - 30);
            filtered = cached.filter(v => new Date(v.published_at) >= limit);
          }

          if (filtered.length > 0) {
            return { 
              success: true, 
              videos: filtered.map(v => ({
                id: v.video_id,
                title: v.title,
                description: v.description,
                thumbnail: v.thumbnail,
                url: v.url,
                publishedAt: v.published_at,
                type: v.video_type
              })),
              fromCache: true 
            };
          }
        }
      }

      // 2. Si no hay caché suficiente o es refresh, consultar API
      const channelInfo = localSql.get('SELECT uploads_playlist_id FROM youtube_accounts WHERE channel_id = ?', [channelId]);
      const videos = await getLatestVideos(apiKey, channelId, timeRange, channelInfo?.uploads_playlist_id);

      // 3. Actualizar caché
      localSql.transaction(() => {
        const fetchedIds = videos.map(v => v.id);
        
        // Upsert de los nuevos
        for (const v of videos) {
          localSql.run(`
            INSERT INTO video_cache (channel_id, video_id, title, description, thumbnail, url, published_at, video_type)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(channel_id, video_id) DO UPDATE SET
              title = EXCLUDED.title,
              description = EXCLUDED.description,
              thumbnail = EXCLUDED.thumbnail,
              video_type = EXCLUDED.video_type,
              published_at = EXCLUDED.published_at,
              url = EXCLUDED.url
          `, [channelId, v.id, v.title, v.description, v.thumbnail, v.url, v.publishedAt, v.type]);
        }

        // PURGA: Borrar videos que ya no están en YouTube pero sí en nuestra caché dentro del rango buscado
        if (timeRange === '7days' || timeRange === '30days') {
          const limit = new Date();
          limit.setDate(limit.getDate() - (timeRange === '7days' ? 7 : 30));
          const limitStr = limit.toISOString();
          
          if (fetchedIds.length > 0) {
            const placeholders = fetchedIds.map(() => '?').join(',');
            localSql.run(`
              DELETE FROM video_cache 
              WHERE channel_id = ? 
              AND published_at >= ? 
              AND video_id NOT IN (${placeholders})
            `, [channelId, limitStr, ...fetchedIds]);
          } else {
            localSql.run(`
              DELETE FROM video_cache 
              WHERE channel_id = ? 
              AND published_at >= ?
            `, [channelId, limitStr]);
          }
        } else if (timeRange === 'all') {
          if (fetchedIds.length > 0) {
            const placeholders = fetchedIds.map(() => '?').join(',');
            localSql.run(`
              DELETE FROM video_cache 
              WHERE channel_id = ? 
              AND video_id NOT IN (${placeholders})
            `, [channelId, ...fetchedIds]);
          } else {
            localSql.run(`DELETE FROM video_cache WHERE channel_id = ?`, [channelId]);
          }
        }
      });

      return { success: true, videos, fromCache: false };
    } catch (error) {
      console.error('Error obteniendo videos:', error);
      return { success: false, message: error.message };
    }
  });
}