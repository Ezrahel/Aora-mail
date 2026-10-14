import crypto from 'crypto';
import { env } from '../../config/env';
import { AppError } from '../../common/errors/app-error';

export type SupportedCurrency = 'NGN' | 'USD';

function baseUrl(): string {
  if (env.BACHS_API_URL) return env.BACHS_API_URL.replace(/\/$/, '');
  return env.BACHS_API_KEY.startsWith('sk_live_') ? 'https://api.bachs.io/v1' : 'https://sandbox-api.bachs.io/v1';
}

export function amountForCurrency(annualPriceKobo: number, currency: SupportedCurrency): string {
  // USD pricing is intentionally configurable through USD_ANNUAL_PRICE_CENTS. Do not silently FX-convert.
  const minor = currency === 'NGN'
    ? annualPriceKobo
    : Math.round(annualPriceKobo / 100 * Number(process.env.USD_NGN_PRICE_MULTIPLIER ?? '0.00065') * 100);
  return (minor / 100).toFixed(2);
}

export async function createCheckout(input: {
  email: string; name: string; amount: string; currency: SupportedCurrency; reference: string;
  metadata: Record<string, string>; idempotencyKey: string;
}): Promise<{ checkoutUrl: string; checkoutId?: string }> {
  if (!env.BACHS_API_KEY) throw new AppError(503, 'PAYMENT_NOT_CONFIGURED', 'Payments are not configured yet. Please contact support.');
  const response = await fetch(`${baseUrl()}/checkouts`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${env.BACHS_API_KEY}`, 'Content-Type': 'application/json', 'Idempotency-Key': input.idempotencyKey },
    body: JSON.stringify({
      amount: input.amount, currency: input.currency, customer_email: input.email, customer_name: input.name,
      success_url: `${env.CLIENT_URL}/dashboard/billing?payment=success`,
      cancel_url: `${env.CLIENT_URL}/dashboard/subscription?payment=cancelled`,
      reference: input.reference, metadata: input.metadata,
    }),
  });
  const body = await response.json().catch(() => ({})) as Record<string, unknown>;
  if (!response.ok) throw new AppError(502, 'PAYMENT_PROVIDER_ERROR', 'We could not start checkout. Please try again.');
  const checkoutUrl = String(body.checkout_url ?? body.url ?? '');
  if (!checkoutUrl) throw new AppError(502, 'PAYMENT_PROVIDER_ERROR', 'The payment provider returned an invalid checkout session.');
  return { checkoutUrl, checkoutId: typeof body.checkout_id === 'string' ? body.checkout_id : undefined };
}

function signatures(header: string): string[] {
  if (!header.includes('=')) return [header];
  return header.split(',').map((part) => part.trim()).filter((part) => part.startsWith('v1=')).map((part) => part.slice(3));
}

export function verifyWebhook(rawBody: string, timestamp: string | undefined, signature: string | undefined): boolean {
  if (!env.BACHS_WEBHOOK_SECRET || !timestamp || !signature || !/^\d+$/.test(timestamp)) return false;
  if (Math.abs(Date.now() / 1000 - Number(timestamp)) > 300) return false;
  const expected = crypto.createHmac('sha256', env.BACHS_WEBHOOK_SECRET).update(`${timestamp}.${rawBody}`, 'utf8').digest('hex');
  return signatures(signature).some((candidate) => candidate.length === expected.length && crypto.timingSafeEqual(Buffer.from(candidate), Buffer.from(expected)));
}
