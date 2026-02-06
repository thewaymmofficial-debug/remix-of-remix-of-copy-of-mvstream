import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Copy, Upload, FileText, Moon, Sun, HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useTheme } from 'next-themes';
import { useLanguage } from '@/contexts/LanguageContext';

import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface PaymentMethod {
  name: string;
  accountNumber: string;
  accountName: string;
  gradient: string;
  textColor: string;
}

const paymentMethods: PaymentMethod[] = [
  {
    name: 'KBZ Pay',
    accountNumber: '095413694',
    accountName: 'Hay Thar Thaw',
    gradient: 'bg-gradient-to-br from-blue-400 to-blue-500',
    textColor: 'text-white',
  },
  {
    name: 'Wave Pay',
    accountNumber: '095413694',
    accountName: 'Hay Thar Thaw',
    gradient: 'bg-gradient-to-br from-yellow-300 to-yellow-400',
    textColor: 'text-gray-900',
  },
  {
    name: 'AYA Pay',
    accountNumber: '095413694',
    accountName: 'Hay Thar Thaw',
    gradient: 'bg-gradient-to-br from-pink-400 via-rose-400 to-red-400',
    textColor: 'text-white',
  },
  {
    name: 'CB Pay',
    accountNumber: '095413694',
    accountName: 'Hay Thar Thaw',
    gradient: 'bg-gradient-to-br from-teal-600 to-teal-700',
    textColor: 'text-white',
  },
  {
    name: 'UAB Pay',
    accountNumber: '095413694',
    accountName: 'Hay Thar Thaw',
    gradient: 'bg-gradient-to-br from-emerald-600 to-emerald-700',
    textColor: 'text-white',
  },
];

export default function PremiumRenewal() {
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const [transactionId, setTransactionId] = useState('');
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success(t('copied'));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setScreenshot(e.target.files[0]);
    }
  };

  const handleSubmit = async () => {
    if (!transactionId.trim()) {
      toast.error(language === 'mm' ? 'Transaction ID ထည့်ပါ' : 'Please enter Transaction ID');
      return;
    }
    if (!screenshot) {
      toast.error(language === 'mm' ? 'Screenshot ထည့်ပါ' : 'Please upload screenshot');
      return;
    }
    
    setIsSubmitting(true);
    // In a real app, this would upload to Supabase storage and create a renewal request
    setTimeout(() => {
      toast.success(language === 'mm' ? 'တင်သွင်းပြီးပါပြီ! စစ်ဆေးပြီးအကြောင်းကြားပါမည်' : 'Submitted! We will review and notify you.');
      setIsSubmitting(false);
      setTransactionId('');
      setScreenshot(null);
    }, 1500);
  };

  if (!user) {
    navigate('/auth');
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-xl border-b border-border">
        <div className="flex items-center justify-between px-4 h-14">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2">
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <h1 className="text-lg font-bold text-foreground">
            {language === 'mm' ? 'သက်တမ်းတိုးရန်' : 'Premium Renewal'}
          </h1>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="h-9 w-9"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </Button>
            <Button variant="ghost" size="icon" className="h-9 w-9">
              <HelpCircle className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      <div className="px-4 py-6 max-w-lg mx-auto space-y-6">
        {/* Step 1: Payment Accounts */}
        <div>
          <h2 className="text-lg font-bold text-foreground mb-4">
            {language === 'mm' ? '၁။ ငွေလွှဲရန်အချက်အလက်များ' : '1. Payment Accounts'}
          </h2>
          <div className="space-y-4">
            {paymentMethods.map((method) => (
              <div
                key={method.name}
                className={`${method.gradient} rounded-2xl p-5 relative overflow-hidden`}
              >
                {/* Decorative circles */}
                <div className="absolute -right-6 -top-6 w-24 h-24 rounded-full bg-white/10" />
                <div className="absolute -right-2 bottom-4 w-16 h-16 rounded-full bg-white/10" />
                
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm">
                      <span className="text-xs font-bold text-gray-800">{method.name.split(' ')[0]}</span>
                    </div>
                    <span className={`text-lg font-bold ${method.textColor}`}>
                      {method.name}
                    </span>
                  </div>
                  <p className={`text-sm opacity-80 ${method.textColor}`}>
                    {t('accountNumber')}
                  </p>
                  <div className="flex items-end justify-between mt-1">
                    <div>
                      <p className={`text-2xl font-bold ${method.textColor}`}>
                        {method.accountNumber}
                      </p>
                      <p className={`text-lg font-semibold ${method.textColor}`}>
                        ({method.accountName})
                      </p>
                    </div>
                    <button
                      onClick={() => copyToClipboard(method.accountNumber)}
                      className={`p-2.5 rounded-xl bg-white/20 hover:bg-white/30 transition-colors ${method.textColor}`}
                    >
                      <Copy className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Step 2: Upload Screenshot */}
        <div>
          <h2 className="text-lg font-bold text-foreground mb-4">
            {language === 'mm' ? '၂။ ငွေလွှဲ Screenshot ထည့်ပါ' : '2. Upload Screenshot'}
          </h2>
          <label className="block border-2 border-dashed border-border rounded-2xl p-8 text-center cursor-pointer hover:border-primary/50 transition-colors bg-card">
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />
            {screenshot ? (
              <div className="space-y-2">
                <div className="w-16 h-16 mx-auto bg-cg-success/20 rounded-full flex items-center justify-center">
                  <FileText className="w-8 h-8 text-cg-success" />
                </div>
                <p className="text-sm font-medium text-foreground">{screenshot.name}</p>
                <p className="text-xs text-muted-foreground">
                  {language === 'mm' ? 'ပြောင်းလဲရန် နှိပ်ပါ' : 'Tap to change'}
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="w-16 h-16 mx-auto bg-primary/10 rounded-full flex items-center justify-center">
                  <Upload className="w-8 h-8 text-primary" />
                </div>
                <p className="text-sm text-muted-foreground">{t('tapToUpload')}</p>
              </div>
            )}
          </label>
        </div>

        {/* Step 3: Transaction ID */}
        <div>
          <h2 className="text-lg font-bold text-foreground mb-4">
            {language === 'mm' ? '၃။ Transaction ID ထည့်ပါ' : '3. Enter Transaction ID'}
          </h2>
          <div className="relative">
            <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder={t('transactionPlaceholder')}
              value={transactionId}
              onChange={(e) => setTransactionId(e.target.value)}
              className="pl-10 h-12 bg-card border-border text-foreground"
            />
          </div>
        </div>

        {/* Submit Button */}
        <Button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="w-full h-14 text-lg font-bold rounded-xl bg-primary hover:bg-primary/90"
        >
          {isSubmitting
            ? (language === 'mm' ? 'တင်သွင်းနေသည်...' : 'Submitting...')
            : t('submitRenewal')
          }
        </Button>
      </div>
    </div>
  );
}
