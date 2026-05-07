import React, { useState, useEffect } from 'react';
import { Button, Spinner, MessageBar, MessageBarBody } from '@fluentui/react-components';
import { ArrowLeft24Regular, Delete24Regular, Save24Regular, Checkmark16Filled, LockClosed16Regular } from '@fluentui/react-icons';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '../store/authStore';
import { useSocialStore } from '../store/socialStore';
import { useYoutubeStore } from '../store/youtubeStore';

/* ─── Platform config ─────────────────────────────── */
const PLATFORMS = [
  {
    id: 'reddit',
    label: 'Reddit',
    color: '#ff4500',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z" />
      </svg>
    ),
    fields: [
      { key: 'subreddit', label: 'Subreddit de destino', type: 'text', placeholder: 'ej: videos' },
    ],
  },
  {
    id: 'x',
    label: 'X (Twitter)',
    color: '#e7e7e7',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.763l7.737-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    ),
    fields: [
      { key: 'hashtags', label: 'Hashtags automáticos', type: 'text', placeholder: 'ej: #gaming #news' },
    ],
  },
  {
    id: 'facebook',
    label: 'Facebook',
    color: '#1877f2',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
      </svg>
    ),
    fields: [
      { key: 'page_id', label: 'Facebook Page ID (Opcional)', type: 'text', placeholder: 'Deja vacío para usar la de Make' },
    ],
  },
  {
    id: 'instagram',
    label: 'Instagram',
    color: '#e1306c',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z" />
      </svg>
    ),
    fields: [
      { key: 'ig_user_id', label: 'Instagram User ID (Opcional)', type: 'text', placeholder: 'Deja vacío para usar la de Make' },
    ],
  },
  {
    id: 'make',
    label: 'Make.com',
    color: '#8e44ad',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2v20M2 12h20" />
        <circle cx="12" cy="12" r="3" />
      </svg>
    ),
    fields: [
      { key: 'webhook_url', label: 'Webhook URL', type: 'text', placeholder: 'https://hook.make.com/...' },
      { key: 'api_key', label: 'API Key (x-make-apikey)', type: 'password', placeholder: 'sk_...' },
    ],
  },
];

const buildEmptyForm = () =>
  Object.fromEntries(PLATFORMS.map(p => [p.id, Object.fromEntries(p.fields.map(f => [f.key, '']))]));

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1], delay },
});

/* ─── Component ───────────────────────────────────── */
const SocialSettings = ({ onBack }) => {
  const { user } = useAuthStore();
  const { channels } = useYoutubeStore();
  const [selectedSocialChannelId, setSelectedSocialChannelId] = useState(channels?.[0]?.channel_id || null);
  const { accounts, setAccounts, updateAccountStatus, isLoading, setLoading, error, setError } = useSocialStore();
  const [selectedTab, setSelectedTab] = useState('reddit');
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState(null);
  const [formData, setFormData] = useState(buildEmptyForm());

  useEffect(() => { 
    if (channels?.length > 0 && !selectedSocialChannelId) {
      setSelectedSocialChannelId(channels[0].channel_id);
    }
  }, [channels, selectedSocialChannelId]);

  useEffect(() => { 
    if (user?.id && selectedSocialChannelId) {
      fetchStatus(selectedSocialChannelId); 
    }
  }, [user?.id, selectedSocialChannelId]);

  const fetchStatus = async (channelId) => {
    setLoading(true);
    const result = await window.electronAPI.invoke('social:getAccountsStatus', { userId: user.id, channelId });
    if (result.success) {
      setAccounts(result.status);
      
      // 2. Pedir credenciales de todas las redes sociales (incluyendo Make ahora)
      const allCredsRes = await window.electronAPI.invoke('social:getAllAccountsCredentials', { userId: user.id, channelId });
      
      const newFormData = buildEmptyForm();
      
      if (allCredsRes.success) {
        Object.entries(allCredsRes.accounts).forEach(([platform, creds]) => {
          newFormData[platform] = { ...newFormData[platform], ...creds };
        });
      }

      setFormData(newFormData);
    }
    else setError(result.message);
    setLoading(false);
  };

  const handleInputChange = (platform, field, value) => {
    setFormData(prev => ({ ...prev, [platform]: { ...prev[platform], [field]: value } }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);
    setSaveStatus(null);
    
    const platformId = selectedTab;
    
    try {
      // Todas las redes, incluyendo Make, ahora se guardan en social_accounts por canal
      const result = await window.electronAPI.invoke('social:saveAccount', {
        userId: user.id, 
        channelId: selectedSocialChannelId,
        platform: platformId, 
        credentials: formData[platformId] || {},
      });

      if (result.success) {
        updateAccountStatus(platformId, true);
        setSaveStatus({ type: 'success', message: 'Configuración guardada correctamente.' });
      } else {
        setError(result.message);
      }
    } catch (e) {
      setError('Error inesperado: ' + e.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(`¿Estás seguro de que quieres desconectar ${selectedTab}?`)) return;
    
    const result = await window.electronAPI.invoke('social:deleteAccount', { 
      userId: user.id, 
      channelId: selectedSocialChannelId, 
      platform: selectedTab 
    });

    if (result.success) {
      updateAccountStatus(selectedTab, false);
      setFormData(prev => ({ ...prev, [selectedTab]: Object.fromEntries(Object.keys(prev[selectedTab]).map(k => [k, ''])) }));
    } else setError(result.message);
  };

  const activePlatform = PLATFORMS.find(p => p.id === selectedTab);

  return (
    <>
      <style>{`
        .ss-root * { font-family: 'Outfit', sans-serif !important; box-sizing: border-box; }

        .ss-root {
          padding: 40px;
          height: 100vh;
          display: flex;
          flex-direction: column;
          gap: 32px;
          background: #0a0a0c;
          position: relative;
          overflow: hidden;
        }

        /* Background blobs */
        .ss-root::before, .ss-root::after {
          content: '';
          position: fixed;
          border-radius: 50%;
          pointer-events: none;
          filter: blur(100px);
        }
        .ss-root::before {
          width: 600px; height: 600px;
          background: radial-gradient(circle, rgba(127,29,29,0.35) 0%, transparent 70%);
          top: -200px; left: -200px;
          animation: blobDrift 12s ease-in-out infinite alternate;
        }
        .ss-root::after {
          width: 400px; height: 400px;
          background: radial-gradient(circle, rgba(69,10,10,0.3) 0%, transparent 70%);
          bottom: -100px; right: -100px;
          animation: blobDrift2 16s ease-in-out infinite alternate;
        }

        @keyframes blobDrift { from { transform: translate(0,0); } to { transform: translate(40px,-30px); } }
        @keyframes blobDrift2 { from { transform: translate(0,0); } to { transform: translate(-30px,20px); } }

        /* Noise */
        .ss-noise {
          position: fixed;
          inset: 0;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.05'/%3E%3C/svg%3E");
          opacity: 0.3;
          pointer-events: none;
          z-index: 0;
        }

        .ss-content { position: relative; z-index: 1; display: flex; flex-direction: column; gap: 32px; height: 100%; }

        /* Header */
        .ss-header {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .ss-back-btn {
          width: 38px; height: 38px;
          border-radius: 12px;
          border: 1px solid rgba(255,255,255,0.08);
          background: rgba(255,255,255,0.04);
          color: rgba(255,255,255,0.5);
          cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          transition: all 0.2s;
          flex-shrink: 0;
        }
        .ss-back-btn:hover { background: rgba(255,255,255,0.08); color: #fff; border-color: rgba(255,255,255,0.14); }

        .ss-title {
          font-family: 'Outfit', sans-serif !important;
          font-size: 26px !important;
          font-style: italic;
          color: #fff;
          letter-spacing: -0.3px;
          line-height: 1;
          margin-bottom: 4px;
        }
        .ss-subtitle { font-size: 13px; color: rgba(255,255,255,0.28); font-weight: 400; }

        /* Grid */
        .ss-grid {
          display: grid;
          grid-template-columns: 220px 1fr;
          gap: 20px;
          flex: 1;
          min-height: 0;
        }

        /* Sidebar */
        .ss-sidebar {
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 20px;
          padding: 10px;
          display: flex;
          flex-direction: column;
          gap: 4px;
          backdrop-filter: blur(30px);
          -webkit-backdrop-filter: blur(30px);
        }

        .ss-platform-btn {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 11px 14px;
          border-radius: 12px;
          border: none;
          background: transparent;
          color: rgba(255,255,255,0.4);
          cursor: pointer;
          transition: all 0.2s;
          text-align: left;
          width: 100%;
          position: relative;
          font-size: 13.5px;
          font-weight: 500;
          font-family: 'Outfit', sans-serif !important;
        }

        .ss-platform-btn:hover:not(.active) {
          background: rgba(255,255,255,0.04);
          color: rgba(255,255,255,0.7);
        }

        .ss-platform-btn.active {
          background: rgba(255,255,255,0.07);
          color: #fff;
        }

        .ss-platform-icon {
          width: 32px; height: 32px;
          border-radius: 9px;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
          transition: all 0.2s;
        }

        .ss-connected-dot {
          margin-left: auto;
          width: 7px; height: 7px;
          border-radius: 50%;
          background: #22c55e;
          box-shadow: 0 0 8px rgba(34,197,94,0.6);
          flex-shrink: 0;
        }

        /* Main panel */
        .ss-panel {
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 20px;
          backdrop-filter: blur(30px);
          -webkit-backdrop-filter: blur(30px);
          display: flex;
          flex-direction: column;
          overflow: hidden;
          min-height: 0;
        }

        /* Panel top accent */
        .ss-panel-accent {
          height: 2px;
          flex-shrink: 0;
          transition: background 0.4s;
        }

        .ss-panel-inner {
          padding: 32px 36px 36px;
          display: flex;
          flex-direction: column;
          gap: 28px;
          flex: 1;
          overflow-y: auto;
        }

        .ss-panel-inner::-webkit-scrollbar { width: 4px; }
        .ss-panel-inner::-webkit-scrollbar-track { background: transparent; }
        .ss-panel-inner::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 2px; }

        /* Panel header */
        .ss-panel-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .ss-panel-title-row {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .ss-panel-icon {
          width: 40px; height: 40px;
          border-radius: 12px;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }

        .ss-panel-title {
          font-family: 'Outfit', sans-serif !important;
          font-size: 20px !important;
          font-style: italic;
          color: #fff;
          letter-spacing: -0.2px;
        }

        .ss-connected-badge {
          display: flex;
          align-items: center;
          gap: 5px;
          background: rgba(34,197,94,0.12);
          border: 1px solid rgba(34,197,94,0.2);
          border-radius: 20px;
          padding: 4px 10px;
          font-size: 12px;
          color: #4ade80;
          font-weight: 500;
        }

        .ss-disconnect-btn {
          display: flex;
          align-items: center;
          gap: 7px;
          padding: 8px 14px;
          border-radius: 10px;
          border: 1px solid rgba(239,68,68,0.2);
          background: rgba(239,68,68,0.06);
          color: rgba(239,68,68,0.7);
          cursor: pointer;
          font-size: 13px;
          font-weight: 500;
          transition: all 0.2s;
          font-family: 'Outfit', sans-serif !important;
        }
        .ss-disconnect-btn:hover {
          background: rgba(239,68,68,0.12);
          border-color: rgba(239,68,68,0.35);
          color: #f87171;
        }

        /* Divider */
        .ss-divider {
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.06) 30%, rgba(255,255,255,0.06) 70%, transparent);
        }

        /* Fields grid */
        .ss-fields {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
          max-width: 560px;
        }

        .ss-field { display: flex; flex-direction: column; gap: 8px; }

        .ss-field-label {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 11px;
          font-weight: 600;
          color: rgba(255,255,255,0.28);
          letter-spacing: 0.1em;
          text-transform: uppercase;
        }

        .ss-label-dot {
          width: 4px; height: 4px;
          border-radius: 50%;
          background: #dc2626;
          opacity: 0.7;
        }

        .ss-input-wrap { position: relative; }

        .ss-input-icon {
          position: absolute;
          right: 14px; top: 50%;
          transform: translateY(-50%);
          color: rgba(255,255,255,0.15);
          display: flex;
          pointer-events: none;
          transition: color 0.2s;
        }
        .ss-input-wrap:focus-within .ss-input-icon { color: rgba(220,38,38,0.5); }

        .ss-input {
          width: 100%;
          padding: 12px 40px 12px 14px;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 12px;
          color: #fff;
          font-size: 13.5px;
          font-family: 'Outfit', sans-serif !important;
          outline: none;
          transition: all 0.25s;
        }
        .ss-input::placeholder { color: rgba(255,255,255,0.15); }
        .ss-input:focus {
          background: rgba(220,38,38,0.04);
          border-color: rgba(220,38,38,0.35);
          box-shadow: 0 0 0 3px rgba(220,38,38,0.07);
        }

        /* Save button */
        .ss-save-btn {
          display: flex;
          align-items: center;
          gap: 9px;
          padding: 13px 24px;
          background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%);
          border: none;
          border-radius: 12px;
          color: white;
          font-size: 13.5px;
          font-weight: 600;
          font-family: 'Outfit', sans-serif !important;
          cursor: pointer;
          letter-spacing: 0.02em;
          transition: all 0.25s;
          width: fit-content;
          box-shadow: 0 8px 28px rgba(220,38,38,0.22), 0 1px 0 rgba(255,255,255,0.08) inset;
          position: relative;
          overflow: hidden;
        }
        .ss-save-btn::before {
          content: '';
          position: absolute;
          top: 0; left: -100%;
          width: 100%; height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent);
          transition: left 0.5s;
        }
        .ss-save-btn:hover::before { left: 100%; }
        .ss-save-btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 14px 36px rgba(220,38,38,0.32), 0 1px 0 rgba(255,255,255,0.1) inset;
        }
        .ss-save-btn:active { transform: translateY(0); }
        .ss-save-btn:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }

        /* Footer note */
        .ss-note {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 12px;
          color: rgba(255,255,255,0.2);
          padding: 12px 16px;
          background: rgba(255,255,255,0.02);
          border: 1px solid rgba(255,255,255,0.05);
          border-radius: 10px;
          width: fit-content;
        }

        /* Alert */
        .ss-alert {
          padding: 11px 16px;
          border-radius: 12px;
          font-size: 13px;
          border: 1px solid transparent;
        }
        .ss-alert.error {
          background: rgba(239,68,68,0.1);
          border-color: rgba(239,68,68,0.2);
          color: #f87171;
        }
        .ss-alert.success {
          background: rgba(34,197,94,0.1);
          border-color: rgba(34,197,94,0.2);
          color: #4ade80;
        }
      `}</style>

      <div className="ss-root">
        <div className="ss-noise" />

        <div className="ss-content">
          {/* Header */}
          <motion.div className="ss-header" {...fadeUp(0)}>
            <button className="ss-back-btn" onClick={onBack}>
              <ArrowLeft24Regular style={{ fontSize: 16 }} />
            </button>
            <div style={{ flex: 1 }}>
              <div className="ss-title">Redes Sociales</div>
              <div className="ss-subtitle">Configura tus credenciales de publicación automática</div>
            </div>
            {channels?.length > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px' }}>Canal:</span>
                <select 
                  value={selectedSocialChannelId || ''}
                  onChange={(e) => setSelectedSocialChannelId(e.target.value)}
                  style={{
                    padding: '8px 14px',
                    borderRadius: '10px',
                    background: 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    color: '#fff',
                    fontFamily: "'Outfit', sans-serif",
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
          </motion.div>

          {(!channels || channels.length === 0) ? (
            <motion.div {...fadeUp(0.1)} style={{ 
              flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 20
            }}>
              <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'rgba(239,68,68,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ef4444' }}>
                <ArrowLeft24Regular style={{ fontSize: 32 }} />
              </div>
              <div style={{ textAlign: 'center' }}>
                <h2 style={{ fontSize: 24, color: '#fff', margin: '0 0 10px 0', fontFamily: "'Outfit', sans-serif" }}>No hay canales conectados</h2>
                <p style={{ color: 'rgba(255,255,255,0.5)', maxWidth: 400, margin: 0, lineHeight: 1.5 }}>Debes conectar al menos un canal de YouTube antes de configurar las redes sociales, ya que la configuración se guarda de forma independiente para cada canal.</p>
              </div>
              <button className="ss-save-btn" onClick={onBack}>Volver atrás</button>
            </motion.div>
          ) : (
            <motion.div className="ss-grid" {...fadeUp(0.08)}>
            {/* Sidebar */}
            <div className="ss-sidebar">
              {PLATFORMS.map((p, i) => (
                <motion.button
                  key={p.id}
                  className={`ss-platform-btn${selectedTab === p.id ? ' active' : ''}`}
                  onClick={() => setSelectedTab(p.id)}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 + i * 0.06, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                >
                  <div
                    className="ss-platform-icon"
                    style={{
                      background: selectedTab === p.id
                        ? `${p.color}18`
                        : 'rgba(255,255,255,0.04)',
                      color: selectedTab === p.id ? p.color : 'rgba(255,255,255,0.3)',
                    }}
                  >
                    {p.icon}
                  </div>
                  {p.label}
                  {accounts[p.id] && <span className="ss-connected-dot" />}
                </motion.button>
              ))}
            </div>

            {/* Main panel */}
            <div className="ss-panel">
              <AnimatePresence mode="wait">
                <motion.div
                  key={selectedTab}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                  style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}
                >
                  <div
                    className="ss-panel-accent"
                    style={{
                      background: `linear-gradient(90deg, transparent, ${activePlatform.color}80 40%, ${activePlatform.color}60 60%, transparent)`,
                    }}
                  />

                  <div className="ss-panel-inner">
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={`${selectedSocialChannelId}-${selectedTab}`}
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -10 }}
                        transition={{ duration: 0.3, ease: "easeOut" }}
                        style={{ display: 'flex', flexDirection: 'column', gap: '28px', flex: 1 }}
                      >
                        {/* Panel header */}
                        <div className="ss-panel-header">
                      <div className="ss-panel-title-row">
                        <div
                          className="ss-panel-icon"
                          style={{ background: `${activePlatform.color}18`, color: activePlatform.color }}
                        >
                          {activePlatform.icon}
                        </div>
                        <div>
                          <div className="ss-panel-title">{activePlatform.label}</div>
                          {accounts[selectedTab] && (
                            <div className="ss-connected-badge">
                              <Checkmark16Filled style={{ fontSize: 11 }} />
                              Configurado para Make
                            </div>
                          )}
                        </div>
                      </div>

                      {accounts[selectedTab] && (
                        <button className="ss-disconnect-btn" onClick={handleDelete}>
                          <Delete24Regular style={{ fontSize: 15 }} />
                          Desconectar
                        </button>
                      )}
                    </div>

                    {/* AVISO DE DELEGACIÓN A MAKE */}
                    {selectedTab !== 'make' && (
                      <motion.div 
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        style={{
                          padding: '16px',
                          borderRadius: '16px',
                          background: 'rgba(142, 68, 173, 0.08)',
                          border: '1px solid rgba(142, 68, 173, 0.15)',
                          display: 'flex',
                          gap: '12px',
                          marginBottom: '20px'
                        }}
                      >
                        <div style={{ color: '#a29bfe', marginTop: '2px' }}>
                          <LockClosed16Regular />
                        </div>
                        <div>
                          <p style={{ fontSize: '13px', fontWeight: '700', color: '#fff', margin: '0 0 4px 0' }}>
                            Arquitectura delegada en Make.com
                          </p>
                          <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', margin: 0, lineHeight: '1.5' }}>
                            La conexión oficial y la lógica de publicación residen en tu escenario de Make. 
                            Los campos a continuación se envían como <strong>parámetros dinámicos</strong> al Webhook.
                          </p>
                        </div>
                      </motion.div>
                    )}

                    <div className="ss-divider" />

                    {/* Error */}
                    {error && (
                      <motion.div
                        className="ss-alert error"
                        initial={{ opacity: 0, y: -6 }}
                        animate={{ opacity: 1, y: 0 }}
                      >
                        {error}
                      </motion.div>
                    )}

                    {saveStatus && (
                      <motion.div
                        className={`ss-alert ${saveStatus.type}`}
                        initial={{ opacity: 0, y: -6 }}
                        animate={{ opacity: 1, y: 0 }}
                      >
                        {saveStatus.message}
                      </motion.div>
                    )}

                    {/* Fields */}
                    <div className="ss-fields">
                      {activePlatform.fields.map((field, i) => (
                        <motion.div
                          key={field.key}
                          className="ss-field"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.05, duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                          style={activePlatform.fields.length === 5 && i === 4 ? { gridColumn: '1 / -1' } : {}}
                        >
                          <div className="ss-field-label">
                            <span className="ss-label-dot" />
                            {field.label}
                          </div>
                          <div className="ss-input-wrap">
                            {field.type === 'password' && (
                              <span className="ss-input-icon">
                                <LockClosed16Regular style={{ fontSize: 14 }} />
                              </span>
                            )}
                            <input
                              className="ss-input"
                              type={field.type}
                              placeholder={field.placeholder || ''}
                              style={field.type !== 'password' ? { paddingRight: '14px' } : {}}
                              value={formData[selectedTab][field.key]}
                              onChange={e => handleInputChange(selectedTab, field.key, e.target.value)}
                            />
                          </div>
                        </motion.div>
                      ))}
                    </div>

                    {/* Save */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                      <button
                        className="ss-save-btn"
                        onClick={handleSave}
                        disabled={isSaving}
                      >
                        {isSaving
                          ? <><Spinner size="tiny" /> Guardando...</>
                          : <><Save24Regular style={{ fontSize: 16 }} /> Guardar credenciales</>
                        }
                      </button>

                      <div className="ss-note">
                        <LockClosed16Regular style={{ fontSize: 14, flexShrink: 0 }} />
                        Credenciales cifradas con AES-256
                      </div>
                    </div>
                  </motion.div>
                </AnimatePresence>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
          </motion.div>
          )}
        </div>
      </div>
    </>
  );
};

export default SocialSettings;