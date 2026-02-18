import { useSearchParams, useNavigate } from 'react-router-dom';
import { useEffect, useRef, useState, useCallback } from 'react';
import { ArrowLeft, AlertCircle, RefreshCw, Wifi, Shield, Cloud } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { useFullscreenLandscape } from '@/hooks/useFullscreenLandscape';
import Hls from 'hls.js';

const STREAM_WORKER_ORIGIN = 'https://tw.thewayofthedragg.workers.dev';
const SUPABASE_PROXY = 'https://icnfjixjohbxjxqbnnac.supabase.co/functions/v1/download-proxy';

const TIER_TIMEOUT_MS = 6000;
const CACHE_KEY = 'preferredStreamTier';

type StreamTier = 'direct' | 'cfproxy' | 'supabase';

interface ResolvedUrls {
  directUrl: string;
  cfProxyUrl: string;
  supabaseUrl: string;
}

/** Reverse any proxy rewriting to get the original CF worker URL */
function getOriginalWorkerUrl(url: string): string {
  if (url.includes('proxies-lake.vercel.app/stream')) {
    return url.replace('https://proxies-lake.vercel.app/stream', STREAM_WORKER_ORIGIN);
  }
  return url;
}

async function resolveVideoUrls(proxiedWatchUrl: string): Promise<ResolvedUrls> {
  const originalUrl = getOriginalWorkerUrl(proxiedWatchUrl);
  console.log('[Watch] Resolving URLs from:', originalUrl);

  const fetchSources = [
    { name: 'supabase', url: `${SUPABASE_PROXY}?url=${encodeURIComponent(originalUrl)}` },
    { name: 'direct', url: originalUrl },
  ];

  let html: string | null = null;
  for (const source of fetchSources) {
    try {
      console.log(`[Watch] Fetching HTML via ${source.name}`);
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 8000);
      const res = await fetch(source.url, { signal: controller.signal });
      clearTimeout(timer);
      if (res.ok) {
        html = await res.text();
        console.log(`[Watch] Got HTML via ${source.name}`);
        break;
      }
      console.log(`[Watch] ${source.name} returned ${res.status}`);
    } catch (err: any) {
      console.log(`[Watch] ${source.name} fetch failed: ${err?.message || err}`);
    }
  }

  if (!html) {
    throw new Error('Could not fetch watch page from any source');
  }

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
  const cfProxyUrl = `${STREAM_WORKER_ORIGIN}/proxy/?url=${encodeURIComponent(decodedUrl)}`;
  const supabaseUrl = `${SUPABASE_PROXY}?url=${encodeURIComponent(decodedUrl)}&stream=1`;

  console.log('[Watch] Resolved direct:', realUrl);
  console.log('[Watch] Resolved cfproxy:', cfProxyUrl);
  console.log('[Watch] Resolved supabase:', supabaseUrl);

  return { directUrl: realUrl, cfProxyUrl, supabaseUrl };
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
    return true;
  } catch (err: any) {
    console.log(`[Watch] ${tierName} probe FAILED: ${err?.message || err}`);
    return false;
  }
}

function tryDirectStream(video: HTMLVideoElement, url: string, tierName: string, timeoutMs = TIER_TIMEOUT_MS): Promise<boolean> {
  return new Promise((resolve) => {
    let settled = false;
    const startTime = Date.now();
    const settle = (result: boolean, reason: string) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      video.removeEventListener('loadedmetadata', onMeta);
      video.removeEventListener('error', onError);
      const elapsed = Date.now() - startTime;
      console.log(`[Watch] ${tierName} ${result ? 'OK' : 'FAILED: ' + reason} after ${elapsed}ms`);
      resolve(result);
    };

    const onMeta = () => settle(true, '');
    const onError = () => {
      const code = video.error?.code;
      const msg = video.error?.message || '';
      const errorNames: Record<number, string> = { 1: 'MEDIA_ERR_ABORTED', 2: 'MEDIA_ERR_NETWORK', 3: 'MEDIA_ERR_DECODE', 4: 'MEDIA_ERR_SRC_NOT_SUPPORTED' };
      settle(false, `error code=${code} (${errorNames[code || 0] || 'UNKNOWN'}) ${msg}`);
    };
    const timer = setTimeout(() => settle(false, `timed out after ${timeoutMs}ms`), timeoutMs);

    video.addEventListener('loadedmetadata', onMeta);
    video.addEventListener('error', onError);
    video.src = url;
    video.load();
  });
}

function getCachedTier(): StreamTier | null {
  try {
    const cached = sessionStorage.getItem(CACHE_KEY) as StreamTier | null;
    if (cached && ['direct', 'cfproxy', 'supabase'].includes(cached)) return cached;
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
  cfproxy:  { label: 'CF Proxy', color: 'bg-blue-500/20 text-blue-300 border-blue-500/30',         icon: Cloud },
  supabase: { label: 'Proxy',    color: 'bg-amber-500/20 text-amber-300 border-amber-500/30',      icon: Shield },
};

function getTierUrl(tier: StreamTier, urls: ResolvedUrls): string {
  if (tier === 'direct') return urls.directUrl;
  if (tier === 'cfproxy') return urls.cfProxyUrl;
  return urls.supabaseUrl;
}

/** Try playing an HLS source with hls.js, resolve true on manifest parsed, false on fatal error or timeout */
function tryHlsStream(video: HTMLVideoElement, url: string, tierName: string, timeoutMs = TIER_TIMEOUT_MS): Promise<{ ok: boolean; hls: Hls | null }> {
  return new Promise((resolve) => {
    let settled = false;
    const settle = (ok: boolean, hlsInstance: Hls | null, reason: string) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      console.log(`[Watch] HLS ${tierName} ${ok ? 'OK' : 'FAILED: ' + reason}`);
      if (!ok && hlsInstance) { hlsInstance.destroy(); }
      resolve({ ok, hls: ok ? hlsInstance : null });
    };

    if (!Hls.isSupported()) {
      settle(false, null, 'HLS not supported');
      return;
    }

    const hls = new Hls({ enableWorker: true });
    const timer = setTimeout(() => settle(false, hls, `timed out after ${timeoutMs}ms`), timeoutMs);

    hls.on(Hls.Events.MANIFEST_PARSED, () => settle(true, hls, ''));
    hls.on(Hls.Events.ERROR, (_, data) => {
      if (data.fatal) settle(false, hls, `fatal: ${data.type} ${data.details}`);
    });

    hls.loadSource(url);
    hls.attachMedia(video);
  });
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

    /** Non-HLS cascade: direct → cfproxy → supabase */
    const runCascade = async (urls: ResolvedUrls): Promise<boolean> => {
      const tiers: StreamTier[] = ['direct', 'cfproxy', 'supabase'];
      for (const tier of tiers) {
        if (cancelled) return false;
        const url = getTierUrl(tier, urls);

        if (tier === 'supabase') {
          console.log('[Watch] Using supabase proxy (last resort)');
          video.src = url;
          video.load();
          playAndFinish('supabase');
          return true;
        }

        console.log(`[Watch] Trying ${tier}:`, url);
        const ok = await tryDirectStream(video, url, tier);
        if (cancelled) return false;
        if (ok) { playAndFinish(tier); return true; }
      }
      return false;
    };

    /** HLS cascade: skip HEAD probes, try playback directly */
    const runHlsCascade = async (urls: ResolvedUrls): Promise<boolean> => {
      const tiers: StreamTier[] = ['direct', 'cfproxy', 'supabase'];
      for (const tier of tiers) {
        if (cancelled) return false;
        const url = getTierUrl(tier, urls);
        console.log(`[Watch] HLS trying ${tier}:`, url);

        const result = await tryHlsStream(video, url, tier, TIER_TIMEOUT_MS);
        if (cancelled) { result.hls?.destroy(); return false; }

        if (result.ok && result.hls) {
          hls = result.hls;
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

          if (srcIsHls) {
            // HLS cascade — no HEAD probes, try playback directly per tier
            if (Hls.isSupported()) {
              const success = await runHlsCascade(urls);
              if (!success && !cancelled) {
                setLoading(false);
                setError('All HLS streaming sources failed');
              }
            } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
              // Safari native HLS — use cfproxy as default (no cascade needed)
              video.src = urls.cfProxyUrl;
              video.addEventListener('loadedmetadata', () => {
                if (!cancelled) { playAndFinish('cfproxy'); }
              });
              video.addEventListener('error', () => {
                if (!cancelled) { setLoading(false); setError('Stream failed to load'); }
              });
            } else {
              setError('HLS not supported on this device');
              setLoading(false);
            }
            return;
          }

          // Non-HLS: try cached tier first
          const cachedTier = getCachedTier();
          if (cachedTier && cachedTier !== 'supabase') {
            const cachedUrl = getTierUrl(cachedTier, urls);
            console.log(`[Watch] Trying cached tier "${cachedTier}":`, cachedUrl);
            const ok = await tryDirectStream(video, cachedUrl, `cached:${cachedTier}`);
            if (cancelled) return;
            if (ok) { playAndFinish(cachedTier); return; }
            console.log('[Watch] Cached tier failed, running full cascade');
            clearCachedTier();
          }

          const success = await runCascade(urls);
          if (!success && !cancelled) {
            setLoading(false);
            setError('All streaming sources failed');
          }
          return;
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
