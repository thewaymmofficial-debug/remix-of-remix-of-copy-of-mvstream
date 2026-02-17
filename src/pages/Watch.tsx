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

  const url = searchParams.get('url') || '';
  const title = searchParams.get('title') || 'Video';

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Determine player type - /watch/ URLs are streaming server pages (HTML player)
  const isStreamingServer = url.includes('/watch/');
  const isHls = !isStreamingServer && url.includes('.m3u8');
  const isDirectVideo = !isStreamingServer && (url.includes('.mp4') || url.includes('.webm') || url.includes('.mkv'));

  const goBack = useCallback(() => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/');
    }
  }, [navigate]);

  // Redirect if no URL
  useEffect(() => {
    if (!url) {
      navigate('/', { replace: true });
    }
  }, [url, navigate]);

  // HLS / direct video setup
  useEffect(() => {
    if (isStreamingServer || !url) return;

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
        // Native HLS (Safari/iOS)
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
      // Direct mp4/webm
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
  }, [url, isStreamingServer, isHls]);

  // Iframe load timeout
  useEffect(() => {
    if (!isStreamingServer || !url) return;

    const timeout = setTimeout(() => {
      if (loading) {
        setLoading(false); // Just hide spinner, iframe may still be loading
      }
    }, 15000);

    return () => clearTimeout(timeout);
  }, [isStreamingServer, url, loading]);

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
          <AlertCircle className="w-12 h-12 text-red-500" />
          <p className="text-white text-center text-lg">{error}</p>
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

      {/* Player content */}
      {!error && isStreamingServer && (
        <iframe
          src={url}
          className="w-full h-full border-0"
          allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
          allowFullScreen
          onLoad={() => setLoading(false)}
          sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
        />
      )}

      {!error && !isStreamingServer && (
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
