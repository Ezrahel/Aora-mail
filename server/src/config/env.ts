import dotenv from 'dotenv';
dotenv.config();

function requireEnv(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;
  if (!value) throw new Error(`Missing required env var: ${name}`);
  return value;
}

export const env = {
  NODE_ENV: process.env.NODE_ENV ?? 'development',
  PORT: parseInt(process.env.PORT ?? '4000', 10),
  API_PREFIX: process.env.API_PREFIX ?? '/api',
  DATABASE_URL: requireEnv('DATABASE_URL', 'postgresql://aora:aora@localhost:5432/aora'),
  REDIS_URL: process.env.REDIS_URL ?? 'redis://localhost:6379',
  SESSION_SECRET: requireEnv('SESSION_SECRET', 'change-me-super-secret-32chars-min'),
  JWT_SECRET: requireEnv('JWT_SECRET', 'change-me-jwt-secret-32chars-min'),
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN ?? '7d',
  COOKIE_DOMAIN: process.env.COOKIE_DOMAIN,
  PAYSTACK_SECRET_KEY: process.env.PAYSTACK_SECRET_KEY ?? '',
  PAYSTACK_PUBLIC_KEY: process.env.PAYSTACK_PUBLIC_KEY ?? '',
  PAYSTACK_WEBHOOK_SECRET: process.env.PAYSTACK_WEBHOOK_SECRET ?? '',
  MXROUTE_SERVER: process.env.MXROUTE_SERVER ?? '',
  MXROUTE_USERNAME: process.env.MXROUTE_USERNAME ?? '',
  MXROUTE_API_KEY: process.env.MXROUTE_API_KEY ?? '',
  MXROUTE_BASE_URL: process.env.MXROUTE_BASE_URL ?? 'https://api.mxroute.com/v1',
  CLOUDFLARE_API_TOKEN: process.env.CLOUDFLARE_API_TOKEN ?? '',
  CLOUDFLARE_ACCOUNT_ID: process.env.CLOUDFLARE_ACCOUNT_ID ?? '',
  CORS_ORIGIN: process.env.CORS_ORIGIN ?? 'http://localhost:3000',
  LOG_LEVEL: process.env.LOG_LEVEL ?? 'info',
  SUBSCRIPTION_GRACE_PERIOD_DAYS: parseInt(process.env.SUBSCRIPTION_GRACE_PERIOD_DAYS ?? '7', 10),
  USAGE_WARNING_THRESHOLD: parseInt(process.env.USAGE_WARNING_THRESHOLD ?? '70', 10),
  USAGE_CRITICAL_THRESHOLD: parseInt(process.env.USAGE_CRITICAL_THRESHOLD ?? '90', 10),
  isProduction: (process.env.NODE_ENV ?? 'development') === 'production',
  isDevelopment: (process.env.NODE_ENV ?? 'development') === 'development',
};
