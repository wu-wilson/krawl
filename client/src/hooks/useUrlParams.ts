import { useEffect, useRef } from 'react';

import { useCrawlStore } from '../store/crawlStore';

import type { FilterState } from '../store/crawlStore';

const VALID_STATUS: FilterState['statusFilter'][] = ['all', 'broken', 'redirects', 'slow'];
const VALID_TYPE: FilterState['typeFilter'][] = ['all', 'pages', 'scripts', 'styles', 'images'];
const VALID_VIEWS = ['graph', 'report'] as const;

/**
 * Sync filter state and view to URL search params (read on mount, write on change)
 * @param view - Current active view
 * @param setView - Callback to update the view
 */
export const useUrlParams = (
  view: 'graph' | 'report',
  setView: (v: 'graph' | 'report') => void,
): void => {
  const filter = useCrawlStore((s) => s.filter);
  const setFilter = useCrawlStore((s) => s.setFilter);
  const initialized = useRef(false);

  // Read params on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);

    const viewParam = params.get('view');
    if (viewParam && (VALID_VIEWS as readonly string[]).includes(viewParam)) {
      setView(viewParam as 'graph' | 'report');
    }

    const updates: Partial<FilterState> = {};

    const statusParam = params.get('status');
    if (statusParam && (VALID_STATUS as string[]).includes(statusParam)) {
      updates.statusFilter = statusParam as FilterState['statusFilter'];
    }

    const typeParam = params.get('type');
    if (typeParam && (VALID_TYPE as string[]).includes(typeParam)) {
      updates.typeFilter = typeParam as FilterState['typeFilter'];
    }

    const slowParam = params.get('slow');
    if (slowParam) {
      const ms = parseInt(slowParam, 10);
      if (!isNaN(ms) && ms > 0) {
        updates.slowThreshold = ms;
      }
    }

    if (Object.keys(updates).length > 0) {
      setFilter(updates);
    }

    initialized.current = true;
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Write params on change
  useEffect(() => {
    if (!initialized.current) return;

    const params = new URLSearchParams(window.location.search);

    if (view !== 'graph') {
      params.set('view', view);
    } else {
      params.delete('view');
    }

    if (filter.statusFilter !== 'all') {
      params.set('status', filter.statusFilter);
    } else {
      params.delete('status');
    }

    if (filter.typeFilter !== 'all') {
      params.set('type', filter.typeFilter);
    } else {
      params.delete('type');
    }

    if (filter.statusFilter === 'slow' && filter.slowThreshold !== 1000) {
      params.set('slow', String(filter.slowThreshold));
    } else {
      params.delete('slow');
    }

    const search = params.toString();
    const newUrl = search
      ? `${window.location.pathname}?${search}${window.location.hash}`
      : `${window.location.pathname}${window.location.hash}`;

    window.history.replaceState(null, '', newUrl);
  }, [view, filter]);
};
