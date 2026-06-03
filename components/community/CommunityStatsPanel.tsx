'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Minus, Users, Activity, BarChart3, Trophy } from 'lucide-react';

export interface CommunityOverviewEntry {
  listingId: string;
  name: string;
  category: string;
  handle: string;
  followers: number | null;
  followingCount: number | null;
  tweetCount: number | null;
  profileImageUrl: string | null;
  verified: boolean | null;
  change24hAbs: number | null;
  change24hPct: number | null;
  change7dAbs: number | null;
  change7dPct: number | null;
  error: string | null;
  fetchedAt: string | null;
}

interface CommunityStatsPanelProps {
  data: CommunityOverviewEntry | null;
  loading?: boolean;
}

function fmt(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString();
}

function GrowthBadge({ abs, pct }: { abs: number | null; pct: number | null }) {
  if (abs == null) return <span className="text-xs text-muted-foreground">—</span>;
  if (abs > 0) {
    return (
      <span className="inline-flex items-center gap-0.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
        <TrendingUp className="h-3 w-3" />
        +{fmt(abs)}
        {pct != null && <span className="text-[10px] opacity-70">({pct}%)</span>}
      </span>
    );
  }
  if (abs < 0) {
    return (
      <span className="inline-flex items-center gap-0.5 text-xs font-medium text-red-500">
        <TrendingDown className="h-3 w-3" />
        {fmt(abs)}
        {pct != null && <span className="text-[10px] opacity-70">({pct}%)</span>}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-0.5 text-xs text-muted-foreground">
      <Minus className="h-3 w-3" />
      0
    </span>
  );
}

export default function CommunityStatsPanel({ data, loading }: CommunityStatsPanelProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 animate-pulse">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="bg-card/50">
            <CardContent className="p-4">
              <div className="h-3 w-16 bg-muted rounded mb-2" />
              <div className="h-6 w-24 bg-muted rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Users className="h-8 w-8 mx-auto mb-2" />
        <p className="text-sm">No community data available</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        {data.profileImageUrl && (
          <img
            src={data.profileImageUrl}
            alt={data.name}
            className="h-10 w-10 rounded-full border border-border"
          />
        )}
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-foreground truncate">{data.name}</h3>
            {data.verified && (
              <Badge variant="secondary" className="h-4 px-1 text-[10px]">Verified</Badge>
            )}
          </div>
          <a
            href={`https://x.com/${data.handle}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-muted-foreground hover:text-emerald-500 transition-colors"
          >
            @{data.handle}
          </a>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="bg-card/50 border-border/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-1.5 mb-1">
              <Users className="h-3.5 w-3.5 text-muted-foreground" />
              <p className="text-xs text-muted-foreground">Followers</p>
            </div>
            <p className="text-xl font-bold">
              {data.followers != null ? fmt(data.followers) : '—'}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card/50 border-border/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-1.5 mb-1">
              <Activity className="h-3.5 w-3.5 text-muted-foreground" />
              <p className="text-xs text-muted-foreground">24h Growth</p>
            </div>
            <div className="text-xl font-bold">
              <GrowthBadge abs={data.change24hAbs} pct={data.change24hPct} />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/50 border-border/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-1.5 mb-1">
              <BarChart3 className="h-3.5 w-3.5 text-muted-foreground" />
              <p className="text-xs text-muted-foreground">7d Growth</p>
            </div>
            <div className="text-xl font-bold">
              <GrowthBadge abs={data.change7dAbs} pct={data.change7dPct} />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/50 border-border/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-1.5 mb-1">
              <Trophy className="h-3.5 w-3.5 text-muted-foreground" />
              <p className="text-xs text-muted-foreground">Following/Tweets</p>
            </div>
            <p className="text-lg font-bold">
              {data.followingCount != null ? fmt(data.followingCount) : '—'}
              <span className="text-xs text-muted-foreground mx-1.5">/</span>
              {data.tweetCount != null ? fmt(data.tweetCount) : '—'}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
