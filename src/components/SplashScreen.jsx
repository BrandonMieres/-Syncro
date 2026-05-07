import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import logoIcon from '../assets/icon.png';

// ── Configuración del polling ────────────────────────────────────────────────
const FAST_INTERVAL  = 80;   // ms entre intentos rápidos (primeros 3s)
const SLOW_INTERVAL  = 250;  // ms entre intentos lentos  (3s – 10s)
const FAST_LIMIT     = Math.ceil(3000 / 80);   // ~38 intentos
const MIN_TIMEOUT    = 5000;  // 5s mínimo de carga para mostrar la animación
const TOTAL_TIMEOUT  = 10000; // 10s máximo antes de mostrar error

const STATUS_MSGS = [
  'Iniciando núcleo...',
  'Cargando módulos...',
  'Conectando servicios...',
  'Preparando interfaz...',
  'Casi listo...',
];

const SplashScreen = ({ onReady, onFail }) => {
  const [statusIdx,  setStatusIdx]  = useState(0);
  const [progress,   setProgress]   = useState(0);   // 0-100
  const [failed,     setFailed]     = useState(false);
  const attemptsRef  = useRef(0);
  const startTimeRef = useRef(Date.now());
  const timerRef     = useRef(null);

  useEffect(() => {
    // Avanzar los mensajes de estado cada ~2s
    const msgInterval = setInterval(() => {
      setStatusIdx(i => Math.min(i + 1, STATUS_MSGS.length - 1));
    }, 2000);

    // Animar la barra de progreso de 0 → 90 durante el tiempo mínimo (5s)
    const progressInterval = setInterval(() => {
      const elapsed  = Date.now() - startTimeRef.current;
      const pct      = Math.min(90, (elapsed / MIN_TIMEOUT) * 100);
      setProgress(pct);
    }, 120);

    // Polling principal
    const poll = () => {
      attemptsRef.current += 1;
      const elapsed = Date.now() - startTimeRef.current;

      if (window.electronAPI && elapsed >= MIN_TIMEOUT) {
        // ✅ API lista Y tiempo mínimo cumplido — completar la barra y llamar onReady
        clearTimeout(timerRef.current);
        setProgress(100);
        setTimeout(() => onReady(), 350);  // pequeña pausa visual
        return;
      }

      if (elapsed >= TOTAL_TIMEOUT) {
        // ⛔ Timeout — notificar fallo
        setFailed(true);
        // NO llamamos a onFail() para que la pantalla de carga se quede mostrando el error
        return;
      }

      const delay = attemptsRef.current < FAST_LIMIT ? FAST_INTERVAL : SLOW_INTERVAL;
      timerRef.current = setTimeout(poll, delay);
    };

    timerRef.current = setTimeout(poll, FAST_INTERVAL);

    return () => {
      clearTimeout(timerRef.current);
      clearInterval(msgInterval);
      clearInterval(progressInterval);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.04, filter: 'blur(8px)' }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      style={{
        position: 'absolute', inset: 0,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        zIndex: 100,
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:wght@300;400;500;600&display=swap');

        /* ── Radar ring ──────────────────────────────────────────────── */
        @keyframes radarSpin {
          from { transform: rotate(0deg);   }
          to   { transform: rotate(360deg); }
        }
        @keyframes radarPulse {
          0%, 100% { opacity: 0.55; }
          50%       { opacity: 1;   }
        }
        .splash-radar {
          position: absolute;
          border-radius: 50%;
          border: 1.5px solid transparent;
          border-top-color: #dc2626;
          border-right-color: rgba(220,38,38,0.35);
          animation: radarSpin var(--dur) linear infinite;
        }

        /* ── Dot pulsing loader ──────────────────────────────────────── */
        @keyframes dotPulse {
          0%, 80%, 100% { transform: scale(0.7); opacity: 0.35; }
          40%            { transform: scale(1.1); opacity: 1;    }
        }
        .splash-dot {
          width: 5px; height: 5px;
          border-radius: 50%;
          background: rgba(220,38,38,0.8);
          animation: dotPulse 1.4s ease-in-out infinite;
        }
        .splash-dot:nth-child(2) { animation-delay: 0.2s; }
        .splash-dot:nth-child(3) { animation-delay: 0.4s; }

        /* ── Glow aura behind logo ───────────────────────────────────── */
        @keyframes auraBreath {
          0%, 100% { transform: scale(1);   opacity: 0.4; }
          50%       { transform: scale(1.2); opacity: 0.7; }
        }
        .splash-aura {
          position: absolute;
          width: 120px; height: 120px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(220,38,38,0.35) 0%, transparent 70%);
          animation: auraBreath 2.5s ease-in-out infinite;
          filter: blur(20px);
        }

        /* ── Scanline on logo ────────────────────────────────────────── */
        @keyframes logoScan {
          0%   { transform: translateY(-52px); opacity: 0;   }
          10%  { opacity: 0.6; }
          90%  { opacity: 0.6; }
          100% { transform: translateY(52px);  opacity: 0;   }
        }
        .logo-scan {
          position: absolute;
          left: 0; right: 0; height: 1.5px;
          background: linear-gradient(90deg, transparent, rgba(220,38,38,0.7), transparent);
          animation: logoScan 2.2s ease-in-out infinite;
        }

        /* ── Progress bar fill ───────────────────────────────────────── */
        .progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #b91c1c, #ef4444, #b91c1c);
          background-size: 200% 100%;
          animation: shimmerBar 2s linear infinite;
          border-radius: 4px;
          transition: width 0.18s ease-out;
        }
        @keyframes shimmerBar {
          from { background-position: 200% 0; }
          to   { background-position: -200% 0; }
        }
      `}</style>

      {/* ── Logo + rings ───────────────────────────────────────────────── */}
      <div style={{ position: 'relative', width: 160, height: 160,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    marginBottom: 40 }}>

        {/* Aura glow */}
        <div className="splash-aura" />

        {/* Radar rings — each slightly bigger & slower */}
        {[
          { size: 96,  dur: '2.0s' },
          { size: 116, dur: '2.6s' },
          { size: 138, dur: '3.4s' },
        ].map(({ size, dur }, i) => (
          <div
            key={i}
            className="splash-radar"
            style={{ width: size, height: size, '--dur': dur }}
          />
        ))}

        {/* Logo container */}
        <motion.div
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1,   opacity: 1 }}
          transition={{ type: 'spring', stiffness: 260, damping: 20, delay: 0.1 }}
          style={{
            width: 72, height: 72,
            borderRadius: 20,
            background: 'linear-gradient(135deg, #1f0000, #3d0000)',
            border: '1px solid rgba(220,38,38,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            overflow: 'hidden', position: 'relative',
            boxShadow: '0 0 40px rgba(220,38,38,0.25)',
          }}
        >
          <img src={logoIcon} alt="Syncro"
            style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          <div className="logo-scan" />
        </motion.div>
      </div>

      {/* ── App name ─────────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0  }}
        transition={{ delay: 0.25, duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
        style={{ textAlign: 'center', marginBottom: 32 }}
      >
        <div style={{
          fontFamily: "'DM Serif Display', serif",
          fontStyle: 'italic',
          fontSize: 32,
          color: '#fff',
          letterSpacing: '-0.5px',
          lineHeight: 1,
          marginBottom: 6,
        }}>
          Syncro
        </div>
        <div style={{
          fontFamily: "'DM Sans', sans-serif",
          fontSize: 12,
          color: 'rgba(255,255,255,0.3)',
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
        }}>
          Autopublisher
        </div>
      </motion.div>

      {/* ── Status text + dots ───────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20,
                 fontFamily: "'DM Sans', sans-serif" }}
      >
        <AnimatePresence mode="wait">
          {failed ? (
            <motion.span
              key="fail"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              style={{ fontSize: 13, color: '#ef4444' }}
            >
              No se pudo conectar con Electron. Cierra y vuelve a abrir.
            </motion.span>
          ) : (
            <motion.span
              key={statusIdx}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.3 }}
              style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)' }}
            >
              {STATUS_MSGS[statusIdx]}
            </motion.span>
          )}
        </AnimatePresence>

        {!failed && (
          <div style={{ display: 'flex', gap: 4 }}>
            <div className="splash-dot" />
            <div className="splash-dot" />
            <div className="splash-dot" />
          </div>
        )}
      </motion.div>

      {/* ── Progress bar ─────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, scaleX: 0.8 }}
        animate={{ opacity: 1, scaleX: 1 }}
        transition={{ delay: 0.5, duration: 0.4 }}
        style={{
          width: 200, height: 3,
          borderRadius: 4,
          background: 'rgba(255,255,255,0.07)',
          overflow: 'hidden',
        }}
      >
        <div
          className="progress-fill"
          style={{ width: `${progress}%` }}
        />
      </motion.div>

      {/* ── Version badge ────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7 }}
        style={{
          position: 'absolute', bottom: 20,
          fontFamily: "'DM Sans', sans-serif",
          fontSize: 11,
          color: 'rgba(255,255,255,0.15)',
          letterSpacing: '0.08em',
        }}
      >
        v1.0.0 · Syncro Platform
      </motion.div>
    </motion.div>
  );
};

export default SplashScreen;
