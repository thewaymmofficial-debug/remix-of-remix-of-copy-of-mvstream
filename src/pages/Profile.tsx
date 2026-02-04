import { useNavigate } from 'react-router-dom';
import { User, Mail, Calendar, Crown, ArrowLeft, LogOut, MessageCircle, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Navbar } from '@/components/Navbar';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

// Custom Telegram icon
const TelegramIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
  </svg>
);

// Custom Viber icon  
const ViberIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M11.398.002C9.473.028 5.331.344 3.014 2.467 1.294 4.177.463 6.681.364 9.914c-.099 3.232-.228 9.303 5.705 11.086l.007.001-.004 2.528s-.037.975.631 1.176c.795.238 1.245-.494 1.994-1.28.41-.43.973-1.06 1.399-1.544 3.853.323 6.816-.416 7.15-.527.771-.259 5.129-.806 5.838-6.579.733-5.953-.344-9.717-2.26-11.397l-.001-.001c-.612-.59-3.065-2.269-8.715-2.344-.194-.003-.39-.006-.585-.004l-.125-.027zM11.5 1.585c.136-.002.272 0 .406.002 4.988.067 7.131 1.48 7.644 1.937v.002c1.628 1.42 2.467 4.739 1.833 9.903-.584 4.749-4.063 5.077-4.724 5.299-.275.092-2.896.744-6.274.528 0 0-2.485 2.994-3.262 3.771-.121.122-.266.169-.361.147-.134-.032-.17-.188-.168-.415l.02-4.088v-.007c-5.09-1.491-4.788-6.67-4.707-9.327.082-2.656.757-4.765 2.19-6.176 1.939-1.771 5.486-2.052 7.403-2.076zM11.97 4.38c-.104 0-.209.008-.315.012-.104.003-.207.02-.312.011-.21-.017-.367.143-.378.353a.355.355 0 0 0 .319.389c.253.025.507.014.761.008.206-.005.411-.011.617.003 1.453.099 2.636.648 3.483 1.86.441.631.692 1.347.763 2.117.014.15.025.301.05.45.038.225.208.37.415.361.21-.01.358-.168.353-.401-.015-.718-.147-1.404-.449-2.041-.741-1.566-1.974-2.527-3.652-2.789-.29-.046-.583-.068-.877-.08-.26-.01-.519-.021-.778-.024v-.219zm.36 1.256a.352.352 0 0 0-.354.349.35.35 0 0 0 .345.36c.15.006.3.012.45.03 1.066.136 1.779.699 2.122 1.69.085.246.122.506.146.765.017.177.148.319.333.336.214.019.388-.14.392-.367.002-.12-.01-.244-.035-.365-.212-1.032-.724-1.829-1.658-2.327-.54-.287-1.121-.398-1.741-.463v-.008zm-2.1.583c-.133.003-.25.018-.344.04-.178.044-.377.099-.52.205-.16.117-.244.29-.244.5.002.133.025.266.065.394.148.465.355.907.588 1.335l.004.007c.392.72.86 1.392 1.431 1.984l.026.03.032.025.025.032.03.026c.593.571 1.264 1.039 1.984 1.431l.007.004c.428.234.87.441 1.335.588.228.073.47.101.688.054.238-.051.433-.177.533-.386.076-.159.121-.332.124-.51.003-.178-.059-.343-.188-.455-.256-.222-.541-.407-.825-.587l-.072-.046c-.263-.166-.582-.271-.828-.06l-.392.337c-.143.123-.323.094-.323.094s-1.166-.276-2.143-1.254c-.978-.978-1.254-2.143-1.254-2.143s-.029-.18.094-.323l.337-.392c.212-.246.106-.565-.06-.828l-.046-.072c-.18-.284-.365-.569-.587-.825-.111-.128-.264-.187-.433-.189l-.058-.007v.02z"/>
  </svg>
);

export default function Profile() {
  const navigate = useNavigate();
  const { user, profile, role, isLoading, signOut } = useAuth();

  const handleLogout = async () => {
    await signOut();
    toast.success('Logged out successfully');
    navigate('/');
  };

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
              <div className="mt-4 p-4 bg-gradient-to-r from-cg-gold/10 to-cg-premium/10 rounded-lg border border-cg-gold/20">
                <p className="text-sm font-medium text-foreground mb-3">
                  🎬 Upgrade to Premium to unlock all content!
                </p>
                <p className="text-xs text-muted-foreground mb-4">
                  Contact us through any of these channels:
                </p>
                <div className="flex flex-col gap-3">
                  {/* Telegram */}
                  <a
                    href="https://t.me/onedove"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-3 bg-[#0088cc]/10 hover:bg-[#0088cc]/20 rounded-lg transition-colors group"
                  >
                    <div className="w-10 h-10 rounded-full bg-[#0088cc] flex items-center justify-center">
                      <TelegramIcon className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground group-hover:text-[#0088cc] transition-colors">Telegram</p>
                      <p className="text-xs text-muted-foreground">@onedove</p>
                    </div>
                  </a>

                  {/* Viber */}
                  <a
                    href="viber://chat?number=09883249943"
                    className="flex items-center gap-3 p-3 bg-[#7360f2]/10 hover:bg-[#7360f2]/20 rounded-lg transition-colors group"
                  >
                    <div className="w-10 h-10 rounded-full bg-[#7360f2] flex items-center justify-center">
                      <ViberIcon className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground group-hover:text-[#7360f2] transition-colors">Viber</p>
                      <p className="text-xs text-muted-foreground">09883249943</p>
                    </div>
                  </a>

                  {/* Gmail */}
                  <a
                    href="mailto:thewaymmofficial@gmail.com?subject=Premium%20Subscription%20Inquiry"
                    className="flex items-center gap-3 p-3 bg-[#EA4335]/10 hover:bg-[#EA4335]/20 rounded-lg transition-colors group"
                  >
                    <div className="w-10 h-10 rounded-full bg-[#EA4335] flex items-center justify-center">
                      <Mail className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground group-hover:text-[#EA4335] transition-colors">Gmail</p>
                      <p className="text-xs text-muted-foreground">thewaymmofficial@gmail.com</p>
                    </div>
                  </a>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Logout Button */}
        <Button
          variant="destructive"
          size="lg"
          onClick={handleLogout}
          className="w-full mt-6"
        >
          <LogOut className="w-4 h-4 mr-2" />
          Log Out
        </Button>
      </div>
    </div>
  );
}
