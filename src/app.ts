import cors from 'cors';
import express from 'express';

import { exampleRouter } from './routes/example.route.js';
import { healthRouter } from './routes/health.route.js';
import { swaggerRouter } from './routes/swagger.route.js';

export function createApp() {
    const app = express();

    app.use(cors());
    app.use(express.json());

    app.use(healthRouter);
    app.use(exampleRouter);
    app.use(swaggerRouter);

    return app;
}
