/** Status of the overall crawl */
export type CrawlStatus = 'idle' | 'crawling' | 'paused' | 'complete';

/** Status of an individual node */
export type NodeStatus = 'queued' | 'pending' | 'healthy' | 'redirect' | 'broken';

/** Type of resource discovered */
export type ResourceType = 'page' | 'script' | 'stylesheet' | 'image' | 'media' | 'font' | 'api' | 'other';

/** A single crawled URL node */
export interface CrawlNode {
  /** Normalized URL — used as unique key */
  id: string;
  /** Original URL as discovered */
  url: string;
  /** Current status of this node */
  status: NodeStatus;
  /** HTTP status code, null if not yet fetched */
  httpStatus: number | null;
  /** Response time in ms, null if not yet fetched */
  responseTime: number | null;
  /** Content-Type header value */
  contentType: string | null;
  /** Classified resource type */
  resourceType: ResourceType;
  /** Crawl depth from the starting URL */
  depth: number;
  /** Normalized URLs that link to this node */
  inbound: string[];
  /** Normalized URLs this node links to */
  outbound: string[];
  /** Chain of URLs if redirected */
  redirectChain: string[];
  /** Error message if the fetch failed */
  error: string | null;
  /** Response headers */
  headers: Record<string, string> | null;
  /** ID of the parent node that discovered this one */
  parentId: string | null;
}

/** A directed edge between two nodes */
export interface CrawlEdge {
  /** Source node ID */
  source: string;
  /** Target node ID */
  target: string;
  /** HTML element that created this link (e.g., "a", "script", "img") */
  sourceElement: string;
}

/** Engine configuration */
export interface CrawlConfig {
  /** Max concurrent requests */
  maxConcurrent: number;
  /** Max crawl depth */
  maxDepth: number;
  /** Max total URLs to crawl */
  maxUrls: number;
  /** Delay between request batches in ms */
  batchDelay: number;
}

/** Response from the proxy /fetch endpoint */
export interface ProxyFetchResponse {
  status: number;
  headers: Record<string, string>;
  responseTime: number;
  body: string | null;
  finalUrl: string | null;
  error?: string;
}

/** Response from the proxy /head endpoint */
export interface ProxyHeadResponse {
  status: number;
  headers: Record<string, string>;
  responseTime: number;
  finalUrl: string | null;
  error?: string;
}
