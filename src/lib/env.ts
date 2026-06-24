import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  NEXTAUTH_URL: z.string().url().default('http://localhost:3000'),
  NEXTAUTH_SECRET: z.string().min(32).default('dev-secret-change-in-production-min-32-chars!!'),
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  CANVAS_CLIENT_ID: z.string().optional(),
  CANVAS_CLIENT_SECRET: z.string().optional(),
  CANVAS_INSTANCE_URL: z.string().url().optional().default('https://canvas.instructure.com'),
  REDIS_URL: z.string().optional().default('redis://localhost:6379'),
  REDIS_TTL_SECONDS: z.coerce.number().min(0).default(900),
  MOCK_LMS_ENABLED: z
    .string()
    .default('true')
    .transform((v) => v === 'true'),
  COUNSELOR_EMAIL: z.string().optional().default('counselor@burnout.app'),
  COUNSELOR_PASSWORD: z.string().optional().default('counselor-dev'),
  ADMIN_EMAIL: z.string().optional().default('admin@burnout.app'),
  ADMIN_PASSWORD: z.string().optional().default('admin-dev'),
});

export type Env = z.infer<typeof envSchema>;

let cached: Env | null = null;

export function getEnv(): Env {
  if (cached) return cached;
  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    console.error('Environment validation failed:', result.error.flatten().fieldErrors);
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Invalid environment configuration');
    }
  }
  cached = result.data ?? (envSchema.parse({}) as Env);
  return cached;
}
