import * as dotenv from 'dotenv';
import fs from 'node:fs';
import { z } from 'zod';

dotenv.config();

const EnvSchema = z.object({
    NODE_ENV: z.string().default('development'),
    PORT: z.coerce.number().default(4000),
    DATABASE_URL: z.string().min(1),
    /** JWT 서명용 비밀키 (Access / Refresh 공통) */
    JWT_SECRET: z.string().min(1),
    JWT_ACCESS_EXPIRES: z.string().default('15m'),
    JWT_REFRESH_EXPIRES: z.string().default('7d'),
});

export const env = EnvSchema.parse(process.env);
