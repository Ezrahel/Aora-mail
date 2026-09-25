import { canCreateMailbox, canCreateDomain, calculateQuotaBytes } from '../../src/modules/plans/plans.service';
import type { PlanEntitlements } from '../../src/modules/plans/plans.service';

describe('entitlements', () => {
  const starter: PlanEntitlements = { maxMailboxes: 1, maxDomains: 1, mailboxQuotaGb: 5, aliasesAllowed: false, forwardingAllowed: false, migrationIncluded: false };
  const business: PlanEntitlements = { maxMailboxes: 5, maxDomains: 2, mailboxQuotaGb: 10, aliasesAllowed: true, forwardingAllowed: true, migrationIncluded: false };

  it('enforces mailbox limits', () => {
    expect(canCreateMailbox(starter, 0)).toBe(true);
    expect(canCreateMailbox(starter, 1)).toBe(false);
    expect(canCreateMailbox(business, 4)).toBe(true);
    expect(canCreateMailbox(business, 5)).toBe(false);
  });

  it('enforces domain limits', () => {
    expect(canCreateDomain(starter, 0)).toBe(true);
    expect(canCreateDomain(starter, 1)).toBe(false);
    expect(canCreateDomain(business, 1)).toBe(true);
    expect(canCreateDomain(business, 2)).toBe(false);
  });

  it('calculates quota bytes correctly', () => {
    expect(calculateQuotaBytes(starter)).toBe(5 * 1024 * 1024 * 1024);
    expect(calculateQuotaBytes(business)).toBe(10 * 1024 * 1024 * 1024);
  });
});
