describe('domain validation', () => {
  function isValidDomain(name: string): boolean {
    return /^[a-z0-9.-]+\.[a-z]{2,}$/i.test(name) && name.length <= 253;
  }
  it('accepts valid domains', () => {
    expect(isValidDomain('company.com')).toBe(true);
    expect(isValidDomain('aora.ng')).toBe(true);
    expect(isValidDomain('my-company.co.uk')).toBe(true);
  });
  it('rejects invalid domains', () => {
    expect(isValidDomain('')).toBe(false);
    expect(isValidDomain('not a domain')).toBe(false);
    expect(isValidDomain('a'.repeat(254) + '.com')).toBe(false);
  });
});

describe('local part validation', () => {
  function validLocal(part: string): boolean {
    return /^[a-z0-9._-]+$/i.test(part) && part.length >= 1 && part.length <= 64;
  }
  it('allows valid local parts', () => {
    expect(validLocal('info')).toBe(true);
    expect(validLocal('sales.team')).toBe(true);
  });
  it('rejects invalid', () => {
    expect(validLocal('')).toBe(false);
    expect(validLocal('a'.repeat(65))).toBe(false);
    expect(validLocal('bad!')).toBe(false);
  });
});
