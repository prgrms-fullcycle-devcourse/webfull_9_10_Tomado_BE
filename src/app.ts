import cors from 'cors';
import express from 'express';

import { swaggerRouter } from './docs/swagger.js';

export function createApp() {
  const app = express();

  app.use(cors());
  app.use(express.json());

  app.get('/health', (_req, res) => {
    res.json({ ok: true });
  });

  app.use('/docs', swaggerRouter);

  return app;
}
