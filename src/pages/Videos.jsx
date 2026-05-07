import React, { useEffect, useState } from 'react';
import { Title1, Button, Spinner, MessageBar, MessageBarBody, TabList, Tab } from '@fluentui/react-components';
import { ArrowLeft24Regular, ArrowSync24Regular } from '@fluentui/react-icons';
import VideoCard from '../components/VideoCard';
import { useYoutubeStore } from '../store/youtubeStore';

const Videos = () => {
  const { selectedChannel, setSelectedChannel, videos, setVideos, isLoading, setLoading, error, setError, setSelectedVideo } = useYoutubeStore();
  const [selectedTab, setSelectedTab] = useState('video');
  const [timeRange, setTimeRange] = useState('7days');
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    if (selectedChannel) {
      fetchVideos(false);
    }
  }, [selectedChannel, timeRange]);

  const fetchVideos = async (force = false) => {
    setLoading(true);
    if (force) setIsRefreshing(true);
    setError(null);
    
    try {
      const result = await window.electronAPI.invoke('youtube:getVideos', {
        apiKey: selectedChannel.api_key,
        channelId: selectedChannel.channel_id,
        forceRefresh: force,
        timeRange: timeRange
      });

      if (result.success) {
        setVideos(result.videos);
        
        // Error 25 Fix: Si la pestaña actual está vacía pero hay contenido en otras, cambiar automáticamente
        const types = result.videos.map(v => v.type || 'video');
        if (result.videos.length > 0 && !types.includes(selectedTab)) {
          if (types.includes('video')) setSelectedTab('video');
          else if (types.includes('short')) setSelectedTab('short');
          else if (types.includes('live')) setSelectedTab('live');
        }
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError('Error al conectar con el backend.');
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  const handlePublish = (video) => {
    setSelectedVideo(video);
  };

  const filteredVideos = (videos || []).filter(v => (v.type || 'video') === selectedTab);

  return (
    <div style={{ padding: '40px', height: '100vh', display: 'flex', flexDirection: 'column', gap: '28px' }}>
      <style>{`
        .v-tabs-container {
          background: rgba(255,255,255,0.03);
          border-radius: 12px;
          padding: 4px;
          display: inline-flex;
          border: 1px solid rgba(255,255,255,0.05);
          align-self: flex-start;
        }
        .fui-TabList { gap: 4px !important; }
        .fui-Tab {
          min-width: 100px;
          border-radius: 8px !important;
          color: rgba(255,255,255,0.4) !important;
          font-weight: 500 !important;
          transition: all 0.2s !important;
        }
        .fui-Tab:hover { background: rgba(255,255,255,0.05) !important; color: white !important; }
        .fui-Tab--selected {
          background: rgba(220,38,38,0.1) !important;
          color: #fff !important;
          font-weight: 600 !important;
        }
        .fui-Tab--selected::after { display: none !important; }

        .range-selector {
          display: flex;
          gap: 8px;
          padding: 4px;
          background: rgba(0,0,0,0.2);
          border-radius: 10px;
          border: 1px solid rgba(255,255,255,0.03);
        }
        .range-btn {
          all: unset;
          cursor: pointer;
          padding: 6px 12px;
          border-radius: 7px;
          font-size: 12px;
          font-weight: 600;
          color: rgba(255,255,255,0.3);
          transition: all 0.2s;
        }
        .range-btn:hover { color: rgba(255,255,255,0.6); }
        .range-btn.active {
          background: rgba(255,255,255,0.08);
          color: #fff;
        }
      `}</style>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <Button 
          icon={<ArrowLeft24Regular />} 
          appearance="subtle" 
          onClick={() => setSelectedChannel(null)}
          style={{ color: 'white' }}
        />
        <div>
          <Title1 style={{ color: 'white' }}>Contenido del Canal</Title1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>
            Gestionando: <span style={{ color: 'var(--accent)', fontWeight: '600' }}>{selectedChannel?.channel_name}</span>
          </p>
        </div>
        
        <div style={{ flex: 1 }} />
        
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
          <div className="range-selector">
            <button className={`range-btn ${timeRange === '7days' ? 'active' : ''}`} onClick={() => setTimeRange('7days')}>7 Días</button>
            <button className={`range-btn ${timeRange === '30days' ? 'active' : ''}`} onClick={() => setTimeRange('30days')}>1 Mes</button>
            <button className={`range-btn ${timeRange === 'all' ? 'active' : ''}`} onClick={() => setTimeRange('all')}>Todo</button>
          </div>
          <Button 
            icon={<ArrowSync24Regular />} 
            appearance="subtle" 
            onClick={() => fetchVideos(true)}
            disabled={isLoading || isRefreshing}
            style={{ color: 'rgba(255,255,255,0.4)', fontSize: '12px' }}
          >
            {isRefreshing ? 'Actualizando...' : 'Refrescar API'}
          </Button>
        </div>
      </div>

      {timeRange !== '7days' && (
        <MessageBar intent="warning">
          <MessageBarBody style={{ fontSize: '12px' }}>
            <strong>Nota:</strong> Consultar periodos largos aumenta el consumo de tu cuota de YouTube API. 
            Recomendamos usar el filtro de <strong>7 días</strong> para un rendimiento óptimo.
          </MessageBarBody>
        </MessageBar>
      )}

      {error && (
        <MessageBar intent="error">
          <MessageBarBody>{error}</MessageBarBody>
        </MessageBar>
      )}

      {/* Selector de Categoría */}
      <div className="v-tabs-container">
        <TabList 
          selectedValue={selectedTab} 
          onTabSelect={(e, data) => setSelectedTab(data.value)}
        >
          <Tab value="video">Videos</Tab>
          <Tab value="short">Shorts</Tab>
          <Tab value="live">Directos</Tab>
        </TabList>
      </div>

      {/* Grid de Videos */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', 
        gap: '24px', 
        overflowY: 'auto',
        paddingBottom: '40px',
        flex: 1
      }}>
        {isLoading && !isRefreshing ? (
          <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'center', marginTop: '100px' }}>
            <Spinner label="Consultando base de datos local..." />
          </div>
        ) : filteredVideos.length === 0 ? (
          <div style={{ gridColumn: '1 / -1', textAlign: 'center', marginTop: '100px', border: '1px dashed rgba(255,255,255,0.05)', borderRadius: '20px', padding: '60px' }}>
            <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: '16px' }}>
              No se han encontrado {selectedTab === 'video' ? 'videos' : selectedTab === 'short' ? 'shorts' : 'directos'} en este canal.
            </p>
            <Button appearance="subtle" onClick={() => fetchVideos(true)} style={{ marginTop: '12px' }}>
              Forzar actualización desde YouTube
            </Button>
          </div>
        ) : (
          filteredVideos.map(video => (
            <VideoCard 
              key={video.id} 
              video={video} 
              onPublish={handlePublish} 
            />
          ))
        )}
      </div>
    </div>
  );
};

export default Videos;
