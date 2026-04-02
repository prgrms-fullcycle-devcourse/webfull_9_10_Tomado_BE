import * as dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const EnvSchema = z.object({
    NODE_ENV: z.string().default('development'),
    PORT: z.coerce.number().default(4000),
    DATABASE_URL: z.string().min(1),
    SUPABASE_URL: z.string().url(),
    SUPABASE_ANON_KEY: z.string().min(1),
    SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
    ALLOWED_ORIGINS: z.string().default('http://localhost:5173'), // TODO: 배포 시 변경(주소가 들어오지 않을 경우 임시로 로컬주소 허용)
});

const parsed = EnvSchema.safeParse(process.env);

if (!parsed.success) {
    console.error('❌ 환경 변수 검증 실패 상세 내용:');
    parsed.error.errors.forEach((err) => {
        const fieldName = String(err.path[0]);
        console.error(`  - [${fieldName}] 필드: ${err.message}`);
    });
    process.exit(1);
}

export const env = parsed.data;
