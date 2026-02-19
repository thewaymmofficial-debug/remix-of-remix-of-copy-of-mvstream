import { useRef, useState, useCallback } from 'react';
import { RotateCcw, RotateCw } from 'lucide-react';

interface VideoDoubleTapOverlayProps {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  skipSeconds?: number;
}

export function VideoDoubleTapOverlay({ videoRef, skipSeconds = 10 }: VideoDoubleTapOverlayProps) {
  const [ripple, setRipple] = useState<'left' | 'right' | null>(null);
  const lastTapRef = useRef<{ time: number; side: 'left' | 'right' }>({ time: 0, side: 'left' });
  const rippleTimer = useRef<ReturnType<typeof setTimeout>>();

  const handleSkip = useCallback((side: 'left' | 'right') => {
    const video = videoRef.current;
    if (!video || !isFinite(video.duration)) return;

    const delta = side === 'right' ? skipSeconds : -skipSeconds;
    video.currentTime = Math.max(0, Math.min(video.duration, video.currentTime + delta));

    setRipple(side);
    clearTimeout(rippleTimer.current);
    rippleTimer.current = setTimeout(() => setRipple(null), 600);
  }, [videoRef, skipSeconds]);

  const handleTap = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
    // Only handle single-finger taps
    if (e.touches.length > 1) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.touches[0].clientX - rect.left;
    const side: 'left' | 'right' = x < rect.width / 2 ? 'left' : 'right';
    const now = Date.now();
    const prev = lastTapRef.current;

    if (now - prev.time < 350 && prev.side === side) {
      // Double tap detected
      e.preventDefault();
      handleSkip(side);
      lastTapRef.current = { time: 0, side };
    } else {
      lastTapRef.current = { time: now, side };
    }
  }, [handleSkip]);

  // Also support desktop double-click on left/right halves
  const handleDoubleClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const side: 'left' | 'right' = x < rect.width / 2 ? 'left' : 'right';
    handleSkip(side);
  }, [handleSkip]);

  return (
    <div
      className="absolute inset-0 z-[58]"
      onTouchStart={handleTap}
      onDoubleClick={handleDoubleClick}
    >
      {/* Left ripple */}
      {ripple === 'left' && (
        <div className="absolute left-0 top-0 w-1/2 h-full flex items-center justify-center pointer-events-none animate-fade-in">
          <div className="bg-black/40 backdrop-blur-sm rounded-full p-4 flex flex-col items-center gap-1">
            <RotateCcw className="w-8 h-8 text-white" />
            <span className="text-white text-xs font-medium">{skipSeconds}s</span>
          </div>
        </div>
      )}

      {/* Right ripple */}
      {ripple === 'right' && (
        <div className="absolute right-0 top-0 w-1/2 h-full flex items-center justify-center pointer-events-none animate-fade-in">
          <div className="bg-black/40 backdrop-blur-sm rounded-full p-4 flex flex-col items-center gap-1">
            <RotateCw className="w-8 h-8 text-white" />
            <span className="text-white text-xs font-medium">{skipSeconds}s</span>
          </div>
        </div>
      )}
    </div>
  );
}
