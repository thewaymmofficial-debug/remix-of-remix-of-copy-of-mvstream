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

  // Build meta info string
  const metaParts: string[] = [];
  if (movie.year) metaParts.push(movie.year.toString());
  if (movie.category) metaParts.push(movie.category);
  if (movie.resolution) metaParts.push(movie.resolution);
  if (movie.director) metaParts.push(`Dir. ${movie.director}`);

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
      <div className="relative h-full flex flex-col justify-end pb-24 md:pb-32 px-4 md:px-8 lg:px-16 max-w-4xl">
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

        {/* Meta info - Year · Category · Resolution · Dir. Name */}
        {metaParts.length > 0 && (
          <div className="flex items-center flex-wrap gap-2 mb-5 text-sm md:text-base">
            {metaParts.map((part, index) => (
              <span key={index} className="flex items-center">
                {index > 0 && <span className="text-white/40 mx-2">·</span>}
                <span className="text-white/90 font-medium">{part}</span>
              </span>
            ))}
          </div>
        )}

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
