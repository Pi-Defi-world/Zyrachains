import Link from 'next/link';
import { fetchSnapshot } from '@/lib/server-fetch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowUpRight, ArrowDownRight, Building2, Users, ExternalLink, Activity } from 'lucide-react';

type PulsePayload = {
  netChange24hCoreTeam: number;
  netChange24hCex: number;
  largestMoves24h: Array<{
    wallet: string;
    change: number;
    detectedAt: string;
  }>;
};

export async function HomePulseSection() {
  const res = await fetchSnapshot<PulsePayload>('pulse', 120);
  if (!res.success || !res.data) {
    return (
      <section className="rounded-xl border border-dashed border-border p-5 text-sm text-muted-foreground text-center">
        Pulse metrics show up once we have balance data.
      </section>
    );
  }

  const d = res.data;
  const fmt = (n: number) => n.toLocaleString(undefined, { maximumFractionDigits: 4 });

  return (
    <section className="grid grid-cols-1 gap-3 sm:gap-4 lg:grid-cols-3">
      {/* Core Team Flow */}
      <Card className="border-border/60 bg-card/40">
        <CardHeader className="pb-2 px-4 pt-4 sm:px-5 sm:pt-5">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Users className="h-4 w-4 text-purple-500" />
            Core Team (24h)
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4 sm:px-5 sm:pb-5">
          <p className={`text-2xl font-bold ${d.netChange24hCoreTeam >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
            {d.netChange24hCoreTeam >= 0 ? '+' : ''}{fmt(d.netChange24hCoreTeam)}
            <span className="text-sm font-normal text-muted-foreground ml-1">Pi</span>
          </p>
          <div className="flex items-center gap-1 mt-1">
            {d.netChange24hCoreTeam >= 0
              ? <ArrowUpRight className="h-3.5 w-3.5 text-emerald-500" />
              : <ArrowDownRight className="h-3.5 w-3.5 text-red-500" />}
            <span className="text-xs text-muted-foreground">net 24h flow</span>
          </div>
        </CardContent>
      </Card>

      {/* CEX Flow */}
      <Card className="border-border/60 bg-card/40">
        <CardHeader className="pb-2 px-4 pt-4 sm:px-5 sm:pt-5">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Building2 className="h-4 w-4 text-amber-500" />
            CEX Exchanges (24h)
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4 sm:px-5 sm:pb-5">
          <p className={`text-2xl font-bold ${d.netChange24hCex >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
            {d.netChange24hCex >= 0 ? '+' : ''}{fmt(d.netChange24hCex)}
            <span className="text-sm font-normal text-muted-foreground ml-1">Pi</span>
          </p>
          <div className="flex items-center gap-1 mt-1">
            {d.netChange24hCex >= 0
              ? <ArrowUpRight className="h-3.5 w-3.5 text-emerald-500" />
              : <ArrowDownRight className="h-3.5 w-3.5 text-red-500" />}
            <span className="text-xs text-muted-foreground">net 24h flow</span>
          </div>
        </CardContent>
      </Card>

      {/* Largest Moves */}
      <Card className="border-border/60 bg-card/40">
        <CardHeader className="pb-2 px-4 pt-4 sm:px-5 sm:pt-5">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Activity className="h-4 w-4 text-emerald-500" />
            Largest Moves (24h)
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4 sm:px-5 sm:pb-5">
          {d.largestMoves24h.length === 0 ? (
            <p className="text-xs text-muted-foreground">No moves recorded in the last 24h.</p>
          ) : (
            <div className="space-y-1">
              {d.largestMoves24h.slice(0, 7).map((m, idx) => (
                <div key={`${m.wallet}-${idx}`} className="flex items-center justify-between gap-2 py-1 border-b border-border/20 last:border-0">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="text-xs font-mono truncate max-w-[100px] sm:max-w-[160px]">{m.wallet}</span>
                    <Link href={`/account/${m.wallet}`} className="shrink-0 text-muted-foreground hover:text-primary">
                      <ExternalLink className="h-3 w-3" />
                    </Link>
                  </div>
                  <span className={`text-xs font-semibold shrink-0 ${m.change >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                    {m.change >= 0 ? '+' : ''}{fmt(m.change)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
