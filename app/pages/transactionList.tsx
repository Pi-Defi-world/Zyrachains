"use client";
import React, { useState, useEffect } from "react";
import { useLanguage } from "@/context/languagecontext";
import { usePageMetadata } from "@/context/pagemetadataContext";
import { horizon } from "@/api/horizon";
import AccountLabel from "@/components/AccountLabel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ChevronLeft, ChevronRight, RefreshCw } from "lucide-react";
import Link from "next/link";
import { PageHeader } from "@/components/PageHeader";
import { SkeletonTable } from "@/components/SkeletonTable";
import { formatDistanceToNowWithLocale } from "@/utils/time";

interface PaymentRecord {
  id?: string;
  transaction_hash?: string;
  created_at?: string;
  from?: string;
  to?: string;
  amount?: string;
  asset_type?: string;
  asset_code?: string;
  transaction_successful?: boolean;
}

function shortHash(h: string) {
  if (h.length < 20) return h;
  return `${h.slice(0, 10)}\u2026${h.slice(-6)}`;
}

const TransactionList: React.FC = () => {
  const { t, language } = useLanguage();
  const { setHeading, setTitle, setDescription } = usePageMetadata();
  const [txNextLink, setTxNextLink] = useState("");
  const [txPrevLink, setTxPrevLink] = useState("");
  const [txPage, setTxPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [searchQuery, setSearchQuery] = useState("");

  const formatAmount = (raw: string | undefined): string => {
    if (!raw) return "\u2014";
    const n = parseFloat(raw);
    if (isNaN(n)) return "\u2014";
    if (n === 0) return "0";
    if (Math.abs(n) >= 1000) return n.toLocaleString(language, { maximumFractionDigits: 0 });
    return n.toLocaleString(language, { maximumFractionDigits: 4 });
  };

  const fetchPayments = async (link = "", page = 1) => {
    try {
      setRefreshing(true);
      const response = await horizon.getPayments(link, 20);
      const records = (response._embedded?.records || []) as PaymentRecord[];

      if (link === "" || link.indexOf("order=desc") > 0) {
        setPayments(records);
        setTxNextLink(response._links?.next?.href || "");
        setTxPrevLink(response._links?.prev?.href || "");
      } else {
        setPayments(records.reverse());
        setTxNextLink(response._links?.prev?.href || "");
        setTxPrevLink(response._links?.next?.href || "");
      }
      setTxPage(page);
      setLastUpdated(new Date());
    } catch (error) {
      console.error("Error fetching payments:", error);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    const fetchInitialData = async () => {
      setLoading(true);
      await fetchPayments();
      setLoading(false);
    };
    fetchInitialData();
  }, []);

  const handleRefresh = async () => {
    await fetchPayments();
  };

  useEffect(() => {
    setHeading(String(t("transactions.heading")));
    setTitle(String(t("transactions.title")));
    setDescription(String(t("transactions.description")));
  }, [setTitle, setDescription, setHeading, t, language]);

  const handleNextPage = () => {
    if (txNextLink) fetchPayments(txNextLink, txPage + 1);
  };

  const handlePrevPage = () => {
    if (txPrevLink) fetchPayments(txPrevLink, txPage - 1);
  };

  const formatLastUpdated = (date: Date) => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    if (diffInMinutes < 1) return "Just now";
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d ago`;
  };

  const filteredPayments = payments.filter((p) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      (p.transaction_hash || "").toLowerCase().includes(q) ||
      (p.from || "").toLowerCase().includes(q) ||
      (p.to || "").toLowerCase().includes(q) ||
      (p.amount || "").includes(q)
    );
  });

  if (loading) {
    return (
      <div className="w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10 max-w-7xl mx-auto">
        <PageHeader title="Transactions" description="Browse recent transactions on the Pi Network." />
        <SkeletonTable rows={10} cols={5} />
      </div>
    );
  }

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10 max-w-7xl mx-auto">
      <PageHeader
        title={String(t("transactions.heading"))}
        description={String(t("transactions.description"))}
      >
        <div className="flex items-center gap-3">
          <div className="text-xs sm:text-sm text-muted-foreground whitespace-nowrap">
            Updated {formatLastUpdated(lastUpdated)}
          </div>
          <Button onClick={handleRefresh} disabled={refreshing} variant="outline" size="sm">
            <RefreshCw className={`h-4 w-4 mr-1.5 ${refreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </PageHeader>

      <div className="mb-4">
        <Input
          placeholder="Search by hash, address, or amount..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-md"
        />
      </div>

      <div className="overflow-x-auto rounded-lg border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Hash</TableHead>
              <TableHead>Age</TableHead>
              <TableHead>From</TableHead>
              <TableHead>To</TableHead>
              <TableHead className="text-right">Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredPayments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  {searchQuery ? "No transactions match your search." : "No transactions found."}
                </TableCell>
              </TableRow>
            ) : (
              filteredPayments.map((p) => (
                <TableRow key={p.id || `${p.transaction_hash}-${p.from}-${p.to}`}>
                  <TableCell className="font-mono text-xs">
                    {p.transaction_hash ? (
                      <Link href={`/tx/${p.transaction_hash}`} className="text-primary hover:underline">
                        {shortHash(p.transaction_hash)}
                      </Link>
                    ) : (
                      "\u2014"
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                    {p.created_at ? formatDistanceToNowWithLocale(new Date(p.created_at), language) : "\u2014"}
                  </TableCell>
                  <TableCell className="max-w-[150px] truncate">
                    {p.from ? (
                      <AccountLabel account={p.from} shorten={true} />
                    ) : (
                      <span className="text-muted-foreground text-xs">{"\u2014"}</span>
                    )}
                  </TableCell>
                  <TableCell className="max-w-[150px] truncate">
                    {p.to ? (
                      <AccountLabel account={p.to} shorten={true} />
                    ) : (
                      <span className="text-muted-foreground text-xs">{"\u2014"}</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right font-medium whitespace-nowrap">
                    {p.amount ? (
                      <span>{formatAmount(p.amount)} {"\u03c0"}</span>
                    ) : (
                      <span className="text-muted-foreground text-xs">{"\u2014"}</span>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between mt-6">
        <div className="text-sm text-muted-foreground">Page {txPage}</div>
        <div className="flex items-center space-x-2">
          <Button onClick={handlePrevPage} disabled={!txPrevLink || refreshing} variant="outline" size="sm">
            <ChevronLeft className="h-4 w-4 mr-1" />
            Previous
          </Button>
          <Button onClick={handleNextPage} disabled={!txNextLink || refreshing} variant="outline" size="sm">
            Next
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default TransactionList;
