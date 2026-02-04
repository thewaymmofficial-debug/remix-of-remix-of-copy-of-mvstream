import { useState, useEffect } from 'react';
import { Settings, Save, Loader2, Megaphone } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { useSiteSettings, useUpdateSiteSettings, AdminContacts, SubscriptionPrices, AnnouncementSettings } from '@/hooks/useSiteSettings';
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

  // Announcement form state
  const [announcement, setAnnouncement] = useState<AnnouncementSettings>({
    enabled: false,
    text: '',
    bgColor: '#e50914',
    textColor: '#ffffff',
    speed: 'normal',
    opacity: 100,
  });

  // Load settings into form when fetched
  useEffect(() => {
    if (settings?.adminContacts) {
      setContacts(settings.adminContacts);
    }
    if (settings?.subscriptionPrices) {
      setPrices(settings.subscriptionPrices);
    }
    if (settings?.announcement) {
      setAnnouncement(settings.announcement);
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

  const handleSaveAnnouncement = () => {
    updateSettings.mutate({ key: 'announcement', value: announcement });
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
        {/* Announcement Banner */}
        <Card className="glass border-cineverse-red/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Megaphone className="w-5 h-5 text-cineverse-red" />
              Announcement Banner
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Enable/Disable Toggle */}
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="announcement-enabled" className="text-base font-medium">
                  Enable Banner
                </Label>
                <p className="text-sm text-muted-foreground">
                  Show scrolling announcement under the header
                </p>
              </div>
              <Switch
                id="announcement-enabled"
                checked={announcement.enabled}
                onCheckedChange={(checked) =>
                  setAnnouncement({ ...announcement, enabled: checked })
                }
              />
            </div>

            {/* Announcement Text */}
            <div className="space-y-2">
              <Label htmlFor="announcement-text">Announcement Text</Label>
              <Input
                id="announcement-text"
                value={announcement.text}
                onChange={(e) =>
                  setAnnouncement({ ...announcement, text: e.target.value })
                }
                placeholder="Enter your announcement message..."
              />
            </div>

            {/* Colors and Speed */}
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="announcement-bg">Background Color</Label>
                <div className="flex gap-2">
                  <Input
                    id="announcement-bg"
                    type="color"
                    value={announcement.bgColor}
                    onChange={(e) =>
                      setAnnouncement({ ...announcement, bgColor: e.target.value })
                    }
                    className="w-12 h-10 p-1 cursor-pointer"
                  />
                  <Input
                    value={announcement.bgColor}
                    onChange={(e) =>
                      setAnnouncement({ ...announcement, bgColor: e.target.value })
                    }
                    className="flex-1"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="announcement-text-color">Text Color</Label>
                <div className="flex gap-2">
                  <Input
                    id="announcement-text-color"
                    type="color"
                    value={announcement.textColor}
                    onChange={(e) =>
                      setAnnouncement({ ...announcement, textColor: e.target.value })
                    }
                    className="w-12 h-10 p-1 cursor-pointer"
                  />
                  <Input
                    value={announcement.textColor}
                    onChange={(e) =>
                      setAnnouncement({ ...announcement, textColor: e.target.value })
                    }
                    className="flex-1"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="announcement-speed">Scroll Speed</Label>
                <Select
                  value={announcement.speed}
                  onValueChange={(value: 'slow' | 'normal' | 'fast') =>
                    setAnnouncement({ ...announcement, speed: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Speed" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="slow">Slow</SelectItem>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="fast">Fast</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Opacity Slider */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="announcement-opacity">Background Opacity</Label>
                <span className="text-sm text-muted-foreground">{announcement.opacity ?? 100}%</span>
              </div>
              <Slider
                id="announcement-opacity"
                value={[announcement.opacity ?? 100]}
                onValueChange={(value) =>
                  setAnnouncement({ ...announcement, opacity: value[0] })
                }
                min={10}
                max={100}
                step={5}
                className="w-full"
              />
            </div>

            {/* Preview */}
            {announcement.text && (
              <div className="space-y-2">
                <Label>Preview</Label>
                <div 
                  className="overflow-hidden rounded-lg py-2"
                  style={{ 
                    backgroundColor: announcement.bgColor,
                    color: announcement.textColor,
                    opacity: (announcement.opacity ?? 100) / 100
                  }}
                >
                  <div className="whitespace-nowrap animate-marquee">
                    <span className="mx-8 text-sm font-medium">{announcement.text}</span>
                    <span className="mx-8 text-sm font-medium">{announcement.text}</span>
                  </div>
                </div>
              </div>
            )}

            <Button
              onClick={handleSaveAnnouncement}
              disabled={updateSettings.isPending}
              className="w-full bg-cineverse-red hover:bg-cineverse-red/90"
            >
              {updateSettings.isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              Save Announcement
            </Button>
          </CardContent>
        </Card>

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