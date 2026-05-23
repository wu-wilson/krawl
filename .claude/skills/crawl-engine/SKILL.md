---
name: crawl-engine
description: Reference for how the browser-based crawl engine works — queue flow, concurrency, hard caps, proxy interaction, and node lifecycle.
user-invocable: true
---

# Crawl Engine

The crawl engine (`client/src/engine/`) is a queue-based recursive web crawler that runs entirely in the browser. It fetches pages through the server proxy to bypass CORS restrictions.

## Modules

- `crawler.ts` — Manages the crawl lifecycle: URL queue, concurrency control, depth tracking, and domain scope.
- `parser.ts` — Extracts URLs from HTML using the browser's native DOMParser. Returns typed link objects.
- `urlUtils.ts` — Normalizes URLs for deduplication: lowercases hostnames, strips default ports, removes fragments and trailing slashes, sorts query parameters, and strips a fixed set of tracking params (`utm_source`, `utm_medium`, `utm_campaign`, `utm_content`, `utm_term`, `fbclid`, `gclid`, `mc_cid`, `mc_eid` — exact match, no wildcard).
- `types.ts` — Shared TypeScript types and interfaces: `CrawlNode`, `CrawlEdge`, `CrawlConfig`, `CrawlStatus`, `NodeStatus`, `ResourceType`, `ProxyFetchResponse`, `ProxyHeadResponse`.

## Flow

1. User submits a URL → engine normalizes it and adds it to the queue at depth 0.
2. Engine dequeues up to 6 URLs and fetches them in parallel through the server proxy.
3. For each HTML response on the same domain: parse all links, normalize them, deduplicate against the visited set, and enqueue new URLs at depth + 1.
4. URLs receive a HEAD-only check (status, no body) when any of these are true: external domain, non-`page` resource type, or already at `maxDepth`. The body is only fetched for internal pages within the depth budget.
5. Loop continues until the queue is empty or the 200 URL cap is reached.

## Hard Caps (not user-configurable)

- Max concurrent requests: 6
- Max crawl depth: 3
- Max total URLs: 200
- Delay between request batches: 100ms
- Per-request timeout: 10 seconds (via AbortController)
- No retries — each URL gets one attempt

## Constraints

- Never fetch the same normalized URL twice (enforced by a visited Set).
- Client-side rate limiting between request batches. Server-side rate limit is 1000 requests/minute.
- If a request times out or fails, the node is marked as `broken` (not left pending).
- If the crawl is stopped (AbortError), remaining queued nodes are marked as `broken` with "Crawl stopped".
- The engine emits node and edge updates to the Zustand store in real time as URLs are discovered and resolved.
