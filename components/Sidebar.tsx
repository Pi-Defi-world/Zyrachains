'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home, BarChart3, Activity, Users, Key, Book, Layers,
  Coins, Droplets, ArrowRightLeft, TrendingUp, Wallet,
  Globe, Calendar, Sparkles, Star, AlertTriangle,
  ShieldCheck, Zap, MessageSquare, User, ChevronLeft,
  ChevronRight, Menu, X, GripHorizontal, FileCode,
} from 'lucide-react';

interface NavGroup {
  label: string;
  icon: React.ReactNode;
  links: Array<{ href: string; label: string }>;
}

const navGroups: NavGroup[] = [
  {
    label: 'Home', icon: <Home className="h-4 w-4" />,
    links: [
      { href: '/', label: 'Dashboard' },
      { href: '/block', label: 'Block Explorer' },
    ],
  },
  {
    label: 'Blockchain', icon: <Layers className="h-4 w-4" />,
    links: [
      { href: '/Transaction-list', label: 'Transactions' },
      { href: '/operations', label: 'Operations' },
      { href: '/trades-history', label: 'Trades' },
      { href: '/contracts', label: 'Smart Contracts' },
      { href: '/accountStats', label: 'Network Stats' },
    ],
  },
  {
    label: 'Markets', icon: <TrendingUp className="h-4 w-4" />,
    links: [
      { href: '/assets', label: 'Assets' },
      { href: '/pool', label: 'Liquidity Pools' },
    ],
  },
  {
    label: 'Monitors', icon: <ShieldCheck className="h-4 w-4" />,
    links: [
      { href: '/pct-wallet-monitor', label: 'Core Team' },
      { href: '/cex-wallet-monitor', label: 'Exchange (CEX)' },
    ],
  },
  {
    label: 'Data & API', icon: <Zap className="h-4 w-4" />,
    links: [
      { href: '/api-dashboard', label: 'API Dashboard' },
      { href: '/oracle-api', label: 'Oracle API' },
      { href: '/api-documentation', label: 'API Docs' },
      { href: '/realtime-transactions', label: 'Real-time Feed' },
    ],
  },
  {
    label: 'Social', icon: <MessageSquare className="h-4 w-4" />,
    links: [
      { href: '/social', label: 'Social' },
    ],
  },
  {
    label: 'Account', icon: <User className="h-4 w-4" />,
    links: [
      { href: '/profile', label: 'Profile' },
      { href: '/contactUs', label: 'Contact' },
      { href: '/faq', label: 'FAQ' },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const [expanded, setExpanded] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [position, setPosition] = useState(() => ({ x: 16, y: 600 }));
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const dragRef = useRef<HTMLButtonElement>(null);

  const close = useCallback(() => setMobileOpen(false), []);

  // Load saved position on mount
  useEffect(() => {
    const saved = localStorage.getItem('sidebar-toggle-position');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (typeof parsed.x === 'number' && typeof parsed.y === 'number') {
          setPosition(parsed);
        }
      } catch { /* use default */ }
    } else {
      setPosition((prev) => ({ x: prev.x, y: window.innerHeight - 80 }));
    }
  }, []);

  // Save position when dragging ends
  const savePosition = (pos: { x: number; y: number }) => {
    setPosition(pos);
    localStorage.setItem('sidebar-toggle-position', JSON.stringify(pos));
  };

  const constrainPosition = (pos: { x: number; y: number }) => {
    const size = 48;
    const margin = 8;
    return {
      x: Math.max(margin, Math.min(pos.x, window.innerWidth - size - margin)),
      y: Math.max(margin, Math.min(pos.y, window.innerHeight - size - margin)),
    };
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (mobileOpen) return;
    setIsDragging(true);
    const rect = dragRef.current?.getBoundingClientRect();
    if (rect) {
      setDragOffset({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    }
    e.preventDefault();
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (mobileOpen) return;
    setIsDragging(true);
    const rect = dragRef.current?.getBoundingClientRect();
    const touch = e.touches[0];
    if (rect && touch) {
      setDragOffset({ x: touch.clientX - rect.left, y: touch.clientY - rect.top });
    }
    e.preventDefault();
  };

  const handleToggle = () => {
    if (!isDragging) {
      setMobileOpen((v) => !v);
    }
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      setPosition(constrainPosition({ x: e.clientX - dragOffset.x, y: e.clientY - dragOffset.y }));
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isDragging) return;
      const touch = e.touches[0];
      if (touch) {
        setPosition(constrainPosition({ x: touch.clientX - dragOffset.x, y: touch.clientY - dragOffset.y }));
      }
    };

    const handleDragEnd = () => {
      if (isDragging) {
        setIsDragging(false);
        savePosition(position);
      }
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('touchmove', handleTouchMove, { passive: false });
      document.addEventListener('mouseup', handleDragEnd);
      document.addEventListener('touchend', handleDragEnd);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('mouseup', handleDragEnd);
      document.removeEventListener('touchend', handleDragEnd);
    };
  }, [isDragging, dragOffset, position]);

  // Close on route change
  useEffect(() => { close(); }, [pathname, close]);

  // Close on Escape
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') close(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [close]);

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  const sidebar = (
    <aside className={`h-full flex flex-col bg-card/95 backdrop-blur-sm border-r border-border transition-all duration-300 ${expanded ? 'w-56' : 'w-14'}`}>
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-3 border-b border-border">
        {expanded && (
          <Link href="/" className="text-sm font-bold text-foreground whitespace-nowrap">
            Zyrachain
          </Link>
        )}
        <button
          onClick={() => setExpanded((v) => !v)}
          className="p-1 rounded-md hover:bg-secondary text-muted-foreground hover:text-foreground"
          title={expanded ? 'Collapse' : 'Expand'}
        >
          {expanded ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </button>
      </div>

      {/* Nav links */}
      <nav className="flex-1 overflow-y-auto py-2 px-2 space-y-1">
        {navGroups.map((g) => {
          const anyActive = g.links.some((l) => isActive(l.href));
          return (
            <div key={g.label} className="space-y-0.5">
              <div className={`flex items-center gap-2 px-2 py-1.5 text-[11px] font-semibold uppercase tracking-wider ${anyActive ? 'text-accent' : 'text-muted-foreground'}`}>
                {g.icon}
                {expanded && <span className="truncate">{g.label}</span>}
              </div>
              {g.links.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  onClick={close}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs transition-colors ${
                    isActive(l.href)
                      ? 'bg-accent/10 text-accent font-medium'
                      : 'text-muted-foreground hover:text-foreground hover:bg-secondary/40'
                  }`}
                >
                  <span className="w-1 h-1 rounded-full bg-current opacity-40 flex-shrink-0" />
                  {expanded && <span className="truncate">{l.label}</span>}
                </Link>
              ))}
            </div>
          );
        })}
      </nav>
    </aside>
  );

  return (
    <>
      {/* Mobile toggle - draggable */}
      <button
        ref={dragRef}
        onClick={handleToggle}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        className={`fixed z-[100] lg:hidden p-2.5 rounded-full bg-accent text-accent-foreground shadow-lg transition-transform duration-200 group border-2 border-accent-foreground/10 ${
          mobileOpen ? 'scale-110' : isDragging ? 'cursor-grabbing scale-110' : 'cursor-grab hover:scale-105'
        }`}
        style={{ left: position.x, top: position.y }}
      >
        {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        {!mobileOpen && (
          <div className="absolute -top-1 -right-1 w-4 h-4 bg-muted/80 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <GripHorizontal className="h-3 w-3 text-muted-foreground" />
          </div>
        )}
      </button>

      {/* Desktop: fixed inline */}
      <div className="hidden lg:block h-screen sticky top-0 z-40 flex-shrink-0">
        {sidebar}
      </div>

      {/* Mobile: slide-over */}
      {mobileOpen && (
        <div className="fixed inset-0 z-[110] lg:hidden">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={close} />
          <div className="absolute left-0 top-0 bottom-0 shadow-xl">
            {sidebar}
          </div>
        </div>
      )}
    </>
  );
}
