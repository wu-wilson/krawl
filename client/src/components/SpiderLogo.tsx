import React from 'react';

interface SpiderLogoProps {
  /** Size in pixels */
  size?: number;
  /** Whether the spider is in crawling animation state */
  crawling?: boolean;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Animated SVG spider logo — Krawly's brand mascot
 * @param props - Logo configuration
 * @returns Animated spider SVG
 */
export const SpiderLogo = React.forwardRef<HTMLDivElement, SpiderLogoProps>(({
  size = 48,
  crawling = false,
  className = '',
}, ref) => {
  return (
    <div
      ref={ref}
      className={`spider-logo inline-flex items-center justify-center ${crawling ? 'crawling' : ''} ${className}`}
      style={{ width: size, height: size }}
    >
      <svg
        viewBox="0 0 100 100"
        width={size}
        height={size}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-label="Krawly spider logo"
        role="img"
      >
        {/* Legs - left side (3) */}
        <path className="spider-leg leg-1" d="M38 38 Q28 31 20 28" stroke="var(--brand)" strokeWidth="3.6" strokeLinecap="round" />
        <path className="spider-leg leg-2" d="M36 50 Q23 50 14 50" stroke="var(--brand)" strokeWidth="3.6" strokeLinecap="round" />
        <path className="spider-leg leg-3" d="M38 62 Q28 69 20 74" stroke="var(--brand)" strokeWidth="3.6" strokeLinecap="round" />

        {/* Legs - right side (3) */}
        <path className="spider-leg leg-4" d="M62 38 Q72 31 80 28" stroke="var(--brand)" strokeWidth="3.6" strokeLinecap="round" />
        <path className="spider-leg leg-5" d="M64 50 Q77 50 86 50" stroke="var(--brand)" strokeWidth="3.6" strokeLinecap="round" />
        <path className="spider-leg leg-6" d="M62 62 Q72 69 80 74" stroke="var(--brand)" strokeWidth="3.6" strokeLinecap="round" />

        {/* Body */}
        <circle className="spider-body" cx="50" cy="50" r="22" fill="var(--brand)" />

        {/* Eyes */}
        <circle cx="42.2" cy="45.5" r="7.8" fill="white" />
        <circle cx="57.8" cy="45.5" r="7.8" fill="white" />

        {/* Pupils */}
        <circle className="spider-pupil" cx="43.5" cy="43.9" r="3.6" fill="#1a1a2e" />
        <circle className="spider-pupil" cx="59" cy="43.9" r="3.6" fill="#1a1a2e" />

        {/* Eye shine */}
        <circle cx="45.5" cy="42.2" r="1.6" fill="white" opacity="0.9" />
        <circle cx="61" cy="42.2" r="1.6" fill="white" opacity="0.9" />
      </svg>
    </div>
  );
});

SpiderLogo.displayName = 'SpiderLogo';
