import { useCallback, useRef } from 'react';

import { useCrawlStore } from '../store/crawlStore';

import { createCrawler } from '../engine/crawler';

import type { CrawlNode, CrawlEdge } from '../engine/types';

interface UseCrawlReturn {
  /** Start a crawl for the given URL */
  startCrawl: (url: string) => void;
}

/**
 * Hook to manage the crawl lifecycle — creates a crawler and wires it to the store
 * @returns Crawl control functions
 */
export const useCrawl = (): UseCrawlReturn => {
  const addNode = useCrawlStore((s) => s.addNode);
  const updateNode = useCrawlStore((s) => s.updateNode);
  const addEdge = useCrawlStore((s) => s.addEdge);
  const setStatus = useCrawlStore((s) => s.setStatus);
  const resetCrawl = useCrawlStore((s) => s.resetCrawl);
  const store = useCrawlStore;

  const crawlerRef = useRef<ReturnType<typeof createCrawler> | null>(null);

  const startCrawl = useCallback((url: string) => {
    resetCrawl();

    const proxyUrl = import.meta.env.VITE_PROXY_URL || 'http://localhost:3001';

    const crawler = createCrawler(
      {
        maxConcurrent: 6,
        maxDepth: 3,
        maxUrls: 200,
        batchDelay: 100,
      },
      proxyUrl,
      {
        onNodeDiscovered: (node: CrawlNode) => {
          addNode(node);
        },
        onNodeUpdated: (id: string, updates: Partial<CrawlNode>) => {
          updateNode(id, updates);
        },
        onEdgeDiscovered: (edge: CrawlEdge) => {
          addEdge(edge);
        },
        onError: (error: string) => {
          console.error('[Krawl]', error);
        },
        onComplete: () => {
          setStatus('complete');
        },
      }
    );

    crawlerRef.current = crawler;

    // Wire pause/resume/stop to store
    const unsub1 = store.subscribe((state, prev) => {
      if (state.status === 'paused' && prev.status === 'crawling') {
        crawler.pause();
      } else if (state.status === 'crawling' && prev.status === 'paused') {
        crawler.resume();
      } else if (state.status === 'complete' && prev.status !== 'complete') {
        crawler.stop();
      }
    });

    // Store the unsub for cleanup
    useCrawlStore.setState({
      stopCrawl: () => {
        crawler.stop();
        setStatus('complete');
        unsub1();
      },
    });

    setStatus('crawling');
    useCrawlStore.setState({ startUrl: url, startTime: Date.now() });
    crawler.start(url);
  }, [addNode, updateNode, addEdge, setStatus, resetCrawl]);

  return { startCrawl };
};
