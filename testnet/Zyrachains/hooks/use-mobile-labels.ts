import { useEffect, useState } from 'react';

const ABBREVIATIONS: Record<string, string> = {
  Price: 'P',
  Block: 'Blk',
  Circulating: 'Circ',
  Supply: 'Sup',
  Locked: 'Lock',
  TPS: 'TPS',
  'Market Cap': 'MCAP',
  'Price Change': 'Δ',
  'Market Cap Change': 'Δ',
  'Network Activity': 'Network',
  'Top Wallets': 'Wallets',
  'Recent Transactions': 'Txns',
  'Wallet Activity': 'Activity',
};

/**
 * Hook to get abbreviated labels for mobile and full labels for desktop
 * @param label - The full label text
 * @param isMobile - Whether to use abbreviated version (auto-detected if not provided)
 * @returns The appropriate label based on screen size
 */
export function useMobileLabel(label: string, isMobile?: boolean) {
  const [isSmallScreen, setIsSmallScreen] = useState(isMobile ?? false);

  useEffect(() => {
    if (isMobile !== undefined) return;

    const handleResize = () => {
      setIsSmallScreen(window.innerWidth < 640); // sm breakpoint
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isMobile]);

  const shouldAbbreviate = isMobile !== undefined ? isMobile : isSmallScreen;
  return shouldAbbreviate && ABBREVIATIONS[label] ? ABBREVIATIONS[label] : label;
}

/**
 * Get abbreviation for a label without hook (for non-component contexts)
 */
export function getAbbreviation(label: string, useFull = false): string {
  return useFull || !ABBREVIATIONS[label] ? label : ABBREVIATIONS[label];
}
