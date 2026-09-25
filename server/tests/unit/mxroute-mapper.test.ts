import { mapMxrouteDomain, mapMxrouteDns, mapMxrouteMailbox } from '../../src/providers/email/mxroute/mxroute.mapper';

describe('mxroute mapper', () => {
  it('maps domain', () => {
    const d = mapMxrouteDomain({ domain: 'example.com', status: 'active', verification_key: 'abc' });
    expect(d.name).toBe('example.com');
    expect(d.verificationKey).toBe('abc');
  });

  it('maps dns defaults', () => {
    const dns = mapMxrouteDns({});
    expect(dns.mx.length).toBeGreaterThan(0);
    expect(dns.spf).toContain('spf1');
    expect(dns.dkim.length).toBeGreaterThan(0);
  });

  it('maps mailbox', () => {
    const m = mapMxrouteMailbox({ email: 'info@example.com', quota: 5120, used: 100, status: 'active' });
    expect(m.email).toBe('info@example.com');
    expect(m.quotaBytes).toBe(5120 * 1024 * 1024);
  });
});
