import fetch from 'node-fetch';

const YOUTUBE_API_BASE = 'https://www.googleapis.com/youtube/v3';

/**
 * Ayudante para fetch con timeout
 */
async function fetchWithTimeout(url, options = {}, timeoutMs = 30000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    clearTimeout(id);
    return response;
  } catch (error) {
    clearTimeout(id);
    if (error.name === 'AbortError') throw new Error('Tiempo de espera agotado con la API de YouTube.');
    throw error;
  }
}

/**
 * Obtiene información básica de un canal
 */
export async function getChannelInfo(apiKey, channelId) {
  const url = `${YOUTUBE_API_BASE}/channels?part=snippet,contentDetails&id=${channelId}&key=${apiKey}`;
  const response = await fetchWithTimeout(url);
  const data = await response.json();

  if (data.error) {
    throw new Error(data.error.message);
  }

  if (!data.items || data.items.length === 0) {
    throw new Error('Canal no encontrado.');
  }

  const item = data.items[0];
  return {
    channelId: item.id,
    title: item.snippet.title,
    thumbnail: item.snippet.thumbnails.default.url,
    uploadsPlaylistId: item.contentDetails.relatedPlaylists.uploads
  };
}

/**
 * Obtiene los videos recientes de un canal con un rango de tiempo específico
 */
export async function getLatestVideos(apiKey, channelId, timeRange = '7days', uploadsPlaylistId = null) {
  // 1. Obtener la playlist de "uploads" (solo si no la tenemos)
  const playlistId = uploadsPlaylistId || (await getChannelInfo(apiKey, channelId)).uploadsPlaylistId;

  let allVideos = [];
  let nextPageToken = '';
  
  // Determinar cuántos videos necesitamos y qué filtro de fecha aplicar
  let maxToFetch = timeRange === 'all' ? 200 : 50;
  let dateFilter = null;

  if (timeRange === '7days') {
    dateFilter = new Date();
    dateFilter.setDate(dateFilter.getDate() - 7);
  } else if (timeRange === '30days') {
    dateFilter = new Date();
    dateFilter.setDate(dateFilter.getDate() - 30);
  }

  // 2. Obtener items de la playlist (con paginación si es necesario)
  while (allVideos.length < maxToFetch) {
    const url = `${YOUTUBE_API_BASE}/playlistItems?part=snippet&playlistId=${playlistId}&maxResults=50&pageToken=${nextPageToken}&key=${apiKey}`;
    const response = await fetchWithTimeout(url);
    const data = await response.json();

    if (data.error) throw new Error(data.error.message);
    if (!data.items || data.items.length === 0) break;

    const items = data.items.map(item => ({
      id: item.snippet.resourceId.videoId,
      title: item.snippet.title,
      description: item.snippet.description,
      publishedAt: new Date(item.snippet.publishedAt).toISOString(),
      thumbnail: item.snippet.thumbnails.high?.url || item.snippet.thumbnails.medium?.url,
      url: `https://www.youtube.com/watch?v=${item.snippet.resourceId.videoId}`
    }));

    // Aplicar filtro de fecha si existe
    if (dateFilter) {
      const filtered = items.filter(v => new Date(v.publishedAt) >= dateFilter);
      allVideos = [...allVideos, ...filtered];
      // Si el último video ya es más viejo que el filtro, paramos de buscar
      if (filtered.length < items.length) break;
    } else {
      allVideos = [...allVideos, ...items];
    }

    nextPageToken = data.nextPageToken;
    if (!nextPageToken) break;
  }

  // Limitar al máximo solicitado
  const finalVideos = allVideos.slice(0, maxToFetch);

  // 3. Obtener detalles extendidos (para clasificar Shorts/Directos)
  if (finalVideos.length === 0) return [];

  const detailsMap = {};
  
  // YouTube API solo permite un máximo de 50 IDs por petición
  const CHUNK_SIZE = 50;
  for (let i = 0; i < finalVideos.length; i += CHUNK_SIZE) {
    const chunk = finalVideos.slice(i, i + CHUNK_SIZE);
    const videoIds = chunk.map(v => v.id).join(',');
    
    const detailsUrl = `${YOUTUBE_API_BASE}/videos?part=snippet,contentDetails,liveStreamingDetails&id=${videoIds}&key=${apiKey}`;
    const detailsRes = await fetchWithTimeout(detailsUrl);
    const detailsData = await detailsRes.json();

    if (detailsData.error) {
      console.warn(`Error obteniendo detalles del chunk ${i}: ${detailsData.error.message}`);
      continue; // Si falla un chunk, continuamos con el resto
    }

    detailsData.items?.forEach(item => {
      detailsMap[item.id] = item;
    });
  }

  return finalVideos.map(video => {
    const detail = detailsMap[video.id];
    let type = 'video';
    
    if (detail) {
      if (detail.liveStreamingDetails) {
        type = 'live';
      } else {
        const duration = detail.contentDetails?.duration;
        if (duration) {
          const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
          const hrs  = parseInt(match?.[1] || '0');
          const mins = parseInt(match?.[2] || '0');
          const secs = parseInt(match?.[3] || '0');
          const totalSeconds = (hrs * 3600) + (mins * 60) + secs;
          if (totalSeconds <= 180) type = 'short';
        }
      }
    }

    return { ...video, type };
  });
}
