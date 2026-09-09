'use client';

import { useState, useEffect, useCallback, useRef, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Search, Wallet, ArrowRightLeft, Hash, AlertCircle, Loader2, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { PageHeader } from '@/components/PageHeader';

const HORIZON_URL = process.env.NEXT_PUBLIC_HORIZON_BASE_URL || 'https://horizon.suban.org/horizon';

interface SearchResult {
  type: 'account' | 'transaction' | 'block';
  id: string;
  label: string;
  detail?: string;
  href: string;
}

function detectInputType(query: string): 'account' | 'transaction' | 'block' | 'asset' | 'unknown' {
  const trimmed = query.trim();
  if (/^G[A-Za-z0-9]{55}$/.test(trimmed)) return 'account';
  if (/^G[A-Za-z0-9]{39,}$/.test(trimmed)) return 'account';
  if (/^[0-9a-fA-F]{64}$/.test(trimmed)) return 'transaction';
  if (/^[0-9a-fA-F]{40,63}$/.test(trimmed)) return 'transaction';
  if (/^\d{2,}$/.test(trimmed)) return 'block';
  if (/^[A-Z]{1,12}$/.test(trimmed) && trimmed.length >= 2) return 'asset';
  return 'unknown';
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10 max-w-4xl mx-auto">
        <div className="flex items-center justify-center py-12 gap-3">
          <Loader2 className="w-5 h-5 animate-spin text-primary" />
          <span className="text-sm text-muted-foreground">Loading search...</span>
        </div>
      </div>
    }>
      <SearchContent />
    </Suspense>
  );
}

function SearchContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialQuery = searchParams.get('q') || '';
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const performSearch = useCallback(async (q: string) => {
    const trimmed = q.trim();
    if (!trimmed) {
      setResults([]);
      setSearched(false);
      return;
    }

    setLoading(true);
    setError(null);
    setSearched(true);
    const found: SearchResult[] = [];

    try {
      const type = detectInputType(trimmed);

      if (type === 'account') {
        try {
          const res = await fetch(`${HORIZON_URL}/accounts/${encodeURIComponent(trimmed)}`);
          if (res.ok) {
            const data = await res.json();
            found.push({
              type: 'account',
              id: data.id,
              label: `Account ${data.id.slice(0, 12)}...${data.id.slice(-8)}`,
              detail: `Balance: ${data.balances?.find((b: any) => b.asset_type === 'native')?.balance || '0'} PI`,
              href: `/account/${data.id}`,
            });
          }
        } catch { /* not found */ }
      }

      if (type === 'transaction') {
        try {
          const res = await fetch(`${HORIZON_URL}/transactions/${encodeURIComponent(trimmed)}`);
          if (res.ok) {
            const data = await res.json();
            found.push({
              type: 'transaction',
              id: data.hash,
              label: `Transaction ${data.hash.slice(0, 12)}...${data.hash.slice(-8)}`,
              detail: `${data.successful ? 'Successful' : 'Failed'} — ${data.operation_count} ops — ${new Date(data.created_at).toLocaleString()}`,
              href: `/tx/${data.hash}`,
            });
          }
        } catch { /* not found */ }
      }

      if (type === 'block') {
        try {
          const res = await fetch(`${HORIZON_URL}/ledgers/${trimmed}`);
          if (res.ok) {
            const data = await res.json();
            found.push({
              type: 'block',
              id: String(data.sequence),
              label: `Block #${data.sequence}`,
              detail: `${data.successful_transaction_count} txs — ${new Date(data.closed_at).toLocaleString()}`,
              href: `/block/${data.sequence}`,
            });
          }
        } catch { /* not found */ }
      }

      if (type === 'asset') {
        try {
          const res = await fetch(`${HORIZON_URL}/assets?asset_code=${encodeURIComponent(trimmed)}&limit=5`);
          if (res.ok) {
            const data = await res.json();
            const records = data._embedded?.records || [];
            for (const asset of records.slice(0, 5)) {
              found.push({
                type: 'account',
                id: `${asset.asset_code}:${asset.asset_issuer}`,
                label: `${asset.asset_code} — ${asset.accounts?.authorized || 0} holders`,
                detail: `Issuer: ${asset.asset_issuer?.slice(0, 8)}...${asset.asset_issuer?.slice(-8)}`,
                href: `/asset/${encodeURIComponent(asset.asset_code + ':' + asset.asset_issuer)}`,
              });
            }
          }
        } catch { /* not found */ }
      }

      if (type === 'unknown') {
        try {
          const res = await fetch(`${HORIZON_URL}/accounts/${encodeURIComponent(trimmed)}`);
          if (res.ok) {
            const data = await res.json();
            found.push({
              type: 'account',
              id: data.id,
              label: `Account ${data.id.slice(0, 12)}...${data.id.slice(-8)}`,
              detail: `Balance: ${data.balances?.find((b: any) => b.asset_type === 'native')?.balance || '0'} PI`,
              href: `/account/${data.id}`,
            });
          }
        } catch { /* not an account */ }
      }

      setResults(found);
      if (found.length === 0) {
        setError(`No results found for "${trimmed}"`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (initialQuery) {
      performSearch(initialQuery);
    }
  }, [initialQuery, performSearch]);

  const handleInputChange = (value: string) => {
    setQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      if (value.trim()) {
        router.replace(`/search?q=${encodeURIComponent(value.trim())}`, { scroll: false });
        performSearch(value);
      } else {
        setResults([]);
        setSearched(false);
        router.replace('/search', { scroll: false });
      }
    }, 400);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (query.trim()) {
      router.replace(`/search?q=${encodeURIComponent(query.trim())}`, { scroll: false });
      performSearch(query);
    }
  };

  const typeIcon = (type: string) => {
    switch (type) {
      case 'account': return <Wallet className="w-5 h-5 text-blue-500" />;
      case 'transaction': return <ArrowRightLeft className="w-5 h-5 text-purple-500" />;
      case 'block': return <Hash className="w-5 h-5 text-green-500" />;
      default: return <Search className="w-5 h-5 text-muted-foreground" />;
    }
  };

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10 max-w-4xl mx-auto">
      <PageHeader
        title="Blockchain Search"
        description="Search for accounts, transactions, and blocks on the Zyrachain network."
      />

      <form onSubmit={handleSubmit} className="mb-8">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Enter address (G...), transaction hash, or block number..."
            value={query}
            onChange={(e) => handleInputChange(e.target.value)}
            className="pl-10 pr-24 py-3 text-base"
            autoFocus
          />
          <button
            type="submit"
            disabled={loading || !query.trim()}
            className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-1.5 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors"
          >
            Search
          </button>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          Supports: Pi addresses (starts with G), transaction hashes (64 hex chars), block numbers
        </p>
      </form>

      {loading && (
        <div className="flex items-center justify-center py-12 gap-3">
          <Loader2 className="w-5 h-5 animate-spin text-primary" />
          <span className="text-sm text-muted-foreground">Searching blockchain...</span>
        </div>
      )}

      {!loading && error && (
        <Card>
          <CardContent className="flex items-center gap-3 py-6">
            <AlertCircle className="w-5 h-5 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">{error}</span>
          </CardContent>
        </Card>
      )}

      {!loading && results.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-muted-foreground">Results</h3>
          {results.map((result) => (
            <Link key={`${result.type}-${result.id}`} href={result.href}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer group">
                <CardContent className="flex items-center gap-4 py-4">
                  <div className="flex-shrink-0">{typeIcon(result.type)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{result.label}</div>
                    {result.detail && (
                      <div className="text-xs text-muted-foreground mt-0.5 truncate">{result.detail}</div>
                    )}
                  </div>
                  <ArrowRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {!loading && searched && results.length === 0 && !error && (
        <Card>
          <CardContent className="text-center py-8">
            <Search className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">No results found</p>
          </CardContent>
        </Card>
      )}

      {!loading && !searched && (
        <div className="text-center py-12">
          <Search className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
          <p className="text-sm text-muted-foreground">Enter a search query above</p>
          <div className="mt-6 flex flex-wrap justify-center gap-3 text-xs text-muted-foreground">
            <span className="px-3 py-1.5 bg-muted/50 rounded-full">Address: GABC...XYZ</span>
            <span className="px-3 py-1.5 bg-muted/50 rounded-full">Tx Hash: a1b2c3...</span>
            <span className="px-3 py-1.5 bg-muted/50 rounded-full">Block: 123456</span>
          </div>
        </div>
      )}
    </div>
  );
}
