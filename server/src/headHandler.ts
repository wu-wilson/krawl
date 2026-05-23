import type { Request, Response } from 'express';

import { proxyFetch } from './security/safeFetch';

/**
 * GET /head?url=<target> — Performs a HEAD request for status check without body.
 * Delegates to `proxyFetch`, which validates every hop against the SSRF guard
 * and caps redirects.
 * @param req - Express request with url query parameter
 * @param res - Express response
 * @returns Resolves once the JSON response has been sent
 */
export const headHandler = async (req: Request, res: Response): Promise<void> => {
  const targetUrl = req.query.url as string;
  const result = await proxyFetch(targetUrl, { headOnly: true });
  res.json(result);
};
