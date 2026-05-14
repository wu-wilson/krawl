import React, { useState, useCallback } from 'react';

import { SpiderLogo } from './SpiderLogo';

import { useCrawlStore } from '../store/crawlStore';

import { compressState } from '../utils/sharing';
import { exportCsv, exportJson } from '../utils/export';
import { DURATION } from '../utils/animations';

interface NavbarProps {
  /** Current active view */
  view: 'graph' | 'report';
  /** Callback when view changes */
  onViewChange: (view: 'graph' | 'report') => void;
  /** Callback when logo is clicked to return home */
  onLogoClick?: () => void;
}

/**
 * Top navigation bar with logo, view switcher, and actions
 * @param props - Navbar configuration
 * @returns Navigation bar
 */
export const Navbar: React.FC<NavbarProps> = ({
  view,
  onViewChange,
  onLogoClick,
}) => {
  const status = useCrawlStore((s) => s.status);
  const nodes = useCrawlStore((s) => s.nodes);
  const edges = useCrawlStore((s) => s.edges);
  const startUrl = useCrawlStore((s) => s.startUrl);
  const getFilteredNodes = useCrawlStore((s) => s.getFilteredNodes);
  const getFilteredEdges = useCrawlStore((s) => s.getFilteredEdges);

  const [copied, setCopied] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [overflowOpen, setOverflowOpen] = useState(false);

  const isCrawling = status === 'crawling';
  const hasData = nodes.size > 0;

  const handleShare = useCallback(async () => {
    if (!hasData || !startUrl) return;
    const nodesArr = Array.from(nodes.values());
    const compressed = compressState(nodesArr, edges, startUrl, status);
    const search = window.location.search;
    const url = `${window.location.origin}${window.location.pathname}${search}#data=${compressed}`;

    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      const blob = new Blob([JSON.stringify({ nodes: nodesArr, edges, startUrl })], { type: 'application/json' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'krawl-results.json';
      a.click();
      URL.revokeObjectURL(a.href);
    }
  }, [hasData, nodes, edges, startUrl, status]);

  const handleExportCsv = useCallback(() => {
    exportCsv(getFilteredNodes(false));
    setExportOpen(false);
  }, [getFilteredNodes]);

  const handleExportJson = useCallback(() => {
    exportJson(getFilteredNodes(false), getFilteredEdges());
    setExportOpen(false);
  }, [getFilteredNodes, getFilteredEdges]);

  return (
    <nav className="flex items-center justify-between px-4 sm:px-6 h-14 border-b border-border bg-bg-primary z-50 relative">
      {/* Left: Logo + Wordmark */}
      <button
        onClick={onLogoClick}
        className="flex items-center gap-2.5 pl-1 pr-2 py-1 hover:opacity-80 transition-opacity duration-150
          focus:outline-none focus:ring-2 focus:ring-brand/50 rounded-lg"
        aria-label="Return to home"
      >
        <SpiderLogo size={36} crawling={isCrawling} />
        <span className="hidden sm:inline text-lg font-semibold text-text-primary tracking-tight select-none">
          Krawl
        </span>
      </button>

      {/* Right: View toggle + Actions */}
      <div className="flex items-center gap-1.5">
        {/* Desktop view switcher */}
        <div className="hidden md:flex items-center mr-1">
          <div className="flex bg-bg-secondary rounded-lg p-0.5 border border-border-subtle">
            {(['graph', 'report'] as const).map((v) => (
              <button
                key={v}
                onClick={() => onViewChange(v)}
                className={`relative px-4 py-1.5 text-xs font-medium rounded-md transition-all ease-out
                  focus:outline-none focus:ring-2 focus:ring-brand/50
                  ${view === v
                    ? 'text-brand bg-bg-primary'
                    : 'text-text-secondary hover:text-text-primary'
                  }`}
                style={{ transitionDuration: `${DURATION.fast}ms` }}
                aria-pressed={view === v}
              >
                {v === 'graph' ? 'Graph' : 'Report'}
              </button>
            ))}
          </div>
        </div>

        {/* Mobile view switcher */}
        <div className="flex md:hidden items-center mr-1">
          {(['graph', 'report'] as const).map((v) => (
            <button
              key={v}
              onClick={() => onViewChange(v)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ease-out
                focus:outline-none focus:ring-2 focus:ring-brand/50
                ${view === v
                  ? 'text-brand bg-bg-secondary'
                  : 'text-text-tertiary'
                }`}
              style={{ transitionDuration: `${DURATION.fast}ms` }}
            >
              {v === 'graph' ? 'Graph' : 'Report'}
            </button>
          ))}
        </div>

        {hasData && (
          <>
            {/* Divider between toggle and actions */}
            <div className="hidden sm:block w-px h-5 bg-border-subtle self-center" aria-hidden="true" />

            {/* Desktop: grouped Share + Export */}
            <div className="hidden sm:flex items-center gap-0.5">
              <button
                onClick={handleShare}
                disabled={!hasData}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-text-secondary
                  hover:text-text-primary hover:bg-surface-hover rounded-lg
                  transition-all duration-150 ease-out
                  focus:outline-none focus:ring-2 focus:ring-brand/50
                  disabled:opacity-50 active:scale-[0.97]"
                aria-label="Share crawl results"
              >
                {copied ? (
                  <svg className="w-4 h-4 text-status-healthy" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M15 8a3 3 0 10-2.977-2.63l-4.94 2.47a3 3 0 100 4.319l4.94 2.47a3 3 0 10.895-1.789l-4.94-2.47a3.027 3.027 0 000-.74l4.94-2.47C13.456 7.68 14.19 8 15 8z" />
                  </svg>
                )}
                <span>{copied ? 'Copied!' : 'Share'}</span>
              </button>

              <div className="relative">
                <button
                  onClick={() => setExportOpen(!exportOpen)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-text-secondary
                    hover:text-text-primary hover:bg-surface-hover rounded-lg
                    transition-all duration-150 ease-out
                    focus:outline-none focus:ring-2 focus:ring-brand/50
                    active:scale-[0.97]"
                  aria-label="Export results"
                  aria-expanded={exportOpen}
                >
                  <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                  <span>Export</span>
                </button>
                {exportOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setExportOpen(false)} />
                    <div className="absolute right-0 top-full mt-1 w-36 bg-bg-secondary border border-border
                      rounded-lg shadow-sm z-50 overflow-hidden animate-fade-in">
                      <button
                        onClick={handleExportCsv}
                        className="w-full text-left px-3 py-2 text-xs text-text-secondary
                          hover:text-text-primary hover:bg-surface-hover transition-colors duration-150"
                      >
                        Export CSV
                      </button>
                      <button
                        onClick={handleExportJson}
                        className="w-full text-left px-3 py-2 text-xs text-text-secondary
                          hover:text-text-primary hover:bg-surface-hover transition-colors duration-150"
                      >
                        Export JSON
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Mobile: overflow menu */}
            <div className="sm:hidden relative">
              <button
                onClick={() => setOverflowOpen(!overflowOpen)}
                className="flex items-center px-2 py-1.5 text-xs text-text-secondary
                  hover:text-text-primary hover:bg-surface-hover rounded-lg
                  transition-all duration-150 ease-out
                  focus:outline-none focus:ring-2 focus:ring-brand/50
                  active:scale-[0.97]"
                aria-label="More actions"
                aria-expanded={overflowOpen}
              >
                {copied ? (
                  <svg className="w-4 h-4 text-status-healthy" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M6 10a2 2 0 11-4 0 2 2 0 014 0zM12 10a2 2 0 11-4 0 2 2 0 014 0zM18 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                )}
              </button>
              {overflowOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setOverflowOpen(false)} />
                  <div className="absolute right-0 top-full mt-1 w-36 bg-bg-secondary border border-border
                    rounded-lg shadow-sm z-50 overflow-hidden animate-fade-in">
                    <button
                      onClick={() => { handleShare(); setOverflowOpen(false); }}
                      className="w-full text-left px-3 py-2 text-xs text-text-secondary
                        hover:text-text-primary hover:bg-surface-hover transition-colors duration-150"
                    >
                      Share
                    </button>
                    <button
                      onClick={() => { handleExportCsv(); setOverflowOpen(false); }}
                      className="w-full text-left px-3 py-2 text-xs text-text-secondary
                        hover:text-text-primary hover:bg-surface-hover transition-colors duration-150"
                    >
                      Export CSV
                    </button>
                    <button
                      onClick={() => { handleExportJson(); setOverflowOpen(false); }}
                      className="w-full text-left px-3 py-2 text-xs text-text-secondary
                        hover:text-text-primary hover:bg-surface-hover transition-colors duration-150"
                    >
                      Export JSON
                    </button>
                  </div>
                </>
              )}
            </div>
          </>
        )}

      </div>
    </nav>
  );
};
