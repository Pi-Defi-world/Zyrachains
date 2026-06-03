'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { usePageMetadata } from '@/context/pagemetadataContext';
import apiClient from '@/lib/api-client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertTriangle, ExternalLink, Users, Search, TrendingUp } from 'lucide-react';
import Link from 'next/link';
import { PageHeader } from '@/components/PageHeader';

interface CommunitySocialStats {
  telegramUsername: string | null;
  telegram: { memberCount?: number | null; title?: string } | null;
  telegramError?: string;
  twitterUsername?: string | null;
  twitter?: { followersCount?: number; username?: string } | null;
  twitterError?: string;
}

interface CommunityListingRow {
  _id: string;
  name: string;
  description: string;
  category: string;
  website?: string;
  telegram?: string;
  twitter?: string;
  discord?: string;
  socialStats?: CommunitySocialStats;
}

export default function DirectoryCommunitiesPage() {
  const { setHeading, setTitle, setDescription } = usePageMetadata();
  const [rows, setRows] = useState<CommunityListingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await apiClient.getCommunityDirectoryListings();
      if (res.success && Array.isArray(res.listings)) {
        setRows(res.listings as CommunityListingRow[]);
      } else {
        throw new Error((res as { error?: string }).error || 'Failed to load listings');
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setHeading('Community listings');
    setTitle('Community listings | Zyrachain');
    setDescription('Paid community directory with live Telegram member counts when available.');
  }, [setHeading, setTitle, setDescription]);

  useEffect(() => {
    load();
  }, [load]);

  const categories = useMemo(() => [...new Set(rows.map((r) => r.category))], [rows]);

  const filteredRows = useMemo(() => {
    return rows.filter((r) => {
      if (selectedCategory !== "all" && r.category !== selectedCategory) return false;
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return (
        r.name.toLowerCase().includes(q) ||
        r.description.toLowerCase().includes(q) ||
        r.category.toLowerCase().includes(q)
      );
    });
  }, [rows, searchQuery, selectedCategory]);

  const totalMembers = rows.reduce((sum, r) => {
    const n = r.socialStats?.telegram?.memberCount;
    return sum + (typeof n === 'number' ? n : 0);
  }, 0);

  const totalXFollowers = rows.reduce((sum, r) => {
    const n = r.socialStats?.twitter?.followersCount;
    return sum + (typeof n === 'number' ? n : 0);
  }, 0);

  if (loading) {
    return (
      <div className="w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10 max-w-7xl mx-auto">
        <PageHeader title="Community listings" description="Paid community directory with live Telegram member counts." />
        <div className="flex justify-center items-center py-12">
          <Spinner />
          <span className="ml-2 text-muted-foreground">Loading directory…</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10 max-w-7xl mx-auto">
        <PageHeader title="Community listings" description="Paid community directory with live Telegram member counts." />
        <div className="max-w-lg mx-auto">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex gap-3">
            <AlertTriangle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-red-800 dark:text-red-300">Could not load listings</p>
              <p className="text-sm text-red-700 dark:text-red-400 mt-1">{error}</p>
              <Button variant="outline" size="sm" className="mt-3" onClick={load}>
                Retry
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10 max-w-7xl mx-auto">
      <PageHeader
        title="Community listings"
        description="Approved paid listings. Member counts use the Telegram Bot API when configured."
      >
        <Button variant="outline" size="sm" asChild>
          <Link href="/directory">All directories</Link>
        </Button>
      </PageHeader>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
        <Card className="bg-card/80 backdrop-blur-sm border border-border/50">
          <CardContent className="p-4 sm:p-5">
            <p className="text-xs sm:text-sm text-muted-foreground">Listings</p>
            <p className="text-xl sm:text-2xl font-bold text-foreground">{rows.length}</p>
          </CardContent>
        </Card>
        <Card className="bg-card/80 backdrop-blur-sm border border-border/50">
          <CardContent className="p-4 sm:p-5">
            <p className="text-xs sm:text-sm text-muted-foreground">Total TG members</p>
            <p className="text-xl sm:text-2xl font-bold text-foreground">{totalMembers.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card className="bg-card/80 backdrop-blur-sm border border-border/50">
          <CardContent className="p-4 sm:p-5">
            <p className="text-xs sm:text-sm text-muted-foreground">Total X followers</p>
            <p className="text-xl sm:text-2xl font-bold text-foreground">{totalXFollowers.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card className="bg-card/80 backdrop-blur-sm border border-border/50">
          <CardContent className="p-4 sm:p-5">
            <p className="text-xs sm:text-sm text-muted-foreground">Social handles</p>
            <p className="text-xl sm:text-2xl font-bold text-foreground">
              {rows.filter((r) => r.socialStats?.telegramUsername || r.socialStats?.twitterUsername).length}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Search + Category Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4 sm:mb-6">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search communities..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          <Badge
            variant={selectedCategory === "all" ? "default" : "outline"}
            className="cursor-pointer px-3 py-1.5"
            onClick={() => setSelectedCategory("all")}
          >
            All
          </Badge>
          {categories.map((cat) => (
            <Badge
              key={cat}
              variant={selectedCategory === cat ? "default" : "outline"}
              className="cursor-pointer px-3 py-1.5"
              onClick={() => setSelectedCategory(cat)}
            >
              {cat}
            </Badge>
          ))}
        </div>
      </div>

      {/* Communities Table */}
      <Card className="bg-card/80 backdrop-blur-sm border border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center text-xl font-heading">
            <Users className="h-5 w-5 mr-2 text-emerald-600" />
            Communities ({filteredRows.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredRows.length === 0 ? (
            <div className="text-center py-10">
              <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                {searchQuery || selectedCategory !== "all"
                  ? "No matching communities found."
                  : "No approved community listings yet."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Community</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>TG Members</TableHead>
                    <TableHead>X Followers</TableHead>
                    <TableHead className="w-[140px]">Links</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRows.map((r) => {
                    const tgUser = r.socialStats?.telegramUsername;
                    const members = r.socialStats?.telegram?.memberCount;
                    const tgErr = r.socialStats?.telegramError;
                    const twHandle = r.socialStats?.twitterUsername;
                    const xFollowers = r.socialStats?.twitter?.followersCount;
                    const twErr = r.socialStats?.twitterError;
                    return (
                      <TableRow key={r._id} className="hover:bg-muted/50">
                        <TableCell>
                          <div className="font-medium text-foreground">{r.name}</div>
                          <div className="text-xs text-muted-foreground line-clamp-2 max-w-[280px]">{r.description}</div>
                          {(tgErr || twErr) && (
                            <div className="text-xs text-amber-600 dark:text-amber-400 mt-1">{tgErr || twErr}</div>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">{r.category}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Users className="h-4 w-4 text-muted-foreground shrink-0" />
                            {typeof members === 'number' ? (
                              <span className="font-medium">{members.toLocaleString()}</span>
                            ) : tgUser ? (
                              <span className="text-muted-foreground text-sm">—</span>
                            ) : (
                              <span className="text-muted-foreground text-sm">N/A</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <TrendingUp className="h-4 w-4 text-muted-foreground shrink-0" />
                            {typeof xFollowers === 'number' ? (
                              <span className="font-medium">{xFollowers.toLocaleString()}</span>
                            ) : twHandle ? (
                              <span className="text-muted-foreground text-sm">—</span>
                            ) : (
                              <span className="text-muted-foreground text-sm">N/A</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            {tgUser && (
                              <Button variant="outline" size="sm" className="h-7 text-xs" asChild>
                                <a href={`https://t.me/${tgUser}`} target="_blank" rel="noopener noreferrer">
                                  <ExternalLink className="h-3 w-3 mr-1" />
                                  Telegram
                                </a>
                              </Button>
                            )}
                            {twHandle && (
                              <Button variant="outline" size="sm" className="h-7 text-xs" asChild>
                                <a href={`https://x.com/${twHandle}`} target="_blank" rel="noopener noreferrer">
                                  <ExternalLink className="h-3 w-3 mr-1" />
                                  X
                                </a>
                              </Button>
                            )}
                            {r.website && (
                              <Button variant="ghost" size="sm" className="h-7 text-xs" asChild>
                                <a href={r.website} target="_blank" rel="noopener noreferrer">
                                  Website
                                </a>
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
