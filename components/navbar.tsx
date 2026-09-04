"use client";
import React, { useState, useRef, useEffect } from "react";
import Link from 'next/link';
import { FiX } from "react-icons/fi";
import { Menu, Plug, CheckCircle, ChevronDown } from "lucide-react";
import { usePiNetwork } from "@/context/PiNetworkContext";
import Logo from './logo';
import { ModeToggle } from '@/components/ui/mode-toggle';
import { GlobalSearch } from '@/components/GlobalSearch';

const Navbar: React.FC = () => {
  const { isAuthenticated, authenticate } = usePiNetwork();
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  return (
    <>
      <nav className="sticky top-0 z-50 bg-card/95 backdrop-blur-sm border-b border-border shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-18 justify-between gap-6">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-3 text-foreground font-bold text-lg hover:opacity-75 interactive-element flex-shrink-0">
              <Logo size="sm" showText={false} />
              <span className="hidden sm:inline">Zyrachain</span>
            </Link>

            {/* Global Search - Hidden on mobile */}
            <div className="hidden sm:block flex-1 max-w-md">
              <GlobalSearch />
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-12">
              <div className="flex items-center gap-10 text-sm font-medium">
                <Link href="/" className="text-foreground/70 hover:text-foreground interactive-element">Home</Link>
                <Link href="/block" className="text-foreground/70 hover:text-foreground interactive-element">Explorer</Link>
                <Link href="/contracts" className="text-foreground/70 hover:text-foreground interactive-element">Contracts</Link>
                <Link href="/pct-wallet-monitor" className="text-foreground/70 hover:text-foreground interactive-element">Monitors</Link>
                <Link href="/social" className="text-foreground/70 hover:text-foreground interactive-element">Social</Link>
                <Link href="/api-documentation" className="text-foreground/70 hover:text-foreground interactive-element">API</Link>
              </div>
              <div className="flex items-center gap-5">
                <ModeToggle />
                <Link href="/profile" className="p-2 rounded-lg hover:bg-secondary interactive-element text-foreground/70 hover:text-foreground">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </Link>
              </div>
            </div>

            <div className="flex items-center gap-3 md:hidden">
              <ModeToggle />
              <button
                onClick={() => setShowMobileMenu(!showMobileMenu)}
                className="p-2 rounded-lg text-foreground hover:bg-secondary interactive-element"
              >
                <Menu className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      {showMobileMenu && (
        <div className="fixed inset-0 z-[100] md:hidden">
          <div 
            className="absolute inset-0 bg-background/80 backdrop-blur-sm"
            onClick={() => setShowMobileMenu(false)}
          />
          
          <div className="absolute top-0 right-0 h-full w-64 max-w-[75vw] bg-card border-l border-border shadow-lg">
            <div className="flex flex-col h-full">
              <div className="flex items-center justify-between px-6 py-4 border-b border-border">
                <span className="font-bold text-foreground text-base">Menu</span>
                <button
                  onClick={() => setShowMobileMenu(false)}
                  className="p-1.5 rounded-lg hover:bg-secondary interactive-element text-foreground"
                >
                  <FiX className="h-5 w-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2">
                <Link href="/" className="block px-4 py-3 rounded-lg text-foreground/70 hover:text-foreground hover:bg-secondary interactive-element text-sm font-medium" onClick={() => setShowMobileMenu(false)}>
                  Home
                </Link>
                <Link href="/block" className="block px-4 py-3 rounded-lg text-foreground/70 hover:text-foreground hover:bg-secondary interactive-element text-sm font-medium" onClick={() => setShowMobileMenu(false)}>
                  Explorer
                </Link>
                <Link href="/pct-wallet-monitor" className="block px-4 py-3 rounded-lg text-foreground/70 hover:text-foreground hover:bg-secondary interactive-element text-sm font-medium" onClick={() => setShowMobileMenu(false)}>
                  Monitors
                </Link>
                <Link href="/social" className="block px-4 py-3 rounded-lg text-foreground/70 hover:text-foreground hover:bg-secondary interactive-element text-sm font-medium" onClick={() => setShowMobileMenu(false)}>
                  Social
                </Link>
                <Link href="/api-documentation" className="block px-4 py-3 rounded-lg text-foreground/70 hover:text-foreground hover:bg-secondary interactive-element text-sm font-medium" onClick={() => setShowMobileMenu(false)}>
                  API
                </Link>
                <Link href="/profile" className="block px-4 py-3 rounded-lg text-foreground/70 hover:text-foreground hover:bg-secondary interactive-element text-sm font-medium" onClick={() => setShowMobileMenu(false)}>
                  Profile
                </Link>

                <div className="pt-6 border-t border-border mt-6">
                  <button
                    onClick={async () => {
                      try { await authenticate(); } catch {}
                      setShowMobileMenu(false);
                    }}
                    className="w-full flex items-center justify-between px-4 py-3 rounded-lg bg-accent text-accent-foreground font-semibold text-sm hover:bg-accent/90 interactive-element"
                  >
                    <span className="flex items-center gap-2">
                      <Plug className="w-4 h-4" />
                      {isAuthenticated ? 'Connected' : 'Connect'}
                    </span>
                    {isAuthenticated && <CheckCircle className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

// Mobile Bottom Navigation Component
const MobileBottomNav: React.FC = () => {
  const { isAuthenticated, authenticate, logout } = usePiNetwork();
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  const handlePiConnect = async () => {
    try {
      if (isAuthenticated) {
        logout();
      } else {
        await authenticate();
      }
    } catch (error) {
      console.error('Pi authentication failed:', error);
    }
  };

  React.useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      if (currentScrollY < lastScrollY || currentScrollY < 100 || currentScrollY > document.body.scrollHeight - window.innerHeight - 100) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
      
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  return (
    <>
      {/* Mobile Bottom Navigation */}
      <div 
        className={`fixed bottom-0 left-0 right-0 z-50 lg:hidden transition-transform duration-300 ease-in-out ${
          isVisible ? 'translate-y-0' : 'translate-y-full'
        }`}
        style={{
          paddingBottom: 'env(safe-area-inset-bottom, 1rem)',
          paddingLeft: 'env(safe-area-inset-left, 1rem)',
          paddingRight: 'env(safe-area-inset-right, 1rem)'
        }}
      >
        <div className="relative max-w-sm mx-auto px-2">
          <div className="bg-card/95 backdrop-blur-md border border-border shadow-lg rounded-xl px-3 py-3">
            <div className="flex justify-around items-center gap-1">
              <Link href="/" className="flex flex-col items-center justify-center interactive-element px-3 py-2.5 rounded-lg text-foreground/70 hover:text-foreground hover:bg-secondary/50 flex-1">
                <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9.5L12 4l9 5.5V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
                <span className="text-[11px] mt-1 font-semibold">Home</span>
              </Link>
              <Link href="/block" className="flex flex-col items-center justify-center interactive-element px-3 py-2.5 rounded-lg text-foreground/70 hover:text-foreground hover:bg-secondary/50 flex-1">
                <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 2h18v18H3z"/></svg>
                <span className="text-[11px] mt-1 font-semibold">Explorer</span>
              </Link>
              <Link href="/social" className="flex flex-col items-center justify-center interactive-element px-3 py-2.5 rounded-lg text-foreground/70 hover:text-foreground hover:bg-secondary/50 flex-1">
                <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                <span className="text-[11px] mt-1 font-semibold">Social</span>
              </Link>
              <Link href="/profile" className="flex flex-col items-center justify-center interactive-element px-3 py-2.5 rounded-lg text-foreground/70 hover:text-foreground hover:bg-secondary/50 flex-1">
                <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                <span className="text-[11px] mt-1 font-semibold">Profile</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

// Combined component with both desktop and mobile navigation
const NavbarWithMobile: React.FC = () => {
  return (
    <>
      <Navbar />
      <MobileBottomNav />
    </>
  );
};

export default NavbarWithMobile; 
