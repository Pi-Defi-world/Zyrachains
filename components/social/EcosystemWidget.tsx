'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Users, Globe, Flame, Loader2 } from 'lucide-react';
import { useLanguage } from '@/context/languagecontext';

type EcoPayload = {
  communities: Array<{ Name?: string; Members?: number; Category?: string }>;
  influencers: Array<{ name?: string; Name?: string; followers?: number; Followers?: number }>;
};

export default function EcosystemWidget() {
  const { t } = useLanguage();
  const [data, setData] = useState<EcoPayload | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/v2/home/ecosystem-leaderboards');
        const json = await res.json();
        if (!cancelled && json?.success) setData(json.data);
      } catch (err) {
        console.error('Failed to load ecosystem stats:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground py-3">
        <Loader2 className="w-3.5 h-3.5 animate-spin" /> {t('social.eco_loading')}
      </div>
    );
  }

  const communities = (data?.communities || []) as Array<{ Name?: string; Members?: number; Category?: string }>;
  const influencers = (data?.influencers || []) as Array<{ name?: string; Name?: string; followers?: number; Followers?: number }>;

  const totalCommunities = communities.length;
  const totalMembers = communities.reduce((s, c) => s + (c.Members || 0), 0);
  const totalInfluencers = influencers.length;
  const totalFollowers = influencers.reduce(
    (s, i) => s + (typeof i.followers === 'number' ? i.followers : i.Followers || 0),
    0
  );
  const topCommunities = [...communities]
    .sort((a, b) => (b.Members || 0) - (a.Members || 0))
    .slice(0, 5);

  return (
    <div className="rounded-lg border border-border bg-card p-3 text-xs">
      <div className="flex items-center gap-1.5 font-semibold text-foreground mb-2">
        <Globe className="w-3.5 h-3.5 text-accent" /> {t('social.eco_analytics')}
      </div>

      <div className="grid grid-cols-2 gap-2 mb-2">
        <div className="rounded bg-muted/50 px-2 py-1.5">
          <p className="text-[10px] text-muted-foreground flex items-center gap-1">
            <Users className="w-2.5 h-2.5" /> {t('social.eco_communities')}
          </p>
          <p className="font-semibold text-foreground">{totalCommunities.toLocaleString()}</p>
          <p className="text-[10px] text-muted-foreground">{t('social.eco_members_count', { count: totalMembers.toLocaleString() })}</p>
        </div>
        <div className="rounded bg-muted/50 px-2 py-1.5">
          <p className="text-[10px] text-muted-foreground flex items-center gap-1">
            <Flame className="w-2.5 h-2.5" /> {t('social.eco_influencers')}
          </p>
          <p className="font-semibold text-foreground">{totalInfluencers.toLocaleString()}</p>
          <p className="text-[10px] text-muted-foreground">{t('social.eco_followers_count', { count: totalFollowers.toLocaleString() })}</p>
        </div>
      </div>

      {topCommunities.length > 0 && (
        <>
          <p className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1">
            {t('social.eco_top_communities')}
          </p>
          <div className="space-y-1">
            {topCommunities.map((c, i) => (
              <div key={c.Name || i} className="flex items-center justify-between gap-2">
                <span className="truncate text-foreground/90">
                  <span className="font-mono text-muted-foreground mr-1">#{i + 1}</span>
                  {c.Name}
                </span>
                <span className="font-semibold shrink-0">{(c.Members || 0).toLocaleString()}</span>
              </div>
            ))}
          </div>
        </>
      )}

      <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2 pt-2 border-t border-border">
        <Link href="/ecosystem/communities" className="text-accent hover:underline">
          {t('social.eco_communities')} →
        </Link>
        <Link href="/ecosystem/influencers" className="text-accent hover:underline">
          {t('social.eco_influencers')} →
        </Link>
        <Link href="/ecosystem" className="text-accent hover:underline">
          {t('social.eco_all')}
        </Link>
      </div>
    </div>
  );
}
