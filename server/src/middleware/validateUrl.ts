import type { Request, Response, NextFunction } from 'express';

/**
 * Middleware to validate the `url` query parameter
 * @param req - Express request
 * @param res - Express response
 * @param next - Next middleware
 */
export const validateUrl = (req: Request, res: Response, next: NextFunction): void => {
  const targetUrl = req.query.url;

  if (!targetUrl || typeof targetUrl !== 'string') {
    res.status(400).json({ error: 'Missing required query parameter: url' });
    return;
  }

  try {
    const parsed = new URL(targetUrl);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      res.status(400).json({ error: 'Only http and https URLs are allowed' });
      return;
    }
  } catch {
    res.status(400).json({ error: 'Invalid URL provided' });
    return;
  }

  next();
};
