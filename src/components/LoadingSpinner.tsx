const LETTERS = ['C', 'I', 'N', 'E', 'V', 'E', 'R', 'S', 'E'];

interface LoadingSpinnerProps {
  message?: string;
}

export function LoadingSpinner({ message = 'Loading...' }: LoadingSpinnerProps) {
  return (
    <div className="flex flex-col items-center justify-center py-32 gap-6">
      {/* Animated CINEVERSE logo as loader */}
      <div className="relative flex items-end h-10 overflow-visible logo-loading-loop">
        {LETTERS.map((letter, i) => {
          const isI = i === 1;
          const delay = i * 80;

          return (
            <span
              key={i}
              className={`
                inline-block text-2xl font-bold text-foreground tracking-wider
                logo-letter-anim
                ${isI ? 'logo-squish-anim' : ''}
              `}
              style={{
                animationDelay: isI
                  ? `${delay}ms, 600ms`
                  : `${delay}ms`,
              }}
            >
              {letter}
            </span>
          );
        })}

        {/* Lamp */}
        <span
          className="absolute logo-lamp-anim"
          style={{
            left: '0.72em',
            top: '-0.6em',
            animationDelay: '450ms',
            pointerEvents: 'none',
          }}
        >
          <svg
            width="18"
            height="18"
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
      </div>

      <p className="text-sm text-muted-foreground animate-pulse">{message}</p>
    </div>
  );
}
