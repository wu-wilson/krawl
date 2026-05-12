import React, { useEffect, useState, useRef } from 'react';

import { StatCard } from './StatCard';

import { useCrawlStore } from '../../store/crawlStore';

/**
 * Live crawl statistics bar with progress indicator
 * @returns Stats bar with live-updating counts
 */
export const StatsBar: React.FC = () => {
  const status = useCrawlStore((s) => s.status);
  const getStats = useCrawlStore((s) => s.getStats);
  const pauseCrawl = useCrawlStore((s) => s.pauseCrawl);
  const resumeCrawl = useCrawlStore((s) => s.resumeCrawl);
  const stopCrawl = useCrawlStore((s) => s.stopCrawl);

  const stats = getStats();
  const [elapsed, setElapsed] = useState(0);
  const startTime = useCrawlStore((s) => s.startTime);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (status === 'crawling' && startTime) {
      timerRef.current = setInterval(() => {
        setElapsed(Math.floor((Date.now() - startTime) / 1000));
      }, 1000);
    } else if (status !== 'crawling') {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [status, startTime]);

  const isCrawling = status === 'crawling';
  const isPaused = status === 'paused';

  return (
    <div className="border-b border-border bg-bg-primary" aria-live="polite">
      <div className="px-4 sm:px-6 py-1">
        <div className="flex items-center justify-between">
          {/* Stats + inline status on mobile */}
          <div className="flex items-center gap-0 overflow-x-auto scrollbar-hide">
            <StatCard label="Discovered" value={stats.total} />
            <StatCard label="Healthy" value={stats.healthy} colorClass="text-status-healthy" />
            <StatCard
              label={window.innerWidth < 640 ? '3xx' : 'Redirects'}
              value={stats.redirects}
              colorClass="text-status-redirect"
            />
            <StatCard label="Broken" value={stats.broken} colorClass="text-status-broken" />
            <StatCard
              label="Avg Time"
              value={Math.round(stats.avgResponseTime)}
              suffix="ms"
            />
            <StatCard
              label="Elapsed"
              value={elapsed}
              suffix=""
              mono
            />

            {/* Status pill inline in the scroll row on mobile */}
            <div className="shrink-0 px-2 sm:hidden">
              {(isCrawling || isPaused) && (
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
              )}
              {status === 'complete' && (
                <span className="text-xs text-status-healthy font-medium px-2 py-1
                  bg-status-healthy/10 rounded-full whitespace-nowrap">
                  Complete
                </span>
              )}
              {status === 'idle' && (
                <span className="text-xs text-text-tertiary font-medium px-2 py-1 whitespace-nowrap">
                  Discovering...
                </span>
              )}
            </div>
          </div>

          {/* Controls — desktop only */}
          <div className="hidden sm:flex items-center gap-2 ml-4">
            {(isCrawling || isPaused) && (
              <>
                <button
                  onClick={isPaused ? resumeCrawl : pauseCrawl}
                  className="px-3 py-1.5 text-sm text-text-secondary border border-border
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
                  className="px-3 py-1.5 text-sm text-status-broken border border-border
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
              </>
            )}
            {status === 'complete' && (
              <span className="text-xs text-status-healthy font-medium px-2 py-1
                bg-status-healthy/10 rounded-full">
                Complete
              </span>
            )}
            {status === 'idle' && (
              <span className="text-xs text-text-tertiary font-medium px-2 py-1">
                Discovering...
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
