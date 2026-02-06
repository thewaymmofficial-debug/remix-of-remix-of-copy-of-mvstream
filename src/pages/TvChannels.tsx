import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Search, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Navbar } from '@/components/Navbar';
import { MobileBottomNav } from '@/components/MobileBottomNav';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';

interface TvChannel {
  id: string;
  name: string;
  category: string;
  stream_url: string | null;
  thumbnail_url: string | null;
  display_order: number;
  is_active: boolean;
}

export default function TvChannels() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');

  const { data: channels, isLoading } = useQuery({
    queryKey: ['tv-channels'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tv_channels')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true });
      if (error) throw error;
      return data as TvChannel[];
    },
  });

  // Filter channels by search
  const filteredChannels = useMemo(() => {
    if (!channels) return [];
    if (!searchQuery.trim()) return channels;
    const q = searchQuery.toLowerCase();
    return channels.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.category.toLowerCase().includes(q)
    );
  }, [channels, searchQuery]);

  // Group by category
  const groupedChannels = useMemo(() => {
    const groups: Record<string, TvChannel[]> = {};
    filteredChannels.forEach((channel) => {
      if (!groups[channel.category]) {
        groups[channel.category] = [];
      }
      groups[channel.category].push(channel);
    });
    return groups;
  }, [filteredChannels]);

  const handlePlay = (channel: TvChannel) => {
    if (channel.stream_url) {
      window.open(channel.stream_url, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div className="min-h-screen bg-background mobile-nav-spacing">
      <Navbar />

      {/* Header */}
      <div className="pt-16 px-4 pb-4 flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate('/')}
          className="text-foreground"
        >
          <ArrowLeft className="w-6 h-6" />
        </Button>
        <h1 className="text-xl font-bold text-foreground flex-1 text-center pr-10">
          {t('tvChannels')}
        </h1>
      </div>

      {/* Search */}
      <div className="px-4 mb-6">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('searchChannels')}
            className="pl-12 h-14 rounded-xl border-border text-base"
          />
        </div>
      </div>

      {/* Content */}
      <div className="px-4 pb-24">
        {isLoading ? (
          <div className="space-y-6">
            {[1, 2, 3].map((i) => (
              <div key={i}>
                <div className="h-6 w-48 bg-muted rounded mb-4 animate-pulse" />
                <div className="grid grid-cols-2 gap-3">
                  <div className="aspect-video bg-muted rounded-xl animate-pulse" />
                  <div className="aspect-video bg-muted rounded-xl animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        ) : Object.keys(groupedChannels).length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Play className="w-16 h-16 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">{t('noChannels')}</p>
          </div>
        ) : (
          <div className="space-y-8">
            {/* All channels section */}
            <div>
              <h2 className="text-lg font-bold text-foreground mb-4">
                {t('allTvChannels')} ({filteredChannels.length})
              </h2>
              <div className="grid grid-cols-2 gap-3">
                {filteredChannels.slice(0, 4).map((channel) => (
                  <ChannelCard key={`all-${channel.id}`} channel={channel} onPlay={handlePlay} />
                ))}
              </div>
            </div>

            {/* By category */}
            {Object.entries(groupedChannels).map(([category, categoryChannels]) => (
              <div key={category}>
                <h2 className="text-lg font-bold text-foreground mb-4">
                  {category} ({categoryChannels.length})
                </h2>
                <div className="grid grid-cols-2 gap-3">
                  {categoryChannels.map((channel) => (
                    <ChannelCard key={channel.id} channel={channel} onPlay={handlePlay} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <MobileBottomNav />
    </div>
  );
}

function ChannelCard({
  channel,
  onPlay,
}: {
  channel: TvChannel;
  onPlay: (c: TvChannel) => void;
}) {
  return (
    <button
      onClick={() => onPlay(channel)}
      className="text-left group"
    >
      <div className="relative aspect-video rounded-xl overflow-hidden bg-muted border border-border mb-2">
        {channel.thumbnail_url ? (
          <img
            src={channel.thumbnail_url}
            alt={channel.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-muted">
            <span className="text-lg font-bold text-muted-foreground">{channel.name[0]}</span>
          </div>
        )}
        {/* Play overlay */}
        <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="w-12 h-12 rounded-full bg-white/80 flex items-center justify-center">
            <Play className="w-6 h-6 text-black fill-black" />
          </div>
        </div>
      </div>
      <p className="text-sm font-medium text-foreground truncate">{channel.name}</p>
    </button>
  );
}
