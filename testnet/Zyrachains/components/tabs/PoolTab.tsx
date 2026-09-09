'use client';
import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

interface Reserve {
  asset?: string;
  amount?: string;
}

interface Pool {
  id?: string;
  paging_token?: string;
  fee_bp?: number;
  type?: string;
  total_trustlines?: string;
  total_shares?: string;
  reserves?: Reserve[];
  last_modified_ledger?: number;
  last_modified_time?: string;
  _links?: {
    self?: { href?: string };
    operations?: { href?: string };
    transactions?: { href?: string };
  };
}

interface PoolsApiResponse {
  _embedded: { records: Pool[] };
  _links: { self: { href: string }; next?: { href: string }; prev?: { href: string } };
}

interface PoolTabProps {
  onLoad?: (pools: Pool[]) => void;
}

export default function PoolTab({ onLoad }: PoolTabProps) {
  const [pools, setPools] = useState<Pool[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");

  // 60s cache helpers
  const CACHE_TTL_MS = 300_000; // 5 minutes
  const getCached = (key: string) => {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed.ts !== 'number') return null;
      if (Date.now() - parsed.ts > CACHE_TTL_MS) return null;
      return parsed.data as PoolsApiResponse;
    } catch { return null; }
  };
  const setCached = (key: string, data: any) => {
    try { localStorage.setItem(key, JSON.stringify({ ts: Date.now(), data })); } catch {}
  };

  const fetchPools = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      // Prefer snapshot (server prefetch)
      try {
        const r = await fetch('/api/v2/home/assets-pools');
        const j = await r.json();
        const pools = j?.data?.pools;
        const records = (pools as PoolsApiResponse | undefined)?._embedded?.records || [];
        if (j?.success && records.length > 0) {
          setPools(records);
          onLoad?.(records);
          setLoading(false);
          return;
        }
      } catch {
        /* fallback */
      }

      // Use server-side proxy to avoid CORS issues
      try {
        const r = await fetch('/api/horizon/testnet/assets-pools');
        const j = await r.json();
        const poolRecords = j?.data?.pools;
        if (j?.success && Array.isArray(poolRecords) && poolRecords.length > 0) {
          setPools(poolRecords);
          onLoad?.(poolRecords);
          setLoading(false);
          return;
        }
      } catch {
        /* fallback */
      }

      setError('No pools available');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [onLoad]);

  useEffect(() => { fetchPools(); }, [fetchPools]);

  const formatAsset = (assetString?: string): string => {
    if (!assetString) return 'Unknown';
    if (assetString === 'native') return 'PI';
    const parts = assetString.split(':');
    if (parts.length === 2) {
      const [assetCode, issuer] = parts;
      return `${assetCode}:${issuer.substring(0, 8)}...`;
    }
    return assetString;
  };

  const formatAmount = (amount?: string): string => {
    if (!amount || amount === '') return '0';
    const num = parseFloat(amount);
    if (isNaN(num)) return '0';
    return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 7 });
  };

  const formatDateTime = (dateString?: string): string => {
    if (!dateString) return 'Unknown';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Invalid Date';
    return date.toLocaleString();
  };

  const filteredPools = pools.filter(pool =>
    pool.id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    pool.reserves?.some(reserve => formatAsset(reserve.asset).toLowerCase().includes(searchQuery.toLowerCase()))
  );

  if (loading) return <div className="py-6 sm:py-8 text-center text-sm sm:text-base text-muted-foreground">Loading pools…</div>;
  if (error) return <div className="py-6 sm:py-8 text-center text-sm sm:text-base text-red-500">{error}</div>;

  return (
    <div className="w-full">
      <div className="mb-4 sm:mb-6">
        <Input
          placeholder="Search pools by ID or asset..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full sm:max-w-md text-sm sm:text-base"
        />
      </div>

      <div className="grid gap-4 sm:gap-6">
        {filteredPools.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <p className="text-sm sm:text-base text-muted-foreground">{searchQuery ? 'No pools found matching your search.' : 'No pools available.'}</p>
            </CardContent>
          </Card>
        ) : (
          filteredPools.map((pool) => (
            <Card key={pool.id || `pool-${Math.random()}`} className="hover:shadow-lg transition-shadow">
              <CardHeader className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-base sm:text-lg break-all">
                      Pool {pool.id ? `${pool.id.substring(0, 8)}...${pool.id.substring(pool.id.length - 8)}` : 'Unknown'}
                    </CardTitle>
                    <CardDescription className="text-xs sm:text-sm mt-1">
                      <span className="block sm:inline">Fee: {((pool.fee_bp || 0) / 100).toFixed(2)}%</span>
                      <span className="hidden sm:inline"> • </span>
                      <span className="block sm:inline">Trustlines: {parseInt(pool.total_trustlines || '0').toLocaleString()}</span>
                    </CardDescription>
                  </div>
                  <div className="text-left sm:text-right flex-shrink-0">
                    <div className="text-xs sm:text-sm text-muted-foreground">Total Shares</div>
                    <div className="font-semibold text-sm sm:text-base">{formatAmount(pool.total_shares)}</div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2 text-sm sm:text-base">Reserves</h4>
                    <div className="space-y-2">
                      {pool.reserves?.map((reserve, index) => (
                        <div key={index} className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 p-3 bg-muted/40 rounded-lg">
                          <span className="font-medium text-sm sm:text-base break-all">{formatAsset(reserve.asset)}</span>
                          <span className="text-base sm:text-lg font-semibold">{formatAmount(reserve.amount)}</span>
                        </div>
                      )) || <p className="text-sm text-muted-foreground">No reserves</p>}
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 pt-4 border-t">
                    <div className="text-xs sm:text-sm text-muted-foreground break-words">
                      Last Modified: {formatDateTime(pool.last_modified_time)}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
