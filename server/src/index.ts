import dotenv from 'dotenv';
dotenv.config();

import express from 'express';

import { createCorsMiddleware } from './middleware/cors';
import { createRateLimiter } from './middleware/rateLimiter';
import { validateUrl } from './middleware/validateUrl';
import { requestLogger } from './utils/logger';
import { fetchHandler } from './fetchHandler';
import { headHandler } from './headHandler';

const app = express();
const PORT = parseInt(process.env.PORT || '3001', 10);

// Resolves req.ip to the client behind Railway's proxy.
app.set('trust proxy', 1);

// Middleware
app.use(createCorsMiddleware());
app.use(requestLogger);
app.use(createRateLimiter());

// Health check
app.get('/', (_req, res) => {
  res.json({ status: 'ok', service: 'krawly-proxy' });
});

// Routes
app.get('/fetch', validateUrl, fetchHandler);
app.get('/head', validateUrl, headHandler);

// Start
app.listen(PORT, () => {
  console.log(`🕷️ Krawly proxy server running on port ${PORT}`);
});
