import { Crown, Lock } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ContactIcons } from '@/components/ContactIcons';
import { useSiteSettings } from '@/hooks/useSiteSettings';

interface PremiumModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PremiumModal({ open, onOpenChange }: PremiumModalProps) {
  const { data: settings } = useSiteSettings();
  const contacts = settings?.adminContacts;
  const prices = settings?.subscriptionPrices;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md glass border-border text-center">
        <div className="flex justify-center mb-4">
          <div className="w-20 h-20 rounded-full premium-badge flex items-center justify-center">
            <Lock className="w-10 h-10 text-black" />
          </div>
        </div>
        
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center flex items-center justify-center gap-2">
            <Crown className="w-6 h-6 text-cg-gold" />
            Premium Content
          </DialogTitle>
          <DialogDescription className="text-center text-base mt-2">
            This content is only available to Premium members.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-6 space-y-4">
          {/* Pricing */}
          {prices && (
            <div className="grid grid-cols-3 gap-2">
              <div className="p-3 bg-muted rounded-lg text-center">
                <p className="text-xs text-muted-foreground">{prices.monthly.label}</p>
                <p className="text-lg font-bold text-cg-gold">{prices.monthly.mmk.toLocaleString()} MMK</p>
                <p className="text-xs text-muted-foreground">${prices.monthly.usd}</p>
              </div>
              <div className="p-3 bg-muted rounded-lg text-center border-2 border-cg-gold">
                <p className="text-xs text-muted-foreground">{prices.yearly.label}</p>
                <p className="text-lg font-bold text-cg-gold">{prices.yearly.mmk.toLocaleString()} MMK</p>
                <p className="text-xs text-muted-foreground">${prices.yearly.usd}</p>
              </div>
              <div className="p-3 bg-muted rounded-lg text-center">
                <p className="text-xs text-muted-foreground">{prices.lifetime.label}</p>
                <p className="text-lg font-bold text-cg-gold">{prices.lifetime.mmk.toLocaleString()} MMK</p>
                <p className="text-xs text-muted-foreground">${prices.lifetime.usd}</p>
              </div>
            </div>
          )}

          <div className="p-4 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground">
              Upgrade to Premium to unlock:
            </p>
            <ul className="mt-2 space-y-2 text-sm text-left">
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-cg-gold" />
                Unlimited streaming access
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-cg-gold" />
                4K Ultra HD quality
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-cg-gold" />
                No ads experience
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-cg-gold" />
                Early access to new releases
              </li>
            </ul>
          </div>

          <p className="text-xs text-muted-foreground">
            Contact us to upgrade:
          </p>

          <ContactIcons
            telegramUrl={contacts?.telegram.url}
            viberUrl={contacts?.viber.url}
            emailUrl={contacts?.email.url}
            size="sm"
          />

          <Button
            onClick={() => onOpenChange(false)}
            variant="secondary"
            className="w-full"
          >
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
