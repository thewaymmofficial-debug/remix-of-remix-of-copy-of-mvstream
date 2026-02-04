import { Play, Info, Crown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Movie } from '@/types/database';

interface HeroBannerProps {
  movie: Movie | null;
  onPlay: () => void;
  onMoreInfo: () => void;
}

export function HeroBanner({ movie, onPlay, onMoreInfo }: HeroBannerProps) {
  if (!movie) {
    return (
      <div className="relative w-full h-[60vh] md:h-[80vh] bg-gradient-to-b from-muted to-background flex items-center justify-center">
        <div className="text-center px-4">
          <h1 className="text-4xl md:text-6xl font-bold mb-4 text-gradient">CineGeek Premium</h1>
          <p className="text-lg text-muted-foreground">Your ultimate streaming destination</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-[60vh] md:h-[80vh] overflow-hidden">
      {/* Backdrop Image */}
      {movie.backdrop_url ? (
        <img
          src={movie.backdrop_url}
          alt={movie.title}
          className="absolute inset-0 w-full h-full object-cover"
        />
      ) : movie.poster_url ? (
        <img
          src={movie.poster_url}
          alt={movie.title}
          className="absolute inset-0 w-full h-full object-cover opacity-50 blur-sm"
        />
      ) : (
        <div className="absolute inset-0 bg-muted" />
      )}

      {/* Gradient overlays */}
      <div className="hero-gradient absolute inset-0" />
      <div className="hero-gradient-bottom absolute inset-0" />

      {/* Content */}
      <div className="relative h-full flex flex-col justify-end pb-16 md:pb-24 px-4 md:px-8 lg:px-16 max-w-3xl">
        {/* Premium Badge */}
        {movie.is_premium && (
          <div className="premium-badge inline-flex items-center gap-1.5 px-3 py-1 rounded-full w-fit mb-4">
            <Crown className="w-4 h-4 text-black" />
            <span className="text-xs font-bold text-black uppercase">Premium</span>
          </div>
        )}

        {/* Title */}
        <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold text-white mb-4 animate-fade-up">
          {movie.title}
        </h1>

        {/* Meta info */}
        <div className="flex items-center gap-4 mb-4 text-sm text-white/80">
          {movie.year && <span>{movie.year}</span>}
          {movie.resolution && (
            <span className="px-2 py-0.5 bg-white/20 rounded text-xs font-medium">
              {movie.resolution}
            </span>
          )}
          {movie.category && <span>{movie.category}</span>}
        </div>

        {/* Description */}
        {movie.description && (
          <p className="text-base md:text-lg text-white/80 line-clamp-3 mb-6 max-w-xl">
            {movie.description}
          </p>
        )}

        {/* Buttons */}
        <div className="flex items-center gap-3">
          <Button
            size="lg"
            className="gap-2 text-base font-semibold tv-focus"
            onClick={onPlay}
          >
            <Play className="w-5 h-5 fill-current" />
            Play
          </Button>
          <Button
            size="lg"
            variant="secondary"
            className="gap-2 text-base font-semibold glass tv-focus"
            onClick={onMoreInfo}
          >
            <Info className="w-5 h-5" />
            More Info
          </Button>
        </div>
      </div>
    </div>
  );
}
