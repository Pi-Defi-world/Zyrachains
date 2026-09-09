"use client";
import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { usePageMetadata } from '@/context/pagemetadataContext';
import { usePiNetwork } from '@/context/PiNetworkContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Zap, Coins, ArrowLeft, CheckCircle, AlertCircle, Key } from 'lucide-react';

interface ApiKeyDoc {
  _id: string;
  keyPrefix: string;
  name: string;
  status: string;
  credits: number;
  creditCostPerRequest: number;
}

export default function TopUpCreditsPage() {
  const { setHeading, setTitle, setDescription } = usePageMetadata();
  const { isAuthenticated, user, authenticate, createListingPayment, isPaymentInProgress } = usePiNetwork();
  const router = useRouter();

  const [keys, setKeys] = useState<ApiKeyDoc[]>([]);
  const [loadingKeys, setLoadingKeys] = useState(false);
  const [selectedKeyId, setSelectedKeyId] = useState<string | null>(null);
  const [creditAmount, setCreditAmount] = useState(100);
  const [status, setStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);

  const predefinedAmounts = [50, 100, 250, 500, 1000];

  useEffect(() => {
    setHeading('Top Up Credits');
    setTitle('Top Up Credits - Zyrachain');
    setDescription('Add credits to your Oracle API key');
  }, [setHeading, setTitle, setDescription]);

  const getAuth = useCallback((): Record<string, string> => {
    const token = localStorage.getItem('pi_access_token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  }, []);

  const loadKeys = useCallback(async () => {
    setLoadingKeys(true);
    try {
      const res = await fetch('/api/oracle/keys', { headers: getAuth() });
      const data = await res.json();
      if (data.keys) setKeys(data.keys.filter((k: ApiKeyDoc) => k.status === 'active'));
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingKeys(false);
    }
  }, [getAuth]);

  useEffect(() => {
    if (isAuthenticated) loadKeys();
  }, [isAuthenticated, loadKeys]);

  const handleTopUp = async () => {
    if (!isAuthenticated || !user?._id || !selectedKeyId) {
      await authenticate();
      return;
    }

    setStatus('processing');
    setError(null);

    try {
      const result = await createListingPayment(
        'topup_credits',
        { keyId: selectedKeyId, amount: creditAmount },
        {
          email: `${user.username || 'pi'}@minepi.com`,
          name: user.username || 'Pi user',
        }
      );

      if (result.success) {
        setStatus('success');
        setTimeout(() => router.push('/api-dashboard'), 2000);
      } else {
        setError(result.error || 'Top-up failed');
        setStatus('error');
      }
    } catch (err: any) {
      setError(err.message || 'Top-up failed');
      setStatus('error');
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background p-3 pb-20 sm:p-4 mobile-nav-safe">
        <div className="max-w-md mx-auto">
          <Card>
            <CardContent className="py-8 text-center">
              <Key className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground mb-3">Connect your Pi Wallet to top up credits.</p>
              <Button onClick={() => authenticate()}>Connect Pi Wallet</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const selectedKey = keys.find(k => k._id === selectedKeyId);

  return (
    <div className="min-h-screen bg-background p-3 pb-20 sm:p-4 mobile-nav-safe">
      <div className="max-w-lg mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Link href="/api-dashboard">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Top Up Credits</h1>
            <p className="text-sm text-muted-foreground">Add credits to your API key</p>
          </div>
        </div>

        {status === 'success' ? (
          <Card>
            <CardContent className="py-8 text-center">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-3" />
              <p className="text-lg font-semibold text-foreground mb-1">Top-up successful!</p>
              <p className="text-sm text-muted-foreground">Redirecting to dashboard...</p>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Select Key */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Select API Key</CardTitle>
                <CardDescription>Choose which key to add credits to.</CardDescription>
              </CardHeader>
              <CardContent>
                {loadingKeys ? (
                  <div className="flex justify-center py-4">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : keys.length === 0 ? (
                  <div className="text-center py-4">
                    <p className="text-sm text-muted-foreground mb-3">No active keys.</p>
                    <Link href="/oracle-api">
                      <Button size="sm">Purchase an API Key</Button>
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {keys.map(k => (
                      <button
                        key={k._id}
                        onClick={() => setSelectedKeyId(k._id)}
                        className={`w-full flex items-center justify-between p-3 rounded-lg border transition-colors ${
                          selectedKeyId === k._id
                            ? 'border-primary bg-primary/5'
                            : 'border-border hover:bg-muted/50'
                        }`}
                      >
                        <div className="text-left">
                          <code className="text-xs font-mono text-foreground">{k.keyPrefix}...</code>
                          <p className="text-xs text-muted-foreground">{k.name}</p>
                        </div>
                        <div className="text-right">
                          <Badge variant="default" className="text-[10px]">{k.status}</Badge>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {(k.credits ?? 0).toFixed(1)} credits
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Amount */}
            {selectedKey && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Credit Amount</CardTitle>
                  <CardDescription>
                    1 Pi = 1 credit. Each API request costs {selectedKey.creditCostPerRequest || 0.01} credits.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-wrap gap-2">
                    {predefinedAmounts.map(amt => (
                      <button
                        key={amt}
                        onClick={() => setCreditAmount(amt)}
                        disabled={status === 'processing'}
                        className={`px-3 py-1.5 text-sm rounded-lg border font-medium transition-colors disabled:opacity-50 ${
                          creditAmount === amt
                            ? 'bg-primary text-primary-foreground border-primary'
                            : 'border-border text-foreground hover:bg-muted'
                        }`}
                      >
                        {amt} π
                      </button>
                    ))}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Coins className="h-4 w-4" />
                    <span>
                      = {creditAmount} credits → ~{(creditAmount / (selectedKey.creditCostPerRequest || 0.01)).toFixed(0)} requests
                    </span>
                  </div>

                  {error && (
                    <div className="flex items-center gap-2 text-red-500 text-sm bg-red-50 dark:bg-red-950/20 p-3 rounded-lg border border-red-200 dark:border-red-800">
                      <AlertCircle className="h-4 w-4 flex-shrink-0" />
                      <span>{error}</span>
                    </div>
                  )}

                  <Button
                    onClick={handleTopUp}
                    disabled={status === 'processing' || isPaymentInProgress}
                    className="w-full"
                  >
                    {status === 'processing' ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <Zap className="h-4 w-4 mr-2" />
                        Pay {creditAmount} Pi for {creditAmount} Credits
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </div>
  );
}
