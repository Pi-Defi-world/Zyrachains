"use client";
import { useEffect, useState } from "react";
import { usePageMetadata } from "@/context/pagemetadataContext";
import { useLanguage } from "@/context/languagecontext";
import apiClient from '@/lib/api-client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Users, Globe, ExternalLink, AlertTriangle, Star, UserCheck } from "lucide-react";

 
interface Influencer {
  _id: string;
  identifier: string;
  Name: string;
  Description: string;
  Followers: number;
  Platform: string;
  Website?: string;
  Logo?: string;
  Region?: string;
  Category?: string;
  Engagement?: string;
  createdAt?: string;
  updatedAt?: string;
  socialStats?: { source?: 'live' | 'stored'; twitterUsername?: string | null };
}

export default function InfluencersPage() {
  const [influencers, setInfluencers] = useState<Influencer[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const { setHeading, setTitle, setDescription } = usePageMetadata();
  const { t, language } = useLanguage();

  useEffect(() => {
    setHeading('Pi Network Influencers');
    setTitle('Pi Network Influencers | Top Pi Network Content Creators & Leaders');
    setDescription('Discover and follow the most influential Pi Network content creators, developers, and community leaders.');
  }, [setHeading, setTitle, setDescription, language]);

  useEffect(() => {
    loadInfluencersData();
  }, []);

  const loadInfluencersData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await apiClient.getInfluencers();
      
      if (data.success) {
        // Sort influencers by followers count (largest to smallest)
        const sortedInfluencers = (data.data || []).sort((a: Influencer, b: Influencer) => b.Followers - a.Followers);
        setInfluencers(sortedInfluencers);
      } else {
        throw new Error(data.message || 'Failed to load influencers data');
      }
      
    } catch (err) {
      console.error('Error loading influencers:', err);
      setError(`Failed to load influencers data: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setLoading(false);
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Official': return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-400';
      case 'Founder': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400';
      case 'Media': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'Community Leader': return 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400';
      case 'Regional Leader': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'Educator': return 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/20 dark:text-cyan-400';
      case 'Business Leader': return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
    }
  };

  const getEngagementColor = (engagement: string) => {
    switch (engagement) {
      case 'Very High': return 'text-green-600 bg-green-100 dark:bg-green-900/20 dark:text-green-400';
      case 'High': return 'text-emerald-600 bg-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400';
      case 'Medium': return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/20 dark:text-yellow-400';
      default: return 'text-gray-600 bg-gray-100 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  // Loading State
  if (loading) {
    return (
      <div className="white-zone">
        <div className="flex justify-center items-center py-12">
          <Spinner />
          <span className="ml-2 text-muted-foreground">Loading influencers...</span>
        </div>
      </div>
    );
  }

  // Error State
  if (error) {
    return (
      <div className="white-zone">
        <div className="max-w-2xl mx-auto">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-6 py-4 rounded-lg flex items-start">
            <AlertTriangle className="h-5 w-5 mr-3 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="font-semibold mb-1">Error Loading Influencers</h3>
              <p className="text-sm">{error}</p>
              <Button 
                variant="outline" 
                size="sm" 
                className="mt-3"
                onClick={loadInfluencersData}
              >
                Try Again
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const totalFollowers = influencers.reduce((sum, influencer) => sum + influencer.Followers, 0);
  const categories = [...new Set(influencers.map(c => c.Category))];
  const platforms = [...new Set(influencers.map(c => c.Platform))];

  return (
    <div className="white-zone">
      <div className="space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Pi Network Influencers
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Follow the most influential Pi Network content creators, developers, and community leaders shaping the ecosystem.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="bg-card/80 backdrop-blur-sm border border-border/50">
            <CardContent className="flex items-center p-6">
              <div className="rounded-full p-3 bg-emerald-100 dark:bg-emerald-900/20 mr-4">
                <Star size={24} className="text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <h6 className="text-muted-foreground text-sm mb-1">Total Influencers</h6>
                <h3 className="text-2xl font-bold text-foreground">{influencers.length}</h3>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-card/80 backdrop-blur-sm border border-border/50">
            <CardContent className="flex items-center p-6">
              <div className="rounded-full p-3 bg-green-100 dark:bg-green-900/20 mr-4">
                <Users size={24} className="text-green-600 dark:text-green-400" />
              </div>
              <div>
                <h6 className="text-muted-foreground text-sm mb-1">Total Followers</h6>
                <h3 className="text-2xl font-bold text-foreground">{totalFollowers.toLocaleString()}</h3>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-card/80 backdrop-blur-sm border border-border/50">
            <CardContent className="flex items-center p-6">
              <div className="rounded-full p-3 bg-purple-100 dark:bg-purple-900/20 mr-4">
                <UserCheck size={24} className="text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <h6 className="text-muted-foreground text-sm mb-1">Categories</h6>
                <h3 className="text-2xl font-bold text-foreground">{categories.length}</h3>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-card/80 backdrop-blur-sm border border-border/50">
            <CardContent className="flex items-center p-6">
              <div className="rounded-full p-3 bg-orange-100 dark:bg-orange-900/20 mr-4">
                <Globe size={24} className="text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <h6 className="text-muted-foreground text-sm mb-1">Platforms</h6>
                <h3 className="text-2xl font-bold text-foreground">{platforms.length}</h3>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Influencers Table */}
        <Card className="bg-card/80 backdrop-blur-sm border border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center text-xl">
              <Star className="h-6 w-6 mr-2" />
              Pi Network Influencers ({influencers.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {influencers.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[300px]">Influencer</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Platform</TableHead>
                      <TableHead>Followers</TableHead>
                      <TableHead>Engagement</TableHead>
                      <TableHead>Region</TableHead>
                      <TableHead className="w-[100px]">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {influencers.map((influencer) => (
                      <TableRow key={influencer._id} className="hover:bg-muted/50">
                        <TableCell>
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-emerald-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm overflow-hidden">
                              {influencer.Logo ? (
                                <img src={influencer.Logo} alt={influencer.Name} className="w-full h-full object-cover" />
                              ) : (
                                influencer.Name.charAt(0)
                              )}
                            </div>
                            <div>
                              <div className="font-medium text-foreground">{influencer.Name}</div>
                              <div className="text-sm text-muted-foreground max-w-[250px] truncate">
                                {influencer.Description}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={getCategoryColor(influencer.Category || 'Other')}>
                            {influencer.Category}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm font-medium">{influencer.Platform}</span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 flex-wrap">
                            <Users className="h-4 w-4 text-muted-foreground shrink-0" />
                            <span className="font-medium">{influencer.Followers.toLocaleString()}</span>
                            {influencer.socialStats?.source === 'live' && (
                              <span className="text-[10px] font-semibold uppercase text-emerald-600 dark:text-emerald-400">
                                Live
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={getEngagementColor(influencer.Engagement || 'Medium')}>
                            {influencer.Engagement}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-muted-foreground">
                            {influencer.Region || 'Global'}
                          </span>
                        </TableCell>
                        <TableCell>
                          {influencer.Website && (
                            <Button 
                              size="sm" 
                              variant="outline"
                              className="h-8 px-3"
                              onClick={() => window.open(influencer.Website, '_blank')}
                            >
                              <ExternalLink className="h-3 w-3 mr-1" />
                              Follow
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
                <Star className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold text-muted-foreground mb-2">No Influencers Yet</h3>
                <p className="text-muted-foreground">Influencers will be listed here as they join the Pi Network ecosystem.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 