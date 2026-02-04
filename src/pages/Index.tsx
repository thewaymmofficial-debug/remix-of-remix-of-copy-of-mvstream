import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { HeroBanner } from '@/components/HeroBanner';
import { MovieRow } from '@/components/MovieRow';
import { MovieCard } from '@/components/MovieCard';
import { ContinueWatchingCard } from '@/components/ContinueWatchingCard';
import { LoginModal } from '@/components/LoginModal';
import { MobileBottomNav } from '@/components/MobileBottomNav';
import { MovieQuickPreview } from '@/components/MovieQuickPreview';
import { SkeletonRow } from '@/components/SkeletonCard';
import { useAuth } from '@/hooks/useAuth';
import { useFeaturedMovies, useMoviesByCategory, useWatchlist } from '@/hooks/useMovies';
import { useContinueWatching, useRemoveFromHistory } from '@/hooks/useWatchHistory';
import { useTrendingMovies } from '@/hooks/useTrending';
import { useRecommendations } from '@/hooks/useRecommendations';
import { useFilter } from '@/contexts/FilterContext';
import { ChevronLeft, ChevronRight, Flame, Sparkles } from 'lucide-react';
import type { Movie } from '@/types/database';
import { useRef } from 'react';

const Index = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: featuredMovies } = useFeaturedMovies();
  const { data: moviesByCategory, isLoading } = useMoviesByCategory();
  const { data: watchlistData } = useWatchlist();
  const { data: continueWatching } = useContinueWatching();
  const { data: trendingMovies } = useTrendingMovies();
  const { data: recommendations } = useRecommendations();
  const removeFromHistory = useRemoveFromHistory();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [previewMovie, setPreviewMovie] = useState<Movie | null>(null);
  const { searchQuery, selectedCategory, selectedYear } = useFilter();
  const continueWatchingRef = useRef<HTMLDivElement>(null);

  // Get all unique categories and years for filters
  const { categories, years } = useMemo(() => {
    if (!moviesByCategory) return { categories: [], years: [] };
    
    const allMovies = Object.values(moviesByCategory).flat();
    const uniqueCategories = [...new Set(Object.keys(moviesByCategory))].sort();
    const uniqueYears = [...new Set(allMovies.map(m => m.year).filter(Boolean) as number[])].sort((a, b) => b - a);
    
    return { categories: uniqueCategories, years: uniqueYears };
  }, [moviesByCategory]);

  // Filter movies based on search, category, and year
  const filteredMoviesByCategory = useMemo(() => {
    if (!moviesByCategory) return {};

    let result: Record<string, Movie[]> = {};

    // If a specific category is selected, only show that category
    const categoriesToProcess = selectedCategory !== 'all' 
      ? [selectedCategory] 
      : Object.keys(moviesByCategory);

    for (const cat of categoriesToProcess) {
      if (!moviesByCategory[cat]) continue;

      let movies = moviesByCategory[cat];

      // Filter by year
      if (selectedYear !== 'all') {
        movies = movies.filter(m => m.year?.toString() === selectedYear);
      }

      // Filter by search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        movies = movies.filter(m => 
          m.title.toLowerCase().includes(query) ||
          m.description?.toLowerCase().includes(query) ||
          m.director?.toLowerCase().includes(query)
        );
      }

      if (movies.length > 0) {
        result[cat] = movies;
      }
    }

    return result;
  }, [moviesByCategory, searchQuery, selectedCategory, selectedYear]);

  // Get watchlist movies
  const watchlistMovies = useMemo(() => {
    if (!watchlistData) return [];
    return watchlistData.map(item => item.movie);
  }, [watchlistData]);

  const handleMovieClick = (movie: Movie) => {
    if (!user) {
      setShowLoginModal(true);
    } else {
      setPreviewMovie(movie);
    }
  };

  const handlePlay = (movie: Movie) => {
    if (!user) {
      setShowLoginModal(true);
    } else {
      navigate(`/movie/${movie.id}`);
    }
  };

  const handleMoreInfo = (movie: Movie) => {
    if (!user) {
      setShowLoginModal(true);
    } else {
      navigate(`/movie/${movie.id}`);
    }
  };

  const scrollContinueWatching = (direction: 'left' | 'right') => {
    if (continueWatchingRef.current) {
      const scrollAmount = 400;
      continueWatchingRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  // Define category display order
  const categoryOrder = [
    'Latest',
    'Action',
    'K-Drama',
    'Hollywood',
    'Thriller',
    'Comedy',
    'Romance',
    'Horror',
    'Sci-Fi',
    'Documentary',
  ];

  // Sort categories by preference, then alphabetically for unlisted ones
  const sortedCategories = Object.keys(filteredMoviesByCategory).sort((a, b) => {
    const indexA = categoryOrder.indexOf(a);
    const indexB = categoryOrder.indexOf(b);
    if (indexA === -1 && indexB === -1) return a.localeCompare(b);
    if (indexA === -1) return 1;
    if (indexB === -1) return -1;
    return indexA - indexB;
  });

  const hasNoResults = Object.keys(filteredMoviesByCategory).length === 0 && !isLoading;
  const isFiltering = searchQuery.trim() || selectedCategory !== 'all' || selectedYear !== 'all';

  return (
    <div className="min-h-screen bg-background mobile-nav-spacing">
      <Navbar categories={categories} years={years} />

      {/* Hero Section */}
      <HeroBanner
        movies={featuredMovies || []}
        onPlay={handlePlay}
        onMoreInfo={handleMoreInfo}
      />

      {/* Movie Rows */}
      <div className="py-8 relative z-30 bg-background">
        {isLoading ? (
          <div className="px-4 md:px-8">
            <SkeletonRow />
            <SkeletonRow />
            <SkeletonRow />
          </div>
        ) : hasNoResults ? (
          <div className="text-center py-20">
            <p className="text-muted-foreground text-lg">
              {isFiltering 
                ? 'No movies match your filters. Try adjusting your search.'
                : 'No movies available yet. Check back soon!'
              }
            </p>
          </div>
        ) : (
          <>
            {/* Continue Watching Row */}
            {user && continueWatching && continueWatching.length > 0 && !isFiltering && (
              <section className="mb-10">
                <div className="flex items-center justify-between mb-5 px-4 md:px-8">
                  <h2 className="text-xl md:text-2xl font-bold text-foreground tracking-tight flex items-center gap-2">
                    Continue Watching
                  </h2>
                  <div className="flex gap-2">
                    <button
                      onClick={() => scrollContinueWatching('left')}
                      className="p-2.5 rounded-full bg-card/80 hover:bg-card border border-border/50 transition-all hover:scale-105"
                      aria-label="Scroll left"
                    >
                      <ChevronLeft className="w-5 h-5 text-foreground" />
                    </button>
                    <button
                      onClick={() => scrollContinueWatching('right')}
                      className="p-2.5 rounded-full bg-card/80 hover:bg-card border border-border/50 transition-all hover:scale-105"
                      aria-label="Scroll right"
                    >
                      <ChevronRight className="w-5 h-5 text-foreground" />
                    </button>
                  </div>
                </div>
                <div ref={continueWatchingRef} className="scroll-row px-4 md:px-8">
                  {continueWatching.map((item) => (
                    <ContinueWatchingCard
                      key={item.id}
                      movie={item.movie}
                      progressPercent={item.progress_percent}
                      onResume={() => navigate(`/movie/${item.movie_id}`)}
                      onRemove={() => removeFromHistory.mutate(item.id)}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* Trending This Week */}
            {trendingMovies && trendingMovies.length > 0 && !isFiltering && (
              <MovieRow
                title="🔥 Trending This Week"
                movies={trendingMovies}
                onMovieClick={handleMovieClick}
              />
            )}

            {/* Personalized Recommendations */}
            {user && recommendations && recommendations.length > 0 && !isFiltering && (
              <section className="mb-10">
                <div className="flex items-center justify-between mb-5 px-4 md:px-8">
                  <h2 className="text-xl md:text-2xl font-bold text-foreground tracking-tight flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-cg-gold" />
                    Because You Watched {recommendations[0]?.basedOnTitle}
                  </h2>
                </div>
                <div className="flex gap-3 overflow-x-auto pb-4 px-4 md:px-8 scrollbar-hide">
                  {recommendations.map((rec) => (
                    <MovieCard
                      key={rec.movie.id}
                      movie={rec.movie}
                      onClick={() => handleMovieClick(rec.movie)}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* My Watchlist Row */}
            {user && watchlistMovies.length > 0 && !isFiltering && (
              <section className="mb-10">
                <div className="flex items-center justify-between mb-5 px-4 md:px-8">
                  <h2 className="text-xl md:text-2xl font-bold text-foreground tracking-tight">My Watchlist</h2>
                </div>
                <div className="flex gap-3 overflow-x-auto pb-4 px-4 md:px-8 scrollbar-hide">
                  {watchlistMovies.map((movie) => (
                    <MovieCard
                      key={movie.id}
                      movie={movie}
                      onClick={() => handleMovieClick(movie)}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* Category Rows */}
            {sortedCategories.map((category) => (
              <MovieRow
                key={category}
                title={category}
                movies={filteredMoviesByCategory[category]}
                onMovieClick={handleMovieClick}
              />
            ))}
          </>
        )}
      </div>

      {/* Footer */}
      <footer className="py-8 border-t border-border">
        <div className="text-center text-sm text-muted-foreground">
          <p>© 2024 Ceniverse Premium. All rights reserved.</p>
        </div>
      </footer>

      <MobileBottomNav />
      <LoginModal open={showLoginModal} onOpenChange={setShowLoginModal} />
      <MovieQuickPreview 
        movie={previewMovie} 
        open={!!previewMovie} 
        onOpenChange={(open) => !open && setPreviewMovie(null)} 
      />
    </div>
  );
};

export default Index;
