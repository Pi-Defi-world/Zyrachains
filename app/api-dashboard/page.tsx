'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { usePageMetadata } from '@/context/pagemetadataContext';
import { usePiNetwork } from '@/context/PiNetworkContext';
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Key, Activity, Clock, BarChart3, Trash2, ExternalLink,
  Loader2, Copy, Check, AlertCircle, RefreshCw, Eye, Zap,
  Shield, TrendingUp, Timer, Hash, Coins
} from 'lucide-react';
interface ApiKeyDoc {
  _id: string;
  keyPrefix: string;
  name: string;
  status: 'active' | 'revoked' | 'expired';
  createdAt: string;
  expiresAt?: string;
  rateLimit?: { requestsPerMinute: number; requestsPerDay: number };
  credits?: number;
  creditCostPerRequest?: number;
}

interface KeyUsage {
  _id: string;
  keyPrefix: string;
  name: string;
  status: string;
  createdAt: string;
  expiresAt?: string;
  usage: {
    totalRequests: number;
    lastUsedAt: string | null;
  };
  rateLimit: {
    requestsPerMinute: number;
    requestsPerDay: number;
  };
  credits?: number;
  creditCostPerRequest?: number;
}

export default function ApiDashboardPage() {
  const { setTitle, setDescription, setHeading } = usePageMetadata();
  const { isAuthenticated, user, authenticate } = usePiNetwork();

  const [keys, setKeys] = useState<ApiKeyDoc[]>([]);
  const [loadingKeys, setLoadingKeys] = useState(false);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [usageData, setUsageData] = useState<KeyUsage | null>(null);
  const [loadingUsage, setLoadingUsage] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [revokingId, setRevokingId] = useState<string | null>(null);

  useEffect(() => {
    setHeading('API Dashboard');
    setTitle('API Dashboard - Zyrachain');
    setDescription('Manage your Oracle API keys, view usage statistics, and monitor rate limits.');
  }, [setHeading, setTitle, setDescription]);

  const getAuth = useCallback((): Record<string, string> => {
    const token = localStorage.getItem('pi_access_token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  }, []);

  const loadKeys = useCallback(async () => {
    setLoadingKeys(true);
    setError(null);
    try {
      const res = await fetch('/api/oracle/keys', { headers: getAuth() });
      const data = await res.json();
      if (data.keys) setKeys(data.keys);
      else if (data.error) setError(data.error);
    } catch {
      setError('Failed to load keys. Check your connection.');
    } finally {
      setLoadingKeys(false);
    }
  }, [getAuth]);

  const loadUsage = useCallback(async (keyId: string) => {
    setLoadingUsage(true);
    setUsageData(null);
    try {
      const res = await fetch(`/api/oracle/keys/${keyId}/usage`, { headers: getAuth() });
      const data = await res.json();
      if (data.usage) setUsageData(data.usage);
      else if (data.error) setError(data.error);
    } catch {
      setError('Failed to load usage data.');
    } finally {
      setLoadingUsage(false);
    }
  }, [getAuth]);

  const revokeKey = async (keyId: string) => {
    if (!confirm('Revoke this key? It will stop working immediately. This cannot be undone.')) return;
    setRevokingId(keyId);
    try {
      const res = await fetch(`/api/oracle/keys/${keyId}`, {
        method: 'DELETE',
        headers: getAuth(),
      });
      const data = await res.json();
      if (data.success) {
        setKeys(prev => prev.map(k => k._id === keyId ? { ...k, status: 'revoked' } : k));
        if (selectedKey === keyId) { setSelectedKey(null); setUsageData(null); }
      } else if (data.error) {
        setError(data.error);
      }
    } catch {
      setError('Failed to revoke key.');
    } finally {
      setRevokingId(null);
    }
  };

  useEffect(() => { if (isAuthenticated) loadKeys(); }, [isAuthenticated, loadKeys]);

  useEffect(() => {
    if (selectedKey) loadUsage(selectedKey);
  }, [selectedKey, loadUsage]);

  const activeKeys = keys.filter(k => k.status === 'active');
  const totalReqs = usageData?.usage.totalRequests ?? 0;
  const lastUsed = usageData?.usage.lastUsedAt;
  const rpmLimit = usageData?.rateLimit?.requestsPerMinute ?? 60;
  const rpdLimit = usageData?.rateLimit?.requestsPerDay ?? 10000;

  return (
    <div className="min-h-screen bg-background p-3 pb-20 sm:p-4 mobile-nav-safe">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Shield className="h-5 w-5 text-primary" />
              </div>
              <h1 className="text-2xl font-bold text-foreground">API Dashboard</h1>
            </div>
            <p className="text-sm text-muted-foreground">Manage your Oracle API keys and monitor usage.</p>
          </div>
          <div className="flex gap-2">
            <Link href="/oracle-api">
              <Button size="sm" variant="outline">
                <Key className="h-4 w-4 mr-1" /> Get New Key
              </Button>
            </Link>
            <Link href="/api-documentation">
              <Button size="sm" variant="outline">
                <ExternalLink className="h-4 w-4 mr-1" /> API Docs
              </Button>
            </Link>
          </div>
        </div>

        {/* Auth Check */}
        {!isAuthenticated && (
          <Card>
            <CardContent className="py-8 text-center">
              <Key className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground mb-3">Connect your Pi Wallet to view and manage your API keys.</p>
              <Button onClick={() => authenticate()}>Connect Pi Wallet</Button>
            </CardContent>
          </Card>
        )}

        {isAuthenticated && (
          <>
            {/* Stats Row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <Hash className="h-4 w-4 text-primary" />
                    <span className="text-2xl font-bold text-foreground">{keys.length}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Total Keys</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <Activity className="h-4 w-4 text-green-500" />
                    <span className="text-2xl font-bold text-foreground">{activeKeys.length}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Active</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <TrendingUp className="h-4 w-4 text-blue-500" />
                    <span className="text-2xl font-bold text-foreground">{totalReqs.toLocaleString()}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{selectedKey ? 'Selected Key Reqs' : 'Select a key →'}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <Timer className="h-4 w-4 text-amber-500" />
                    <span className="text-2xl font-bold text-foreground">{rpmLimit}/60s</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Rate Limit / min</p>
                </CardContent>
              </Card>
            </div>

            {/* Credits Row */}
            {selectedKey && usageData && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-1">
                      <Coins className="h-4 w-4 text-amber-500" />
                      <span className="text-2xl font-bold text-foreground">
                        {(usageData.credits ?? 0).toFixed(1)}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Credits (@ {(usageData.creditCostPerRequest ?? 0.01)}/req)
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-1">
                      <TrendingUp className="h-4 w-4 text-blue-500" />
                      <span className="text-2xl font-bold text-foreground">
                        {((usageData.credits ?? 0) / (usageData.creditCostPerRequest || 0.01)).toFixed(0)}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">Est. remaining requests</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 flex items-center justify-center h-full">
                    <Link href="/api-dashboard/topup">
                      <Button size="sm" variant="default">
                        <Zap className="h-4 w-4 mr-1" /> Top Up Credits
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Error Alert */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
                <p className="text-sm text-red-700">{error}</p>
                <button onClick={() => setError(null)} className="ml-auto text-red-400 hover:text-red-600">x</button>
              </div>
            )}

            {/* Keys List */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <div>
                  <CardTitle className="text-base">Your API Keys</CardTitle>
                  <CardDescription>Prefix only — full key is never stored server-side.</CardDescription>
                </div>
                <Button variant="ghost" size="icon" onClick={loadKeys} disabled={loadingKeys} title="Refresh">
                  <RefreshCw className={`h-4 w-4 ${loadingKeys ? 'animate-spin' : ''}`} />
                </Button>
              </CardHeader>
              <CardContent>
                {loadingKeys ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : keys.length === 0 ? (
                  <div className="text-center py-8">
                    <Key className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                    <p className="text-muted-foreground mb-3">No API keys yet.</p>
                    <Link href="/oracle-api">
                      <Button size="sm">Purchase an API Key (100 Pi)</Button>
                    </Link>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border/20 text-left">
                          <th className="py-2 px-3 font-medium text-foreground">Key</th>
                          <th className="py-2 px-3 font-medium text-foreground hidden sm:table-cell">Name</th>
                          <th className="py-2 px-3 font-medium text-foreground">Status</th>
                          <th className="py-2 px-3 font-medium text-foreground hidden md:table-cell">Created</th>
                          <th className="py-2 px-3 font-medium text-foreground text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="text-muted-foreground">
                        {keys.map(k => (
                          <tr
                            key={k._id}
                            className={`border-b border-border/10 hover:bg-muted/30 transition-colors cursor-pointer ${selectedKey === k._id ? 'bg-primary/5' : ''}`}
                            onClick={() => setSelectedKey(k._id === selectedKey ? null : k._id)}
                          >
                            <td className="py-2.5 px-3">
                              <code className="text-xs font-mono text-foreground bg-muted/50 px-1.5 py-0.5 rounded">
                                {k.keyPrefix}...
                              </code>
                            </td>
                            <td className="py-2.5 px-3 text-xs hidden sm:table-cell">{k.name}</td>
                            <td className="py-2.5 px-3">
                              <Badge variant={k.status === 'active' ? 'default' : 'secondary'} className="text-[10px]">
                                {k.status}
                              </Badge>
                            </td>
                            <td className="py-2.5 px-3 text-xs hidden md:table-cell">
                              {new Date(k.createdAt).toLocaleDateString()}
                            </td>
                            <td className="py-2.5 px-3 text-right">
                              <div className="flex items-center justify-end gap-1">
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-7 w-7"
                                  onClick={(e) => { e.stopPropagation(); setSelectedKey(k._id === selectedKey ? null : k._id); }}
                                  title="View usage"
                                >
                                  <Eye className="h-3.5 w-3.5" />
                                </Button>
                                {k.status === 'active' && (
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-7 w-7 text-red-500 hover:text-red-600"
                                    onClick={(e) => { e.stopPropagation(); revokeKey(k._id); }}
                                    disabled={revokingId === k._id}
                                    title="Revoke key"
                                  >
                                    {revokingId === k._id ? (
                                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                    ) : (
                                      <Trash2 className="h-3.5 w-3.5" />
                                    )}
                                  </Button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Usage Details Panel */}
            {selectedKey && (
              <Card className="border-primary/20">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <BarChart3 className="h-4 w-4 text-primary" />
                    Key Usage Details
                  </CardTitle>
                  <CardDescription>
                    Usage stats for <code className="text-xs bg-muted px-1 py-0.5 rounded">{usageData?.keyPrefix || '...'}...</code>
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {loadingUsage ? (
                    <div className="flex justify-center py-6">
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : usageData ? (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="bg-muted/30 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Activity className="h-4 w-4 text-green-500" />
                          <span className="text-xs font-medium text-foreground">Total Requests</span>
                        </div>
                        <p className="text-2xl font-bold text-foreground">{usageData.usage.totalRequests.toLocaleString()}</p>
                      </div>
                      <div className="bg-muted/30 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Coins className="h-4 w-4 text-amber-500" />
                          <span className="text-xs font-medium text-foreground">Credits</span>
                        </div>
                        <p className="text-2xl font-bold text-foreground">{(usageData.credits ?? 0).toFixed(1)}</p>
                        <p className="text-[10px] text-muted-foreground mt-1">
                          ~{((usageData.credits ?? 0) / (usageData.creditCostPerRequest || 0.01)).toFixed(0)} remaining requests
                        </p>
                      </div>
                      <div className="bg-muted/30 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Clock className="h-4 w-4 text-blue-500" />
                          <span className="text-xs font-medium text-foreground">Last Used</span>
                        </div>
                        <p className="text-lg font-semibold text-foreground">
                          {lastUsed
                            ? new Date(lastUsed).toLocaleString()
                            : 'Never'}
                        </p>
                        <p className="text-[10px] text-muted-foreground mt-1">
                          {lastUsed
                            ? `${Math.floor((Date.now() - new Date(lastUsed).getTime()) / 60000)} min ago`
                            : 'No requests yet'}
                        </p>
                      </div>
                      <div className="bg-muted/30 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Zap className="h-4 w-4 text-amber-500" />
                          <span className="text-xs font-medium text-foreground">Rate Limits</span>
                        </div>
                        <div className="space-y-2 text-xs">
                          <div className="flex justify-between text-muted-foreground">
                            <span>Per minute</span>
                            <span className="font-medium text-foreground">{rpmLimit}</span>
                          </div>
                          <div className="flex justify-between text-muted-foreground">
                            <span>Per day</span>
                            <span className="font-medium text-foreground">{rpdLimit.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between text-muted-foreground">
                            <span>Created</span>
                            <span className="font-medium text-foreground">
                              {new Date(usageData.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          {usageData.expiresAt && (
                            <div className="flex justify-between text-muted-foreground">
                              <span>Expires</span>
                              <span className="font-medium text-foreground">
                                {new Date(usageData.expiresAt).toLocaleDateString()}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">No usage data available.</p>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Quick Links */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Quick Links</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <Link href="/oracle-api" className="block p-4 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors">
                    <Key className="h-5 w-5 text-primary mb-2" />
                    <p className="text-sm font-medium text-foreground">Purchase a Key</p>
                    <p className="text-xs text-muted-foreground mt-1">100 Pi — incl. 100 credits</p>
                  </Link>
                  <Link href="/api-dashboard/topup" className="block p-4 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors">
                    <Zap className="h-5 w-5 text-primary mb-2" />
                    <p className="text-sm font-medium text-foreground">Top Up Credits</p>
                    <p className="text-xs text-muted-foreground mt-1">Add credits to existing keys</p>
                  </Link>
                  <Link href="/api-documentation" className="block p-4 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors">
                    <Shield className="h-5 w-5 text-primary mb-2" />
                    <p className="text-sm font-medium text-foreground">API Documentation</p>
                    <p className="text-xs text-muted-foreground mt-1">Full endpoint reference & examples</p>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
