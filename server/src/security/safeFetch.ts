import { TIMEOUT_MS, MAX_BODY_SIZE, USER_AGENT, MAX_REDIRECTS } from '../constants';

import { assertSafeUrl, BlockedUrlError } from './urlGuard';

/** Unified response shape returned to both /fetch and /head handlers. */
interface ProxyFetchResult {
  status: number;
  headers: Record<string, string>;
  responseTime: number;
  body: string | null;
  finalUrl: string | null;
  error?: string;
}

interface ProxyFetchOptions {
  /** When true, sends HEAD and skips the response body entirely. */
  headOnly: boolean;
}

const REDIRECT_CODES = new Set([301, 302, 303, 307, 308]);

/**
 * Fetch a URL through the proxy with the SSRF guard applied at every hop.
 * Follows up to MAX_REDIRECTS manually, re-validating each Location target.
 * @param rawUrl - URL to fetch (will be validated before any network I/O)
 * @param options - headOnly toggles HEAD vs GET and suppresses body reads
 * @returns Final response, or an error result with status 0 on any failure
 */
export const proxyFetch = async (
  rawUrl: string,
  { headOnly }: ProxyFetchOptions
): Promise<ProxyFetchResult> => {
  const start = Date.now();

  // One AbortController across all hops so an attacker can't drain the
  // timeout by chaining redirects.
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

  const errorResult = (message: string): ProxyFetchResult => ({
    status: 0,
    headers: {},
    responseTime: Date.now() - start,
    body: null,
    finalUrl: null,
    error: message,
  });

  try {
    let currentUrl = rawUrl;

    for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
      let safe: URL;
      try {
        safe = await assertSafeUrl(currentUrl);
      } catch (err) {
        if (err instanceof BlockedUrlError) {
          return errorResult(err.message);
        }
        throw err;
      }

      const response = await fetch(safe.toString(), {
        method: headOnly ? 'HEAD' : 'GET',
        headers: { 'User-Agent': USER_AGENT },
        signal: controller.signal,
        redirect: 'manual',
      });

      const location = response.headers.get('location');
      if (REDIRECT_CODES.has(response.status) && location) {
        if (hop >= MAX_REDIRECTS) {
          return errorResult('Too many redirects');
        }
        let next: URL;
        try {
          next = new URL(location, safe);
        } catch {
          return errorResult('Invalid redirect target');
        }
        currentUrl = next.toString();
        continue;
      }

      const headers: Record<string, string> = {};
      response.headers.forEach((value, key) => {
        headers[key] = value;
      });

      const body = headOnly ? null : await readCappedBody(response);

      return {
        status: response.status,
        headers,
        responseTime: Date.now() - start,
        body,
        finalUrl: safe.toString(),
      };
    }

    return errorResult('Too many redirects');
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return errorResult(message);
  } finally {
    clearTimeout(timeout);
  }
};

/**
 * Stream the response body into a single decoded string, stopping once the
 * accumulated byte count crosses MAX_BODY_SIZE. The abort signal on the
 * underlying fetch stays armed, so a hung body read still trips the timeout.
 */
const readCappedBody = async (response: Response): Promise<string> => {
  const reader = response.body?.getReader();
  if (!reader) return '';

  const chunks: Uint8Array[] = [];
  let totalSize = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    totalSize += value.byteLength;
    if (totalSize > MAX_BODY_SIZE) {
      reader.cancel();
      break;
    }
    chunks.push(value);
  }

  return new TextDecoder().decode(
    chunks.reduce((acc, chunk) => {
      const merged = new Uint8Array(acc.length + chunk.length);
      merged.set(acc);
      merged.set(chunk, acc.length);
      return merged;
    }, new Uint8Array(0))
  );
};
