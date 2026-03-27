import cors from 'cors';
import express from 'express';
import swaggerUi from 'swagger-ui-express';
import swaggerSpec from './swagger/index.js';
import todosRouter from './routes/todos.routes.js';
import { authRouter } from './routes/auth.routes.js';
import usersRouter from './routes/users.routes.js';
import pomodoroRouter from './routes/pomodoro.routes.js';

export function createApp() {
    const app = express();

    app.use(cors());
    app.use(express.json());

    // Health Check
    app.get('/healthz', (req, res) => res.status(200).send('OK'));

    app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

    // 라우터 등록
    app.use('/auth', authRouter);
    app.use('/api/v1/users', usersRouter);
    app.use('/api/v1/todos', todosRouter);
    app.use('/pomodoro', pomodoroRouter);

    return app;
}
