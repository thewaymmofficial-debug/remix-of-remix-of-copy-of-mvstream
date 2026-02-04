import { Crown, Lock } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface PremiumModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PremiumModal({ open, onOpenChange }: PremiumModalProps) {
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
            Contact an admin to upgrade your account.
          </p>

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
