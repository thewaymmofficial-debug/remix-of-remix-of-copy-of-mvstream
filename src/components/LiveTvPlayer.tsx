import { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';
import { X, AlertTriangle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface LiveTvPlayerProps {
  url: string;
  channelName: string;
  onClose: () => void;
  onError?: (url: string) => void;
}

export function LiveTvPlayer({ url, channelName, onClose, onError }: LiveTvPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !url) return;

    setError(null);
    setLoading(true);

    if (Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
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
          setLoading(false);
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              setError('Network error — stream may be offline or blocked by CORS.');
              onError?.(url);
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              hls.recoverMediaError();
              break;
            default:
              setError('Stream failed to load.');
              onError?.(url);
              hls.destroy();
              break;
          }
        }
      });

      return () => {
        hls.destroy();
        hlsRef.current = null;
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
        onError?.(url);
      });
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

      {/* Loading state */}
      {loading && !error && (
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
