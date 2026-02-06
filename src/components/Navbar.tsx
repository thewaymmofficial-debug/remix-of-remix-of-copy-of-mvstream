import { useState, ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, LogOut, Settings, Crown, Sun, Moon, Search } from 'lucide-react';
import cineverseLogo from '@/assets/cineverse-logo.png';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { useAuth } from '@/hooks/useAuth';
import { LoginModal } from './LoginModal';
import { LanguageToggle } from './LanguageToggle';
import { useFilter } from '@/contexts/FilterContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';

interface NavbarProps {
  children?: ReactNode;
  categories?: string[];
  years?: number[];
}

export function Navbar({ children, categories = [], years = [] }: NavbarProps) {
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const { user, profile, role, isAdmin, signOut } = useAuth();
  const { t } = useLanguage();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [searchSheetOpen, setSearchSheetOpen] = useState(false);
  const { searchQuery, setSearchQuery, selectedCategory, setSelectedCategory, selectedYear, setSelectedYear } = useFilter();

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 bg-black/95 backdrop-blur-xl border-b border-white/10">
        <div className="flex items-center justify-between px-4 md:px-6 h-14 max-w-[1920px] mx-auto">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 flex-shrink-0">
            <img src={cineverseLogo} alt="Cineverse" className="h-8 w-auto" />
            <span className="text-lg font-bold text-white tracking-wide">CINEVERSE</span>
          </Link>

          {/* Desktop: Search and Filters */}
          <div className="hidden md:flex items-center gap-3 flex-1 max-w-2xl mx-6">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50" />
              <Input
                type="text"
                placeholder="Search movies..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9 bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:bg-white/15 focus:border-white/30"
              />
            </div>

            {/* Category Filter */}
            {categories.length > 0 && (
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-32 h-9 bg-white/10 border-white/20 text-white text-sm">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border">
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {/* Year Filter */}
            {years.length > 0 && (
              <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger className="w-24 h-9 bg-white/10 border-white/20 text-white text-sm">
                  <SelectValue placeholder="Year" />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border">
                  <SelectItem value="all">All Years</SelectItem>
                  {years.map((year) => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-1.5">
            {/* Language toggle */}
            <LanguageToggle className="text-white border-white/20 hover:bg-white/10" />

            {/* Theme toggle */}
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className={cn(
                "text-white hover:bg-white/10 h-9 w-9",
                theme === 'dark' && "theme-toggle-ring"
              )}
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4" />
              ) : (
                <Moon className="w-4 h-4" />
              )}
            </Button>

            {/* Desktop: User menu or Sign In */}
            <div className="hidden md:block">
              {user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="relative text-white hover:bg-white/10 h-9 w-9">
                      <User className="w-4 h-4" />
                      {role === 'premium' && (
                        <Crown className="w-2.5 h-2.5 absolute -top-0.5 -right-0.5 text-cg-gold" />
                      )}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56 bg-popover border-border">
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
                <Button onClick={() => setShowLoginModal(true)} size="sm" className="h-8 text-xs">
                  {t('signIn')}
                </Button>
              )}
            </div>

            {/* Mobile search button */}
            <Sheet open={searchSheetOpen} onOpenChange={setSearchSheetOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="md:hidden text-white hover:bg-white/10 h-9 w-9"
                >
                  <Search className="w-4 h-4" />
                </Button>
              </SheetTrigger>
              <SheetContent side="top" className="bg-black/95 border-white/10">
                <SheetHeader className="text-left pb-4">
                  <SheetTitle className="text-white">Search</SheetTitle>
                </SheetHeader>
                <div className="space-y-3">
                  {/* Search Input */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50" />
                    <Input
                      type="text"
                      placeholder="Search movies..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9 bg-white/10 border-white/20 text-white placeholder:text-white/50"
                      autoFocus
                    />
                  </div>

                  {/* Filters */}
                  <div className="flex gap-2">
                    {categories.length > 0 && (
                      <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                        <SelectTrigger className="flex-1 bg-white/10 border-white/20 text-white text-sm">
                          <SelectValue placeholder="Category" />
                        </SelectTrigger>
                        <SelectContent className="bg-popover border-border">
                          <SelectItem value="all">All Categories</SelectItem>
                          {categories.map((cat) => (
                            <SelectItem key={cat} value={cat}>
                              {cat}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                    {years.length > 0 && (
                      <Select value={selectedYear} onValueChange={setSelectedYear}>
                        <SelectTrigger className="flex-1 bg-white/10 border-white/20 text-white text-sm">
                          <SelectValue placeholder="Year" />
                        </SelectTrigger>
                        <SelectContent className="bg-popover border-border">
                          <SelectItem value="all">All Years</SelectItem>
                          {years.map((year) => (
                            <SelectItem key={year} value={year.toString()}>
                              {year}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </nav>

      <LoginModal open={showLoginModal} onOpenChange={setShowLoginModal} />
    </>
  );
}
