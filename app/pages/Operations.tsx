"use client";
import React, { useState, useEffect } from "react";
import { useLanguage } from "@/context/languagecontext";
import { usePageMetadata } from "@/context/pagemetadataContext";
import { horizon } from "@/api/horizon";
import { okx } from "@/api/okx";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ChevronLeft, ChevronRight, RefreshCw, ArrowRight } from "lucide-react";
import Link from "next/link";
import AccountLabel from "@/components/AccountLabel";
import { PageHeader } from "@/components/PageHeader";
import { SkeletonTable } from "@/components/SkeletonTable";
import { formatDistanceToNowWithLocale } from "@/utils/time";

const OperationsPage: React.FC = () => {
  const { t, language } = useLanguage();
  const { setHeading, setTitle, setDescription } = usePageMetadata();
  const [operations, setOperations] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [nextLink, setNextLink] = useState("");
  const [prevLink, setPrevLink] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [piPriceUSD, setPiPriceUSD] = useState(0.0);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");

  const fetchOperations = async (link = "", page = 1) => {
    try {
      setRefreshing(true);
      try {
        const r = await fetch('/api/v2/home/latest-ops');
        const j = await r.json();
        if (j.success && j.data?.records) {
          setOperations(j.data.records || []);
          setNextLink(j.data.horizonLinks?.next?.href || "");
          setPrevLink(j.data.horizonLinks?.prev?.href || "");
          setCurrentPage(page);
          setLastUpdated(new Date());
          return;
        }
      } catch {
        /* fallback */
      }
      const operationsData = await horizon.getLatestOperations(link, 20);
      const records = operationsData._embedded?.records || [];
      if (!link || link.indexOf("order=desc") > 0) {
        setOperations(records);
        setNextLink(operationsData._links?.next?.href || "");
        setPrevLink(operationsData._links?.prev?.href || "");
      } else {
        setOperations(records.reverse());
        setNextLink(operationsData._links?.prev?.href || "");
        setPrevLink(operationsData._links?.next?.href || "");
      }
      setCurrentPage(page);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error fetching operations:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const fetchPiPrice = async () => {
    try {
      try {
        const r = await fetch('/api/v2/home/hero');
        const j = await r.json();
        if (j.success && typeof j.data?.priceUsd === 'number') {
          setPiPriceUSD(j.data.priceUsd);
          return;
        }
      } catch {
        /* fallback */
      }
      const marketData = await okx.getMarketData();
      setPiPriceUSD(parseFloat(marketData.idxPx || '2.0'));
    } catch (error) {
      console.error('Error fetching Pi price:', error);
    }
  };

  useEffect(() => {
    const fetchInitialData = async () => {
      setLoading(true);
      await Promise.all([fetchOperations(), fetchPiPrice()]);
      setLoading(false);
    };
    fetchInitialData();
  }, []);

  // Auto-refresh every 15s
  useEffect(() => {
    const interval = setInterval(() => {
      fetchOperations();
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  const handleRefresh = async () => {
    await Promise.all([fetchOperations(), fetchPiPrice()]);
  };

  useEffect(() => {
    setHeading(String(t('operations.heading')));
    setTitle(String(t('operations.title')));
    setDescription(String(t('operations.description')));
  }, [setTitle, setDescription, setHeading, language, t]);

  const handleNextPage = () => {
    if (nextLink) fetchOperations(nextLink, currentPage + 1);
  };

  const handlePrevPage = () => {
    if (prevLink) fetchOperations(prevLink, currentPage - 1);
  };

  const formatAmount = (amount: number): string => {
    return amount.toLocaleString(language, { minimumFractionDigits: 0, maximumFractionDigits: 2 });
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat(language, {
      style: 'currency', currency: 'USD',
      minimumFractionDigits: 2, maximumFractionDigits: 2,
    }).format(amount);
  };

  const formatLastUpdated = (date: Date) => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d ago`;
  };

  const renderTime = (createdAt: string | undefined): string => {
    if (!createdAt) return "\u2014";
    try {
      return formatDistanceToNowWithLocale(new Date(createdAt), language);
    } catch {
      return createdAt;
    }
  };

  const renderAccount = (from: string | undefined, to: string | undefined, sourceAccount: string | undefined): string | undefined => {
    if (from) return from;
    if (to) return to;
    if (sourceAccount) return sourceAccount;
    return undefined;
  };

  const operationTypes = [...new Set(operations.map((op) => op.type))].sort();

  const filteredOperations = operations.filter((op) => {
    if (typeFilter !== "all" && op.type !== typeFilter) return false;
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      (op.id || "").toLowerCase().includes(q) ||
      (op.from || op.source_account || "").toLowerCase().includes(q) ||
      (op.to || "").toLowerCase().includes(q) ||
      (op.type || "").toLowerCase().includes(q) ||
      (op.transaction_hash || "").toLowerCase().includes(q)
    );
  });

  if (loading) {
    return (
      <div className="w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10 max-w-7xl mx-auto">
        <PageHeader title="Operations" description="Browse recent operations on the Pi Network." />
        <SkeletonTable rows={10} cols={6} />
      </div>
    );
  }

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10 max-w-7xl mx-auto">
      <PageHeader
        title={String(t('operations.heading'))}
        description={String(t('operations.description'))}
      >
        <div className="flex items-center gap-3">
          <div className="text-xs sm:text-sm text-muted-foreground whitespace-nowrap">
            Updated {formatLastUpdated(lastUpdated)}
          </div>
          <Button onClick={handleRefresh} disabled={refreshing} variant="outline" size="sm">
            <RefreshCw className={`h-4 w-4 mr-1.5 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </PageHeader>

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <Input
          placeholder="Search by ID, account, or hash..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-xs"
        />
        {operationTypes.length > 0 && (
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="w-full sm:w-auto border border-input rounded-md bg-background px-3 py-2 text-sm"
          >
            <option value="all">All types</option>
            {operationTypes.map((type) => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        )}
      </div>

      <div className="overflow-x-auto rounded-lg border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Type</TableHead>
              <TableHead>Time</TableHead>
              <TableHead>From</TableHead>
              <TableHead>To</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead className="w-10"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredOperations.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  {searchQuery || typeFilter !== "all" ? "No operations match your filters." : "No operations available."}
                </TableCell>
              </TableRow>
            ) : (
              filteredOperations.map((operation, index) => (
                <TableRow key={operation.id || index} className="hover:bg-muted/50">
                  <TableCell>
                    <Badge variant="secondary" className="text-xs font-mono">
                      {operation.type}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs sm:text-sm text-muted-foreground whitespace-nowrap">
                    {renderTime(operation.created_at)}
                  </TableCell>
                  <TableCell className="max-w-[120px] sm:max-w-[180px] truncate">
                    {operation.from || operation.source_account ? (
                      <AccountLabel account={operation.from || operation.source_account} shorten={true} />
                    ) : (
                      <span className="text-muted-foreground text-xs">{'\u2014'}</span>
                    )}
                  </TableCell>
                  <TableCell className="max-w-[120px] sm:max-w-[180px] truncate">
                    {operation.to ? (
                      <AccountLabel account={operation.to} shorten={true} />
                    ) : (
                      <span className="text-muted-foreground text-xs">{'\u2014'}</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right whitespace-nowrap">
                    {operation.amount ? (
                      <span>
                        <span className="font-medium">{formatAmount(parseFloat(operation.amount))} {'\u03c0'}</span>
                        <span className="text-xs text-muted-foreground ml-1">
                          ({formatCurrency(parseFloat(operation.amount) * piPriceUSD)})
                        </span>
                      </span>
                    ) : (
                      <span className="text-muted-foreground text-xs">{'\u2014'}</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Link href={`/tx/${operation.transaction_hash}`}>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between mt-6">
        <div className="text-sm text-muted-foreground">Page {currentPage}</div>
        <div className="flex items-center space-x-2">
          <Button onClick={handlePrevPage} disabled={!prevLink || refreshing} variant="outline" size="sm">
            <ChevronLeft className="h-4 w-4 mr-1" /> Previous
          </Button>
          <Button onClick={handleNextPage} disabled={!nextLink || refreshing} variant="outline" size="sm">
            Next <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default OperationsPage;
