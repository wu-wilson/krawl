import React, { useEffect, useRef, useState } from 'react';

import { SpiderLogo } from '../SpiderLogo';

interface SpiderEntryProps {
  /** Size of the spider in pixels */
  size?: number;
  /** External crawl trigger — e.g., when the URL input button is hovered */
  externallyCrawling?: boolean;
}

/** Max pupil offset in screen pixels — kept inside the white-eye radius */
const MAX_PUPIL_OFFSET = 2.0;
/** Cursor distance at which pupil tracking saturates */
const PUPIL_SATURATION_PX = 80;

/**
 * Spider at rest that tracks the cursor with its pupils. Hovering the
 * spider (or external trigger via `externallyCrawling`) puts the legs
 * into the faster crawl cycle.
 * @param props - Spider configuration
 * @returns Inline spider with cursor-reactive eyes
 */
export const SpiderEntry: React.FC<SpiderEntryProps> = ({
  size = 44,
  externallyCrawling = false,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hovered, setHovered] = useState(false);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = e.clientX - cx;
      const dy = e.clientY - cy;
      const dist = Math.hypot(dx, dy);
      if (dist === 0) return;
      const magnitude = Math.min(MAX_PUPIL_OFFSET, dist / PUPIL_SATURATION_PX);
      el.style.setProperty('--pupil-x', `${(dx / dist) * magnitude}px`);
      el.style.setProperty('--pupil-y', `${(dy / dist) * magnitude}px`);
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <div
      ref={containerRef}
      className="inline-flex"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <SpiderLogo size={size} crawling={hovered || externallyCrawling} />
    </div>
  );
};
