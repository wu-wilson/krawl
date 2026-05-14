import type { CrawlEdge, CrawlNode } from '../engine/types';

/** Triggers a browser download by creating a temporary anchor element. */
const triggerDownload = (filename: string, content: string, mimeType: string): void => {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
};

/** Escapes a value for safe inclusion in a CSV cell — quotes the value if it contains a comma, quote, or newline. */
const escapeCsvValue = (value: string): string => {
  if (value.includes(',') || value.includes('"') || value.includes('\n') || value.includes('\r')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
};

/**
 * Export the given crawl nodes as a CSV file download with columns:
 * URL, Status, HTTP Code, Response Time, Type, Depth, Error.
 * @param nodes - Crawl nodes to export
 */
export const exportCsv = (nodes: CrawlNode[]): void => {
  const headers = ['URL', 'Status', 'HTTP Code', 'Response Time (ms)', 'Type', 'Depth', 'Error'];
  const rows = nodes.map((node) => [
    escapeCsvValue(node.url),
    escapeCsvValue(node.status),
    node.httpStatus !== null ? String(node.httpStatus) : '',
    node.responseTime !== null ? String(node.responseTime) : '',
    escapeCsvValue(node.resourceType),
    String(node.depth),
    escapeCsvValue(node.error || ''),
  ]);

  const csvContent = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');

  triggerDownload('krawl-export.csv', csvContent, 'text/csv;charset=utf-8');
};

/**
 * Export the given crawl nodes and edges as a JSON file download
 * containing the full crawl graph data plus an exportedAt timestamp.
 * @param nodes - Crawl nodes to export
 * @param edges - Crawl edges to export
 */
export const exportJson = (nodes: CrawlNode[], edges: CrawlEdge[]): void => {
  const data = { nodes, edges, exportedAt: new Date().toISOString() };
  const jsonContent = JSON.stringify(data, null, 2);
  triggerDownload('krawl-export.json', jsonContent, 'application/json');
};
