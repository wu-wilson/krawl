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
 * Animated SVG spider logo — Krawl's brand mascot
 * @param props - Logo configuration
 * @returns Animated spider SVG
 */
export const SpiderLogo: React.FC<SpiderLogoProps> = ({
  size = 48,
  crawling = false,
  className = '',
}) => {
  return (
    <div
      className={`spider-logo inline-flex items-center justify-center ${crawling ? 'crawling' : ''} ${className}`}
      style={{ width: size, height: size }}
    >
      <svg
        viewBox="0 0 100 100"
        width={size}
        height={size}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-label="Krawl spider logo"
        role="img"
      >
        {/* Legs - left side (3) */}
        <path className="spider-leg leg-1" d="M38 40 Q28 33 20 30" stroke="var(--brand)" strokeWidth="3.5" strokeLinecap="round" />
        <path className="spider-leg leg-2" d="M36 52 Q23 52 14 52" stroke="var(--brand)" strokeWidth="3.5" strokeLinecap="round" />
        <path className="spider-leg leg-3" d="M38 64 Q28 71 20 76" stroke="var(--brand)" strokeWidth="3.5" strokeLinecap="round" />

        {/* Legs - right side (3) */}
        <path className="spider-leg leg-4" d="M62 40 Q72 33 80 30" stroke="var(--brand)" strokeWidth="3.5" strokeLinecap="round" />
        <path className="spider-leg leg-5" d="M64 52 Q77 52 86 52" stroke="var(--brand)" strokeWidth="3.5" strokeLinecap="round" />
        <path className="spider-leg leg-6" d="M62 64 Q72 71 80 76" stroke="var(--brand)" strokeWidth="3.5" strokeLinecap="round" />

        {/* Body — rounder, chubbier */}
        <circle className="spider-body" cx="50" cy="52" r="22" fill="var(--brand)" />

        {/* Cheeks — subtle blush spots */}
        <circle cx="36" cy="56" r="5" fill="var(--brand)" opacity="0.3" />
        <circle cx="64" cy="56" r="5" fill="var(--brand)" opacity="0.3" />

        {/* Eyes — bigger for cuteness */}
        <circle cx="41" cy="47" r="7.5" fill="white" />
        <circle cx="59" cy="47" r="7.5" fill="white" />

        {/* Pupils — looking slightly up */}
        <circle className="spider-pupil" cx="42.5" cy="45" r="3.5" fill="#1a1a2e" />
        <circle className="spider-pupil" cx="60.5" cy="45" r="3.5" fill="#1a1a2e" />

        {/* Eye shine */}
        <circle cx="44" cy="43.5" r="1.5" fill="white" opacity="0.9" />
        <circle cx="62" cy="43.5" r="1.5" fill="white" opacity="0.9" />
      </svg>
    </div>
  );
};
