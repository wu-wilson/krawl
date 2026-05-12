import React, { useEffect, useRef, useState } from 'react';

import { DURATION } from '../../utils/animations';

interface StatCardProps {
  /** Label for the stat */
  label: string;
  /** Numeric value to display */
  value: number;
  /** Color class for the value */
  colorClass?: string;
  /** Optional suffix (e.g., "ms") */
  suffix?: string;
  /** Whether to use monospace font */
  mono?: boolean;
}

/**
 * Individual stat display with animated number roll-up
 * @param props - Stat configuration
 * @returns Animated stat card
 */
export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  colorClass = 'text-text-primary',
  suffix = '',
  mono = true,
}) => {
  const [displayValue, setDisplayValue] = useState(value);
  const animRef = useRef<number | null>(null);
  const prevValue = useRef(value);

  useEffect(() => {
    const from = prevValue.current;
    const to = value;
    prevValue.current = value;

    if (from === to) return;

    const startTime = performance.now();
    const duration = DURATION.smooth;

    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(from + (to - from) * eased);
      setDisplayValue(current);

      if (progress < 1) {
        animRef.current = requestAnimationFrame(animate);
      }
    };

    animRef.current = requestAnimationFrame(animate);

    return () => {
      if (animRef.current) {
        cancelAnimationFrame(animRef.current);
      }
    };
  }, [value]);

  return (
    <div className="flex flex-col items-center gap-0.5 px-2.5 sm:px-3 py-1.5 sm:py-2 shrink-0">
      <span
        className={`text-base sm:text-lg font-semibold tabular-nums ${colorClass} ${mono ? 'font-mono' : ''}`}
      >
        {displayValue}
        {suffix && <span className="text-xs text-text-tertiary ml-0.5">{suffix}</span>}
      </span>
      <span className="text-[11px] sm:text-xs text-text-tertiary whitespace-nowrap">{label}</span>
    </div>
  );
};
