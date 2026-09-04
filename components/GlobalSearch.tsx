'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Search, X, Command, Home, BarChart3, Activity, Users, Book, AlertCircle, Layers, Coins, Droplets, TrendingUp, ArrowRightLeft, ShieldCheck, Zap, Wallet, Globe, Calendar, Star, User, Hash, Loader2, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const HORIZON_URL = process.env.NEXT_PUBLIC_HORIZON_BASE_URL || 'https://horizon.suban.org/horizon';

interface SearchResult {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  href: string;
  category: 'navigation' | 'metric' | 'feature' | 'blockchain';
}

interface BlockchainResult {
  type: 'account' | 'transaction' | 'block';
  id: string;
  label: string;
  detail: string;
  href: string;
}

const SEARCH_DATA: SearchResult[] = [
  { id: 'home', title: 'Home', description: 'Dashboard overview', href: '/', icon: <Home className="w-4 h-4" />, category: 'navigation' },
  { id: 'explorer', title: 'Block Explorer', description: 'Browse blocks ledgers', href: '/block', icon: <BarChart3 className="w-4 h-4" />, category: 'navigation' },
  { id: 'txs', title: 'Transactions', description: 'Latest transactions', href: '/Transaction-list', icon: <ArrowRightLeft className="w-4 h-4" />, category: 'navigation' },
  { id: 'ops', title: 'Operations', description: 'Latest operations', href: '/operations', icon: <Layers className="w-4 h-4" />, category: 'navigation' },
  { id: 'trades', title: 'Trades History', description: 'Trade records', href: '/trades-history', icon: <TrendingUp className="w-4 h-4" />, category: 'navigation' },
  { id: 'assets', title: 'Assets', description: 'All issued assets', href: '/assets', icon: <Coins className="w-4 h-4" />, category: 'navigation' },
  { id: 'pools', title: 'Liquidity Pools', description: 'All liquidity pools', href: '/pool', icon: <Droplets className="w-4 h-4" />, category: 'navigation' },
  { id: 'stats', title: 'Network Stats', description: 'Account & supply stats', href: '/accountStats', icon: <Activity className="w-4 h-4" />, category: 'navigation' },
  { id: 'pct', title: 'Core Team Monitor', description: 'PCT wallet tracker', href: '/pct-wallet-monitor', icon: <ShieldCheck className="w-4 h-4" />, category: 'navigation' },
  { id: 'cex', title: 'Exchange Monitor', description: 'CEX wallet tracker', href: '/cex-wallet-monitor', icon: <ShieldCheck className="w-4 h-4" />, category: 'navigation' },
  { id: 'realtime', title: 'Real-time Feed', description: 'Live tx/trades/ops', href: '/realtime-transactions', icon: <Zap className="w-4 h-4" />, category: 'navigation' },
  { id: 'eco', title: 'Ecology Hub', description: 'Ecosystem & community', href: '/ecology', icon: <Globe className="w-4 h-4" />, category: 'navigation' },
  { id: 'communities', title: 'Communities', description: 'Pi communities', href: '/ecosystem/communities', icon: <Users className="w-4 h-4" />, category: 'navigation' },
  { id: 'events', title: 'Events', description: 'Ecosystem events', href: '/ecosystem/events', icon: <Calendar className="w-4 h-4" />, category: 'navigation' },
  { id: 'hackathons', title: 'Hackathons', description: 'Ecosystem hackathons', href: '/ecosystem/hackathons', icon: <Star className="w-4 h-4" />, category: 'navigation' },
  { id: 'influencers', title: 'Influencers', description: 'Pi influencers', href: '/ecosystem/influencers', icon: <Users className="w-4 h-4" />, category: 'navigation' },
  { id: 'api-dash', title: 'API Dashboard', description: 'Manage API keys', href: '/api-dashboard', icon: <ShieldCheck className="w-4 h-4" />, category: 'navigation' },
  { id: 'oracle', title: 'Oracle API', description: 'Get a price oracle key', href: '/oracle-api', icon: <Zap className="w-4 h-4" />, category: 'navigation' },
  { id: 'api-docs', title: 'API Docs', description: 'API documentation', href: '/api-documentation', icon: <Book className="w-4 h-4" />, category: 'navigation' },
  { id: 'profile', title: 'Profile', description: 'Your account & profile', href: '/profile', icon: <User className="w-4 h-4" />, category: 'navigation' },
  { id: 'contact', title: 'Contact', description: 'Get in touch', href: '/contactUs', icon: <Book className="w-4 h-4" />, category: 'navigation' },
  { id: 'mc-price', title: 'PI Price', description: 'Current PI/USD price', href: '/?tab=overview', icon: <TrendingUp className="w-4 h-4" />, category: 'metric' },
  { id: 'mc-mcap', title: 'Market Cap', description: 'PI market cap & FDV', href: '/?tab=overview', icon: <TrendingUp className="w-4 h-4" />, category: 'metric' },
  { id: 'mc-supply', title: 'Supply', description: 'Circulating, locked, total', href: '/?tab=supply', icon: <Coins className="w-4 h-4" />, category: 'metric' },
  { id: 'mc-network', title: 'Network', description: 'Block, TPS, utilization', href: '/?tab=network', icon: <Activity className="w-4 h-4" />, category: 'metric' },
];

function detectInputType(query: string): 'account' | 'transaction' | 'block' | null {
  const trimmed = query.trim();
  if (/^G[A-Za-z0-9]{55}$/.test(trimmed)) return 'account';
  if (/^[0-9a-fA-F]{64}$/.test(trimmed)) return 'transaction';
  if (/^\d{2,}$/.test(trimmed)) return 'block';
  return null;
}

async function searchBlockchain(query: string): Promise<BlockchainResult[]> {
  const trimmed = query.trim();
  const type = detectInputType(trimmed);
  const results: BlockchainResult[] = [];

  try {
    if (type === 'account') {
      const res = await fetch(`${HORIZON_URL}/accounts/${encodeURIComponent(trimmed)}`);
      if (res.ok) {
        const data = await res.json();
        const bal = data.balances?.find((b: any) => b.asset_type === 'native')?.balance || '0';
        results.push({
          type: 'account',
          id: data.id,
          label: `${data.id.slice(0, 12)}...${data.id.slice(-8)}`,
          detail: `Balance: ${bal} PI`,
          href: `/account/${data.id}`,
        });
      }
    } else if (type === 'transaction') {
      const res = await fetch(`${HORIZON_URL}/transactions/${encodeURIComponent(trimmed)}`);
      if (res.ok) {
        const data = await res.json();
        results.push({
          type: 'transaction',
          id: data.hash,
          label: `${data.hash.slice(0, 12)}...${data.hash.slice(-8)}`,
          detail: `${data.successful ? 'Successful' : 'Failed'} — ${data.operation_count} ops`,
          href: `/tx/${data.hash}`,
        });
      }
    } else if (type === 'block') {
      const res = await fetch(`${HORIZON_URL}/ledgers/${trimmed}`);
      if (res.ok) {
        const data = await res.json();
        results.push({
          type: 'block',
          id: String(data.sequence),
          label: `Block #${data.sequence}`,
          detail: `${data.successful_transaction_count} txs — ${new Date(data.closed_at).toLocaleString()}`,
          href: `/block/${data.sequence}`,
        });
      }
    }
  } catch { /* search failed silently */ }

  return results;
}

export function GlobalSearch() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [blockchainResults, setBlockchainResults] = useState<BlockchainResult[]>([]);
  const [blockchainLoading, setBlockchainLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const router = useRouter();

  const filterNavResults = useCallback((q: string) => {
    if (!q.trim()) return SEARCH_DATA.slice(0, 10);
    return SEARCH_DATA.filter((item) =>
      item.title.toLowerCase().includes(q.toLowerCase()) ||
      item.description.toLowerCase().includes(q.toLowerCase())
    );
  }, []);

  useEffect(() => {
    setResults(filterNavResults(query));
    setSelectedIndex(0);
  }, [query, filterNavResults]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (query.trim().length >= 2) {
      setBlockchainLoading(true);
      debounceRef.current = setTimeout(async () => {
        const bcResults = await searchBlockchain(query);
        setBlockchainResults(bcResults);
        setBlockchainLoading(false);
      }, 500);
    } else {
      setBlockchainResults([]);
      setBlockchainLoading(false);
    }

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(true);
        setTimeout(() => inputRef.current?.focus(), 0);
      }
      if (!isOpen) return;
      const totalItems = results.length + blockchainResults.length + (query.trim() ? 1 : 0);
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex((i) => (i + 1) % Math.max(totalItems, 1));
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex((i) => (i - 1 + Math.max(totalItems, 1)) % Math.max(totalItems, 1));
          break;
        case 'Enter':
          e.preventDefault();
          if (selectedIndex < results.length && results[selectedIndex]) {
            router.push(results[selectedIndex].href);
            setIsOpen(false);
          } else if (selectedIndex < results.length + blockchainResults.length) {
            const bcIdx = selectedIndex - results.length;
            if (blockchainResults[bcIdx]) {
              router.push(blockchainResults[bcIdx].href);
              setIsOpen(false);
            }
          } else if (query.trim()) {
            router.push(`/search?q=${encodeURIComponent(query.trim())}`);
            setIsOpen(false);
          }
          break;
        case 'Escape':
          e.preventDefault();
          setIsOpen(false);
          break;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, results, blockchainResults, selectedIndex, query, router]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const blockchainIcon = (type: string) => {
    switch (type) {
      case 'account': return <Wallet className="w-4 h-4 text-blue-500" />;
      case 'transaction': return <ArrowRightLeft className="w-4 h-4 text-purple-500" />;
      case 'block': return <Hash className="w-4 h-4 text-green-500" />;
      default: return <Search className="w-4 h-4" />;
    }
  };

  let flatIndex = 0;

  return (
    <div ref={containerRef} className="relative w-full">
      <button
        onClick={() => {
          setIsOpen(true);
          setTimeout(() => inputRef.current?.focus(), 0);
        }}
        className="w-full px-4 py-2.5 rounded-lg border border-border/50 bg-card/40 hover:bg-card/60 transition-all duration-200 flex items-center gap-3 text-muted-foreground hover:text-foreground group"
      >
        <Search className="w-4 h-4" />
        <span className="text-sm hidden sm:inline">Search everything...</span>
        <span className="text-sm sm:hidden">Search...</span>
        <kbd className="ml-auto hidden sm:inline-flex items-center gap-1 px-2 py-1 text-xs rounded bg-background/50 group-hover:bg-background">
          <Command className="w-3 h-3" />K
        </kbd>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-[80] bg-black/50 backdrop-blur-sm flex items-start justify-center px-3 sm:px-0 pt-[var(--search-offset,6rem)]">
          <div className="w-full max-w-lg">
            <div className="bg-card border border-border rounded-lg shadow-2xl overflow-hidden">
              <div className="flex items-center border-b border-border px-4 py-3">
                <Search className="w-5 h-5 text-muted-foreground" />
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="Search pages, accounts, transactions, blocks..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="flex-1 ml-3 bg-transparent text-foreground outline-none text-sm placeholder-muted-foreground"
                  autoFocus
                />
                {blockchainLoading && (
                  <Loader2 className="w-4 h-4 animate-spin text-muted-foreground mr-2" />
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 hover:bg-secondary rounded transition-colors"
                >
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>

              <div className="max-h-96 overflow-y-auto">
                {blockchainResults.length > 0 && (
                  <div className="p-2">
                    <div className="px-3 py-1.5 text-xs font-medium text-muted-foreground">Blockchain</div>
                    {blockchainResults.map((bc) => {
                      const idx = flatIndex++;
                      return (
                        <Link
                          key={`bc-${bc.type}-${bc.id}`}
                          href={bc.href}
                          onClick={() => setIsOpen(false)}
                          className={`flex items-start gap-3 px-3 py-2.5 rounded-md cursor-pointer transition-all duration-150 ${
                            idx === selectedIndex
                              ? 'bg-accent text-accent-foreground'
                              : 'hover:bg-secondary text-foreground'
                          }`}
                        >
                          <div className="mt-0.5">{blockchainIcon(bc.type)}</div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium truncate">{bc.label}</div>
                            <div className="text-xs text-current opacity-60 truncate">{bc.detail}</div>
                          </div>
                          <span className="text-xs font-medium opacity-40 flex-shrink-0">{bc.type}</span>
                        </Link>
                      );
                    })}
                  </div>
                )}

                {results.length > 0 && (
                  <div className="p-2">
                    {blockchainResults.length > 0 && (
                      <div className="px-3 py-1.5 text-xs font-medium text-muted-foreground">Pages & Features</div>
                    )}
                    {results.map((result) => {
                      const idx = flatIndex++;
                      return (
                        <Link
                          key={result.id}
                          href={result.href}
                          onClick={() => setIsOpen(false)}
                          className={`flex items-start gap-3 px-3 py-2.5 rounded-md cursor-pointer transition-all duration-150 ${
                            idx === selectedIndex
                              ? 'bg-accent text-accent-foreground'
                              : 'hover:bg-secondary text-foreground'
                          }`}
                        >
                          <div className="mt-0.5 text-current opacity-60">{result.icon}</div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium truncate">{result.title}</div>
                            <div className="text-xs text-current opacity-60 truncate">{result.description}</div>
                          </div>
                          <span className="text-xs font-medium opacity-40 flex-shrink-0">{result.category}</span>
                        </Link>
                      );
                    })}
                  </div>
                )}

                {query.trim() && (
                  <div className="p-2 border-t border-border">
                    <Link
                      href={`/search?q=${encodeURIComponent(query.trim())}`}
                      onClick={() => setIsOpen(false)}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-md cursor-pointer transition-all duration-150 ${
                        flatIndex++ === selectedIndex
                          ? 'bg-accent text-accent-foreground'
                          : 'hover:bg-secondary text-foreground'
                      }`}
                    >
                      <Search className="w-4 h-4" />
                      <span className="text-sm">Search blockchain for &quot;{query.trim()}&quot;</span>
                      <ArrowRight className="w-3 h-3 ml-auto opacity-40" />
                    </Link>
                  </div>
                )}

                {results.length === 0 && blockchainResults.length === 0 && !blockchainLoading && (
                  <div className="px-4 py-8 text-center text-muted-foreground">
                    <p className="text-sm">No results found for &quot;{query}&quot;</p>
                  </div>
                )}
              </div>

              <div className="border-t border-border bg-card/50 px-4 py-3 flex items-center justify-between text-xs text-muted-foreground">
                <div className="flex gap-4">
                  <div className="flex items-center gap-1">
                    <kbd className="px-2 py-1 rounded bg-background/50">↑↓</kbd>
                    <span>Navigate</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <kbd className="px-2 py-1 rounded bg-background/50">↵</kbd>
                    <span>Select</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <kbd className="px-2 py-1 rounded bg-background/50">Esc</kbd>
                    <span>Close</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
