import React, { useState, useEffect } from 'react';
import { MessageBar, MessageBarBody, Spinner } from '@fluentui/react-components';
import { ArrowLeft24Regular, Send24Regular, Info24Regular, CheckmarkCircle24Regular, DismissCircle24Regular } from '@fluentui/react-icons';
import { useAuthStore } from '../store/authStore';
import { useYoutubeStore } from '../store/youtubeStore';
import { useSocialStore } from '../store/socialStore';

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:ital,wght@0,300;0,400;0,500;1,400&display=swap');

  .pub-root {
    padding: 40px;
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    gap: 36px;
    font-family: 'DM Sans', sans-serif;
  }

  /* ── HEADER ── */
  .pub-header {
    display: flex;
    align-items: center;
    gap: 16px;
    animation: fadeSlideDown 0.45s ease both;
  }

  .pub-back-btn {
    all: unset;
    cursor: pointer;
    width: 40px;
    height: 40px;
    border-radius: 12px;
    background: rgba(255,255,255,0.05);
    border: 1px solid rgba(255,255,255,0.08);
    display: flex;
    align-items: center;
    justify-content: center;
    color: rgba(255,255,255,0.6);
    transition: all 0.2s ease;
    flex-shrink: 0;
  }
  .pub-back-btn:hover {
    background: rgba(255,255,255,0.1);
    color: #fff;
    transform: translateX(-2px);
  }

  .pub-title {
    font-family: 'Syne', sans-serif;
    font-size: 30px;
    font-weight: 800;
    color: #fff;
    letter-spacing: -0.5px;
    margin: 0 0 3px 0;
    line-height: 1.1;
  }

  .pub-subtitle {
    font-size: 13.5px;
    color: rgba(255,255,255,0.38);
    margin: 0;
    font-weight: 300;
  }

  /* ── GRID ── */
  .pub-grid {
    display: grid;
    grid-template-columns: 1fr 380px;
    gap: 24px;
    flex: 1;
    min-height: 0;
    animation: fadeUp 0.5s ease 0.1s both;
  }

  /* ── LEFT COL ── */
  .pub-left { display: flex; flex-direction: column; gap: 20px; }

  /* ── VIDEO CARD ── */
  .pub-video-card {
    border-radius: 20px;
    overflow: hidden;
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(255,255,255,0.08);
  }

  .pub-thumbnail-wrap {
    position: relative;
    width: 100%;
    height: 280px;
    overflow: hidden;
  }

  .pub-thumbnail {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
    transition: transform 0.4s ease;
  }
  .pub-video-card:hover .pub-thumbnail { transform: scale(1.02); }

  .pub-thumbnail-overlay {
    position: absolute;
    inset: 0;
    background: linear-gradient(to bottom, transparent 40%, rgba(0,0,0,0.7) 100%);
  }

  .pub-video-info { padding: 22px 24px 24px; }

  .pub-video-title {
    font-family: 'Syne', sans-serif;
    font-size: 20px;
    font-weight: 700;
    color: #fff;
    margin: 0 0 10px 0;
    line-height: 1.3;
  }

  .pub-video-desc {
    font-size: 13.5px;
    color: rgba(255,255,255,0.38);
    line-height: 1.7;
    margin: 0;
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  /* ── RESULTS ── */
  .pub-results { display: flex; flex-direction: column; gap: 10px; }

  .pub-results-title {
    font-family: 'Syne', sans-serif;
    font-size: 14px;
    font-weight: 700;
    color: rgba(255,255,255,0.5);
    text-transform: uppercase;
    letter-spacing: 0.8px;
    margin: 0 0 4px 0;
  }

  .pub-result-row {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 14px 18px;
    border-radius: 14px;
    border: 1px solid;
    animation: fadeUp 0.3s ease both;
  }
  .pub-result-row.success {
    background: rgba(34,197,94,0.07);
    border-color: rgba(34,197,94,0.2);
  }
  .pub-result-row.error {
    background: rgba(239,68,68,0.07);
    border-color: rgba(239,68,68,0.2);
  }

  .pub-result-icon.success { color: #4ade80; }
  .pub-result-icon.error   { color: #f87171; }

  .pub-result-platform {
    font-family: 'Syne', sans-serif;
    font-size: 14px;
    font-weight: 700;
    color: #fff;
    text-transform: capitalize;
    flex: 1;
  }

  .pub-result-link {
    font-size: 12.5px;
    color: #818cf8;
    text-decoration: none;
    font-weight: 500;
    border-bottom: 1px solid rgba(129,140,248,0.3);
    padding-bottom: 1px;
    transition: color 0.2s, border-color 0.2s;
  }
  .pub-result-link:hover { color: #a5b4fc; border-color: rgba(165,180,252,0.5); }

  .pub-result-msg { font-size: 12.5px; color: rgba(255,255,255,0.4); }

  /* ── RIGHT SIDEBAR ── */
  .pub-sidebar {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .pub-config-card {
    padding: 24px;
    border-radius: 20px;
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(255,255,255,0.08);
    display: flex;
    flex-direction: column;
    gap: 20px;
  }

  .pub-config-title {
    font-family: 'Syne', sans-serif;
    font-size: 15px;
    font-weight: 700;
    color: #fff;
    margin: 0;
  }

  /* ── PLATFORM TOGGLES ── */
  .pub-platform-list { display: flex; flex-direction: column; gap: 8px; }

  .pub-platform-row {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 14px;
    border-radius: 12px;
    border: 1px solid rgba(255,255,255,0.06);
    background: rgba(255,255,255,0.025);
    cursor: pointer;
    transition: all 0.2s ease;
    user-select: none;
  }
  .pub-platform-row:hover:not(.disabled) {
    background: rgba(255,255,255,0.05);
    border-color: rgba(255,255,255,0.1);
  }
  .pub-platform-row.selected {
    background: rgba(99,102,241,0.1);
    border-color: rgba(99,102,241,0.3);
  }
  .pub-platform-row.disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  .pub-platform-emoji { font-size: 17px; line-height: 1; }

  .pub-platform-name {
    flex: 1;
    font-size: 14px;
    font-weight: 500;
    color: rgba(255,255,255,0.8);
  }
  .pub-platform-row.selected .pub-platform-name { color: #fff; }

  /* Custom checkbox */
  .pub-check {
    width: 18px;
    height: 18px;
    border-radius: 6px;
    border: 1.5px solid rgba(255,255,255,0.2);
    background: transparent;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    transition: all 0.2s;
  }
  .pub-platform-row.selected .pub-check {
    background: linear-gradient(135deg, #6366f1, #8b5cf6);
    border-color: transparent;
  }
  .pub-check-mark {
    width: 10px;
    height: 10px;
    opacity: 0;
    transition: opacity 0.15s;
    color: #fff;
  }
  .pub-platform-row.selected .pub-check-mark { opacity: 1; }

  .pub-badge-disconnected {
    font-size: 10px;
    font-weight: 600;
    padding: 3px 8px;
    border-radius: 20px;
    background: rgba(255,255,255,0.06);
    border: 1px solid rgba(255,255,255,0.1);
    color: rgba(255,255,255,0.3);
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  /* ── DIVIDER ── */
  .pub-divider {
    height: 1px;
    background: rgba(255,255,255,0.06);
  }

  /* ── TIP ── */
  .pub-tip {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 12.5px;
    color: rgba(255,255,255,0.28);
    line-height: 1.5;
  }
  .pub-tip svg { flex-shrink: 0; opacity: 0.5; }

  /* ── PUBLISH BTN ── */
  .pub-btn {
    all: unset;
    cursor: pointer;
    width: 100%;
    box-sizing: border-box;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    padding: 15px;
    border-radius: 14px;
    font-family: 'Syne', sans-serif;
    font-size: 15px;
    font-weight: 700;
    letter-spacing: 0.2px;
    background: linear-gradient(135deg, #6366f1, #8b5cf6);
    color: #fff;
    box-shadow: 0 4px 24px rgba(99,102,241,0.28);
    transition: all 0.2s ease;
  }
  .pub-btn:hover:not(:disabled) {
    box-shadow: 0 6px 32px rgba(99,102,241,0.45);
    transform: translateY(-1px);
  }
  .pub-btn:disabled { opacity: 0.4; cursor: not-allowed; transform: none; }

  .pub-btn-publishing {
    background: rgba(255,255,255,0.06);
    box-shadow: none;
  }

  /* ── ANIMATIONS ── */
  @keyframes fadeSlideDown {
    from { opacity: 0; transform: translateY(-10px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(14px); }
    to   { opacity: 1; transform: translateY(0); }
  }
`;

const PLATFORM_META = {
  reddit: { emoji: '🤖', label: 'Reddit' },
  x: { emoji: '𝕏', label: 'X (Twitter)' },
  facebook: { emoji: '📘', label: 'Facebook' },
  instagram: { emoji: '📸', label: 'Instagram' },
};

const Publish = ({ onOpenTemplates }) => {
  const { user } = useAuthStore();
  const { selectedChannel, selectedVideo, setSelectedVideo } = useYoutubeStore();
  const { accounts, setAccounts } = useSocialStore();


  const [selectedPlatforms, setSelectedPlatforms] = useState({
    reddit: false, x: false, facebook: false, instagram: false
  });
  const [isPublishing, setIsPublishing] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => { 
    if (user?.id && selectedChannel?.channel_id) {
      fetchSocialStatus(); 
    }
  }, [user?.id, selectedChannel?.channel_id]);

  const fetchSocialStatus = async () => {
    const result = await window.electronAPI.invoke('social:getAccountsStatus', { userId: user.id, channelId: selectedChannel.channel_id });
    if (result.success) {
      const makeRes = await window.electronAPI.invoke('settings:get', { userId: user.id, keys: ['make_webhook_url'] });
      setAccounts({ ...result.status, make: !!makeRes.settings?.make_webhook_url });
    }
  };

  const togglePlatform = (platform) => {
    const isAvailable = accounts.make || accounts[platform];
    if (!isAvailable) return;
    setSelectedPlatforms(prev => ({ ...prev, [platform]: !prev[platform] }));
  };

  const handlePublish = async () => {
    const isMakeActive = accounts.make;
    const platformsToPublish = Object.keys(selectedPlatforms).filter(p => 
      selectedPlatforms[p] && (isMakeActive || accounts[p])
    );
    if (platformsToPublish.length === 0) {
      setError('Selecciona al menos una red social.');
      return;
    }
    setIsPublishing(true);
    setError(null);
    setResults(null);
    const publishResult = await window.electronAPI.invoke('publish:video', {
      userId: user.id, channelId: selectedChannel.channel_id, video: selectedVideo, platforms: platformsToPublish
    });
    setResults(publishResult);
    setIsPublishing(false);
  };
  if (!selectedVideo) return null;

  return (
    <>
      <style>{styles}</style>
      <div className="pub-root">

        {/* HEADER */}
        <div className="pub-header">
          <button className="pub-back-btn" onClick={() => setSelectedVideo(null)}>
            <ArrowLeft24Regular style={{ fontSize: 18 }} />
          </button>
          <div>
            <h1 className="pub-title">Confirmar Publicación</h1>
            <p className="pub-subtitle">Configura los detalles del post antes de enviar</p>
          </div>
        </div>

        {/* GRID */}
        <div className="pub-grid">

          {/* LEFT */}
          <div className="pub-left">
            <div className="pub-video-card">
              <div className="pub-thumbnail-wrap">
                <img className="pub-thumbnail" src={selectedVideo.thumbnail} alt={selectedVideo.title} />
                <div className="pub-thumbnail-overlay" />
              </div>
              <div className="pub-video-info">
                <h2 className="pub-video-title">{selectedVideo.title}</h2>
                <p className="pub-video-desc">{selectedVideo.description}</p>
              </div>
            </div>

            {results && (
              <div className="pub-results">
                <p className="pub-results-title">Resultados</p>
                {results.map((res, i) => (
                  <div
                    key={res.platform}
                    className={`pub-result-row ${res.success ? 'success' : 'error'}`}
                    style={{ animationDelay: `${i * 0.08}s` }}
                  >
                    <span className={`pub-result-icon ${res.success ? 'success' : 'error'}`}>
                      {res.success
                        ? <CheckmarkCircle24Regular style={{ fontSize: 20 }} />
                        : <DismissCircle24Regular style={{ fontSize: 20 }} />}
                    </span>
                    <span className="pub-result-platform">
                      {PLATFORM_META[res.platform]?.emoji} {PLATFORM_META[res.platform]?.label || res.platform}
                    </span>
                    {res.success
                      ? <a className="pub-result-link" href={res.url} target="_blank" rel="noreferrer">Ver en {PLATFORM_META[res.platform]?.label || res.platform} ↗</a>
                      : <span className="pub-result-msg">{res.message}</span>}
                  </div>
                ))}
              </div>
            )}

            {error && (
              <MessageBar intent="error">
                <MessageBarBody>{error}</MessageBarBody>
              </MessageBar>
            )}
          </div>

          {/* RIGHT SIDEBAR */}
          <div className="pub-sidebar">
            <div className="pub-config-card">
              <p className="pub-config-title">Plataformas de destino</p>

              <div className="pub-platform-list">
                {Object.keys(PLATFORM_META).map(platform => {
                    const isMakeActive = accounts.make;
                    const connected = isMakeActive || !!accounts[platform];
                    const selected = selectedPlatforms[platform] && connected;
                    return (
                      <div
                        key={platform}
                        className={`pub-platform-row ${selected ? 'selected' : ''} ${!connected ? 'disabled' : ''}`}
                        onClick={() => togglePlatform(platform)}
                      >
                        <div className="pub-check">
                          <svg className="pub-check-mark" viewBox="0 0 10 10" fill="none">
                            <polyline points="1.5,5 4,7.5 8.5,2.5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </div>
                        <span className="pub-platform-emoji">{PLATFORM_META[platform].emoji}</span>
                        <span className="pub-platform-name">{PLATFORM_META[platform].label}</span>
                        {!connected && <span className="pub-badge-disconnected">No configurada</span>}
                        {isMakeActive && <span className="pub-badge-disconnected" style={{ color: '#818cf8', borderColor: 'rgba(129,140,248,0.2)', background: 'rgba(129,140,248,0.1)' }}>Vía Make</span>}
                      </div>
                    );
                })}
              </div>

              {selectedPlatforms.instagram && (
                <div style={{
                  padding: '12px',
                  borderRadius: '12px',
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  display: 'flex',
                  gap: '10px',
                  animation: 'fadeUp 0.3s ease'
                }}>
                  <Info24Regular style={{ fontSize: 18, color: '#f09433', flexShrink: 0 }} />
                  <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', margin: 0, lineHeight: '1.4' }}>
                    <strong style={{ color: '#fff' }}>Nota para Instagram:</strong> Se publicará la miniatura como foto junto al link y descripción del video.
                  </p>
                </div>
              )}

              <div className="pub-divider" />

              <div className="pub-tip" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <Info24Regular style={{ fontSize: 16 }} />
                  <span>Se usará la plantilla guardada para cada red social.</span>
                </div>
                <button 
                  onClick={onOpenTemplates}
                  style={{
                    all: 'unset',
                    cursor: 'pointer',
                    fontSize: '11px',
                    fontWeight: '700',
                    color: 'var(--accent)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    padding: '4px 8px',
                    background: 'rgba(220,38,38,0.1)',
                    borderRadius: '6px',
                    border: '1px solid rgba(220,38,38,0.2)',
                    textAlign: 'center'
                  }}
                >
                  Personalizar Plantillas
                </button>
              </div>

              <button
                className={`pub-btn ${isPublishing ? 'pub-btn-publishing' : ''}`}
                disabled={isPublishing}
                onClick={handlePublish}
              >
                {isPublishing
                  ? <><Spinner size="tiny" /> Publicando...</>
                  : <><Send24Regular style={{ fontSize: 18 }} /> Lanzar Publicación</>}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Publish;