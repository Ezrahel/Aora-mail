import type { ProviderDomain, ProviderDnsRecords, ProviderMailbox } from '../email-provider.interface';

// Normalize MXroute responses (which vary) into our internal provider models.
// MXroute API docs: https://api.mxroute.com/docs

export function mapMxrouteDomain(raw: unknown): ProviderDomain {
  const r = raw as Record<string, unknown>;
  return {
    id: String(r['id'] ?? r['domain'] ?? r['name'] ?? ''),
    name: String(r['domain'] ?? r['name'] ?? ''),
    status: String(r['status'] ?? 'active'),
    verificationKey: r['verification_key'] ? String(r['verification_key']) : undefined,
  };
}

export function mapMxrouteDns(raw: unknown): ProviderDnsRecords {
  const r = raw as Record<string, unknown>;
  // Support multiple possible MXroute shapes; fallback to safe defaults
  const mxRaw = (r['mx'] ?? r['mx_records'] ?? []) as unknown[];
  const mx = mxRaw.length ? mxRaw.map((m) => {
    const o = m as Record<string, unknown>;
    return { host: String(o['host'] ?? '@'), value: String(o['value'] ?? o['exchange'] ?? ''), priority: Number(o['priority'] ?? 10) };
  }) : [{ host: '@', value: 'mail.aora.ng', priority: 10 }];

  const spf = String(r['spf'] ?? r['spf_record'] ?? 'v=spf1 include:mxroute.com ~all');
  const dkimRaw = (r['dkim'] ?? r['dkim_records'] ?? []) as unknown[];
  const dkim = dkimRaw.length ? dkimRaw.map((k) => {
    const o = k as Record<string, unknown>;
    return { selector: String(o['selector'] ?? 'default'), value: String(o['value'] ?? o['record'] ?? '') };
  }) : [{ selector: 'default', value: 'v=DKIM1; k=rsa; p=MIGfMA0...' }];

  return {
    mx,
    spf,
    dkim,
    dmarc: r['dmarc'] ? String(r['dmarc']) : 'v=DMARC1; p=quarantine; rua=mailto:dmarc@aora.ng',
    verificationTxt: r['verification_txt'] ? { host: String((r['verification_txt'] as Record<string,unknown>)['host'] ?? '_aora-verify'), value: String((r['verification_txt'] as Record<string,unknown>)['value'] ?? '') } : undefined,
  };
}

export function mapMxrouteMailbox(raw: unknown): ProviderMailbox {
  const r = raw as Record<string, unknown>;
  const quotaMb = Number(r['quota'] ?? r['quota_mb'] ?? 5120);
  const usedMb = Number(r['used'] ?? r['usage_mb'] ?? 0);
  return {
    id: String(r['id'] ?? r['email'] ?? ''),
    email: String(r['email'] ?? r['address'] ?? ''),
    quotaBytes: quotaMb * 1024 * 1024,
    usedBytes: usedMb * 1024 * 1024,
    status: (String(r['status'] ?? 'active') as ProviderMailbox['status']) ?? 'active',
  };
}
