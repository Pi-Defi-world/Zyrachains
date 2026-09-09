'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { usePageMetadata } from '@/context/pagemetadataContext';
import apiClient from '@/lib/api-client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { AlertTriangle, TrendingUp, BarChart3, RefreshCw } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { useCommunityOverview, type CommunityOverviewEntry } from '@/lib/use-community-follower-data';
import CommunityGrowthChart from '@/components/charts/CommunityGrowthChart';
import CommunityStatsPanel from '@/components/community/CommunityStatsPanel';

export default function CommunityGrowthPage() {
  const { setHeading, setTitle, setDescription } = usePageMetadata();
  const { overview, loading, error, refresh } = useCommunityOverview();
  const [selectedHandle, setSelectedHandle] = useState<string | null>(null);
  const [selectedName, setSelectedName] = useState<string | null>(null);

  useEffect(() => {
    setHeading('Community Growth');
    setTitle('Community Growth | Zyrachain');
    setDescription('Real-time Twitter follower tracking and growth analytics for Pi Network communities.');
  }, [setHeading, setTitle, setDescription]);

  const communities = overview?.communities ?? [];
  const totalFollowers = overview?.totalFollowers ?? 0;

  const selectedEntry = useMemo(
    () => communities.find((c) => c.handle === selectedHandle) ?? null,
    [communities, selectedHandle]
  );

  if (loading) {
    return (
      <div className="white-zone flex justify-center items-center py-16 gap-2">
        <Spinner />
        <span className="text-muted-foreground">Loading community data…</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="white-zone max-w-lg mx-auto py-12 px-4">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex gap-3">
          <AlertTriangle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-red-800 dark:text-red-300">Could not load community data</p>
            <p className="text-sm text-red-700 dark:text-red-400 mt-1">{String(error)}</p>
            <Button variant="outline" size="sm" className="mt-3" onClick={() => refresh()}>
              Retry
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10 max-w-7xl mx-auto">
      <PageHeader
        title="Community Growth"
        description="Real-time X (Twitter) follower tracking and growth analytics for tracked Pi Network communities."
      >
        <Button variant="outline" size="sm" onClick={() => refresh()}>
          <RefreshCw className="h-3.5 w-3.5 mr-1" />
          Refresh
        </Button>
      </PageHeader>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-6 sm:mb-8">
        <Card className="bg-card/80 backdrop-blur-sm border border-border/50">
          <CardContent className="p-4 sm:p-5">
            <p className="text-xs sm:text-sm text-muted-foreground">Tracked Communities</p>
            <p className="text-2xl font-bold text-foreground">{communities.length}</p>
          </CardContent>
        </Card>
        <Card className="bg-card/80 backdrop-blur-sm border border-border/50">
          <CardContent className="p-4 sm:p-5">
            <p className="text-xs sm:text-sm text-muted-foreground">Total X Followers</p>
            <p className="text-2xl font-bold text-foreground">{totalFollowers.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card className="bg-card/80 backdrop-blur-sm border border-border/50">
          <CardContent className="p-4 sm:p-5">
            <p className="text-xs sm:text-sm text-muted-foreground">Profiles with X data</p>
            <p className="text-2xl font-bold text-foreground">
              {communities.filter((c) => c.followers != null).length}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Community Selection Grid */}
      {communities.length > 0 ? (
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-wrap gap-2">
            <Badge
              variant={!selectedHandle ? 'default' : 'outline'}
              className="cursor-pointer px-3 py-1.5"
              onClick={() => { setSelectedHandle(null); setSelectedName(null); }}
            >
              All
            </Badge>
            {communities.map((c) => (
              <Badge
                key={c.handle}
                variant={selectedHandle === c.handle ? 'default' : 'outline'}
                className="cursor-pointer px-3 py-1.5"
                onClick={() => { setSelectedHandle(c.handle); setSelectedName(c.name); }}
              >
                {c.name}
              </Badge>
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center py-12">
          <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">
            No communities with X handles found. Add Twitter handles to community listings to start tracking growth.
          </p>
        </div>
      )}

      {/* Selected Community Detail */}
      {selectedHandle && selectedEntry ? (
        <div className="space-y-6">
          <CommunityStatsPanel data={selectedEntry} />
          <CommunityGrowthChart
            history={[]}
            stats={null}
            legend={`@${selectedHandle} Follower Growth`}
            loading={false}
          />
          <SelectedCommunityChart handle={selectedHandle} name={selectedName ?? selectedHandle} />
        </div>
      ) : (
        /* All Communities Ranked Overview */
        <div className="space-y-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-emerald-500" />
            Ranked by Followers
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {communities
              .filter((c) => c.followers != null)
              .sort((a, b) => (b.followers ?? 0) - (a.followers ?? 0))
              .map((c) => (
                <Card
                  key={c.handle}
                  className="bg-card/50 border-border/30 hover:border-emerald-500/30 cursor-pointer transition-colors"
                  onClick={() => { setSelectedHandle(c.handle); setSelectedName(c.name); }}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      {c.profileImageUrl && (
                        <img
                          src={c.profileImageUrl}
                          alt={c.name}
                          className="h-10 w-10 rounded-full border border-border"
                        />
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium truncate">{c.name}</p>
                          {c.verified && (
                            <Badge variant="secondary" className="h-4 px-1 text-[10px]">V</Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">@{c.handle}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold">{(c.followers ?? 0).toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground">{c.category}</p>
                      </div>
                    </div>
                    {c.change24hAbs != null && (
                      <div className="mt-2 pt-2 border-t border-border/20 flex gap-3 text-xs">
                        <span className={c.change24hAbs > 0 ? 'text-emerald-500' : c.change24hAbs < 0 ? 'text-red-500' : 'text-muted-foreground'}>
                          24h: {c.change24hAbs > 0 ? '+' : ''}{c.change24hAbs.toLocaleString()}
                          {c.change24hPct != null && ` (${c.change24hPct}%)`}
                        </span>
                        {c.change7dAbs != null && (
                          <span className={c.change7dAbs > 0 ? 'text-emerald-500' : c.change7dAbs < 0 ? 'text-red-500' : 'text-muted-foreground'}>
                            7d: {c.change7dAbs > 0 ? '+' : ''}{c.change7dAbs.toLocaleString()}
                            {c.change7dPct != null && ` (${c.change7dPct}%)`}
                          </span>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
          </div>
          {communities.filter((c) => c.followers == null).length > 0 && (
            <div className="mt-4 text-center">
              <p className="text-sm text-muted-foreground">
                {communities.filter((c) => c.followers == null).length} communities pending first X data fetch
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function SelectedCommunityChart({ handle, name }: { handle: string; name: string }) {
  const [range, setRange] = useState<'1d' | '7d' | '30d' | '90d'>('7d');
  const [historyData, setHistoryData] = useState<any[]>([]);
  const [statsData, setStatsData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [histRes, statsRes] = await Promise.all([
        apiClient.getCommunityFollowerHistory(handle, range),
        apiClient.getCommunityFollowerStats(handle),
      ]);
      setHistoryData(histRes.data ?? []);
      setStatsData(statsRes);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [handle, range]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground">Range:</span>
        {(['1d', '7d', '30d', '90d'] as const).map((r) => (
          <Badge
            key={r}
            variant={range === r ? 'default' : 'outline'}
            className="cursor-pointer text-xs px-2 py-0.5"
            onClick={() => setRange(r)}
          >
            {r}
          </Badge>
        ))}
      </div>
      <CommunityGrowthChart
        history={historyData}
        stats={statsData}
        legend={`@${handle} — ${name}`}
        loading={loading}
      />
    </div>
  );
}
