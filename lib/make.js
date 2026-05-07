import fetch from 'node-fetch';

/**
 * Envía los datos de publicación a un Webhook de Make.com
 * @param {string} webhookUrl - URL del Webhook generado en Make
 * @param {object} data - Datos del video, plataformas y captions
 * @param {string} [apiKey] - Clave API opcional para el Webhook
 */
export async function triggerMakeWorkflow(webhookUrl, data, apiKey) {
  if (!webhookUrl) {
    throw new Error('No se ha configurado la URL del Webhook de Make.com');
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 60000); // 60s timeout

  try {
    const headers = {
      'Content-Type': 'application/json',
    };

    if (apiKey) {
      headers['x-make-apikey'] = apiKey;
    }

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(data),
      signal: controller.signal
    });

    clearTimeout(timeout);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Error de Make.com (${response.status}): ${errorText}`);
    }

    // Make suele responder con "Accepted" o similar
    return { success: true };
  } catch (err) {
    clearTimeout(timeout);
    console.error('Error en triggerMakeWorkflow:', err);
    
    if (err.name === 'AbortError') {
      throw new Error('Tiempo de espera agotado (60s) al conectar con Make.com. Revisa tu conexión.');
    }
    
    if (err.code === 'ECONNREFUSED' || err.code === 'ENOTFOUND') {
      throw new Error('No se pudo establecer conexión con Make.com. Verifica que tienes internet y que la URL del Webhook es correcta.');
    }

    throw new Error(`Error de red al enviar a Make: ${err.message}`);
  }
}
