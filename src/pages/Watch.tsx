import { useSearchParams, useNavigate } from 'react-router-dom';
import { useEffect, useRef, useState, useCallback } from 'react';
import { ArrowLeft, AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { useFullscreenLandscape } from '@/hooks/useFullscreenLandscape';
import Hls from 'hls.js';

export default function Watch() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const { needsCssRotation } = useFullscreenLandscape(containerRef);

  const rawUrl = searchParams.get('url') || '';
  const title = searchParams.get('title') || 'Video';

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Convert streaming server URLs (/watch/ID/file) to direct file URLs (/ID/file)
  // The /watch/ path returns an HTML player page; without it we get the raw video file
  const url = rawUrl.includes('/watch/')
    ? rawUrl.replace('/watch/', '/')
    : rawUrl;

  const isHls = url.includes('.m3u8');

  const goBack = useCallback(() => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/');
    }
  }, [navigate]);

  // Redirect if no URL
  useEffect(() => {
    if (!rawUrl) {
      navigate('/', { replace: true });
    }
  }, [rawUrl, navigate]);

  // HLS / direct video setup
  useEffect(() => {
    if (!url) return;

    const video = videoRef.current;
    if (!video) return;

    let hls: Hls | null = null;

    if (isHls) {
      if (Hls.isSupported()) {
        hls = new Hls({ enableWorker: true });
        hls.loadSource(url);
        hls.attachMedia(video);
        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          setLoading(false);
          video.play().catch(() => {});
        });
        hls.on(Hls.Events.ERROR, (_, data) => {
          if (data.fatal) {
            setLoading(false);
            setError('Stream failed to load');
          }
        });
      } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = url;
        video.addEventListener('loadedmetadata', () => {
          setLoading(false);
          video.play().catch(() => {});
        });
      } else {
        setError('HLS not supported on this device');
        setLoading(false);
      }
    } else {
      // Direct video (mp4/webm/mkv)
      video.src = url;
      video.addEventListener('loadedmetadata', () => setLoading(false));
      video.addEventListener('error', () => {
        setLoading(false);
        setError('Video failed to load');
      });
      video.load();
    }

    return () => {
      if (hls) {
        hls.destroy();
      }
    };
  }, [url, isHls]);

  if (!url) return null;

  const rotationStyle = needsCssRotation
    ? {
        position: 'fixed' as const,
        top: 0, left: 0,
        width: '100vh',
        height: '100vw',
        transform: 'rotate(90deg)',
        transformOrigin: 'top left',
        marginLeft: '100vw',
        zIndex: 9999,
      }
    : undefined;

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-50 bg-black flex flex-col"
      style={rotationStyle}
    >
      {/* Back button */}
      <button
        onClick={goBack}
        className="absolute top-4 left-4 z-[60] bg-black/60 hover:bg-black/80 text-white rounded-full p-2 backdrop-blur-sm transition-colors"
        aria-label="Go back"
      >
        <ArrowLeft className="w-6 h-6" />
      </button>

      {/* Loading overlay */}
      {loading && (
        <div className="absolute inset-0 z-[55] bg-black flex items-center justify-center">
          <LoadingSpinner message={`Loading ${title}...`} />
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="absolute inset-0 z-[55] bg-black flex flex-col items-center justify-center gap-4 px-6">
          <AlertCircle className="w-12 h-12 text-destructive" />
          <p className="text-foreground text-center text-lg">{error}</p>
          <div className="flex gap-3">
            <Button variant="outline" onClick={goBack}>
              Go Back
            </Button>
            <Button onClick={() => { setError(null); setLoading(true); window.location.reload(); }}>
              <RefreshCw className="w-4 h-4 mr-2" /> Retry
            </Button>
          </div>
        </div>
      )}

      {/* Native video player for all sources */}
      {!error && (
        <video
          ref={videoRef}
          className="w-full h-full object-contain"
          controls
          autoPlay
          playsInline
          controlsList="nodownload"
        />
      )}
    </div>
  );
}
