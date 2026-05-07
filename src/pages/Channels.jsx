import React, { useEffect, useState } from 'react';
import { Button, Input, Field, Avatar, Spinner, MessageBar, MessageBarBody } from '@fluentui/react-components';
import {
  Add24Regular,
  SignOut24Regular,
  Key24Regular,
  Video24Regular,
  TextBulletListLtr24Regular,
  History24Regular,
  Share24Regular,
  Circle24Regular
} from '@fluentui/react-icons';
import GlassCard from '../components/GlassCard';
import { useAuthStore } from '../store/authStore';
import { useYoutubeStore } from '../store/youtubeStore';

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500&display=swap');

  .channels-root {
    padding: 40px;
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    gap: 36px;
    font-family: 'DM Sans', sans-serif;
    background: radial-gradient(ellipse at 20% 20%, rgba(99, 102, 241, 0.08) 0%, transparent 50%),
                radial-gradient(ellipse at 80% 80%, rgba(236, 72, 153, 0.06) 0%, transparent 50%);
  }

  /* ── HEADER ── */
  .channels-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    padding-bottom: 24px;
    border-bottom: 1px solid rgba(255,255,255,0.06);
    animation: fadeSlideDown 0.5s ease both;
  }

  .channels-title {
    font-family: 'Syne', sans-serif;
    font-size: 32px;
    font-weight: 800;
    color: #fff;
    letter-spacing: -0.5px;
    margin: 0 0 4px 0;
    line-height: 1.1;
  }

  .channels-subtitle {
    font-size: 14px;
    color: rgba(255,255,255,0.4);
    margin: 0;
    font-weight: 300;
    letter-spacing: 0.2px;
  }

  /* ── NAV BUTTONS ── */
  .nav-bar {
    display: flex;
    gap: 4px;
    align-items: center;
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 14px;
    padding: 6px;
  }

  .nav-btn {
    all: unset;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 7px;
    padding: 8px 14px;
    border-radius: 10px;
    font-family: 'DM Sans', sans-serif;
    font-size: 13px;
    font-weight: 500;
    color: rgba(255,255,255,0.55);
    transition: all 0.2s ease;
    white-space: nowrap;
  }

  .nav-btn:hover {
    background: rgba(255,255,255,0.08);
    color: #fff;
  }

  .nav-btn svg { opacity: 0.7; transition: opacity 0.2s; }
  .nav-btn:hover svg { opacity: 1; }

  .nav-divider {
    width: 1px;
    height: 20px;
    background: rgba(255,255,255,0.08);
    margin: 0 2px;
  }

  .nav-btn.logout {
    color: rgba(255,100,100,0.6);
  }
  .nav-btn.logout:hover {
    background: rgba(255,80,80,0.08);
    color: rgba(255,120,120,0.9);
  }

  /* ── GRID ── */
  .channels-grid {
    display: grid;
    grid-template-columns: 1fr 340px;
    gap: 28px;
    flex: 1;
    min-height: 0;
    animation: fadeUp 0.55s ease 0.1s both;
  }

  /* ── CHANNEL LIST ── */
  .channel-list {
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 12px;
    padding-right: 6px;
  }

  .channel-list::-webkit-scrollbar { width: 4px; }
  .channel-list::-webkit-scrollbar-track { background: transparent; }
  .channel-list::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 4px; }

  /* ── CHANNEL CARD ── */
  .channel-card {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 16px 20px;
    border-radius: 16px;
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(255,255,255,0.07);
    transition: background 0.25s ease, border-color 0.25s ease, transform 0.2s ease;
    cursor: default;
    animation: fadeUp 0.4s ease both;
  }

  .channel-card:hover {
    background: rgba(255,255,255,0.07);
    border-color: rgba(255,255,255,0.14);
    transform: translateY(-1px);
  }

  .channel-info { flex: 1; min-width: 0; }

  .channel-name {
    font-family: 'Syne', sans-serif;
    font-size: 15px;
    font-weight: 600;
    color: #fff;
    display: block;
    margin-bottom: 3px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .channel-id {
    font-size: 11.5px;
    color: rgba(255,255,255,0.28);
    font-family: 'DM Mono', monospace;
    letter-spacing: 0.3px;
  }

  .btn-watch {
    all: unset;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 9px 18px;
    border-radius: 10px;
    font-family: 'DM Sans', sans-serif;
    font-size: 13px;
    font-weight: 500;
    background: linear-gradient(135deg, rgba(99,102,241,0.85), rgba(139,92,246,0.85));
    color: #fff;
    border: 1px solid rgba(139,92,246,0.4);
    box-shadow: 0 4px 16px rgba(99,102,241,0.2);
    transition: all 0.2s ease;
    white-space: nowrap;
    flex-shrink: 0;
  }

  .btn-watch:hover {
    background: linear-gradient(135deg, rgba(99,102,241,1), rgba(139,92,246,1));
    box-shadow: 0 6px 22px rgba(99,102,241,0.35);
    transform: translateY(-1px);
  }

  /* ── EMPTY STATE ── */
  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 16px;
    padding: 80px 40px;
    border-radius: 20px;
    background: rgba(255,255,255,0.025);
    border: 1px dashed rgba(255,255,255,0.1);
    text-align: center;
  }

  .empty-icon {
    width: 56px;
    height: 56px;
    border-radius: 16px;
    background: rgba(255,255,255,0.05);
    display: flex;
    align-items: center;
    justify-content: center;
    color: rgba(255,255,255,0.2);
    font-size: 24px;
  }

  .empty-text {
    font-family: 'Syne', sans-serif;
    font-size: 15px;
    color: rgba(255,255,255,0.3);
    margin: 0;
  }

  /* ── SIDEBAR / FORM ── */
  .sidebar { display: flex; flex-direction: column; gap: 16px; }

  .form-card {
    padding: 28px;
    border-radius: 20px;
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(255,255,255,0.08);
    display: flex;
    flex-direction: column;
    gap: 22px;
  }

  .form-title {
    font-family: 'Syne', sans-serif;
    font-size: 17px;
    font-weight: 700;
    color: #fff;
    margin: 0;
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .form-title-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: linear-gradient(135deg, #6366f1, #8b5cf6);
    box-shadow: 0 0 8px rgba(99,102,241,0.6);
  }

  .field-group { display: flex; flex-direction: column; gap: 6px; }

  .field-label {
    font-size: 11.5px;
    font-weight: 600;
    color: rgba(255,255,255,0.35);
    text-transform: uppercase;
    letter-spacing: 0.8px;
  }

  .input-wrapper {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 11px 14px;
    border-radius: 12px;
    background: rgba(255,255,255,0.05);
    border: 1px solid rgba(255,255,255,0.09);
    transition: border-color 0.2s, background 0.2s;
  }

  .input-wrapper:focus-within {
    border-color: rgba(99,102,241,0.5);
    background: rgba(99,102,241,0.06);
    box-shadow: 0 0 0 3px rgba(99,102,241,0.08);
  }

  .input-icon { color: rgba(255,255,255,0.25); flex-shrink: 0; }

  .input-native {
    all: unset;
    flex: 1;
    font-family: 'DM Sans', sans-serif;
    font-size: 13.5px;
    color: #fff;
    caret-color: #6366f1;
  }

  .input-native::placeholder { color: rgba(255,255,255,0.2); }

  .btn-add {
    all: unset;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 13px;
    border-radius: 12px;
    font-family: 'DM Sans', sans-serif;
    font-size: 14px;
    font-weight: 600;
    background: linear-gradient(135deg, #6366f1, #8b5cf6);
    color: #fff;
    box-shadow: 0 4px 20px rgba(99,102,241,0.25);
    transition: all 0.2s ease;
    letter-spacing: 0.1px;
  }

  .btn-add:hover:not(:disabled) {
    box-shadow: 0 6px 28px rgba(99,102,241,0.4);
    transform: translateY(-1px);
  }

  .btn-add:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  .form-hint {
    font-size: 11.5px;
    color: rgba(255,255,255,0.2);
    line-height: 1.6;
    padding: 0 2px;
    margin: 0;
  }

  /* ── ANIMATIONS ── */
  @keyframes fadeSlideDown {
    from { opacity: 0; transform: translateY(-12px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(14px); }
    to   { opacity: 1; transform: translateY(0); }
  }
`;

const Channels = ({ onOpenSocial, onOpenTemplates, onOpenHistory }) => {
  const { user, logout } = useAuthStore();
  const { channels, setChannels, addChannel, isLoading, setLoading, error, setError, setSelectedChannel } = useYoutubeStore();

  const [newApiKey, setNewApiKey] = useState('');
  const [newChannelId, setNewChannelId] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => { fetchChannels(); }, [user?.id]);

  const fetchChannels = async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const result = await window.electronAPI.invoke('youtube:getChannels', user.id);
      if (result.success) setChannels(result.channels);
      else setError(result.message);
    } catch { setError('Error al conectar con el sistema nativo.'); }
    finally { setLoading(false); }
  };

  const handleAddChannel = async () => {
    if (!newApiKey || !newChannelId) return;
    setIsAdding(true);
    setError(null);
    try {
      const result = await window.electronAPI.invoke('youtube:addChannel', {
        userId: user.id, apiKey: newApiKey, channelId: newChannelId
      });
      if (result.success) {
        addChannel(result.channel);
        setNewApiKey('');
        setNewChannelId('');
      } else setError(result.message);
    } catch { setError('Error al vincular el canal.'); }
    finally { setIsAdding(false); }
  };

  return (
    <>
      <style>{styles}</style>
      <div className="channels-root">

        {/* HEADER */}
        <div className="channels-header">
          <div>
            <h1 className="channels-title">Mis Canales</h1>
            <p className="channels-subtitle">Gestiona tus cuentas de YouTube vinculadas</p>
          </div>

          <nav className="nav-bar">
            <button className="nav-btn" onClick={onOpenSocial}>
              <Share24Regular style={{ fontSize: 16 }} /> Redes Sociales
            </button>
            <button className="nav-btn" onClick={onOpenTemplates}>
              <TextBulletListLtr24Regular style={{ fontSize: 16 }} /> Plantillas
            </button>
            <button className="nav-btn" onClick={onOpenHistory}>
              <History24Regular style={{ fontSize: 16 }} /> Historial
            </button>
            <div className="nav-divider" />
            <button className="nav-btn logout" onClick={logout}>
              <SignOut24Regular style={{ fontSize: 16 }} /> Cerrar Sesión
            </button>
          </nav>
        </div>

        {/* MAIN GRID */}
        <div className="channels-grid">

          {/* LISTA */}
          <div className="channel-list">
            {isLoading && channels.length === 0 ? (
              <div style={{ display: 'flex', justifyContent: 'center', marginTop: 60 }}>
                <Spinner label="Cargando canales..." />
              </div>
            ) : channels.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon"><Video24Regular /></div>
                <p className="empty-text">No tienes canales vinculados aún</p>
              </div>
            ) : (
              channels.map((channel, i) => (
                <div
                  key={channel.id}
                  className="channel-card"
                  style={{ animationDelay: `${i * 0.07}s` }}
                >
                  <Avatar
                    image={{ src: channel.thumbnail_url }}
                    name={channel.channel_name}
                    size={48}
                  />
                  <div className="channel-info">
                    <span className="channel-name">{channel.channel_name}</span>
                    <span className="channel-id">{channel.channel_id}</span>
                  </div>
                  <button className="btn-watch" onClick={() => setSelectedChannel(channel)}>
                    <Video24Regular style={{ fontSize: 16 }} /> Ver Videos
                  </button>
                </div>
              ))
            )}
          </div>

          {/* SIDEBAR */}
          <div className="sidebar">
            <div className="form-card">
              <p className="form-title">
                <span className="form-title-dot" />
                Añadir Nuevo Canal
              </p>

              {error && (
                <MessageBar intent="error">
                  <MessageBarBody>{error}</MessageBarBody>
                </MessageBar>
              )}

              <div className="field-group">
                <label className="field-label">YouTube API Key</label>
                <div className="input-wrapper">
                  <Key24Regular className="input-icon" style={{ fontSize: 16 }} />
                  <input
                    className="input-native"
                    placeholder="AIza..."
                    value={newApiKey}
                    onChange={e => setNewApiKey(e.target.value)}
                  />
                </div>
              </div>

              <div className="field-group">
                <label className="field-label">Channel ID</label>
                <div className="input-wrapper">
                  <Circle24Regular className="input-icon" style={{ fontSize: 16 }} />
                  <input
                    className="input-native"
                    placeholder="UC..."
                    value={newChannelId}
                    onChange={e => setNewChannelId(e.target.value)}
                  />
                </div>
              </div>

              <button
                className="btn-add"
                disabled={isAdding || !newApiKey || !newChannelId}
                onClick={handleAddChannel}
              >
                {isAdding
                  ? <Spinner size="tiny" />
                  : <Add24Regular style={{ fontSize: 16 }} />}
                Vincular Canal
              </button>
            </div>

            <p className="form-hint">
              Asegúrate de que la API Key tenga habilitado "YouTube Data API v3" en Google Cloud Console.
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default Channels;