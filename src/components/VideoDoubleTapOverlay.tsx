import { useRef, useState, useCallback, useEffect } from 'react';
import { RotateCcw, RotateCw } from 'lucide-react';

interface VideoDoubleTapOverlayProps {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  skipSeconds?: number;
}

export function VideoDoubleTapOverlay({ videoRef, skipSeconds = 10 }: VideoDoubleTapOverlayProps) {
  const [ripple, setRipple] = useState<'left' | 'right' | null>(null);
  const lastTapRef = useRef<{ time: number; side: 'left' | 'right' }>({ time: 0, side: 'left' });
  const singleTapTimer = useRef<ReturnType<typeof setTimeout>>();
  const rippleTimer = useRef<ReturnType<typeof setTimeout>>();

  const handleSkip = useCallback((side: 'left' | 'right') => {
    const video = videoRef.current;
    if (!video) return;

    const delta = side === 'right' ? skipSeconds : -skipSeconds;
    const duration = video.duration;
    
    // If duration is not available, try to seek anyway
    const targetTime = Math.max(0, video.currentTime + delta);
    const clampedTime = isFinite(duration) ? Math.min(duration, targetTime) : targetTime;

    console.log(`[Skip] ${side} ${delta}s: ${video.currentTime.toFixed(1)} -> ${clampedTime.toFixed(1)} (duration: ${duration})`);
    
    try {
      video.currentTime = clampedTime;
    } catch (e) {
      console.warn('[Skip] Failed to set currentTime:', e);
    }

    setRipple(side);
    clearTimeout(rippleTimer.current);
    rippleTimer.current = setTimeout(() => setRipple(null), 700);
  }, [videoRef, skipSeconds]);

  const handleTouchStart = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length > 1) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.touches[0].clientX - rect.left;
    const side: 'left' | 'right' = x < rect.width / 2 ? 'left' : 'right';
    const now = Date.now();
    const prev = lastTapRef.current;

    if (now - prev.time < 350 && prev.side === side) {
      // Double tap detected — skip
      e.preventDefault();
      e.stopPropagation();
      clearTimeout(singleTapTimer.current);
      handleSkip(side);
      lastTapRef.current = { time: 0, side };
    } else {
      lastTapRef.current = { time: now, side };
      // Let single taps pass through to toggle native controls
    }
  }, [handleSkip]);

  const handleDoubleClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const side: 'left' | 'right' = x < rect.width / 2 ? 'left' : 'right';
    handleSkip(side);
  }, [handleSkip]);

  return (
    <>
      {/* Tap detection zone — excludes bottom 56px for native video controls */}
      <div
        className="absolute inset-0 z-[58]"
        style={{ bottom: '56px' }}
        onTouchStart={handleTouchStart}
        onDoubleClick={handleDoubleClick}
      />

      {/* Left ripple feedback */}
      {ripple === 'left' && (
        <div className="absolute left-0 top-0 w-1/2 h-full flex items-center justify-center pointer-events-none z-[59] animate-fade-in">
          <div className="bg-black/50 backdrop-blur-sm rounded-full p-5 flex flex-col items-center gap-1">
            <RotateCcw className="w-9 h-9 text-white" />
            <span className="text-white text-sm font-semibold">{skipSeconds}s</span>
          </div>
        </div>
      )}

      {/* Right ripple feedback */}
      {ripple === 'right' && (
        <div className="absolute right-0 top-0 w-1/2 h-full flex items-center justify-center pointer-events-none z-[59] animate-fade-in">
          <div className="bg-black/50 backdrop-blur-sm rounded-full p-5 flex flex-col items-center gap-1">
            <RotateCw className="w-9 h-9 text-white" />
            <span className="text-white text-sm font-semibold">{skipSeconds}s</span>
          </div>
        </div>
      )}
    </>
  );
}
