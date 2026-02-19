import { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';
import { X, AlertTriangle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface LiveTvPlayerProps {
  url: string;
  channelName: string;
  onClose: () => void;
  onError?: (url: string, channelName: string) => void;
}

const isHLSUrl = (url: string) => /\.(m3u8?)([\?#]|$)/i.test(url);
const MAX_NETWORK_RETRIES = 3;

export function LiveTvPlayer({ url, channelName, onClose, onError }: LiveTvPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const networkRetryCount = useRef(0);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [buffering, setBuffering] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !url) return;

    setError(null);
    setLoading(true);
    setBuffering(false);
    networkRetryCount.current = 0;

    const handleWaiting = () => setBuffering(true);
    const handlePlaying = () => {
      setBuffering(false);
      networkRetryCount.current = 0; // reset on successful playback
    };

    video.addEventListener('waiting', handleWaiting);
    video.addEventListener('playing', handlePlaying);

    // Native HTML5 playback for .mp4 and other non-HLS URLs
    if (!isHLSUrl(url)) {
      video.crossOrigin = 'anonymous';
      video.src = url;

      const handleCanPlay = () => {
        setLoading(false);
        video.play().catch(() => {});
      };
      const handleNativeError = () => {
        setLoading(false);
        setError('Video failed to load.');
        onError?.(url, channelName);
      };

      video.addEventListener('canplay', handleCanPlay);
      video.addEventListener('error', handleNativeError);

      return () => {
        video.removeEventListener('canplay', handleCanPlay);
        video.removeEventListener('error', handleNativeError);
        video.removeEventListener('waiting', handleWaiting);
        video.removeEventListener('playing', handlePlaying);
        video.src = '';
      };
    }

    // HLS playback
    if (Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: false,
        liveSyncDurationCount: 7,
        liveMaxLatencyDurationCount: 12,
      });
      hlsRef.current = hls;

      hls.loadSource(url);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        setLoading(false);
        video.play().catch(() => {});
      });

      hls.on(Hls.Events.ERROR, (_event, data) => {
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              networkRetryCount.current += 1;
              if (networkRetryCount.current <= MAX_NETWORK_RETRIES) {
                // Auto-recover: show buffering spinner and retry
                setBuffering(true);
                setLoading(false);
                hls.startLoad();
              } else {
                // Give up after max retries
                setLoading(false);
                setBuffering(false);
                setError('Network error — stream may be offline or blocked by CORS.');
                onError?.(url, channelName);
              }
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              hls.recoverMediaError();
              break;
            default:
              setLoading(false);
              setBuffering(false);
              setError('Stream failed to load.');
              onError?.(url, channelName);
              hls.destroy();
              break;
          }
        }
      });

      return () => {
        hls.destroy();
        hlsRef.current = null;
        video.removeEventListener('waiting', handleWaiting);
        video.removeEventListener('playing', handlePlaying);
      };
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      // Native HLS (Safari)
      video.src = url;
      video.addEventListener('loadedmetadata', () => {
        setLoading(false);
        video.play().catch(() => {});
      });
      video.addEventListener('error', () => {
        setLoading(false);
        setError('Stream failed to load.');
        onError?.(url, channelName);
      });

      return () => {
        video.removeEventListener('waiting', handleWaiting);
        video.removeEventListener('playing', handlePlaying);
      };
    } else {
      setError('HLS playback is not supported in this browser.');
      setLoading(false);
    }
  }, [url]);

  return (
    <div className="relative w-full bg-black rounded-xl overflow-hidden mb-6">
      {/* Close button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={onClose}
        className="absolute top-3 right-3 z-20 bg-black/50 hover:bg-black/70 text-white rounded-full"
      >
        <X className="w-5 h-5" />
      </Button>

      {/* Channel name overlay */}
      <div className="absolute top-3 left-3 z-20 bg-black/50 px-3 py-1 rounded-lg">
        <span className="text-white text-sm font-medium">{channelName}</span>
      </div>

      {/* Loading / Buffering overlay */}
      {(loading || buffering) && !error && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/60">
          <Loader2 className="w-10 h-10 text-white animate-spin" />
        </div>
      )}

      {/* Error state */}
      {error ? (
        <div className="aspect-video flex flex-col items-center justify-center gap-3 p-6 text-center">
          <AlertTriangle className="w-12 h-12 text-destructive" />
          <p className="text-white text-sm">{error}</p>
          <Button variant="secondary" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      ) : (
        <video
          ref={videoRef}
          className="w-full aspect-video"
          controls
          playsInline
          autoPlay
        />
      )}
    </div>
  );
}
