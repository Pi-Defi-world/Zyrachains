'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePageMetadata } from '@/context/pagemetadataContext';
import { usePiNetwork } from '@/context/PiNetworkContext';
import { LISTING_PAYMENTS } from '@/lib/pi-network';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Loader2, KeyRound, Copy, Check } from 'lucide-react';
import { getPublicBackendUrl } from '@/lib/get-backend-url';

const BASE = getPublicBackendUrl();

export default function OracleApiPage() {
  const { setTitle, setDescription, setHeading } = usePageMetadata();
  const { isAuthenticated, user, authenticate, syncUser, createListingPayment, isPaymentInProgress } =
    usePiNetwork();
  const [keyName, setKeyName] = useState('My Oracle key');
  const [newKey, setNewKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [keys, setKeys] = useState<
    Array<{
      _id: string;
      keyPrefix: string;
      name: string;
      status: string;
      createdAt: string;
      expiresAt?: string;
    }>
  >([]);
  const [loadingKeys, setLoadingKeys] = useState(false);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    setHeading('Pi Price Oracle API');
    setTitle('Oracle API');
    setDescription('Purchase API access with Pi and query aggregated Pi Network price data.');
  }, [setHeading, setTitle, setDescription]);

  const loadKeys = async () => {
    const token = localStorage.getItem('pi_access_token');
    if (!token) return;
    setLoadingKeys(true);
    try {
      const res = await fetch(`${BASE}/api/oracle/keys`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.keys) setKeys(data.keys);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingKeys(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) loadKeys();
  }, [isAuthenticated]);

  // Auto-retry backend sync when authenticated but _id is missing
  useEffect(() => {
    if (!isAuthenticated || user?._id) return;
    const timer = setTimeout(() => {
      setSyncing(true);
      syncUser().finally(() => setSyncing(false));
    }, 500);
    return () => clearTimeout(timer);
  }, [isAuthenticated, user?._id, syncUser]);

  const handleRetrySync = async () => {
    setSyncing(true);
    await syncUser();
    setSyncing(false);
  };

  const handlePurchase = async () => {
    if (!isAuthenticated) {
      await authenticate();
      return;
    }
    let currentUser = user;
    if (!currentUser?._id) {
      setSyncing(true);
      currentUser = await syncUser();
      setSyncing(false);
      if (!currentUser?._id) return;
    }
    setNewKey(null);
    const result = await createListingPayment(
      'oracle_api',
      {
        userId: String(currentUser._id),
        name: keyName || 'Oracle API Key',
      },
      {
        email: `${currentUser.username || 'pi'}@minepi.com`,
        name: currentUser.username || 'Pi user',
      }
    );
    if (result.apiKey) {
      setNewKey(result.apiKey);
      await loadKeys();
    } else if (result.success && result.alreadyCompleted) {
      await loadKeys();
    }
  };

  const copyKey = async () => {
    if (!newKey) return;
    await navigator.clipboard.writeText(newKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const cfg = LISTING_PAYMENTS.oracle_api;

  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <div className="max-w-3xl mx-auto space-y-8">
        <div>
          <Badge variant="secondary" className="mb-2">
            Zyrachain service
          </Badge>
          <h1 className="text-3xl font-bold font-heading text-foreground">Pi Price Oracle API</h1>
          <p className="text-muted-foreground mt-2">
            Pay <strong>{cfg.amount} Pi</strong> to receive an API key. Use it to access
            aggregated PI/USD price data, health checks, and optional Horizon proxy endpoints.
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            Base URL:{' '}
            <code className="text-xs bg-muted px-1 py-0.5 rounded">{BASE}/api/oracle</code>
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <KeyRound className="h-5 w-5 text-primary" />
              Get an API key
            </CardTitle>
            <CardDescription>
              Connect with Pi Browser, authenticate, then complete the in-app payment.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!isAuthenticated && (
              <Button onClick={() => authenticate()} className="w-full sm:w-auto">
                Connect Pi Wallet
              </Button>
            )}
            {isAuthenticated && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="keyName">Key label (optional)</Label>
                  <Input
                    id="keyName"
                    value={keyName}
                    onChange={(e) => setKeyName(e.target.value)}
                    placeholder="e.g. Production app"
                  />
                </div>
                <Button onClick={handlePurchase} disabled={isPaymentInProgress || !user?._id}>
                  {isPaymentInProgress ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Payment in progress…
                    </>
                  ) : (
                    `Pay ${cfg.amount} Pi for API key`
                  )}
                </Button>
                {!user?._id && isAuthenticated && (
                  <div className="flex items-center gap-3 text-sm text-amber-600 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
                    <Loader2 className={`h-4 w-4 flex-shrink-0 ${syncing ? 'animate-spin' : ''}`} />
                    <span className="flex-1">
                      {syncing ? 'Syncing your account…' : 'Account sync pending.'}
                    </span>
                    {!syncing && (
                      <Button variant="outline" size="sm" onClick={handleRetrySync}>
                        Retry
                      </Button>
                    )}
                  </div>
                )}
              </>
            )}

            {newKey && (
              <div className="rounded-lg border border-primary/30 bg-primary/5 p-4 space-y-2">
                <p className="text-sm font-medium text-foreground">{LISTING_PAYMENTS.oracle_api.memo}</p>
                <p className="text-xs text-muted-foreground">
                  Copy and store this key securely. It cannot be shown again.
                </p>
                <div className="flex flex-wrap gap-2 items-center">
                  <code className="text-xs break-all bg-background px-2 py-1 rounded border flex-1 min-w-0">
                    {newKey}
                  </code>
                  <Button type="button" variant="outline" size="sm" onClick={copyKey}>
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Your keys</CardTitle>
            <CardDescription>Prefixes only — full secret is never stored in plain text.</CardDescription>
          </CardHeader>
          <CardContent>
            {loadingKeys ? (
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            ) : keys.length === 0 ? (
              <p className="text-sm text-muted-foreground">No keys yet.</p>
            ) : (
              <ul className="space-y-2">
                {keys.map((k) => (
                  <li
                    key={k._id}
                    className="flex justify-between items-center text-sm border rounded-md px-3 py-2"
                  >
                    <span>
                      <span className="font-mono">{k.keyPrefix}…</span>
                      <span className="text-muted-foreground ml-2">{k.name}</span>
                    </span>
                    <Badge variant={k.status === 'active' ? 'default' : 'secondary'}>{k.status}</Badge>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Example request</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="text-xs bg-muted p-4 rounded-md overflow-x-auto">
              {`curl -H "X-API-Key: YOUR_ZYRA_KEY" \\
  "${BASE}/api/oracle/v1/price"`}
            </pre>
            <p className="text-sm text-muted-foreground mt-4">
              See also{' '}
              <Link href="/api-documentation" className="text-primary hover:underline">
                API documentation
              </Link>{' '}
              for the full endpoint list.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
