import { Hono } from 'hono';
import { cors } from 'hono/cors';

import { health } from './handlers/health.js';
import { exchangeToken, getUserInfo, getMe } from './handlers/auth.js';
import { getStats } from './handlers/dashboard.js';
import { list, get } from './handlers/test-guidelines.js';
import { authMiddleware } from './middleware/auth.js';

const app = new Hono();

// CORS
app.use(
  '/api/*',
  cors({
    origin: (origin) => origin || process.env.FRONTEND_URL || 'http://local-dev.wipo.int:5173',
    allowHeaders: ['Content-Type', 'Authorization', 'X-Auth-Provider'],
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  })
);

// Public routes
app.get('/api/health', health);
app.post('/api/auth/token', exchangeToken);
app.get('/api/auth/userinfo', getUserInfo);

// Auth middleware for all remaining /api/* routes
app.use('/api/*', authMiddleware);

// Protected routes
app.get('/api/auth/me', getMe);
app.get('/api/dashboard/stats', getStats);
app.get('/api/test-guidelines', list);
app.get('/api/test-guidelines/:id', get);

// Centralized error handling
app.onError((err, c) => {
  console.error('Unhandled error:', err);
  return c.json({ error: { code: 'INTERNAL_ERROR', message: err.message } }, 500);
});

export default app;
