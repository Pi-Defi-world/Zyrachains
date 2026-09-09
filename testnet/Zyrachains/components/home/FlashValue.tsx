'use client';

import { useEffect, useRef, useState } from 'react';

interface FlashValueProps {
  value: string;
  /** Numeric value used to decide flash direction (up = green, down = red). */
  numeric?: number;
  className?: string;
}

/**
 * Renders a value that briefly flashes green/red whenever it changes,
 * CoinMarketCap-style. Direction is derived from `numeric` if provided.
 */
export function FlashValue({ value, numeric, className = '' }: FlashValueProps) {
  const [flash, setFlash] = useState<'up' | 'down' | null>(null);
  const prevValue = useRef(value);
  const prevNumeric = useRef(numeric);

  useEffect(() => {
    if (prevValue.current === value) return;

    let direction: 'up' | 'down' = 'up';
    if (numeric != null && prevNumeric.current != null) {
      direction = numeric >= prevNumeric.current ? 'up' : 'down';
    }
    setFlash(direction);
    prevValue.current = value;
    prevNumeric.current = numeric;

    const t = setTimeout(() => setFlash(null), 950);
    return () => clearTimeout(t);
  }, [value, numeric]);

  return (
    <span className={`${flash === 'up' ? 'flash-up' : flash === 'down' ? 'flash-down' : ''} ${className}`}>
      {value}
    </span>
  );
}
