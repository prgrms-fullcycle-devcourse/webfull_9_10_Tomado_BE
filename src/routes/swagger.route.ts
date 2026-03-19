import { Router } from 'express';

import { mountSwagger } from '../controllers/swagger.controller.js';

export const swaggerRouter = Router();

mountSwagger(swaggerRouter);
