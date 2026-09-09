import Link from 'next/link';
import { Suspense } from 'react';
import { fetchSnapshot } from '@/lib/server-fetch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Wallet, ExternalLink } from 'lucide-react';
import { HomeRealtimeTransactions } from '@/components/home/HomeRealtimeTransactions';

type TopWalletsPayload = {
  wallets: Array<{
    identifier: string;
    name: string;
    category: 'CEX' | 'Core Team' | 'Generated';
    balance: number | null;
  }>;
};

const categoryColors: Record<string, string> = {
  CEX: 'bg-muted text-foreground',
  'Core Team': 'bg-secondary text-foreground',
  Generated: 'bg-accent text-foreground',
};

export async function HomeTopWalletsSection() {
  const res = await fetchSnapshot<TopWalletsPayload>('top-wallets', 300);
  if (!res.success || !res.data) {
    return (
      <section className="rounded border border-dashed border-border p-5 text-sm text-muted-foreground text-center">
        Wallet data temporarily unavailable. The API server may be offline.
      </section>
    );
  }

  const wallets = res.data.wallets.slice(0, 25);
  const totalBalance = wallets.reduce((s, w) => s + (w.balance || 0), 0);

  return (
    <section className="grid grid-cols-1 gap-3 sm:gap-4 lg:grid-cols-3">
      <Card className="lg:col-span-2 border border-border bg-card">
        <CardHeader className="pb-2 px-4 pt-4 sm:px-5 sm:pt-5 flex-row items-center justify-between">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Wallet className="h-4 w-4" />
            Top Tracked Wallets
          </CardTitle>
          <Link href="/pct-wallet-monitor" className="text-xs text-primary hover:underline shrink-0">
            View all
          </Link>
        </CardHeader>
        <CardContent className="px-4 pb-4 sm:px-5 sm:pb-5">
          <div className="overflow-x-auto -mx-4 sm:-mx-5">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs w-8">#</TableHead>
                  <TableHead className="text-xs">Wallet</TableHead>
                  <TableHead className="text-xs">Type</TableHead>
                  <TableHead className="text-right text-xs">Balance (Pi)</TableHead>
                  <TableHead className="text-right text-xs">% of Tracked</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {wallets.map((w, i) => (
                  <TableRow key={w.identifier}>
                    <TableCell className="text-xs text-muted-foreground font-mono">{i + 1}</TableCell>
                    <TableCell className="max-w-[120px] sm:max-w-[220px] truncate">
                      <div className="flex items-center gap-1.5">
                        <Link href={`/account/${w.identifier}`} className="text-primary hover:underline text-xs sm:text-sm font-medium truncate">
                          {w.name}
                        </Link>
                        <ExternalLink className="h-3 w-3 text-muted-foreground shrink-0" />
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={`text-[10px] px-1.5 py-0.5 ${categoryColors[w.category] || ''}`}>
                        {w.category}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right text-xs sm:text-sm font-medium">
                      {typeof w.balance === 'number'
                        ? w.balance.toLocaleString(undefined, { maximumFractionDigits: 2 })
                        : '—'}
                    </TableCell>
                    <TableCell className="text-right text-xs text-muted-foreground">
                      {totalBalance > 0 ? `${((w.balance || 0) / totalBalance * 100).toFixed(1)}%` : '—'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Real-time transaction feed */}
      <div className="lg:col-span-1">
        <Suspense fallback={
          <Card className="border border-border bg-card">
            <CardHeader className="pb-2 px-4 pt-4 sm:px-5 sm:pt-5">
              <CardTitle className="text-sm font-semibold">Transactions</CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4 sm:px-5 sm:pb-5">
              <div className="animate-pulse space-y-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="h-8 bg-muted rounded" />
                ))}
              </div>
            </CardContent>
          </Card>
        }>
          <HomeRealtimeTransactions />
        </Suspense>
      </div>
    </section>
  );
}
