import { useState } from 'react';
import { Search, Crown, User, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import type { AppRole } from '@/types/database';

interface UserWithRole {
  user_id: string;
  role: AppRole;
  created_at: string;
  email: string | null;
  display_name: string | null;
}

export default function UsersAdmin() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');

  const { data: users, isLoading } = useQuery({
    queryKey: ['admin', 'users'],
    queryFn: async () => {
      // Get all user roles with profile data
      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role, created_at');

      if (rolesError) throw rolesError;

      // Get profiles for these users
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, email, display_name');

      if (profilesError) throw profilesError;

      // Merge the data
      const usersWithRoles: UserWithRole[] = (roles || []).map((role) => {
        const profile = profiles?.find((p) => p.id === role.user_id);
        return {
          user_id: role.user_id,
          role: role.role as AppRole,
          created_at: role.created_at,
          email: profile?.email || null,
          display_name: profile?.display_name || null,
        };
      });

      return usersWithRoles;
    },
  });

  const updateRole = useMutation({
    mutationFn: async ({ userId, newRole }: { userId: string; newRole: AppRole }) => {
      const { error } = await supabase
        .from('user_roles')
        .update({ role: newRole })
        .eq('user_id', userId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      toast.success('User role updated');
    },
    onError: (error) => {
      toast.error('Failed to update role: ' + error.message);
    },
  });

  const filteredUsers = users?.filter(
    (user) =>
      user.email?.toLowerCase().includes(search.toLowerCase()) ||
      user.display_name?.toLowerCase().includes(search.toLowerCase())
  );

  const getRoleIcon = (role: AppRole) => {
    switch (role) {
      case 'admin':
        return <Shield className="w-4 h-4 text-cg-gold" />;
      case 'premium':
        return <Crown className="w-4 h-4 text-cg-premium" />;
      default:
        return <User className="w-4 h-4 text-muted-foreground" />;
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Users</h1>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search users..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10 bg-muted"
        />
      </div>

      {/* Users Table */}
      <Card className="glass">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 text-center text-muted-foreground">Loading...</div>
          ) : filteredUsers && filteredUsers.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.user_id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        {getRoleIcon(user.role)}
                        {user.display_name || 'Unknown'}
                      </div>
                    </TableCell>
                    <TableCell>{user.email || 'N/A'}</TableCell>
                    <TableCell>
                      {new Date(user.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                          user.role === 'admin'
                            ? 'bg-cg-gold/20 text-cg-gold'
                            : user.role === 'premium'
                            ? 'bg-cg-premium/20 text-cg-premium'
                            : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        {user.role === 'admin'
                          ? 'Admin'
                          : user.role === 'premium'
                          ? 'Premium'
                          : 'Free User'}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <Select
                        value={user.role}
                        onValueChange={(value: AppRole) =>
                          updateRole.mutate({ userId: user.user_id, newRole: value })
                        }
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="free_user">Free User</SelectItem>
                          <SelectItem value="premium">Premium</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="p-8 text-center text-muted-foreground">
              No users found.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
