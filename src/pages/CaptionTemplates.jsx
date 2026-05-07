import React, { useState, useEffect } from 'react';
import { MessageBar, MessageBarBody, Spinner } from '@fluentui/react-components';
import { ArrowLeft24Regular, Save24Regular, Info24Regular } from '@fluentui/react-icons';
import GlassCard from '../components/GlassCard';
import { useAuthStore } from '../store/authStore';
import { useTemplateStore } from '../store/templateStore';
import { useYoutubeStore } from '../store/youtubeStore';

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:ital,wght@0,300;0,400;0,500;1,400&display=swap');

  .ct-root {
    padding: 40px;
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    gap: 36px;
    font-family: 'DM Sans', sans-serif;
  }

  /* ── HEADER ── */
  .ct-header {
    display: flex;
    align-items: center;
    gap: 16px;
    animation: fadeSlideDown 0.45s ease both;
  }

  .ct-back-btn {
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
  .ct-back-btn:hover {
    background: rgba(255,255,255,0.1);
    color: #fff;
    transform: translateX(-2px);
  }

  .ct-title {
    font-family: 'Syne', sans-serif;
    font-size: 30px;
    font-weight: 800;
    color: #fff;
    letter-spacing: -0.5px;
    margin: 0 0 3px 0;
    line-height: 1.1;
  }

  .ct-subtitle {
    font-size: 13.5px;
    color: rgba(255,255,255,0.38);
    margin: 0;
    font-weight: 300;
  }

  /* ── GRID ── */
  .ct-grid {
    display: grid;
    grid-template-columns: 220px 1fr;
    gap: 24px;
    flex: 1;
    min-height: 0;
    animation: fadeUp 0.5s ease 0.1s both;
  }

  /* ── SIDEBAR ── */
  .ct-sidebar {
    display: flex;
    flex-direction: column;
    gap: 6px;
    padding: 10px;
    border-radius: 18px;
    background: rgba(255,255,255,0.03);
    border: 1px solid rgba(255,255,255,0.07);
    align-self: start;
  }

  .ct-sidebar-label {
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 1px;
    text-transform: uppercase;
    color: rgba(255,255,255,0.2);
    padding: 6px 12px 4px;
  }

  .ct-tab {
    all: unset;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 11px 14px;
    border-radius: 11px;
    font-family: 'DM Sans', sans-serif;
    font-size: 13.5px;
    font-weight: 500;
    color: rgba(255,255,255,0.45);
    transition: all 0.2s ease;
  }
  .ct-tab:hover { background: rgba(255,255,255,0.06); color: rgba(255,255,255,0.8); }
  .ct-tab.active {
    background: rgba(99,102,241,0.18);
    color: #fff;
    font-weight: 600;
  }
  .ct-tab.active .ct-tab-dot { background: #818cf8; box-shadow: 0 0 8px rgba(129,140,248,0.7); }

  .ct-tab-dot {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: rgba(255,255,255,0.15);
    flex-shrink: 0;
    transition: all 0.2s;
  }

  .ct-platform-emoji { font-size: 15px; line-height: 1; }

  /* ── EDITOR PANEL ── */
  .ct-editor { display: flex; flex-direction: column; gap: 20px; }

  .ct-card {
    padding: 28px 32px;
    border-radius: 20px;
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(255,255,255,0.08);
    display: flex;
    flex-direction: column;
    gap: 22px;
  }

  .ct-card-title {
    font-family: 'Syne', sans-serif;
    font-size: 17px;
    font-weight: 700;
    color: #fff;
    margin: 0;
    text-transform: capitalize;
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .ct-card-title-badge {
    font-family: 'DM Sans', sans-serif;
    font-size: 11px;
    font-weight: 500;
    padding: 3px 9px;
    border-radius: 20px;
    background: rgba(99,102,241,0.18);
    color: #a5b4fc;
    text-transform: none;
    letter-spacing: 0.2px;
  }

  /* ── TIP BOX ── */
  .ct-tip {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    padding: 12px 14px;
    border-radius: 12px;
    background: rgba(99,102,241,0.08);
    border: 1px solid rgba(99,102,241,0.18);
    color: #a5b4fc;
    font-size: 13px;
    line-height: 1.5;
  }
  .ct-tip svg { flex-shrink: 0; margin-top: 1px; }
  .ct-tip code {
    font-family: 'DM Mono', monospace;
    background: rgba(99,102,241,0.2);
    padding: 1px 6px;
    border-radius: 5px;
    font-size: 12px;
  }

  /* ── TEXTAREA ── */
  .ct-textarea {
    all: unset;
    width: 100%;
    box-sizing: border-box;
    min-height: 160px;
    padding: 16px;
    border-radius: 14px;
    background: rgba(255,255,255,0.05);
    border: 1px solid rgba(255,255,255,0.09);
    font-family: 'DM Sans', sans-serif;
    font-size: 14.5px;
    line-height: 1.7;
    color: #fff;
    caret-color: #6366f1;
    resize: vertical;
    transition: border-color 0.2s, background 0.2s, box-shadow 0.2s;
  }
  .ct-textarea:focus {
    border-color: rgba(99,102,241,0.5);
    background: rgba(99,102,241,0.06);
    box-shadow: 0 0 0 3px rgba(99,102,241,0.08);
    outline: none;
  }
  .ct-textarea::placeholder { color: rgba(255,255,255,0.18); }

  /* ── FOOTER ── */
  .ct-footer {
    border-top: 1px solid rgba(255,255,255,0.06);
    padding-top: 20px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 16px;
  }

  .ct-footer-note {
    font-size: 12px;
    color: rgba(255,255,255,0.22);
    max-width: 380px;
    line-height: 1.6;
    margin: 0;
  }

  .ct-save-btn {
    all: unset;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 11px 28px;
    border-radius: 12px;
    font-family: 'DM Sans', sans-serif;
    font-size: 14px;
    font-weight: 600;
    background: linear-gradient(135deg, #6366f1, #8b5cf6);
    color: #fff;
    box-shadow: 0 4px 20px rgba(99,102,241,0.25);
    transition: all 0.2s ease;
    white-space: nowrap;
    flex-shrink: 0;
  }
  .ct-save-btn:hover:not(:disabled) {
    box-shadow: 0 6px 28px rgba(99,102,241,0.4);
    transform: translateY(-1px);
  }
  .ct-save-btn:disabled { opacity: 0.4; cursor: not-allowed; }

  /* ── PREVIEW ── */
  .ct-preview-card {
    padding: 24px 28px;
    border-radius: 18px;
    background: rgba(255,255,255,0.025);
    border: 1px solid rgba(255,255,255,0.06);
    display: flex;
    flex-direction: column;
    gap: 14px;
  }

  .ct-preview-header {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .ct-preview-label {
    font-size: 10.5px;
    font-weight: 700;
    letter-spacing: 1px;
    text-transform: uppercase;
    color: rgba(255,255,255,0.25);
  }

  .ct-preview-line {
    flex: 1;
    height: 1px;
    background: rgba(255,255,255,0.06);
  }

  .ct-preview-text {
    font-size: 14px;
    color: rgba(255,255,255,0.75);
    white-space: pre-wrap;
    font-style: italic;
    line-height: 1.7;
    margin: 0;
  }

  .ct-preview-url {
    font-size: 12.5px;
    color: #818cf8;
    font-style: normal;
    text-decoration: underline;
    text-underline-offset: 3px;
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

const defaultTemplates = {
  reddit: '{titulo} — nuevo video',
  facebook: '🎬 Nuevo video: {titulo}',
  instagram: '🎬 {titulo}\n\n#youtube #nuevovideo',
  x: '🎬 {titulo}',
};

const CaptionTemplates = ({ onBack }) => {
  const { user } = useAuthStore();
  const { templates, setTemplates, updateTemplate, isLoading, setLoading, error, setError } = useTemplateStore();
  const { selectedVideo, channels } = useYoutubeStore();

  const [selectedTemplateChannelId, setSelectedTemplateChannelId] = useState(channels?.[0]?.channel_id || null);

  const [selectedTab, setSelectedTab] = useState('reddit');
  const [isSaving, setIsSaving] = useState(false);
  const [localTemplate, setLocalTemplate] = useState('');

  const platforms = ['reddit', 'x', 'facebook', 'instagram'];

  useEffect(() => { 
    if (user?.id && selectedTemplateChannelId) {
      fetchTemplates(selectedTemplateChannelId);
    }
  }, [user?.id, selectedTemplateChannelId]);

  useEffect(() => {
    setLocalTemplate(templates[selectedTab] || defaultTemplates[selectedTab] || '');
  }, [selectedTab, templates]);

  const fetchTemplates = async (channelId) => {
    setLoading(true);
    const result = await window.electronAPI.invoke('templates:get', { userId: user.id, channelId });
    if (result.success) {
      const tplMap = {};
      result.templates.forEach(t => { tplMap[t.platform] = t.template; });
      setTemplates(tplMap);
    } else {
      setError(result.message);
    }
    setLoading(false);
  };

  const handleSave = async () => {
    if (!localTemplate.trim()) {
      setError('La plantilla no puede estar vacía. Añade al menos un texto o una variable.');
      return;
    }
    
    setIsSaving(true);
    setError(null);
    const result = await window.electronAPI.invoke('templates:save', {
      userId: user.id, channelId: selectedTemplateChannelId, platform: selectedTab, template: localTemplate.trim()
    });
    if (result.success) updateTemplate(selectedTab, localTemplate.trim());
    else setError(result.message);
    setIsSaving(false);
  };

  const previewTitle = selectedVideo?.title || 'Mi increíble video de YouTube';
  const previewUrl = selectedVideo?.url || 'https://youtube.com/watch?v=dQw4w9WgXcQ';
  const previewText = localTemplate
    .replace(/{titulo}/g, previewTitle)
    .replace(/{url}/g, previewUrl);

  return (
    <>
      <style>{styles}</style>
      <div className="ct-root">

        {/* HEADER */}
        <div className="ct-header">
          <button className="ct-back-btn" onClick={onBack}>
            <ArrowLeft24Regular style={{ fontSize: 18 }} />
          </button>
          <div style={{ flex: 1 }}>
            <h1 className="ct-title">Plantillas de Caption</h1>
            <p className="ct-subtitle">Personaliza cómo se ven tus posts en cada red social</p>
          </div>
          {channels?.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px' }}>Canal:</span>
              <select 
                value={selectedTemplateChannelId || ''}
                onChange={(e) => setSelectedTemplateChannelId(e.target.value)}
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
        </div>

        {(!channels || channels.length === 0) ? (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 20, animation: 'fadeUp 0.5s ease 0.1s both' }}>
            <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'rgba(239,68,68,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ef4444' }}>
              <ArrowLeft24Regular style={{ fontSize: 32 }} />
            </div>
            <div style={{ textAlign: 'center' }}>
              <h2 style={{ fontSize: 24, color: '#fff', margin: '0 0 10px 0', fontFamily: "'Syne', sans-serif" }}>No hay canales conectados</h2>
              <p style={{ color: 'rgba(255,255,255,0.5)', maxWidth: 400, margin: 0, lineHeight: 1.5 }}>Debes conectar al menos un canal de YouTube antes de crear plantillas, ya que estas se configuran por canal.</p>
            </div>
            <button className="ct-save-btn" onClick={onBack}>Volver atrás</button>
          </div>
        ) : (
          <div className="ct-grid">

          {/* SIDEBAR */}
          <div className="ct-sidebar">
            <span className="ct-sidebar-label">Plataformas</span>
            {platforms.map(p => (
              <button
                key={p}
                className={`ct-tab ${selectedTab === p ? 'active' : ''}`}
                onClick={() => setSelectedTab(p)}
              >
                <span className="ct-tab-dot" />
                <span className="ct-platform-emoji">{PLATFORM_META[p].emoji}</span>
                {PLATFORM_META[p].label}
              </button>
            ))}
          </div>

          {/* EDITOR */}
          <div className="ct-editor">
            <div className="ct-card">
              <p className="ct-card-title">
                {PLATFORM_META[selectedTab].emoji} {PLATFORM_META[selectedTab].label}
                <span className="ct-card-title-badge">plantilla</span>
              </p>

              {error && (
                <MessageBar intent="error">
                  <MessageBarBody>{error}</MessageBarBody>
                </MessageBar>
              )}

              <div className="ct-tip">
                <Info24Regular style={{ fontSize: 16 }} />
                <span>Usa <code>{'{titulo}'}</code> para insertar automáticamente el título del video.</span>
              </div>

              <textarea
                className="ct-textarea"
                value={localTemplate}
                onChange={e => setLocalTemplate(e.target.value)}
                placeholder="Escribe tu plantilla aquí..."
              />

              <div className="ct-footer">
                <p className="ct-footer-note">
                  La URL del video se añadirá automáticamente al final al publicar.
                </p>
                <button
                  className="ct-save-btn"
                  onClick={handleSave}
                  disabled={isSaving}
                >
                  {isSaving
                    ? <Spinner size="tiny" />
                    : <Save24Regular style={{ fontSize: 16 }} />}
                  Guardar Plantilla
                </button>
              </div>
            </div>

            {/* PREVIEW */}
            <div className="ct-preview-card">
              <div className="ct-preview-header">
                <span className="ct-preview-label">Vista Previa</span>
                <div className="ct-preview-line" />
              </div>
              <p className="ct-preview-text">
                {previewText || <span style={{ color: 'rgba(255,255,255,0.15)' }}>Tu plantilla aparecerá aquí...</span>}
                {'\n\n'}
                <span className="ct-preview-url">{previewUrl}</span>
              </p>
            </div>
          </div>
          </div>
        )}
      </div>
    </>
  );
};

export default CaptionTemplates;