import { useEffect, useState, useRef } from 'react';
import { HashRouter, Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import BackgroundOrbs from './components/BackgroundOrbs';
import TitleBar from './components/TitleBar';
import SplashScreen from './components/SplashScreen';
import Login from './pages/Login';
import Channels from './pages/Channels';
import Videos from './pages/Videos';
import Publish from './pages/Publish';
import SocialSettings from './pages/SocialSettings';
import CaptionTemplates from './pages/CaptionTemplates';
import History from './pages/History';
import { useAuthStore } from './store/authStore';
import { useYoutubeStore } from './store/youtubeStore';

// ── Cinematic transition variants ────────────────────────────────────────────
const loginExitVariants = {
  initial: { opacity: 0, scale: 0.92, filter: 'blur(12px)', y: 24 },
  animate: { opacity: 1, scale: 1,    filter: 'blur(0px)',  y: 0,
    transition: { duration: 0.72, ease: [0.16, 1, 0.3, 1] } },
  exit:    { opacity: 0, scale: 1.06, filter: 'blur(16px)', y: -20,
    transition: { duration: 0.5,  ease: [0.4, 0, 0.2, 1] } },
};

const appEnterVariants = {
  initial: { opacity: 0, x: 40, filter: 'blur(8px)' },
  animate: { opacity: 1, x: 0,  filter: 'blur(0px)',
    transition: { duration: 0.62, ease: [0.16, 1, 0.3, 1], delay: 0.08 } },
  exit:    { opacity: 0, x: -30, filter: 'blur(6px)',
    transition: { duration: 0.35, ease: [0.4, 0, 1, 1] } },
};

const subPageVariants = {
  initial: { opacity: 0, x: 30, filter: 'blur(4px)' },
  animate: { opacity: 1, x: 0,  filter: 'blur(0px)',
    transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } },
  exit:    { opacity: 0, x: -20,
    transition: { duration: 0.28, ease: [0.4, 0, 1, 1] } },
};

function AnimatedRoutes() {
  const location = useLocation();
  const { rememberMe, logout, isAuthenticated } = useAuthStore();
  const { selectedChannel, selectedVideo } = useYoutubeStore();
  const [showSocial, setShowSocial] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  // Ref para saber si el usuario YA estaba autenticado al montar (sesión persistida)
  // Evita un bug donde el efecto cerraba la sesión recién iniciada en el mismo ciclo de render
  const wasAuthenticatedOnMount = useRef(isAuthenticated);

  useEffect(() => {
    // Solo afecta a sesiones que ya existían antes del primer render,
    // no a los logins que acaban de ocurrir
    if (!rememberMe && wasAuthenticatedOnMount.current) {
      logout();
    }
  }, []);
  // Nota: no incluimos 'rememberMe' en deps para evitar logout al desmarcar

  useEffect(() => {
    const handleResize = async () => {
      if (window.electronAPI) {
        try {
          if (isAuthenticated) {
            await window.electronAPI.invoke('window:resize', { width: 1100, height: 750, resizable: true });
          } else {
            await window.electronAPI.invoke('window:resize', { width: 440, height: 620, resizable: false });
          }
        } catch (e) {
          console.error('Error resizing:', e);
        }
      }
    };
    handleResize();
  }, [isAuthenticated]);

  const getActiveKey = () => {
    if (!isAuthenticated) return 'login';
    if (showSocial) return 'social';
    if (showTemplates) return 'templates';
    if (showHistory) return 'history';
    if (selectedVideo) return 'publish';
    if (selectedChannel) return 'videos';
    return 'channels';
  };

  const activeKey = getActiveKey();
  const isLoginKey = activeKey === 'login';

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden' }}>
      <AnimatePresence mode="wait">
        {isLoginKey ? (
          // ── Login screen ─────────────────────────────────────────────────
          <motion.div
            key="login"
            variants={loginExitVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            style={{ width: '100%', height: '100%' }}
          >
            <Login />
          </motion.div>
        ) : (
          // ── App shell ────────────────────────────────────────────────────
          <motion.div
            key="app-shell"
            variants={appEnterVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            style={{ width: '100%', height: '100%', paddingTop: '32px', boxSizing: 'border-box' }}
          >
            {/* Sub-page transitions inside the app */}
            <AnimatePresence mode="wait">
              <motion.div
                key={activeKey}
                variants={subPageVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                style={{ width: '100%', height: '100%' }}
              >
                {showSocial ? <SocialSettings onBack={() => setShowSocial(false)} />
                  : showTemplates ? <CaptionTemplates onBack={() => setShowTemplates(false)} />
                  : showHistory ? <History onBack={() => setShowHistory(false)} />
                  : selectedVideo ? <Publish onOpenTemplates={() => setShowTemplates(true)} />
                  : selectedChannel ? <Videos />
                  : <Channels onOpenSocial={() => setShowSocial(true)} onOpenTemplates={() => setShowTemplates(true)} onOpenHistory={() => setShowHistory(true)} />}
              </motion.div>
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cinematic flash overlay on login → app transition */}
      <AnimatePresence>
        {!isLoginKey && (
          <motion.div
            key="transition-flash"
            initial={{ opacity: 0.35 }}
            animate={{ opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.9, ease: 'easeOut' }}
            style={{
              position: 'absolute', inset: 0, pointerEvents: 'none',
              background: 'radial-gradient(ellipse at center, rgba(220,38,38,0.18) 0%, transparent 70%)',
              zIndex: 50,
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function App() {
  const { isAuthenticated } = useAuthStore();
  // 'splash' → 'ready'  — espera a que Electron cargue el preload
  const [appPhase, setAppPhase] = useState('splash');

  // Si el usuario NO está en Electron (dev web preview), saltar el splash
  useEffect(() => {
    const isElectron =
      navigator.userAgent.toLowerCase().includes('electron') ||
      !!window.__ELECTRON__;
    if (!isElectron) setAppPhase('ready');
  }, []);

  return (
    <div style={{ 
      width: '100vw', 
      height: '100vh', 
      overflow: 'hidden',
      background: '#0e0e12',
      border: '1px solid rgba(255, 255, 255, 0.05)',
      boxSizing: 'border-box',
      position: 'relative'
    }}>
      {/* Orbes siempre presentes para dar vida al fondo */}
      <BackgroundOrbs />
      
      {isAuthenticated && appPhase === 'ready' && (
        <TitleBar title="Syncro" resizable={true} />
      )}

      {/* ── Máquina de estados: Splash → App ─────────────────────────── */}
      <AnimatePresence mode="wait">
        {appPhase === 'splash' ? (
          <SplashScreen
            key="splash"
            onReady={() => setAppPhase('ready')}
            onFail={() => setAppPhase('ready')}
          />
        ) : (
          <motion.div
            key="main"
            initial={{ opacity: 0, scale: 0.97, filter: 'blur(6px)' }}
            animate={{ opacity: 1, scale: 1,    filter: 'blur(0px)' }}
            transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
            style={{ width: '100%', height: '100%' }}
          >
            <HashRouter>
              <AnimatedRoutes />
            </HashRouter>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Overlay viñeta */}
      <div style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        background: 'radial-gradient(circle at center, transparent 0%, rgba(0,0,0,0.4) 100%)',
        zIndex: 0
      }} />
    </div>
  );
}

export default App;
