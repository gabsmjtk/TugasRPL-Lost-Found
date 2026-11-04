import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

const INSECURE_SECRETS = [
  'replace-with-a-long-random-secret',
  'rahasia-jwt-super-aman',
  'secret',
  '12345678',
  'password',
];

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().int().positive().default(3001),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  JWT_SECRET: z.string().min(16, 'JWT_SECRET must be at least 16 characters long'),
  JWT_EXPIRES_IN: z.string().default('1d'),
  CLIENT_URL: z.string().default('http://localhost:5173'),
  UPLOAD_DIR: z.string().default('uploads'),
  MAX_FILE_SIZE_MB: z.coerce.number().int().positive().default(5),
});

export type Env = z.infer<typeof envSchema>;

export function validateEnv(): Env {
  // In test environment, provide safe defaults if not provided
  if (process.env.NODE_ENV === 'test') {
    process.env.DATABASE_URL = process.env.DATABASE_URL || 'mysql://test:test@localhost:3306/campusfind_test';
    process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-jwt-secret-at-least-16-chars-long';
  }

  const parsed = envSchema.safeParse(process.env);

  if (!parsed.success) {
    const errorDetails = parsed.error.issues
      .map((issue) => ` - ${issue.path.join('.')}: ${issue.message}`)
      .join('\n');
    throw new Error(`Environment validation failed:\n${errorDetails}`);
  }

  const env = parsed.data;

  // Strict check for production
  if (env.NODE_ENV === 'production') {
    if (INSECURE_SECRETS.includes(env.JWT_SECRET)) {
      throw new Error(
        'SECURITY ALERT: Default or insecure JWT_SECRET detected in production. You must set a strong, unique secret in environment variables.'
      );
    }
  }

  return env;
}

export const env = validateEnv();
