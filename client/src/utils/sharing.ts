import { compressToEncodedURIComponent, decompressFromEncodedURIComponent } from 'lz-string';

import type { CrawlNode, CrawlEdge, CrawlStatus } from '../engine/types';

/**
 * Compress crawl state into a URL-safe string
 * @param nodes - Array of crawl nodes
 * @param edges - Array of crawl edges
 * @param startUrl - The starting URL
 * @param status - The crawl status to preserve
 * @returns Compressed, URL-safe string
 */
export const compressState = (
  nodes: CrawlNode[],
  edges: CrawlEdge[],
  startUrl: string,
  status?: CrawlStatus
): string => {
  const data = JSON.stringify({ nodes, edges, startUrl, status: status || 'complete' });
  return compressToEncodedURIComponent(data);
};

interface DecompressedState {
  nodes: CrawlNode[];
  edges: CrawlEdge[];
  startUrl: string;
  status: CrawlStatus;
}

/**
 * Decompress a shared state string back into crawl data
 * @param data - Compressed string from URL fragment
 * @returns Decompressed crawl data, or null on failure
 */
export const decompressState = (
  data: string
): DecompressedState | null => {
  try {
    const json = decompressFromEncodedURIComponent(data);
    if (!json) return null;
    const parsed = JSON.parse(json);
    if (!parsed.nodes || !parsed.edges || !parsed.startUrl) return null;
    return {
      nodes: parsed.nodes,
      edges: parsed.edges,
      startUrl: parsed.startUrl,
      status: parsed.status || 'complete',
    };
  } catch {
    return null;
  }
};
