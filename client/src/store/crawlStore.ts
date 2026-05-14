import { create } from 'zustand';

import type { CrawlNode, CrawlEdge, CrawlStatus } from '../engine/types';

/** Filter configuration */
export interface FilterState {
  statusFilter: 'all' | 'broken' | 'redirects' | 'slow';
  typeFilter: 'all' | 'pages' | 'scripts' | 'styles' | 'images';
  slowThreshold: number;
  /** Case-insensitive URL substring filter. Empty string = no search filter. */
  search: string;
}

/** Computed crawl statistics */
export interface CrawlStats {
  total: number;
  healthy: number;
  redirects: number;
  broken: number;
  avgResponseTime: number;
}

/** Crawl state store */
interface CrawlStore {
  status: CrawlStatus;
  nodes: Map<string, CrawlNode>;
  edges: CrawlEdge[];
  selectedNodeId: string | null;
  filter: FilterState;
  startUrl: string | null;
  startTime: number | null;

  startCrawl: (url: string) => void;
  pauseCrawl: () => void;
  resumeCrawl: () => void;
  stopCrawl: () => void;
  resetCrawl: () => void;
  addNode: (node: CrawlNode) => void;
  updateNode: (id: string, updates: Partial<CrawlNode>) => void;
  addEdge: (edge: CrawlEdge) => void;
  selectNode: (id: string | null) => void;
  setFilter: (filter: Partial<FilterState>) => void;
  setStatus: (status: CrawlStatus) => void;

  getFilteredNodes: (includeAncestors?: boolean) => CrawlNode[];
  getFilteredEdges: () => CrawlEdge[];
  getStats: () => CrawlStats;
}

const DEFAULT_FILTER: FilterState = {
  statusFilter: 'all',
  typeFilter: 'all',
  slowThreshold: 1000,
  search: '',
};

/**
 * Zustand store for crawl state management
 * Uses batched updates to avoid creating new Map references on every node change.
 */
export const useCrawlStore = create<CrawlStore>((set, get) => {
  // --- Batching infrastructure ---
  let pendingFlush = false;
  let dirtyNodes = false;
  let dirtyEdges = false;
  const edgeIndex = new Set<string>();

  const scheduleFlush = () => {
    if (pendingFlush) return;
    pendingFlush = true;
    queueMicrotask(() => {
      pendingFlush = false;
      const patch: Record<string, unknown> = {};
      const state = get();
      if (dirtyNodes) {
        patch.nodes = new Map(state.nodes);
        dirtyNodes = false;
      }
      if (dirtyEdges) {
        patch.edges = [...state.edges];
        dirtyEdges = false;
      }
      if (Object.keys(patch).length > 0) {
        set(patch as Partial<CrawlStore>);
      }
    });
  };

  return {
  status: 'idle',
  nodes: new Map(),
  edges: [],
  selectedNodeId: null,
  filter: { ...DEFAULT_FILTER },
  startUrl: null,
  startTime: null,

  startCrawl: (url: string) => {
    set({
      status: 'crawling',
      startUrl: url,
      startTime: Date.now(),
    });
  },

  pauseCrawl: () => {
    set({ status: 'paused' });
  },

  resumeCrawl: () => {
    set({ status: 'crawling' });
  },

  stopCrawl: () => {
    set({ status: 'complete' });
  },

  resetCrawl: () => {
    edgeIndex.clear();
    pendingFlush = false;
    dirtyNodes = false;
    dirtyEdges = false;
    set({
      status: 'idle',
      nodes: new Map(),
      edges: [],
      selectedNodeId: null,
      filter: { ...DEFAULT_FILTER },
      startUrl: null,
      startTime: null,
    });
  },

  addNode: (node: CrawlNode) => {
    // Mutate in place, schedule a single batched flush
    get().nodes.set(node.id, node);
    dirtyNodes = true;
    scheduleFlush();
  },

  updateNode: (id: string, updates: Partial<CrawlNode>) => {
    const nodes = get().nodes;
    const existing = nodes.get(id);
    if (!existing) return;

    const updated = { ...existing, ...updates };

    // Merge inbound arrays instead of replacing
    if (updates.inbound && updates.inbound.length === 0 && existing.inbound.length > 0) {
      updated.inbound = existing.inbound;
    }

    nodes.set(id, updated);
    dirtyNodes = true;
    scheduleFlush();
  },

  addEdge: (edge: CrawlEdge) => {
    const key = `${edge.source}->${edge.target}`;
    if (edgeIndex.has(key)) return;
    edgeIndex.add(key);

    // Update inbound on target node
    const nodes = get().nodes;
    const targetNode = nodes.get(edge.target);
    if (targetNode && !targetNode.inbound.includes(edge.source)) {
      nodes.set(edge.target, {
        ...targetNode,
        inbound: [...targetNode.inbound, edge.source],
      });
      dirtyNodes = true;
    }

    get().edges.push(edge);
    dirtyEdges = true;
    scheduleFlush();
  },

  selectNode: (id: string | null) => {
    set({ selectedNodeId: id });
  },

  setFilter: (filter: Partial<FilterState>) => {
    set((state) => ({
      filter: { ...state.filter, ...filter },
    }));
  },

  setStatus: (status: CrawlStatus) => {
    set({ status });
  },

  getFilteredNodes: (includeAncestors = true) => {
    const { nodes, filter } = get();
    const searchQuery = filter.search.trim().toLowerCase();

    // No filter active — return all
    if (filter.statusFilter === 'all' && filter.typeFilter === 'all' && searchQuery === '') {
      return Array.from(nodes.values());
    }

    /** Check if a node directly matches the active filter criteria */
    const matchesFilter = (node: CrawlNode): boolean => {
      if (filter.statusFilter !== 'all') {
        switch (filter.statusFilter) {
          case 'broken':
            if (node.status !== 'broken') return false;
            break;
          case 'redirects':
            if (node.redirectChain.length <= 1) return false;
            break;
          case 'slow':
            if (node.responseTime === null || node.responseTime < filter.slowThreshold) return false;
            break;
        }
      }

      if (filter.typeFilter !== 'all') {
        switch (filter.typeFilter) {
          case 'pages':
            if (node.resourceType !== 'page') return false;
            break;
          case 'scripts':
            if (node.resourceType !== 'script') return false;
            break;
          case 'styles':
            if (node.resourceType !== 'stylesheet') return false;
            break;
          case 'images':
            if (node.resourceType !== 'image') return false;
            break;
        }
      }

      if (searchQuery !== '' && !node.url.toLowerCase().includes(searchQuery)) {
        return false;
      }

      return true;
    };

    // Collect nodes that directly match the filter
    const visibleIds = new Set<string>();
    const allNodes = Array.from(nodes.values());

    for (const node of allNodes) {
      if (matchesFilter(node)) {
        visibleIds.add(node.id);
      }
    }

    // Walk up ancestor chains so the graph stays connected —
    // only when requested (graph needs this, report table does not)
    if (includeAncestors) {
      const addAncestors = (nodeId: string) => {
        const node = nodes.get(nodeId);
        if (!node || !node.parentId) return;
        if (visibleIds.has(node.parentId)) return;
        visibleIds.add(node.parentId);
        addAncestors(node.parentId);
      };

      for (const id of [...visibleIds]) {
        addAncestors(id);
      }
    }

    return allNodes.filter((node) => visibleIds.has(node.id));
  },

  getFilteredEdges: () => {
    const { edges } = get();
    const filteredNodes = get().getFilteredNodes();
    const filteredIds = new Set(filteredNodes.map((n) => n.id));
    return edges.filter((e) => filteredIds.has(e.source) && filteredIds.has(e.target));
  },

  getStats: () => {
    const { nodes } = get();
    const allNodes = Array.from(nodes.values());

    let healthy = 0;
    let redirects = 0;
    let broken = 0;
    let totalTime = 0;
    let timeCount = 0;

    for (const node of allNodes) {
      if (node.redirectChain.length > 1) {
        redirects++;
      }
      switch (node.status) {
        case 'healthy':
          healthy++;
          break;
        case 'broken':
          broken++;
          break;
      }
      if (typeof node.responseTime === 'number' && node.responseTime > 0) {
        totalTime += node.responseTime;
        timeCount++;
      }
    }

    return {
      total: allNodes.length,
      healthy,
      redirects,
      broken,
      avgResponseTime: timeCount > 0 ? totalTime / timeCount : 0,
    };
  },
  };
});
