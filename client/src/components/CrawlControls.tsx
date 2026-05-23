import React from 'react';

import { useCrawlStore } from '../store/crawlStore';

/**
 * Pause/Stop crawl controls during an active crawl, with a "Complete" pill once the crawl finishes.
 * Renders nothing when idle.
 * @returns Crawl control buttons or status indicator
 */
export const CrawlControls: React.FC = () => {
  const status = useCrawlStore((s) => s.status);
  const pauseCrawl = useCrawlStore((s) => s.pauseCrawl);
  const resumeCrawl = useCrawlStore((s) => s.resumeCrawl);
  const stopCrawl = useCrawlStore((s) => s.stopCrawl);

  const isCrawling = status === 'crawling';
  const isPaused = status === 'paused';

  if (isCrawling || isPaused) {
    return (
      <div className="flex items-center gap-1.5">
        <button
          onClick={isPaused ? resumeCrawl : pauseCrawl}
          className="p-1.5 text-text-secondary border border-border
            rounded-lg hover:bg-surface-hover hover:text-text-primary
            transition-all duration-150 ease-out
            focus:outline-none focus:ring-2 focus:ring-brand/50
            active:scale-[0.97]"
          aria-label={isPaused ? 'Resume crawl' : 'Pause crawl'}
        >
          {isPaused ? (
            <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
            </svg>
          ) : (
            <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          )}
        </button>
        <button
          onClick={stopCrawl}
          className="p-1.5 text-status-broken border border-border
            rounded-lg hover:bg-status-broken/10 hover:border-status-broken/30
            transition-all duration-150 ease-out
            focus:outline-none focus:ring-2 focus:ring-brand/50
            active:scale-[0.97]"
          aria-label="Stop crawl"
        >
          <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z" clipRule="evenodd" />
          </svg>
        </button>
      </div>
    );
  }

  if (status === 'complete') {
    return (
      <span className="text-xs text-status-healthy font-medium px-2 py-1
        bg-status-healthy/10 rounded-full whitespace-nowrap">
        Complete
      </span>
    );
  }

  return null;
};
