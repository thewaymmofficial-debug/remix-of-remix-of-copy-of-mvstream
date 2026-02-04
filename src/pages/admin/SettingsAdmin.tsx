import { useState, useEffect } from 'react';
import { Settings, Save, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useSiteSettings, useUpdateSiteSettings, AdminContacts, SubscriptionPrices } from '@/hooks/useSiteSettings';
import { TelegramIcon, ViberIcon } from '@/components/ContactIcons';
import { Mail } from 'lucide-react';

export default function SettingsAdmin() {
  const { data: settings, isLoading } = useSiteSettings();
  const updateSettings = useUpdateSiteSettings();

  // Contact form state
  const [contacts, setContacts] = useState<AdminContacts>({
    telegram: { handle: '', url: '' },
    viber: { number: '', url: '' },
    email: { address: '', url: '' },
  });

  // Pricing form state
  const [prices, setPrices] = useState<SubscriptionPrices>({
    monthly: { mmk: 0, usd: 0, label: '1 Month' },
    yearly: { mmk: 0, usd: 0, label: '1 Year' },
    lifetime: { mmk: 0, usd: 0, label: 'Lifetime' },
  });

  // Load settings into form when fetched
  useEffect(() => {
    if (settings?.adminContacts) {
      setContacts(settings.adminContacts);
    }
    if (settings?.subscriptionPrices) {
      setPrices(settings.subscriptionPrices);
    }
  }, [settings]);

  const handleSaveContacts = () => {
    // Auto-generate URLs from handles/numbers
    const updatedContacts = {
      telegram: {
        handle: contacts.telegram.handle,
        url: `https://t.me/${contacts.telegram.handle.replace('@', '')}`,
      },
      viber: {
        number: contacts.viber.number,
        url: `viber://chat?number=${contacts.viber.number}`,
      },
      email: {
        address: contacts.email.address,
        url: `mailto:${contacts.email.address}?subject=Premium%20Subscription%20Inquiry`,
      },
    };
    updateSettings.mutate({ key: 'admin_contacts', value: updatedContacts });
  };

  const handleSavePrices = () => {
    updateSettings.mutate({ key: 'subscription_prices', value: prices });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8 flex items-center gap-2">
        <Settings className="w-8 h-8" />
        Site Settings
      </h1>

      <div className="grid gap-6">
        {/* Admin Contacts */}
        <Card className="glass">
          <CardHeader>
            <CardTitle>Admin Contact Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Telegram */}
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-[#0088cc] flex items-center justify-center shrink-0">
                <TelegramIcon className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 space-y-2">
                <Label htmlFor="telegram-handle">Telegram Handle</Label>
                <Input
                  id="telegram-handle"
                  value={contacts.telegram.handle}
                  onChange={(e) =>
                    setContacts({
                      ...contacts,
                      telegram: { ...contacts.telegram, handle: e.target.value },
                    })
                  }
                  placeholder="@username"
                />
              </div>
            </div>

            {/* Viber */}
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-[#7360f2] flex items-center justify-center shrink-0">
                <ViberIcon className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 space-y-2">
                <Label htmlFor="viber-number">Viber Number</Label>
                <Input
                  id="viber-number"
                  value={contacts.viber.number}
                  onChange={(e) =>
                    setContacts({
                      ...contacts,
                      viber: { ...contacts.viber, number: e.target.value },
                    })
                  }
                  placeholder="09xxxxxxxxx"
                />
              </div>
            </div>

            {/* Email */}
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-[#EA4335] flex items-center justify-center shrink-0">
                <Mail className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 space-y-2">
                <Label htmlFor="email-address">Email Address</Label>
                <Input
                  id="email-address"
                  type="email"
                  value={contacts.email.address}
                  onChange={(e) =>
                    setContacts({
                      ...contacts,
                      email: { ...contacts.email, address: e.target.value },
                    })
                  }
                  placeholder="email@example.com"
                />
              </div>
            </div>

            <Button
              onClick={handleSaveContacts}
              disabled={updateSettings.isPending}
              className="w-full"
            >
              {updateSettings.isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              Save Contacts
            </Button>
          </CardContent>
        </Card>

        {/* Subscription Prices */}
        <Card className="glass">
          <CardHeader>
            <CardTitle>Subscription Prices</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Monthly */}
            <div className="p-4 bg-muted rounded-lg space-y-4">
              <h3 className="font-semibold">Monthly Subscription</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="monthly-mmk">Price (MMK)</Label>
                  <Input
                    id="monthly-mmk"
                    type="number"
                    value={prices.monthly.mmk}
                    onChange={(e) =>
                      setPrices({
                        ...prices,
                        monthly: { ...prices.monthly, mmk: Number(e.target.value) },
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="monthly-usd">Price (USD)</Label>
                  <Input
                    id="monthly-usd"
                    type="number"
                    step="0.01"
                    value={prices.monthly.usd}
                    onChange={(e) =>
                      setPrices({
                        ...prices,
                        monthly: { ...prices.monthly, usd: Number(e.target.value) },
                      })
                    }
                  />
                </div>
              </div>
            </div>

            {/* Yearly */}
            <div className="p-4 bg-muted rounded-lg space-y-4">
              <h3 className="font-semibold">Yearly Subscription</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="yearly-mmk">Price (MMK)</Label>
                  <Input
                    id="yearly-mmk"
                    type="number"
                    value={prices.yearly.mmk}
                    onChange={(e) =>
                      setPrices({
                        ...prices,
                        yearly: { ...prices.yearly, mmk: Number(e.target.value) },
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="yearly-usd">Price (USD)</Label>
                  <Input
                    id="yearly-usd"
                    type="number"
                    step="0.01"
                    value={prices.yearly.usd}
                    onChange={(e) =>
                      setPrices({
                        ...prices,
                        yearly: { ...prices.yearly, usd: Number(e.target.value) },
                      })
                    }
                  />
                </div>
              </div>
            </div>

            {/* Lifetime */}
            <div className="p-4 bg-muted rounded-lg space-y-4">
              <h3 className="font-semibold">Lifetime Access</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="lifetime-mmk">Price (MMK)</Label>
                  <Input
                    id="lifetime-mmk"
                    type="number"
                    value={prices.lifetime.mmk}
                    onChange={(e) =>
                      setPrices({
                        ...prices,
                        lifetime: { ...prices.lifetime, mmk: Number(e.target.value) },
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lifetime-usd">Price (USD)</Label>
                  <Input
                    id="lifetime-usd"
                    type="number"
                    step="0.01"
                    value={prices.lifetime.usd}
                    onChange={(e) =>
                      setPrices({
                        ...prices,
                        lifetime: { ...prices.lifetime, usd: Number(e.target.value) },
                      })
                    }
                  />
                </div>
              </div>
            </div>

            <Button
              onClick={handleSavePrices}
              disabled={updateSettings.isPending}
              className="w-full"
            >
              {updateSettings.isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              Save Prices
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
