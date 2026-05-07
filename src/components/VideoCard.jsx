import React from 'react';
import { Subtitle2, Caption1, Button, Badge } from '@fluentui/react-components';
import { Calendar24Regular, Send24Regular } from '@fluentui/react-icons';
import GlassCard from './GlassCard';

const VideoCard = ({ video, onPublish }) => {
  const date = new Date(video.publishedAt).toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  return (
    <GlassCard 
      hoverable
      style={{ 
        display: 'flex', 
        gap: '16px', 
        padding: '12px', 
        border: '1px solid var(--border-weak)',
        height: '140px'
      }}
    >
      <div style={{ position: 'relative', width: '200px', height: '100%', borderRadius: '12px', overflow: 'hidden', flexShrink: 0 }}>
        <img 
          src={video.thumbnail} 
          alt={video.title} 
          onError={(e) => {
            e.target.src = 'https://via.placeholder.com/320x180?text=Imagen+no+disponible';
          }}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '4px 0' }}>
        <div>
          <Subtitle2 style={{ color: 'white', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', lineHeight: '1.4' }}>
            {video.title}
          </Subtitle2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '8px', color: 'var(--text-muted)' }}>
            <Calendar24Regular style={{ fontSize: '16px' }} />
            <Caption1>{date}</Caption1>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
          <Button 
            className="btn-primary" 
            size="small"
            icon={<Send24Regular />}
            onClick={() => onPublish(video)}
          >
            Publicar
          </Button>
        </div>
      </div>
    </GlassCard>
  );
};

export default VideoCard;
