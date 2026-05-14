import React from 'react';

import { useCrawlStore } from '../store/crawlStore';

/**
 * Read-only display of the filtered vs total node count.
 * Renders nothing when no nodes have been discovered yet.
 * @returns Count text
 */
export const FilteredCount: React.FC = () => {
  const filter = useCrawlStore((s) => s.filter);
  const totalCount = useCrawlStore((s) => s.nodes.size);
  const filteredCount = useCrawlStore((s) => s.getFilteredNodes(false).length);

  const filterActive =
    filter.statusFilter !== 'all' ||
    filter.typeFilter !== 'all' ||
    filter.search.trim() !== '';

  if (totalCount === 0) return null;

  return (
    <span className="text-xs text-text-tertiary whitespace-nowrap tabular-nums flex-shrink-0">
      {filterActive
        ? `${filteredCount} of ${totalCount} shown`
        : `${totalCount} ${totalCount === 1 ? 'result' : 'results'}`}
    </span>
  );
};
