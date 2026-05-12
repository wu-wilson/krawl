import type { Request, Response, NextFunction } from 'express';

/**
 * Request logging middleware — logs method, target URL, status, and response time
 * @param req - Express request
 * @param res - Express response
 * @param next - Next middleware
 */
export const requestLogger = (req: Request, res: Response, next: NextFunction): void => {
  const start = Date.now();
  const targetUrl = req.query.url || 'N/A';

  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(
      `[${new Date().toISOString()}] ${req.method} ${req.path} → ${String(targetUrl)} | ${res.statusCode} | ${duration}ms`
    );
  });

  next();
};
