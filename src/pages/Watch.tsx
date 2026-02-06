import { useSearchParams, useNavigate } from 'react-router-dom';
import { VideoPlayer } from '@/components/VideoPlayer';
import { useEffect } from 'react';

export default function Watch() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const url = searchParams.get('url') || '';
  const title = searchParams.get('title') || 'Video';

  useEffect(() => {
    if (!url) {
      navigate('/', { replace: true });
    }
  }, [url, navigate]);

  if (!url) return null;

  return (
    <VideoPlayer
      url={url}
      title={title}
      onClose={() => navigate(-1)}
    />
  );
}
