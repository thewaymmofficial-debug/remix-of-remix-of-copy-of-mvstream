import { ArrowLeft, Bookmark } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { MobileBottomNav } from '@/components/MobileBottomNav';
import { MovieCard } from '@/components/MovieCard';
import { useAuth } from '@/hooks/useAuth';
import { useWatchlist } from '@/hooks/useMovies';

const Watchlist = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: watchlist, isLoading } = useWatchlist();

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center mobile-nav-spacing">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Please sign in to view your watchlist</p>
          <Link to="/auth" className="text-primary hover:underline">Sign In</Link>
        </div>
        <MobileBottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background mobile-nav-spacing">
      <Navbar />
      
      <main className="pt-20 px-4 md:px-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button 
            onClick={() => navigate(-1)}
            className="p-2 rounded-full hover:bg-muted transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3">
            <Bookmark className="w-6 h-6 text-primary" />
            <div>
              <h1 className="text-2xl md:text-3xl font-bold">My Watchlist</h1>
              <p className="text-sm text-muted-foreground">
                {watchlist?.length || 0} movie{watchlist?.length !== 1 ? 's' : ''} saved
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="aspect-[2/3] bg-muted rounded-lg animate-pulse" />
            ))}
          </div>
        ) : watchlist && watchlist.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {watchlist.map((item) => (
              <MovieCard
                key={item.id}
                movie={item.movie}
                onClick={() => navigate(`/movie/${item.movie.id}`)}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <Bookmark className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" />
            <h2 className="text-xl font-semibold mb-2">Your watchlist is empty</h2>
            <p className="text-muted-foreground mb-6">
              Start adding movies you want to watch later
            </p>
            <Link 
              to="/" 
              className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-lg hover:bg-primary/90 transition-colors"
            >
              Browse Movies
            </Link>
          </div>
        )}
      </main>

      <MobileBottomNav />
    </div>
  );
};

export default Watchlist;
