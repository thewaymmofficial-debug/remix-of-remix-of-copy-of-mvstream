import { useNavigate } from 'react-router-dom';
import { ArrowLeft, FileText, Trash2, Sun, Moon, RotateCcw, FolderDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useDownloadManager } from '@/contexts/DownloadContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from 'next-themes';
import { MobileBottomNav } from '@/components/MobileBottomNav';

function formatFilename(title: string, year: number | null, resolution: string | null) {
  const y = year || 'XXXX';
  const r = resolution || 'HD';
  return `${title.replace(/\s+/g, '.')}.${y}.${r}.Web-Dl(cineverse).mkv`;
}

function formatDate(timestamp: number) {
  return new Date(timestamp).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function Downloads() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { theme, setTheme } = useTheme();
  const { downloads, removeDownload, clearDownloads, startDownload } = useDownloadManager();

  return (
    <div className="min-h-screen bg-background mobile-nav-spacing">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-background border-b border-border">
        <div className="flex items-center justify-between px-4 h-14">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/')}
              className="h-9 w-9"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-lg font-bold text-foreground">{t('downloadManager')}</h1>
          </div>
          <div className="flex items-center gap-1">
            {downloads.length > 0 && (
              <Button
                variant="ghost"
                size="icon"
                onClick={clearDownloads}
                className="h-9 w-9 text-destructive hover:text-destructive"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="h-9 w-9"
            >
              {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Info banner */}
      <div className="px-4 pt-4">
        <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border border-border">
          <FolderDown className="w-5 h-5 text-muted-foreground flex-shrink-0" />
          <p className="text-xs text-muted-foreground">
            Files are saved to your device's Downloads folder by the browser.
          </p>
        </div>
      </div>

      {/* Downloads list */}
      <div className="px-4 py-4 space-y-3">
        {downloads.length === 0 ? (
          <div className="text-center py-20">
            <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">{t('noDownloads')}</p>
          </div>
        ) : (
          downloads.map((dl) => (
            <DownloadCard
              key={dl.id}
              dl={dl}
              onRetry={() =>
                startDownload({
                  movieId: dl.movieId,
                  title: dl.title,
                  posterUrl: dl.posterUrl,
                  year: dl.year,
                  resolution: dl.resolution,
                  fileSize: dl.fileSize,
                  url: dl.url,
                })
              }
              onRemove={() => removeDownload(dl.id)}
            />
          ))
        )}
      </div>

      <MobileBottomNav />
    </div>
  );
}

function DownloadCard({
  dl,
  onRetry,
  onRemove,
}: {
  dl: import('@/contexts/DownloadContext').DownloadEntry;
  onRetry: () => void;
  onRemove: () => void;
}) {
  return (
    <div className="p-4 rounded-xl bg-card border border-border">
      <div className="flex items-start gap-3">
        {/* File icon */}
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
          <FileText className="w-5 h-5 text-primary" />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground leading-snug break-all">
            {formatFilename(dl.title, dl.year, dl.resolution)}
          </p>
          <div className="flex items-center gap-2 mt-1">
            {dl.fileSize && (
              <span className="text-xs text-muted-foreground">{dl.fileSize}</span>
            )}
            <span className="text-xs text-muted-foreground">•</span>
            <span className="text-xs text-muted-foreground">{formatDate(dl.timestamp)}</span>
          </div>
          <span className="inline-block mt-1.5 text-xs font-medium text-primary">
            ✓ Saved to Downloads
          </span>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-1 flex-shrink-0">
          <button
            onClick={onRetry}
            className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center hover:bg-primary/20 transition-colors"
            title="Download again"
          >
            <RotateCcw className="w-4 h-4 text-primary" />
          </button>
          <button
            onClick={onRemove}
            className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-destructive/10 transition-colors"
            title="Remove"
          >
            <Trash2 className="w-3.5 h-3.5 text-destructive" />
          </button>
        </div>
      </div>
    </div>
  );
}
