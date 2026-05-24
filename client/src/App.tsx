import React, { useEffect, useCallback, useRef } from 'react';

import { LandingPage } from './components/Landing/LandingPage';
import { Navbar } from './components/Navbar';
import { StatusBar } from './components/StatusBar';
import { GraphCanvas } from './components/Graph/GraphCanvas';
import { ReportTable } from './components/Report/ReportTable';
import { NodeDetail } from './components/Sidebar/NodeDetail';

import { useCrawl } from './hooks/useCrawl';
import { useUrlParams } from './hooks/useUrlParams';
import { useCrawlStore, DEFAULT_FILTER } from './store/crawlStore';

/**
 * Root application component
 * @returns The main app layout
 */
export const App: React.FC = () => {
  const status = useCrawlStore((s) => s.status);
  const [view, setView] = React.useState<'graph' | 'report'>('graph');
  const [isTransitioning, setIsTransitioning] = React.useState(false);
  const [showLanding, setShowLanding] = React.useState(true);

  const resetCrawl = useCrawlStore((s) => s.resetCrawl);
  const stopCrawl = useCrawlStore((s) => s.stopCrawl);
  const setFilter = useCrawlStore((s) => s.setFilter);
  const { startCrawl } = useCrawl();

  useUrlParams(view, setView);

  // Auto-start crawl when a shared link with ?u= is opened.
  // Guard makes "run exactly once per mount" explicit even if `startCrawl` changes identity.
  const autoStartedRef = useRef(false);
  useEffect(() => {
    if (autoStartedRef.current) return;
    autoStartedRef.current = true;
    const params = new URLSearchParams(window.location.search);
    const seed = params.get('u');
    if (seed) {
      setShowLanding(false);
      startCrawl(seed);
    }
  }, [startCrawl]);

  const handleStartCrawl = useCallback((url: string) => {
    setIsTransitioning(true);
    setTimeout(() => {
      setShowLanding(false);
      startCrawl(url);
      const params = new URLSearchParams(window.location.search);
      params.set('u', url);
      window.history.replaceState(null, '', `${window.location.pathname}?${params.toString()}`);
      setTimeout(() => {
        setIsTransitioning(false);
      }, 300);
    }, 200);
  }, [startCrawl]);

  const handleViewChange = useCallback((newView: 'graph' | 'report') => {
    setView(newView);
  }, []);

  const handleLogoClick = useCallback(() => {
    stopCrawl();
    resetCrawl();
    setFilter(DEFAULT_FILTER);
    setShowLanding(true);
    setView('graph');
    window.history.replaceState(null, '', window.location.pathname);
  }, [stopCrawl, resetCrawl, setFilter]);

  if (showLanding && status === 'idle') {
    return (
      <LandingPage
        onStartCrawl={handleStartCrawl}
        isTransitioning={isTransitioning}
      />
    );
  }

  return (
    <div className="flex flex-col h-svh bg-bg-primary text-text-primary overflow-hidden">
      <Navbar
        view={view}
        onViewChange={handleViewChange}
        onLogoClick={handleLogoClick}
      />
      <div className="flex-1 relative overflow-hidden">
        <div
          className={`absolute inset-0 ${
            view === 'graph' ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
          }`}
        >
          <GraphCanvas />
        </div>
        <div
          className={`absolute inset-0 overflow-auto ${
            view === 'report' ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
          }`}
        >
          <ReportTable onSelectNode={handleViewChange} />
        </div>
        {/* Wrapped (not conditionally rendered) so NodeDetail's state survives view switches; display:none gives an instant hide with no animation. */}
        <div className={view === 'graph' ? undefined : 'hidden'} aria-hidden={view !== 'graph'}>
          <NodeDetail />
        </div>
      </div>
      <StatusBar />
    </div>
  );
};
