import type { Request, Response } from 'express';

import { TIMEOUT_MS, MAX_BODY_SIZE, USER_AGENT } from './constants';

/**
 * GET /fetch?url=<target> — Fetches the full page content through the proxy
 * @param req - Express request with url query parameter
 * @param res - Express response
 */
export const fetchHandler = async (req: Request, res: Response): Promise<void> => {
  const targetUrl = req.query.url as string;
  const start = Date.now();

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const response = await fetch(targetUrl, {
      method: 'GET',
      headers: { 'User-Agent': USER_AGENT },
      signal: controller.signal,
      redirect: 'follow',
    });

    const responseTime = Date.now() - start;

    // Read body with size limit — abort signal stays active through body reading
    const reader = response.body?.getReader();
    const chunks: Uint8Array[] = [];
    let totalSize = 0;

    if (reader) {
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
    }

    const body = new TextDecoder().decode(
      chunks.reduce((acc, chunk) => {
        const merged = new Uint8Array(acc.length + chunk.length);
        merged.set(acc);
        merged.set(chunk, acc.length);
        return merged;
      }, new Uint8Array(0))
    );

    // Extract headers as plain object
    const headers: Record<string, string> = {};
    response.headers.forEach((value, key) => {
      headers[key] = value;
    });

    res.json({
      status: response.status,
      headers,
      responseTime,
      body,
      finalUrl: response.url || targetUrl,
    });
  } catch (err: unknown) {
    const responseTime = Date.now() - start;
    const message = err instanceof Error ? err.message : 'Unknown error';

    res.json({
      status: 0,
      headers: {},
      responseTime,
      body: null,
      finalUrl: null,
      error: message,
    });
  } finally {
    clearTimeout(timeout);
  }
};
