'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Code, Zap, Database, Shield, Globe, Copy, CheckCircle, BookOpen, Users, MessageSquare, Github, TrendingUp, BarChart3, Search, Eye, Store, Users2, Calendar, Target, ArrowRight } from 'lucide-react';
import { usePageMetadata } from '@/context/pagemetadataContext';
import { useLanguage } from '@/context/languagecontext';
import { useEffect } from 'react';

export default function DocsPage() {
  const { setHeading, setTitle, setDescription } = usePageMetadata();
  const { t } = useLanguage();
  const [copiedCode, setCopiedCode] = useState('');

  useEffect(() => {
	    setHeading('Clubhouse Pi Documentation');
    setTitle('Documentation - Clubhouse Pi Ecosystem Hub');
    setDescription('Comprehensive documentation for Clubhouse Pi - your complete Pi Network ecosystem hub, tokenization platform, and community resource.');
  }, [setHeading, setTitle, setDescription]);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(id);
    setTimeout(() => setCopiedCode(''), 2000);
  };

  const CodeBlock = ({ code, language, id }: { code: string; language: string; id: string }) => (
    <div className="relative">
      <pre className="bg-slate-900 text-slate-100 p-4 rounded-lg overflow-x-auto text-sm">
        <code className={`language-${language}`}>
          {code}
        </code>
      </pre>
      <Button
        size="sm"
        variant="ghost"
        className="absolute top-2 right-2 h-8 w-8 p-0"
        onClick={() => copyToClipboard(code, id)}
      >
        {copiedCode === id ? (
          <CheckCircle className="h-4 w-4 text-green-500" />
        ) : (
          <Copy className="h-4 w-4" />
        )}
      </Button>
    </div>
  );

  const ServiceCard = ({ 
    icon: Icon, 
    title, 
    description, 
    features,
    color = "blue"
  }: {
    icon: any;
    title: string;
    description: string;
    features: string[];
    color?: string;
  }) => (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Icon className={`h-5 w-5 mr-2 text-${color}-500`} />
          {title}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2 text-sm text-muted-foreground">
          {features.map((feature, index) => (
            <li key={index}>• {feature}</li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-4">
            <BookOpen className="h-8 w-8 text-primary mr-3" />
            <h1 className="text-4xl font-bold text-foreground">Clubhouse Pi Documentation</h1>
          </div>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Your complete guide to Clubhouse Pi - the premier Pi Network ecosystem hub, tokenization platform, and community resource.
          </p>
          <div className="flex flex-wrap gap-2 justify-center">
            <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
              <Zap className="h-3 w-3 mr-1" />
              Real-time Data
            </Badge>
            <Badge variant="secondary" className="bg-green-500/10 text-green-600 border-green-500/20">
              <Database className="h-3 w-3 mr-1" />
              Ecosystem Hub
            </Badge>
            <Badge variant="secondary" className="bg-purple-500/10 text-purple-600 border-purple-500/20">
              <Shield className="h-3 w-3 mr-1" />
              Tokenization Platform
            </Badge>
          </div>
        </div>

        <Tabs defaultValue="overview" className="space-y-8">
          <TabsList className="flex flex-wrap sm:grid sm:w-full sm:grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="services">Services</TabsTrigger>
            <TabsTrigger value="features">Features</TabsTrigger>
            <TabsTrigger value="guides">Guides</TabsTrigger>
            <TabsTrigger value="support">Support</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <ServiceCard
                icon={BarChart3}
                title="Blockchain Explorer"
                description="Comprehensive Pi Network blockchain explorer with real-time transaction and block data"
                features={[
                  "Real-time transaction tracking",
                  "Block information and statistics", 
                  "Account balance monitoring",
                  "Network metrics and analytics"
                ]}
                color="blue"
              />

              <ServiceCard
                icon={Store}
                title="Ecosystem Directory"
                description="Complete directory of Pi Network projects, communities, and services"
                features={[
                  "DApp listings and reviews",
                  "Community directory",
                  "Business listings",
                  "Influencer profiles"
                ]}
                color="green"
              />
            </div>

            <Card>
              <CardHeader>
                <CardTitle>What is Clubhouse Pi?</CardTitle>
                <CardDescription>
                  Clubhouse Pi is more than just a blockchain explorer - it's a comprehensive ecosystem hub designed to serve the entire Pi Network community.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 border rounded-lg">
                    <div className="bg-emerald-500/10 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Eye className="h-6 w-6 text-emerald-600" />
                    </div>
                    <h3 className="font-semibold mb-2">Discover</h3>
                    <p className="text-sm text-muted-foreground">
                      Explore the Pi Network ecosystem with our comprehensive blockchain explorer and project directory
                    </p>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <div className="bg-green-500/10 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Users2 className="h-6 w-6 text-green-600" />
                    </div>
                    <h3 className="font-semibold mb-2">Connect</h3>
                    <p className="text-sm text-muted-foreground">
                      Connect with developers, businesses, and communities within the Pi Network ecosystem
                    </p>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <div className="bg-purple-500/10 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Target className="h-6 w-6 text-purple-600" />
                    </div>
                    <h3 className="font-semibold mb-2">Build</h3>
                    <p className="text-sm text-muted-foreground">
                      Access tools and resources to build and grow your Pi Network projects
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Services Tab */}
          <TabsContent value="services" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <ServiceCard
                icon={Search}
                title="Blockchain Explorer"
                description="Advanced blockchain explorer with comprehensive Pi Network data"
                features={[
                  "Transaction search and filtering",
                  "Block details and statistics",
                  "Account balance tracking",
                  "Network health monitoring"
                ]}
                color="blue"
              />

              <ServiceCard
                icon={Store}
                title="Project Directory"
                description="Curated directory of Pi Network projects and applications"
                features={[
                  "DApp listings and reviews",
                  "Project categorization",
                  "User ratings and feedback",
                  "Featured project spotlights"
                ]}
                color="green"
              />

              <ServiceCard
                icon={Users2}
                title="Community Hub"
                description="Connect with Pi Network communities and influencers"
                features={[
                  "Community listings",
                  "Influencer profiles",
                  "Event announcements",
                  "Community discussions"
                ]}
                color="purple"
              />

              <ServiceCard
                icon={TrendingUp}
                title="Analytics & Insights"
                description="Comprehensive analytics and market insights"
                features={[
                  "Network statistics",
                  "Price charts and trends",
                  "Trading volume analysis",
                  "Market sentiment tracking"
                ]}
                color="orange"
              />
            </div>

            {/* <Card>
              <CardHeader>
                <CardTitle>Tokenization Platform</CardTitle>
                <CardDescription>
                  Clubhouse Pi provides a complete tokenization platform for Pi Network assets and projects
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold mb-3">Asset Tokenization</h4>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li>• Create and manage digital tokens</li>
                      <li>• Token distribution and vesting</li>
                      <li>• Smart contract integration</li>
                      <li>• Compliance and regulatory tools</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-3">Project Funding</h4>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li>• Initial token offerings</li>
                      <li>• Crowdfunding campaigns</li>
                      <li>• Investor management</li>
                      <li>• Fund allocation tracking</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card> */}
          </TabsContent>

          {/* Features Tab */}
          <TabsContent value="features" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Zap className="h-5 w-5 mr-2 text-emerald-500" />
                    Real-time Data
                  </CardTitle>
                  <CardDescription>
                    Live blockchain data and network statistics
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>• Live transaction feed</li>
                    <li>• Real-time block updates</li>
                    <li>• Network performance metrics</li>
                    <li>• Price and volume tracking</li>
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Shield className="h-5 w-5 mr-2 text-green-500" />
                    Security & Privacy
                  </CardTitle>
                  <CardDescription>
                    Enterprise-grade security for your data and transactions
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>• End-to-end encryption</li>
                    <li>• Secure API access</li>
                    <li>• Privacy protection</li>
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Globe className="h-5 w-5 mr-2 text-purple-500" />
                    Global Access
                  </CardTitle>
                  <CardDescription>
                    Access Clubhouse Pi from anywhere in the world
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>• Multi-language support</li>
                    <li>• Global CDN</li>
                    <li>• Mobile-responsive design</li>
                    <li>• 24/7 availability</li>
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Users className="h-5 w-5 mr-2 text-orange-500" />
                    Community Features
                  </CardTitle>
                  <CardDescription>
                    Connect and collaborate with the Pi Network community
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>• Community forums</li>
                    <li>• Project discussions</li>
                    <li>• Event announcements</li>
                    <li>• Developer resources</li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Guides Tab */}
          <TabsContent value="guides" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Getting Started Guides</CardTitle>
                <CardDescription>
                  Step-by-step guides to help you get the most out of Clubhouse Pi
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h4 className="font-semibold">For Users</h4>
                    <div className="space-y-3">
                      <Button variant="outline" className="w-full justify-start" asChild>
                        <Link href="/ecosystem">
                          <Store className="h-4 w-4 mr-2" />
                          Finding Projects and Communities
                        </Link>
                      </Button>
                      <Button variant="outline" className="w-full justify-start" asChild>
                        <Link href="/stats">
                          <BarChart3 className="h-4 w-4 mr-2" />
                          Understanding Network Statistics
                        </Link>
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-semibold">For Developers</h4>
                    <div className="space-y-3">
                      <Button variant="outline" className="w-full justify-start" asChild>
                        <Link href="/build-on-pi">
                          <Code className="h-4 w-4 mr-2" />
                          Building on Pi Network
                        </Link>
                      </Button>
                      <Button variant="outline" className="w-full justify-start" asChild>
                        <Link href="/get-listed">
                          <Store className="h-4 w-4 mr-2" />
                          Getting Your Project Listed
                        </Link>
                      </Button>
                      <Button variant="outline" className="w-full justify-start" asChild>
                        <Link href="/docs">
                          <BookOpen className="h-4 w-4 mr-2" />
                          API Documentation
                        </Link>
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Advanced Features</CardTitle>
                <CardDescription>
                  Learn about advanced features and capabilities
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-semibold mb-2">Tokenization</h4>
                    <p className="text-sm text-muted-foreground mb-3">
                      Create and manage digital tokens for your projects
                    </p>
                    <Button size="sm" variant="outline" asChild>
                      <Link href="/tokenization">
                        Learn More <ArrowRight className="h-3 w-3 ml-1" />
                      </Link>
                    </Button>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-semibold mb-2">Analytics</h4>
                    <p className="text-sm text-muted-foreground mb-3">
                      Advanced analytics and reporting tools
                    </p>
                    <Button size="sm" variant="outline" asChild>
                      <Link href="/analytics">
                        Learn More <ArrowRight className="h-3 w-3 ml-1" />
                      </Link>
                    </Button>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-semibold mb-2">Community</h4>
                    <p className="text-sm text-muted-foreground mb-3">
                      Build and manage your community presence
                    </p>
                    <Button size="sm" variant="outline" asChild>
                      <Link href="/community">
                        Learn More <ArrowRight className="h-3 w-3 ml-1" />
                      </Link>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Support Tab */}
          <TabsContent value="support" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Support & Resources</CardTitle>
                <CardDescription>
                  Get help and find additional resources for using Clubhouse Pi
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <Users className="h-5 w-5 mr-2 text-emerald-500" />
                        Community Support
                      </CardTitle>
                      <CardDescription>
                        Connect with our community for help and discussions
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <Button variant="outline" className="w-full" asChild>
                          <Link href="https://github.com/clubhouse-pi" target="_blank" rel="noopener noreferrer">
                            <Github className="h-4 w-4 mr-2" />
                            GitHub
                          </Link>
                        </Button>
                        <Button variant="outline" className="w-full" asChild>
                          <Link href="/contactUs">
                            <MessageSquare className="h-4 w-4 mr-2" />
                            Contact Support
                          </Link>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <BookOpen className="h-5 w-5 mr-2 text-green-500" />
                        Documentation
                      </CardTitle>
                      <CardDescription>
                        Comprehensive guides and tutorials
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <Button variant="outline" className="w-full" asChild>
                          <Link href="/docs">
                            <BookOpen className="h-4 w-4 mr-2" />
                            Full Documentation
                          </Link>
                        </Button>
                        <Button variant="outline" className="w-full" asChild>
                          <Link href="/tutorials">
                            <Code className="h-4 w-4 mr-2" />
                            Tutorials
                          </Link>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <Calendar className="h-5 w-5 mr-2 text-purple-500" />
                        Events & Updates
                      </CardTitle>
                      <CardDescription>
                        Stay updated with latest news and events
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <Button variant="outline" className="w-full" asChild>
                          <Link href="/events">
                            <Calendar className="h-4 w-4 mr-2" />
                            Events
                          </Link>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
} 