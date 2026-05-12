import rateLimit from 'express-rate-limit';

/**
 * Create rate limiting middleware
 * @returns Configured rate limiter (default: 1000 req/min/IP, configurable via RATE_LIMIT_PER_MINUTE)
 */
export const createRateLimiter = () => {
  const maxRequests = parseInt(process.env.RATE_LIMIT_PER_MINUTE || '1000', 10);

  return rateLimit({
    windowMs: 60 * 1000,
    max: maxRequests,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Rate limit exceeded. Try again in a minute.' },
  });
};
