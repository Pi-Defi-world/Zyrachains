'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { usePageMetadata } from '@/context/pagemetadataContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Users, Star, ArrowRight, MessageCircle, Globe } from 'lucide-react';

export default function DirectoryHubPage() {
  const { setHeading, setTitle, setDescription } = usePageMetadata();

  useEffect(() => {
    setHeading('Listing directory');
    setTitle('Listing directory | Zyrachain');
    setDescription('Paid Pi Network community and influencer listings with live social stats.');
  }, [setHeading, setTitle, setDescription]);

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10 max-w-7xl mx-auto">
      <div className="max-w-4xl mx-auto space-y-10">
        {/* Header */}
        <div className="text-center">
          <h1 className="font-heading text-3xl md:text-4xl font-bold text-foreground mb-3">
            Listing directory
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Communities and influencers submitted through Zyrachain listings. Stats load from X and Telegram when configured on the server.
          </p>
        </div>

        {/* Directory Cards */}
        <div className="grid sm:grid-cols-2 gap-6">
          <Link href="/directory/communities" className="group">
            <Card className="h-full bg-card/80 backdrop-blur-sm border border-border/50 hover:border-emerald-400/50 transition-all duration-200">
              <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                  <div className="rounded-full p-3 bg-emerald-100 dark:bg-emerald-900/20">
                    <Users className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                  </div>
                </div>
                <CardTitle className="flex items-center gap-2 text-xl font-heading">
                  Communities
                </CardTitle>
                <CardDescription className="text-sm">
                  Telegram member counts (when available) from your listing&apos;s public channel or group.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4 text-sm">
                  <span className="flex items-center gap-1.5 text-muted-foreground">
                    <MessageCircle className="h-4 w-4" />
                    Telegram stats
                  </span>
                  <span className="flex items-center gap-1.5 text-muted-foreground">
                    <Globe className="h-4 w-4" />
                    Global reach
                  </span>
                </div>
                <div className="mt-4 flex items-center gap-1 text-emerald-600 dark:text-emerald-400 text-sm font-medium group-hover:gap-2 transition-all">
                  Browse communities <ArrowRight className="h-4 w-4" />
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/directory/influencers" className="group">
            <Card className="h-full bg-card/80 backdrop-blur-sm border border-border/50 hover:border-purple-400/50 transition-all duration-200">
              <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                  <div className="rounded-full p-3 bg-purple-100 dark:bg-purple-900/20">
                    <Star className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                  </div>
                </div>
                <CardTitle className="flex items-center gap-2 text-xl font-heading">
                  Influencers
                </CardTitle>
                <CardDescription className="text-sm">
                  X (Twitter) follower counts from the handle saved on each influencer listing.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4 text-sm">
                  <span className="flex items-center gap-1.5 text-muted-foreground">
                    <Star className="h-4 w-4" />
                    Follower counts
                  </span>
                  <span className="flex items-center gap-1.5 text-muted-foreground">
                    <Users className="h-4 w-4" />
                    Social proof
                  </span>
                </div>
                <div className="mt-4 flex items-center gap-1 text-purple-600 dark:text-purple-400 text-sm font-medium group-hover:gap-2 transition-all">
                  Browse influencers <ArrowRight className="h-4 w-4" />
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Get Listed CTA */}
        <Card className="bg-gradient-to-r from-emerald-50 to-green-50 dark:from-emerald-950/20 dark:to-green-950/20 border-emerald-200 dark:border-emerald-800/30">
          <CardContent className="p-6 sm:p-8 text-center">
            <h2 className="font-heading text-xl sm:text-2xl font-bold text-foreground mb-2">
              Want to get listed?
            </h2>
            <p className="text-muted-foreground mb-4 max-w-lg mx-auto">
              Submit your community or influencer profile to appear in our directory with live social media stats.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <Link href="/community-listing">
                <span className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors">
                  <Users className="h-4 w-4" />
                  List Community
                </span>
              </Link>
              <Link href="/influencer-listing">
                <span className="inline-flex items-center gap-1.5 px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors">
                  <Star className="h-4 w-4" />
                  List Influencer
                </span>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
