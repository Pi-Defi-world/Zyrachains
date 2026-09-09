import { fetchSnapshot } from '@/lib/server-fetch';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Globe, ExternalLink } from 'lucide-react';

type EcoPayload = {
  communities: Record<string, unknown>[];
  influencers: Record<string, unknown>[];
};

export async function HomeEcosystemSection() {
  const res = await fetchSnapshot<EcoPayload>('ecosystem-leaderboards', 600);
  if (!res.success || !res.data) {
    return (
      <section className="rounded border border-dashed border-border p-5 text-sm text-muted-foreground text-center">
        Ecosystem data temporarily unavailable. The API server may be offline.
      </section>
    );
  }

  const communities = (res.data.communities || []) as Array<{
    Name?: string;
    Members?: number;
    Category?: string;
    Region?: string;
  }>;

  const totalCommunities = communities.length;
  const totalMembers = communities.reduce((s, c) => s + (c.Members || 0), 0);
  const categories = [...new Set(communities.map((c) => c.Category || 'Other'))];
  const topCommunities = communities
    .sort((a, b) => (b.Members || 0) - (a.Members || 0))
    .slice(0, 8);

  return (
    <section className="grid grid-cols-1 gap-3 sm:gap-4 lg:grid-cols-3">
      {/* Stats summary */}
      <Card className="lg:col-span-1 border border-border bg-card">
        <CardHeader className="pb-2 px-4 pt-4 sm:px-5 sm:pt-5">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Globe className="h-4 w-4" />
            Ecosystem Overview
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4 sm:px-5 sm:pb-5 space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Total Communities</span>
            <span className="font-semibold">{totalCommunities.toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Total Members</span>
            <span className="font-semibold">{totalMembers.toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Categories</span>
            <span className="font-semibold">{categories.length}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Avg Members</span>
            <span className="font-semibold">
              {totalCommunities > 0 ? Math.round(totalMembers / totalCommunities).toLocaleString() : '0'}
            </span>
          </div>
          <div className="pt-2">
            <Link href="/ecology" className="text-xs text-primary hover:underline">
              View full ecosystem →
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Top Communities */}
      <Card className="lg:col-span-2 border border-border bg-card">
        <CardHeader className="pb-2 px-4 pt-4 sm:px-5 sm:pt-5">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Users className="h-4 w-4" />
            Largest Communities
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4 sm:px-5 sm:pb-5">
          {topCommunities.length === 0 ? (
            <p className="text-xs text-muted-foreground">No community data available.</p>
          ) : (
            <div className="space-y-1.5">
              {topCommunities.map((c, i) => (
                <div key={c.Name || i} className="flex items-center justify-between gap-3 py-1.5 border-b border-border/30 last:border-0">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <span className="text-xs font-mono text-muted-foreground w-5 shrink-0 text-right">#{i + 1}</span>
                    <span className="text-sm font-medium truncate">{c.Name}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-foreground shrink-0">
                      {c.Category || 'General'}
                    </span>
                  </div>
                  <span className="text-sm font-semibold shrink-0">{(c.Members || 0).toLocaleString()}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
