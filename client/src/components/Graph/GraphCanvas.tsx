import React from 'react';

import { FilterChips } from '../FilterChips';

import { useGraph } from '../../hooks/useGraph';

import { useCrawlStore } from '../../store/crawlStore';

/**
 * Force-directed graph rendered on Canvas, with a floating filter pill overlaid
 * on the top-left of the canvas. Live stats and crawl controls live in the
 * persistent bottom `StatusBar` — not here — so the canvas reads as the hero.
 * @returns Canvas + floating filter overlay
 */
export const GraphCanvas: React.FC = () => {
  const {
    canvasRef,
    hoveredNodeId,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    handleTouchCancel,
    handleClick,
  } = useGraph();

  const status = useCrawlStore((s) => s.status);
  const nodes = useCrawlStore((s) => s.nodes);
  const getStats = useCrawlStore((s) => s.getStats);
  const stats = getStats();

  const summaryLabel = nodes.size > 0
    ? `Site graph: ${stats.total} pages discovered, ${stats.broken} broken, ${stats.redirects} redirects`
    : 'Empty graph — waiting for crawl results';

  return (
    <div className="relative w-full h-full">
      <canvas
        ref={canvasRef as React.RefObject<HTMLCanvasElement>}
        className={`w-full h-full touch-none select-none [-webkit-touch-callout:none] ${hoveredNodeId ? 'cursor-pointer' : 'cursor-grab'}`}
        role="img"
        aria-label={summaryLabel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onClick={handleClick}
        onContextMenu={(e) => e.preventDefault()}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchCancel}
      />

      {/* Empty / discovering state */}
      {nodes.size === 0 && status !== 'idle' && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="flex flex-col items-center gap-3">
            <div className="w-4 h-4 rounded-full bg-brand animate-pulse" />
            <span className="text-sm text-text-tertiary">Discovering...</span>
          </div>
        </div>
      )}

      {/* Floating filter pill — top-left */}
      <div
        className="absolute top-3 left-3 sm:top-4 sm:left-4 z-20
          flex items-center px-3 py-2
          rounded-xl border border-border bg-bg-primary/60 backdrop-blur-md
          max-w-[calc(100%-1.5rem)] sm:max-w-[calc(100%-2rem)]
          overflow-x-auto scrollbar-hide"
      >
        <FilterChips />
      </div>
    </div>
  );
};
