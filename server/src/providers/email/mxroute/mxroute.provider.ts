import { env } from '../../../config/env';
import { logger } from '../../../common/logging/logger';
import { AppError } from '../../../common/errors/app-error';
import type {
  EmailProvider,
  CreateDomainInput,
  DeleteDomainInput,
  GetDomainInput,
  GetDomainDnsInput,
  CreateMailboxInput,
  UpdateMailboxInput,
  DeleteMailboxInput,
  SuspendMailboxInput,
  UnsuspendMailboxInput,
  CreateForwarderInput,
  DeleteForwarderInput,
  GetUsageInput,
  ProviderDomain,
  ProviderDnsRecords,
  ProviderMailbox,
  ProviderForwarder,
  ProviderUsage,
} from '../email-provider.interface';
import { mapMxrouteDomain, mapMxrouteDns, mapMxrouteMailbox } from './mxroute.mapper';

// Simple token bucket for MXroute rate limits: 100/min reads, 20/min writes
class RateLimiter {
  private readTimestamps: number[] = [];
  private writeTimestamps: number[] = [];

  async acquire(isWrite: boolean): Promise<void> {
    const limit = isWrite ? 20 : 100;
    const bucket = isWrite ? this.writeTimestamps : this.readTimestamps;
    const now = Date.now();
    // remove >60s old
    while (bucket.length && now - bucket[0] > 60_000) bucket.shift();
    if (bucket.length >= limit) {
      const waitMs = 60_000 - (now - bucket[0]) + 100;
      await new Promise((r) => setTimeout(r, waitMs));
    }
    bucket.push(Date.now());
  }
}

const rateLimiter = new RateLimiter();

export class MXRouteProvider implements EmailProvider {
  readonly name = 'mxroute';
  private baseUrl: string;
  private headers: Record<string, string>;

  constructor() {
    this.baseUrl = env.MXROUTE_BASE_URL.replace(/\/$/, '');
    this.headers = {
      'Content-Type': 'application/json',
      'X-Server': env.MXROUTE_SERVER,
      'X-Username': env.MXROUTE_USERNAME,
      'X-API-Key': env.MXROUTE_API_KEY,
    };
  }

  private async request<T>(path: string, init: RequestInit & { isWrite?: boolean } = {}): Promise<T> {
    const isWrite = init.isWrite ?? (init.method !== 'GET' && init.method !== undefined);
    await rateLimiter.acquire(isWrite);

    // If credentials missing, fallback to mock mode (dev/demo without real MXroute)
    if (!env.MXROUTE_API_KEY || !env.MXROUTE_SERVER) {
      logger.warn({ path }, 'MXroute credentials missing — using mock response');
      throw new AppError(503, 'PROVIDER_ERROR', 'Email provider not configured. Please contact support.');
    }

    const url = `${this.baseUrl}${path}`;
    let attempt = 0;
    const maxRetries = 3;
    while (true) {
      try {
        const res = await fetch(url, {
          ...init,
          headers: { ...this.headers, ...(init.headers as Record<string, string> ?? {}) },
        });
        if (!res.ok) {
          const body = await res.text().catch(() => '');
          // 4xx validation errors should not be retried
          if (res.status >= 400 && res.status < 500 && res.status !== 429) {
            throw new AppError(res.status, 'PROVIDER_ERROR', `Provider error: ${res.status}`);
          }
          if (attempt < maxRetries && (res.status === 429 || res.status >= 500)) {
            attempt++;
            const backoff = Math.pow(2, attempt) * 1000;
            await new Promise((r) => setTimeout(r, backoff));
            continue;
          }
          logger.error({ status: res.status, body, url }, 'MXroute request failed');
          throw new AppError(502, 'PROVIDER_ERROR', 'Email provider temporarily unavailable. Please try again.');
        }
        const data = (await res.json().catch(() => ({}))) as T;
        return data;
      } catch (err) {
        if (err instanceof AppError) throw err;
        if (attempt < maxRetries) {
          attempt++;
          const backoff = Math.pow(2, attempt) * 1000;
          await new Promise((r) => setTimeout(r, backoff));
          continue;
        }
        logger.error({ err, url }, 'MXroute network error');
        throw new AppError(502, 'PROVIDER_ERROR', 'Email provider temporarily unavailable.');
      }
    }
  }

  // Mock helpers used when provider unavailable in tests/demo — still normalize
  private mockDomain(domain: string): ProviderDomain {
    return { id: `mx-${domain}`, name: domain, status: 'active' };
  }

  async createDomain(input: CreateDomainInput): Promise<ProviderDomain> {
    try {
      const data = await this.request<unknown>('/domains', {
        method: 'POST',
        body: JSON.stringify({ domain: input.domain }),
        isWrite: true,
      });
      return mapMxrouteDomain(data);
    } catch (err) {
      if ((err as AppError).code === 'PROVIDER_ERROR' && env.isDevelopment) {
        // In dev without credentials, simulate success to allow flows
        if (!env.MXROUTE_API_KEY) return this.mockDomain(input.domain);
      }
      throw err;
    }
  }

  async deleteDomain(input: DeleteDomainInput): Promise<void> {
    await this.request(`/domains/${encodeURIComponent(input.domain)}`, { method: 'DELETE', isWrite: true });
  }

  async getDomain(input: GetDomainInput): Promise<ProviderDomain> {
    const data = await this.request<unknown>(`/domains/${encodeURIComponent(input.domain)}`);
    return mapMxrouteDomain(data);
  }

  async getDomainDns(input: GetDomainDnsInput): Promise<ProviderDnsRecords> {
    try {
      const data = await this.request<unknown>(`/domains/${encodeURIComponent(input.domain)}/dns`);
      return mapMxrouteDns(data);
    } catch (err) {
      if (env.isDevelopment && !env.MXROUTE_API_KEY) {
        return mapMxrouteDns({});
      }
      throw err;
    }
  }

  async createMailbox(input: CreateMailboxInput): Promise<ProviderMailbox> {
    const data = await this.request<unknown>('/email-accounts', {
      method: 'POST',
      body: JSON.stringify({
        domain: input.domain,
        local_part: input.localPart,
        password: input.password,
        quota_mb: Math.ceil(input.quotaBytes / (1024 * 1024)),
      }),
      isWrite: true,
    });
    return mapMxrouteMailbox(data);
  }

  async updateMailbox(input: UpdateMailboxInput): Promise<ProviderMailbox> {
    const data = await this.request<unknown>(`/email-accounts/${encodeURIComponent(input.providerMailboxId)}`, {
      method: 'PATCH',
      body: JSON.stringify({
        quota_mb: input.quotaBytes ? Math.ceil(input.quotaBytes / (1024 * 1024)) : undefined,
        password: input.password,
      }),
      isWrite: true,
    });
    return mapMxrouteMailbox(data);
  }

  async deleteMailbox(input: DeleteMailboxInput): Promise<void> {
    await this.request(`/email-accounts/${encodeURIComponent(input.providerMailboxId)}`, { method: 'DELETE', isWrite: true });
  }

  async suspendMailbox(input: SuspendMailboxInput): Promise<void> {
    await this.request(`/email-accounts/${encodeURIComponent(input.providerMailboxId)}/suspend`, { method: 'POST', isWrite: true });
  }

  async unsuspendMailbox(input: UnsuspendMailboxInput): Promise<void> {
    await this.request(`/email-accounts/${encodeURIComponent(input.providerMailboxId)}/unsuspend`, { method: 'POST', isWrite: true });
  }

  async createForwarder(input: CreateForwarderInput): Promise<ProviderForwarder> {
    const data = await this.request<Record<string, unknown>>('/forwarders', {
      method: 'POST',
      body: JSON.stringify({
        domain: input.domain,
        source: input.source,
        destination: input.destination,
      }),
      isWrite: true,
    });
    return { id: String(data['id'] ?? `${input.source}@${input.domain}`), source: input.source, destination: input.destination };
  }

  async deleteForwarder(input: DeleteForwarderInput): Promise<void> {
    await this.request(`/forwarders/${encodeURIComponent(input.forwarderId)}`, { method: 'DELETE', isWrite: true });
  }

  async getUsage(input: GetUsageInput): Promise<ProviderUsage> {
    const qs = input.domain ? `?domain=${encodeURIComponent(input.domain)}` : '';
    const data = await this.request<Record<string, unknown>>(`/usage${qs}`);
    // Normalize
    const used = Number(data['used_mb'] ?? 0) * 1024 * 1024;
    const total = Number(data['quota_mb'] ?? 0) * 1024 * 1024;
    const mailboxes = Array.isArray(data['mailboxes']) ? (data['mailboxes'] as unknown[]).map((m) => {
      const o = m as Record<string, unknown>;
      return { id: String(o['id'] ?? ''), email: String(o['email'] ?? ''), usedBytes: Number(o['used_mb'] ?? 0) * 1024 * 1024, quotaBytes: Number(o['quota_mb'] ?? 0) * 1024 * 1024 };
    }) : [];
    return { totalQuotaBytes: total, usedBytes: used, mailboxCount: mailboxes.length, mailboxes };
  }
}

// Singleton — app depends on interface, not concrete
export const emailProvider: EmailProvider = new MXRouteProvider();
