import type { CrawlEdge, CrawlNode } from "../engine/types";

/**
 * Triggers a browser download by creating a temporary anchor element.
 */
function triggerDownload(filename: string, content: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

/**
 * Escapes a value for safe inclusion in a CSV cell. Wraps in double quotes
 * if the value contains commas, quotes, or newlines.
 */
function escapeCsvValue(value: string): string {
  if (
    value.includes(",") ||
    value.includes('"') ||
    value.includes("\n") ||
    value.includes("\r")
  ) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

/**
 * Exports the given crawl nodes as a CSV file download with columns:
 * URL, Status, HTTP Code, Response Time, Type, Depth, Error.
 *
 * @param nodes - The crawl nodes to export.
 */
export function exportCsv(nodes: CrawlNode[]): void {
  const headers = ["URL", "Status", "HTTP Code", "Response Time (ms)", "Type", "Depth", "Error"];
  const rows = nodes.map((node) => [
    escapeCsvValue(node.url),
    escapeCsvValue(node.status),
    node.httpStatus !== null ? String(node.httpStatus) : "",
    node.responseTime !== null ? String(node.responseTime) : "",
    escapeCsvValue(node.resourceType),
    String(node.depth),
    escapeCsvValue(node.error || ""),
  ]);

  const csvContent = [
    headers.join(","),
    ...rows.map((row) => row.join(",")),
  ].join("\n");

  triggerDownload("krawl-export.csv", csvContent, "text/csv;charset=utf-8");
}

/**
 * Exports the given crawl nodes and edges as a JSON file download
 * containing the full crawl graph data.
 *
 * @param nodes - The crawl nodes to export.
 * @param edges - The crawl edges to export.
 */
export function exportJson(nodes: CrawlNode[], edges: CrawlEdge[]): void {
  const data = { nodes, edges, exportedAt: new Date().toISOString() };
  const jsonContent = JSON.stringify(data, null, 2);
  triggerDownload("krawl-export.json", jsonContent, "application/json");
}
