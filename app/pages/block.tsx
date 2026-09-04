"use client";
import React, { useState, useEffect } from "react";
import { useLanguage } from "@/context/languagecontext";
import { usePageMetadata } from "@/context/pagemetadataContext";
import { horizon } from "@/api/horizon";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChevronLeft, ChevronRight, RefreshCw, Hash, Layers, FileText, Clock } from "lucide-react";
import Link from "next/link";
import { PageHeader } from "@/components/PageHeader";
import { SummaryStats } from "@/components/SummaryStats";
import { SkeletonCard } from "@/components/SkeletonCard";

const BlocksPage: React.FC = () => {
  const { t, language } = useLanguage();
  const { setHeading, setTitle, setDescription } = usePageMetadata();
  const [blocks, setBlocks] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [nextLink, setNextLink] = useState("");
  const [prevLink, setPrevLink] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [searchQuery, setSearchQuery] = useState("");
  const [aggregateStats, setAggregateStats] = useState({ totalBlocks: 0, totalTxs: 0, totalOps: 0 });

  const computeStatsFromRecords = (records: any[]) => {
    const totalTxs = records.reduce((sum, b) => sum + (b.successful_transaction_count || 0), 0);
    const totalOps = records.reduce((sum, b) => sum + (b.operation_count || 0), 0);
    setAggregateStats({ totalBlocks: records.length, totalTxs, totalOps });
  };

  const fetchStats = async () => {
    try {
      const horizonUrl = process.env.NEXT_PUBLIC_HORIZON_BASE_URL || 'https://horizon.suban.org/horizon';
      const apiUrl = `${horizonUrl}/ledgers?order=desc&limit=100`;
      const response = await fetch(apiUrl);
      const data = await response.json();
      const records = data._embedded?.records || [];
      if (records.length > 0) {
        computeStatsFromRecords(records);
        return;
      }
    } catch { /* fallback */ }

    try {
      const r = await fetch('/api/v2/home/latest-blocks');
      const j = await r.json();
      if (j.success && j.data?.records?.length) {
        computeStatsFromRecords(j.data.records);
      }
    } catch { /* silent */ }
  };

  // Fetch blocks data
  const fetchBlocks = async (link = "", page = 1) => {
    try {
      setRefreshing(true);
      if (!link) {
        try {
          const r = await fetch('/api/v2/home/latest-blocks');
          const j = await r.json();
          if (j.success && j.data?.records?.length) {
            setBlocks(j.data.records);
            const hl = j.data.horizonLinks as { next?: { href?: string }; prev?: { href?: string } } | undefined;
            setNextLink(hl?.next?.href || "");
            setPrevLink(hl?.prev?.href || "");
            setCurrentPage(page);
            setLastUpdated(new Date());
            return;
          }
        } catch {
          /* fallback to horizon client */
        }
      }
      const response = await horizon.getLedgers(link);
      
      if (link === "" || link.indexOf("order=desc") > 0) {
        setBlocks(response._embedded.records);
        setNextLink(response._links.next.href);
        setPrevLink(response._links.prev.href);
        setCurrentPage(page);
      } else {
        setBlocks(response._embedded.records.reverse());
        setNextLink(response._links.prev.href);
        setPrevLink(response._links.next.href);
        setCurrentPage(page);
      }
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error fetching blocks:', error);
    } finally {
      setRefreshing(false);
    }
  };

  // Initial data fetch
  useEffect(() => {
    const fetchInitialData = async () => {
      setLoading(true);
      await Promise.all([fetchBlocks(), fetchStats()]);
      setLoading(false);
    };
    fetchInitialData();
  }, []);

  // Manual refresh function
  const handleRefresh = async () => {
    await Promise.all([fetchBlocks(), fetchStats()]);
  };

  useEffect(() => {
    setHeading(String(t('blocks.heading')));
    setTitle(String(t('blocks.title')));
    setDescription(String(t('blocks.description')));
  }, [setTitle, setDescription, setHeading, t, language]);

  const handleNextPage = () => {
    if (nextLink) {
      fetchBlocks(nextLink, currentPage + 1);
    }
  };

  const handlePrevPage = () => {
    if (prevLink) {
      fetchBlocks(prevLink, currentPage - 1);
    }
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

  const filteredBlocks = blocks.filter((block) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      String(block.sequence).includes(q) ||
      (block.hash || "").toLowerCase().includes(q)
    );
  });

  if (loading) {
    return (
      <div className="w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10 max-w-7xl mx-auto">
        <PageHeader title="Blocks" description="Browse recent blocks on the Pi Network." />
        <SkeletonCard count={5} />
      </div>
    );
  }

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10 max-w-7xl mx-auto">
      <PageHeader
        title={String(t('blocks.heading'))}
        description={String(t('blocks.description'))}
      >
        <div className="flex items-center gap-3">
          <div className="text-xs sm:text-sm text-muted-foreground whitespace-nowrap">
            Updated {formatLastUpdated(lastUpdated)}
          </div>
          <Button
            onClick={handleRefresh}
            disabled={refreshing}
            variant="outline"
            size="sm"
          >
            <RefreshCw className={`h-4 w-4 mr-1.5 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </PageHeader>

      <SummaryStats
        stats={[
          { label: "Total Blocks", value: aggregateStats.totalBlocks.toLocaleString(), icon: <Layers className="h-4 w-4 text-emerald-600 dark:text-emerald-400" /> },
          { label: "Total Txs", value: aggregateStats.totalTxs.toLocaleString(), icon: <FileText className="h-4 w-4 text-emerald-600 dark:text-emerald-400" /> },
          { label: "Total Ops", value: aggregateStats.totalOps.toLocaleString(), icon: <Hash className="h-4 w-4 text-emerald-600 dark:text-emerald-400" /> },
          { label: "Latest Block", value: blocks.length > 0 ? `#${blocks[0].sequence}` : "—", icon: <Clock className="h-4 w-4 text-emerald-600 dark:text-emerald-400" /> },
        ]}
      />

      {/* Search */}
      <div className="mb-4 sm:mb-6">
        <Input
          placeholder="Search by block sequence or hash..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-md"
        />
      </div>

      {/* Blocks List */}
      <div className="space-y-3 sm:space-y-4">
        {filteredBlocks.length === 0 ? (
          <Card>
            <CardContent className="text-center py-10">
              <p className="text-muted-foreground">
                {searchQuery ? "No blocks found matching your search." : "No blocks available."}
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredBlocks.map((block) => (
            <Card key={block.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4 sm:p-5">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground mb-0.5">Block</p>
                    <Link 
                      href={`/block/${block.sequence}`}
                      className="text-primary hover:underline font-medium text-sm sm:text-base"
                    >
                      #{block.sequence}
                    </Link>
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground mb-0.5">Hash</p>
                    <p className="font-mono text-xs sm:text-sm truncate">
                      {block.hash?.slice(0, 16)}...
                    </p>
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground mb-0.5">Txs / Ops</p>
                    <p className="font-medium text-sm sm:text-base">
                      {block.successful_transaction_count || 0} / {block.operation_count || 0}
                    </p>
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground mb-0.5">Created</p>
                    <p className="text-sm sm:text-base truncate">
                      {new Date(block.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between mt-6">
        <div className="text-sm text-muted-foreground">Page {currentPage}</div>
        <div className="flex items-center space-x-2">
          <Button
            onClick={handlePrevPage}
            disabled={!prevLink || refreshing}
            variant="outline"
            size="sm"
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Previous
          </Button>
          <Button
            onClick={handleNextPage}
            disabled={!nextLink || refreshing}
            variant="outline"
            size="sm"
          >
            Next
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default BlocksPage;
