import { useState, useMemo } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, RefreshCw } from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { MovieCard } from '@/components/MovieCard';
import { MovieQuickPreview } from '@/components/MovieQuickPreview';

import { MobileBottomNav } from '@/components/MobileBottomNav';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { FadeIn } from '@/components/FadeIn';
import { useMovies, useFeaturedMovies } from '@/hooks/useMovies';
import { useTrendingMovies } from '@/hooks/useTrending';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/contexts/LanguageContext';
import type { Movie } from '@/types/database';

const filterConfig: Record<string, { titleEn: string; titleMm: string; emoji: string }> = {
  movie: { titleEn: 'Movies', titleMm: 'ရုပ်ရှင်', emoji: '🍿' },
  series: { titleEn: 'Series', titleMm: 'စီးရီး', emoji: '📺' },
  'K-Drama': { titleEn: 'K-Drama', titleMm: 'K-Drama', emoji: '🎬' },
  trending: { titleEn: 'Trending Movies', titleMm: 'ခေတ်စား ရုပ်ရှင်', emoji: '⭐' },
  'trending-series': { titleEn: 'Trending Series', titleMm: 'ခေတ်စား စီးရီး', emoji: '📈' },
  Hollywood: { titleEn: 'Hollywood', titleMm: 'Hollywood', emoji: '🏆' },
  Action: { titleEn: 'Action', titleMm: 'Action', emoji: '💥' },
  featured: { titleEn: "Editor's Choice", titleMm: "Editor's Choice", emoji: '✨' },
  Comedy: { titleEn: 'Comedy', titleMm: 'Comedy', emoji: '😂' },
  'football-replay': { titleEn: 'Football Replay', titleMm: 'ဘောလုံးပြန်ကြည့်', emoji: '⚽' },
  'football-highlight': { titleEn: 'Highlight', titleMm: 'Highlight', emoji: '🏅' },
  mystery: { titleEn: 'Mystery Box', titleMm: 'Mystery Box', emoji: '📦' },
};

const Browse = () => {
  const { filter } = useParams<{ filter: string }>();
  const [searchParams] = useSearchParams();
  const categoryFromQuery = searchParams.get('category');
  const activeFilter = filter || categoryFromQuery || undefined;
  const navigate = useNavigate();
  const { user } = useAuth();
  const { language } = useLanguage();
  
  const [previewMovie, setPreviewMovie] = useState<Movie | null>(null);

  const categoryToQuery = useMemo(() => {
    if (!activeFilter) return undefined;
    if (['trending', 'trending-series', 'featured', 'movie', 'series'].includes(activeFilter)) {
      return undefined;
    }
    return activeFilter;
  }, [activeFilter]);

  const { data: allMovies, isLoading: moviesLoading, refetch } = useMovies(categoryToQuery);
  const { data: trendingMovies, isLoading: trendingLoading } = useTrendingMovies(50);
  const { data: featuredMovies, isLoading: featuredLoading } = useFeaturedMovies();

  const movies = useMemo(() => {
    if (!activeFilter) return [];

    if (activeFilter === 'trending') {
      return (trendingMovies || []).filter(m => m.content_type !== 'series');
    }
    if (activeFilter === 'trending-series') {
      return (trendingMovies || []).filter(m => m.content_type === 'series');
    }
    if (activeFilter === 'featured') {
      return featuredMovies || [];
    }
    if (activeFilter === 'movie') {
      return (allMovies || []).filter(m => m.content_type === 'movie' || !m.content_type);
    }
    if (activeFilter === 'series') {
      return (allMovies || []).filter(m => m.content_type === 'series');
    }
    return allMovies || [];
  }, [activeFilter, allMovies, trendingMovies, featuredMovies]);

  const isLoading = moviesLoading || (activeFilter === 'trending' || activeFilter === 'trending-series' ? trendingLoading : false) || (activeFilter === 'featured' ? featuredLoading : false);

  const config = activeFilter ? filterConfig[activeFilter] : undefined;
  const title = config
    ? `${config.emoji} ${language === 'mm' ? config.titleMm : config.titleEn}`
    : activeFilter || 'Browse';

  const handleMovieClick = (movie: Movie) => {
    if (!user) {
      navigate(`/auth?returnUrl=${encodeURIComponent(`/movie/${movie.id}`)}`);
    } else {
      setPreviewMovie(movie);
    }
  };

  return (
    <div className="min-h-screen bg-background mobile-nav-spacing">
      <Navbar />

      <div className="pt-16 px-4 md:px-8 pb-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => navigate('/')}
            className="p-2 rounded-full bg-card border border-border hover:bg-muted transition-colors"
            aria-label="Go back"
          >
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">{title}</h1>
        </div>

        {/* Content */}
        {isLoading ? (
          <LoadingSpinner message="Loading movies..." />
        ) : movies.length === 0 ? (
          <FadeIn>
            <div className="text-center py-20">
              <p className="text-muted-foreground text-lg mb-4">
                No content available yet. Check back soon!
              </p>
              <button
                onClick={() => refetch()}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm bg-muted hover:bg-muted/80 rounded-lg transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                Refresh
              </button>
            </div>
          </FadeIn>
        ) : (
          <FadeIn>
            <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 md:gap-4">
              {movies.map((movie) => (
                <MovieCard
                  key={movie.id}
                  movie={movie}
                  onClick={() => handleMovieClick(movie)}
                />
              ))}
            </div>
          </FadeIn>
        )}
      </div>

      <MobileBottomNav />
      
      <MovieQuickPreview
        movie={previewMovie}
        open={!!previewMovie}
        onOpenChange={(open) => !open && setPreviewMovie(null)}
      />
    </div>
  );
};

export default Browse;
