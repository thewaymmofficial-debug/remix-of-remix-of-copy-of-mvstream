import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Search, Play, Tv, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Navbar } from '@/components/Navbar';
import { MobileBottomNav } from '@/components/MobileBottomNav';
import { LiveTvPlayer } from '@/components/LiveTvPlayer';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';

interface Channel {
  name: string;
  logo: string;
  url: string;
  group: string;
  source?: string;
}

interface SourceData {
  category: string;
  channels: Record<string, Channel[]>;
}

interface LiveTvResponse {
  date: string;
  sources: Record<string, SourceData>;
}

export default function TvChannels() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeChannel, setActiveChannel] = useState<Channel | null>(null);
  const [openSources, setOpenSources] = useState<Record<string, boolean>>({});

  const { data, isLoading } = useQuery({
    queryKey: ['live-tv-channels'],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('live-tv-proxy');
      if (error) throw error;
      return data as LiveTvResponse;
    },
    staleTime: 5 * 60 * 1000,
  });

  // Initialize open state for first source
  useMemo(() => {
    if (data?.sources && Object.keys(openSources).length === 0) {
      const keys = Object.keys(data.sources);
      if (keys.length > 0) {
        setOpenSources({ [keys[0]]: true });
      }
    }
  }, [data?.sources]);

  // Flatten all channels for search
  const allChannels = useMemo(() => {
    if (!data?.sources) return [];
    const channels: (Channel & { sourceCategory: string })[] = [];
    for (const [category, source] of Object.entries(data.sources)) {
      for (const group of Object.values(source.channels)) {
        for (const ch of group) {
          channels.push({ ...ch, sourceCategory: category });
        }
      }
    }
    return channels;
  }, [data]);

  // Filter by search
  const filteredChannels = useMemo(() => {
    if (!searchQuery.trim()) return null;
    const q = searchQuery.toLowerCase();
    return allChannels.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.group.toLowerCase().includes(q) ||
        c.sourceCategory.toLowerCase().includes(q)
    );
  }, [allChannels, searchQuery]);

  const handlePlay = (channel: Channel) => {
    setActiveChannel(channel);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const toggleSource = (key: string) => {
    setOpenSources((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const totalChannels = allChannels.length;

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

      {/* Inline Player */}
      {activeChannel && (
        <div className="px-4">
          <LiveTvPlayer
            url={activeChannel.url}
            channelName={activeChannel.name}
            onClose={() => setActiveChannel(null)}
          />
        </div>
      )}

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
        {!isLoading && totalChannels > 0 && (
          <p className="text-xs text-muted-foreground mt-2">{totalChannels} channels available</p>
        )}
      </div>

      {/* Content */}
      <div className="px-4 pb-24">
        {isLoading ? (
          <div className="space-y-6">
            {[1, 2, 3].map((i) => (
              <div key={i}>
                <div className="h-6 w-48 bg-muted rounded mb-4 animate-pulse" />
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div className="aspect-video bg-muted rounded-xl animate-pulse" />
                  <div className="aspect-video bg-muted rounded-xl animate-pulse" />
                  <div className="aspect-video bg-muted rounded-xl animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredChannels !== null ? (
          // Search results
          filteredChannels.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <Tv className="w-16 h-16 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No channels found</p>
            </div>
          ) : (
            <div>
              <h2 className="text-lg font-bold text-foreground mb-4">
                Results ({filteredChannels.length})
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {filteredChannels.map((channel, idx) => (
                  <ChannelCard
                    key={`${channel.name}-${idx}`}
                    channel={channel}
                    isActive={activeChannel?.url === channel.url}
                    onPlay={handlePlay}
                  />
                ))}
              </div>
            </div>
          )
        ) : !data?.sources || Object.keys(data.sources).length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Tv className="w-16 h-16 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">{t('noChannels')}</p>
          </div>
        ) : (
          // Country/type grouped view
          <div className="space-y-4">
            {Object.entries(data.sources).map(([sourceCategory, sourceData]) => {
              const channelCount = Object.values(sourceData.channels).flat().length;
              return (
                <Collapsible
                  key={sourceCategory}
                  open={openSources[sourceCategory] ?? false}
                  onOpenChange={() => toggleSource(sourceCategory)}
                >
                  <CollapsibleTrigger className="w-full">
                    <div className="flex items-center justify-between p-3 bg-muted rounded-xl hover:bg-muted/80 transition-colors">
                      <div className="flex items-center gap-2">
                        <Tv className="w-5 h-5 text-primary" />
                        <span className="font-bold text-foreground text-sm sm:text-base">{sourceCategory}</span>
                        <span className="text-xs text-muted-foreground">({channelCount})</span>
                      </div>
                      <ChevronDown className={`w-5 h-5 text-muted-foreground transition-transform ${openSources[sourceCategory] ? 'rotate-180' : ''}`} />
                    </div>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="space-y-6 pt-4">
                      {Object.entries(sourceData.channels).map(([group, channels]) => (
                        <div key={group}>
                          <h3 className="text-sm font-semibold text-muted-foreground mb-3 pl-1">
                            {group} ({channels.length})
                          </h3>
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                            {channels.map((channel, idx) => (
                              <ChannelCard
                                key={`${channel.name}-${idx}`}
                                channel={channel}
                                isActive={activeChannel?.url === channel.url}
                                onPlay={handlePlay}
                              />
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              );
            })}
          </div>
        )}
      </div>

      <MobileBottomNav />
    </div>
  );
}

function ChannelCard({
  channel,
  isActive,
  onPlay,
}: {
  channel: Channel;
  isActive: boolean;
  onPlay: (c: Channel) => void;
}) {
  return (
    <button
      onClick={() => onPlay(channel)}
      className={`text-left group ${isActive ? 'ring-2 ring-primary rounded-xl' : ''}`}
    >
      <div className="relative aspect-video rounded-xl overflow-hidden bg-muted border border-border mb-2">
        {channel.logo ? (
          <img
            src={channel.logo}
            alt={channel.name}
            className="w-full h-full object-contain bg-white p-2"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-muted">
            <span className="text-lg font-bold text-muted-foreground">
              {channel.name[0]}
            </span>
          </div>
        )}
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
