import React, { useCallback } from 'react';

import { useCrawlStore } from '../../store/crawlStore';

import { exportCsv, exportJson } from '../../utils/export';

/**
 * CSV/JSON export buttons for the report view
 * @returns Export button group
 */
export const ReportExport: React.FC = () => {
  const nodes = useCrawlStore((s) => s.nodes);
  const edges = useCrawlStore((s) => s.edges);

  const handleCsv = useCallback(() => {
    exportCsv(Array.from(nodes.values()));
  }, [nodes]);

  const handleJson = useCallback(() => {
    exportJson(Array.from(nodes.values()), edges);
  }, [nodes, edges]);

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={handleCsv}
        className="px-3 py-1.5 text-xs font-medium text-text-secondary border border-border
          rounded-lg hover:bg-surface-hover hover:text-text-primary
          transition-all duration-150 ease-out
          focus:outline-none focus:ring-2 focus:ring-brand/50
          active:scale-[0.97]"
      >
        Export CSV
      </button>
      <button
        onClick={handleJson}
        className="px-3 py-1.5 text-xs font-medium text-text-secondary border border-border
          rounded-lg hover:bg-surface-hover hover:text-text-primary
          transition-all duration-150 ease-out
          focus:outline-none focus:ring-2 focus:ring-brand/50
          active:scale-[0.97]"
      >
        Export JSON
      </button>
    </div>
  );
};
