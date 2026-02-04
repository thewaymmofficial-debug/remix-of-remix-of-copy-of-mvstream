import { Film, Users, Crown, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useMovies } from '@/hooks/useMovies';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';

export default function AdminDashboard() {
  const { data: movies } = useMovies();

  const { data: usersData } = useQuery({
    queryKey: ['admin', 'users-count'],
    queryFn: async () => {
      // Get all user roles (admins can see all)
      const { data, error } = await supabase
        .from('user_roles')
        .select('role');

      if (error) throw error;

      const total = data?.length || 0;
      const premium = data?.filter(u => u.role === 'premium').length || 0;
      const admins = data?.filter(u => u.role === 'admin').length || 0;

      return { total, premium, admins };
    },
  });

  const stats = [
    {
      title: 'Total Movies',
      value: movies?.length || 0,
      icon: Film,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
    {
      title: 'Total Users',
      value: usersData?.total || 0,
      icon: Users,
      color: 'text-accent-foreground',
      bgColor: 'bg-accent/50',
    },
    {
      title: 'Premium Users',
      value: usersData?.premium || 0,
      icon: Crown,
      color: 'text-cg-gold',
      bgColor: 'bg-cg-gold/10',
    },
    {
      title: 'Premium Movies',
      value: movies?.filter(m => m.is_premium).length || 0,
      icon: TrendingUp,
      color: 'text-cg-premium',
      bgColor: 'bg-cg-premium/10',
    },
  ];

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Dashboard</h1>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((stat) => (
          <Card key={stat.title} className="glass">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                <stat.icon className={`w-4 h-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <Card className="glass">
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <a
              href="/admin/movies"
              className="p-4 bg-muted rounded-lg hover:bg-muted/80 transition-colors"
            >
              <Film className="w-8 h-8 text-primary mb-2" />
              <h3 className="font-semibold">Manage Movies</h3>
              <p className="text-sm text-muted-foreground">
                Add, edit, or delete movies
              </p>
            </a>
            <a
              href="/admin/users"
              className="p-4 bg-muted rounded-lg hover:bg-muted/80 transition-colors"
            >
              <Users className="w-8 h-8 text-accent-foreground mb-2" />
              <h3 className="font-semibold">Manage Users</h3>
              <p className="text-sm text-muted-foreground">
                View and upgrade user accounts
              </p>
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
