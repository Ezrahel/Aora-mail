import { env } from '../../../config/env';
import { logger } from '../../../common/logging/logger';
import { AppError } from '../../../common/errors/app-error';
import type { DnsProvider, DnsRecord, CreateDnsRecordInput, UpdateDnsRecordInput, DeleteDnsRecordInput, VerifyDomainInput, VerificationResult } from '../dns-provider.interface';

export class CloudflareDnsProvider implements DnsProvider {
  readonly name = 'cloudflare';
  private apiToken: string;
  private baseUrl = 'https://api.cloudflare.com/client/v4';

  constructor() {
    this.apiToken = env.CLOUDFLARE_API_TOKEN;
  }

  private headers(): Record<string, string> {
    return {
      'Authorization': `Bearer ${this.apiToken}`,
      'Content-Type': 'application/json',
    };
  }

  private ensureConfigured(): void {
    if (!this.apiToken) {
      throw new AppError(503, 'PROVIDER_ERROR', 'DNS provider not configured.');
    }
  }

  async getRecords(domain: string, zoneId?: string): Promise<DnsRecord[]> {
    this.ensureConfigured();
    if (!zoneId) {
      zoneId = await this.findZoneId(domain);
    }
    const res = await fetch(`${this.baseUrl}/zones/${zoneId}/dns_records`, { headers: this.headers() });
    if (!res.ok) throw new AppError(502, 'PROVIDER_ERROR', 'Failed to fetch DNS records from Cloudflare.');
    const json = await res.json() as { result: Array<Record<string, unknown>> };
    return json.result.map((r) => ({
      type: String(r['type']) as DnsRecord['type'],
      host: String(r['name']),
      value: String(r['content']),
      priority: r['priority'] ? Number(r['priority']) : undefined,
      ttl: Number(r['ttl'] ?? 3600),
    }));
  }

  async createRecord(input: CreateDnsRecordInput): Promise<DnsRecord & { id: string }> {
    this.ensureConfigured();
    const zoneId = input.zoneId ?? await this.findZoneId(input.domain);
    const res = await fetch(`${this.baseUrl}/zones/${zoneId}/dns_records`, {
      method: 'POST',
      headers: this.headers(),
      body: JSON.stringify({
        type: input.record.type,
        name: input.record.host === '@' ? input.domain : `${input.record.host}.${input.domain}`,
        content: input.record.value,
        ttl: input.record.ttl ?? 3600,
        priority: input.record.priority,
      }),
    });
    if (!res.ok) {
      const body = await res.text();
      logger.error({ body }, 'Cloudflare create record failed');
      throw new AppError(502, 'PROVIDER_ERROR', 'Failed to create DNS record.');
    }
    const json = await res.json() as { result: Record<string, unknown> };
    return { ...input.record, id: String(json.result['id']) };
  }

  async updateRecord(input: UpdateDnsRecordInput): Promise<DnsRecord & { id: string }> {
    this.ensureConfigured();
    const res = await fetch(`${this.baseUrl}/zones/${input.zoneId}/dns_records/${input.recordId}`, {
      method: 'PATCH',
      headers: this.headers(),
      body: JSON.stringify(input.record),
    });
    if (!res.ok) throw new AppError(502, 'PROVIDER_ERROR', 'Failed to update DNS record.');
    const json = await res.json() as { result: Record<string, unknown> };
    return {
      type: String(json.result['type']) as DnsRecord['type'],
      host: String(json.result['name']),
      value: String(json.result['content']),
      id: String(json.result['id']),
    };
  }

  async deleteRecord(input: DeleteDnsRecordInput): Promise<void> {
    this.ensureConfigured();
    const res = await fetch(`${this.baseUrl}/zones/${input.zoneId}/dns_records/${input.recordId}`, {
      method: 'DELETE',
      headers: this.headers(),
    });
    if (!res.ok) throw new AppError(502, 'PROVIDER_ERROR', 'Failed to delete DNS record.');
  }

  async verifyDomain(input: VerifyDomainInput): Promise<VerificationResult> {
    let actualRecords: DnsRecord[] = [];
    try {
      actualRecords = await this.getRecords(input.domain);
    } catch (err) {
      logger.warn({ err: String(err), domain: input.domain }, 'Cloudflare getRecords failed, falling back to pending');
      return {
        domain: input.domain,
        verified: false,
        records: input.expectedRecords.map((r) => ({ record: r, status: 'pending' as const })),
      };
    }

    const normalize = (s: string) => s.replace(/\s+/g, ' ').trim().toLowerCase();
    const results = input.expectedRecords.map((expected) => {
      const expectedHost = expected.host === '@' ? input.domain : `${expected.host}.${input.domain}`;
      const found = actualRecords.find((a) => {
        if (a.type !== expected.type) return false;
        const actualHost = a.host.toLowerCase().replace(/\.$/, '');
        if (actualHost !== expectedHost.toLowerCase() && !actualHost.endsWith(`.${expected.host.toLowerCase()}`) && a.host !== expected.host) return false;
        return normalize(a.value) === normalize(expected.value) || normalize(a.value).includes(normalize(expected.value));
      });
      return { record: expected, status: found ? ('verified' as const) : ('missing' as const), actual: found?.value };
    });

    const required = results.filter((r) => r.record.host !== '_dmarc');
    const verified = required.length ? required.every((r) => r.status === 'verified') : results.every((r) => r.status === 'verified');
    return { domain: input.domain, verified, records: results };
  }

  private async findZoneId(domain: string): Promise<string> {
    const res = await fetch(`${this.baseUrl}/zones?name=${encodeURIComponent(domain)}`, { headers: this.headers() });
    if (!res.ok) throw new AppError(502, 'PROVIDER_ERROR', 'Failed to find Cloudflare zone.');
    const json = await res.json() as { result: Array<Record<string, unknown>> };
    if (!json.result.length) throw new AppError(404, 'NOT_FOUND', `No Cloudflare zone found for ${domain}. Connect your domain to Cloudflare first.`);
    return String(json.result[0]['id']);
  }
}

export class ManualDnsProvider implements DnsProvider {
  readonly name = 'manual';
  async getRecords(): Promise<DnsRecord[]> { return []; }
  async createRecord(): Promise<DnsRecord & { id: string }> { throw new AppError(400, 'ENTITLEMENT_DENIED', 'Manual DNS requires you to add records at your registrar.'); }
  async updateRecord(): Promise<DnsRecord & { id: string }> { throw new AppError(400, 'ENTITLEMENT_DENIED', 'Manual DNS update not supported.'); }
  async deleteRecord(): Promise<void> { throw new AppError(400, 'ENTITLEMENT_DENIED', 'Manual DNS delete not supported.'); }

  private normalizeTxt(value: string): string {
    return value.replace(/\s+/g, ' ').trim().replace(/^"|"$/g, '');
  }

  private async resolveWithTimeout<T>(fn: () => Promise<T>, ms = 4000): Promise<T> {
    return Promise.race([
      fn(),
      new Promise<never>((_, reject) => setTimeout(() => reject(new Error('DNS timeout')), ms)),
    ]);
  }

  async verifyDomain(input: VerifyDomainInput): Promise<VerificationResult> {
    const { promises: dns } = await import('dns');
    const results: VerificationResult['records'] = [];

    for (const rec of input.expectedRecords) {
      let status: VerificationResult['records'][number]['status'] = 'pending';
      let actual: string | undefined;
      const fqdn = rec.host === '@' ? input.domain : `${rec.host}.${input.domain}`;
      const expectedNorm = this.normalizeTxt(rec.value);

      // Try system DNS first, then DoH fallback
      try {
        if (rec.type === 'MX') {
          let mx: Array<{ exchange: string; priority: number }> = [];
          try {
            mx = await this.resolveWithTimeout(() => dns.resolveMx(input.domain));
          } catch {
            // DoH fallback for MX via Cloudflare
            try {
              const r = await fetch(`https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(input.domain)}&type=MX`, { headers: { accept: 'application/dns-json' } });
              const j = await r.json() as { Answer?: Array<{ data: string }> };
              if (j.Answer) mx = j.Answer.map((a) => ({ exchange: a.data.split(' ').pop()?.replace(/\.$/, '') ?? '', priority: parseInt(a.data.split(' ')[0] ?? '10', 10) }));
            } catch {}
          }
          const match = mx.some((m) => m.exchange.toLowerCase() === expectedNorm.toLowerCase() || m.exchange.toLowerCase().includes(expectedNorm.toLowerCase()) || expectedNorm.toLowerCase().includes(m.exchange.toLowerCase()));
          if (mx.length === 0) status = 'pending';
          else status = match ? 'verified' : 'missing';
          actual = mx.map((m) => `${m.priority} ${m.exchange}`).join(', ');
        } else if (rec.type === 'TXT') {
          let txts: string[][] = [];
          try {
            txts = await this.resolveWithTimeout(() => dns.resolveTxt(fqdn));
          } catch {
            try {
              const r = await fetch(`https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(fqdn)}&type=TXT`, { headers: { accept: 'application/dns-json' } });
              const j = await r.json() as { Answer?: Array<{ data: string }> };
              if (j.Answer) txts = j.Answer.map((a) => [a.data.replace(/^"|"$/g, '').replace(/"; "/g, '')]);
            } catch {}
          }
          const flat = txts.flat().map((s) => this.normalizeTxt(s)).join(' ');
          actual = flat;
          if (!txts.length) status = 'pending';
          else {
            // For SPF/DKIM, check includes with normalization (case-insensitive for SPF)
            const includes = flat.toLowerCase().includes(expectedNorm.toLowerCase());
            const exact = flat === expectedNorm;
            status = includes || exact ? 'verified' : 'missing';
          }
        } else if (rec.type === 'CNAME') {
          try {
            const cname = await this.resolveWithTimeout(() => dns.resolveCname(fqdn));
            actual = cname.join(', ');
            status = cname.some((c) => c.toLowerCase() === expectedNorm.toLowerCase()) ? 'verified' : 'missing';
          } catch {
            status = 'pending';
          }
        } else {
          // For A/CNAME etc., treat as pending if not implemented
          status = 'pending';
        }
      } catch (err) {
        logger.warn({ err: String(err), domain: input.domain, host: rec.host }, 'DNS verify failed, marking pending for retry');
        status = 'pending';
      }
      results.push({ record: rec, status, actual });
    }

    // Never consider _dmarc missing as blocking for verified if all other records verified
    const required = results.filter((r) => r.record.host !== '_dmarc');
    const verified = required.length > 0 ? required.every((r) => r.status === 'verified') : results.every((r) => r.status === 'verified');
    return { domain: input.domain, verified, records: results };
  }
}

export const dnsProvider: DnsProvider = env.CLOUDFLARE_API_TOKEN ? new CloudflareDnsProvider() : new ManualDnsProvider();
