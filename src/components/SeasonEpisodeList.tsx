import { useState } from 'react';
import { ChevronDown, Play, ExternalLink, Eye, Download, Film, Server } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useSeasonsWithEpisodes } from '@/hooks/useSeasons';
import { useLanguage } from '@/contexts/LanguageContext';
import type { Episode, SeasonWithEpisodes } from '@/types/database';

interface SeasonEpisodeListProps {
  movieId: string;
  isPremium: boolean;
  userIsPremium: boolean;
  onPremiumRequired: () => void;
}

export function SeasonEpisodeList({ 
  movieId, 
  isPremium, 
  userIsPremium, 
  onPremiumRequired 
}: SeasonEpisodeListProps) {
  const { data: seasons, isLoading } = useSeasonsWithEpisodes(movieId);
  const { t } = useLanguage();
  const [expandedSeasons, setExpandedSeasons] = useState<Set<string>>(() => new Set());

  const toggleSeason = (seasonId: string) => {
    setExpandedSeasons(prev => {
      const next = new Set(prev);
      if (next.has(seasonId)) {
        next.delete(seasonId);
      } else {
        next.add(seasonId);
      }
      return next;
    });
  };

  const handlePlay = (episode: Episode) => {
    if (isPremium && !userIsPremium) {
      onPremiumRequired();
    } else if (episode.stream_url) {
      window.open(episode.stream_url, '_blank', 'noopener,noreferrer');
    }
  };

  const handleDownload = (episode: Episode) => {
    if (isPremium && !userIsPremium) {
      onPremiumRequired();
    } else if (episode.mega_url) {
      window.open(episode.mega_url, '_blank', 'noopener,noreferrer');
    } else if (episode.telegram_url) {
      window.open(episode.telegram_url, '_blank', 'noopener,noreferrer');
    }
  };

  if (isLoading) {
    return (
      <div className="mt-6">
        <div className="animate-pulse space-y-3">
          <div className="h-6 w-48 bg-muted rounded" />
          <div className="h-20 bg-muted rounded-xl" />
          <div className="h-20 bg-muted rounded-xl" />
          <div className="h-20 bg-muted rounded-xl" />
        </div>
      </div>
    );
  }

  if (!seasons || seasons.length === 0) return null;

  // Calculate total episodes across all seasons
  const totalEpisodes = seasons.reduce((sum, s) => sum + s.episodes.length, 0);
  const hasSingleSeason = seasons.length === 1;

  return (
    <div className="mt-6">
      {hasSingleSeason ? (
        // Single season - show flat episode list like M-Sub
        <>
          <h2 className="text-xl font-bold text-foreground mb-4">
            {t('allEpisodes')} ({totalEpisodes})
          </h2>
          <div className="space-y-3">
            {seasons[0].episodes.map((episode) => (
              <EpisodeCard
                key={episode.id}
                episode={episode}
                onPlay={() => handlePlay(episode)}
                onDownload={() => handleDownload(episode)}
              />
            ))}
          </div>
        </>
      ) : (
        // Multiple seasons - collapsible
        <>
          <h2 className="text-xl font-bold text-foreground mb-4">
            {t('seasonsAndEpisodes')}
          </h2>
          <div className="space-y-3">
            {seasons.map((season) => (
              <div key={season.id}>
                <button
                  onClick={() => toggleSeason(season.id)}
                  className="w-full flex items-center justify-between p-4 rounded-xl bg-card border border-border hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-foreground">
                      Season {season.season_number}
                      {season.title && `: ${season.title}`}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      ({season.episodes.length} {t('episodes')})
                    </span>
                  </div>
                  <ChevronDown 
                    className={`w-5 h-5 text-muted-foreground transition-transform ${
                      expandedSeasons.has(season.id) ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                {expandedSeasons.has(season.id) && (
                  <div className="mt-2 space-y-3">
                    {season.episodes.map((episode) => (
                      <EpisodeCard
                        key={episode.id}
                        episode={episode}
                        onPlay={() => handlePlay(episode)}
                        onDownload={() => handleDownload(episode)}
                      />
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

interface EpisodeCardProps {
  episode: Episode;
  onPlay: () => void;
  onDownload: () => void;
}

function EpisodeCard({ episode, onPlay, onDownload }: EpisodeCardProps) {
  const hasDownload = episode.mega_url || episode.telegram_url;

  return (
    <div className="flex items-center gap-3 p-4 rounded-xl bg-card border border-border">
      {/* Play button */}
      <button
        onClick={onPlay}
        className="flex-shrink-0 w-10 h-10 rounded-full border-2 border-primary flex items-center justify-center text-primary hover:bg-primary hover:text-primary-foreground transition-colors"
      >
        <Play className="w-4 h-4 fill-current" />
      </button>

      {/* Episode info */}
      <div className="flex-1 min-w-0">
        <h4 className="font-semibold text-foreground text-sm">
          {episode.title}
        </h4>
        <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
          {episode.duration && (
            <div className="flex items-center gap-1">
              <Server className="w-3 h-3" />
              <span>{episode.duration}</span>
            </div>
          )}
        </div>
      </div>

      {/* Download icon */}
      {hasDownload && (
        <button
          onClick={onDownload}
          className="flex-shrink-0 p-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <Download className="w-5 h-5" />
        </button>
      )}
    </div>
  );
}
