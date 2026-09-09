'use client';

import React, { useState, useEffect } from 'react';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface Contract {
  id: string;
  paging_token?: string;
  contract_id?: string;
  admin?: string;
  last_modified_ledger?: number;
  last_modified_time?: string;
}

interface ContractsApiResponse {
  _links: { self: { href: string }; next?: { href: string }; prev?: { href: string } };
  _embedded: { records: Contract[] };
}

interface ContractsTabProps {
  onLoad?: (data: ContractsApiResponse, isInitial: boolean) => void;
}

export default function ContractsTab({ onLoad }: ContractsTabProps) {
  const [contractsData, setContractsData] = useState<ContractsApiResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');

  const CACHE_TTL_MS = 300_000;
  const getCached = (key: string) => {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed.ts !== 'number') return null;
      if (Date.now() - parsed.ts > CACHE_TTL_MS) return null;
      return parsed.data as ContractsApiResponse;
    } catch { return null; }
  };
  const setCached = (key: string, data: any) => {
    try { localStorage.setItem(key, JSON.stringify({ ts: Date.now(), data })); } catch {}
  };

  useEffect(() => { fetchContracts(); }, []);

  const fetchContracts = async (url?: string) => {
    try {
      setLoading(true);
      if (!url) {
        try {
          const r = await fetch('/api/v2/home/contracts');
          const j = await r.json();
          if (j?.success && j?.data?.records?.length) {
            const payload = {
              _embedded: { records: j.data.records as Contract[] },
              _links: j.data.horizonLinks || { self: { href: '' } },
            } as ContractsApiResponse;
            setContractsData(payload);
            onLoad?.(payload, true);
            setLoading(false);
            return;
          }
        } catch { /* fallback */ }
      }

      const horizonUrl = process.env.NEXT_PUBLIC_HORIZON_BASE_URL || 'https://horizon.suban.org/horizon';
      const apiUrl = url || `${horizonUrl}/contracts?limit=50&order=desc`;
      const cacheKey = `contracts_${btoa(apiUrl)}`;
      const cached = getCached(cacheKey);
      if (cached) {
        setContractsData(cached);
        onLoad?.(cached, false);
        setLoading(false);
        return;
      }
      const response = await fetch(apiUrl);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      setCached(cacheKey, data);
      setContractsData(data);
      onLoad?.(data, false);
    } catch (err) {
      setError(`Failed to fetch contracts: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setLoading(false);
    }
  };

  const handleNextPage = () => contractsData?._links?.next && fetchContracts(contractsData._links.next.href);
  const handlePrevPage = () => contractsData?._links?.prev && fetchContracts(contractsData._links.prev.href);

  const formatDateTime = (dateTime?: string) => {
    if (!dateTime) return 'Unknown';
    const date = new Date(dateTime);
    if (isNaN(date.getTime())) return 'Invalid Date';
    return date.toLocaleString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  if (loading) return <div className="py-8 text-sm text-muted-foreground">Loading contracts...</div>;
  if (error) return <div className="py-8 text-sm text-red-500">{error}</div>;
  if (!contractsData) return <div className="py-8 text-sm">No contracts data</div>;

  const records = contractsData._embedded?.records || [];
  const filtered = records.filter(c =>
    (c.id || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (c.contract_id || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (c.admin || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="w-full">
      <div className="mb-4">
        <Input
          placeholder="Search contracts by ID or admin..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-md"
        />
      </div>
      <div className="overflow-x-auto">
        {records.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-sm text-muted-foreground mb-2">No smart contracts found on this network.</p>
            <p className="text-xs text-muted-foreground">The /contracts endpoint returned empty — no contracts have been deployed yet.</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-sm text-muted-foreground">No contracts match your search.</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Contract ID</TableHead>
                <TableHead>Admin</TableHead>
                <TableHead className="text-right">Ledger</TableHead>
                <TableHead className="text-right">Last Modified</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((contract) => (
                <TableRow key={contract.id}>
                  <TableCell>
                    <Link href={`/contracts/${encodeURIComponent(contract.id)}`} className="text-primary">
                      <code className="text-xs">{contract.id?.slice(0, 12)}...{contract.id?.slice(-8)}</code>
                    </Link>
                  </TableCell>
                  <TableCell>
                    {contract.admin ? (
                      <Link href={`/account/${contract.admin}`} className="text-primary">
                        <code className="text-xs">{contract.admin.slice(0, 8)}...{contract.admin.slice(-8)}</code>
                      </Link>
                    ) : (
                      <span className="text-muted-foreground text-xs">N/A</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right text-xs">{contract.last_modified_ledger || '—'}</TableCell>
                  <TableCell className="text-right text-xs">{formatDateTime(contract.last_modified_time)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
      <div className="flex items-center justify-between mt-4">
        <span className="text-xs text-muted-foreground">{filtered.length} contracts</span>
        {records.length > 0 && (
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={!contractsData._links.prev} onClick={handlePrevPage}>Previous</Button>
            <Button variant="outline" size="sm" disabled={!contractsData._links.next} onClick={handleNextPage}>Next</Button>
          </div>
        )}
      </div>
    </div>
  );
}
