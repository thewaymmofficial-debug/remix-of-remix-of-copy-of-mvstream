import { useSearchParams, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';

export default function Watch() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const url = searchParams.get('url') || '';

  useEffect(() => {
    if (!url) {
      navigate('/', { replace: true });
      return;
    }

    // Open the streaming server directly in the current tab
    // The server's own player handles everything (controls, format, landscape)
    window.location.href = url;
  }, [url, navigate]);

  // Brief loading state while redirecting
  return (
    <div className="fixed inset-0 z-50 bg-black flex items-center justify-center">
      <div className="text-white text-sm">Redirecting to player...</div>
    </div>
  );
}
