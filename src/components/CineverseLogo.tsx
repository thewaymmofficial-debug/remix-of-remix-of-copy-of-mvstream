import { useState, useEffect } from 'react';

const LETTERS = ['C', 'I', 'N', 'E', 'V', 'E', 'R', 'S', 'E'];
const SESSION_KEY = 'cineverse-logo-animated';

export function CineverseLogo() {
  const [shouldAnimate] = useState(() => {
    if (typeof window === 'undefined') return false;
    const alreadyPlayed = sessionStorage.getItem(SESSION_KEY);
    if (!alreadyPlayed) {
      sessionStorage.setItem(SESSION_KEY, '1');
      return true;
    }
    return false;
  });

  const [animationDone, setAnimationDone] = useState(!shouldAnimate);

  useEffect(() => {
    if (shouldAnimate) {
      const timer = setTimeout(() => setAnimationDone(true), 1400);
      return () => clearTimeout(timer);
    }
  }, [shouldAnimate]);

  if (!shouldAnimate) {
    return (
      <span className="text-lg font-bold text-white tracking-wide flex items-center">
        CINEVERSE
      </span>
    );
  }

  return (
    <span className="relative flex items-end h-6 overflow-visible">
      {LETTERS.map((letter, i) => {
        const isI = i === 1;
        const delay = i * 60;

        return (
          <span
            key={i}
            className={`
              inline-block text-lg font-bold text-white tracking-wide
              ${isI ? 'animate-letter-squish' : ''}
              ${!animationDone ? 'animate-letter-fade-up opacity-0' : 'opacity-100'}
            `}
            style={{
              animationDelay: isI
                ? `${delay}ms, 500ms`
                : `${delay}ms`,
              animationFillMode: 'forwards',
            }}
          >
            {letter}
          </span>
        );
      })}

      {/* Lamp / Spotlight */}
      <span
        className={`absolute lamp-element ${!animationDone ? 'animate-lamp-drop opacity-0' : 'opacity-100 animate-lamp-glow'}`}
        style={{
          left: '0.58em',
          top: '-0.7em',
          animationDelay: !animationDone ? '350ms' : '0ms',
          animationFillMode: 'forwards',
          fontSize: '0.6em',
          lineHeight: 1,
          pointerEvents: 'none',
        }}
      >
        {/* Simple lamp SVG */}
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          className="lamp-svg"
        >
          {/* Lamp body */}
          <path
            d="M12 2 L8 10 L16 10 Z"
            fill="currentColor"
            className="text-cg-gold"
          />
          {/* Lamp base */}
          <rect x="10" y="10" width="4" height="2" rx="0.5" fill="currentColor" className="text-cg-gold" />
          {/* Light beam */}
          <path
            d="M6 14 L12 11 L18 14"
            stroke="currentColor"
            strokeWidth="0.5"
            fill="hsl(45 93% 47% / 0.2)"
            className="text-cg-gold"
          />
        </svg>
      </span>
    </span>
  );
}
