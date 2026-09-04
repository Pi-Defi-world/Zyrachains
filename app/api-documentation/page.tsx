"use client";
import React, { useState } from 'react';
import Link from 'next/link';
import { usePageMetadata } from '@/context/pagemetadataContext';
import {
  Copy, Code, Shield, CheckCircle, Terminal,
  Key, Clock, FileJson, Wifi, BarChart3,
} from 'lucide-react';

interface EndpointDef {
  method: string;
  path: string;
  description: string;
  auth: 'public' | 'api-key';
  request?: string;
  response?: string;
}

const ENDPOINTS: EndpointDef[] = [
  {
    method: 'GET', path: '/api/oracle/v1/price', auth: 'api-key',
    description: 'Aggregated Pi/USD price (weighted average, cached 10s).',
    request: 'curl -H "X-API-Key: zyra_..." "https://api.zyrachain.org/api/oracle/v1/price"',
    response: `{ "symbol": "PI", "price_usd": 1.23, "sources_used": 3, "total_sources": 3, "aggregation_method": "weighted_average", "confidence_score": 0.95, "cache_hit": false, "source_prices": { "coingecko": {"price": 1.22, "weight": 1.5}, "okx": {"price": 1.23, "weight": 2.0}, "bitget": {"price": 1.24, "weight": 2.0} } }`
  },
  {
    method: 'GET', path: '/api/oracle/v1/sources', auth: 'api-key',
    description: 'Status and reliability metrics for each upstream price source (CoinGecko, OKX, Bitget).'
  },
  {
    method: 'GET', path: '/api/oracle/v1/health', auth: 'api-key',
    description: 'Oracle process health check (uptime, status).',
    response: `{ "status": "healthy", "uptime": 3600, "timestamp": "2025-05-18T12:00:00.000Z" }`
  },
  {
    method: 'GET', path: '/api/oracle/data/pi-price', auth: 'api-key',
    description: 'Pi price in piscan.io-compatible format.',
    response: `{ "data": [{ "idxPx": "1.2300", "high24h": "1.2300", "open24h": "1.2300", "low24h": "1.2300" }] }`
  },
  {
    method: 'GET', path: '/api/oracle/data/mainnet-supply', auth: 'api-key',
    description: 'Circulating, locked, and total supply snapshot from Pi blockchain.',
    response: `{ "total_circulating_supply": 6600980756.31, "total_locked": 4968482226.45, "total_supply": 10155355009.71 }`
  },
  {
    method: 'ALL', path: '/api/oracle/horizon/*', auth: 'api-key',
    description: 'Transparent proxy to Pi Mainnet Horizon API via Suban (accounts, transactions, operations, effects, ledgers, payments, trades, offers).',
    request: 'curl -H "X-API-Key: zyra_..." "https://api.zyrachain.org/api/oracle/horizon/accounts/GABC..."'
  },
  {
    method: 'GET', path: '/api/oracle/horizon/ledgers', auth: 'api-key',
    description: 'List recent ledgers from Pi Mainnet Horizon (Suban).',
    request: 'curl -H "X-API-Key: zyra_..." "https://api.zyrachain.org/api/oracle/horizon/ledgers?order=desc&limit=10"'
  },
  {
    method: 'GET', path: '/api/oracle/horizon/trades', auth: 'api-key',
    description: 'List recent trades from Pi Mainnet Horizon (Suban).',
    request: 'curl -H "X-API-Key: zyra_..." "https://api.zyrachain.org/api/oracle/horizon/trades?order=desc&limit=10"'
  },
  {
    method: 'GET', path: '/api/oracle/horizon/accounts/{address}', auth: 'api-key',
    description: 'Get account details from Pi Mainnet Horizon (Suban).',
    request: 'curl -H "X-API-Key: zyra_..." "https://api.zyrachain.org/api/oracle/horizon/accounts/GABC..."'
  },
];

const METHOD_COLORS: Record<string, string> = {
  'GET': 'bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-400',
  'POST': 'bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400',
  'ALL': 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
};

const ApiDocumentationPage: React.FC = () => {
  const { setHeading, setTitle, setDescription } = usePageMetadata();
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

   const apiBase = process.env.NEXT_PUBLIC_API_URL || 'https://api.zyrachain.org';

  React.useEffect(() => {
    setHeading('API Documentation');
    setTitle('API Documentation - Zyrachain');
    setDescription('Price Oracle API reference for Zyrachain');
  }, [setHeading, setTitle, setDescription]);

  const copyCommand = (cmd: string, idx: number) => {
    navigator.clipboard.writeText(cmd);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div className="min-h-screen bg-background p-3 pb-20 sm:p-4 mobile-nav-safe">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center space-x-3 mb-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Code className="h-6 w-6 text-primary" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Price Oracle API</h1>
          </div>
          <p className="text-muted-foreground text-sm">
            Access aggregated Pi Network price data via{' '}
            <code className="text-xs bg-muted px-1.5 py-0.5 rounded">{apiBase}/api/oracle</code>.
            Pay as you go — purchase an API key with Pi to get started.
            Horizon and RPC endpoints powered by{' '}
            <span className="font-medium text-foreground">Suban</span>.
          </p>
        </div>

        {/* Quick Info Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <div className="bg-card rounded-lg border border-border/50 p-3">
            <div className="flex items-center gap-2 mb-1">
              <Key className="h-4 w-4 text-primary" />
              <span className="text-xs font-medium text-foreground">API Key</span>
            </div>
            <p className="text-xs text-muted-foreground">Pay as you go with Pi</p>
          </div>
          <div className="bg-card rounded-lg border border-border/50 p-3">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="h-4 w-4 text-primary" />
              <span className="text-xs font-medium text-foreground">Rate Limit</span>
            </div>
            <p className="text-xs text-muted-foreground">60 req/min, 10,000 req/day</p>
          </div>
          <div className="bg-card rounded-lg border border-border/50 p-3">
            <div className="flex items-center gap-2 mb-1">
              <Wifi className="h-4 w-4 text-primary" />
              <span className="text-xs font-medium text-foreground">Cache</span>
            </div>
            <p className="text-xs text-muted-foreground">10-second TTL on price</p>
          </div>
          <div className="bg-card rounded-lg border border-border/50 p-3">
            <div className="flex items-center gap-2 mb-1">
              <FileJson className="h-4 w-4 text-primary" />
              <span className="text-xs font-medium text-foreground">Format</span>
            </div>
            <p className="text-xs text-muted-foreground">All responses in JSON</p>
          </div>
        </div>

        {/* Endpoints Table */}
        <div className="bg-card rounded-xl border border-border/50 shadow-sm overflow-hidden mb-6">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/30 bg-muted/30">
                  <th className="text-left py-3 px-4 font-medium text-foreground w-16">Method</th>
                  <th className="text-left py-3 px-4 font-medium text-foreground">Endpoint</th>
                  <th className="text-left py-3 px-4 font-medium text-foreground hidden sm:table-cell w-20">Auth</th>
                  <th className="text-left py-3 px-4 font-medium text-foreground hidden md:table-cell">Description</th>
                  <th className="text-right py-3 px-4 font-medium text-foreground w-16">Copy</th>
                </tr>
              </thead>
              <tbody>
                {ENDPOINTS.map((ep, i) => (
                  <tr key={i} className="border-b border-border/20 hover:bg-muted/20 transition-colors">
                    <td className="py-2.5 px-4">
                      <span className={`px-1.5 py-0.5 rounded text-[11px] font-medium ${METHOD_COLORS[ep.method] || 'bg-gray-100 text-gray-700'}`}>
                        {ep.method}
                      </span>
                    </td>
                    <td className="py-2.5 px-4">
                      <code className="text-xs font-mono text-foreground bg-muted/50 px-1.5 py-0.5 rounded break-all">
                        {ep.path}
                      </code>
                    </td>
                    <td className="py-2.5 px-4 hidden sm:table-cell">
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400">
                        {ep.auth}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-xs text-muted-foreground hidden md:table-cell">
                      {ep.description}
                    </td>
                    <td className="py-2.5 px-4 text-right">
                      {ep.request && (
                        <button
                          onClick={() => copyCommand(ep.request!, i)}
                          className="p-1.5 hover:bg-muted rounded transition-colors"
                          title="Copy curl command"
                        >
                          {copiedIndex === i ? (
                            <CheckCircle className="h-3.5 w-3.5 text-green-500" />
                          ) : (
                            <Copy className="h-3.5 w-3.5 text-muted-foreground" />
                          )}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Response Schemas */}
        {ENDPOINTS.some(e => e.response) && (
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
              <FileJson className="h-4 w-4 text-primary" />
              Response Schemas
            </h3>
            {ENDPOINTS.filter(e => e.response).map((ep, i) => (
              <div key={i} className="bg-muted/40 border border-border/30 rounded-lg p-3 mb-3">
                <div className="flex items-center gap-2 mb-2">
                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${METHOD_COLORS[ep.method] || ''}`}>{ep.method}</span>
                  <code className="text-xs font-mono text-foreground">{ep.path}</code>
                </div>
                <pre className="text-[11px] text-green-600 dark:text-green-400 overflow-x-auto bg-background/50 rounded p-3">
                  <code>{ep.response}</code>
                </pre>
              </div>
            ))}
          </div>
        )}

        {/* Code Examples */}
        <div className="bg-card rounded-xl border border-border/50 shadow-sm p-4 sm:p-6 mb-6">
          <div className="flex items-center space-x-3 mb-4">
            <Terminal className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold text-foreground">Code Examples</h2>
          </div>

          <div className="space-y-6">
            {/* JavaScript */}
            <div>
              <h4 className="text-sm font-medium text-foreground mb-2">JavaScript (fetch)</h4>
              <div className="bg-muted/60 rounded-lg border border-border/30 overflow-hidden">
                <div className="flex items-center justify-between px-3 py-1.5 bg-muted border-b border-border/20">
                  <span className="text-xs text-muted-foreground">javascript</span>
                  <button
                    onClick={() => copyCommand(`const BASE = "${apiBase}/api/oracle";
const KEY = "zyra_your_api_key";

const headers = { "X-API-Key": KEY };

// Get Pi price
const price = await fetch(BASE + "/v1/price", { headers }).then(r => r.json());
console.log("Pi: $" + price.price_usd);

// Get supply
const supply = await fetch(BASE + "/data/mainnet-supply", { headers }).then(r => r.json());
console.log("Circulating: " + supply.total_circulating_supply.toLocaleString());

// Horizon proxy: account details
const acct = await fetch(BASE + "/horizon/accounts/GABC...", { headers }).then(r => r.json());
console.log("Balances:", acct.balances);`, -1)}
                    className="p-1 hover:bg-background rounded transition-colors"
                  >
                    <Copy className="h-3.5 w-3.5 text-muted-foreground" />
                  </button>
                </div>
                <pre className="p-3 overflow-x-auto text-[11px] text-emerald-600 dark:text-emerald-400">
                  <code>{`const BASE = "${apiBase}/api/oracle";
const KEY = "zyra_your_api_key";

const headers = { "X-API-Key": KEY };

// Get Pi price
const price = await fetch(BASE + "/v1/price", { headers }).then(r => r.json());
console.log("Pi: $" + price.price_usd);

// Get supply
const supply = await fetch(BASE + "/data/mainnet-supply", { headers }).then(r => r.json());
console.log("Circulating: " + supply.total_circulating_supply.toLocaleString());

// Horizon proxy: account details
const acct = await fetch(BASE + "/horizon/accounts/GABC...", { headers }).then(r => r.json());
console.log("Balances:", acct.balances);`}</code>
                </pre>
              </div>
            </div>

            {/* Python */}
            <div>
              <h4 className="text-sm font-medium text-foreground mb-2">Python (requests)</h4>
              <div className="bg-muted/60 rounded-lg border border-border/30 overflow-hidden">
                <div className="flex items-center justify-between px-3 py-1.5 bg-muted border-b border-border/20">
                  <span className="text-xs text-muted-foreground">python</span>
                  <button
                    onClick={() => copyCommand(`import requests

BASE = "${apiBase}/api/oracle"
HEADERS = {"X-API-Key": "zyra_your_api_key"}

# Current price & confidence
r = requests.get(f"{BASE}/v1/price", headers=HEADERS)
data = r.json()
print(f"Pi: \${data['price_usd']} (confidence: {data['confidence_score']})")

# Supply stats
r = requests.get(f"{BASE}/data/mainnet-supply", headers=HEADERS)
supply = r.json()
print(f"Circulating: {supply['total_circulating_supply']:,}")

# Horizon proxy
r = requests.get(f"{BASE}/horizon/accounts/GABC...", headers=HEADERS)
print(r.json())`, -1)}
                    className="p-1 hover:bg-background rounded transition-colors"
                  >
                    <Copy className="h-3.5 w-3.5 text-muted-foreground" />
                  </button>
                </div>
                <pre className="p-3 overflow-x-auto text-[11px] text-emerald-600 dark:text-emerald-400">
                  <code>{`import requests

BASE = "${apiBase}/api/oracle"
HEADERS = {"X-API-Key": "zyra_your_api_key"}

# Current price & confidence
r = requests.get(f"{BASE}/v1/price", headers=HEADERS)
data = r.json()
print(f"Pi: \${data['price_usd']} (confidence: {data['confidence_score']})")

# Supply stats
r = requests.get(f"{BASE}/data/mainnet-supply", headers=HEADERS)
supply = r.json()
print(f"Circulating: {supply['total_circulating_supply']:,}")

# Horizon proxy
r = requests.get(f"{BASE}/horizon/accounts/GABC...", headers=HEADERS)
print(r.json())`}</code>
                </pre>
              </div>
            </div>

            {/* cURL */}
            <div>
              <h4 className="text-sm font-medium text-foreground mb-2">cURL</h4>
              <div className="bg-muted/60 rounded-lg border border-border/30 overflow-hidden">
                <div className="flex items-center justify-between px-3 py-1.5 bg-muted border-b border-border/20">
                  <span className="text-xs text-muted-foreground">bash</span>
                  <button
                    onClick={() => copyCommand(`# Price
curl -H "X-API-Key: zyra_..." "${apiBase}/api/oracle/v1/price"

# Sources status
curl -H "X-API-Key: zyra_..." "${apiBase}/api/oracle/v1/sources"

# Health check
curl -H "X-API-Key: zyra_..." "${apiBase}/api/oracle/v1/health"

# Supply
curl -H "X-API-Key: zyra_..." "${apiBase}/api/oracle/data/mainnet-supply"

# Horizon proxy
curl -H "X-API-Key: zyra_..." "${apiBase}/api/oracle/horizon/accounts/GABC..."`, -1)}
                    className="p-1 hover:bg-background rounded transition-colors"
                  >
                    <Copy className="h-3.5 w-3.5 text-muted-foreground" />
                  </button>
                </div>
                <pre className="p-3 overflow-x-auto text-[11px] text-emerald-600 dark:text-emerald-400">
                  <code>{`# Price
curl -H "X-API-Key: zyra_..." "${apiBase}/api/oracle/v1/price"

# Sources status
curl -H "X-API-Key: zyra_..." "${apiBase}/api/oracle/v1/sources"

# Health check
curl -H "X-API-Key: zyra_..." "${apiBase}/api/oracle/v1/health"

# Supply
curl -H "X-API-Key: zyra_..." "${apiBase}/api/oracle/data/mainnet-supply"

# Horizon proxy
curl -H "X-API-Key: zyra_..." "${apiBase}/api/oracle/horizon/accounts/GABC..."`}</code>
                </pre>
              </div>
            </div>
          </div>
        </div>

        {/* Authentication */}
        <div className="bg-card rounded-xl border border-border/50 shadow-sm p-4 sm:p-6 mb-6">
          <div className="flex items-center space-x-3 mb-4">
            <Shield className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold text-foreground">Authentication</h2>
          </div>
          <div className="bg-muted/30 rounded-lg p-4">
            <h4 className="font-medium text-foreground text-sm mb-2">Oracle API Key</h4>
            <p className="text-xs text-muted-foreground mb-2">
              Pay as you go — purchase an API key with Pi. Send it in the{' '}
              <code className="bg-background px-1 rounded">X-API-Key</code> header or{' '}
              <code className="bg-background px-1 rounded">?apiKey=</code> query parameter.
              Keys are SHA-256 hashed with a pepper — server never stores plaintext.
            </p>
            <p className="text-xs text-muted-foreground">
              <Link href="/oracle-api" className="text-primary hover:underline">Purchase a key</Link>
              {' | '}
              <Link href="/api-dashboard" className="text-primary hover:underline">Manage your keys</Link>
            </p>
          </div>
        </div>

        {/* Rate Limiting */}
        <div className="bg-card rounded-xl border border-border/50 shadow-sm p-4 sm:p-6 mb-6">
          <div className="flex items-center space-x-3 mb-4">
            <BarChart3 className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold text-foreground">Rate Limiting</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/30">
                  <th className="text-left py-2 font-medium text-foreground">Scope</th>
                  <th className="text-left py-2 font-medium text-foreground">Limit</th>
                  <th className="text-left py-2 font-medium text-foreground">Detail</th>
                </tr>
              </thead>
              <tbody className="text-muted-foreground text-xs">
                <tr className="border-b border-border/20">
                  <td className="py-2">Per API key (minute)</td>
                  <td className="py-2">60 requests</td>
                  <td className="py-2">429 status if exceeded</td>
                </tr>
                <tr className="border-b border-border/20">
                  <td className="py-2">Per API key (day)</td>
                  <td className="py-2">10,000 requests</td>
                  <td className="py-2">Rolling 24h window</td>
                </tr>
                <tr className="border-b border-border/20">
                  <td className="py-2">Horizon Proxy</td>
                  <td className="py-2">10-second timeout</td>
                  <td className="py-2">Forwarded to Pi Mainnet Horizon via Suban</td>
                </tr>
                <tr>
                  <td className="py-2">Cache</td>
                  <td className="py-2">10-second TTL</td>
                  <td className="py-2">Price endpoint only</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Suban API Services */}
        <div className="bg-card rounded-xl border border-border/50 shadow-sm p-4 sm:p-6 mb-6">
          <div className="flex items-center space-x-3 mb-4">
            <Wifi className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold text-foreground">Suban API Services</h2>
          </div>
          <p className="text-xs text-muted-foreground mb-4">
            All Horizon, Oracle, and RPC endpoints are served from the Suban infrastructure.
            Direct access is available for advanced use cases.
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/30">
                  <th className="text-left py-2 font-medium text-foreground">Service</th>
                  <th className="text-left py-2 font-medium text-foreground">URL</th>
                  <th className="text-left py-2 font-medium text-foreground hidden md:table-cell">Purpose</th>
                </tr>
              </thead>
              <tbody className="text-muted-foreground text-xs">
                <tr className="border-b border-border/20">
                  <td className="py-2 font-medium text-foreground">Mainnet Horizon</td>
                  <td className="py-2"><code className="bg-muted/50 px-1 py-0.5 rounded">https://horizon.suban.org/horizon</code></td>
                  <td className="py-2 hidden md:table-cell">Stellar Horizon API (ledgers, accounts, transactions, trades)</td>
                </tr>
                <tr className="border-b border-border/20">
                  <td className="py-2 font-medium text-foreground">Testnet Horizon</td>
                  <td className="py-2"><code className="bg-muted/50 px-1 py-0.5 rounded">https://testnet.suban.org</code></td>
                  <td className="py-2 hidden md:table-cell">Stellar Horizon API for testnet</td>
                </tr>
                <tr className="border-b border-border/20">
                  <td className="py-2 font-medium text-foreground">Oracle</td>
                  <td className="py-2"><code className="bg-muted/50 px-1 py-0.5 rounded">https://oracle.suban.org</code></td>
                  <td className="py-2 hidden md:table-cell">Price feeds, chain stats, health check</td>
                </tr>
                <tr className="border-b border-border/20">
                  <td className="py-2 font-medium text-foreground">RPC Mainnet</td>
                  <td className="py-2"><code className="bg-muted/50 px-1 py-0.5 rounded">https://rpc.suban.org</code></td>
                  <td className="py-2 hidden md:table-cell">Pi RPC mainnet</td>
                </tr>
                <tr>
                  <td className="py-2 font-medium text-foreground">RPC Testnet</td>
                  <td className="py-2"><code className="bg-muted/50 px-1 py-0.5 rounded">https://testrpc.suban.org</code></td>
                  <td className="py-2 hidden md:table-cell">Pi RPC testnet</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between text-xs text-muted-foreground py-4">
          <div className="flex items-center gap-3">
            <Link href="/oracle-api" className="hover:text-foreground transition-colors">Get API Key</Link>
            <Link href="/api-dashboard" className="hover:text-foreground transition-colors">Dashboard</Link>
          </div>
          <span>v1.0</span>
        </div>
      </div>
    </div>
  );
};

export default ApiDocumentationPage;
