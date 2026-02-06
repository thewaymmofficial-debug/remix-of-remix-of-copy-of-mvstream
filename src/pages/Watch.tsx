import { useSearchParams, useNavigate } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useFullscreenLandscape } from '@/hooks/useFullscreenLandscape';

export default function Watch() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showControls, setShowControls] = useState(true);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const url = searchParams.get('url') || '';
  const title = searchParams.get('title') || 'Video';

  const { needsCssRotation } = useFullscreenLandscape(containerRef);

  useEffect(() => {
    if (!url) {
      navigate('/', { replace: true });
    }
  }, [url, navigate]);

  // Auto-hide controls after 3 seconds
  useEffect(() => {
    const hideControls = () => {
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
      }, 3000);
    };

    hideControls();

    return () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, []);

  const handleTap = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    controlsTimeoutRef.current = setTimeout(() => {
      setShowControls(false);
    }, 3000);
  };

  if (!url) return null;

  const rotationStyle = needsCssRotation
    ? {
        transform: 'rotate(90deg)',
        transformOrigin: 'top left',
        width: '100vh',
        height: '100vw',
        top: 0,
        left: '100vw',
        position: 'fixed' as const,
      }
    : {};

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-50 bg-black"
      style={rotationStyle}
      onClick={handleTap}
    >
      {/* Loading spinner */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center z-20">
          <Loader2 className="w-10 h-10 text-white animate-spin" />
        </div>
      )}

      {/* Back button */}
      <Button
        variant="ghost"
        size="icon"
        className={`absolute top-4 left-4 z-30 text-white bg-black/40 hover:bg-black/60 backdrop-blur-sm rounded-full transition-opacity ${
          showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={(e) => {
          e.stopPropagation();
          navigate(-1);
        }}
      >
        <ArrowLeft className="w-5 h-5" />
      </Button>

      {/* Title */}
      <div
        className={`absolute top-4 left-16 z-30 transition-opacity ${
          showControls ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <h3 className="text-white text-sm font-medium truncate max-w-[60vw]">
          {title}
        </h3>
      </div>

      {/* Iframe - loads the streaming server's own player */}
      <iframe
        src={url}
        className="w-full h-full border-0"
        allow="autoplay; fullscreen; encrypted-media"
        allowFullScreen
        onLoad={() => setIsLoading(false)}
        title={title}
      />
    </div>
  );
}
