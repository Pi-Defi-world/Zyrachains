'use client';

import React, { useState, useEffect } from 'react';
import { PiscanAPI } from '@/api/piscan';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Spinner } from '@/components/ui/spinner';
import { Button } from '@/components/ui/button';
import AccountLabel from '@/components/AccountLabel';
import { timelib } from '@/utils/time';
import Link from 'next/link';

interface OperationDetails {
  to: string;
  from: string;
  amount: string;
}

interface Operation {
  details: OperationDetails;
  source_account: string;
  transaction_hash: string;
  transaction_time: string;
}

interface TransactionsApiResponse {
  operations: Operation[];
  pagination: {
    page: number;
    limit: number;
    has_next: boolean;
  };
}

interface ProjectTransactionsProps {
  walletAddress: string;
}

const PAGE_LIMIT = 10;

export const ProjectTransactions: React.FC<ProjectTransactionsProps> = ({ walletAddress }) => {
  const [transactions, setTransactions] = useState<Operation[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [hasNextPage, setHasNextPage] = useState<boolean>(false);

  useEffect(() => {
    const fetchTransactions = async (page: number) => {
      if (!walletAddress) return;

      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams({
          address: walletAddress,
          limit: String(PAGE_LIMIT),
          page: String(page),
        });

        const response = await fetch(`${PiscanAPI.Transactions}?${params.toString()}`);
        if (!response.ok) {
          throw new Error('Failed to fetch transactions');
        }
        const data: TransactionsApiResponse = await response.json();
        setTransactions(data.operations || []);
        setCurrentPage(data.pagination.page);
        setHasNextPage(data.pagination.has_next);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
        setTransactions([]);
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions(currentPage);
  }, [walletAddress, currentPage]);

  const formatAmount = (amountStr: string): string => {
    const amount = parseFloat(amountStr);
    return amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 7 });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <Spinner />
      </div>
    );
  }

  if (error) {
    return <div className="text-red-500">Error: {error}</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Transactions</CardTitle>
      </CardHeader>
      <CardContent>
        {transactions.length === 0 ? (
          <p>No transactions found.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Time</TableHead>
                <TableHead>From</TableHead>
                <TableHead>To</TableHead>
                <TableHead className="text-right">Amount (Pi)</TableHead>
                <TableHead>Tx Hash</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.map((op) => (
                <TableRow key={op.transaction_hash + op.details.amount + op.details.to}>
                  <TableCell>{timelib.timeAgo(op.transaction_time, 'en')}</TableCell>
                  <TableCell>
                    <AccountLabel account={op.details.from} shorten={true} />
                  </TableCell>
                  <TableCell>
                    <AccountLabel account={op.details.to} shorten={true} />
                  </TableCell>
                  <TableCell className="text-right font-bold">
                    {formatAmount(op.details.amount)}
                  </TableCell>
                  <TableCell>
                    <Link href={`/tx/${op.transaction_hash}`} className="no-underline hover:underline">
                      {op.transaction_hash.substring(0, 10)}...
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
        <div className="flex justify-center mt-4 gap-4">
            <Button
                variant="outline"
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPage === 1 || loading}
            >
                Previous
            </Button>
            <span className="self-center">Page {currentPage}</span>
            <Button
                variant="outline"
                onClick={() => setCurrentPage((prev) => prev + 1)}
                disabled={!hasNextPage || loading}
            >
                Next
            </Button>
        </div>
      </CardContent>
    </Card>
  );
};
