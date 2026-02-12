import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Trophy, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Navbar } from '@/components/Navbar';
import { MobileBottomNav } from '@/components/MobileBottomNav';
import { FadeIn } from '@/components/FadeIn';

export default function FootballLanding() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-16 pb-24 md:pb-8">
        <div className="px-4 py-4 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/')} className="rounded-full">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-bold flex items-center gap-2">
            ⚽ ဘောလုံး
          </h1>
        </div>

        <FadeIn>
          <div className="px-4 grid grid-cols-2 gap-4 max-w-md">
            <button
              onClick={() => navigate('/football')}
              className="flex flex-col items-center gap-2 p-6 rounded-xl bg-card border border-border hover:border-primary/50 transition-colors"
            >
              <div className="w-14 h-14 rounded-xl bg-muted flex items-center justify-center">
                <Trophy className="w-7 h-7 text-amber-500" />
              </div>
              <span className="text-sm font-medium">ဘောလုံးပွဲပြန်ကြည့်</span>
            </button>

            <button
              onClick={() => navigate('/football-highlights')}
              className="flex flex-col items-center gap-2 p-6 rounded-xl bg-card border border-border hover:border-primary/50 transition-colors"
            >
              <div className="w-14 h-14 rounded-xl bg-muted flex items-center justify-center">
                <Calendar className="w-7 h-7 text-orange-500" />
              </div>
              <span className="text-sm font-medium">Highlight</span>
            </button>
          </div>
        </FadeIn>
      </div>
      <MobileBottomNav />
    </div>
  );
}
