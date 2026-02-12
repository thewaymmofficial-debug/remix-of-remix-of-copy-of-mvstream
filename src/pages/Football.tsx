import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Play, Trophy, Crown, Wifi, Download, Video } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Navbar } from '@/components/Navbar';
import { MobileBottomNav } from '@/components/MobileBottomNav';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { FadeIn } from '@/components/FadeIn';
import { LoginRequiredModal } from '@/components/LoginRequiredModal';
import { useFootballVideos, useFootballCategories, FootballVideo } from '@/hooks/useFootball';
import { useAuth } from '@/hooks/useAuth';
import { useDownloadManager } from '@/contexts/DownloadContext';

export default function Football() {
  const navigate = useNavigate();
  const { user, isPremium } = useAuth();
  const { startDownload } = useDownloadManager();
  const { data: videos, isLoading } = useFootballVideos();
  const { data: categories } = useFootballCategories();
  const [activeCategory, setActiveCategory] = useState('all');
  const [loginModal, setLoginModal] = useState(false);

  const filteredVideos = useMemo(() => {
    if (!videos) return [];
    if (activeCategory === 'all') return videos;
    return videos.filter(v => v.category === activeCategory);
  }, [videos, activeCategory]);

  const liveVideos = useMemo(() => filteredVideos.filter(v => v.is_live), [filteredVideos]);
  const highlightVideos = useMemo(() => filteredVideos.filter(v => !v.is_live), [filteredVideos]);

  const handlePlay = (video: FootballVideo) => {
    if (video.is_premium && !isPremium) {
      setLoginModal(true);
      return;
    }
    if (video.stream_url) {
      navigate(`/watch?url=${encodeURIComponent(video.stream_url)}`);
    }
  };

  const handleDownload = (video: FootballVideo) => {
    if (!user) {
      setLoginModal(true);
      return;
    }
    if (video.is_premium && !isPremium) {
      setLoginModal(true);
      return;
    }
    if (video.download_url) {
      startDownload({
        movieId: video.id,
        title: video.title,
        url: video.download_url,
        posterUrl: video.thumbnail_url,
        year: null,
        resolution: null,
        fileSize: null,
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="pt-16 pb-24 md:pb-8">
        {/* Header */}
        <div className="px-4 py-4 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="rounded-full">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <Trophy className="w-5 h-5" />
            ဘောလုံး
          </h1>
        </div>

        {/* Category Tabs */}
        {categories && categories.length > 0 && (
          <div className="px-4 pb-3">
            <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
              <Button
                size="sm"
                variant={activeCategory === 'all' ? 'default' : 'outline'}
                className="shrink-0 text-xs"
                onClick={() => setActiveCategory('all')}
              >
                All
              </Button>
              {categories.map((cat) => (
                <Button
                  key={cat}
                  size="sm"
                  variant={activeCategory === cat ? 'default' : 'outline'}
                  className="shrink-0 text-xs"
                  onClick={() => setActiveCategory(cat)}
                >
                  {cat}
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Content */}
        <div className="px-4">
          {isLoading ? (
            <LoadingSpinner message="Loading football..." />
          ) : filteredVideos.length === 0 ? (
            <FadeIn>
              <div className="text-center py-20">
                <Trophy className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No football videos yet</p>
              </div>
            </FadeIn>
          ) : (
            <FadeIn>
              {/* Live Section */}
              {liveVideos.length > 0 && (
                <div className="mb-6">
                  <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
                    <Wifi className="w-4 h-4 text-destructive" />
                    Live Now
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {liveVideos.map((video) => (
                      <VideoCard
                        key={video.id}
                        video={video}
                        onPlay={handlePlay}
                        onDownload={handleDownload}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Highlights Section */}
              {highlightVideos.length > 0 && (
                <div>
                  <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
                    <Video className="w-4 h-4" />
                    Highlights & Replays
                  </h2>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                    {highlightVideos.map((video) => (
                      <VideoCard
                        key={video.id}
                        video={video}
                        onPlay={handlePlay}
                        onDownload={handleDownload}
                      />
                    ))}
                  </div>
                </div>
              )}
            </FadeIn>
          )}
        </div>
      </div>

      <MobileBottomNav />
      <LoginRequiredModal open={loginModal} onOpenChange={setLoginModal} />
    </div>
  );
}

function VideoCard({
  video,
  onPlay,
  onDownload,
}: {
  video: FootballVideo;
  onPlay: (v: FootballVideo) => void;
  onDownload: (v: FootballVideo) => void;
}) {
  return (
    <div className="rounded-lg overflow-hidden bg-card border border-border group">
      {/* Thumbnail */}
      <div
        className="relative aspect-video bg-muted cursor-pointer"
        onClick={() => onPlay(video)}
      >
        {video.thumbnail_url ? (
          <img src={video.thumbnail_url} alt={video.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Trophy className="w-10 h-10 text-muted-foreground" />
          </div>
        )}

        {/* Overlay */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <Play className="w-10 h-10 text-white" fill="white" />
        </div>

        {/* Badges */}
        <div className="absolute top-2 left-2 flex gap-1">
          {video.is_live && (
            <Badge variant="destructive" className="text-[10px] h-5">
              <Wifi className="w-3 h-3 mr-0.5" />
              LIVE
            </Badge>
          )}
          {video.is_premium && (
            <Badge className="text-[10px] h-5 bg-cg-gold text-black">
              <Crown className="w-3 h-3 mr-0.5" />
              Premium
            </Badge>
          )}
        </div>
      </div>

      {/* Info */}
      <div className="p-2.5">
        <p className="text-sm font-medium line-clamp-2">{video.title}</p>
        <div className="flex items-center justify-between mt-2">
          <Badge variant="outline" className="text-[10px]">{video.category}</Badge>
          {video.download_url && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={(e) => {
                e.stopPropagation();
                onDownload(video);
              }}
            >
              <Download className="w-3.5 h-3.5" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
