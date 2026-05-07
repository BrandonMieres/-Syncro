import React, { useState, useEffect } from 'react';
import { MessageBar, MessageBarBody, Checkbox } from '@fluentui/react-components';
import { Eye24Regular, EyeOff24Regular } from '@fluentui/react-icons';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '../store/authStore';
import logoIcon from '../assets/icon.png';

const schema = z.object({
  username: z.string().min(1, 'El usuario es obligatorio').min(3, 'El usuario debe tener al menos 3 caracteres'),
  password: z.string().min(1, 'La contraseña es obligatoria').min(6, 'La contraseña debe tener al menos 6 caracteres'),
});

const UserIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="8" r="4" />
    <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
  </svg>
);

const LockIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);

// Stagger container — orchestrates children automatically
const containerVariants = {
  hidden: {},
  show: {
    transition: {
      delayChildren: 0.15,
      staggerChildren: 0.08,
    },
  },
};

// Each child rises and fades
const itemVariants = {
  hidden: { opacity: 0, y: 20, filter: 'blur(4px)' },
  show:   { opacity: 1, y: 0,  filter: 'blur(0px)',
    transition: { duration: 0.55, ease: [0.16, 1, 0.3, 1] } },
};

// Legacy helper kept for one-off delays
const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1], delay },
});

// Función pura y segura para leer las credenciales guardadas
const getSavedCredentials = () => {
  try {
    const isRemembered = localStorage.getItem('rememberMe') === 'true';
    if (!isRemembered) return null;
    const raw = localStorage.getItem('saved_credentials');
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    // Validar que el objeto tiene los campos esperados antes de usarlos
    if (parsed && typeof parsed.username === 'string' && typeof parsed.password === 'string') {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
};

const Login = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [apiReady, setApiReady] = useState(false);
  // 'idle' | 'loading' | 'success' — máquina de estados del submit
  const [submitState, setSubmitState] = useState('idle');
  const { isLoading, error, setError, setLoading, login, rememberMe, setRememberMe } = useAuthStore();

  // Leer credenciales una sola vez al montar el componente
  const initialCreds = getSavedCredentials();

  const { register, handleSubmit, reset, trigger, formState: { errors, isValid } } = useForm({
    resolver: zodResolver(schema),
    // 'onBlur' evita mostrar errores molestos mientras el usuario escribe
    mode: 'onBlur',
    defaultValues: {
      username: initialCreds?.username || '',
      password: initialCreds?.password || '',
    }
  });

  // Polling silencioso y continuo por si la API tarda extra en inyectarse
  useEffect(() => {
    if (window.electronAPI) {
      setApiReady(true);
      return;
    }

    let attempts = 0;
    const interval = setInterval(() => {
      if (window.electronAPI) {
        setApiReady(true);
        clearInterval(interval);
      } else {
        attempts++;
        if (attempts >= 30) { // 15 segundos extra como fallback
          clearInterval(interval);
          setError({
            message: 'Error crítico: No se detectó la API nativa. Reinicia la aplicación.',
            type: 'error'
          });
        }
      }
    }, 500);

    return () => clearInterval(interval);
  }, [setError]);

  // Si hay credenciales guardadas, disparar validación para habilitar el botón desde el inicio
  useEffect(() => {
    if (initialCreds) {
      trigger();
    }
  }, []);

  // Al cambiar de modo (Login -> Registro), siempre limpiar el formulario
  const switchMode = () => {
    const nextMode = !isLogin;
    setIsLogin(nextMode);
    setError(null);
    // Al ir a Registro, limpiar siempre. Al volver a Login, restaurar creds si procede
    if (!nextMode) {
      reset({ username: '', password: '' });
    } else {
      const creds = getSavedCredentials();
      reset({ username: creds?.username || '', password: creds?.password || '' });
      if (creds) trigger();
    }
  };

  const handleMinimize = () => window.electronAPI?.send('window:minimize');
  const handleClose = () => window.electronAPI?.send('window:close');

  const onSubmit = async (data) => {
    setLoading(true);
    setSubmitState('loading');
    setError(null);
    try {
      if (!window.electronAPI) {
        throw new Error('La API nativa no está disponible. Reinicia la aplicación.');
      }

      const channel = isLogin ? 'auth:login' : 'auth:register';
      const payload = { ...data, registerNewDevice: data.isLinking || false };

      const result = await window.electronAPI.invoke(channel, payload);

      if (result.success) {
        if (isLogin) {
          // ── Secuencia de éxito cinematográfica ──────────────────────────
          setSubmitState('success');
          setLoading(false);
          // Esperamos que la animación de éxito se reproduzca (~900ms)
          // antes de hacer el cambio de estado que desmonta este componente
          await new Promise(resolve => setTimeout(resolve, 950));
          login(result.user, data);
        } else {
          setIsLogin(true);
          reset({ username: '', password: '' });
          setSubmitState('idle');
          setError({ message: '✅ Cuenta creada. Contacta con el administrador para activarla.', type: 'success' });
        }
      } else {
        const msg = result.message || 'Error en la autenticación.';
        setSubmitState('idle');
        setError({ message: msg, type: 'error' });
      }
    } catch (err) {
      const isNetworkErr = err.message?.includes('fetch') || err.message?.includes('network');
      setSubmitState('idle');
      setError({
        message: isNetworkErr
          ? 'Sin conexión al servidor. Verifica tu red e inténtalo de nuevo.'
          : `Error: ${err.message}`,
        type: 'error'
      });
    } finally {
      if (submitState !== 'success') setLoading(false);
    }
  };

  const handleLinkingLogin = () => {
    handleSubmit((data) => onSubmit({ ...data, isLinking: true }))();
  };

  return (
    <>
      {/* CSS keyframes injected once */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:wght@300;400;500;600&display=swap');

        * { font-family: 'DM Sans', sans-serif !important; box-sizing: border-box; }

        /* ── Scan-line shimmer on card ───────────────────────────────── */
        @keyframes scanline {
          0%   { transform: translateY(-100%); }
          100% { transform: translateY(400%); }
        }
        .card-scanline {
          position: absolute;
          left: 0; right: 0;
          height: 2px;
          background: linear-gradient(90deg, transparent 0%, rgba(220,38,38,0.25) 50%, transparent 100%);
          animation: scanline 4s linear infinite;
          pointer-events: none;
          z-index: 0;
          top: 0;
        }

        /* ── Glow ring pulse around logo ─────────────────────────────── */
        @keyframes glowPulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(220,38,38,0.0), 0 0 20px rgba(220,38,38,0.2); }
          50%       { box-shadow: 0 0 0 6px rgba(220,38,38,0.0), 0 0 40px rgba(220,38,38,0.5); }
        }
        .logo-container { animation: glowPulse 3.5s ease-in-out infinite !important; }

        /* ── Button ripple on click ───────────────────────────────────── */
        @keyframes btnRipple {
          0%   { transform: scale(0); opacity: 0.6; }
          100% { transform: scale(3); opacity: 0; }
        }
        .submit-btn .ripple {
          position: absolute;
          width: 60px; height: 60px;
          border-radius: 50%;
          background: rgba(255,255,255,0.3);
          animation: btnRipple 0.6s ease-out forwards;
          pointer-events: none;
          transform-origin: center;
        }

        /* ── Loading spinner inside button ───────────────────────────── */
        @keyframes spin { to { transform: rotate(360deg); } }
        .btn-spinner {
          width: 16px; height: 16px;
          border: 2px solid rgba(255,255,255,0.3);
          border-top-color: #fff;
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
          display: inline-block;
          margin-right: 8px;
          flex-shrink: 0;
        }

        /* ── Corner accent brackets on card ──────────────────────────── */
        .card-corner {
          position: absolute;
          width: 18px; height: 18px;
          pointer-events: none;
          z-index: 2;
        }
        .card-corner::before, .card-corner::after {
          content: '';
          position: absolute;
          background: rgba(220,38,38,0.55);
          border-radius: 1px;
        }
        .card-corner.tl { top: 12px; left: 12px; }
        .card-corner.tr { top: 12px; right: 12px; transform: scaleX(-1); }
        .card-corner.bl { bottom: 12px; left: 12px; transform: scaleY(-1); }
        .card-corner.br { bottom: 12px; right: 12px; transform: scale(-1); }
        .card-corner::before { top: 0; left: 0; width: 2px; height: 100%; }
        .card-corner::after  { top: 0; left: 0; width: 100%; height: 2px; }

        /* ── Success overlay ─────────────────────────────────────── */
        .success-overlay {
          position: absolute;
          inset: 0;
          border-radius: 32px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          z-index: 20;
          background: rgba(8, 20, 12, 0.82);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          gap: 16px;
          overflow: hidden;
        }
        /* Ripple rings that expand outward */
        @keyframes successRing {
          0%   { transform: translate(-50%, -50%) scale(0); opacity: 0.7; }
          100% { transform: translate(-50%, -50%) scale(4); opacity: 0; }
        }
        .success-ring {
          position: absolute;
          top: 50%; left: 50%;
          width: 120px; height: 120px;
          border-radius: 50%;
          border: 2px solid rgba(16,185,129,0.5);
          animation: successRing 1.1s ease-out forwards;
          pointer-events: none;
        }
        .success-ring-2 { animation-delay: 0.18s !important; }
        .success-ring-3 { animation-delay: 0.36s !important; }

        /* Checkmark draw */
        @keyframes checkDraw {
          from { stroke-dashoffset: 60; }
          to   { stroke-dashoffset: 0; }
        }
        .success-check {
          width: 72px; height: 72px;
          background: radial-gradient(circle, rgba(16,185,129,0.15) 0%, transparent 70%);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 2px solid rgba(16,185,129,0.4);
          position: relative;
          z-index: 2;
        }
        .success-check svg polyline {
          stroke-dasharray: 60;
          stroke-dashoffset: 60;
          animation: checkDraw 0.45s ease-out 0.1s forwards;
        }
        .success-label {
          font-size: 16px;
          font-weight: 600;
          color: rgba(255,255,255,0.9);
          letter-spacing: 0.02em;
          z-index: 2;
        }
        .success-sublabel {
          font-size: 12px;
          color: rgba(255,255,255,0.35);
          z-index: 2;
          letter-spacing: 0.05em;
        }

        /* Button success state */
        .submit-btn.success-state {
          background: linear-gradient(135deg, #059669 0%, #047857 100%) !important;
          box-shadow: 0 8px 30px rgba(16,185,129,0.35) !important;
        }

        .login-root {
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
          background: transparent;
          -webkit-app-region: drag;
          overflow: hidden;
          position: relative;
        }

        /* Noise overlay */
        .login-root::before {
          content: '';
          position: fixed;
          inset: 0;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.05'/%3E%3C/svg%3E");
          opacity: 0.35;
          pointer-events: none;
          z-index: 0;
        }

        .login-blob {
          position: fixed;
          border-radius: 50%;
          pointer-events: none;
          filter: blur(90px);
        }
        .blob-1 {
          width: 500px; height: 500px;
          background: radial-gradient(circle, #7f1d1d 0%, transparent 65%);
          top: -120px; left: -160px;
          opacity: 0.5;
          animation: drift1 10s ease-in-out infinite alternate;
        }
        .blob-2 {
          width: 300px; height: 300px;
          background: radial-gradient(circle, #450a0a 0%, transparent 65%);
          bottom: -80px; right: -80px;
          opacity: 0.6;
          animation: drift2 13s ease-in-out infinite alternate;
        }

        @keyframes drift1 {
          from { transform: translate(0, 0) scale(1); }
          to { transform: translate(30px, -30px) scale(1.1); }
        }
        @keyframes drift2 {
          from { transform: translate(0, 0); }
          to { transform: translate(-20px, 20px) scale(0.95); }
        }

        .login-scene {
          position: relative;
          z-index: 10;
          width: 100%;
          max-width: 380px;
          margin: 0 20px;
        }

        .login-card {
          position: relative;
          background: rgba(12, 10, 14, 0.84);
          backdrop-filter: blur(60px);
          -webkit-backdrop-filter: blur(60px);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 32px;
          overflow: hidden;
          box-shadow:
            0 0 0 1px rgba(255,255,255,0.04),
            0 60px 120px rgba(0,0,0,0.8),
            0 0 100px rgba(185,28,28,0.06) inset;
          -webkit-app-region: none;
        }

        /* Accent bar */
        .card-accent-bar {
          height: 3px;
          background: linear-gradient(90deg, transparent 0%, #dc2626 30%, #ef4444 60%, transparent 100%);
          width: 100%;
          flex-shrink: 0;
        }

        /* Vertical deco line */
        .card-deco-line {
          position: absolute;
          left: -1px; top: 60px; bottom: 60px;
          width: 2px;
          background: linear-gradient(180deg, transparent, rgba(220,38,38,0.45) 30%, rgba(220,38,38,0.45) 70%, transparent);
          border-radius: 2px;
          pointer-events: none;
        }

        .card-body { padding: 40px 44px 44px; }

        /* Win controls */
        .win-controls {
          position: fixed;
          top: 12px; right: 12px;
          display: flex; gap: 8px;
          -webkit-app-region: no-drag;
          z-index: 1000;
        }
        .win-btn {
          width: 28px; height: 28px;
          border-radius: 8px;
          border: none;
          background: rgba(255,255,255,0.06);
          color: rgba(255,255,255,0.4);
          cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          font-size: 14px;
          transition: all 0.2s;
        }
        .win-btn:hover { background: rgba(255,255,255,0.12); color: #fff; }
        .win-btn.close:hover { background: #e81123 !important; color: white !important; }

        /* Header */
        .login-header {
          display: flex;
          align-items: flex-start;
          gap: 16px;
          margin-bottom: 36px;
        }

        .logo-container {
          flex-shrink: 0;
          width: 52px; height: 52px;
          border-radius: 16px;
          background: linear-gradient(135deg, #1f0000, #3d0000);
          border: 1px solid rgba(220,38,38,0.25);
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          position: relative;
        }
        .logo-container::after {
          content: '';
          position: absolute;
          top: -50%; left: -50%;
          width: 200%; height: 200%;
          background: conic-gradient(from 0deg, transparent 0%, rgba(220,38,38,0.12) 25%, transparent 50%);
          animation: logoRotate 6s linear infinite;
        }
        @keyframes logoRotate {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .logo-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          position: relative;
          z-index: 1;
        }

        .header-text { padding-top: 2px; }

        .app-name {
          font-family: 'DM Serif Display', serif !important;
          font-size: 28px !important;
          font-style: italic;
          color: #fff;
          letter-spacing: -0.5px;
          line-height: 1;
          margin-bottom: 5px;
        }

        .app-sub {
          font-size: 13px;
          color: rgba(255,255,255,0.3);
          font-weight: 400;
        }

        /* Divider */
        .login-divider {
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.06) 30%, rgba(255,255,255,0.06) 70%, transparent);
          margin-bottom: 28px;
        }

        /* Tab switcher */
        .login-tabs {
          display: flex;
          gap: 0;
          background: rgba(255,255,255,0.04);
          border-radius: 12px;
          padding: 4px;
          margin-bottom: 28px;
        }

        .login-tab {
          flex: 1;
          padding: 9px;
          border: none;
          border-radius: 9px;
          background: transparent;
          color: rgba(255,255,255,0.35);
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.25s;
          letter-spacing: 0.01em;
          font-family: 'DM Sans', sans-serif !important;
        }

        .login-tab.active {
          background: rgba(255,255,255,0.07);
          color: #fff;
        }

        .login-tab:hover:not(.active) { color: rgba(255,255,255,0.6); }

        /* Fields */
        .field-label-txt {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 11px;
          font-weight: 600;
          color: rgba(255,255,255,0.28);
          letter-spacing: 0.1em;
          text-transform: uppercase;
          margin-bottom: 8px;
        }
        .label-dot {
          width: 4px; height: 4px;
          border-radius: 50%;
          background: #dc2626;
          opacity: 0.7;
          flex-shrink: 0;
        }

        .input-wrap { position: relative; }

        .input-icon {
          position: absolute;
          left: 16px; top: 50%;
          transform: translateY(-50%);
          color: rgba(255,255,255,0.2);
          display: flex;
          pointer-events: none;
          transition: color 0.25s;
          z-index: 1;
        }
        .input-wrap:focus-within .input-icon { color: rgba(220,38,38,0.65); }
        
        .password-toggle {
          position: absolute;
          right: 12px; top: 50%;
          transform: translateY(-50%);
          background: transparent;
          border: none;
          color: rgba(255,255,255,0.2);
          cursor: pointer;
          display: flex;
          padding: 6px;
          border-radius: 8px;
          transition: all 0.2s;
          z-index: 2;
        }
        .password-toggle:hover {
          background: rgba(255,255,255,0.05);
          color: rgba(255,255,255,0.6);
        }

        .field-input {
          width: 100% !important;
          padding: 14px 16px 14px 46px !important;
          background: rgba(255,255,255,0.03) !important;
          border: 1px solid rgba(255,255,255,0.07) !important;
          border-radius: 14px !important;
          color: #fff !important;
          font-size: 14px !important;
          outline: none !important;
          transition: all 0.25s !important;
          font-family: 'DM Sans', sans-serif !important;
          letter-spacing: 0.01em !important;
        }
        .field-input::placeholder { color: rgba(255,255,255,0.18) !important; }
        .field-input:focus {
          background: rgba(220,38,38,0.04) !important;
          border-color: rgba(220,38,38,0.4) !important;
          box-shadow: 0 0 0 4px rgba(220,38,38,0.08) !important;
        }

        .field-error-msg {
          font-size: 11px;
          color: #ef4444;
          margin-top: 4px;
          padding-left: 4px;
        }

        /* Checkbox */
        .remember-row { display: flex; align-items: center; }
        .remember-row label { color: rgba(255,255,255,0.35) !important; font-size: 13px !important; }

        /* Submit button */
        .submit-btn {
          width: 100%;
          padding: 15px;
          background: linear-gradient(135deg, #e23636 0%, #b91c1c 100%);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-top: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 14px;
          color: white;
          font-size: 14px;
          font-weight: 600;
          font-family: 'DM Sans', sans-serif !important;
          cursor: pointer;
          letter-spacing: 0.03em;
          transition: all 0.25s;
          box-shadow: 0 8px 30px rgba(220,38,38,0.2), 0 1px 0 rgba(255,255,255,0.1) inset;
          overflow: hidden;
          position: relative;
          margin-top: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .submit-btn::before {
          content: '';
          position: absolute;
          top: 0; left: -100%;
          width: 100%; height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent);
          transition: left 0.6s;
        }
        .submit-btn:hover::before { left: 100%; }
        .submit-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 12px 40px rgba(220,38,38,0.35), 0 1px 0 rgba(255,255,255,0.15) inset;
          border-color: rgba(255, 255, 255, 0.15);
        }
        .submit-btn:active { transform: translateY(0); }
        .submit-btn:disabled { opacity: 0.55; cursor: not-allowed; transform: none; }

        /* Alert */
        .login-alert {
          padding: 12px 16px;
          border-radius: 12px;
          font-size: 13px;
          line-height: 1.5;
          margin-bottom: 4px;
        }

        /* Footer */
        .login-footer {
          margin-top: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
        }
        .login-footer::before {
          content: '';
          position: absolute;
          left: 0; right: 0; top: 50%;
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.08) 50%, transparent);
        }
        .footer-inner {
          position: relative;
          background: rgba(18, 15, 20, 0.6);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          padding: 6px 20px;
          border-radius: 100px;
          border: 1px solid rgba(255,255,255,0.05);
          box-shadow: 0 4px 12px rgba(0,0,0,0.2);
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
          color: rgba(255,255,255,0.4);
        }
        .footer-link {
          color: #fff;
          cursor: pointer;
          font-weight: 500;
          transition: color 0.2s, text-shadow 0.2s;
        }
        .footer-link:hover { 
          color: #ef4444; 
          text-shadow: 0 0 8px rgba(239,68,68,0.4);
        }
      `}</style>

      <div className="login-root">
        <div className="login-blob blob-1" />
        <div className="login-blob blob-2" />

        <div className="login-scene">
          <motion.div
            className="login-card"
            initial={{ opacity: 0, y: 40, scale: 0.93, filter: 'blur(10px)' }}
            animate={submitState === 'success'
              ? { scale: 0.96, filter: 'blur(2px)', opacity: 0.8 }
              : { opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }
            }
            exit={{ opacity: 0, scale: 1.08, filter: 'blur(14px)', y: -24 }}
            transition={submitState === 'success'
              ? { duration: 0.4, ease: [0.4, 0, 0.2, 1] }
              : { duration: 0.75, ease: [0.16, 1, 0.3, 1], filter: { duration: 0.5 } }
            }
          >
            {/* Scan-line effect */}
            <div className="card-scanline" />

            {/* Corner tech brackets */}
            <div className="card-corner tl" />
            <div className="card-corner tr" />
            <div className="card-corner bl" />
            <div className="card-corner br" />

            <div className="card-accent-bar" />
            <div className="card-deco-line" />

            {/* ── Success Overlay ──────────────────────────────────────────── */}
            <AnimatePresence>
              {submitState === 'success' && (
                <motion.div
                  className="success-overlay"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3, ease: 'easeOut' }}
                >
                  {/* Expanding rings */}
                  <div className="success-ring" />
                  <div className="success-ring success-ring-2" />
                  <div className="success-ring success-ring-3" />

                  {/* Animated checkmark */}
                  <motion.div
                    className="success-check"
                    initial={{ scale: 0, rotate: -20 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: 'spring', stiffness: 320, damping: 18, delay: 0.05 }}
                  >
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                      <polyline
                        points="4,12 9,17 20,7"
                        stroke="#10b981"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </motion.div>

                  <motion.div
                    className="success-label"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.25, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                  >
                    ¡Bienvenido!
                  </motion.div>
                  <motion.div
                    className="success-sublabel"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4, duration: 0.35 }}
                  >
                    Cargando tu espacio de trabajo...
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="win-controls">
              <motion.button 
                whileHover={{ scale: 1.1, backgroundColor: 'rgba(255,255,255,0.12)' }}
                whileTap={{ scale: 0.9 }}
                className="win-btn" 
                onClick={handleMinimize}
              >
                −
              </motion.button>
              <motion.button 
                whileHover={{ scale: 1.1, backgroundColor: '#dc2626' }}
                whileTap={{ scale: 0.9 }}
                className="win-btn close" 
                onClick={handleClose}
              >
                ✕
              </motion.button>
            </div>

            <div className="card-body">
              {/* ── Stagger container for all card children ─── */}
              <motion.div variants={containerVariants} initial="hidden" animate="show">

              {/* Header */}
              <motion.div className="login-header" variants={itemVariants}>
                <motion.div
                  className="logo-container"
                  whileHover={{ scale: 1.08, rotate: 3 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                >
                  <img src={logoIcon} alt="Syncro" className="logo-img" />
                </motion.div>
                <div className="header-text">
                  <div className="app-name">Syncro</div>
                  <AnimatePresence mode="wait">
                    <motion.div 
                      key={isLogin ? 'login' : 'reg'}
                      initial={{ opacity: 0, x: -10, filter: 'blur(3px)' }}
                      animate={{ opacity: 1, x: 0,   filter: 'blur(0px)' }}
                      exit={{ opacity: 0, x: 10 }}
                      transition={{ duration: 0.22 }}
                      className="app-sub"
                    >
                      {isLogin ? 'Bienvenido de nuevo' : 'Crea tu cuenta'}
                    </motion.div>
                  </AnimatePresence>
                </div>
              </motion.div>

              <motion.div className="login-divider" variants={itemVariants} />

              {/* Tabs */}
              <motion.div className="login-tabs" variants={itemVariants}>
                <button
                  className={`login-tab${isLogin ? ' active' : ''}`}
                  onClick={() => { if (!isLogin) switchMode(); }}
                  style={{ position: 'relative' }}
                >
                  {isLogin && (
                    <motion.div 
                      layoutId="tab-bg" 
                      className="active-tab-bg"
                      style={{ 
                        position: 'absolute', inset: 0, 
                        background: 'rgba(255,255,255,0.07)', 
                        borderRadius: '9px', zIndex: -1 
                      }} 
                    />
                  )}
                  Iniciar sesión
                </button>
                <button
                  className={`login-tab${!isLogin ? ' active' : ''}`}
                  onClick={() => { if (isLogin) switchMode(); }}
                  style={{ position: 'relative' }}
                >
                  {!isLogin && (
                    <motion.div 
                      layoutId="tab-bg" 
                      className="active-tab-bg"
                      style={{ 
                        position: 'absolute', inset: 0, 
                        background: 'rgba(255,255,255,0.07)', 
                        borderRadius: '9px', zIndex: -1 
                      }} 
                    />
                  )}
                  Registrarse
                </button>
              </motion.div>

              {/* Alert */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    key="alert"
                    initial={{ opacity: 0, y: -8, height: 0 }}
                    animate={{ opacity: 1, y: 0, height: 'auto' }}
                    exit={{ opacity: 0, y: -8, height: 0 }}
                    style={{ marginBottom: 16 }}
                  >
                    <div
                      className="login-alert"
                      style={{
                        background: error.type === 'success' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                        border: `1px solid ${error.type === 'success' ? 'rgba(16,185,129,0.25)' : 'rgba(239,68,68,0.25)'}`,
                        color: 'rgba(255,255,255,0.8)',
                      }}
                    >
                      {error.message}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Form */}
              <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <motion.div variants={itemVariants}>
                  <div className="field-label-txt">
                    <span className="label-dot" />
                    Usuario
                  </div>
                  <div className="input-wrap">
                    <span className="input-icon"><UserIcon /></span>
                    <motion.input 
                      whileFocus={{ scale: 1.01 }}
                      className="field-input" 
                      {...register('username')} 
                      placeholder="Introduce tu usuario" 
                      autoComplete={isLogin ? "username" : "new-username"} 
                      disabled={isLoading}
                    />
                  </div>
                  {errors.username && <div className="field-error-msg">{errors.username.message}</div>}
                </motion.div>

                <motion.div variants={itemVariants}>
                  <div className="field-label-txt">
                    <span className="label-dot" />
                    Contraseña
                  </div>
                  <div className="input-wrap">
                    <span className="input-icon"><LockIcon /></span>
                    <motion.input 
                      whileFocus={{ scale: 1.01 }}
                      className="field-input" 
                      {...register('password')} 
                      type={showPassword ? "text" : "password"} 
                      placeholder="••••••••" 
                      autoComplete={isLogin ? "current-password" : "new-password"}
                      disabled={isLoading}
                      style={{ paddingRight: '48px' }}
                    />
                    <button 
                      type="button"
                      className="password-toggle"
                      onClick={() => setShowPassword(!showPassword)}
                      tabIndex="-1"
                    >
                      {showPassword ? <EyeOff24Regular /> : <Eye24Regular />}
                    </button>
                  </div>
                  {errors.password && <div className="field-error-msg">{errors.password.message}</div>}
                </motion.div>

                {isLogin && (
                  <div className="remember-row">
                    <Checkbox
                      label="Recordar mi sesión"
                      checked={rememberMe}
                      disabled={isLoading}
                      onChange={(e, d) => setRememberMe(d.checked)}
                    />
                  </div>
                )}

                <motion.div variants={itemVariants}>
                  <motion.button 
                    whileHover={!isLoading && submitState !== 'success' ? {
                      scale: 1.025, y: -3,
                      boxShadow: '0 16px 48px rgba(220,38,38,0.45), 0 1px 0 rgba(255,255,255,0.15) inset',
                    } : {}}
                    whileTap={!isLoading && submitState !== 'success' ? { scale: 0.97, y: 0 } : {}}
                    animate={submitState === 'success' ? {
                      background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                      boxShadow: '0 8px 30px rgba(16,185,129,0.4)',
                    } : isLoading ? {
                      boxShadow: [
                        '0 8px 30px rgba(220,38,38,0.2)',
                        '0 8px 40px rgba(220,38,38,0.5)',
                        '0 8px 30px rgba(220,38,38,0.2)',
                      ],
                    } : {}}
                    transition={isLoading ? { duration: 1.2, repeat: Infinity, ease: 'easeInOut' }
                      : { type: 'spring', stiffness: 400, damping: 20 }}
                    type="submit" 
                    className={`submit-btn${submitState === 'success' ? ' success-state' : ''}`}
                    disabled={isLoading || !apiReady || submitState === 'success'}
                  >
                    <AnimatePresence mode="wait">
                      {submitState === 'success' ? (
                        <motion.span
                          key="ok"
                          initial={{ opacity: 0, scale: 0.7 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          style={{ display: 'flex', alignItems: 'center', gap: 8 }}
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                            <polyline points="4,12 9,17 20,7" stroke="white" strokeWidth="2.5"
                              strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                          Sesión iniciada
                        </motion.span>
                      ) : !apiReady ? (
                        <motion.span
                          key="connecting"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          style={{ display: 'flex', alignItems: 'center' }}
                        >
                          <span className="btn-spinner" />Conectando API...
                        </motion.span>
                      ) : isLoading ? (
                        <motion.span
                          key="loading"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          style={{ display: 'flex', alignItems: 'center' }}
                        >
                          <span className="btn-spinner" />Verificando...
                        </motion.span>
                      ) : (
                        <motion.span
                          key="idle"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                        >
                          {isLogin ? 'Entrar →' : 'Registrarse →'}
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </motion.button>
                </motion.div>
              </form>

              {/* Footer */}
              <motion.div className="login-footer" variants={itemVariants}>
                <div className="footer-inner">
                  <span>{isLogin ? '¿No tienes cuenta?' : '¿Ya tienes cuenta?'}</span>
                  <motion.span 
                    whileHover={{ color: '#ef4444', textShadow: '0 0 12px rgba(239,68,68,0.6)' }}
                    transition={{ duration: 0.15 }}
                    className="footer-link" 
                    onClick={switchMode}
                  >
                    {isLogin ? 'Regístrate' : 'Inicia sesión'}
                  </motion.span>
                </div>
              </motion.div>
              </motion.div> {/* end stagger container */}
            </div>
          </motion.div>
        </div>
      </div>
    </>
  );
};

export default Login;