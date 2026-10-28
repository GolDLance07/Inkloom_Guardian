'use client';

import React, { useState, useEffect } from 'react';

interface InitialLoadingScreenProps {
  onComplete: () => void;
}

export const InitialLoadingScreen: React.FC<InitialLoadingScreenProps> = ({ onComplete }) => {
  const [phase, setPhase] = useState<'enter' | 'active' | 'exit'>('enter');

  useEffect(() => {
    // Phase 1: Enter / bloom in
    const enterTimer = setTimeout(() => {
      setPhase('active');
    }, 80);

    // Phase 2: Start smooth cinematic exit dissolve
    const exitTimer = setTimeout(() => {
      setPhase('exit');
    }, 1700);

    // Phase 3: Notify parent to unmount
    const doneTimer = setTimeout(() => {
      onComplete();
    }, 2450);

    return () => {
      clearTimeout(enterTimer);
      clearTimeout(exitTimer);
      clearTimeout(doneTimer);
    };
  }, [onComplete]);

  return (
    <div
      className={`fixed inset-0 z-[100] bg-[#070C1E] flex items-center justify-center overflow-hidden transition-all duration-750 ease-out select-none ${
        phase === 'exit'
          ? 'opacity-0 scale-105 pointer-events-none'
          : 'opacity-100 scale-100 pointer-events-auto'
      }`}
      style={{
        transitionDuration: '750ms',
      }}
    >
      {/* Subtle radial ambient gradient for depth */}
      <div
        className={`absolute inset-0 pointer-events-none transition-opacity duration-1000 ${
          phase === 'enter' ? 'opacity-0' : 'opacity-100'
        }`}
        style={{
          background:
            'radial-gradient(circle at 50% 50%, rgba(220, 38, 38, 0.08) 0%, rgba(15, 23, 42, 0.3) 45%, transparent 70%)',
        }}
      />

      {/* Typography: Inkloom Guardian only, with smooth ink bloom transition */}
      <div className="relative z-10 flex items-center justify-center px-6">
        <h1
          className={`font-editorial text-5xl sm:text-7xl md:text-8xl font-normal tracking-wide text-[#FDFBF7] italic transition-all duration-1000 ease-out ${
            phase === 'enter'
              ? 'opacity-0 translate-y-3 blur-md scale-95 tracking-widest'
              : phase === 'exit'
              ? 'opacity-0 -translate-y-2 blur-sm scale-105 tracking-normal'
              : 'opacity-100 translate-y-0 blur-0 scale-100 tracking-wide'
          }`}
          style={{
            fontFamily: "'Newsreader', 'Playfair Display', Georgia, serif",
            textShadow: '0 0 40px rgba(220, 38, 38, 0.25)',
          }}
        >
          Inkloom <span className="text-[#DC2626] font-light not-italic">Guardian</span>
        </h1>
      </div>
    </div>
  );
};
