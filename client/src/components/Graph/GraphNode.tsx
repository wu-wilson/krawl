/** @fileoverview Node and status rendering utilities for the graph canvas and UI components */

import type { NodeStatus } from '../../engine/types';

/** Status hex color mapping for Canvas rendering (Canvas can't read CSS variables) */
export const NODE_STATUS_COLORS: Record<NodeStatus, string> = {
  healthy: '#34d399',
  redirect: '#34d399',
  broken: '#f87171',
  pending: '#d4a017',
  queued: '#71717a',
};

/** Tailwind class mapping for status badges used by NodeDetail and ReportTable */
export const STATUS_STYLES: Record<NodeStatus, { bg: string; text: string; label: string }> = {
  healthy: { bg: 'bg-status-healthy/15', text: 'text-status-healthy', label: 'Healthy' },
  redirect: { bg: 'bg-status-redirect/15', text: 'text-status-redirect', label: 'Redirect' },
  broken: { bg: 'bg-status-broken/15', text: 'text-status-broken', label: 'Broken' },
  pending: { bg: 'bg-brand/15', text: 'text-brand', label: 'Pending' },
  queued: { bg: 'bg-bg-tertiary', text: 'text-text-tertiary', label: 'Queued' },
};

/**
 * Get the display radius for a node based on inbound link count
 * @param inboundCount - Number of inbound links
 * @returns Radius in pixels (4–16)
 */
export const getNodeRadius = (inboundCount: number): number => {
  return Math.max(4, Math.min(16, 4 + inboundCount * 1.5));
};

/**
 * Get status label text for accessibility
 * @param status - Node status
 * @param httpStatus - HTTP status code
 * @returns Human-readable status label
 */
export const getStatusLabel = (status: NodeStatus, httpStatus: number | null): string => {
  if (httpStatus) {
    const labels: Record<string, string> = {
      healthy: `${httpStatus} OK`,
      redirect: `${httpStatus} Redirect`,
      broken: `${httpStatus} Broken`,
    };
    return labels[status] || `${httpStatus}`;
  }
  return status === 'pending' ? 'Fetching...' : status === 'queued' ? 'Queued' : status;
};
