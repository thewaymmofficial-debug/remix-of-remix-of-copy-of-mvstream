import { useSearchParams, useNavigate } from 'react-router-dom';
import { useEffect, useRef, useState, useCallback } from 'react';
import { ArrowLeft, AlertCircle, RefreshCw, Wifi, Server, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { useFullscreenLandscape } from '@/hooks/useFullscreenLandscape';
import Hls from 'hls.js';

const STREAM_WORKER_ORIGIN = 'https://tw.thewayofthedragg.workers.dev';
// Relay on a separate CF account/domain to bypass ISP wildcard blocks

const PROXY_STREAM_ORIGIN = 'https://proxies-lake.vercel.app/stream';
const SUPABASE_PROXY = 'https://icnfjixjohbxjxqbnnac.supabase.co/functions/v1/download-proxy';

const TIER_TIMEOUT_MS = 6000;
const CACHE_KEY = 'preferredStreamTier';

type StreamTier = 'direct' | 'vercel' | 'supabase';

interface ResolvedUrls {
  directUrl: string;
  vercelUrl: string;
  supabaseUrl: string;
}

async function resolveVideoUrls(proxiedWatchUrl: string): Promise<ResolvedUrls> {
  console.log('[Watch] Resolving URLs from:', proxiedWatchUrl);
  const res = await fetch(proxiedWatchUrl);
  if (!res.ok) throw new Error(`Failed to fetch watch page: ${res.status}`);
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

  const decodedUrl = decodeURIComponent(realUrl);
  const vercelUrl = `${PROXY_STREAM_ORIGIN}?url=${encodeURIComponent(decodedUrl)}`;
  const supabaseUrl = `${SUPABASE_PROXY}?url=${encodeURIComponent(decodedUrl)}&stream=1`;

  console.log('[Watch] Resolved direct:', realUrl);
  console.log('[Watch] Resolved vercel:', vercelUrl);
  console.log('[Watch] Resolved supabase:', supabaseUrl);

  return { directUrl: realUrl, vercelUrl, supabaseUrl };
}

async function probeUrl(url: string, tierName: string, timeoutMs: number): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    const res = await fetch(url, { method: 'HEAD', mode: 'cors', signal: controller.signal });
    clearTimeout(timer);
    const ct = res.headers.get('content-type') || '';
    console.log(`[Watch] ${tierName} probe: status=${res.status} content-type=${ct}`);
    if (!res.ok) return false;
    // Accept video/*, application/octet-stream, or HLS
    if (ct.startsWith('video/') || ct.includes('octet-stream') || ct.includes('mpegurl')) return true;
    // Some proxies don't set content-type on HEAD — allow if 2xx
    return true;
  } catch (err: any) {
    console.log(`[Watch] ${tierName} probe FAILED: ${err?.message || err}`);
    return false;
  }
}

function tryDirectStream(video: HTMLVideoElement, url: string, tierName: string, timeoutMs = TIER_TIMEOUT_MS): Promise<boolean> {
  return new Promise(async (resolve) => {
    // Fast HTTP probe first
    const probeOk = await probeUrl(url, tierName, Math.min(timeoutMs, 4000));
    if (!probeOk) {
      resolve(false);
      return;
    }

    let settled = false;
    const startTime = Date.now();
    const settle = (result: boolean, reason: string) => {
      if (settled) return;
      settled = true;
      const elapsed = Date.now() - startTime;
      clearTimeout(timer);
      video.removeEventListener('loadedmetadata', onMeta);
      video.removeEventListener('error', onError);
      if (result) {
        console.log(`[Watch] ${tierName} OK after ${elapsed}ms`);
      } else {
        console.log(`[Watch] ${tierName} FAILED: ${reason} after ${elapsed}ms`);
      }
      resolve(result);
    };

    const onMeta = () => settle(true, '');
    const onError = () => {
      const code = video.error?.code;
      const msg = video.error?.message || '';
      const errorNames: Record<number, string> = {
        1: 'MEDIA_ERR_ABORTED',
        2: 'MEDIA_ERR_NETWORK',
        3: 'MEDIA_ERR_DECODE',
        4: 'MEDIA_ERR_SRC_NOT_SUPPORTED',
      };
      settle(false, `error code=${code} (${errorNames[code || 0] || 'UNKNOWN'}) ${msg}`);
    };
    const timer = setTimeout(() => {
      settle(false, `timed out after ${timeoutMs}ms`);
    }, timeoutMs);

    video.addEventListener('loadedmetadata', onMeta);
    video.addEventListener('error', onError);
    video.src = url;
    video.load();
  });
}

function getCachedTier(): StreamTier | null {
  try {
    const cached = sessionStorage.getItem(CACHE_KEY) as StreamTier | null;
    if (cached && ['direct', 'vercel', 'supabase'].includes(cached)) {
      return cached;
    }
  } catch {}
  return null;
}

function setCachedTier(tier: StreamTier) {
  try { sessionStorage.setItem(CACHE_KEY, tier); } catch {}
}

function clearCachedTier() {
  try { sessionStorage.removeItem(CACHE_KEY); } catch {}
}

const TIER_CONFIG: Record<StreamTier, { label: string; color: string; icon: typeof Wifi }> = {
  direct:   { label: 'Direct',   color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30', icon: Wifi },
  vercel:   { label: 'Vercel',   color: 'bg-purple-500/20 text-purple-300 border-purple-500/30',    icon: Server },
  supabase: { label: 'Proxy',    color: 'bg-amber-500/20 text-amber-300 border-amber-500/30',       icon: Shield },
};

function getTierUrl(tier: StreamTier, urls: ResolvedUrls): string {
  const map: Record<StreamTier, string> = {
    direct: urls.directUrl,
    vercel: urls.vercelUrl,
    supabase: urls.supabaseUrl,
  };
  return map[tier];
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
  const [streamSource, setStreamSource] = useState<StreamTier | null>(null);
  const [showSourceBadge, setShowSourceBadge] = useState(false);
  const sourceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

    const playAndFinish = (tier: StreamTier) => {
      if (cancelled) return;
      console.log(`[Watch] Playing via ${tier}`);
      setCachedTier(tier);
      setStreamSource(tier);
      setShowSourceBadge(true);
      setLoading(false);
      video.play().catch(() => {});
    };

    const runCascade = async (urls: ResolvedUrls, skipTiers: StreamTier[] = []): Promise<boolean> => {
      const allTiers: StreamTier[] = ['direct', 'vercel', 'supabase'];
      for (const tier of allTiers) {
        if (cancelled) return false;
        if (skipTiers.includes(tier)) continue;

        const url = getTierUrl(tier, urls);

        if (tier === 'supabase') {
          // Last resort — don't test, just use it
          console.log('[Watch] Using supabase proxy (last resort)');
          video.src = url;
          video.load();
          playAndFinish('supabase');
          return true;
        }

        console.log(`[Watch] Trying ${tier}:`, url);
        const ok = await tryDirectStream(video, url, tier);
        if (cancelled) return false;
        if (ok) {
          playAndFinish(tier);
          return true;
        }
      }
      return false;
    };

    const setupVideo = async () => {
      try {
        let videoSrc: string | undefined;

        if (isWatchUrl) {
          const timeoutPromise = new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error('Timed out resolving video URL')), 15000)
          );
          const urls = await Promise.race([resolveVideoUrls(rawUrl), timeoutPromise]);
          if (cancelled) return;

          const srcIsHls = urls.directUrl.includes('.m3u8');

          if (!srcIsHls) {
            // Check sessionStorage for a cached working tier
            const cachedTier = getCachedTier();
            if (cachedTier && cachedTier !== 'supabase') {
              const cachedUrl = getTierUrl(cachedTier, urls);
              console.log(`[Watch] Trying cached tier "${cachedTier}":`, cachedUrl);
              const ok = await tryDirectStream(video, cachedUrl, `cached:${cachedTier}`);
              if (cancelled) return;
              if (ok) {
                playAndFinish(cachedTier);
                return;
              }
              console.log('[Watch] Cached tier failed, clearing cache and running full cascade');
              clearCachedTier();
            }

            const success = await runCascade(urls);
            if (!success && !cancelled) {
              setLoading(false);
              setError('All streaming sources failed');
            }
            return;
          } else {
            // HLS — go straight to supabase proxy
            videoSrc = urls.supabaseUrl;
            setStreamSource('supabase');
            setShowSourceBadge(true);
          }
        } else {
          videoSrc = directUrl;
        }

        if (cancelled || !videoSrc) return;

        const srcIsHls = videoSrc.includes('.m3u8');

        if (srcIsHls) {
          if (Hls.isSupported()) {
            hls = new Hls({ enableWorker: true });
            hls.loadSource(videoSrc);
            hls.attachMedia(video);
            hls.on(Hls.Events.MANIFEST_PARSED, () => {
              if (!cancelled) { setLoading(false); video.play().catch(() => {}); }
            });
            hls.on(Hls.Events.ERROR, (_, data) => {
              if (data.fatal && !cancelled) { setLoading(false); setError('Stream failed to load'); }
            });
          } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
            video.src = videoSrc;
            video.addEventListener('loadedmetadata', () => {
              if (!cancelled) { setLoading(false); video.play().catch(() => {}); }
            });
          } else {
            setError('HLS not supported on this device');
            setLoading(false);
          }
        } else {
          video.src = videoSrc;
          video.addEventListener('loadedmetadata', () => { if (!cancelled) setLoading(false); });
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

    sourceTimerRef.current = setTimeout(() => setShowSourceBadge(false), 5000);

    return () => {
      cancelled = true;
      video.removeEventListener('progress', handleProgress);
      if (hls) hls.destroy();
      if (sourceTimerRef.current) clearTimeout(sourceTimerRef.current);
    };
  }, [rawUrl, isWatchUrl, directUrl]);

  if (!rawUrl) return null;

  const rotationStyle = needsCssRotation
    ? { position: 'fixed' as const, top: 0, left: 0, width: '100vh', height: '100vw', transform: 'rotate(90deg)', transformOrigin: 'top left', marginLeft: '100vw', zIndex: 9999 }
    : undefined;

  const tierInfo = streamSource ? TIER_CONFIG[streamSource] : null;

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

      {showSourceBadge && tierInfo && !loading && !error && (
        <div className={`absolute top-4 right-4 z-[60] flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium backdrop-blur-md transition-opacity duration-700 border ${tierInfo.color}`}>
          <tierInfo.icon className="w-3 h-3" /> {tierInfo.label}
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
            <Button onClick={() => { clearCachedTier(); setError(null); setLoading(true); window.location.reload(); }}>
              <RefreshCw className="w-4 h-4 mr-2" /> Retry
            </Button>
          </div>
        </div>
      )}

      {!error && (
        <video ref={videoRef} className="w-full h-full object-contain" controls autoPlay playsInline controlsList="nodownload" />
      )}
    </div>
  );
}
