/** Tracking parameters to strip during normalization */
const TRACKING_PARAMS = new Set([
  'utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term',
  'fbclid', 'gclid', 'mc_cid', 'mc_eid',
]);

/**
 * Normalize a URL for deduplication
 * @param url - The URL to normalize
 * @param base - Optional base URL for resolving relative URLs
 * @returns Normalized URL string
 */
export const normalizeUrl = (url: string, base?: string): string => {
  try {
    const parsed = new URL(url, base);

    // Only allow http/https
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return url;
    }

    // Lowercase hostname
    parsed.hostname = parsed.hostname.toLowerCase();

    // Remove default ports
    if (
      (parsed.protocol === 'http:' && parsed.port === '80') ||
      (parsed.protocol === 'https:' && parsed.port === '443')
    ) {
      parsed.port = '';
    }

    // Remove fragment
    parsed.hash = '';

    // Sort query parameters and strip tracking params
    const params = new URLSearchParams(parsed.search);
    const sortedParams = new URLSearchParams();
    const keys = Array.from(params.keys()).sort();
    for (const key of keys) {
      if (!TRACKING_PARAMS.has(key)) {
        const val = params.get(key);
        if (val !== null) {
          sortedParams.set(key, val);
        }
      }
    }
    parsed.search = sortedParams.toString();

    // Remove trailing slash from path (except root)
    if (parsed.pathname.length > 1 && parsed.pathname.endsWith('/')) {
      parsed.pathname = parsed.pathname.slice(0, -1);
    }

    return parsed.toString();
  } catch {
    return url;
  }
};

/**
 * Check if two URLs are on the same domain
 * @param url - URL to check
 * @param baseUrl - Base URL to compare against
 * @returns True if same domain
 */
export const isSameDomain = (url: string, baseUrl: string): boolean => {
  try {
    const a = new URL(url);
    const b = new URL(baseUrl);
    return a.hostname.toLowerCase() === b.hostname.toLowerCase();
  } catch {
    return false;
  }
};

/**
 * Check if a string is a valid HTTP/HTTPS URL
 * @param url - String to validate
 * @returns True if valid
 */
export const isValidUrl = (url: string): boolean => {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
};

/**
 * Get a shortened display version of a URL
 * @param url - Full URL
 * @returns Shortened display string
 */
export const getDisplayUrl = (url: string): string => {
  try {
    const parsed = new URL(url);
    const path = parsed.pathname + parsed.search;
    const display = parsed.hostname + (path === '/' ? '' : path);
    return display.length > 60 ? display.slice(0, 57) + '...' : display;
  } catch {
    return url;
  }
};
