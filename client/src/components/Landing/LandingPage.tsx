import React, { useEffect, useRef, useState } from 'react';

import { SpiderLogo } from '../SpiderLogo';
import { UrlInput } from '../UrlInput';

interface LandingPageProps {
  /** Callback when a URL is submitted */
  onStartCrawl: (url: string) => void;
  /** Whether the page is transitioning out */
  isTransitioning: boolean;
}

const EXAMPLE_URLS = [
  { url: 'https://reqres.in', label: 'reqres.in' },
  { url: 'https://jsonplaceholder.typicode.com', label: 'jsonplaceholder.typicode.com' },
  { url: 'https://git-tower.com', label: 'git-tower.com' },
];

// One-shot guard for the entrance — flipped in `animation.onfinish` (not on mount) so
// strict-mode's double-mount in dev doesn't pre-suppress the visible playback. Page refresh resets.
let hasPlayedEntrance = false;

/**
 * Landing page — first mount plays the spider crawl + a synchronized fade-in for the rest;
 * return visits (via the Navbar logo) render the final state instantly.
 * @param props - Landing page configuration
 * @returns Full-screen landing page
 */
export const LandingPage: React.FC<LandingPageProps> = ({
  onStartCrawl,
  isTransitioning,
}) => {
  const [logoHovered, setLogoHovered] = useState(false);
  // `phase` flips on spider arrival (drives leg cadence); `shouldAnimate` is captured at mount
  // (gates the fade-in classes). Both derive from `hasPlayedEntrance` so return visits skip everything.
  const [phase, setPhase] = useState<'entering' | 'arrived'>(
    hasPlayedEntrance ? 'arrived' : 'entering',
  );
  const [shouldAnimate] = useState(() => !hasPlayedEntrance);
  const logoRef = useRef<HTMLDivElement>(null);

  // Spider entrance via WAAPI. Keyframes sampled at uniform *arc length* (not uniform `t`) for
  // constant linear speed; rotation = bezier tangent angle for direction-facing motion.
  useEffect(() => {
    const elem = logoRef.current;
    if (!elem) {
      setPhase('arrived');
      return;
    }

    if (hasPlayedEntrance || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setPhase('arrived');
      return;
    }

    // Two-segment cubic bezier — condensed 280px width, dramatic ±180px vertical swings,
    // ends with vertical-up tangent so the spider's auto-rotated body resolves to upright.
    const seg1 = { p0: [-280, -40], c1: [-210, 180], c2: [-125, -180], p3: [-55, 40] };
    const seg2 = { p0: [-55, 40], c1: [-20, 160], c2: [0, 110], p3: [0, 0] };

    const sampleAtParam = (animT: number) => {
      const inSeg2 = animT >= 0.5;
      const seg = inSeg2 ? seg2 : seg1;
      const t = inSeg2 ? (animT - 0.5) * 2 : animT * 2;
      const u = 1 - t;
      const x =
        u ** 3 * seg.p0[0] +
        3 * u ** 2 * t * seg.c1[0] +
        3 * u * t ** 2 * seg.c2[0] +
        t ** 3 * seg.p3[0];
      const y =
        u ** 3 * seg.p0[1] +
        3 * u ** 2 * t * seg.c1[1] +
        3 * u * t ** 2 * seg.c2[1] +
        t ** 3 * seg.p3[1];
      const dx =
        3 * u ** 2 * (seg.c1[0] - seg.p0[0]) +
        6 * u * t * (seg.c2[0] - seg.c1[0]) +
        3 * t ** 2 * (seg.p3[0] - seg.c2[0]);
      const dy =
        3 * u ** 2 * (seg.c1[1] - seg.p0[1]) +
        6 * u * t * (seg.c2[1] - seg.c1[1]) +
        3 * t ** 2 * (seg.p3[1] - seg.c2[1]);
      const rotation = (Math.atan2(dy, dx) * 180) / Math.PI + 90;
      return { x, y, rotation };
    };

    // Build a cumulative arc-length table by densely sampling the bezier.
    const RESOLUTION = 200;
    const arcTable: number[] = new Array(RESOLUTION + 1);
    arcTable[0] = 0;
    let prev = sampleAtParam(0);
    for (let i = 1; i <= RESOLUTION; i++) {
      const cur = sampleAtParam(i / RESOLUTION);
      arcTable[i] = arcTable[i - 1] + Math.hypot(cur.x - prev.x, cur.y - prev.y);
      prev = cur;
    }
    const totalLength = arcTable[RESOLUTION];

    // Given a fraction of total arc length, find the bezier parameter that lands there.
    const paramAtArcFraction = (frac: number): number => {
      const target = frac * totalLength;
      let lo = 0;
      let hi = RESOLUTION;
      while (lo < hi) {
        const mid = (lo + hi) >> 1;
        if (arcTable[mid] < target) lo = mid + 1;
        else hi = mid;
      }
      if (lo === 0) return 0;
      const t0 = (lo - 1) / RESOLUTION;
      const t1 = lo / RESOLUTION;
      const l0 = arcTable[lo - 1];
      const l1 = arcTable[lo];
      return l1 === l0 ? t1 : t0 + ((target - l0) / (l1 - l0)) * (t1 - t0);
    };

    // Skip the first 40% of the path's arc length — shorter wind-up, same per-pixel speed.
    const START_FRAC = 0.4;
    const SAMPLES = 60;
    const keyframes = Array.from({ length: SAMPLES + 1 }, (_, i) => {
      const progress = i / SAMPLES;
      const frac = START_FRAC + progress * (1 - START_FRAC);
      const { x, y, rotation } = sampleAtParam(paramAtArcFraction(frac));
      return {
        transform: `translate(${x}px, ${y}px) rotate(${rotation}deg)`,
        opacity: Math.min(progress * 4, 1).toString(),
      };
    });

    const animation = elem.animate(keyframes, {
      duration: 1500,
      easing: 'linear',
      fill: 'forwards',
    });

    animation.onfinish = () => {
      hasPlayedEntrance = true;
      setPhase('arrived');
    };

    return () => animation.cancel();
  }, []);

  const isCrawling = phase === 'entering' || logoHovered;

  return (
    <div
      className={`min-h-dvh flex flex-col items-center justify-center
        bg-bg-primary transition-opacity duration-200
        ${isTransitioning ? 'opacity-0' : 'opacity-100'}`}
    >
      {/* Content */}
      <div className="flex flex-col items-center px-6 sm:px-8 lg:px-10 max-w-lg w-full">
        {/* Logo + Wordmark */}
        <div
          className="flex items-center gap-2.5 mb-4 cursor-default"
          onMouseEnter={() => setLogoHovered(true)}
          onMouseLeave={() => setLogoHovered(false)}
        >
          <SpiderLogo
            ref={logoRef}
            size={44}
            crawling={isCrawling}
            className={phase === 'entering' ? 'opacity-0 crawling-fast' : ''}
          />
          <span
            className={`text-2xl font-semibold text-text-primary tracking-tight${shouldAnimate ? ' animate-landing-from-left' : ''}`}
            style={shouldAnimate ? { animationDelay: '1500ms' } : undefined}
          >
            Krawl
          </span>
        </div>

        {/* Tagline */}
        <h1
          className={`text-sm sm:text-base font-medium text-text-secondary tracking-tight text-center mb-8${shouldAnimate ? ' animate-landing-from-bottom' : ''}`}
          style={shouldAnimate ? { animationDelay: '1500ms' } : undefined}
        >
          Map your site. Spot what's broken.
        </h1>

        {/* URL Input */}
        <div
          className={`w-full${shouldAnimate ? ' animate-landing-from-bottom' : ''}`}
          style={shouldAnimate ? { animationDelay: '1500ms' } : undefined}
        >
          <UrlInput onSubmit={onStartCrawl} large onButtonHover={setLogoHovered} />
        </div>

        {/* Example links */}
        <div
          className={`flex flex-wrap items-center justify-center gap-1 mt-6${shouldAnimate ? ' animate-landing-from-bottom' : ''}`}
          style={shouldAnimate ? { animationDelay: '1500ms' } : undefined}
        >
          <span className="text-xs text-text-tertiary mr-1">Try</span>
          {EXAMPLE_URLS.map((item, i) => (
            <React.Fragment key={item.url}>
              <button
                onClick={() => onStartCrawl(item.url)}
                className="text-xs text-text-tertiary hover:text-brand
                  transition-colors duration-150 ease-out px-1.5 py-0.5 rounded
                  hover:bg-brand-subtle
                  focus:outline-none focus:ring-2 focus:ring-brand/50"
              >
                {item.label}
              </button>
              {i < EXAMPLE_URLS.length - 1 && (
                <span className="text-text-tertiary/40 text-xs">·</span>
              )}
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  );
};
