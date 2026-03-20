import * as dotenv from 'dotenv';
import fs from 'node:fs';
import { z } from 'zod';

dotenv.config();

const EnvSchema = z.object({
    NODE_ENV: z.string().default('development'),
    PORT: z.coerce.number().default(4000),
    DATABASE_URL: z.string().min(1),
});

export const env = EnvSchema.parse(process.env);
