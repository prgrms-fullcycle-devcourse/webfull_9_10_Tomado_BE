import type { Request, Response } from 'express';

import { listExamples } from '../repositories/example.repository.js';

export async function getExamples(_req: Request, res: Response) {
    const data = await listExamples();
    res.json({ data });
}
