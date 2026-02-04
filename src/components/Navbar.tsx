import { useState, ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Menu, X, LogOut, Settings, Crown, Sun, Moon } from 'lucide-react';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/hooks/useAuth';
import { LoginModal } from './LoginModal';

interface NavbarProps {
  children?: ReactNode;
}

export function Navbar({ children }: NavbarProps) {
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const { user, profile, role, isAdmin, signOut } = useAuth();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-xl border-b border-border/30">
        <div className="flex items-center justify-between px-4 md:px-8 h-16 max-w-[1920px] mx-auto">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <span className="text-2xl font-bold text-gradient">CineGeek</span>
            <span className="text-xs font-semibold px-2 py-0.5 premium-badge rounded text-black">
              PREMIUM
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6">
            <Link to="/" className="text-sm font-medium text-foreground hover:text-primary transition-colors">
              Home
            </Link>
            {user && (
              <>
                <Link to="/profile" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
                  My Profile
                </Link>
                {isAdmin && (
                  <Link to="/admin" className="text-sm font-medium text-cg-gold hover:text-cg-gold/80 transition-colors">
                    Admin
                  </Link>
                )}
              </>
            )}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-2 md:gap-3">
            {/* Search bar slot */}
            <div className="hidden md:block">
              {children}
            </div>

            {/* Theme toggle */}
            <Button variant="ghost" size="icon" onClick={toggleTheme} className="text-foreground">
              {theme === 'dark' ? (
                <Sun className="w-5 h-5" />
              ) : (
                <Moon className="w-5 h-5" />
              )}
            </Button>

            {/* User menu or Sign In */}
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="relative">
                    <User className="w-5 h-5" />
                    {role === 'premium' && (
                      <Crown className="w-3 h-3 absolute -top-1 -right-1 text-cg-gold" />
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 glass">
                  <div className="px-2 py-1.5">
                    <p className="text-sm font-medium">{profile?.display_name || 'User'}</p>
                    <p className="text-xs text-muted-foreground">{user.email}</p>
                    <div className="mt-1">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        role === 'admin' ? 'bg-cg-gold/20 text-cg-gold' :
                        role === 'premium' ? 'bg-cg-premium/20 text-cg-premium' :
                        'bg-muted text-muted-foreground'
                      }`}>
                        {role === 'admin' ? 'Admin' : role === 'premium' ? 'Premium' : 'Free'}
                      </span>
                    </div>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate('/profile')}>
                    <User className="w-4 h-4 mr-2" />
                    Profile
                  </DropdownMenuItem>
                  {isAdmin && (
                    <DropdownMenuItem onClick={() => navigate('/admin')}>
                      <Settings className="w-4 h-4 mr-2" />
                      Admin Dashboard
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut}>
                    <LogOut className="w-4 h-4 mr-2" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button onClick={() => setShowLoginModal(true)} size="sm">
                Sign In
              </Button>
            )}

            {/* Mobile menu button */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden glass border-t border-border">
            <div className="flex flex-col p-4 space-y-3">
              <Link
                to="/"
                className="text-sm font-medium py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                Home
              </Link>
              {user && (
                <>
                  <Link
                    to="/profile"
                    className="text-sm font-medium py-2 text-muted-foreground"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    My Profile
                  </Link>
                  {isAdmin && (
                    <Link
                      to="/admin"
                      className="text-sm font-medium py-2 text-cg-gold"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Admin Dashboard
                    </Link>
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </nav>

      <LoginModal open={showLoginModal} onOpenChange={setShowLoginModal} />
    </>
  );
}
