"use client";
import React, { useState } from 'react';
import Link from 'next/link';
import { useLanguage } from '@/context/languagecontext';
import { usePageMetadata } from '@/context/pagemetadataContext';
import { usePiNetwork } from '@/context/PiNetworkContext';
import DonationModal from '@/components/DonationModal';
import {
  Plug,
  Settings,
  FileText,
  BookOpen,
  ChevronRight,
  ChevronDown,
  Copy,
  MessageCircle,
  LogOut,
  Loader2,
  Users,
  Star,
  Calendar,
  Trophy,
  Rocket,
  List,
  Layers,
  ArrowLeftRight,
  Activity,
  Coins,
  Droplets,
  TrendingUp,
  Compass,
  Heart
} from 'lucide-react';

const ProfilePage: React.FC = () => {
  const { t } = useLanguage();
  const { setHeading, setTitle, setDescription } = usePageMetadata();
  const { user, isAuthenticated, logout, authenticate, isLoading } = usePiNetwork();
  const [showComingSoonModal, setShowComingSoonModal] = useState(false);
  const [showListingsDropdown, setShowListingsDropdown] = useState(false);
  const [showExplorerDropdown, setShowExplorerDropdown] = useState(false);
  const [showDonationModal, setShowDonationModal] = useState(false);

  React.useEffect(() => {
    setHeading('Profile');
    setTitle('Profile - Zyrachain');
    setDescription('Manage your profile and account settings');
  }, [setHeading, setTitle, setDescription]);

  const handleCopyPCMID = () => {
    navigator.clipboard.writeText('3326364256');
     
  };

  // Listing items grouped together
  const listingItems = [
    {
      title: 'General Listing',
      description: '',
      icon: Users,
      href: '/get-listed',
      color: 'bg-pink-500/10 text-pink-600',
      iconColor: 'text-pink-600'
    },
    {
      title: 'Update Listing',
      description: '',
      icon: Users,
      href: '/update-listing',
      color: 'bg-pink-500/10 text-pink-600',
      iconColor: 'text-pink-600'
    },
    {
      title: 'Business Listing',
      description: '',
      icon: Users,
      href: '/business-listing',
      color: 'bg-pink-500/10 text-pink-600',
      iconColor: 'text-pink-600'
    },
    {
      title: 'Startup Listing',
      description: '',
      icon: Rocket,
      href: '/startup-listing',
      color: 'bg-pink-500/10 text-pink-600',
      iconColor: 'text-pink-600'
    },
    {
      title: 'Community Listing',
      description: '',
      icon: Users,
      href: '/community-listing',
      color: 'bg-pink-500/10 text-pink-600',
      iconColor: 'text-pink-600'
    }
  ];

  const explorerMenuItems = [
    { title: 'Blocks', icon: Layers, href: '/block' },
    { title: 'Transactions', icon: ArrowLeftRight, href: '/Transaction-list' },
    { title: 'Operations', icon: Activity, href: '/operations' },
    { title: 'Assets', icon: Coins, href: '/assets' },
    { title: 'Liquidity Pools', icon: Droplets, href: '/pool' },
    { title: 'Trades', icon: TrendingUp, href: '/trades-history' },
  ];

  const profileMenuItems = [   
    {
      title: 'Hackathons',
      description: '',
      icon: Trophy,
      href: '/ecosystem/hackathons',
      showChevron: true
    },
    {
      title: 'Events',
      description: '',
      icon: Calendar,
      href: '/ecosystem/events',
      showChevron: true
    },
    {
      title: 'Communities',
      description: '',
      icon: Users,
      href: '/ecosystem/communities',
      showChevron: true
    },
    {
      title: 'Influencers',
      description: '',
      icon: Star,
      href: '/ecosystem/influencers',
      showChevron: true
    },
    {
      title: 'Terms of Service',
      description: ' ',
      icon: FileText,
      href: '/Termsofservice',
      showChevron: true
    },
    {
      title: 'Documentation',
      description: ' ',
      icon: FileText,
      href: '/doc',
      showChevron: true
    },
    {
      title: 'Privacy Policy',
      description: ' ',
      icon: FileText,
      href: '/Privacy-Policy',
      showChevron: true
    },
    {
      title: 'Report Scam Wallet',
      description: '',
      icon: FileText,
      href: '/Report-scam',
      showChevron: true
    },
    {
      title: 'API Documentation',
      description: 'Pi Network Oracle API docs',
      icon: BookOpen,
      href: '/api-documentation',
      showChevron: true
    },
    {
      title: 'Contact Us',
      description: ' ',
      icon: MessageCircle,
      href: '/contactUs',
      showChevron: true
    },
    {
      title: isAuthenticated ? 'Disconnect Pi Wallet' : 'Connect Pi Wallet',
      description: isAuthenticated ? 'Logout from your Pi account' : 'Connect to access exclusive features',
      icon: isAuthenticated ? LogOut : Plug,
      onClick: isAuthenticated ? logout : () => authenticate().catch(() => setShowComingSoonModal(true)),
      showChevron: false,
      disabled: isLoading
    },
  ];

  return (
    <div className="min-h-screen bg-background p-3 pb-20 sm:p-4 mobile-nav-safe">
      <div className="max-w-md mx-auto">
        <div className="mb-4 sm:mb-6">
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">Profile</h1>
        </div>

        {/* Profile Card */}
        <div className="bg-card rounded-xl sm:rounded-2xl p-4 sm:p-6 mb-4 sm:mb-6 shadow-sm border border-border/50">
          <div className="flex items-center space-x-3 sm:space-x-4">
            {/* Avatar */}
            <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center">
              {isLoading ? (
                <Loader2 className="h-6 w-6 sm:h-8 sm:w-8 text-white animate-spin" />
              ) : (
                <span className="text-white text-lg sm:text-xl font-bold">
                  {isAuthenticated && user?.username ? user.username.slice(0, 2).toUpperCase() : '👤'}
                </span>
              )}
            </div>
            
            {/* User Info */}
            <div className="flex-1 min-w-0">
              <div className="text-base sm:text-lg font-semibold text-foreground mb-1 truncate">
                {isLoading 
                  ? 'Authenticating...'
                  : isAuthenticated && user?.username 
                    ? `@${user.username}` 
                    : 'Connect Pi Wallet'
                }
              </div>
              {isAuthenticated && user?.wallet_address && !isLoading ? (
                <div className="flex items-center space-x-2 text-xs sm:text-sm text-muted-foreground">
                  <span className="truncate">Wallet: {user.wallet_address.slice(0, 8)}...{user.wallet_address.slice(-6)}</span>
                  <button 
                    onClick={() => navigator.clipboard.writeText(user.wallet_address!)}
                    className="p-1 hover:bg-muted rounded transition-colors flex-shrink-0"
                    aria-label="Copy wallet address"
                  >
                    <Copy className="h-3 w-3" />
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        </div>

        {/* Menu Items */}
        <div className="space-y-2 sm:space-y-3">
          {/* Listings Dropdown */}
          <div className="bg-card rounded-xl sm:rounded-2xl border border-border/30 shadow-sm overflow-hidden">
            <button
              onClick={() => setShowListingsDropdown(!showListingsDropdown)}
              className="w-full flex items-center justify-between p-4 sm:p-6 hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center space-x-3 sm:space-x-4 min-w-0 flex-1">
                <List className="h-5 w-5 sm:h-6 sm:w-6 text-pink-600 flex-shrink-0" />
                <div className="text-left min-w-0 flex-1">
                  <div className="font-semibold text-sm sm:text-base text-foreground truncate">Listings</div>
                  <div className="text-xs sm:text-sm text-muted-foreground mt-0.5 sm:mt-1">Manage your listings</div>
                </div>
              </div>
              {showListingsDropdown ? (
                <ChevronDown className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground flex-shrink-0 ml-2" />
              ) : (
                <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground flex-shrink-0 ml-2" />
              )}
            </button>
            
            {/* Dropdown Content */}
            {showListingsDropdown && (
              <div className="border-t border-border/30 bg-muted/20">
                {listingItems.map((item, index) => (
                  <Link
                    key={index}
                    href={item.href}
                    className="block w-full hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex items-center space-x-3 sm:space-x-4 p-3 sm:p-4 pl-8 sm:pl-12">
                      <item.icon className={`h-4 w-4 sm:h-5 sm:w-5 ${item.iconColor} flex-shrink-0`} />
                      <div className="text-left min-w-0 flex-1">
                        <div className="font-medium text-sm sm:text-base text-foreground truncate">{item.title}</div>
                        <div className="text-xs sm:text-sm text-muted-foreground mt-0.5">{item.description}</div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Explorer Dropdown */}
          <div className="bg-card rounded-xl sm:rounded-2xl border border-border/30 shadow-sm overflow-hidden">
            <button
              onClick={() => setShowExplorerDropdown(!showExplorerDropdown)}
              className="w-full flex items-center justify-between p-4 sm:p-6 hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center space-x-3 sm:space-x-4 min-w-0 flex-1">
                <Compass className="h-5 w-5 sm:h-6 sm:w-6 text-emerald-600 flex-shrink-0" />
                <div className="text-left min-w-0 flex-1">
                  <div className="font-semibold text-sm sm:text-base text-foreground truncate">Explorer</div>
                  <div className="text-xs sm:text-sm text-muted-foreground mt-0.5 sm:mt-1">Browse the Pi Network</div>
                </div>
              </div>
              {showExplorerDropdown ? (
                <ChevronDown className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground flex-shrink-0 ml-2" />
              ) : (
                <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground flex-shrink-0 ml-2" />
              )}
            </button>

            {showExplorerDropdown && (
              <div className="border-t border-border/30 bg-muted/20">
                {explorerMenuItems.map((item, index) => (
                  <Link
                    key={index}
                    href={item.href}
                    className="block w-full hover:bg-muted/30 transition-colors"
                    onClick={() => setShowExplorerDropdown(false)}
                  >
                    <div className="flex items-center space-x-3 sm:space-x-4 p-3 sm:p-4 pl-8 sm:pl-12">
                      <item.icon className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-600 flex-shrink-0" />
                      <div className="text-left min-w-0 flex-1">
                        <div className="font-medium text-sm sm:text-base text-foreground truncate">{item.title}</div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Donate Button */}
          <button
            onClick={() => setShowDonationModal(true)}
            className="w-full flex items-center space-x-3 sm:space-x-4 p-4 sm:p-6 bg-card rounded-xl sm:rounded-2xl hover:bg-muted/50 transition-colors border border-border/30 shadow-sm"
          >
            <Heart className="h-5 w-5 sm:h-6 sm:w-6 text-red-500 flex-shrink-0" />
            <div className="text-left min-w-0 flex-1">
              <div className="font-semibold text-sm sm:text-base text-foreground">Donate</div>
              <div className="text-xs sm:text-sm text-muted-foreground mt-0.5 sm:mt-1">Support Zyrachain with a Pi donation</div>
            </div>
            <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground flex-shrink-0 ml-2" />
          </button>

          {/* Other Menu Items */}
          {profileMenuItems.map((item, index) => (
            item.onClick ? (
              <button
                key={index}
                onClick={item.onClick}
                disabled={item.disabled}
                className="w-full flex items-center justify-between p-4 sm:p-6 bg-card rounded-xl sm:rounded-2xl hover:bg-muted/50 transition-colors border border-border/30 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="flex items-center space-x-3 sm:space-x-4 min-w-0 flex-1">
                  <item.icon className={`h-5 w-5 sm:h-6 sm:w-6 text-muted-foreground flex-shrink-0 ${isLoading && index === 0 ? 'animate-spin' : ''}`} />
                  <div className="text-left min-w-0 flex-1">
                    <div className="font-semibold text-sm sm:text-base text-foreground truncate">
                      {isLoading && index === 0 
                        ? (isAuthenticated ? 'Disconnecting...' : 'Connecting...') 
                        : item.title
                      }
                    </div>
                    <div className="text-xs sm:text-sm text-muted-foreground mt-0.5 sm:mt-1 line-clamp-2">{item.description}</div>
                  </div>
                </div>
                {item.showChevron && (
                  <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground flex-shrink-0 ml-2" />
                )}
              </button>
            ) : (
              <Link
                key={index}
                href={item.href || '#'}
                className="block w-full"
              >
                <div className="flex items-center justify-between p-4 sm:p-6 bg-card rounded-xl sm:rounded-2xl hover:bg-muted/50 transition-colors border border-border/30 shadow-sm">
                  <div className="flex items-center space-x-3 sm:space-x-4 min-w-0 flex-1">
                    <item.icon className="h-5 w-5 sm:h-6 sm:w-6 text-muted-foreground flex-shrink-0" />
                    <div className="text-left min-w-0 flex-1">
                      <div className="font-semibold text-sm sm:text-base text-foreground truncate">{item.title}</div>
                      <div className="text-xs sm:text-sm text-muted-foreground mt-0.5 sm:mt-1 line-clamp-2">{item.description}</div>
                    </div>
                  </div>
                  {item.showChevron && (
                    <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground flex-shrink-0 ml-2" />
                  )}
                </div>
              </Link>
            )
          ))}
        </div>
      </div>

      {/* Connect Modal */}
      {showComingSoonModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-card rounded-xl p-6 sm:p-8 max-w-sm w-full mx-4 shadow-xl text-center relative">
            <button 
              className="absolute top-3 right-3 sm:top-4 sm:right-4 text-muted-foreground hover:text-foreground p-1"
              onClick={() => setShowComingSoonModal(false)}
            >
              <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-x"><line x1="18" x2="6" y1="6" y2="18"/><line x1="6" x2="18" y1="6" y2="18"/></svg>
            </button>
            <div className="mb-4">
              <div className="bg-emerald-500/10 w-12 h-12 sm:w-16 sm:h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Plug className="h-6 w-6 sm:h-8 sm:w-8 text-emerald-500" />
              </div>
              <h2 className="text-lg sm:text-xl font-bold mb-2">Welcome to Clubhouse Pi!</h2>
              <h3 className="text-base sm:text-lg font-semibold text-emerald-500 mb-3">Pi Wallet Integration Coming Soon</h3>
            </div>
            <p className="text-muted-foreground mb-6 text-sm">
              You can explore the Pi Network blockchain explorer freely. We're working on Pi Wallet integration that will allow seamless authentication and transactions in the future.
            </p>
            <div className="space-y-3">
              <button 
                className="w-full px-4 py-2.5 sm:py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium text-sm sm:text-base"
                onClick={() => setShowComingSoonModal(false)}
              >
                Got it!
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Donation Modal */}
      <DonationModal
        isOpen={showDonationModal}
        onClose={() => setShowDonationModal(false)}
      />
    </div>
  );
};

export default ProfilePage;
