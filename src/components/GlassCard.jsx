import React from 'react';
import { motion } from 'framer-motion';

const GlassCard = ({ children, className = '', style = {}, strong = false, hoverable = false }) => {
  const Component = hoverable ? motion.div : 'div';
  
  const hoverProps = hoverable ? {
    whileHover: { 
      y: -5, 
      backgroundColor: 'rgba(255, 255, 255, 0.08)',
      borderColor: 'rgba(192, 57, 43, 0.3)'
    },
    transition: { duration: 0.2, ease: 'easeOut' }
  } : {};

  return (
    <Component 
      className={`${strong ? 'glass-strong' : 'glass'} ${className}`}
      {...hoverProps}
      style={{
        ...style,
        boxShadow: strong ? '0 25px 60px rgba(0,0,0,0.6)' : '0 15px 35px rgba(0,0,0,0.3)',
        transition: 'background-color 0.2s, border-color 0.2s'
      }}
    >
      {children}
    </Component>
  );
};

export default GlassCard;
