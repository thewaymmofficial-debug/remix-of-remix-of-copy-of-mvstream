import { Server, ChevronRight, Play, ExternalLink, Download } from 'lucide-react';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import { useLanguage } from '@/contexts/LanguageContext';

interface ServerDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  streamUrl?: string | null;
  telegramUrl?: string | null;
  megaUrl?: string | null;
  downloadUrl?: string | null;
  type: 'play' | 'download';
}

export function ServerDrawer({
  open,
  onOpenChange,
  streamUrl,
  telegramUrl,
  megaUrl,
  downloadUrl,
  type,
}: ServerDrawerProps) {
  const { t } = useLanguage();

  const handleOpen = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
    onOpenChange(false);
  };

  const servers = [
    ...(downloadUrl ? [{ name: 'Direct Download', url: downloadUrl, icon: 'download' as const }] : []),
    ...(streamUrl ? [{ name: 'Main Server', url: streamUrl, icon: 'main' as const }] : []),
    ...(telegramUrl ? [{ name: 'Telegram', url: telegramUrl, icon: 'telegram' as const }] : []),
    ...(megaUrl ? [{ name: 'MEGA', url: megaUrl, icon: 'mega' as const }] : []),
  ];

  if (servers.length === 0) return null;

  const title = type === 'play' ? t('chooseServer') : t('chooseDownloader');
  const ActionIcon = type === 'play' ? Play : Download;

  return (
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
              onClick={() => handleOpen(server.url)}
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
  );
}
