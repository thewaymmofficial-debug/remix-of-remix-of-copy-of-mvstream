import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, ChevronRight, RefreshCw, Smartphone, Sun, Moon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import cineverseLogo from '@/assets/cineverse-logo.png';

export default function Welcome() {
  const navigate = useNavigate();
  const { user, profile, role, premiumExpiresAt, isLoading } = useAuth();
  const { t } = useLanguage();
  const { theme, setTheme } = useTheme();
  const [countdown, setCountdown] = useState(5);

  // Auto-redirect after 5 seconds
  useEffect(() => {
    if (countdown <= 0) {
      navigate('/');
      return;
    }
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown, navigate]);

  // Redirect if not logged in
  useEffect(() => {
    if (!isLoading && !user) {
      navigate('/auth');
    }
  }, [user, isLoading, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">{t('loading')}</div>
      </div>
    );
  }

  const planLabel =
    role === 'admin'
      ? t('administrator')
      : role === 'premium'
      ? t('premiumMember')
      : t('freeUser');

  const expiryText = premiumExpiresAt
    ? new Date(premiumExpiresAt).toLocaleDateString()
    : 'N/A';

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Theme toggle top-right */}
      <div className="flex justify-end px-4 py-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="h-9 w-9"
        >
          {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </Button>
      </div>

      {/* Success Banner */}
      <div className="mx-4 mb-6 flex items-center gap-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl px-4 py-3">
        <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0" />
        <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
          Login Successful
        </span>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col items-center px-6 pb-8">
        {/* Avatar */}
        <div className="relative mb-4">
          <div className="w-24 h-24 rounded-full bg-card border-2 border-border flex items-center justify-center overflow-hidden">
            {profile?.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt="Avatar"
                className="w-full h-full object-cover"
              />
            ) : (
              <img src={cineverseLogo} alt="Cineverse" className="w-16 h-16 object-contain" />
            )}
          </div>
        </div>

        {/* User info */}
        <h2 className="text-xl font-bold text-foreground mb-1">
          {profile?.display_name || 'User'}
        </h2>
        <p className="text-sm text-muted-foreground mb-6">{user?.email}</p>

        {/* Plan Card */}
        <div className="w-full max-w-sm bg-card rounded-xl border border-border p-4 mb-6">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-muted-foreground">Plan</span>
            <span
              className={cn(
                'text-xs font-semibold px-3 py-1 rounded-full',
                role === 'admin'
                  ? 'bg-yellow-500/20 text-yellow-500'
                  : role === 'premium'
                  ? 'bg-purple-500/20 text-purple-500'
                  : 'bg-muted text-muted-foreground'
              )}
            >
              {planLabel}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Expires</span>
            <span className="text-sm font-medium text-foreground">{expiryText}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="w-full max-w-sm space-y-3 mb-8">
          <Button
            onClick={() => navigate('/')}
            className="w-full h-12 rounded-xl font-semibold text-base"
          >
            Browse Movies
            <ChevronRight className="w-5 h-5 ml-1" />
          </Button>

          <Button
            variant="outline"
            onClick={() => window.location.reload()}
            className="w-full h-12 rounded-xl font-semibold text-base border-border"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh News
          </Button>

          <Button
            variant="outline"
            onClick={() => navigate('/profile')}
            className="w-full h-12 rounded-xl font-semibold text-base border-border"
          >
            <Smartphone className="w-4 h-4 mr-2" />
            Active Devices
          </Button>
        </div>

        {/* Social Links */}
        <div className="mt-auto text-center">
          <p className="text-sm text-muted-foreground mb-3">{t('followUs')}</p>
          <div className="flex items-center justify-center gap-6">
            <a
              href="https://facebook.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
              </svg>
            </a>
            <a
              href="https://tiktok.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
              </svg>
            </a>
            <a
              href="https://t.me"
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 24 24">
                <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
              </svg>
            </a>
          </div>
        </div>

        {/* Version & countdown */}
        <p className="text-center text-xs text-muted-foreground mt-6">
          {t('version')} 1.0.0 • Redirecting in {countdown}s
        </p>
      </div>
    </div>
  );
}
