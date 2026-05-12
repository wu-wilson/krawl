import { normalizeUrl } from './urlUtils';

import type { ResourceType } from './types';

interface ParsedLink {
  /** Normalized URL */
  url: string;
  /** HTML element that contained the link */
  element: string;
  /** Classified resource type */
  resourceType: ResourceType;
}

/**
 * Extract all URLs from an HTML document
 * @param html - Raw HTML string
 * @param baseUrl - Base URL for resolving relative links
 * @returns Array of parsed link objects with deduplicated URLs
 */
export const parseLinks = (html: string, baseUrl: string): ParsedLink[] => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const seen = new Set<string>();
  const links: ParsedLink[] = [];

  const add = (rawUrl: string | null | undefined, element: string, resourceType: ResourceType) => {
    if (!rawUrl) return;
    const trimmed = rawUrl.trim();
    if (!trimmed) return;

    // Skip non-HTTP schemes
    if (
      trimmed.startsWith('javascript:') ||
      trimmed.startsWith('mailto:') ||
      trimmed.startsWith('tel:') ||
      trimmed.startsWith('data:') ||
      trimmed.startsWith('#')
    ) {
      return;
    }

    try {
      const normalized = normalizeUrl(trimmed, baseUrl);
      const parsed = new URL(normalized);
      if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return;

      if (!seen.has(normalized)) {
        seen.add(normalized);
        links.push({ url: normalized, element, resourceType });
      }
    } catch {
      // Invalid URL — skip
    }
  };

  // <a href>
  doc.querySelectorAll('a[href]').forEach((el) => {
    add(el.getAttribute('href'), 'a', 'page');
  });

  // <script src>
  doc.querySelectorAll('script[src]').forEach((el) => {
    add(el.getAttribute('src'), 'script', 'script');
  });

  // <link>
  doc.querySelectorAll('link[href]').forEach((el) => {
    const rel = (el.getAttribute('rel') || '').toLowerCase();
    if (rel.includes('stylesheet')) {
      add(el.getAttribute('href'), 'link', 'stylesheet');
    } else if (rel.includes('icon') || rel.includes('apple-touch-icon')) {
      add(el.getAttribute('href'), 'link', 'image');
    } else if (rel.includes('preload')) {
      const as = (el.getAttribute('as') || '').toLowerCase();
      const type: ResourceType = as === 'script' ? 'script'
        : as === 'style' ? 'stylesheet'
        : as === 'image' ? 'image'
        : as === 'font' ? 'font'
        : 'other';
      add(el.getAttribute('href'), 'link', type);
    } else {
      add(el.getAttribute('href'), 'link', 'other');
    }
  });

  // <img src> and <img srcset>
  doc.querySelectorAll('img').forEach((el) => {
    add(el.getAttribute('src'), 'img', 'image');
    const srcset = el.getAttribute('srcset');
    if (srcset) {
      srcset.split(',').forEach((entry) => {
        const url = entry.trim().split(/\s+/)[0];
        add(url, 'img', 'image');
      });
    }
  });

  // <form action>
  doc.querySelectorAll('form[action]').forEach((el) => {
    add(el.getAttribute('action'), 'form', 'page');
  });

  // <iframe src>
  doc.querySelectorAll('iframe[src]').forEach((el) => {
    add(el.getAttribute('src'), 'iframe', 'page');
  });

  // <video src> and <video poster>
  doc.querySelectorAll('video').forEach((el) => {
    add(el.getAttribute('src'), 'video', 'media');
    add(el.getAttribute('poster'), 'video', 'image');
  });

  // <source src>
  doc.querySelectorAll('source[src]').forEach((el) => {
    add(el.getAttribute('src'), 'source', 'media');
  });

  // <meta http-equiv="refresh">
  doc.querySelectorAll('meta[http-equiv="refresh"]').forEach((el) => {
    const content = el.getAttribute('content') || '';
    const match = content.match(/url=(.+)/i);
    if (match) {
      add(match[1].trim().replace(/^['"]|['"]$/g, ''), 'meta', 'page');
    }
  });

  return links;
};
