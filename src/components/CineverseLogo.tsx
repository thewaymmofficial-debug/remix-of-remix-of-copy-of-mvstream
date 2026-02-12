import { useState, useEffect, useCallback, useRef } from 'react';

const LETTERS = ['C', 'I', 'N', 'E', 'V', 'E', 'R', 'S', 'E'];

export function CineverseLogo() {
  const [animKey, setAnimKey] = useState(0);
  const [isAnimating, setIsAnimating] = useState(true);
  const containerRef = useRef<HTMLSpanElement>(null);
  const iRef = useRef<HTMLSpanElement>(null);
  const [lampLeft, setLampLeft] = useState<number | null>(null);

  const startAnimation = useCallback(() => {
    setIsAnimating(true);
    setAnimKey((k) => k + 1);
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => setIsAnimating(false), 1400);
    return () => clearTimeout(timeout);
  }, [animKey]);

  useEffect(() => {
    const interval = setInterval(() => {
      startAnimation();
    }, 10000);
    return () => clearInterval(interval);
  }, [startAnimation]);

  // Calculate lamp position after render
  useEffect(() => {
    const calc = () => {
      if (containerRef.current && iRef.current) {
        const containerRect = containerRef.current.getBoundingClientRect();
        const iRect = iRef.current.getBoundingClientRect();
        const iCenter = iRect.left + iRect.width / 2 - containerRect.left;
        setLampLeft(iCenter - 7); // 7 = half of lamp SVG width (14)
      }
    };
    calc();
    window.addEventListener('resize', calc);
    return () => window.removeEventListener('resize', calc);
  }, [animKey]);

  return (
    <span key={animKey} ref={containerRef} className="relative flex items-end h-6 overflow-visible">
      {LETTERS.map((letter, i) => {
        const isI = i === 1;
        const delay = i * 60;

        return (
          <span
            key={i}
            ref={isI ? iRef : undefined}
            className={`
              inline-block text-lg font-bold text-white tracking-wide
              ${isI ? 'animate-letter-squish' : ''}
              ${isAnimating ? 'animate-letter-fade-up opacity-0' : 'opacity-100'}
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

      {/* Lamp / Spotlight - centered over "I" */}
      {lampLeft !== null && (
        <span
          className={`absolute lamp-element ${isAnimating ? 'animate-lamp-drop opacity-0' : 'opacity-100 animate-lamp-glow'}`}
          style={{
            left: `${lampLeft}px`,
            top: '-0.85em',
            animationDelay: isAnimating ? '350ms' : '0ms',
            animationFillMode: 'forwards',
            lineHeight: 1,
            pointerEvents: 'none',
          }}
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            className="lamp-svg"
          >
            <path
              d="M12 2 L8 10 L16 10 Z"
              fill="currentColor"
              className="text-cg-gold"
            />
            <rect x="10" y="10" width="4" height="2" rx="0.5" fill="currentColor" className="text-cg-gold" />
            <path
              d="M6 14 L12 11 L18 14"
              stroke="currentColor"
              strokeWidth="0.5"
              fill="hsl(45 93% 47% / 0.3)"
              className="text-cg-gold"
            />
          </svg>
        </span>
      )}
    </span>
  );
}
