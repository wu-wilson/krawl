import React, { useState } from 'react';

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

/**
 * Landing page — logo, tagline, URL input, and example chips on a flat dark surface,
 * each row entering via a staggered CSS animation
 * @param props - Landing page configuration
 * @returns Full-screen landing page
 */
export const LandingPage: React.FC<LandingPageProps> = ({
  onStartCrawl,
  isTransitioning,
}) => {
  const [logoHovered, setLogoHovered] = useState(false);

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
          className="flex items-center gap-2.5 mb-4 animate-landing-item cursor-default"
          style={{ animationDelay: '0ms' }}
          onMouseEnter={() => setLogoHovered(true)}
          onMouseLeave={() => setLogoHovered(false)}
        >
          <SpiderLogo size={44} crawling={logoHovered} />
          <span className="text-2xl font-semibold text-text-primary tracking-tight">
            Krawl
          </span>
        </div>

        {/* Tagline */}
        <h1
          className="text-sm sm:text-base font-medium text-text-secondary tracking-tight text-center mb-8
            animate-landing-item"
          style={{ animationDelay: '150ms' }}
        >
          Map your site. Spot what's broken.
        </h1>

        {/* URL Input */}
        <div
          className="w-full animate-landing-item"
          style={{ animationDelay: '300ms' }}
        >
          <UrlInput onSubmit={onStartCrawl} large onButtonHover={setLogoHovered} />
        </div>

        {/* Example links */}
        <div
          className="flex flex-wrap items-center justify-center gap-1 mt-6
            animate-landing-item"
          style={{ animationDelay: '450ms' }}
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
