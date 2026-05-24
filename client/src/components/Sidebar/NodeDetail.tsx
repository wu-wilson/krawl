import React, { useState, useEffect, useRef, useCallback } from 'react';

import { RedirectChain } from './RedirectChain';

import { useCrawlStore } from '../../store/crawlStore';

import { getDisplayUrl } from '../../engine/urlUtils';

import { STATUS_STYLES } from '../Graph/GraphNode';

import { DURATION } from '../../utils/animations';

import type { CrawlNode } from '../../engine/types';

/**
 * Detail panel for a selected node — sidebar on desktop, bottom sheet on mobile
 * @returns Slide-in detail panel
 */
export const NodeDetail: React.FC = () => {
  const selectedNodeId = useCrawlStore((s) => s.selectedNodeId);
  const nodes = useCrawlStore((s) => s.nodes);
  const selectNode = useCrawlStore((s) => s.selectNode);

  const [isOpen, setIsOpen] = useState(false);
  const [displayNode, setDisplayNode] = useState<CrawlNode | undefined>(undefined);
  const [showHeaders, setShowHeaders] = useState(false);
  const [showInbound, setShowInbound] = useState(false);
  const [showOutbound, setShowOutbound] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);

  const node: CrawlNode | undefined = selectedNodeId ? nodes.get(selectedNodeId) : undefined;

  // Keep displayNode populated through the close so the slide-out can play before the component unmounts.
  useEffect(() => {
    if (node) {
      setDisplayNode(node);
      const raf = requestAnimationFrame(() => setIsOpen(true));
      const focusTimer = setTimeout(() => closeRef.current?.focus(), 100);
      return () => {
        cancelAnimationFrame(raf);
        clearTimeout(focusTimer);
      };
    }
    setIsOpen(false);
    const unmountTimer = setTimeout(() => setDisplayNode(undefined), DURATION.normal);
    return () => clearTimeout(unmountTimer);
  }, [node]);

  const handleClose = useCallback(() => {
    selectNode(null);
    setShowHeaders(false);
    setShowInbound(false);
    setShowOutbound(false);
  }, [selectNode]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        handleClose();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleClose]);

  if (!displayNode) return null;

  return (
    <>
      {/* Desktop sidebar */}
      <div
        className={`hidden lg:flex fixed top-[calc(3.5rem+env(safe-area-inset-top))] right-0 bottom-0 w-[320px] z-40
          flex-col bg-bg-primary border-l border-border
          transition-transform ease-out overflow-hidden
          ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
        style={{ transitionDuration: `${DURATION.normal}ms`, transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)' }}
        role="complementary"
        aria-label="Node details"
      >
        <NodeDetailContent
          node={displayNode}
          onClose={handleClose}
          closeRef={closeRef}
          showHeaders={showHeaders}
          setShowHeaders={setShowHeaders}
          showInbound={showInbound}
          setShowInbound={setShowInbound}
          showOutbound={showOutbound}
          setShowOutbound={setShowOutbound}
        />
      </div>

      {/* Mobile bottom sheet */}
      <div
        className={`lg:hidden fixed inset-x-0 bottom-0 z-40
          h-[50dvh] bg-bg-primary border-t border-border rounded-t-xl
          transition-transform ease-out overflow-hidden
          ${isOpen ? 'translate-y-0' : 'translate-y-full'}`}
        style={{ transitionDuration: `${DURATION.normal}ms`, transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)' }}
        role="complementary"
        aria-label="Node details"
      >
        {/* Drag handle */}
        <div className="flex justify-center py-2">
          <div className="w-10 h-1 rounded-full bg-bg-tertiary" />
        </div>
        <NodeDetailContent
          node={displayNode}
          onClose={handleClose}
          closeRef={closeRef}
          showHeaders={showHeaders}
          setShowHeaders={setShowHeaders}
          showInbound={showInbound}
          setShowInbound={setShowInbound}
          showOutbound={showOutbound}
          setShowOutbound={setShowOutbound}
        />
      </div>
    </>
  );
};

interface NodeDetailContentProps {
  node: CrawlNode;
  onClose: () => void;
  closeRef: React.RefObject<HTMLButtonElement | null>;
  showHeaders: boolean;
  setShowHeaders: (v: boolean) => void;
  showInbound: boolean;
  setShowInbound: (v: boolean) => void;
  showOutbound: boolean;
  setShowOutbound: (v: boolean) => void;
}

const NodeDetailContent: React.FC<NodeDetailContentProps> = ({
  node,
  onClose,
  closeRef,
  showHeaders,
  setShowHeaders,
  showInbound,
  setShowInbound,
  showOutbound,
  setShowOutbound,
}) => {
  const statusStyle = STATUS_STYLES[node.status];

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-start justify-between p-4 border-b border-border">
        <div className="flex-1 min-w-0 mr-3">
          <a
            href={node.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-mono text-brand hover:underline break-all leading-relaxed
              focus:outline-none focus:ring-2 focus:ring-brand/50 rounded"
          >
            {getDisplayUrl(node.url)}
          </a>
        </div>
        <button
          ref={closeRef as React.RefObject<HTMLButtonElement>}
          onClick={onClose}
          className="w-8 h-8 flex items-center justify-center rounded-lg
            text-text-tertiary hover:text-text-primary hover:bg-surface-hover
            transition-all duration-150 ease-out flex-shrink-0
            focus:outline-none focus:ring-2 focus:ring-brand/50"
          aria-label="Close detail panel"
        >
          <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-4 pb-[calc(2rem+env(safe-area-inset-bottom))] space-y-4">
        {/* Status + HTTP Code */}
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className={`${statusStyle.bg} ${statusStyle.text} rounded-full px-2.5 py-0.5 text-xs font-mono`}
            aria-label={`Status: ${statusStyle.label}${node.httpStatus ? ` ${node.httpStatus}` : ''}`}
          >
            {node.httpStatus ? `${node.httpStatus} ${statusStyle.label}` : statusStyle.label}
          </span>
          {node.redirectChain.length > 1 && (
            <span className="text-xs text-text-tertiary">Redirected</span>
          )}
          {node.responseTime !== null && (
            <span className="text-xs font-mono text-text-secondary">
              {node.responseTime}ms
            </span>
          )}
        </div>

        {/* Details grid */}
        <div className="grid grid-cols-2 gap-3">
          <DetailItem label="Type" value={node.resourceType} />
          <DetailItem label="Depth" value={String(node.depth)} />
          {node.contentType && (
            <DetailItem label="Content-Type" value={node.contentType} span2 />
          )}
          {node.error && (
            <DetailItem label="Error" value={node.error} span2 isError />
          )}
        </div>

        {/* Redirect chain */}
        {node.redirectChain.length > 1 && (
          <RedirectChain chain={node.redirectChain} finalStatus={node.status} />
        )}

        {/* Inbound links */}
        {node.inbound.length > 0 && (
          <Accordion
            title={`Inbound Links (${node.inbound.length})`}
            open={showInbound}
            onToggle={() => setShowInbound(!showInbound)}
          >
            <ul className="space-y-1">
              {node.inbound.map((url) => (
                <li key={url} className="text-xs font-mono text-text-secondary break-all">
                  {getDisplayUrl(url)}
                </li>
              ))}
            </ul>
          </Accordion>
        )}

        {/* Outbound links */}
        {node.outbound.length > 0 && (
          <Accordion
            title={`Outbound Links (${node.outbound.length})`}
            open={showOutbound}
            onToggle={() => setShowOutbound(!showOutbound)}
          >
            <ul className="space-y-1">
              {node.outbound.map((url) => (
                <li key={url} className="text-xs font-mono text-text-secondary break-all">
                  {getDisplayUrl(url)}
                </li>
              ))}
            </ul>
          </Accordion>
        )}

        {/* Response headers */}
        {node.headers && Object.keys(node.headers).length > 0 && (
          <Accordion
            title="Response Headers"
            open={showHeaders}
            onToggle={() => setShowHeaders(!showHeaders)}
          >
            <div className="space-y-1">
              {Object.entries(node.headers).map(([key, value]) => (
                <div key={key} className="flex gap-2">
                  <span className="text-xs font-mono text-text-tertiary flex-shrink-0">{key}:</span>
                  <span className="text-xs font-mono text-text-secondary break-all">{value}</span>
                </div>
              ))}
            </div>
          </Accordion>
        )}
      </div>
    </div>
  );
};

interface DetailItemProps {
  label: string;
  value: string;
  span2?: boolean;
  isError?: boolean;
}

const DetailItem: React.FC<DetailItemProps> = ({ label, value, span2, isError }) => (
  <div className={span2 ? 'col-span-2' : ''}>
    <span className="text-xs text-text-tertiary block mb-0.5">{label}</span>
    <span className={`text-sm font-mono ${isError ? 'text-status-broken' : 'text-text-primary'} break-all`}>
      {value}
    </span>
  </div>
);

interface AccordionProps {
  title: string;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

const Accordion: React.FC<AccordionProps> = ({ title, open, onToggle, children }) => (
  <div className="border border-border rounded-lg overflow-hidden">
    <button
      onClick={onToggle}
      className="w-full flex items-center justify-between px-3 py-2
        text-xs font-medium text-text-secondary
        hover:bg-surface-hover transition-colors duration-150
        focus:outline-none focus:ring-2 focus:ring-brand/50 focus:ring-inset"
      aria-expanded={open}
    >
      {title}
      <svg
        className={`w-3.5 h-3.5 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        viewBox="0 0 20 20"
        fill="currentColor"
      >
        <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
      </svg>
    </button>
    {open && (
      <div className="px-3 py-2 border-t border-border bg-bg-secondary">
        {children}
      </div>
    )}
  </div>
);
