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

const SLOW_PRESETS = [500, 1000, 2000, 5000] as const;

/**
 * Filter controls for crawl results: status pills, resource-type pills, an optional
 * slow-threshold preset row, and a search input. All values are read from and written
 * to the Zustand store, so this component is the only filter UI used by both the Graph
 * floating overlay and the Report toolbar.
 * @returns Row of filter chips and the search input
 */
export const FilterChips: React.FC = () => {
  const filter = useCrawlStore((s) => s.filter);
  const setFilter = useCrawlStore((s) => s.setFilter);

  const handleStatusFilter = useCallback((value: StatusFilter) => {
    setFilter({ statusFilter: value });
  }, [setFilter]);

  const handleTypeFilter = useCallback((value: TypeFilter) => {
    setFilter({ typeFilter: value });
  }, [setFilter]);

  const chipClass = (active: boolean): string =>
    `px-3 py-1 text-xs font-medium rounded-full whitespace-nowrap transition-all ease-out
      focus:outline-none focus:ring-2 focus:ring-brand/50 active:scale-[0.97]
      ${active
        ? 'bg-brand-subtle text-brand'
        : 'text-text-secondary hover:text-text-primary hover:bg-surface-hover'
      }`;

  return (
    <div className="flex items-center gap-4 flex-nowrap">
      {/* Status filters */}
      <div className="flex items-center gap-1.5 flex-nowrap">
        {STATUS_FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => handleStatusFilter(f.value)}
            className={chipClass(filter.statusFilter === f.value)}
            style={{ transitionDuration: `${DURATION.fast}ms` }}
            aria-pressed={filter.statusFilter === f.value}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="w-px h-5 bg-border-subtle flex-shrink-0" aria-hidden="true" />

      {/* Type filters */}
      <div className="flex items-center gap-1.5 flex-nowrap">
        {TYPE_FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => handleTypeFilter(f.value)}
            className={chipClass(filter.typeFilter === f.value)}
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
          {SLOW_PRESETS.map((ms) => (
            <button
              key={ms}
              onClick={() => setFilter({ slowThreshold: ms })}
              className={`px-2 py-0.5 text-xs font-mono rounded-full whitespace-nowrap
                transition-all ease-out focus:outline-none focus:ring-2 focus:ring-brand/50
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

      <div className="w-px h-5 bg-border-subtle flex-shrink-0" aria-hidden="true" />

      {/* Search input — universal across views */}
      <input
        type="text"
        value={filter.search}
        onChange={(e) => setFilter({ search: e.target.value })}
        placeholder="Search URLs..."
        className="ml-auto w-48 sm:w-64 flex-shrink-0 px-3 py-1.5 text-xs rounded-md
          bg-bg-secondary border border-border text-text-primary placeholder:text-text-tertiary
          focus:outline-none focus:ring-2 focus:ring-brand/50
          transition-all duration-150 ease-out"
        aria-label="Search URLs"
      />
    </div>
  );
};
