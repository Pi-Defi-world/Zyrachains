'use client';

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";

interface TradePrice { n?: string; d?: string; }
interface Trade {
  id?: string; paging_token?: string; ledger_close_time?: string; trade_type?: string;
  base_offer_id?: string; base_account?: string; base_amount?: string; base_asset_type?: string; base_asset_code?: string; base_asset_issuer?: string;
  counter_offer_id?: string; counter_account?: string; counter_amount?: string; counter_asset_type?: string; counter_asset_code?: string; counter_asset_issuer?: string;
  base_is_seller?: boolean; price?: TradePrice; _links?: any;
}
interface TradesApiResponse { _links: { self: { href: string }; next?: { href: string }; prev?: { href: string } }; _embedded: { records: Trade[] } }

interface TradesHistoryTabProps {
  onLoad?: (data: TradesApiResponse, isInitial: boolean) => void;
}

export default function TradesHistoryTab({ onLoad }: TradesHistoryTabProps) {
  const [tradesData, setTradesData] = useState<TradesApiResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filteredTrades, setFilteredTrades] = useState<Trade[]>([]);

  // 60s cache helpers
  const CACHE_TTL_MS = 300_000; // 5 minutes
  const getCached = (key: string) => {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed.ts !== 'number') return null;
      if (Date.now() - parsed.ts > CACHE_TTL_MS) return null;
      return parsed.data as TradesApiResponse;
    } catch { return null; }
  };
  const setCached = (key: string, data: any) => { try { localStorage.setItem(key, JSON.stringify({ ts: Date.now(), data })); } catch {} };

  useEffect(() => { fetchTrades(undefined, true); }, []);
  useEffect(() => {
    if (tradesData?._embedded?.records) {
      const filtered = tradesData._embedded.records.filter(trade =>
        (trade.base_asset_code || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (trade.counter_asset_code || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (trade.base_account || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (trade.counter_account || '').toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredTrades(filtered);
    }
  }, [tradesData, searchQuery]);

  const fetchTrades = async (url?: string, isInitial = false) => {
    try {
      setLoading(true);
      if (!url) {
        try {
          const r = await fetch('/api/v2/home/latest-trades');
          const j = await r.json();
          if (j?.success && j?.data?.records?.length) {
            const payload = {
              _embedded: { records: j.data.records as Trade[] },
              _links: j.data.horizonLinks || { self: { href: '' } },
            } as TradesApiResponse;
            setTradesData(payload);
            if (isInitial) onLoad?.(payload, true);
            setLoading(false);
            return;
          }
        } catch {
          /* fallback */
        }
      }

      const apiUrl = url || 'https://api.mainnet.minepi.com/trades?limit=50&order=desc';
      const cacheKey = `trades_${btoa(apiUrl)}`;
      const cached = getCached(cacheKey);
      if (cached) { setTradesData(cached); if (isInitial) onLoad?.(cached, true); setLoading(false); return; }
      const response = await fetch(apiUrl);
      if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
      const data = await response.json();
      setCached(cacheKey, data);
      setTradesData(data);
      if (isInitial) onLoad?.(data, true);
    } catch (err) {
      setError(`Failed to fetch trades data: ${err instanceof Error ? err.message : String(err)}`);
    } finally { setLoading(false); }
  };

  const handleNextPage = () => tradesData?._links?.next && fetchTrades(tradesData._links.next.href);
  const handlePrevPage = () => tradesData?._links?.prev && fetchTrades(tradesData._links.prev.href);

  const formatNumber = (num?: string) => {
    if (!num || num === '') return '0';
    const number = parseFloat(num); if (isNaN(number)) return '0';
    return number.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 7 });
  };
  const formatPrice = (price?: TradePrice) => {
    if (!price || !price.n || !price.d) return '0';
    const n = parseFloat(price.n), d = parseFloat(price.d);
    if (isNaN(n) || isNaN(d) || d === 0) return '0';
    return (n / d).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 7 });
  };
  const formatAsset = (assetType?: string, assetCode?: string) => assetType === 'native' ? 'PI' : (assetCode || 'Unknown');
  const formatDateTime = (dateTime?: string) => {
    if (!dateTime) return 'Unknown';
    const date = new Date(dateTime); if (isNaN(date.getTime())) return 'Invalid Date';
    return date.toLocaleString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  if (loading) return <div className="py-8 text-sm text-muted-foreground">Loading trades…</div>;
  if (error) return <div className="py-8 text-sm text-red-500">{error}</div>;
  if (!tradesData) return <div className="py-8 text-sm">No trades data</div>;

  return (
    <div className="w-full">
      <div className="mb-4">
        <Input placeholder="Search trades by asset or account..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="max-w-md" />
      </div>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Time</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Base</TableHead>
              <TableHead>Counter</TableHead>
              <TableHead className="text-right">Price</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredTrades.map((trade) => (
              <TableRow key={trade.id}>
                <TableCell className="text-xs text-muted-foreground">{formatDateTime(trade.ledger_close_time)}</TableCell>
                <TableCell className="text-xs">{trade.trade_type === 'liquidity_pool' ? 'Liquidity Pool' : (trade.trade_type || 'Unknown')}</TableCell>
                <TableCell className="text-xs">{formatNumber(trade.base_amount)} {formatAsset(trade.base_asset_type, trade.base_asset_code)}</TableCell>
                <TableCell className="text-xs">{formatNumber(trade.counter_amount)} {formatAsset(trade.counter_asset_type, trade.counter_asset_code)}</TableCell>
                <TableCell className="text-right text-xs">{formatPrice(trade.price)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-between mt-4 text-sm text-muted-foreground">
        <span>Showing {filteredTrades.length} of {tradesData._embedded.records.length} trades</span>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" disabled={!tradesData._links.prev} onClick={handlePrevPage}>Previous</Button>
          <Button variant="outline" size="sm" disabled={!tradesData._links.next} onClick={handleNextPage}>Next</Button>
        </div>
      </div>
    </div>
  );
}
