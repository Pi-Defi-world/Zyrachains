"use client";
import { useEffect, useState, useMemo } from "react";
import { usePageMetadata } from "@/context/pagemetadataContext";
import { useLanguage } from "@/context/languagecontext";
import apiClient from '@/lib/api-client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Users, Globe, ExternalLink, AlertTriangle, Search } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";

interface Community {
  _id: string;
  identifier: string;
  Name: string;
  Description: string;
  Members: number;
  Category: string;
  Website?: string;
  Logo?: string;
  Region?: string;
  Activity?: string;
  createdAt?: string;
  updatedAt?: string;
  socialStats?: { source?: 'live' | 'stored'; telegramUsername?: string | null };
}

export default function CommunitiesPage() {
  const [communities, setCommunities] = useState<Community[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const { setHeading, setTitle, setDescription } = usePageMetadata();
  const { language } = useLanguage();

  useEffect(() => {
    setHeading('Pi Network Communities');
    setTitle('Pi Network Communities | Global Pi Network Community');
    setDescription('Discover and connect with Pi Network communities worldwide.');
  }, [setHeading, setTitle, setDescription, language]);

  useEffect(() => {
    loadCommunitiesData();
  }, []);

  const loadCommunitiesData = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiClient.getCommunities();
      if (data.success) {
        const sortedCommunities = (data.data || []).sort((a: Community, b: Community) => b.Members - a.Members);
        setCommunities(sortedCommunities);
      } else {
        throw new Error(data.message || 'Failed to load communities data');
      }
    } catch (err) {
      console.error('Error loading communities:', err);
      setError(`Failed to load communities data: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setLoading(false);
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Development': return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-400';
      case 'Regional': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'Business': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400';
      case 'Education': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'Trading': return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      case 'Community': return 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400';
      case 'Technical': return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
    }
  };

  const categories = useMemo(() => [...new Set(communities.map(c => c.Category))], [communities]);

  const filteredCommunities = useMemo(() => {
    return communities.filter((c) => {
      if (selectedCategory !== "all" && c.Category !== selectedCategory) return false;
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return (
        c.Name.toLowerCase().includes(q) ||
        c.Description.toLowerCase().includes(q) ||
        c.Region?.toLowerCase().includes(q)
      );
    });
  }, [communities, searchQuery, selectedCategory]);

  const totalMembers = communities.reduce((sum, community) => sum + community.Members, 0);

  // Loading State
  if (loading) {
    return (
      <div className="w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10 max-w-7xl mx-auto">
        <PageHeader title="Pi Network Communities" description="Discover and connect with Pi Network communities worldwide." />
        <div className="flex justify-center items-center py-12">
          <Spinner />
          <span className="ml-2 text-muted-foreground">Loading communities...</span>
        </div>
      </div>
    );
  }

  // Error State
  if (error) {
    return (
      <div className="w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10 max-w-7xl mx-auto">
        <PageHeader title="Pi Network Communities" description="Discover and connect with Pi Network communities worldwide." />
        <div className="max-w-2xl mx-auto">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-6 py-4 rounded-lg flex items-start">
            <AlertTriangle className="h-5 w-5 mr-3 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="font-semibold mb-1">Error Loading Communities</h3>
              <p className="text-sm">{error}</p>
              <Button variant="outline" size="sm" className="mt-3" onClick={loadCommunitiesData}>
                Try Again
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
        title="Pi Network Communities"
        description="Discover and connect with Pi Network communities worldwide and be part of the growing ecosystem."
      />

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
        <Card className="bg-card/80 backdrop-blur-sm border border-border/50">
          <CardContent className="flex items-center p-4 sm:p-5">
            <div className="rounded-full p-2.5 bg-emerald-100 dark:bg-emerald-900/20 mr-3 shrink-0">
              <Users size={20} className="text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="min-w-0">
              <p className="text-muted-foreground text-xs sm:text-sm truncate">Total Communities</p>
              <p className="text-xl sm:text-2xl font-bold text-foreground">{communities.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card/80 backdrop-blur-sm border border-border/50">
          <CardContent className="flex items-center p-4 sm:p-5">
            <div className="rounded-full p-2.5 bg-green-100 dark:bg-green-900/20 mr-3 shrink-0">
              <Globe size={20} className="text-green-600 dark:text-green-400" />
            </div>
            <div className="min-w-0">
              <p className="text-muted-foreground text-xs sm:text-sm truncate">Total Members</p>
              <p className="text-xl sm:text-2xl font-bold text-foreground">{totalMembers.toLocaleString()}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card/80 backdrop-blur-sm border border-border/50">
          <CardContent className="flex items-center p-4 sm:p-5">
            <div className="rounded-full p-2.5 bg-purple-100 dark:bg-purple-900/20 mr-3 shrink-0">
              <Users size={20} className="text-purple-600 dark:text-purple-400" />
            </div>
            <div className="min-w-0">
              <p className="text-muted-foreground text-xs sm:text-sm truncate">Categories</p>
              <p className="text-xl sm:text-2xl font-bold text-foreground">{categories.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card/80 backdrop-blur-sm border border-border/50">
          <CardContent className="flex items-center p-4 sm:p-5">
            <div className="rounded-full p-2.5 bg-orange-100 dark:bg-orange-900/20 mr-3 shrink-0">
              <Globe size={20} className="text-orange-600 dark:text-orange-400" />
            </div>
            <div className="min-w-0">
              <p className="text-muted-foreground text-xs sm:text-sm truncate">Avg Members</p>
              <p className="text-xl sm:text-2xl font-bold text-foreground">
                {communities.length > 0 ? Math.round(totalMembers / communities.length).toLocaleString() : '0'}
              </p>
            </div>
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
            <Users className="h-5 w-5 mr-2 text-emerald-600 dark:text-emerald-400" />
            Pi Network Communities ({filteredCommunities.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredCommunities.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[300px]">Community</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Members</TableHead>
                    <TableHead>Region</TableHead>
                    <TableHead className="w-[100px]">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCommunities.map((community) => (
                    <TableRow key={community._id} className="hover:bg-muted/50">
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 rounded-full overflow-hidden flex items-center justify-center bg-gradient-to-r from-emerald-500 to-purple-600 shrink-0">
                            {community.Logo ? (
                              <img 
                                src={community.Logo} 
                                alt={`${community.Name} logo`}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.style.display = 'none';
                                  if (target.parentElement) {
                                    target.parentElement.innerHTML = `<span class="text-white font-bold text-sm">${community.Name.charAt(0)}</span>`;
                                  }
                                }}
                              />
                            ) : (
                              <span className="text-white font-bold text-sm">
                                {community.Name.charAt(0)}
                              </span>
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="font-medium text-foreground truncate">{community.Name}</div>
                            <div className="text-sm text-muted-foreground max-w-[250px] truncate">
                              {community.Description}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getCategoryColor(community.Category)}>
                          {community.Category}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 flex-wrap">
                          <Users className="h-4 w-4 text-muted-foreground shrink-0" />
                          <span className="font-medium">{community.Members.toLocaleString()}</span>
                          {community.socialStats?.source === 'live' && (
                            <span className="text-[10px] font-semibold uppercase text-emerald-600 dark:text-emerald-400">
                              Live
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          {community.Region || 'Global'}
                        </span>
                      </TableCell>
                      <TableCell>
                        {community.Website && (
                          <Button 
                            size="sm" 
                            variant="outline"
                            className="h-8 px-3"
                            onClick={() => window.open(community.Website, '_blank')}
                          >
                            <ExternalLink className="h-3 w-3 mr-1" />
                            Join
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-12">
              <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold text-muted-foreground mb-2">
                {searchQuery || selectedCategory !== "all" ? "No matching communities" : "No Communities Yet"}
              </h3>
              <p className="text-sm text-muted-foreground">
                {searchQuery || selectedCategory !== "all"
                  ? "Try adjusting your search or filter."
                  : "Communities will be listed here as they join the Pi Network ecosystem."}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
