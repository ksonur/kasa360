import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { env } from './env.js';
import type { AuthEnv } from './auth/middleware.js';
import { authRoutes } from './auth/routes.js';

const app = new Hono<AuthEnv>();

app.use(
  '*',
  cors({
    origin: env.corsOrigin === '*' ? '*' : env.corsOrigin.split(','),
    allowHeaders: ['Content-Type', 'Authorization'],
    allowMethods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  })
);

app.get('/health', (c) => c.json({ ok: true, service: 'kasa360-api' }));

app.route('/auth', authRoutes);

app.notFound((c) => c.json({ error: 'Not found' }, 404));

serve({ fetch: app.fetch, port: env.port }, (info) => {
  console.log(`kasa360-api listening on :${info.port}`);
});
