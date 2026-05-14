import React, { useEffect, useRef, useState } from 'react';

import { DURATION } from '../../utils/animations';

interface StatCardProps {
  /** Label for the stat */
  label: React.ReactNode;
  /** Numeric value to display */
  value: number;
  /** Color class for the value */
  colorClass?: string;
  /** Optional suffix (e.g., "ms") */
  suffix?: string;
}

/**
 * Inline stat readout — number alongside a label, with an eased number roll-up
 * when the value changes. Designed for toolbar / floating HUD contexts.
 * @param props - Stat configuration
 * @returns Animated stat element
 */
export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  colorClass = 'text-text-primary',
  suffix = '',
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
    <div className="flex items-baseline gap-1 shrink-0 whitespace-nowrap">
      <span className={`text-sm font-semibold font-mono tabular-nums ${colorClass}`}>
        {displayValue}
        {suffix && <span className="text-[11px] text-text-tertiary ml-0.5">{suffix}</span>}
      </span>
      <span className="text-xs text-text-tertiary">{label}</span>
    </div>
  );
};
