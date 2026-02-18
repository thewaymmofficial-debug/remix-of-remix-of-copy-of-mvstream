import { useSearchParams, useNavigate } from 'react-router-dom';
import { useEffect, useRef, useState, useCallback } from 'react';
import { ArrowLeft, AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { useFullscreenLandscape } from '@/hooks/useFullscreenLandscape';
import { proxyStreamUrl } from '@/lib/utils';
import Hls from 'hls.js';

const STREAM_WORKER_ORIGIN = 'https://tw.thewayofthedragg.workers.dev';
const PROXY_STREAM_ORIGIN = 'https://proxies-lake.vercel.app/stream';

/**
 * Given a proxied `/watch/` URL, fetch its HTML page and extract the real
 * `<source src="...">` video URL, then return it proxied through Vercel.
 */
async function resolveRealVideoUrl(proxiedWatchUrl: string): Promise<string> {
  const res = await fetch(proxiedWatchUrl);
  if (!res.ok) throw new Error(`Failed to fetch watch page: ${res.status}`);
  const html = await res.text();

  // Extract src from <source src="..."> or <video src="...">
  const srcMatch = html.match(/<source[^>]+src=["']([^"']+)["']/i)
    || html.match(/<video[^>]+src=["']([^"']+)["']/i);

  if (!srcMatch?.[1]) {
    throw new Error('Could not extract video source from watch page');
  }

  let realUrl = srcMatch[1];

  // The extracted URL might be relative or absolute.
  // If it points to the worker origin, proxy it.
  if (realUrl.startsWith('/')) {
    // Relative URL — prepend proxy origin
    realUrl = PROXY_STREAM_ORIGIN + realUrl;
  } else if (realUrl.includes(STREAM_WORKER_ORIGIN.replace('https://', ''))) {
    // Absolute URL pointing to the worker — rewrite through proxy
    realUrl = proxyStreamUrl(realUrl);
  }

  return realUrl;
}

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

  const isWatchUrl = rawUrl.includes('/watch/');

  // For non-watch URLs, strip /watch/ as before (backward compat for edge cases)
  const directUrl = rawUrl.includes('/watch/')
    ? rawUrl.replace('/watch/', '/')
    : rawUrl;

  const isHls = directUrl.includes('.m3u8');

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
    if (!rawUrl) return;

    const video = videoRef.current;
    if (!video) return;

    let hls: Hls | null = null;
    let cancelled = false;

    const setupVideo = async () => {
      try {
        let videoSrc: string;

        if (isWatchUrl) {
          // Fetch the /watch/ HTML page to get the real video URL
          const timeoutPromise = new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error('Timed out resolving video URL')), 15000)
          );
          videoSrc = await Promise.race([
            resolveRealVideoUrl(rawUrl),
            timeoutPromise,
          ]);
        } else {
          videoSrc = directUrl;
        }

        if (cancelled) return;

        const srcIsHls = videoSrc.includes('.m3u8');

        if (srcIsHls) {
          if (Hls.isSupported()) {
            hls = new Hls({ enableWorker: true });
            hls.loadSource(videoSrc);
            hls.attachMedia(video);
            hls.on(Hls.Events.MANIFEST_PARSED, () => {
              if (!cancelled) {
                setLoading(false);
                video.play().catch(() => {});
              }
            });
            hls.on(Hls.Events.ERROR, (_, data) => {
              if (data.fatal && !cancelled) {
                setLoading(false);
                setError('Stream failed to load');
              }
            });
          } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
            video.src = videoSrc;
            video.addEventListener('loadedmetadata', () => {
              if (!cancelled) {
                setLoading(false);
                video.play().catch(() => {});
              }
            });
          } else {
            setError('HLS not supported on this device');
            setLoading(false);
          }
        } else {
          // Direct video (mp4/webm/mkv)
          video.src = videoSrc;
          video.addEventListener('loadedmetadata', () => {
            if (!cancelled) setLoading(false);
          });
          video.addEventListener('error', () => {
            if (!cancelled) {
              setLoading(false);
              setError('Video failed to load');
            }
          });
          video.load();
        }
      } catch (err: any) {
        if (!cancelled) {
          setLoading(false);
          setError(err?.message || 'Failed to load video');
        }
      }
    };

    setupVideo();

    return () => {
      cancelled = true;
      if (hls) {
        hls.destroy();
      }
    };
  }, [rawUrl, isWatchUrl, directUrl]);

  if (!rawUrl) return null;

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
