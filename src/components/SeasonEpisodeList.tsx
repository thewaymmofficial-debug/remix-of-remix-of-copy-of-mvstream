import { useState } from 'react';
import { ChevronDown, ChevronUp, Play, ExternalLink, Clock, Calendar, Film } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSeasonsWithEpisodes } from '@/hooks/useSeasons';
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
  const [expandedSeasons, setExpandedSeasons] = useState<Set<string>>(new Set());
  const [expandedEpisodes, setExpandedEpisodes] = useState<Set<string>>(new Set());

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

  const toggleEpisode = (episodeId: string) => {
    setExpandedEpisodes(prev => {
      const next = new Set(prev);
      if (next.has(episodeId)) {
        next.delete(episodeId);
      } else {
        next.add(episodeId);
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

  const openExternalLink = (url: string) => {
    if (isPremium && !userIsPremium) {
      onPremiumRequired();
    } else {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  if (isLoading) {
    return (
      <div className="mt-8 p-6 bg-card rounded-lg">
        <div className="animate-pulse space-y-4">
          <div className="h-6 w-48 bg-muted rounded" />
          <div className="h-16 bg-muted rounded" />
          <div className="h-16 bg-muted rounded" />
        </div>
      </div>
    );
  }

  if (!seasons || seasons.length === 0) {
    return null;
  }

  return (
    <div className="mt-8">
      <h2 className="text-2xl font-bold text-foreground mb-4">Seasons and Episodes</h2>
      
      <div className="space-y-3">
        {seasons.map((season) => (
          <div key={season.id} className="bg-card rounded-lg overflow-hidden border border-border">
            {/* Season Header */}
            <button
              onClick={() => toggleSeason(season.id)}
              className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <ChevronDown 
                  className={`w-5 h-5 text-muted-foreground transition-transform ${
                    expandedSeasons.has(season.id) ? 'rotate-180' : ''
                  }`} 
                />
                <span className="font-semibold text-foreground">
                  Season {season.season_number}
                  {season.title && `: ${season.title}`}
                </span>
                <span className="text-sm text-muted-foreground">
                  ({season.episodes.length} episodes)
                </span>
              </div>
              <span className="text-sm text-muted-foreground">
                {season.episodes.length} episodes
              </span>
            </button>

            {/* Episodes List */}
            {expandedSeasons.has(season.id) && (
              <div className="border-t border-border">
                {season.episodes.map((episode) => (
                  <EpisodeItem
                    key={episode.id}
                    episode={episode}
                    seasonNumber={season.season_number}
                    isExpanded={expandedEpisodes.has(episode.id)}
                    onToggle={() => toggleEpisode(episode.id)}
                    onPlay={() => handlePlay(episode)}
                    onOpenLink={openExternalLink}
                  />
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

interface EpisodeItemProps {
  episode: Episode;
  seasonNumber: number;
  isExpanded: boolean;
  onToggle: () => void;
  onPlay: () => void;
  onOpenLink: (url: string) => void;
}

function EpisodeItem({ 
  episode, 
  seasonNumber, 
  isExpanded, 
  onToggle, 
  onPlay, 
  onOpenLink 
}: EpisodeItemProps) {
  const hasLinks = episode.stream_url || episode.telegram_url || episode.mega_url;

  return (
    <div className="border-b border-border last:border-b-0">
      {/* Episode Header */}
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-4 p-4 hover:bg-muted/30 transition-colors text-left"
      >
        {/* Thumbnail */}
        <div className="flex-shrink-0 w-24 h-16 md:w-32 md:h-20 bg-muted rounded overflow-hidden">
          {episode.thumbnail_url ? (
            <img 
              src={episode.thumbnail_url} 
              alt={episode.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Film className="w-6 h-6 text-muted-foreground" />
            </div>
          )}
        </div>

        {/* Episode Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
            <span>{seasonNumber}-{episode.episode_number}</span>
            {episode.air_date && (
              <>
                <span>•</span>
                <span>{new Date(episode.air_date).toLocaleDateString()}</span>
              </>
            )}
          </div>
          <h4 className="font-medium text-foreground truncate">
            Episode {episode.episode_number}: {episode.title}
          </h4>
          {episode.duration && (
            <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
              <Clock className="w-3 h-3" />
              <span>{episode.duration}</span>
            </div>
          )}
        </div>

        {/* Expand Icon */}
        <ChevronDown 
          className={`w-5 h-5 text-muted-foreground flex-shrink-0 transition-transform ${
            isExpanded ? 'rotate-180' : ''
          }`}
        />
      </button>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="px-4 pb-4 pl-[calc(6rem+1rem)] md:pl-[calc(8rem+1rem)]">
          {episode.description && (
            <p className="text-sm text-muted-foreground mb-4">
              {episode.description}
            </p>
          )}

          {hasLinks && (
            <div className="flex flex-wrap gap-2">
              {episode.stream_url && (
                <Button size="sm" className="gap-2" onClick={onPlay}>
                  <Play className="w-4 h-4 fill-current" />
                  Play
                </Button>
              )}
              {episode.telegram_url && (
                <Button 
                  size="sm" 
                  variant="secondary" 
                  className="gap-2"
                  onClick={() => onOpenLink(episode.telegram_url!)}
                >
                  <ExternalLink className="w-4 h-4" />
                  Telegram
                </Button>
              )}
              {episode.mega_url && (
                <Button 
                  size="sm" 
                  variant="secondary" 
                  className="gap-2"
                  onClick={() => onOpenLink(episode.mega_url!)}
                >
                  <ExternalLink className="w-4 h-4" />
                  MEGA
                </Button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
