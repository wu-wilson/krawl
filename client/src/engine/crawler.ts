import { normalizeUrl, isSameDomain } from './urlUtils';
import { parseLinks } from './parser';

import type {
  CrawlConfig,
  CrawlNode,
  CrawlEdge,
  CrawlStatus,
  ProxyFetchResponse,
  ProxyHeadResponse,
  NodeStatus,
  ResourceType,
} from './types';

/** Callbacks emitted by the crawler during operation */
interface CrawlerCallbacks {
  /** Called when a new node is discovered */
  onNodeDiscovered: (node: CrawlNode) => void;
  /** Called when a node's data is updated (status, response, etc.) */
  onNodeUpdated: (id: string, updates: Partial<CrawlNode>) => void;
  /** Called when a new edge is discovered */
  onEdgeDiscovered: (edge: CrawlEdge) => void;
  /** Called when the crawl completes */
  onComplete: () => void;
}

interface CrawlerInstance {
  /** Begin crawling from the given URL */
  start: (url: string) => void;
  /** Pause the crawl */
  pause: () => void;
  /** Resume a paused crawl */
  resume: () => void;
  /** Stop the crawl completely */
  stop: () => void;
  /** Get current crawl status */
  getStatus: () => CrawlStatus;
}

/**
 * Create a queue-based crawl engine
 * @param config - Crawl configuration (concurrency, depth, limits)
 * @param proxyBaseUrl - Base URL of the CORS proxy server
 * @param callbacks - Callbacks for real-time updates
 * @returns Crawler instance with start/pause/resume/stop controls
 */
export const createCrawler = (
  config: CrawlConfig,
  proxyBaseUrl: string,
  callbacks: CrawlerCallbacks
): CrawlerInstance => {
  let status: CrawlStatus = 'idle';
  const visited = new Set<string>();
  const queue: Array<{ url: string; depth: number; resourceType: ResourceType }> = [];
  let totalDiscovered = 0;
  let abortController = new AbortController();
  let pausePromise: { resolve: () => void } | null = null;

  /** Per-request timeout — matches the proxy's 10s timeout */
  const REQUEST_TIMEOUT = 10000;

  const classifyStatus = (httpStatus: number): NodeStatus => {
    if (httpStatus >= 200 && httpStatus < 300) return 'healthy';
    if (httpStatus >= 300 && httpStatus < 400) return 'redirect';
    return 'broken';
  };

  const fetchViaProxy = async (url: string, headOnly: boolean): Promise<ProxyFetchResponse | ProxyHeadResponse> => {
    const endpoint = headOnly ? 'head' : 'fetch';
    const proxyUrl = `${proxyBaseUrl}/${endpoint}?url=${encodeURIComponent(url)}`;

    const timeoutController = new AbortController();
    const timeoutId = setTimeout(() => timeoutController.abort(), REQUEST_TIMEOUT);

    const onCrawlAbort = () => timeoutController.abort();
    abortController.signal.addEventListener('abort', onCrawlAbort);

    try {
      const response = await fetch(proxyUrl, { signal: timeoutController.signal });
      const data = await response.json();
      return data;
    } catch (err: unknown) {
      if (abortController.signal.aborted) {
        throw new DOMException('Crawl aborted', 'AbortError');
      }

      return {
        status: 0,
        headers: {},
        responseTime: 0,
        body: null,
        finalUrl: null,
        error: err instanceof Error ? err.message : 'Request timed out',
      };
    } finally {
      clearTimeout(timeoutId);
      abortController.signal.removeEventListener('abort', onCrawlAbort);
    }
  };

  const processUrl = async (
    url: string,
    depth: number,
    resourceType: ResourceType,
    baseUrl: string
  ): Promise<void> => {
    const id = normalizeUrl(url);
    const isInternal = isSameDomain(url, baseUrl);
    const isPage = resourceType === 'page';
    const shouldFetchBody = isInternal && isPage && depth < config.maxDepth;

    // Update node to pending
    callbacks.onNodeUpdated(id, { status: 'pending' });

    try {
      const response = await fetchViaProxy(url, !shouldFetchBody);

      const normalizedFinal = response.finalUrl ? normalizeUrl(response.finalUrl) : null;
      const wasRedirected = normalizedFinal !== null && normalizedFinal !== id;

      const nodeUpdates: Partial<CrawlNode> = {
        status: response.status === 0 ? 'broken' : classifyStatus(response.status),
        httpStatus: response.status,
        responseTime: response.responseTime,
        headers: response.headers,
        contentType: response.headers?.['content-type'] || null,
        error: response.error || null,
      };

      // Track redirect chain — status is based on final HTTP code
      if (wasRedirected) {
        nodeUpdates.redirectChain = [url, response.finalUrl!];
      }

      callbacks.onNodeUpdated(id, nodeUpdates);

      // Parse links from body if applicable
      if (shouldFetchBody && 'body' in response && response.body) {
        const contentType = response.headers?.['content-type'] || '';
        if (contentType.includes('text/html')) {
          const links = parseLinks(response.body, response.finalUrl || url);

          // Update outbound links
          const outbound = links.map((l) => l.url);
          callbacks.onNodeUpdated(id, { outbound });

          // Discover new nodes — add to store immediately so updates aren't dropped.
          // The graph's enterTime-based animation provides the visual stagger.
          for (const link of links) {
            if (visited.has(link.url)) {
              // Still add edge for existing nodes
              callbacks.onEdgeDiscovered({ source: id, target: link.url, sourceElement: link.element });
              continue;
            }

            if (totalDiscovered >= config.maxUrls) break;

            visited.add(link.url);
            totalDiscovered++;

            const newNode: CrawlNode = {
              id: link.url,
              url: link.url,
              status: 'queued',
              httpStatus: null,
              responseTime: null,
              contentType: null,
              resourceType: link.resourceType,
              depth: depth + 1,
              inbound: [id],
              outbound: [],
              redirectChain: [],
              error: null,
              headers: null,
              parentId: id,
            };

            callbacks.onNodeDiscovered(newNode);
            callbacks.onEdgeDiscovered({ source: id, target: link.url, sourceElement: link.element });

            queue.push({
              url: link.url,
              depth: depth + 1,
              resourceType: link.resourceType,
            });
          }
        }
      }
    } catch (err: unknown) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        // Crawl was stopped — mark node so it doesn't stay 'pending'
        callbacks.onNodeUpdated(id, {
          status: 'broken',
          httpStatus: 0,
          error: 'Crawl stopped',
        });
        return;
      }

      callbacks.onNodeUpdated(id, {
        status: 'broken',
        httpStatus: 0,
        error: err instanceof Error ? err.message : 'Unknown error',
      });
    }
  };

  const processQueue = async (baseUrl: string): Promise<void> => {
    const inFlight = new Set<Promise<void>>();

    while ((queue.length > 0 || inFlight.size > 0) && status !== 'complete') {
      // Check for pause
      if (status === 'paused') {
        await new Promise<void>((resolve) => {
          pausePromise = { resolve };
        });
        pausePromise = null;
        if (status as CrawlStatus === 'complete') break;
      }

      // Fill up concurrent slots
      while (queue.length > 0 && inFlight.size < config.maxConcurrent && status === 'crawling') {
        const item = queue.shift()!;

        const task = processUrl(item.url, item.depth, item.resourceType, baseUrl)
          .finally(() => {
            inFlight.delete(task);
          });
        inFlight.add(task);
      }

      if (inFlight.size > 0) {
        // Wait for at least one request to finish, or the batch delay, whichever comes first
        await Promise.race([
          Promise.race(inFlight).catch(() => {}),
          new Promise((resolve) => setTimeout(resolve, config.batchDelay)),
        ]);
      } else {
        // Nothing in flight and queue is empty — we're done
        break;
      }
    }

    // Mark any leftover queued items (e.g., when the crawl was stopped)
    for (const item of queue) {
      const id = normalizeUrl(item.url);
      callbacks.onNodeUpdated(id, {
        status: 'broken',
        httpStatus: 0,
        error: 'Crawl stopped',
      });
    }
    queue.length = 0;

    if (status === 'crawling' || status === 'paused') {
      callbacks.onComplete();
    }
  };

  return {
    start(url: string) {
      status = 'crawling';
      abortController = new AbortController();
      const normalized = normalizeUrl(url);
      visited.add(normalized);
      totalDiscovered = 1;

      const rootNode: CrawlNode = {
        id: normalized,
        url,
        status: 'queued',
        httpStatus: null,
        responseTime: null,
        contentType: null,
        resourceType: 'page',
        depth: 0,
        inbound: [],
        outbound: [],
        redirectChain: [],
        error: null,
        headers: null,
        parentId: null,
      };

      callbacks.onNodeDiscovered(rootNode);

      queue.push({
        url: normalized,
        depth: 0,
        resourceType: 'page',
      });

      processQueue(normalized);
    },

    pause() {
      if (status === 'crawling') {
        status = 'paused';
      }
    },

    resume() {
      if (status === 'paused') {
        status = 'crawling';
        if (pausePromise) {
          pausePromise.resolve();
        }
      }
    },

    stop() {
      status = 'complete';
      abortController.abort();
      if (pausePromise) {
        pausePromise.resolve();
      }
    },

    getStatus() {
      return status;
    },
  };
};
