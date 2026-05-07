import { ipcMain } from 'electron';
import { localSql } from '../../lib/localDb.js';
import { decrypt } from '../../lib/crypto.js';
import { triggerMakeWorkflow } from '../../lib/make.js';

function formatCaption(template, title, url) {
  return template
    .replace(/{titulo}/g, title)
    .replace(/{url}/g, url);
}

export function setupPublishHandlers() {
  ipcMain.handle('publish:video', async (event, { userId, channelId, video, platforms }) => {
    try {
      if (!channelId && video.channelId) channelId = video.channelId;
      if (!channelId) throw new Error('Se requiere channelId para publicar.');
      // Removed global make settings retrieval

      // 1. Preparar Captions
      const captions = {};
      for (const platform of platforms) {
        const tpl = localSql.get(
          'SELECT template FROM caption_templates WHERE user_id = ? AND channel_id = ? AND platform = ?',
          [userId.toString(), channelId, platform]
        );
        captions[platform] = formatCaption(tpl?.template || '{titulo}\n\n{url}', video.title, video.url);
      }

      // 2. Recuperar variables específicas de todas las plataformas
      console.log('🔍 BUSCANDO CREDENCIALES:', { userId: userId.toString(), channelId });
      const allAccounts = localSql.query('SELECT platform, credentials FROM social_accounts WHERE user_id = ? AND channel_id = ?', [userId.toString(), channelId]);
      console.log('📊 CUENTAS ENCONTRADAS EN DB:', allAccounts.map(a => a.platform));

      const configs = {};
      allAccounts.forEach(acc => {
        try {
          configs[acc.platform] = JSON.parse(decrypt(acc.credentials));
        } catch (e) { console.error(`Error decodificando ${acc.platform}:`, e); }
      });

      console.log('⚙️ CONFIGS CARGADAS:', Object.keys(configs));

      // 3. Enviar a Make.com
      if (!configs.make || !configs.make.webhook_url) {
        console.log('❌ ERROR: No se encontró configuración de Make para este canal.');
        throw new Error('Configuración incompleta: Por favor, configura el Webhook de Make.com para este canal en los Ajustes.');
      }

      const data = {
        video: {
          id: video.id,
          title: video.title,
          url: video.url,
          thumbnail: video.thumbnail
        },
        platforms,
        captions,
        // Variables dinámicas para Make
        reddit_subreddit: configs.reddit?.subreddit || 'test',
        twitter_hashtags: configs.x?.hashtags || '',
        facebook_page_id: configs.facebook?.page_id ? Number(configs.facebook.page_id) : '',
        instagram_user_id: configs.instagram?.ig_user_id || ''
      };

      console.log('🚀 ENVIANDO A MAKE.COM:', JSON.stringify(data, null, 2));

      await triggerMakeWorkflow(configs.make.webhook_url, data, configs.make.api_key);

      // 4. Registrar logs y preparar respuesta
      const results = platforms.map(p => {
        let targetUrl = '';
        switch (p) {
          case 'reddit':
            targetUrl = `https://www.reddit.com/r/${configs.reddit?.subreddit || ''}/new`;
            break;
          case 'facebook':
            targetUrl = configs.facebook?.page_id
              ? `https://www.facebook.com/${configs.facebook.page_id}`
              : 'https://www.facebook.com';
            break;
          case 'x':
            targetUrl = 'https://x.com';
            break;
          case 'instagram':
            targetUrl = 'https://www.instagram.com';
            break;
          default:
            targetUrl = '#';
        }

        localSql.run(`
          INSERT INTO publish_logs (user_id, channel_id, video_id, video_title, video_url, platform, status, post_url, caption_used)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [userId.toString(), channelId, video.id, video.title, video.url, p, 'success', targetUrl, captions[p]]);

        return { platform: p, success: true, url: targetUrl };
      });

      return results;

    } catch (error) {
      console.error('Error en publicación vía Make:', error);

      // Registrar el error en el historial para cada plataforma intentada
      for (const p of platforms) {
        localSql.run(`
          INSERT INTO publish_logs (user_id, channel_id, video_id, video_title, video_url, platform, status, error_msg, caption_used)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [userId.toString(), channelId, video.id, video.title, video.url, p, 'error', error.message, '']);
      }

      return platforms.map(p => ({
        platform: p,
        success: false,
        message: error.message
      }));
    }
  });
}