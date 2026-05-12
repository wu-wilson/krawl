import React, { useState, useMemo, useCallback } from 'react';

import { ReportExport } from './ReportExport';

import { STATUS_STYLES } from '../Graph/GraphNode';

import { useCrawlStore } from '../../store/crawlStore';

import { getDisplayUrl } from '../../engine/urlUtils';

type SortField = 'url' | 'status' | 'responseTime' | 'type' | 'depth';
type SortDir = 'asc' | 'desc';

interface ReportTableProps {
  /** Called when a node is selected — switches to graph view */
  onSelectNode: (view: 'graph') => void;
}

/**
 * Sortable, filterable URL table for the report view
 * @param props - Table configuration
 * @returns Report table or card list on mobile
 */
export const ReportTable: React.FC<ReportTableProps> = ({ onSelectNode }) => {
  const nodes = useCrawlStore((s) => s.nodes);
  const getFilteredNodes = useCrawlStore((s) => s.getFilteredNodes);
  const selectNode = useCrawlStore((s) => s.selectNode);
  const status = useCrawlStore((s) => s.status);

  const [sortField, setSortField] = useState<SortField>('url');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [search, setSearch] = useState('');

  const filteredNodes = getFilteredNodes(false);

  const sorted = useMemo(() => {
    let result = [...filteredNodes];

    // Search filter
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((n) => n.url.toLowerCase().includes(q));
    }

    // Sort
    result.sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case 'url':
          cmp = a.url.localeCompare(b.url);
          break;
        case 'status':
          cmp = (a.httpStatus || 0) - (b.httpStatus || 0);
          break;
        case 'responseTime':
          cmp = (a.responseTime || 0) - (b.responseTime || 0);
          break;
        case 'type':
          cmp = a.resourceType.localeCompare(b.resourceType);
          break;
        case 'depth':
          cmp = a.depth - b.depth;
          break;
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });

    return result;
  }, [filteredNodes, sortField, sortDir, search]);

  const handleSort = useCallback((field: SortField) => {
    if (sortField === field) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDir('asc');
    }
  }, [sortField]);

  const handleRowClick = useCallback((nodeId: string) => {
    selectNode(nodeId);
    onSelectNode('graph');
  }, [selectNode, onSelectNode]);

  if (nodes.size === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-text-tertiary">
        <p className="text-sm">
          {status === 'crawling' || status === 'paused'
            ? 'Crawling... results will appear here.'
            : 'No results yet.'}
        </p>
        {(status === 'crawling' || status === 'paused') && (
          <div className="mt-3 w-4 h-4 rounded-full bg-brand/30 animate-pulse" />
        )}
      </div>
    );
  }

  const SortIcon: React.FC<{ field: SortField }> = ({ field }) => {
    if (sortField !== field) return null;
    return (
      <svg className="w-3 h-3 text-brand inline ml-1" viewBox="0 0 20 20" fill="currentColor">
        {sortDir === 'asc' ? (
          <path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" />
        ) : (
          <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
        )}
      </svg>
    );
  };

  return (
    <div className="flex flex-col h-full">
      {/* Search + Export */}
      <div className="flex items-center justify-between gap-3 px-4 sm:px-6 py-3 border-b border-border">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search URLs..."
          className="flex-1 max-w-sm px-3 py-2 text-sm rounded-md bg-bg-secondary border border-border
            text-text-primary placeholder:text-text-tertiary
            focus:outline-none focus:ring-2 focus:ring-brand/50 focus:border-brand
            transition-all duration-150 ease-out"
        />
        <ReportExport />
      </div>

      {/* Desktop table */}
      <div className="hidden md:block flex-1 overflow-auto">
        <table className="w-full" role="table">
          <thead className="sticky top-0 bg-bg-secondary z-10">
            <tr className="border-b border-border">
              {([
                { field: 'url' as SortField, label: 'URL' },
                { field: 'status' as SortField, label: 'Status' },
                { field: 'responseTime' as SortField, label: 'Time' },
                { field: 'type' as SortField, label: 'Type' },
                { field: 'depth' as SortField, label: 'Depth' },
              ]).map(({ field, label }) => (
                <th
                  key={field}
                  scope="col"
                  className="px-4 py-2.5 text-left text-xs font-medium text-text-secondary cursor-pointer
                    hover:text-text-primary transition-colors duration-150 select-none"
                  onClick={() => handleSort(field)}
                >
                  {label}
                  <SortIcon field={field} />
                </th>
              ))}
              <th scope="col" className="px-4 py-2.5 text-left text-xs font-medium text-text-secondary">
                Links
              </th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((node, i) => {
              const style = STATUS_STYLES[node.status];
              return (
                <tr
                  key={node.id}
                  onClick={() => handleRowClick(node.id)}
                  className="border-b border-border-subtle hover:bg-surface-hover cursor-pointer
                    transition-colors duration-100"
                  style={{ animationDelay: `${Math.min(i * 20, 400)}ms` }}
                >
                  <td className="px-4 py-2.5 text-sm font-mono text-text-primary max-w-xs truncate">
                    {getDisplayUrl(node.url)}
                  </td>
                  <td className="px-4 py-2.5">
                    <span
                      className={`${style.bg} ${style.text} rounded-full px-2 py-0.5 text-xs font-mono`}
                      aria-label={`Status: ${node.httpStatus || ''} ${style.label}`}
                    >
                      {node.httpStatus || '—'} {style.label}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-sm font-mono text-text-secondary">
                    {node.responseTime !== null ? `${node.responseTime}ms` : '—'}
                  </td>
                  <td className="px-4 py-2.5">
                    <span className="bg-bg-tertiary text-text-secondary rounded-full px-2 py-0.5 text-xs">
                      {node.resourceType}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-sm font-mono text-text-secondary">
                    {node.depth}
                  </td>
                  <td className="px-4 py-2.5 text-sm font-mono text-text-secondary">
                    {node.inbound.length}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile card list */}
      <div className="md:hidden flex-1 overflow-auto px-4 py-3 space-y-2">
        {sorted.map((node) => {
          const style = STATUS_STYLES[node.status];
          return (
            <button
              key={node.id}
              onClick={() => handleRowClick(node.id)}
              className="w-full text-left p-3 rounded-lg border border-border bg-bg-secondary
                hover:bg-surface-hover transition-colors duration-150
                focus:outline-none focus:ring-2 focus:ring-brand/50"
            >
              <div className="flex items-start justify-between gap-2 mb-1.5">
                <span className="text-sm font-mono text-text-primary break-all leading-relaxed flex-1">
                  {getDisplayUrl(node.url)}
                </span>
                <span
                  className={`${style.bg} ${style.text} rounded-full px-2 py-0.5 text-xs font-mono flex-shrink-0`}
                >
                  {node.httpStatus || '—'}
                </span>
              </div>
              <div className="flex items-center gap-3 text-xs text-text-tertiary">
                {node.responseTime !== null && <span className="font-mono">{node.responseTime}ms</span>}
                <span>{node.resourceType}</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
