import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { HeroBanner } from '@/components/HeroBanner';
import { MovieRow } from '@/components/MovieRow';
import { LoginModal } from '@/components/LoginModal';
import { MobileBottomNav } from '@/components/MobileBottomNav';
import { useAuth } from '@/hooks/useAuth';
import { useFeaturedMovie, useMoviesByCategory, useWatchlist } from '@/hooks/useMovies';
import { useFilter } from '@/contexts/FilterContext';
import type { Movie } from '@/types/database';

const Index = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: featuredMovie } = useFeaturedMovie();
  const { data: moviesByCategory, isLoading } = useMoviesByCategory();
  const { data: watchlistData } = useWatchlist();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const { searchQuery, selectedCategory, selectedYear } = useFilter();

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
      navigate(`/movie/${movie.id}`);
    }
  };

  const handlePlay = () => {
    if (!user) {
      setShowLoginModal(true);
    } else if (featuredMovie) {
      navigate(`/movie/${featuredMovie.id}`);
    }
  };

  const handleMoreInfo = () => {
    if (!user) {
      setShowLoginModal(true);
    } else if (featuredMovie) {
      navigate(`/movie/${featuredMovie.id}`);
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
        movie={featuredMovie || null}
        onPlay={handlePlay}
        onMoreInfo={handleMoreInfo}
      />

      {/* Movie Rows */}
      <div className="py-8 -mt-20 relative z-10">
        {isLoading ? (
          <div className="px-4 md:px-8">
            <div className="animate-pulse space-y-8">
              {[1, 2, 3].map((i) => (
                <div key={i}>
                  <div className="h-6 w-32 bg-muted rounded mb-4" />
                  <div className="flex gap-3 overflow-hidden">
                    {[1, 2, 3, 4, 5].map((j) => (
                      <div key={j} className="flex-shrink-0 w-[180px] aspect-[2/3] bg-muted rounded-lg" />
                    ))}
                  </div>
                </div>
              ))}
            </div>
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
            {/* My Watchlist Row - Only show when logged in and has items */}
            {user && watchlistMovies.length > 0 && !isFiltering && (
              <MovieRow
                title="My Watchlist"
                movies={watchlistMovies}
                onMovieClick={handleMovieClick}
              />
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
    </div>
  );
};

export default Index;
