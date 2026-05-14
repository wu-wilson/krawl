import React from 'react';

import { CrawlControls } from './CrawlControls';
import { FilteredCount } from './FilteredCount';
import { StatsSummary } from './StatsSummary';

/**
 * Persistent bottom status bar — live crawl stats on the left,
 * filtered/total count and pause/stop controls on the right.
 * Always rendered as part of the main app shell (i.e., past the landing page).
 * @returns Bottom status strip
 */
export const StatusBar: React.FC = () => {
  return (
    <div
      className="flex items-center gap-3 px-4 sm:px-6 h-11 border-t border-border bg-bg-primary
        overflow-x-auto scrollbar-hide"
    >
      <StatsSummary />
      <div className="ml-auto flex items-center gap-3 flex-shrink-0 pl-3">
        <FilteredCount />
        <CrawlControls />
      </div>
    </div>
  );
};
