import type { Request, Response } from 'express';

import { TIMEOUT_MS, USER_AGENT } from './constants';

/**
 * GET /head?url=<target> — Performs a HEAD request for status check without body
 * @param req - Express request with url query parameter
 * @param res - Express response
 * @returns Resolves once the JSON response has been sent
 */
export const headHandler = async (req: Request, res: Response): Promise<void> => {
  const targetUrl = req.query.url as string;
  const start = Date.now();

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const response = await fetch(targetUrl, {
      method: 'HEAD',
      headers: { 'User-Agent': USER_AGENT },
      signal: controller.signal,
      redirect: 'follow',
    });

    const responseTime = Date.now() - start;

    const headers: Record<string, string> = {};
    response.headers.forEach((value, key) => {
      headers[key] = value;
    });

    res.json({
      status: response.status,
      headers,
      responseTime,
      finalUrl: response.url || targetUrl,
    });
  } catch (err: unknown) {
    const responseTime = Date.now() - start;
    const message = err instanceof Error ? err.message : 'Unknown error';

    res.json({
      status: 0,
      headers: {},
      responseTime,
      finalUrl: null,
      error: message,
    });
  } finally {
    clearTimeout(timeout);
  }
};
