import React, { useEffect, useState, useRef } from 'react';

import { StatCard } from './Dashboard/StatCard';

import { useCrawlStore } from '../store/crawlStore';

/**
 * Live crawl statistics — Discovered, Healthy, Redirects, Broken, Avg, Elapsed.
 * Ticks the elapsed counter once per second during an active crawl.
 * @returns Row of animated stat readouts
 */
export const StatsSummary: React.FC = () => {
  const status = useCrawlStore((s) => s.status);
  const getStats = useCrawlStore((s) => s.getStats);
  const stats = getStats();
  const startTime = useCrawlStore((s) => s.startTime);

  const [elapsed, setElapsed] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (status === 'crawling' && startTime) {
      timerRef.current = setInterval(() => {
        setElapsed(Math.floor((Date.now() - startTime) / 1000));
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [status, startTime]);

  return (
    <div
      className="flex items-center gap-4 flex-nowrap"
      aria-live="polite"
    >
      <StatCard label="Discovered" value={stats.total} />
      <StatCard label="Healthy" value={stats.healthy} colorClass="text-status-healthy" />
      <StatCard
        label={
          <>
            <span className="sm:hidden">3xx</span>
            <span className="hidden sm:inline">Redirects</span>
          </>
        }
        value={stats.redirects}
        colorClass="text-status-redirect"
      />
      <StatCard label="Broken" value={stats.broken} colorClass="text-status-broken" />
      <StatCard
        label="Avg"
        value={Math.round(stats.avgResponseTime)}
        suffix="ms"
      />
      <StatCard
        label="Elapsed"
        value={elapsed}
        suffix="s"
      />
    </div>
  );
};
