import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Play,
  Crown,
  Calendar,
  Clock,
  Film,
  Users,
  ExternalLink,
  ArrowLeft,
  Bookmark,
  BookmarkCheck,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Navbar } from '@/components/Navbar';
import { MobileBottomNav } from '@/components/MobileBottomNav';
import { PremiumModal } from '@/components/PremiumModal';
import { useAuth } from '@/hooks/useAuth';
import { useMovie } from '@/hooks/useMovies';
import { useToast } from '@/hooks/use-toast';

export default function MovieDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, isPremium, isLoading: authLoading } = useAuth();
  const { data: movie, isLoading } = useMovie(id || '');
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [isInWatchlist, setIsInWatchlist] = useState(false);
  const { toast } = useToast();

  // Redirect if not logged in
  if (!authLoading && !user) {
    navigate('/auth');
    return null;
  }

  if (isLoading || authLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-20 px-4 md:px-8">
          <div className="animate-pulse space-y-4">
            <div className="h-[50vh] bg-muted rounded-lg" />
            <div className="h-8 w-1/3 bg-muted rounded" />
            <div className="h-4 w-1/2 bg-muted rounded" />
          </div>
        </div>
      </div>
    );
  }

  if (!movie) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-20 px-4 md:px-8 text-center">
          <h1 className="text-2xl font-bold mb-4">Movie Not Found</h1>
          <Button onClick={() => navigate('/')}>Back to Home</Button>
        </div>
      </div>
    );
  }

  const handlePlay = () => {
    if (movie.is_premium && !isPremium) {
      setShowPremiumModal(true);
    } else if (movie.stream_url) {
      window.open(movie.stream_url, '_blank', 'noopener,noreferrer');
    }
  };

  const openExternalLink = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const toggleWatchlist = () => {
    setIsInWatchlist(!isInWatchlist);
    toast({
      title: isInWatchlist ? "Removed from Watchlist" : "Added to Watchlist",
      description: isInWatchlist 
        ? `${movie.title} has been removed from your watchlist.`
        : `${movie.title} has been added to your watchlist.`,
    });
  };

  return (
    <div className="min-h-screen bg-background mobile-nav-spacing">
      <Navbar />

      {/* Backdrop */}
      <div className="relative h-[50vh] md:h-[70vh] overflow-hidden">
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
            className="absolute inset-0 w-full h-full object-cover opacity-50 blur-md"
          />
        ) : (
          <div className="absolute inset-0 bg-muted" />
        )}

        {/* Gradient overlays */}
        <div className="hero-gradient absolute inset-0" />
        <div className="hero-gradient-bottom absolute inset-0" />
      </div>

      {/* Content */}
      <div className="relative z-10 -mt-48 md:-mt-64 px-4 md:px-8 lg:px-16 pb-20">
        <div className="max-w-6xl mx-auto">
          {/* Back button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(-1)}
            className="mb-4 text-white hover:bg-white/10"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>

          <div className="flex flex-col md:flex-row gap-8">
            {/* Poster */}
            <div className="flex-shrink-0 w-48 md:w-64">
              {movie.poster_url ? (
                <img
                  src={movie.poster_url}
                  alt={movie.title}
                  className="w-full rounded-lg shadow-2xl"
                />
              ) : (
                <div className="w-full aspect-[2/3] bg-muted rounded-lg flex items-center justify-center">
                  <Film className="w-12 h-12 text-muted-foreground" />
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1">
              {/* Premium Badge */}
              {movie.is_premium && (
                <div className="premium-badge inline-flex items-center gap-1.5 px-3 py-1 rounded-full mb-4">
                  <Crown className="w-4 h-4 text-black" />
                  <span className="text-xs font-bold text-black uppercase">Premium</span>
                </div>
              )}

              <h1 className="text-3xl md:text-5xl font-bold text-white mb-4">
                {movie.title}
              </h1>

              {/* Meta info */}
              <div className="flex flex-wrap items-center gap-4 mb-6 text-sm text-white/70">
                {movie.year && (
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    <span>{movie.year}</span>
                  </div>
                )}
                {movie.resolution && (
                  <span className="px-2 py-0.5 bg-white/20 rounded text-xs font-medium">
                    {movie.resolution}
                  </span>
                )}
                {movie.file_size && (
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    <span>{movie.file_size}</span>
                  </div>
                )}
                {movie.category && (
                  <span className="px-2 py-0.5 bg-primary/20 rounded text-xs font-medium text-primary">
                    {movie.category}
                  </span>
                )}
              </div>

              {/* Director & Actors */}
              {movie.director && (
                <div className="mb-3">
                  <span className="text-muted-foreground text-sm">Director: </span>
                  <span className="text-foreground">{movie.director}</span>
                </div>
              )}
              {movie.actors && movie.actors.length > 0 && (
                <div className="mb-4 flex items-start gap-2">
                  <Users className="w-4 h-4 text-muted-foreground mt-1 flex-shrink-0" />
                  <span className="text-foreground">{movie.actors.join(', ')}</span>
                </div>
              )}

              {/* Description */}
              {movie.description && (
                <p className="text-muted-foreground mb-6 max-w-2xl">
                  {movie.description}
                </p>
              )}

              {/* Action buttons */}
              <div className="flex flex-wrap gap-3">
                {movie.stream_url && (
                  <Button
                    size="lg"
                    className="gap-2"
                    onClick={handlePlay}
                  >
                    <Play className="w-5 h-5 fill-current" />
                    {movie.is_premium && !isPremium ? 'Premium Only' : 'Play Now'}
                  </Button>
                )}

                {/* Watchlist Button */}
                <Button
                  size="lg"
                  variant={isInWatchlist ? "default" : "secondary"}
                  className="gap-2"
                  onClick={toggleWatchlist}
                >
                  {isInWatchlist ? (
                    <BookmarkCheck className="w-5 h-5" />
                  ) : (
                    <Bookmark className="w-5 h-5" />
                  )}
                </Button>

                {movie.telegram_url && (
                  <Button
                    size="lg"
                    variant="secondary"
                    className="gap-2"
                    onClick={() => openExternalLink(movie.telegram_url!)}
                  >
                    <ExternalLink className="w-5 h-5" />
                    Telegram
                  </Button>
                )}

                {movie.mega_url && (
                  <Button
                    size="lg"
                    variant="secondary"
                    className="gap-2"
                    onClick={() => openExternalLink(movie.mega_url!)}
                  >
                    <ExternalLink className="w-5 h-5" />
                    MEGA
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Premium Modal */}
      <PremiumModal open={showPremiumModal} onOpenChange={setShowPremiumModal} />
      
      <MobileBottomNav />
    </div>
  );
}
