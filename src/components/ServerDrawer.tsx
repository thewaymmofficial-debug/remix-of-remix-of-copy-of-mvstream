import { useState, useEffect, useRef } from 'react';
import { Server, ChevronRight, Play, ExternalLink, Download, Loader2, Copy, RefreshCw, X } from 'lucide-react';
import { buildBrowserIntentUrl } from '@/lib/externalLinks';
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
import { openExternalUrl } from '@/lib/externalLinks';
import { Button } from '@/components/ui/button';

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
  const [fallbackUrl, setFallbackUrl] = useState<string | null>(null);
  const fallbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Clean up redirecting state if user navigates back
  useEffect(() => {
    if (!redirecting) return;
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        setRedirecting(false);
        if (fallbackTimerRef.current) {
          clearTimeout(fallbackTimerRef.current);
          fallbackTimerRef.current = null;
        }
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [redirecting]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (fallbackTimerRef.current) clearTimeout(fallbackTimerRef.current);
    };
  }, []);

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

    openExternalUrl(url, {
      useIntent: true,
      strategyDelay: 400,
      onFail: () => {
        setRedirecting(false);
        toast({
          title: "Couldn't open link",
          description: "Try opening in your browser",
          variant: "destructive",
        });
      },
    });
  };

  const servers = type === 'download'
    ? [
        ...(downloadUrl ? [{ name: 'Main Server', url: downloadUrl, icon: 'download' as const, inApp: false }] : []),
        ...(telegramUrl ? [{ name: 'Telegram', url: telegramUrl, icon: 'telegram' as const, inApp: false }] : []),
        ...(megaUrl ? [{ name: 'MEGA', url: megaUrl, icon: 'mega' as const, inApp: false }] : []),
      ]
    : [
        ...(streamUrl ? [{ name: 'Main Server', url: streamUrl, icon: 'main' as const, inApp: true }] : []),
        ...(mxPlayerUrl ? [{ name: 'External Server', url: mxPlayerUrl, icon: 'external' as const, inApp: false, realHref: true }] : []),
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
            {servers.map((server) => {
              const sharedClassName = "w-full flex items-center gap-4 p-4 rounded-xl border border-border bg-card hover:bg-muted/50 transition-colors";
              const inner = (
                <>
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
                </>
              );

              if ((server as any).realHref) {
                return (
                  <a
                    key={server.name}
                    href={buildBrowserIntentUrl(server.url)}
                    rel="noopener noreferrer"
                    onClick={() => {
                      setRedirecting(true);
                      onOpenChange(false);
                      toast({
                        title: "Opening external link...",
                        description: "Tap back to return to Cineverse",
                        duration: 5000,
                      });
                      // Fallback: if still visible after 2s, show copy dialog
                      fallbackTimerRef.current = setTimeout(() => {
                        if (document.visibilityState === 'visible') {
                          setRedirecting(false);
                          setFallbackUrl(server.url);
                        }
                      }, 2000);
                    }}
                    className={sharedClassName}
                  >
                    {inner}
                  </a>
                );
              }

              return (
                <button
                  key={server.name}
                  onClick={() => handleOpen(server.url, server.inApp)}
                  className={sharedClassName}
                >
                  {inner}
                </button>
              );
            })}
          </div>
        </DrawerContent>
      </Drawer>

      {/* Fallback dialog when intent:// fails */}
      {fallbackUrl && (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl w-full max-w-sm p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-foreground">Couldn't open browser</h3>
              <button onClick={() => setFallbackUrl(null)} className="text-muted-foreground hover:text-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-sm text-muted-foreground">
              Copy the link below and paste it in your browser:
            </p>
            <div className="bg-muted rounded-lg p-3 break-all text-xs text-foreground select-all font-mono">
              {fallbackUrl}
            </div>
            <div className="flex flex-col gap-2">
              <Button
                onClick={() => {
                  navigator.clipboard.writeText(fallbackUrl).then(() => {
                    toast({ title: "Link copied!", description: "Paste it in your browser", duration: 3000 });
                  }).catch(() => {
                    toast({ title: "Couldn't copy", description: "Long-press the link above to copy manually", variant: "destructive" });
                  });
                }}
                className="w-full gap-2"
              >
                <Copy className="w-4 h-4" />
                Copy Link
              </Button>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1 gap-2"
                  onClick={() => {
                    window.location.href = buildBrowserIntentUrl(fallbackUrl);
                    setRedirecting(true);
                    fallbackTimerRef.current = setTimeout(() => {
                      if (document.visibilityState === 'visible') {
                        setRedirecting(false);
                      }
                    }, 2000);
                  }}
                >
                  <RefreshCw className="w-4 h-4" />
                  Try Again
                </Button>
                <Button variant="ghost" className="flex-1" onClick={() => setFallbackUrl(null)}>
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
