'use client';

import React, { useEffect, useState } from 'react';
import { Users, Gift, Copy, CheckCircle, Link2 } from 'lucide-react';
import { socialAPI } from '@/lib/social-api-client';

export default function ReferralCard() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [code, setCode] = useState('');
  const [applying, setApplying] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await socialAPI.getReferralStats();
        setStats(res.data);
      } catch (err) {
        console.error('Failed to load referral stats:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const applyCode = async () => {
    if (!code.trim()) return;
    setApplying(true);
    setMessage(null);
    try {
      const res = await socialAPI.applyReferral(code.trim());
      setMessage({ ok: true, text: res.message || 'Referral applied!' });
      setCode('');
      const fresh = await socialAPI.getReferralStats();
      setStats(fresh.data);
    } catch (err: any) {
      setMessage({ ok: false, text: err.message || 'Failed to apply referral code' });
    } finally {
      setApplying(false);
    }
  };

  const copyLink = async () => {
    if (!stats?.code) return;
    const url = `${window.location.origin}/social?ref=${encodeURIComponent(stats.code)}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (err) {
      /* ignore */
    }
  };

  return (
    <div className="bg-card rounded-xl sm:rounded-2xl p-4 sm:p-5 mb-4 sm:mb-6 shadow-sm border border-border/50">
      <div className="flex items-center gap-2 mb-3">
        <Gift className="h-4 w-4 text-primary" />
        <h2 className="text-sm font-semibold text-foreground">Referrals</h2>
      </div>

      {loading ? (
        <p className="text-xs text-muted-foreground">Loading…</p>
      ) : (
        <>
          {stats?.code ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between rounded-lg border border-border/60 px-3 py-2">
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Your code</p>
                  <p className="text-sm font-semibold text-foreground">@{stats.code}</p>
                </div>
                <button
                  onClick={copyLink}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors"
                >
                  {copied ? <CheckCircle className="w-3.5 h-3.5" /> : <Link2 className="w-3.5 h-3.5" />}
                  {copied ? 'Copied' : 'Copy link'}
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2 text-center">
                <div className="rounded-lg bg-muted/50 px-2 py-2">
                  <p className="text-lg font-bold text-foreground">{stats.referral_count ?? 0}</p>
                  <p className="text-[10px] text-muted-foreground flex items-center justify-center gap-1">
                    <Users className="w-2.5 h-2.5" /> Referrals
                  </p>
                </div>
                <div className="rounded-lg bg-muted/50 px-2 py-2">
                  <p className="text-lg font-bold text-accent">{stats.total_earned?.toFixed(2) ?? '0.00'} ZP</p>
                  <p className="text-[10px] text-muted-foreground">Earned</p>
                </div>
              </div>

              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Share your referral link. When a new user signs up and enters your username, you earn ZP.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">
                Enter the username of the person who referred you to earn them a reward.
              </p>
              <div className="flex gap-2">
                <input
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="@username"
                  className="flex-1 min-w-0 rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary/60"
                />
                <button
                  onClick={applyCode}
                  disabled={applying || !code.trim()}
                  className="px-4 py-2 rounded-md bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors shrink-0"
                >
                  {applying ? '…' : 'Apply'}
                </button>
              </div>
            </div>
          )}

          {message && (
            <p className={`mt-2 text-xs ${message.ok ? 'text-green-600' : 'text-red-500'}`}>
              {message.text}
            </p>
          )}
        </>
      )}
    </div>
  );
}
