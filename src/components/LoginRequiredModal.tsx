import { Lock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';

interface LoginRequiredModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  feature?: string;
}

export function LoginRequiredModal({ open, onOpenChange, feature }: LoginRequiredModalProps) {
  const navigate = useNavigate();
  const { t } = useLanguage();

  const handleRegister = () => {
    onOpenChange(false);
    navigate('/auth');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm rounded-2xl bg-background border-border text-center p-8">
        {/* Lock icon */}
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
            <Lock className="w-8 h-8 text-primary" />
          </div>
        </div>

        <h2 className="text-xl font-bold text-foreground mb-2">
          {t('loginRequired')}
        </h2>

        <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
          {feature
            ? `'${feature}' ${t('loginRequiredDesc')}`
            : t('loginRequiredDesc')}
        </p>

        <div className="flex items-center gap-3 justify-center">
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            className="px-6"
          >
            {t('cancel')}
          </Button>
          <Button
            onClick={handleRegister}
            className="px-6 font-semibold"
          >
            {t('registerNow')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
