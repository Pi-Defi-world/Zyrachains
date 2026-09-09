'use client';

import React, { useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { useLanguage } from '@/context/languagecontext';

interface Asset {
  asset_type: string;
  asset_code?: string;
  asset_issuer?: string;
  accounts?: { authorized?: number; unauthorized?: number };
  liquidity_pools_amount?: string;
  balances?: { authorized?: string };
  num_liquidity_pools?: number;
  _links?: { toml?: { href?: string } };
}

interface AssetsApiResponse {
  _links: { self: { href: string }; next?: { href: string }; prev?: { href: string } };
  _embedded: { records: Asset[] };
}

interface AssetsTabProps {
  onLoad?: (data: AssetsApiResponse, isInitial: boolean) => void;
}

export default function AssetsTab({ onLoad }: AssetsTabProps) {
  const { t, language } = useLanguage();
  const [assetsData, setAssetsData] = useState<AssetsApiResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // 60s cache helpers
  const CACHE_TTL_MS = 300_000; // 5 minutes
  const getCached = (key: string) => {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed.ts !== 'number') return null;
      if (Date.now() - parsed.ts > CACHE_TTL_MS) return null;
      return parsed.data as AssetsApiResponse;
    } catch { return null; }
  };
  const setCached = (key: string, data: any) => {
    try { localStorage.setItem(key, JSON.stringify({ ts: Date.now(), data })); } catch {}
  };

  useEffect(() => {
    fetchAssets();
  }, []);

  const fetchAssets = async (url?: string) => {
    try {
      setLoading(true);
      if (!url) {
        // Initial load: use server-side proxy to avoid CORS issues
        const proxyRes = await fetch('/api/horizon/testnet/assets-pools');
        const proxyJson = await proxyRes.json();
        if (proxyJson?.success && proxyJson?.data?.assets) {
          const allRecords = proxyJson.data.assets as Asset[];
          const fullData: AssetsApiResponse = {
            _links: { self: { href: '' } },
            _embedded: { records: allRecords },
          };
          setAssetsData(fullData);
          onLoad?.(fullData, true);
          setLoading(false);
          return;
        }
        throw new Error('Proxy returned no data');
      }

      // Pagination: fetch single page
      const cacheKey = `assets_${btoa(url)}`;
      const cached = getCached(cacheKey);
      if (cached) {
        setAssetsData(cached);
        onLoad?.(cached, false);
        setLoading(false);
        return;
      }
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data: AssetsApiResponse = await response.json();
      setCached(cacheKey, data);
      setAssetsData(data);
      onLoad?.(data, false);
    } catch (err) {
      setError(`Failed to fetch assets data: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setLoading(false);
    }
  };

  const handleNextPage = () => assetsData?._links?.next && fetchAssets(assetsData._links.next.href);
  const handlePrevPage = () => assetsData?._links?.prev && fetchAssets(assetsData._links.prev.href);

  const formatNumber = (num: string | number | undefined): string => {
    const raw = Array.isArray(num as any) ? (num as any)[0] : num;
    const n = typeof raw === 'string' ? parseFloat(raw) : (raw ?? 0);
    if (!isFinite(n)) return '0';
    return n.toLocaleString(language, { minimumFractionDigits: 0, maximumFractionDigits: 7 });
  };

  const getTotalSupply = (asset: Asset): string => {
    const authorizedBalance = parseFloat(asset.balances?.authorized || '0');
    const poolsAmount = parseFloat(asset.liquidity_pools_amount || '0');
    const total = authorizedBalance + poolsAmount;
    return total === 0 ? '0' : formatNumber(total);
  };

  const getPoolsAmount = (asset: Asset): string => formatNumber(asset.liquidity_pools_amount || '0');
  const getCirculating = (asset: Asset): string => formatNumber(asset.balances?.authorized || '0');
  const typeLabel = (type: string) => type === 'native' ? 'Native' : (type === 'credit_alphanum4' ? 'Alpha4' : (type === 'credit_alphanum12' ? 'Alpha12' : type));

  if (loading) return <div className="py-8 text-sm text-muted-foreground">Loading assets…</div>;
  if (error) return <div className="py-8 text-red-500 text-sm">{error}</div>;
  if (!assetsData) return <div className="py-8 text-sm">No assets data</div>;

  const records = assetsData._embedded?.records || [];
  const filtered = records.filter(a =>
    (a.asset_code || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (a.asset_issuer || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="w-full">
      <div className="mb-4">
        <Input
          placeholder={String(t('assets.search_placeholder'))}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-md"
        />
      </div>
      <div className="overflow-x-auto">
        {records.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-sm text-muted-foreground mb-2">No custom assets found on Pi Network Mainnet.</p>
            <p className="text-xs text-muted-foreground">The /assets endpoint returned empty — no tokens have been issued on mainnet yet.</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-sm text-muted-foreground">No assets match your search.</p>
          </div>
        ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Code</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Issuer</TableHead>
              <TableHead className="text-right">Holders</TableHead>
              <TableHead className="text-right">Total Supply</TableHead>
              <TableHead className="text-right">In Pools</TableHead>
              <TableHead className="text-right">Circulating</TableHead>
              <TableHead className="text-right">Pools</TableHead>
              <TableHead className="text-center">TOML</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((asset) => (
              <TableRow key={`${asset.asset_code}-${asset.asset_issuer}`}>
                <TableCell>
                  <a href={`/asset/${encodeURIComponent((asset.asset_code||'') + ':' + (asset.asset_issuer||''))}`} className="text-primary">
                    {asset.asset_code}
                  </a>
                </TableCell>
                <TableCell>{typeLabel(asset.asset_type)}</TableCell>
                <TableCell>
                  {asset.asset_issuer ? (
                    <a href={`/account/${asset.asset_issuer}`} title={asset.asset_issuer} className="text-primary">
                      <code className="text-xs">{asset.asset_issuer.slice(0, 8)}...{asset.asset_issuer.slice(-8)}</code>
                    </a>
                  ) : (
                    <span className="text-muted-foreground text-xs">N/A</span>
                  )}
                </TableCell>
                <TableCell className="text-right">{formatNumber(asset.accounts?.authorized || 0)}</TableCell>
                <TableCell className="text-right">{getTotalSupply(asset)}</TableCell>
                <TableCell className="text-right">{getPoolsAmount(asset)}</TableCell>
                <TableCell className="text-right">{getCirculating(asset)}</TableCell>
                <TableCell className="text-right">{asset.num_liquidity_pools || 0}</TableCell>
                <TableCell className="text-center">
                  {asset._links?.toml?.href ? (
                    <a href={asset._links.toml.href} target="_blank" rel="noopener noreferrer" className="text-primary text-xs break-all">
                      {asset._links.toml.href.length > 30 ? `${asset._links.toml.href.slice(0,30)}…` : asset._links.toml.href}
                    </a>
                  ) : (
                    <span className="text-muted-foreground text-xs">—</span>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        )}
      </div>
      <div className="flex items-center justify-between mt-4">
        <span className="text-xs text-muted-foreground">{t('assets.testnet_warning')}</span>
        {records.length > 0 && (
        <div className="flex gap-2">
          <Button variant="outline" size="sm" disabled={!assetsData._links.prev} onClick={handlePrevPage}>Previous</Button>
          <Button variant="outline" size="sm" disabled={!assetsData._links.next} onClick={handleNextPage}>Next</Button>
        </div>
        )}
      </div>
    </div>
  );
}
