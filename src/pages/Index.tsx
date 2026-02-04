import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { HeroBanner } from '@/components/HeroBanner';
import { MovieRow } from '@/components/MovieRow';
import { LoginModal } from '@/components/LoginModal';
import { SearchBar } from '@/components/SearchBar';
import { MobileBottomNav } from '@/components/MobileBottomNav';
import { useAuth } from '@/hooks/useAuth';
import { useFeaturedMovie, useMoviesByCategory } from '@/hooks/useMovies';
import type { Movie } from '@/types/database';

const Index = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: featuredMovie } = useFeaturedMovie();
  const { data: moviesByCategory, isLoading } = useMoviesByCategory();
  const [showLoginModal, setShowLoginModal] = useState(false);

  // Flatten all movies for search
  const allMovies = useMemo(() => {
    if (!moviesByCategory) return [];
    return Object.values(moviesByCategory).flat();
  }, [moviesByCategory]);

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
  const sortedCategories = moviesByCategory
    ? Object.keys(moviesByCategory).sort((a, b) => {
        const indexA = categoryOrder.indexOf(a);
        const indexB = categoryOrder.indexOf(b);
        if (indexA === -1 && indexB === -1) return a.localeCompare(b);
        if (indexA === -1) return 1;
        if (indexB === -1) return -1;
        return indexA - indexB;
      })
    : [];

  return (
    <div className="min-h-screen mobile-nav-spacing">
      {/* Hero section with dark background */}
      <div className="bg-black">
        <Navbar>
          <SearchBar movies={allMovies} onMovieClick={handleMovieClick} />
        </Navbar>

        {/* Hero Section */}
        <HeroBanner
          movie={featuredMovie || null}
          onPlay={handlePlay}
          onMoreInfo={handleMoreInfo}
        />
      </div>

      {/* Content section with theme-aware background */}
      <div className="bg-content-bg">
        {/* Movie Rows */}
        <div className="py-8 -mt-24 relative z-10">
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
          ) : moviesByCategory && Object.keys(moviesByCategory).length > 0 ? (
            sortedCategories.map((category) => (
              <MovieRow
                key={category}
                title={category}
                movies={moviesByCategory[category]}
                onMovieClick={handleMovieClick}
              />
            ))
          ) : (
            <div className="text-center py-20">
              <p className="text-muted-foreground text-lg">
                No movies available yet. Check back soon!
              </p>
              {user && (
                <p className="text-sm text-muted-foreground mt-2">
                  Admins can add movies from the admin dashboard.
                </p>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <footer className="py-8 border-t border-border">
          <div className="text-center text-sm text-muted-foreground">
            <p>© 2024 Ceniverse Premium. All rights reserved.</p>
          </div>
        </footer>
      </div>

      <MobileBottomNav />
      <LoginModal open={showLoginModal} onOpenChange={setShowLoginModal} />
    </div>
  );
};

export default Index;
