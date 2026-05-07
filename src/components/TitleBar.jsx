import React from 'react';
import { Button } from '@fluentui/react-components';
import { Dismiss16Regular, Subtract16Regular, FullScreenMaximize16Regular } from '@fluentui/react-icons';

const TitleBar = ({ title, resizable }) => {
  const handleMinimize = () => window.electronAPI.send('window:minimize');
  const handleMaximize = () => window.electronAPI.send('window:maximize');
  const handleClose = () => window.electronAPI.send('window:close');

  return (
    <div style={{
      height: '32px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: 'transparent',
      WebkitAppRegion: 'drag', // Hacer que la barra sea arrastrable
      padding: '0 12px',
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      zIndex: 9999,
    }}>
      <div style={{ 
        color: 'rgba(255, 255, 255, 0.4)', 
        fontSize: '11px', 
        fontWeight: '500',
        textTransform: 'uppercase',
        letterSpacing: '1px'
      }}>
        {title || 'Syncro'}
      </div>

      <div style={{ 
        display: 'flex', 
        gap: '4px',
        WebkitAppRegion: 'no-drag' // Los botones no deben ser arrastrables
      }}>
        <Button 
          appearance="subtle" 
          icon={<Subtract16Regular />} 
          size="small"
          onClick={handleMinimize}
          style={{ 
            color: 'white', 
            minWidth: '32px', 
            height: '24px',
            '--colorNeutralBackgroundSubtleHover': 'rgba(255, 255, 255, 0.1)'
          }}
        />
        {resizable && (
          <Button 
            appearance="subtle" 
            icon={<FullScreenMaximize16Regular />} 
            size="small"
            onClick={handleMaximize}
            style={{ 
              color: 'white', 
              minWidth: '32px', 
              height: '24px',
              '--colorNeutralBackgroundSubtleHover': 'rgba(255, 255, 255, 0.1)'
            }}
          />
        )}
        <Button 
          appearance="subtle" 
          icon={<Dismiss16Regular />} 
          size="small"
          onClick={handleClose}
          className="close-btn-hover"
          style={{ 
            color: 'white', 
            minWidth: '32px', 
            height: '24px',
          }}
        />
      </div>
      
      <style>{`
        .close-btn-hover:hover {
          background-color: #e81123 !important;
          color: white !important;
        }
      `}</style>
    </div>
  );
};

export default TitleBar;
