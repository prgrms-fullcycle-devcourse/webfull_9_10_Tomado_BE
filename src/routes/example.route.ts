import { Router } from 'express';

import { getExamples } from '../controllers/example.controller.js';

export const exampleRouter = Router();

exampleRouter.get('/examples', getExamples);
