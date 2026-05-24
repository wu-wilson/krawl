import { useCallback, useRef } from 'react';

import { useCrawlStore } from '../store/crawlStore';

import { createCrawler } from '../engine/crawler';

import type { CrawlNode, CrawlEdge } from '../engine/types';

interface UseCrawlReturn {
  /** Start a crawl for the given URL. Tears down any in-flight crawl first, so it's safe to call repeatedly. */
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

  const crawlerRef = useRef<ReturnType<typeof createCrawler> | null>(null);
  const teardownRef = useRef<(() => void) | null>(null);

  const startCrawl = useCallback((url: string) => {
    // Tear down any in-flight crawler from a prior call so we never have two
    // running against the same store at once.
    teardownRef.current?.();
    teardownRef.current = null;

    resetCrawl();

    const proxyUrl = import.meta.env.VITE_PROXY_URL || 'http://localhost:3001';

    // `alive` gates every store write from this crawler. Teardown flips it
    // false so leftover async work (aborted fetches, queue cleanup) can't
    // poison the next crawler's nodes when URLs collide.
    let alive = true;

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
          if (alive) addNode(node);
        },
        onNodeUpdated: (id: string, updates: Partial<CrawlNode>) => {
          if (alive) updateNode(id, updates);
        },
        onEdgeDiscovered: (edge: CrawlEdge) => {
          if (alive) addEdge(edge);
        },
        onComplete: () => {
          if (alive) setStatus('complete');
        },
      }
    );

    crawlerRef.current = crawler;

    // Wire pause/resume/stop to store
    const unsub1 = useCrawlStore.subscribe((state, prev) => {
      if (state.status === 'paused' && prev.status === 'crawling') {
        crawler.pause();
      } else if (state.status === 'crawling' && prev.status === 'paused') {
        crawler.resume();
      } else if (state.status === 'complete' && prev.status !== 'complete') {
        crawler.stop();
      }
    });

    teardownRef.current = () => {
      alive = false;
      crawler.stop();
      unsub1();
    };

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
