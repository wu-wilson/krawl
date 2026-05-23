import type { Request, Response } from 'express';

import { proxyFetch } from './security/safeFetch';

/**
 * GET /fetch?url=<target> — Fetches the full page content through the proxy.
 * Delegates to `proxyFetch`, which validates every hop against the SSRF guard
 * and caps redirects and body size.
 * @param req - Express request with url query parameter
 * @param res - Express response
 * @returns Resolves once the JSON response has been sent
 */
export const fetchHandler = async (req: Request, res: Response): Promise<void> => {
  const targetUrl = req.query.url as string;
  const result = await proxyFetch(targetUrl, { headOnly: false });
  res.json(result);
};
