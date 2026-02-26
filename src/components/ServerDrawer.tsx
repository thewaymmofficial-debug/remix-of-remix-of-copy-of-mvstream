import { useState, useEffect } from 'react';
import { Server, ChevronRight, Play, ExternalLink, Download, Loader2 } from 'lucide-react';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import { useLanguage } from '@/contexts/LanguageContext';
import { useDownloadManager } from '@/contexts/DownloadContext';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/hooks/use-toast';

function isWebView(): boolean {
  const ua = navigator.userAgent || '';
  return /wv|WebView/i.test(ua) || (ua.includes('Android') && ua.includes('Version/'));
}

function buildIntentUrl(url: string): string {
  try {
    const parsed = new URL(url);
    return `intent://${parsed.host}${parsed.pathname}${parsed.search}#Intent;scheme=${parsed.protocol.replace(':', '')};action=android.intent.action.VIEW;end`;
  } catch {
    return url;
  }
}

function openExternal(url: string): void {
  // Strategy 1: Anchor click with target="_blank" (most reliable in WebView)
  try {
    const a = document.createElement('a');
    a.href = url;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  } catch { /* continue */ }

  // Strategy 2: Direct location (1.5s delay)
  setTimeout(() => {
    if (document.visibilityState !== 'visible') return;
    try { window.location.href = url; } catch { /* continue */ }

    // Strategy 3: Intent URL (another 1.2s)
    setTimeout(() => {
      if (document.visibilityState !== 'visible') return;
      try { window.location.href = buildIntentUrl(url); } catch { /* continue */ }
    }, 1200);
  }, 1500);
}

interface ServerDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  streamUrl?: string | null;
  telegramUrl?: string | null;
  megaUrl?: string | null;
  downloadUrl?: string | null;
  mxPlayerUrl?: string | null;
  type: 'play' | 'download';
  movieInfo?: {
    movieId: string;
    title: string;
    posterUrl: string | null;
    year: number | null;
    resolution: string | null;
    fileSize: string | null;
  };
}

export function ServerDrawer({
  open,
  onOpenChange,
  streamUrl,
  telegramUrl,
  megaUrl,
  downloadUrl,
  mxPlayerUrl,
  type,
  movieInfo,
}: ServerDrawerProps) {
  const { t } = useLanguage();
  const { startDownload } = useDownloadManager();
  const navigate = useNavigate();
  const [redirecting, setRedirecting] = useState(false);

  // Clean up redirecting state if user navigates back
  useEffect(() => {
    if (!redirecting) return;
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        setRedirecting(false);
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [redirecting]);

  const handleOpen = (url: string, useInAppPlayer: boolean = false) => {
    // In-app download with progress tracking
    if (type === 'download' && movieInfo) {
      startDownload({
        movieId: movieInfo.movieId,
        title: movieInfo.title,
        posterUrl: movieInfo.posterUrl,
        year: movieInfo.year,
        resolution: movieInfo.resolution,
        fileSize: movieInfo.fileSize,
        url: url,
      });
      navigate('/downloads');
      onOpenChange(false);
      return;
    }

    if (useInAppPlayer && type === 'play') {
      const title = movieInfo?.title || 'Video';
      const movieId = movieInfo?.movieId || '';
      navigate(`/watch?url=${encodeURIComponent(url)}&title=${encodeURIComponent(title)}&movieId=${encodeURIComponent(movieId)}`);
      onOpenChange(false);
      return;
    }

    // External link flow — show overlay, then use multi-strategy redirect
    setRedirecting(true);
    onOpenChange(false);

    toast({
      title: "Opening external link...",
      description: "Tap back to return to Cineverse",
      duration: 5000,
    });

    // Use multi-strategy approach (anchor click → location → intent)
    openExternal(url);

    // Final safety: if still visible after all strategies, show error
    setTimeout(() => {
      if (document.visibilityState !== 'visible') return;
      setRedirecting(false);
      toast({
        title: "Couldn't open link",
        description: "Try opening in your browser",
        variant: "destructive",
      });
    }, 4000);
  };

  const servers = type === 'download'
    ? [
        ...(downloadUrl ? [{ name: 'Main Server', url: downloadUrl, icon: 'download' as const, inApp: false }] : []),
        ...(telegramUrl ? [{ name: 'Telegram', url: telegramUrl, icon: 'telegram' as const, inApp: false }] : []),
        ...(megaUrl ? [{ name: 'MEGA', url: megaUrl, icon: 'mega' as const, inApp: false }] : []),
      ]
    : [
        ...(streamUrl ? [{ name: 'Main Server', url: streamUrl, icon: 'main' as const, inApp: true }] : []),
        ...(mxPlayerUrl ? [{ name: 'External Server', url: mxPlayerUrl, icon: 'external' as const, inApp: false }] : []),
        ...(downloadUrl ? [{ name: 'Direct Download', url: downloadUrl, icon: 'download' as const, inApp: false }] : []),
        ...(telegramUrl ? [{ name: 'Telegram', url: telegramUrl, icon: 'telegram' as const, inApp: false }] : []),
        ...(megaUrl ? [{ name: 'MEGA', url: megaUrl, icon: 'mega' as const, inApp: false }] : []),
      ];

  if (servers.length === 0 && !redirecting) return null;

  const title = type === 'play' ? t('chooseServer') : t('chooseDownloader');

  return (
    <>
      {/* Full-screen loading overlay */}
      {redirecting && (
        <div className="fixed inset-0 z-[100] bg-background/90 backdrop-blur-sm flex flex-col items-center justify-center gap-4">
          <Loader2 className="w-12 h-12 text-primary animate-spin" />
          <p className="text-lg font-semibold text-foreground">Opening external link...</p>
          <p className="text-sm text-muted-foreground">You'll be redirected to your browser</p>
        </div>
      )}

      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="bg-background">
          <DrawerHeader className="text-left">
            <DrawerTitle className="text-2xl font-bold text-foreground">
              {title}
            </DrawerTitle>
          </DrawerHeader>
          <div className="px-4 pb-8 space-y-3">
            {servers.map((server) => (
              <button
                key={server.name}
                onClick={() => handleOpen(server.url, server.inApp)}
                className="w-full flex items-center gap-4 p-4 rounded-xl border border-border bg-card hover:bg-muted/50 transition-colors"
              >
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Server className="w-6 h-6 text-primary" />
                </div>
                <span className="flex-1 text-left font-medium text-foreground text-lg">
                  {server.name}
                </span>
                {type === 'play' ? (
                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                ) : (
                  <ExternalLink className="w-5 h-5 text-muted-foreground" />
                )}
              </button>
            ))}
          </div>
        </DrawerContent>
      </Drawer>
    </>
  );
}
