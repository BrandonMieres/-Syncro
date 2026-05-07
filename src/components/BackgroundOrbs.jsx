import React from 'react';
import { motion } from 'framer-motion';

const BackgroundOrbs = () => {
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      zIndex: -1,
      overflow: 'hidden',
      background: 'transparent'
    }}>
      {/* Orb superior izquierda */}
      <motion.div 
        animate={{
          scale: [1, 1.2, 1],
          x: [0, 50, 0],
          y: [0, 30, 0],
        }}
        transition={{
          duration: 15,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        style={{
          position: 'absolute',
          top: '-100px',
          left: '-100px',
          width: '600px',
          height: '600px',
          background: '#c0392b',
          filter: 'blur(100px)',
          opacity: 0.15,
          borderRadius: '50%'
        }} 
      />

      {/* Orb inferior derecha */}
      <motion.div 
        animate={{
          scale: [1, 1.1, 1],
          x: [0, -40, 0],
          y: [0, -50, 0],
        }}
        transition={{
          duration: 18,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 2
        }}
        style={{
          position: 'absolute',
          bottom: '-50px',
          right: '-50px',
          width: '500px',
          height: '500px',
          background: '#7b0000',
          filter: 'blur(100px)',
          opacity: 0.15,
          borderRadius: '50%'
        }} 
      />

      {/* Orb central */}
      <motion.div 
        animate={{
          opacity: [0.05, 0.1, 0.05],
          scale: [0.8, 1.1, 0.8],
        }}
        transition={{
          duration: 12,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '400px',
          height: '400px',
          background: '#e74c3c',
          filter: 'blur(120px)',
          opacity: 0.08,
          borderRadius: '50%'
        }} 
      />
    </div>
  );
};

export default BackgroundOrbs;
