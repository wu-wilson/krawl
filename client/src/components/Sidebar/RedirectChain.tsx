import React from 'react';

import type { NodeStatus } from '../../engine/types';

interface RedirectChainProps {
  /** Array of URLs in the redirect chain */
  chain: string[];
  /** Final status of the node (colors the last dot) */
  finalStatus: NodeStatus;
}

const DOT_COLORS: Record<NodeStatus, string> = {
  healthy: 'bg-status-healthy',
  redirect: 'bg-status-redirect',
  broken: 'bg-status-broken',
  pending: 'bg-brand',
  queued: 'bg-bg-tertiary',
};

/**
 * Visual redirect chain display showing the path of redirects
 * @param props - Redirect chain data and final status
 * @returns Vertical chain visualization
 */
export const RedirectChain: React.FC<RedirectChainProps> = ({ chain, finalStatus }) => {
  if (chain.length <= 1) return null;

  return (
    <div className="mt-3">
      <h4 className="text-xs font-medium text-text-secondary mb-2">Redirect Chain</h4>
      <div className="flex flex-col gap-0">
        {chain.map((url, i) => {
          const isLast = i === chain.length - 1;
          const dotColor = isLast ? DOT_COLORS[finalStatus] : 'bg-status-redirect';
          return (
            <div key={url} className="flex items-start gap-2">
              <div className="flex flex-col items-center">
                <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 mt-1.5 ${dotColor}`} />
                {!isLast && (
                  <div className="w-px h-4 bg-border" />
                )}
              </div>
              <span className="text-xs font-mono text-text-secondary break-all leading-relaxed">
                {url}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
