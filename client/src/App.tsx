import React, { useEffect, useCallback } from 'react';

import { LandingPage } from './components/Landing/LandingPage';
import { Navbar } from './components/Navbar';
import { StatusBar } from './components/StatusBar';
import { GraphCanvas } from './components/Graph/GraphCanvas';
import { ReportTable } from './components/Report/ReportTable';
import { NodeDetail } from './components/Sidebar/NodeDetail';

import { useCrawl } from './hooks/useCrawl';
import { useUrlParams } from './hooks/useUrlParams';
import { useCrawlStore } from './store/crawlStore';

import { compressState, decompressState } from './utils/sharing';

import type { CrawlNode, CrawlEdge } from './engine/types';

/**
 * Root application component
 * @returns The main app layout
 */
export const App: React.FC = () => {
  const status = useCrawlStore((s) => s.status);
  const addNode = useCrawlStore((s) => s.addNode);
  const addEdge = useCrawlStore((s) => s.addEdge);
  const setStatus = useCrawlStore((s) => s.setStatus);
  const [view, setView] = React.useState<'graph' | 'report'>('graph');
  const [isTransitioning, setIsTransitioning] = React.useState(false);
  const [showLanding, setShowLanding] = React.useState(true);
  const [isSharedView, setIsSharedView] = React.useState(false);

  const resetCrawl = useCrawlStore((s) => s.resetCrawl);
  const stopCrawl = useCrawlStore((s) => s.stopCrawl);
  const { startCrawl } = useCrawl();

  useUrlParams(view, setView);

  const nodes = useCrawlStore((s) => s.nodes);
  const edges = useCrawlStore((s) => s.edges);
  const startUrl = useCrawlStore((s) => s.startUrl);

  // Write compressed data to hash when crawl completes
  useEffect(() => {
    if (status !== 'idle' && status !== 'crawling' && nodes.size > 0 && startUrl && !isSharedView) {
      const snapshotNodes = Array.from(nodes.values()).map((n) => {
        if (n.status === 'queued' || n.status === 'pending') {
          return { ...n, status: 'broken' as const, error: 'Crawl stopped' };
        }
        return n;
      });
      const compressed = compressState(snapshotNodes, edges, startUrl, status);
      const newHash = `#data=${compressed}`;
      window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}${newHash}`);
    }
  }, [status, nodes, edges, startUrl, isSharedView]);

  // Load shared data from hash on mount
  useEffect(() => {
    const hash = window.location.hash;
    if (hash.startsWith('#data=')) {
      const data = hash.slice(6);
      const result = decompressState(data);
      if (result) {
        result.nodes.forEach((node: CrawlNode) => {
          if (node.status === 'queued' || node.status === 'pending') {
            node.status = 'broken';
            node.error = 'Crawl stopped';
          }
          addNode(node);
        });
        result.edges.forEach((edge: CrawlEdge) => addEdge(edge));
        setStatus('complete');
        setIsSharedView(true);
        setShowLanding(false);
      }
    }
  }, [addNode, addEdge, setStatus]);

  const handleStartCrawl = useCallback((url: string) => {
    setIsTransitioning(true);
    setTimeout(() => {
      setShowLanding(false);
      startCrawl(url);
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
    setShowLanding(true);
    setIsSharedView(false);
    setView('graph');
    window.history.replaceState(null, '', window.location.pathname);
  }, [stopCrawl, resetCrawl]);

  if (showLanding && status === 'idle' && !isSharedView) {
    return (
      <LandingPage
        onStartCrawl={handleStartCrawl}
        isTransitioning={isTransitioning}
      />
    );
  }

  return (
    <div className="flex flex-col h-screen bg-bg-primary text-text-primary overflow-hidden">
      <Navbar
        view={view}
        onViewChange={handleViewChange}
        onLogoClick={handleLogoClick}
      />
      <div className="flex-1 relative overflow-hidden">
        <div
          className={`absolute inset-0 transition-opacity duration-200 ${
            view === 'graph' ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
          }`}
        >
          <GraphCanvas />
        </div>
        <div
          className={`absolute inset-0 transition-opacity duration-200 overflow-auto ${
            view === 'report' ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
          }`}
        >
          <ReportTable onSelectNode={handleViewChange} />
        </div>
        <NodeDetail />
      </div>
      <StatusBar />
    </div>
  );
};
