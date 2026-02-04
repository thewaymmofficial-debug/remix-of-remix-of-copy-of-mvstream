import { Home, Bookmark, Crown, User } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';

export function MobileBottomNav() {
  const location = useLocation();
  const { user, isAdmin } = useAuth();

  const navItems = [
    { icon: Home, label: 'Home', path: '/', show: true },
    { icon: Bookmark, label: 'Watchlist', path: '/watchlist', show: !!user },
    { icon: Crown, label: 'Admin', path: '/admin', show: isAdmin },
    { icon: User, label: user ? 'Profile' : 'Login', path: user ? '/profile' : '/auth', show: true },
  ].filter(item => item.show);

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-xl border-t border-border safe-area-bottom">
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path || 
            (item.path === '/admin' && location.pathname.startsWith('/admin'));
          
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex flex-col items-center justify-center gap-1 py-2 px-4 rounded-lg transition-all",
                isActive 
                  ? "text-primary" 
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <item.icon className={cn("w-5 h-5", isActive && "text-primary")} />
              <span className={cn(
                "text-xs font-medium",
                isActive && "text-primary"
              )}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
