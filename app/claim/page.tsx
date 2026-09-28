'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, CheckCircle, Gift, Loader2, RefreshCw } from 'lucide-react';
import PiSignInButton from '@/components/social/PiSignInButton';
import { usePiNetwork } from '@/context/PiNetworkContext';
import { A2UApiError, A2UClaimableGift, A2UClaimableResponse, a2uAPI } from '@/lib/a2u-api';

export default function ClaimPage() {
  const { isAuthenticated, isLoading: authLoading } = usePiNetwork();
  const [catalog, setCatalog] = useState<A2UClaimableResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [claimingId, setClaimingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadCatalog = useCallback(async () => {
    if (!isAuthenticated) return;
    setLoading(true);
    setError(null);
    try {
      setCatalog(await a2uAPI.getClaimable());
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Unable to load gift catalog');
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    void loadCatalog();
  }, [loadCatalog]);

  const claim = async (gift: A2UClaimableGift) => {
    setClaimingId(gift.id);
    setError(null);
    try {
      await a2uAPI.claimGift(gift.id);
      await loadCatalog();
    } catch (reason) {
      const message = reason instanceof A2UApiError && reason.status === 409
        ? 'This gift is already being processed. Please try again shortly.'
        : reason instanceof Error
          ? reason.message
          : 'Unable to claim this gift';
      await loadCatalog();
      setError(message);
    } finally {
      setClaimingId(null);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 text-center shadow-sm">
          <Gift className="mx-auto mb-4 h-10 w-10 text-primary" />
          <h1 className="text-xl font-bold text-foreground">Claim a gift</h1>
          <p className="mt-2 text-sm text-muted-foreground">Connect your Pi wallet to view available gifts.</p>
          <div className="mt-5 flex justify-center">
            <PiSignInButton returnTo="/claim" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 pb-24 sm:p-6">
      <div className="mx-auto max-w-2xl">
        <Link href="/profile" className="mb-5 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" />
          Back to profile
        </Link>
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <div className="mb-2 flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10">
              <Gift className="h-6 w-6 text-primary" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">Claim Gift</h1>
            <p className="mt-1 text-sm text-muted-foreground">Receive a server-configured Pi gift from Zyrachain.</p>
          </div>
          <button
            type="button"
            onClick={() => void loadCatalog()}
            disabled={loading}
            className="rounded-lg border border-border p-2 text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-50"
            aria-label="Refresh gifts"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {error && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300">
            {error}
          </div>
        )}

        {loading && !catalog && (
          <div className="flex justify-center py-12">
            <Loader2 className="h-7 w-7 animate-spin text-primary" />
          </div>
        )}

        {catalog && !catalog.enabled && (
          <div className="rounded-xl border border-border bg-card p-5 text-sm text-muted-foreground">
            Gift claims are currently unavailable.
          </div>
        )}

        {catalog?.enabled && catalog.gifts.length === 0 && (
          <div className="rounded-xl border border-border bg-card p-5 text-sm text-muted-foreground">
            No gifts are available right now.
          </div>
        )}

        <div className="space-y-3">
          {catalog?.gifts.map((gift) => {
            const isClaimed = gift.status === 'claimed';
            const isProcessing = gift.status === 'processing';
            const isClaiming = claimingId === gift.id;
            return (
              <div key={gift.id} className="rounded-2xl border border-border bg-card p-5 shadow-sm">
                <div className="flex items-start gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                    <Gift className="h-5 w-5 text-primary" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-base font-semibold text-foreground">{gift.title}</h2>
                      {isClaimed && <CheckCircle className="h-4 w-4 text-emerald-500" />}
                    </div>
                    {gift.description && <p className="mt-1 text-sm text-muted-foreground">{gift.description}</p>}
                    <p className="mt-3 text-lg font-bold text-foreground">{gift.amount} π</p>
                    <p className="mt-1 text-xs text-muted-foreground">{gift.memo}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => void claim(gift)}
                  disabled={!gift.claimable || isClaimed || isProcessing || isClaiming}
                  className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isClaiming || isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : isClaimed ? <CheckCircle className="h-4 w-4" /> : <Gift className="h-4 w-4" />}
                  {isClaiming ? 'Claiming...' : isProcessing ? 'Processing...' : isClaimed ? 'Claimed' : 'Claim Gift'}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
