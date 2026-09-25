import crypto from 'crypto';
import { env } from '../../config/env';
import { logger } from '../../common/logging/logger';
import { AppError } from '../../common/errors/app-error';

export interface PaystackInitResponse {
  authorization_url: string;
  access_code: string;
  reference: string;
}

export async function initializeTransaction(input: { email: string; amountKobo: number; reference: string; callbackUrl?: string; metadata?: Record<string,unknown> }): Promise<PaystackInitResponse> {
  if (!env.PAYSTACK_SECRET_KEY) {
    // Mock mode for dev without keys
    logger.warn('Paystack secret missing — returning mock authorization');
    return {
      authorization_url: `https://checkout.paystack.com/mock/${input.reference}`,
      access_code: 'mock_access_code',
      reference: input.reference,
    };
  }
  const res = await fetch('https://api.paystack.co/transaction/initialize', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${env.PAYSTACK_SECRET_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: input.email,
      amount: input.amountKobo,
      reference: input.reference,
      callback_url: input.callbackUrl,
      metadata: input.metadata,
    }),
  });
  if (!res.ok) {
    const body = await res.text();
    logger.error({ body }, 'Paystack initialize failed');
    throw new AppError(502, 'PAYMENT_FAILED', 'Could not initialize payment. Please try again.');
  }
  const json = await res.json() as { status: boolean; data: PaystackInitResponse; message: string };
  if (!json.status) throw new AppError(502, 'PAYMENT_FAILED', json.message || 'Paystack initialization failed.');
  return json.data;
}

export async function verifyTransaction(reference: string): Promise<{ status: string; amount: number; paidAt?: string; customerEmail?: string; id: number }> {
  if (!env.PAYSTACK_SECRET_KEY) {
    // Mock verify: check reference exists in our DB; caller should handle
    return { status: 'success', amount: 0, id: 0, customerEmail: '' };
  }
  const res = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
    headers: { 'Authorization': `Bearer ${env.PAYSTACK_SECRET_KEY}` },
  });
  if (!res.ok) {
    const body = await res.text();
    logger.error({ body, reference }, 'Paystack verify failed');
    throw new AppError(502, 'PAYMENT_VERIFICATION_FAILED', 'Could not verify payment with Paystack.');
  }
  const json = await res.json() as { status: boolean; data: { status: string; amount: number; paid_at: string; customer: { email: string }; id: number }; message: string };
  if (!json.status) throw new AppError(502, 'PAYMENT_VERIFICATION_FAILED', json.message);
  return { status: json.data.status, amount: json.data.amount, paidAt: json.data.paid_at, customerEmail: json.data.customer.email, id: json.data.id };
}

export function verifyWebhookSignature(rawBody: string | Buffer, signature: string): boolean {
  if (!env.PAYSTACK_WEBHOOK_SECRET) {
    logger.warn('Paystack webhook secret missing — skipping signature verification (dev only)');
    return true;
  }
  const hash = crypto.createHmac('sha512', env.PAYSTACK_WEBHOOK_SECRET).update(rawBody).digest('hex');
  return hash === signature;
}
