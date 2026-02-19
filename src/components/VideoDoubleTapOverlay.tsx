import { useRef, useState, useCallback } from 'react';
import { RotateCcw, RotateCw, Play, Pause } from 'lucide-react';

interface VideoDoubleTapOverlayProps {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  skipSeconds?: number;
}

export function VideoDoubleTapOverlay({ videoRef, skipSeconds = 10 }: VideoDoubleTapOverlayProps) {
  const [ripple, setRipple] = useState<'left' | 'right' | null>(null);
  const [showControls, setShowControls] = useState(false);
  const [paused, setPaused] = useState(false);
  const lastTapRef = useRef<{ time: number; side: 'left' | 'right' }>({ time: 0, side: 'left' });
  const rippleTimer = useRef<ReturnType<typeof setTimeout>>();
  const hideTimer = useRef<ReturnType<typeof setTimeout>>();

  const showControlsOverlay = useCallback(() => {
    setShowControls(true);
    setPaused(videoRef.current?.paused ?? false);
    clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => setShowControls(false), 3500);
  }, [videoRef]);

  const handleSkip = useCallback((side: 'left' | 'right') => {
    const video = videoRef.current;
    if (!video) return;
    const delta = side === 'right' ? skipSeconds : -skipSeconds;
    const targetTime = Math.max(0, video.currentTime + delta);
    const clampedTime = isFinite(video.duration) ? Math.min(video.duration, targetTime) : targetTime;
    try { video.currentTime = clampedTime; } catch {}

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
      // Double tap — skip
      e.preventDefault();
      e.stopPropagation();
      handleSkip(side);
      lastTapRef.current = { time: 0, side };
    } else {
      // Single tap — show/hide controls overlay
      e.preventDefault();
      e.stopPropagation();
      lastTapRef.current = { time: now, side };
      setTimeout(() => {
        // Only fire if no second tap came
        if (lastTapRef.current.time === now) {
          if (showControls) {
            setShowControls(false);
            clearTimeout(hideTimer.current);
          } else {
            showControlsOverlay();
          }
        }
      }, 300);
    }
  }, [handleSkip, showControls, showControlsOverlay]);

  const handleDoubleClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const side: 'left' | 'right' = x < rect.width / 2 ? 'left' : 'right';
    handleSkip(side);
  }, [handleSkip]);

  const handleClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    // For desktop: single click toggles controls
    if (showControls) {
      setShowControls(false);
      clearTimeout(hideTimer.current);
    } else {
      showControlsOverlay();
    }
  }, [showControls, showControlsOverlay]);

  const togglePlayPause = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) { video.play(); setPaused(false); }
    else { video.pause(); setPaused(true); }
    showControlsOverlay();
  }, [videoRef, showControlsOverlay]);

  const onSkipButton = useCallback((side: 'left' | 'right') => {
    handleSkip(side);
    showControlsOverlay();
  }, [handleSkip, showControlsOverlay]);

  return (
    <>
      {/* Tap detection zone — excludes bottom 56px for native video controls */}
      <div
        className="absolute inset-0 z-[58]"
        style={{ bottom: '56px' }}
        onTouchStart={handleTouchStart}
        onDoubleClick={handleDoubleClick}
        onClick={handleClick}
      />

      {/* Controls overlay — shown on single tap */}
      {showControls && (
        <div className="absolute inset-0 z-[59] flex items-center justify-center pointer-events-none" style={{ bottom: '56px' }}>
          <div className="bg-black/40 absolute inset-0" />
          <div className="relative flex items-center gap-12 pointer-events-auto">
            <button
              onClick={() => onSkipButton('left')}
              className="bg-black/50 backdrop-blur-sm rounded-full p-4 active:scale-90 transition-transform"
              aria-label="Rewind 10 seconds"
            >
              <RotateCcw className="w-8 h-8 text-white" />
              <span className="text-white text-xs font-semibold block mt-0.5">{skipSeconds}s</span>
            </button>

            <button
              onClick={togglePlayPause}
              className="bg-black/50 backdrop-blur-sm rounded-full p-5 active:scale-90 transition-transform"
              aria-label={paused ? 'Play' : 'Pause'}
            >
              {paused
                ? <Play className="w-10 h-10 text-white" />
                : <Pause className="w-10 h-10 text-white" />
              }
            </button>

            <button
              onClick={() => onSkipButton('right')}
              className="bg-black/50 backdrop-blur-sm rounded-full p-4 active:scale-90 transition-transform"
              aria-label="Forward 10 seconds"
            >
              <RotateCw className="w-8 h-8 text-white" />
              <span className="text-white text-xs font-semibold block mt-0.5">{skipSeconds}s</span>
            </button>
          </div>
        </div>
      )}

      {/* Double-tap ripple feedback */}
      {ripple === 'left' && (
        <div className="absolute left-0 top-0 w-1/2 h-full flex items-center justify-center pointer-events-none z-[60] animate-fade-in">
          <div className="bg-black/50 backdrop-blur-sm rounded-full p-5 flex flex-col items-center gap-1">
            <RotateCcw className="w-9 h-9 text-white" />
            <span className="text-white text-sm font-semibold">{skipSeconds}s</span>
          </div>
        </div>
      )}
      {ripple === 'right' && (
        <div className="absolute right-0 top-0 w-1/2 h-full flex items-center justify-center pointer-events-none z-[60] animate-fade-in">
          <div className="bg-black/50 backdrop-blur-sm rounded-full p-5 flex flex-col items-center gap-1">
            <RotateCw className="w-9 h-9 text-white" />
            <span className="text-white text-sm font-semibold">{skipSeconds}s</span>
          </div>
        </div>
      )}
    </>
  );
}
