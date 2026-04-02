import cors from 'cors';
import express from 'express';
import { env } from './env.js';
import swaggerUi from 'swagger-ui-express';
import swaggerSpec from './swagger/index.js';
import todosRouter from './routes/todos.routes.js';
import { authRouter } from './routes/auth.routes.js';
import usersRouter from './routes/users.routes.js';
import pomodoroRouter from './routes/pomodoro.routes.js';
import statsRouter from './routes/stats.routes.js';
import dailyLogsRouter from './routes/dailyLogs.routes.js';
import retroLogsRouter from './routes/retroLogs.routes.js';

export function createApp() {
    const app = express();

    app.use(
        cors({
            origin: env.ALLOWED_ORIGINS.split(','),
            credentials: true,
        })
    );
    app.use(express.json());

    // Health Check
    app.get('/healthz', (req, res) => res.status(200).send('OK'));

    app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

    // 라우터 등록
    app.use('/api/v1/auth', authRouter);
    app.use('/api/v1/users', usersRouter);
    app.use('/api/v1/todos', todosRouter);
    app.use('/api/v1/stats', statsRouter);
    app.use('/api/v1/daily-logs', dailyLogsRouter);
    app.use('/api/v1/pomodoro', pomodoroRouter);
    app.use('/api/v1/retro-logs', retroLogsRouter);

    return app;
}
