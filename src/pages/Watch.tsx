import { useSearchParams, useNavigate } from 'react-router-dom';
import { useEffect, useRef, useState, useCallback } from 'react';
import { ArrowLeft, AlertCircle, RefreshCw, Volume2, VolumeX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { useFullscreenLandscape } from '@/hooks/useFullscreenLandscape';
import Hls from 'hls.js';

const STREAM_WORKER_ORIGIN = 'https://proxies-lake.vercel.app/stream';

/** Wrap any URL through the Vercel→CF Worker /proxy/ route to bypass ISP blocks */
function proxyUrl(url: string): string {
  return `${STREAM_WORKER_ORIGIN}/proxy/?url=${encodeURIComponent(url)}`;
}

/** Fetch the watch page HTML through the proxy and extract the direct video URL */
async function resolveDirectUrl(watchUrl: string): Promise<string> {
  let originalUrl = watchUrl;

  console.log('[Watch] Resolving direct URL from:', originalUrl);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);
  // Fetch through proxy to bypass ISP blocks
  const res = await fetch(proxyUrl(originalUrl), { signal: controller.signal });
  clearTimeout(timer);

  if (!res.ok) throw new Error('Could not fetch watch page');

  const html = await res.text();

  const srcMatch = html.match(/<source[^>]+src=["']([^"']+)["']/i)
    || html.match(/<video[^>]+src=["']([^"']+)["']/i);

  if (!srcMatch?.[1]) {
    throw new Error('Could not extract video source from watch page');
  }

  let realUrl = srcMatch[1];
  if (realUrl.startsWith('/')) {
    realUrl = STREAM_WORKER_ORIGIN + realUrl;
  }

  // Wrap the resolved video URL through the proxy too
  const proxied = proxyUrl(realUrl);
  console.log('[Watch] Resolved direct URL:', realUrl, '-> proxied:', proxied);
  return proxied;
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
  const [bufferPercent, setBufferPercent] = useState(0);
  const [muted, setMuted] = useState(false);
  const [showUnmute, setShowUnmute] = useState(false);

  const isWatchUrl = rawUrl.includes('/watch/');
  const directUrl = rawUrl.includes('/watch/') ? rawUrl.replace('/watch/', '/') : rawUrl;

  const goBack = useCallback(() => {
    if (window.history.length > 1) navigate(-1);
    else navigate('/');
  }, [navigate]);

  useEffect(() => {
    if (!rawUrl) navigate('/', { replace: true });
  }, [rawUrl, navigate]);

  useEffect(() => {
    if (!rawUrl) return;
    const video = videoRef.current;
    if (!video) return;

    let hls: Hls | null = null;
    let cancelled = false;

    const tryPlay = async (v: HTMLVideoElement) => {
      v.muted = false;
      try {
        await v.play();
        setMuted(false);
        setShowUnmute(false);
      } catch {
        // Autoplay with audio blocked — mute and retry
        v.muted = true;
        setMuted(true);
        setShowUnmute(true);
        try { await v.play(); } catch { /* will show error via event */ }
      }
    };

    const setupVideo = async () => {
      try {
        let videoSrc: string;

        if (isWatchUrl) {
          const timeoutPromise = new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error('Timed out resolving video URL')), 15000)
          );
          videoSrc = await Promise.race([resolveDirectUrl(rawUrl), timeoutPromise]);
          if (cancelled) return;
        } else {
          // Non-watch URLs also go through proxy
          videoSrc = proxyUrl(directUrl);
        }

        const srcIsHls = videoSrc.includes('.m3u8');

        if (srcIsHls) {
          if (Hls.isSupported()) {
            hls = new Hls({
              enableWorker: true,
              xhrSetup: (xhr, url) => {
                // Route HLS segment/playlist requests through the proxy
                const proxied = proxyUrl(url);
                xhr.open('GET', proxied, true);
              },
            });
            hls.loadSource(videoSrc);
            hls.attachMedia(video);
            hls.on(Hls.Events.MANIFEST_PARSED, () => {
              if (!cancelled) { setLoading(false); tryPlay(video); }
            });
            hls.on(Hls.Events.ERROR, (_, data) => {
              if (data.fatal && !cancelled) { setLoading(false); setError('Stream failed to load'); }
            });
          } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
            video.src = videoSrc;
            video.addEventListener('loadedmetadata', () => {
              if (!cancelled) { setLoading(false); tryPlay(video); }
            });
            video.addEventListener('error', () => {
              if (!cancelled) { setLoading(false); setError('Stream failed to load'); }
            });
          } else {
            setError('HLS not supported on this device');
            setLoading(false);
          }
        } else {
          video.src = videoSrc;
          video.addEventListener('loadedmetadata', () => {
            if (!cancelled) { setLoading(false); tryPlay(video); }
          });
          video.addEventListener('error', () => {
            if (!cancelled) { setLoading(false); setError('Video failed to load'); }
          });
          video.load();
        }
      } catch (err: any) {
        if (!cancelled) { setLoading(false); setError(err?.message || 'Failed to load video'); }
      }
    };

    setupVideo();

    const handleProgress = () => {
      if (!video || !video.duration) return;
      const len = video.buffered.length;
      if (len > 0) {
        const end = video.buffered.end(len - 1);
        setBufferPercent(Math.round((end / video.duration) * 100));
      }
    };
    video.addEventListener('progress', handleProgress);

    return () => {
      cancelled = true;
      video.removeEventListener('progress', handleProgress);
      if (hls) hls.destroy();
    };
  }, [rawUrl, isWatchUrl, directUrl]);

  if (!rawUrl) return null;

  const rotationStyle = needsCssRotation
    ? { position: 'fixed' as const, top: 0, left: 0, width: '100vh', height: '100vw', transform: 'rotate(90deg)', transformOrigin: 'top left', marginLeft: '100vw', zIndex: 9999 }
    : undefined;

  return (
    <div ref={containerRef} className="fixed inset-0 z-50 bg-black flex flex-col" style={rotationStyle}>
      <button onClick={goBack} className="absolute top-4 left-4 z-[60] bg-black/60 hover:bg-black/80 text-white rounded-full p-2 backdrop-blur-sm transition-colors" aria-label="Go back">
        <ArrowLeft className="w-6 h-6" />
      </button>

      {!loading && !error && bufferPercent > 0 && bufferPercent < 100 && (
        <div className="absolute top-0 left-0 right-0 z-[60] h-[3px] bg-white/10">
          <div className="h-full bg-primary transition-all duration-500 ease-out" style={{ width: `${bufferPercent}%` }} />
          <span className="absolute right-2 top-1 text-[10px] text-white/60 font-mono">{bufferPercent}%</span>
        </div>
      )}

      {loading && (
        <div className="absolute inset-0 z-[55] bg-black flex items-center justify-center">
          <LoadingSpinner message={`Loading ${title}...`} />
        </div>
      )}

      {error && (
        <div className="absolute inset-0 z-[55] bg-black flex flex-col items-center justify-center gap-4 px-6">
          <AlertCircle className="w-12 h-12 text-destructive" />
          <p className="text-foreground text-center text-lg">{error}</p>
          <div className="flex gap-3">
            <Button variant="outline" onClick={goBack}>Go Back</Button>
            <Button onClick={() => { setError(null); setLoading(true); window.location.reload(); }}>
              <RefreshCw className="w-4 h-4 mr-2" /> Retry
            </Button>
          </div>
        </div>
      )}

      {showUnmute && (
        <button
          onClick={() => {
            const video = videoRef.current;
            if (video) { video.muted = false; setMuted(false); setShowUnmute(false); }
          }}
          className="absolute bottom-20 left-1/2 -translate-x-1/2 z-[60] flex items-center gap-2 bg-primary text-primary-foreground px-5 py-3 rounded-full shadow-lg animate-pulse"
        >
          <VolumeX className="w-5 h-5" />
          <span className="text-sm font-medium">Tap to unmute</span>
        </button>
      )}

      {!error && (
        <video ref={videoRef} className="w-full h-full object-contain" controls playsInline controlsList="nodownload" />
      )}
    </div>
  );
}
