'use client';

import { Suspense, useCallback, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/hooks/useTheme';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Spinner } from '@/components/ui/Spinner';
import { ROUTES, EXPORT_FORMATS } from '@/lib/utils/constants';
import { TIERS, type TierName } from '@/lib/usage/tiers';

interface UserSettings {
  user_id: string;
  default_export_format: string;
  theme: string;
  has_youtube_api_key: boolean;
}

interface Subscription {
  tier: TierName;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  current_period_end: string | null;
}

interface UsageStats {
  today: number;
  month: number;
  subscription: Subscription | null;
}

function SettingsContent() {
  const { user, loading: authLoading, signOut } = useAuth();
  const { theme, setTheme, resolvedTheme } = useTheme();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [usageStats, setUsageStats] = useState<UsageStats | null>(null);
  const [settingsLoading, setSettingsLoading] = useState(true);
  const [apiKey, setApiKey] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [exportFormat, setExportFormat] = useState('txt');
  const [savingApiKey, setSavingApiKey] = useState(false);
  const [savingFormat, setSavingFormat] = useState(false);
  const [managingSubscription, setManagingSubscription] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const checkoutSuccess = searchParams.get('checkout') === 'success';

  // Show success message on checkout completion
  useEffect(() => {
    if (checkoutSuccess) {
      showMessage('success', 'Subscription activated successfully!');
      // Clear the query param
      router.replace('/settings');
    }
  }, [checkoutSuccess, router]);

  // Fetch user settings
  const fetchSettings = useCallback(async () => {
    try {
      const response = await fetch('/api/settings');
      if (response.ok) {
        const data = await response.json();
        setSettings(data);
        setExportFormat(data.default_export_format || 'txt');
      }
    } catch (error) {
      console.error('Failed to fetch settings:', error);
    } finally {
      setSettingsLoading(false);
    }
  }, []);

  // Fetch usage stats
  const fetchUsageStats = useCallback(async () => {
    try {
      const response = await fetch('/api/usage');
      if (response.ok) {
        const data = await response.json();
        setUsageStats(data);
      }
    } catch (error) {
      console.error('Failed to fetch usage stats:', error);
    }
  }, []);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push(ROUTES.LOGIN);
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) {
      fetchSettings();
      fetchUsageStats();
    }
  }, [user, fetchSettings, fetchUsageStats]);

  const handleManageSubscription = async () => {
    setManagingSubscription(true);
    try {
      const response = await fetch('/api/stripe/portal', {
        method: 'POST',
      });
      const data = await response.json();

      if (data.error) {
        showMessage('error', data.error);
        return;
      }

      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error('Portal error:', error);
      showMessage('error', 'Failed to open billing portal');
    } finally {
      setManagingSubscription(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    router.push(ROUTES.HOME);
  };

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3000);
  };

  const handleSaveApiKey = async () => {
    if (!apiKey.trim()) {
      showMessage('error', 'Please enter an API key');
      return;
    }

    setSavingApiKey(true);
    try {
      const response = await fetch('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ youtube_api_key: apiKey }),
      });

      if (response.ok) {
        setApiKey('');
        setSettings((prev) => prev ? { ...prev, has_youtube_api_key: true } : null);
        showMessage('success', 'API key saved successfully');
      } else {
        showMessage('error', 'Failed to save API key');
      }
    } catch (error) {
      console.error('Failed to save API key:', error);
      showMessage('error', 'Failed to save API key');
    } finally {
      setSavingApiKey(false);
    }
  };

  const handleRemoveApiKey = async () => {
    setSavingApiKey(true);
    try {
      const response = await fetch('/api/settings', {
        method: 'DELETE',
      });

      if (response.ok) {
        setSettings((prev) => prev ? { ...prev, has_youtube_api_key: false } : null);
        showMessage('success', 'API key removed');
      } else {
        showMessage('error', 'Failed to remove API key');
      }
    } catch (error) {
      console.error('Failed to remove API key:', error);
      showMessage('error', 'Failed to remove API key');
    } finally {
      setSavingApiKey(false);
    }
  };

  const handleSaveExportFormat = async (format: string) => {
    setSavingFormat(true);
    setExportFormat(format);
    try {
      const response = await fetch('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ default_export_format: format }),
      });

      if (response.ok) {
        showMessage('success', 'Export format saved');
      } else {
        showMessage('error', 'Failed to save export format');
      }
    } catch (error) {
      console.error('Failed to save export format:', error);
      showMessage('error', 'Failed to save export format');
    } finally {
      setSavingFormat(false);
    }
  };

  if (authLoading || settingsLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="container max-w-4xl py-6 space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Manage your account settings and preferences.
        </p>
      </div>

      {/* Message Banner */}
      {message && (
        <div
          className={`p-4 rounded-lg ${
            message.type === 'success'
              ? 'bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20'
              : 'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20'
          }`}
        >
          {message.text}
        </div>
      )}

      <Tabs defaultValue="account" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="account">Account</TabsTrigger>
          <TabsTrigger value="api">API Key</TabsTrigger>
          <TabsTrigger value="usage">Usage</TabsTrigger>
          <TabsTrigger value="preferences">Preferences</TabsTrigger>
        </TabsList>

        {/* Account Tab */}
        <TabsContent value="account" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Account Information</CardTitle>
              <CardDescription>
                Your account details and authentication status.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Email Address</Label>
                <div className="flex items-center gap-2">
                  <input
                    value={user.email || ''}
                    disabled
                    className="flex h-9 w-full rounded-md border border-input bg-muted px-3 py-1 text-sm shadow-sm transition-colors disabled:cursor-not-allowed disabled:opacity-70"
                  />
                  <span className="text-xs text-muted-foreground px-2 py-1 bg-muted rounded whitespace-nowrap">
                    Verified
                  </span>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Account Created</Label>
                <p className="text-sm text-muted-foreground">
                  {user.created_at
                    ? new Date(user.created_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })
                    : 'Unknown'}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-destructive/50">
            <CardHeader>
              <CardTitle className="text-destructive">Danger Zone</CardTitle>
              <CardDescription>
                Actions here can affect your account access.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="font-medium">Sign out of your account</p>
                  <p className="text-sm text-muted-foreground">
                    You will be signed out of this device.
                  </p>
                </div>
                <Button variant="danger" onClick={handleSignOut}>
                  Sign Out
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* API Key Tab */}
        <TabsContent value="api" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>YouTube Data API Key</CardTitle>
              <CardDescription>
                Add your own YouTube Data API key for higher rate limits and more
                control over your usage.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {settings?.has_youtube_api_key ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                    <div className="w-2 h-2 bg-green-500 rounded-full" />
                    <span className="text-sm text-green-600 dark:text-green-400">
                      Your API key is configured and active
                    </span>
                  </div>
                  <Button
                    variant="secondary"
                    onClick={handleRemoveApiKey}
                    disabled={savingApiKey}
                  >
                    {savingApiKey ? 'Removing...' : 'Remove API Key'}
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="api-key">API Key</Label>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <input
                          id="api-key"
                          type={showApiKey ? 'text' : 'password'}
                          placeholder="Enter your YouTube Data API v3 key"
                          value={apiKey}
                          onChange={(e) => setApiKey(e.target.value)}
                          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring pr-10"
                        />
                        <button
                          type="button"
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                          onClick={() => setShowApiKey(!showApiKey)}
                        >
                          {showApiKey ? (
                            <EyeOffIcon className="w-4 h-4" />
                          ) : (
                            <EyeIcon className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                      <Button variant="primary" onClick={handleSaveApiKey} disabled={savingApiKey}>
                        {savingApiKey ? 'Saving...' : 'Save'}
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              <div className="pt-4 border-t space-y-3">
                <h4 className="font-medium">Why add your own API key?</h4>
                <ul className="text-sm text-muted-foreground space-y-2">
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-0.5">-</span>
                    <span>Higher daily extraction limits</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-0.5">-</span>
                    <span>No shared quota with other users</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-0.5">-</span>
                    <span>Full control over your API usage and costs</span>
                  </li>
                </ul>
              </div>

              <div className="pt-4 border-t">
                <h4 className="font-medium mb-2">How to get an API key</h4>
                <ol className="text-sm text-muted-foreground space-y-2 list-decimal list-inside">
                  <li>Go to the Google Cloud Console</li>
                  <li>Create a new project or select an existing one</li>
                  <li>Enable the YouTube Data API v3</li>
                  <li>Create credentials (API key)</li>
                  <li>Copy and paste the key above</li>
                </ol>
                <a
                  href="https://console.cloud.google.com/apis/library/youtube.googleapis.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-sm text-primary hover:underline mt-3"
                >
                  Open Google Cloud Console
                  <ExternalLinkIcon className="w-3 h-3" />
                </a>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Usage Tab */}
        <TabsContent value="usage" className="space-y-6">
          {/* Current Plan Card */}
          <Card>
            <CardHeader>
              <CardTitle>Current Plan</CardTitle>
              <CardDescription>
                Your subscription and usage information.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {(() => {
                const currentTier = usageStats?.subscription?.tier || 'free';
                const tierInfo = TIERS[currentTier];
                const isPaid = currentTier !== 'free';
                const periodEnd = usageStats?.subscription?.current_period_end;

                return (
                  <>
                    <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          isPaid ? 'bg-primary/20' : 'bg-secondary'
                        }`}>
                          {isPaid ? (
                            <CrownIcon className="w-5 h-5 text-primary" />
                          ) : (
                            <UserIcon className="w-5 h-5 text-muted-foreground" />
                          )}
                        </div>
                        <div>
                          <p className="font-semibold">{tierInfo.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {tierInfo.description}
                          </p>
                        </div>
                      </div>
                      <Badge variant={isPaid ? 'default' : 'secondary'}>
                        Active
                      </Badge>
                    </div>

                    {isPaid && periodEnd && (
                      <p className="text-sm text-muted-foreground">
                        Your subscription renews on{' '}
                        {new Date(periodEnd).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </p>
                    )}

                    <div className="flex gap-3 pt-2">
                      {isPaid ? (
                        <Button
                          variant="secondary"
                          onClick={handleManageSubscription}
                          disabled={managingSubscription}
                        >
                          {managingSubscription ? 'Loading...' : 'Manage Subscription'}
                        </Button>
                      ) : (
                        <Button
                          variant="primary"
                          onClick={() => router.push('/pricing')}
                        >
                          Upgrade Plan
                        </Button>
                      )}
                    </div>
                  </>
                );
              })()}
            </CardContent>
          </Card>

          {/* Plan Features Card */}
          <Card>
            <CardHeader>
              <CardTitle>Plan Features</CardTitle>
              <CardDescription>
                What&apos;s included in your current plan.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {(() => {
                const currentTier = usageStats?.subscription?.tier || 'free';
                const tierInfo = TIERS[currentTier];

                return (
                  <ul className="space-y-3">
                    {tierInfo.features.map((feature, i) => (
                      <li key={i} className="flex items-center gap-3">
                        <div className="w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center">
                          <svg
                            className="w-3 h-3 text-green-500"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                        </div>
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                );
              })()}
            </CardContent>
          </Card>

          {/* Usage Statistics Card */}
          <Card>
            <CardHeader>
              <CardTitle>Usage Statistics</CardTitle>
              <CardDescription>
                Track your transcript extraction usage.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-2xl font-bold">{usageStats?.today ?? '--'}</p>
                  <p className="text-sm text-muted-foreground">
                    Extractions Today
                  </p>
                </div>
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-2xl font-bold">{usageStats?.month ?? '--'}</p>
                  <p className="text-sm text-muted-foreground">
                    Extractions This Month
                  </p>
                </div>
              </div>

              {(() => {
                const currentTier = usageStats?.subscription?.tier || 'free';
                const tierLimits = TIERS[currentTier].limits;
                const dailyLimit = tierLimits.videosPerDay;
                const todayUsage = usageStats?.today ?? 0;
                const percentage = dailyLimit === Infinity
                  ? 0
                  : Math.min(100, Math.round((todayUsage / dailyLimit) * 100));

                return (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Daily Usage</span>
                      <span>
                        {todayUsage} / {dailyLimit === Infinity ? 'Unlimited' : dailyLimit}
                      </span>
                    </div>
                    <Progress value={percentage} className="h-2" />
                    {percentage >= 80 && dailyLimit !== Infinity && (
                      <p className="text-xs text-yellow-500">
                        You&apos;re approaching your daily limit.{' '}
                        <button
                          onClick={() => router.push('/pricing')}
                          className="text-primary hover:underline"
                        >
                          Upgrade for more
                        </button>
                      </p>
                    )}
                  </div>
                );
              })()}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Preferences Tab */}
        <TabsContent value="preferences" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Appearance</CardTitle>
              <CardDescription>
                Customize how TranscriptFlow looks on your device.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <Label>Theme</Label>
                <div className="grid grid-cols-3 gap-3">
                  <button
                    onClick={() => setTheme('light')}
                    className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-colors ${
                      theme === 'light'
                        ? 'border-primary bg-primary/5'
                        : 'border-muted hover:border-muted-foreground/50'
                    }`}
                  >
                    <SunIcon className="w-6 h-6" />
                    <span className="text-sm font-medium">Light</span>
                  </button>
                  <button
                    onClick={() => setTheme('dark')}
                    className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-colors ${
                      theme === 'dark'
                        ? 'border-primary bg-primary/5'
                        : 'border-muted hover:border-muted-foreground/50'
                    }`}
                  >
                    <MoonIcon className="w-6 h-6" />
                    <span className="text-sm font-medium">Dark</span>
                  </button>
                  <button
                    onClick={() => setTheme('system')}
                    className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-colors ${
                      theme === 'system'
                        ? 'border-primary bg-primary/5'
                        : 'border-muted hover:border-muted-foreground/50'
                    }`}
                  >
                    <MonitorIcon className="w-6 h-6" />
                    <span className="text-sm font-medium">System</span>
                  </button>
                </div>
                <p className="text-sm text-muted-foreground">
                  Current theme: {resolvedTheme === 'dark' ? 'Dark' : 'Light'}
                  {theme === 'system' && ' (following system preference)'}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Export Preferences</CardTitle>
              <CardDescription>
                Set your default export format for transcripts.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Default Export Format</Label>
                <div className="flex gap-2">
                  {EXPORT_FORMATS.map((format) => (
                    <Button
                      key={format}
                      variant={exportFormat === format ? 'primary' : 'secondary'}
                      size="sm"
                      onClick={() => handleSaveExportFormat(format)}
                      disabled={savingFormat}
                    >
                      {format.toUpperCase()}
                    </Button>
                  ))}
                </div>
                <p className="text-sm text-muted-foreground">
                  {exportFormat === 'txt' && 'Plain text - Simple, readable format'}
                  {exportFormat === 'srt' && 'SRT - Subtitle format with timestamps'}
                  {exportFormat === 'json' && 'JSON - Structured data with all metadata'}
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-[400px]">Loading...</div>}>
      <SettingsContent />
    </Suspense>
  );
}

// Icon components
function EyeIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EyeOffIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
      <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
      <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
      <line x1="2" x2="22" y1="2" y2="22" />
    </svg>
  );
}

function ExternalLinkIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
      <polyline points="15 3 21 3 21 9" />
      <line x1="10" x2="21" y1="14" y2="3" />
    </svg>
  );
}

function SunIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2" />
      <path d="M12 20v2" />
      <path d="m4.93 4.93 1.41 1.41" />
      <path d="m17.66 17.66 1.41 1.41" />
      <path d="M2 12h2" />
      <path d="M20 12h2" />
      <path d="m6.34 17.66-1.41 1.41" />
      <path d="m19.07 4.93-1.41 1.41" />
    </svg>
  );
}

function MoonIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
    </svg>
  );
}

function MonitorIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <rect width="20" height="14" x="2" y="3" rx="2" />
      <line x1="8" x2="16" y1="21" y2="21" />
      <line x1="12" x2="12" y1="17" y2="21" />
    </svg>
  );
}

function CrownIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="m2 4 3 12h14l3-12-6 7-4-7-4 7-6-7zm3 16h14" />
    </svg>
  );
}

function UserIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}
