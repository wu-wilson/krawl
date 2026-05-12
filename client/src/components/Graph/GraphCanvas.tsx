import React from 'react';

import { useGraph } from '../../hooks/useGraph';

import { useCrawlStore } from '../../store/crawlStore';

/**
 * Main force-directed graph rendered on Canvas
 * @returns Canvas element with the crawl graph visualization
 */
export const GraphCanvas: React.FC = () => {
  const {
    canvasRef,
    hoveredNodeId,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleWheel,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
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
        className={`w-full h-full ${hoveredNodeId ? 'cursor-pointer' : 'cursor-grab'}`}
        role="img"
        aria-label={summaryLabel}
        tabIndex={0}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
        onClick={handleClick}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      />
      {nodes.size === 0 && status !== 'idle' && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="flex flex-col items-center gap-3">
            <div className="w-4 h-4 rounded-full bg-brand animate-pulse" />
            <span className="text-sm text-text-tertiary">Discovering...</span>
          </div>
        </div>
      )}
    </div>
  );
};
