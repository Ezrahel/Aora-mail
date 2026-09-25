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
    // Compare expected vs actual via Cloudflare or fallback DNS lookup
    let actualRecords: DnsRecord[] = [];
    try {
      actualRecords = await this.getRecords(input.domain);
    } catch {
      // If Cloudflare not connected, return pending for all
      return {
        domain: input.domain,
        verified: false,
        records: input.expectedRecords.map((r) => ({ record: r, status: 'pending' as const })),
      };
    }

    const results = input.expectedRecords.map((expected) => {
      const found = actualRecords.find((a) => a.type === expected.type && a.host.includes(expected.host) && a.value.trim() === expected.value.trim());
      return { record: expected, status: found ? 'verified' as const : 'missing' as const, actual: found?.value };
    });

    const verified = results.every((r) => r.status === 'verified');
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
  async verifyDomain(input: VerifyDomainInput): Promise<VerificationResult> {
    // Perform DNS lookup via public DNS (using Node dns promises) — simplified: return pending
    // In production, use dns.resolveTxt / resolveMx
    const { promises: dns } = await import('dns');
    const results: VerificationResult['records'] = [];
    for (const rec of input.expectedRecords) {
      let status: VerificationResult['records'][number]['status'] = 'pending';
      try {
        if (rec.type === 'MX') {
          const mx = await dns.resolveMx(input.domain);
          const match = mx.some((m) => m.exchange === rec.value || m.exchange.includes(rec.value));
          status = match ? 'verified' : 'missing';
        } else if (rec.type === 'TXT') {
          const txt = await dns.resolveTxt(rec.host === '@' ? input.domain : `${rec.host}.${input.domain}`);
          const flat = txt.flat().join(' ');
          status = flat.includes(rec.value) ? 'verified' : 'missing';
        }
      } catch {
        status = 'pending';
      }
      results.push({ record: rec, status });
    }
    const verified = results.every((r) => r.status === 'verified');
    return { domain: input.domain, verified, records: results };
  }
}

export const dnsProvider: DnsProvider = env.CLOUDFLARE_API_TOKEN ? new CloudflareDnsProvider() : new ManualDnsProvider();
