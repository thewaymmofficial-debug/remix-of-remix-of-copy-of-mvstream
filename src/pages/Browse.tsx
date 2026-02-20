import { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, RefreshCw, ChevronLeft, ChevronRight, Clock } from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { MovieCard } from '@/components/MovieCard';
import { MovieQuickPreview } from '@/components/MovieQuickPreview';
import { MovieRow } from '@/components/MovieRow';
import { MobileBottomNav } from '@/components/MobileBottomNav';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { FadeIn } from '@/components/FadeIn';
import { useMovies, useFeaturedMovies } from '@/hooks/useMovies';
import { useTrendingMovies } from '@/hooks/useTrending';
import { useRecentlyWatched } from '@/hooks/useWatchHistory';
import { useCategories } from '@/hooks/useCategories';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/contexts/LanguageContext';
import { useIsMobile } from '@/hooks/use-mobile';
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
  const isMobile = useIsMobile();

  const [previewMovie, setPreviewMovie] = useState<Movie | null>(null);
  const [page, setPage] = useState(1);

  useEffect(() => {
    setPage(1);
  }, [activeFilter]);

  const pageSize = isMobile ? 20 : 30;

  // Whether to show category-row layout
  const isCategoryView = activeFilter === 'movie' || activeFilter === 'series';

  const recentlyWatchedType = isCategoryView ? activeFilter : undefined;
  const { data: recentlyWatched } = useRecentlyWatched(recentlyWatchedType, 5);

  // Fetch all movies for category view or specific category
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
  const { data: categories } = useCategories();

  // For category view: group movies by category
  const categoryGroups = useMemo(() => {
    if (!isCategoryView || !allMovies || !categories) return [];

    const contentType = activeFilter as 'movie' | 'series';
    const filtered = allMovies.filter(m =>
      contentType === 'movie'
        ? m.content_type === 'movie' || !m.content_type
        : m.content_type === 'series'
    );

    return categories
      .map(cat => {
        const moviesInCat = filtered.filter(m =>
          m.category && m.category.includes(cat.name)
        );
        return { name: cat.name, movies: moviesInCat, count: moviesInCat.length };
      })
      .filter(g => g.movies.length > 0);
  }, [isCategoryView, allMovies, categories, activeFilter]);

  // For flat grid views (trending, featured, specific category, etc.)
  const movies = useMemo(() => {
    if (!activeFilter || isCategoryView) return [];

    if (activeFilter === 'trending') {
      return (trendingMovies || []).filter(m => m.content_type !== 'series');
    }
    if (activeFilter === 'trending-series') {
      return (trendingMovies || []).filter(m => m.content_type === 'series');
    }
    if (activeFilter === 'featured') {
      return featuredMovies || [];
    }
    return allMovies || [];
  }, [activeFilter, isCategoryView, allMovies, trendingMovies, featuredMovies]);

  const isLoading = moviesLoading || (activeFilter === 'trending' || activeFilter === 'trending-series' ? trendingLoading : false) || (activeFilter === 'featured' ? featuredLoading : false);

  const config = activeFilter ? filterConfig[activeFilter] : undefined;
  const title = config
    ? `${config.emoji} ${language === 'mm' ? config.titleMm : config.titleEn}`
    : activeFilter || 'Browse';

  // Pagination (only for flat grid)
  const totalPages = Math.max(1, Math.ceil(movies.length / pageSize));
  const paginatedMovies = movies.slice((page - 1) * pageSize, page * pageSize);

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
            onClick={() => window.history.length > 1 ? navigate(-1) : navigate('/')}
            className="p-2 rounded-full bg-card border border-border hover:bg-muted transition-colors"
            aria-label="Go back"
          >
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">{title}</h1>
        </div>

        {/* Recently Watched Section */}
        {user && recentlyWatched && recentlyWatched.length > 0 && (
          <FadeIn>
            <div className="mb-8">
              <div className="flex items-center gap-2 mb-3">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <h2 className="text-lg font-semibold text-foreground">
                  {language === 'mm' ? 'မကြာသေးမီကကြည့်ခဲ့သည်' : 'Recently Watched'}
                </h2>
              </div>
              <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                {recentlyWatched.map((entry) => (
                  <MovieCard
                    key={entry.id}
                    movie={entry.movie}
                    onClick={() => handleMovieClick(entry.movie)}
                  />
                ))}
              </div>
            </div>
          </FadeIn>
        )}

        {/* Content */}
        {isLoading ? (
          <LoadingSpinner message="Loading movies..." />
        ) : isCategoryView ? (
          /* Category Row Layout for Movies / Series */
          categoryGroups.length === 0 ? (
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
              <div className="-mx-4 md:-mx-8">
                {categoryGroups.map((group) => (
                  <MovieRow
                    key={group.name}
                    title={`${group.name} (${group.count})`}
                    movies={group.movies.slice(0, 20)}
                    onMovieClick={handleMovieClick}
                    seeAllPath={`/browse?category=${encodeURIComponent(group.name)}`}
                  />
                ))}
              </div>
            </FadeIn>
          )
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
              {paginatedMovies.map((movie) => (
                <MovieCard
                  key={movie.id}
                  movie={movie}
                  onClick={() => handleMovieClick(movie)}
                />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-4 mt-8">
                <button
                  onClick={() => { setPage(p => Math.max(1, p - 1)); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                  disabled={page === 1}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-card border border-border hover:bg-muted transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span className="text-sm font-medium">Prev</span>
                </button>
                <span className="text-sm text-muted-foreground">
                  Page {page} of {totalPages}
                </span>
                <button
                  onClick={() => { setPage(p => Math.min(totalPages, p + 1)); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                  disabled={page === totalPages}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-card border border-border hover:bg-muted transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <span className="text-sm font-medium">Next</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
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
