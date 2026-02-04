import { useNavigate, Outlet, Link, useLocation } from 'react-router-dom';
import { Film, Users, LayoutDashboard, ArrowLeft, Tags, Settings, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Navbar } from '@/components/Navbar';
import { useAuth } from '@/hooks/useAuth';

export default function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAdmin, isLoading } = useAuth();

  // Redirect if not admin
  if (!isLoading && (!user || !isAdmin)) {
    navigate('/');
    return null;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-20 px-4 md:px-8 text-center">
          <div className="animate-pulse text-muted-foreground">Loading...</div>
        </div>
      </div>
    );
  }

  const navItems = [
    { path: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
    { path: '/admin/movies', label: 'Movies', icon: Film },
    { path: '/admin/categories', label: 'Categories', icon: Tags },
    { path: '/admin/users', label: 'Users', icon: Users },
    { path: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
    { path: '/admin/settings', label: 'Settings', icon: Settings },
  ];

  const isActive = (path: string, exact?: boolean) => {
    if (exact) return location.pathname === path;
    return location.pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="pt-20 flex">
        {/* Sidebar */}
        <aside className="hidden md:flex flex-col w-64 h-[calc(100vh-5rem)] fixed left-0 top-20 glass border-r border-border p-4">
          <div className="mb-6">
            <h2 className="text-lg font-bold text-cg-gold">Admin Dashboard</h2>
            <p className="text-xs text-muted-foreground">Manage your platform</p>
          </div>

          <nav className="flex-1 space-y-2">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                  isActive(item.path, item.exact)
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                <item.icon className="w-5 h-5" />
                {item.label}
              </Link>
            ))}
          </nav>

          <Button
            variant="ghost"
            onClick={() => navigate('/')}
            className="mt-auto justify-start"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Site
          </Button>
        </aside>

        {/* Mobile Navigation */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 glass border-t border-border p-2 z-40">
          <div className="flex justify-around">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`flex flex-col items-center gap-1 px-4 py-2 rounded-lg ${
                  isActive(item.path, item.exact)
                    ? 'text-primary'
                    : 'text-muted-foreground'
                }`}
              >
                <item.icon className="w-5 h-5" />
                <span className="text-xs">{item.label}</span>
              </Link>
            ))}
          </div>
        </div>

        {/* Main content */}
        <main className="flex-1 md:ml-64 p-4 md:p-8 pb-24 md:pb-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
