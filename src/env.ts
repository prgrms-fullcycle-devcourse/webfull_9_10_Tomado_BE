import * as dotenv from 'dotenv';
import fs from 'node:fs';
import { z } from 'zod';

const localEnvPath = 'env/local.env';
const exampleEnvPath = 'env/example.env';

if (fs.existsSync(localEnvPath)) {
  dotenv.config({ path: localEnvPath });
} else {
  dotenv.config({ path: exampleEnvPath });
}

const EnvSchema = z.object({
  NODE_ENV: z.string().default('development'),
  PORT: z.coerce.number().default(4000),
  DATABASE_URL: z.string().min(1),
});

export const env = EnvSchema.parse(process.env);
