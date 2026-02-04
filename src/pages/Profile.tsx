import { useNavigate } from 'react-router-dom';
import { User, Mail, Calendar, Crown, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Navbar } from '@/components/Navbar';
import { useAuth } from '@/hooks/useAuth';

export default function Profile() {
  const navigate = useNavigate();
  const { user, profile, role, isLoading } = useAuth();

  // Redirect if not logged in
  if (!isLoading && !user) {
    navigate('/auth');
    return null;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-20 px-4 md:px-8 max-w-2xl mx-auto">
          <div className="animate-pulse space-y-4">
            <div className="h-40 bg-muted rounded-lg" />
            <div className="h-20 bg-muted rounded-lg" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="pt-24 pb-12 px-4 md:px-8 max-w-2xl mx-auto">
        {/* Back button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/')}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Home
        </Button>

        <h1 className="text-3xl font-bold mb-8">My Profile</h1>

        {/* Profile Card */}
        <Card className="glass mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Account Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Avatar placeholder */}
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center">
                {profile?.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt={profile.display_name || 'Avatar'}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <User className="w-10 h-10 text-muted-foreground" />
                )}
              </div>
              <div>
                <h2 className="text-xl font-semibold">
                  {profile?.display_name || 'User'}
                </h2>
                <p className="text-sm text-muted-foreground">{user?.email}</p>
              </div>
            </div>

            <div className="border-t border-border my-4" />

            {/* Email */}
            <div className="flex items-center gap-3">
              <Mail className="w-4 h-4 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="font-medium">{user?.email}</p>
              </div>
            </div>

            {/* Member since */}
            <div className="flex items-center gap-3">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Member Since</p>
                <p className="font-medium">
                  {profile?.created_at
                    ? new Date(profile.created_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })
                    : 'N/A'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Subscription Card */}
        <Card className="glass">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Crown className="w-5 h-5 text-cg-gold" />
              Subscription Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-lg font-semibold">
                  {role === 'admin'
                    ? 'Administrator'
                    : role === 'premium'
                    ? 'Premium Member'
                    : 'Free User'}
                </p>
                <p className="text-sm text-muted-foreground">
                  {role === 'admin'
                    ? 'Full access to all features and admin dashboard'
                    : role === 'premium'
                    ? 'Unlimited access to all content'
                    : 'Limited access to content'}
                </p>
              </div>
              <div
                className={`px-4 py-2 rounded-lg ${
                  role === 'admin'
                    ? 'bg-cg-gold/20 text-cg-gold'
                    : role === 'premium'
                    ? 'bg-cg-premium/20 text-cg-premium'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                <span className="font-semibold uppercase text-sm">
                  {role === 'admin' ? 'Admin' : role === 'premium' ? 'Premium' : 'Free'}
                </span>
              </div>
            </div>

            {role === 'free_user' && (
              <div className="mt-4 p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">
                  Upgrade to Premium to unlock all content. Contact an administrator for more information.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
