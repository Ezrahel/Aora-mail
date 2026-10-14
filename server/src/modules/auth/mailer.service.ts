import { env } from '../../config/env';
import { AppError } from '../../common/errors/app-error';

/** Provider-neutral transactional email handoff; configure a dedicated mail worker in production. */
export async function sendTransactionalEmail(input: { to: string; subject: string; text: string }): Promise<void> {
  const endpoint = process.env.EMAIL_DELIVERY_WEBHOOK_URL;
  if (!endpoint) { if (env.isProduction) throw new AppError(503, 'INTERNAL_ERROR', 'Email delivery is not configured.'); return; }
  const response = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.EMAIL_DELIVERY_WEBHOOK_TOKEN ?? ''}` }, body: JSON.stringify(input) });
  if (!response.ok) throw new AppError(502, 'INTERNAL_ERROR', 'We could not send email right now.');
}
