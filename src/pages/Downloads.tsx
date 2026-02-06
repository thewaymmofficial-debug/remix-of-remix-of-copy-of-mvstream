import { useNavigate } from 'react-router-dom';
import { ArrowLeft, FileText, Play, Trash2, Sun, Moon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useDownloads } from '@/hooks/useDownloads';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from 'next-themes';
import { MobileBottomNav } from '@/components/MobileBottomNav';

export default function Downloads() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { theme, setTheme } = useTheme();
  const { downloads, removeDownload, clearDownloads } = useDownloads();

  const formatFilename = (title: string, year: number | null, resolution: string | null) => {
    const y = year || 'XXXX';
    const r = resolution || 'HD';
    return `${title.replace(/\s+/g, '.')}.${y}.${r}.Web-Dl(cineverse).mkv`;
  };

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

      {/* Downloads list */}
      <div className="px-4 py-4 space-y-3">
        {downloads.length === 0 ? (
          <div className="text-center py-20">
            <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">{t('noDownloads')}</p>
          </div>
        ) : (
          downloads.map((dl) => (
            <div
              key={dl.id}
              className="flex items-center gap-3 p-4 rounded-xl bg-card border border-border"
            >
              {/* File icon */}
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <FileText className="w-5 h-5 text-primary" />
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {formatFilename(dl.title, dl.year, dl.resolution)}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {dl.fileSize || 'Waiting for size...'}
                </p>
                <Progress value={dl.progress} className="h-1.5 mt-2" />
                <p className="text-xs text-muted-foreground mt-1 capitalize">
                  {dl.status === 'complete' ? 'Complete' : dl.status === 'paused' ? 'Paused' : 'Downloading'}
                </p>
              </div>

              {/* Play button */}
              <button
                onClick={() => window.open(dl.url, '_blank')}
                className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 hover:bg-primary/20 transition-colors"
              >
                <Play className="w-5 h-5 text-primary fill-primary" />
              </button>
            </div>
          ))
        )}
      </div>

      <MobileBottomNav />
    </div>
  );
}
