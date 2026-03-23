import cors from 'cors';
import express from 'express';
import swaggerUi from 'swagger-ui-express';
import swaggerSpec from './swagger/index.js';

import { authRouter } from './routes/auth.routes.js';

export function createApp() {
    const app = express();

    app.use(cors());
    app.use(express.json());

    app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

    app.use('/auth', authRouter);

    return app;
}
