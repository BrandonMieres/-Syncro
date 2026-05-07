import React, { useEffect } from 'react';
import { Title1, Button, Spinner, Badge, Subtitle2, Caption1, MessageBar, MessageBarBody } from '@fluentui/react-components';
import { ArrowLeft24Regular, Delete24Regular, ArrowRight24Regular, CheckmarkCircle24Regular, ErrorCircle24Regular, Open24Regular } from '@fluentui/react-icons';
import GlassCard from '../components/GlassCard';
import { useAuthStore } from '../store/authStore';
import { useHistoryStore } from '../store/historyStore';
import { useYoutubeStore } from '../store/youtubeStore';

const History = ({ onBack }) => {
  const { user } = useAuthStore();
  const { logs, setLogs, isLoading, setLoading, error, setError } = useHistoryStore();
  const { selectedChannel, setSelectedChannel, channels } = useYoutubeStore();

  useEffect(() => {
    if (user?.id && selectedChannel?.channel_id) fetchHistory();
  }, [user?.id, selectedChannel?.channel_id]);

  const fetchHistory = async () => {
    try {
      const result = await window.electronAPI.invoke('history:getLogs', { userId: user.id, channelId: selectedChannel.channel_id });
      if (result.success) {
        setLogs(result.logs);
      } else {
        setError(result.message);
      }
    } catch {
      setError('Error al obtener el historial.');
    } finally {
      setLoading(false);
    }
  };

  const handleClear = async () => {
    if (!window.confirm('¿Estás seguro de que quieres limpiar todo el historial?')) return;
    const result = await window.electronAPI.invoke('history:clearLogs', { userId: user.id, channelId: selectedChannel.channel_id });
    if (result.success) {
      setLogs([]);
    }
  };

  return (
    <div style={{ padding: '40px', height: '100vh', display: 'flex', flexDirection: 'column', gap: '32px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <Button icon={<ArrowLeft24Regular />} appearance="subtle" onClick={onBack} style={{ color: 'white' }} />
          <div>
            <Title1 style={{ color: 'white' }}>Historial de Publicaciones</Title1>
            <p style={{ color: 'var(--text-secondary)' }}>Registro de todos los intentos de envío</p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          {channels?.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px' }}>Canal:</span>
              <select 
                value={selectedChannel?.channel_id || ''}
                onChange={(e) => {
                  const ch = channels.find(c => c.channel_id === e.target.value);
                  if (ch) setSelectedChannel(ch);
                }}
                style={{
                  padding: '8px 14px',
                  borderRadius: '10px',
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: '#fff',
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: '14px',
                  outline: 'none',
                  cursor: 'pointer'
                }}
              >
                {channels.map(ch => (
                  <option key={ch.channel_id} value={ch.channel_id} style={{ background: '#0e0e12', color: '#fff' }}>
                    {ch.channel_name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <Button 
            icon={<Delete24Regular />} 
            appearance="subtle" 
            onClick={handleClear}
            disabled={logs.length === 0}
            style={{ color: 'var(--error)' }}
          >
            Limpiar Historial
          </Button>
        </div>
      </div>

      {error && <MessageBar intent="error"><MessageBarBody>{error}</MessageBarBody></MessageBar>}

      <GlassCard style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', padding: '0' }}>
        <div style={{ overflowY: 'auto', padding: '24px' }}>
          {isLoading && logs.length === 0 ? (
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: '100px' }}>
              <Spinner label="Consultando base de datos..." />
            </div>
          ) : logs.length === 0 ? (
            <div style={{ textAlign: 'center', marginTop: '100px', color: 'var(--text-muted)' }}>
              No hay registros de publicaciones aún.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {logs.map(log => (
                <div 
                  key={log.id} 
                  style={{ 
                    display: 'grid', 
                    gridTemplateColumns: '150px 1fr 120px 100px 120px', 
                    gap: '20px', 
                    alignItems: 'center',
                    padding: '16px',
                    borderRadius: '12px',
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid var(--border-weak)'
                  }}
                >
                  <Caption1 style={{ color: 'var(--text-muted)' }}>
                    {new Date(log.created_at).toLocaleString('es-ES')}
                  </Caption1>
                  
                  <div>
                    <Subtitle2 style={{ color: 'white', display: 'block' }}>{log.video_title}</Subtitle2>
                    <Caption1 style={{ color: 'var(--text-muted)' }}>ID: {log.video_id}</Caption1>
                  </div>

                  <Badge 
                    appearance="tint" 
                    color={log.platform === 'reddit' ? 'brand' : 'informative'}
                    style={{ textTransform: 'capitalize', width: 'fit-content' }}
                  >
                    {log.platform}
                  </Badge>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {log.status === 'success' ? (
                      <CheckmarkCircle24Regular style={{ color: 'var(--success)', fontSize: '20px' }} />
                    ) : (
                      <ErrorCircle24Regular style={{ color: 'var(--error)', fontSize: '20px' }} />
                    )}
                    <span style={{ fontSize: '12px', fontWeight: 'bold' }}>
                      {log.status === 'success' ? 'ÉXITO' : 'ERROR'}
                    </span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    {log.status === 'success' ? (
                      <Button 
                        size="small" 
                        icon={<Open24Regular />} 
                        onClick={() => window.open(log.post_url, '_blank', 'noopener,noreferrer')}
                      >
                        Ver Post
                      </Button>
                    ) : (
                      <Button size="small" appearance="subtle" style={{ color: 'var(--error)' }} onClick={() => alert(log.error_msg)}>
                        Ver Error
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </GlassCard>
    </div>
  );
};

export default History;
