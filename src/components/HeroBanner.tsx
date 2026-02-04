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
          <h1 className="text-4xl md:text-6xl font-bold mb-4 text-gradient">Ceniverse Premium</h1>
          <p className="text-lg text-muted-foreground">Your ultimate streaming destination</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-[65vh] md:h-[85vh] overflow-hidden">
      {/* Backdrop Image */}
      {movie.backdrop_url ? (
        <img
          src={movie.backdrop_url}
          alt={movie.title}
          className="absolute inset-0 w-full h-full object-cover object-top"
        />
      ) : movie.poster_url ? (
        <img
          src={movie.poster_url}
          alt={movie.title}
          className="absolute inset-0 w-full h-full object-cover opacity-60 blur-sm scale-110"
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-card to-background" />
      )}

      {/* Dark vignette overlay for better text contrast */}
      <div className="absolute inset-0 bg-black/30" />
      
      {/* Gradient overlays */}
      <div className="hero-gradient absolute inset-0" />
      <div className="hero-gradient-bottom absolute inset-0" />

      {/* Content */}
      <div className="relative h-full flex flex-col justify-end pb-20 md:pb-28 px-4 md:px-8 lg:px-16 max-w-4xl">
        {/* Premium Badge */}
        {movie.is_premium && (
          <div className="premium-badge inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full w-fit mb-5 shadow-lg">
            <Crown className="w-4 h-4 text-black" />
            <span className="text-xs font-bold text-black uppercase tracking-wide">Premium</span>
          </div>
        )}

        {/* Title */}
        <h1 className="text-4xl md:text-5xl lg:text-7xl font-bold text-white mb-4 animate-fade-up drop-shadow-2xl">
          {movie.title}
        </h1>

        {/* Meta info */}
        <div className="flex items-center gap-3 md:gap-4 mb-5 text-sm md:text-base">
          {movie.year && <span className="text-white/90 font-medium">{movie.year}</span>}
          {movie.resolution && (
            <span className="px-2.5 py-1 bg-white/20 backdrop-blur-sm rounded text-xs font-bold text-white uppercase tracking-wide">
              {movie.resolution}
            </span>
          )}
          {movie.category && <span className="text-white/90 font-medium">{movie.category}</span>}
        </div>

        {/* Description */}
        {movie.description && (
          <p className="text-base md:text-lg text-white/85 line-clamp-3 mb-8 max-w-2xl leading-relaxed drop-shadow">
            {movie.description}
          </p>
        )}

        {/* Buttons */}
        <div className="flex items-center gap-4">
          <Button
            size="lg"
            className="gap-2 text-base font-semibold tv-focus px-8 py-6 shadow-xl hover:shadow-primary/30"
            onClick={onPlay}
          >
            <Play className="w-5 h-5 fill-current" />
            Play Now
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="gap-2 text-base font-semibold tv-focus px-8 py-6 bg-white/10 border-white/30 text-white hover:bg-white/20 hover:text-white backdrop-blur-sm"
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
