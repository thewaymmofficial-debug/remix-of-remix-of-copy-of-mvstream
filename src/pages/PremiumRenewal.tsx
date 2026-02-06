import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Copy, Upload, FileText, Moon, Sun, HelpCircle, Shield, Mail, CalendarDays, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTheme } from 'next-themes';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/hooks/useAuth';
import { usePaymentMethods } from '@/hooks/usePaymentMethods';
import { usePricingPlans } from '@/hooks/usePricingPlans';
import { useSubmitPremiumRequest } from '@/hooks/usePremiumRequests';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export default function PremiumRenewal() {
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const { t, language } = useLanguage();
  const { user, role, premiumExpiresAt } = useAuth();
  const { data: paymentMethods, isLoading: methodsLoading } = usePaymentMethods();
  const { data: pricingPlans, isLoading: plansLoading } = usePricingPlans();
  const submitRequest = useSubmitPremiumRequest();

  const [selectedPlanId, setSelectedPlanId] = useState('');
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
    if (!selectedPlanId) {
      toast.error(language === 'mm' ? 'Plan ရွေးချယ်ပါ' : 'Please select a plan');
      return;
    }
    if (!transactionId.trim()) {
      toast.error(language === 'mm' ? 'Transaction ID ထည့်ပါ' : 'Please enter Transaction ID');
      return;
    }
    if (!screenshot) {
      toast.error(language === 'mm' ? 'Screenshot ထည့်ပါ' : 'Please upload screenshot');
      return;
    }
    if (!user) return;

    setIsSubmitting(true);

    try {
      // Upload screenshot
      const fileExt = screenshot.name.split('.').pop();
      const filePath = `${user.id}/${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage
        .from('payment-screenshots')
        .upload(filePath, screenshot);

      let screenshotUrl: string | null = null;
      if (!uploadError) {
        const { data: urlData } = supabase.storage
          .from('payment-screenshots')
          .getPublicUrl(filePath);
        screenshotUrl = urlData?.publicUrl || null;
      }

      const selectedPlan = pricingPlans?.find(p => p.id === selectedPlanId);

      await submitRequest.mutateAsync({
        user_id: user.id,
        plan_id: selectedPlanId,
        plan_duration: selectedPlan?.duration || '',
        plan_price: selectedPlan?.price || '',
        transaction_id: transactionId.trim(),
        screenshot_url: screenshotUrl,
      });

      toast.success(
        language === 'mm'
          ? 'တင်သွင်းပြီးပါပြီ! စစ်ဆေးပြီးအကြောင်းကြားပါမည်'
          : 'Submitted! We will review and notify you.'
      );
      setTransactionId('');
      setScreenshot(null);
      setSelectedPlanId('');
    } catch {
      toast.error(language === 'mm' ? 'အမှားတစ်ခု ဖြစ်ပွားသည်' : 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) {
    navigate('/auth');
    return null;
  }

  const planLabel =
    role === 'admin' ? 'Administrator' : role === 'premium' ? 'Gold Member' : 'Free User';

  const expiryText = premiumExpiresAt
    ? new Date(premiumExpiresAt).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })
    : 'N/A';

  const isLoading = methodsLoading || plansLoading;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-xl border-b border-border">
        <div className="flex items-center justify-between px-4 h-14">
          <button onClick={() => navigate('/welcome')} className="p-2 -ml-2">
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

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="px-4 py-6 max-w-lg mx-auto space-y-6">
          {/* Current Plan Card */}
          <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl p-5 text-white relative overflow-hidden">
            <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full bg-white/10" />
            <div className="absolute right-10 bottom-2 w-20 h-20 rounded-full bg-white/10" />
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-1">
                <div>
                  <p className="text-white/80 text-sm">Current Plan</p>
                  <h2 className="text-2xl font-bold">{planLabel}</h2>
                </div>
                <span className="bg-white/20 px-3 py-1 rounded-full text-xs font-semibold">
                  1 Device
                </span>
              </div>
              <div className="mt-4 bg-white/15 rounded-xl p-3 space-y-2">
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-white/80" />
                  <span className="text-sm">{user?.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <CalendarDays className="w-4 h-4 text-white/80" />
                  <span className="text-sm">Expires: {expiryText}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Pricing Plans Card */}
          <div>
            <h2 className="text-lg font-bold text-foreground mb-4">
              {language === 'mm' ? 'သက်တမ်းတိုးရန် Plan များ' : 'Renewal Plans'}
            </h2>
            <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl p-5 text-white relative overflow-hidden">
              <div className="absolute -right-6 -top-6 w-24 h-24 rounded-full bg-white/10" />
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-4">
                  <Shield className="w-6 h-6" />
                  <h3 className="text-xl font-bold">Gold Member</h3>
                </div>
                <div className="bg-white/15 rounded-xl divide-y divide-white/20">
                  {pricingPlans?.map((plan) => (
                    <div key={plan.id} className="flex items-center justify-between px-4 py-3">
                      <span className="text-sm font-medium">{plan.duration}</span>
                      <span className="text-sm font-bold">{plan.price}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Step 1: Payment Accounts */}
          <div>
            <h2 className="text-lg font-bold text-foreground mb-4">
              {language === 'mm' ? '၁။ ငွေလွှဲရန်အချက်အလက်များ' : '1. Payment Accounts'}
            </h2>
            <div className="space-y-4">
              {paymentMethods?.map((method) => (
                <div
                  key={method.id}
                  className={`${method.gradient} rounded-2xl p-5 relative overflow-hidden`}
                >
                  <div className="absolute -right-6 -top-6 w-24 h-24 rounded-full bg-white/10" />
                  <div className="absolute -right-2 bottom-4 w-16 h-16 rounded-full bg-white/10" />
                  <div className="relative z-10">
                    <div className="flex items-center justify-between mb-3">
                      <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm">
                        <span className="text-xs font-bold text-gray-800">{method.name.split(' ')[0]}</span>
                      </div>
                      <span className={`text-lg font-bold ${method.text_color}`}>
                        {method.name}
                      </span>
                    </div>
                    <p className={`text-sm opacity-80 ${method.text_color}`}>
                      {t('accountNumber')}
                    </p>
                    <div className="flex items-end justify-between mt-1">
                      <div>
                        <p className={`text-2xl font-bold ${method.text_color}`}>
                          {method.account_number}
                        </p>
                        <p className={`text-lg font-semibold ${method.text_color}`}>
                          ({method.account_name})
                        </p>
                      </div>
                      <button
                        onClick={() => copyToClipboard(method.account_number)}
                        className={`p-2.5 rounded-xl bg-white/20 hover:bg-white/30 transition-colors ${method.text_color}`}
                      >
                        <Copy className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Step 2: Select Plan */}
          <div>
            <h2 className="text-lg font-bold text-foreground mb-4">
              {language === 'mm' ? '၂။ Plan ရွေးချယ်ပါ' : '2. Select Plan'}
            </h2>
            <Select value={selectedPlanId} onValueChange={setSelectedPlanId}>
              <SelectTrigger className="h-12 bg-card border-border text-foreground">
                <SelectValue placeholder={language === 'mm' ? 'Plan ရွေးချယ်ပါ' : 'Select a plan'} />
              </SelectTrigger>
              <SelectContent className="bg-popover">
                {pricingPlans?.map((plan) => (
                  <SelectItem key={plan.id} value={plan.id}>
                    {plan.duration} — {plan.price}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Step 3: Upload Screenshot */}
          <div>
            <h2 className="text-lg font-bold text-foreground mb-4">
              {language === 'mm' ? '၃။ ငွေလွှဲ Screenshot ထည့်ပါ' : '3. Upload Screenshot'}
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
                  <div className="w-16 h-16 mx-auto bg-emerald-500/20 rounded-full flex items-center justify-center">
                    <FileText className="w-8 h-8 text-emerald-500" />
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

          {/* Step 4: Transaction ID */}
          <div>
            <h2 className="text-lg font-bold text-foreground mb-4">
              {language === 'mm' ? '၄။ Transaction ID ထည့်ပါ' : '4. Enter Transaction ID'}
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
            className="w-full h-14 text-lg font-bold rounded-xl"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                {language === 'mm' ? 'တင်သွင်းနေသည်...' : 'Submitting...'}
              </>
            ) : (
              t('submitRenewal')
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
