import React, { useCallback } from 'react';

import { useCrawlStore } from '../store/crawlStore';

import { DURATION } from '../utils/animations';

import type { FilterState } from '../store/crawlStore';

type StatusFilter = FilterState['statusFilter'];
type TypeFilter = FilterState['typeFilter'];

const STATUS_FILTERS: Array<{ value: StatusFilter; label: string }> = [
  { value: 'all', label: 'All' },
  { value: 'broken', label: 'Broken' },
  { value: 'redirects', label: 'Redirects' },
  { value: 'slow', label: 'Slow' },
];

const TYPE_FILTERS: Array<{ value: TypeFilter; label: string }> = [
  { value: 'all', label: 'All Types' },
  { value: 'pages', label: 'Pages' },
  { value: 'scripts', label: 'Scripts' },
  { value: 'styles', label: 'Styles' },
  { value: 'images', label: 'Images' },
];

/**
 * Horizontal filter bar with pill-shaped toggle buttons
 * @returns Filter bar with status and type filters
 */
export const FilterBar: React.FC = () => {
  const filter = useCrawlStore((s) => s.filter);
  const setFilter = useCrawlStore((s) => s.setFilter);

  const handleStatusFilter = useCallback((value: StatusFilter) => {
    setFilter({ statusFilter: value });
  }, [setFilter]);

  const handleTypeFilter = useCallback((value: TypeFilter) => {
    setFilter({ typeFilter: value });
  }, [setFilter]);

  return (
    <div className="flex items-center gap-4 px-4 sm:px-6 py-2.5 border-b border-border bg-bg-primary
      overflow-x-auto lg:overflow-x-visible scrollbar-hide">
      {/* Status filters */}
      <div className="flex items-center gap-1.5 flex-nowrap">
        {STATUS_FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => handleStatusFilter(f.value)}
            className={`px-3 py-1 text-xs font-medium rounded-full whitespace-nowrap
              transition-all ease-out
              focus:outline-none focus:ring-2 focus:ring-brand/50
              active:scale-[0.97]
              ${filter.statusFilter === f.value
                ? 'bg-brand-subtle text-brand'
                : 'text-text-secondary hover:text-text-primary hover:bg-surface-hover'
              }`}
            style={{ transitionDuration: `${DURATION.fast}ms` }}
            aria-pressed={filter.statusFilter === f.value}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="w-px h-5 bg-border-subtle flex-shrink-0" />

      {/* Type filters */}
      <div className="flex items-center gap-1.5 flex-nowrap">
        {TYPE_FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => handleTypeFilter(f.value)}
            className={`px-3 py-1 text-xs font-medium rounded-full whitespace-nowrap
              transition-all ease-out
              focus:outline-none focus:ring-2 focus:ring-brand/50
              active:scale-[0.97]
              ${filter.typeFilter === f.value
                ? 'bg-brand-subtle text-brand'
                : 'text-text-secondary hover:text-text-primary hover:bg-surface-hover'
              }`}
            style={{ transitionDuration: `${DURATION.fast}ms` }}
            aria-pressed={filter.typeFilter === f.value}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Slow threshold presets */}
      {filter.statusFilter === 'slow' && (
        <div className="flex items-center gap-1 ml-1 flex-shrink-0">
          <span className="text-xs text-text-tertiary mr-1">{'>'}</span>
          {[500, 1000, 2000, 5000].map((ms) => (
            <button
              key={ms}
              onClick={() => setFilter({ slowThreshold: ms })}
              className={`px-2 py-0.5 text-xs font-mono rounded-full whitespace-nowrap
                transition-all ease-out
                focus:outline-none focus:ring-2 focus:ring-brand/50
                active:scale-[0.97]
                ${filter.slowThreshold === ms
                  ? 'bg-brand-subtle text-brand'
                  : 'text-text-tertiary hover:text-text-primary hover:bg-surface-hover'
                }`}
              style={{ transitionDuration: `${DURATION.fast}ms` }}
            >
              {ms >= 1000 ? `${ms / 1000}s` : `${ms}ms`}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
