import React from 'react';
import { motion } from 'motion/react';

export const HeroBackground: React.FC = () => {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10 select-none">
      {/* Warm retro-cream ambient wash */}
      <div className="absolute -top-[15%] left-1/2 -translate-x-1/2 w-[1100px] h-[650px] bg-gradient-to-b from-[#F5EFEB] via-[#FAF5EC]/80 to-transparent rounded-full blur-3xl opacity-90" />
      
      {/* Floating pastel accents (PayCart style) */}
      <motion.div
        animate={{ y: [0, -15, 0], rotate: [0, 5, 0] }}
        transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute top-28 left-[5%] w-24 h-24 rounded-full bg-[#FEF3C7]/80 border-2 border-[#0D1B2A]/10 -z-10 blur-[1px]"
      />
      <motion.div
        animate={{ y: [0, 18, 0], rotate: [0, -6, 0] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
        className="absolute top-44 right-[8%] w-32 h-32 rounded-3xl bg-[#EEF2FF]/70 border-2 border-[#0D1B2A]/10 -z-10 rotate-12"
      />
      <motion.div
        animate={{ y: [0, -12, 0] }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
        className="absolute bottom-16 left-[12%] w-20 h-20 rounded-2xl bg-[#D1FADF]/70 border-2 border-[#0D1B2A]/10 -z-10 -rotate-6"
      />
      <motion.div
        animate={{ scale: [1, 1.08, 1], opacity: [0.6, 0.9, 0.6] }}
        transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute bottom-32 right-[15%] w-16 h-16 rounded-full bg-[#FFE4E6]/80 border-2 border-[#0D1B2A]/10 -z-10"
      />

      {/* Subtle Dot Grid */}
      <svg
        className="absolute inset-0 w-full h-full opacity-25"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 1440 900"
        preserveAspectRatio="none"
      >
        <defs>
          <pattern id="dotPattern" width="36" height="36" patternUnits="userSpaceOnUse">
            <circle cx="2" cy="2" r="1.2" fill="#0D1B2A" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#dotPattern)" />
      </svg>
    </div>
  );
};

