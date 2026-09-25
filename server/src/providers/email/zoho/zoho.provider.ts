// Future provider stub — implements EmailProvider without rewriting frontend
// See providers/email/email-provider.interface.ts
import type { EmailProvider } from '../email-provider.interface';

export class ZohoProvider implements EmailProvider {
  readonly name = 'zoho';
  // Stub — replace with Zoho Mail API when onboarded
  async createDomain() { throw new Error('Zoho provider not yet configured — use MXRoute'); }
  async deleteDomain() { throw new Error('Zoho provider not yet configured'); }
  async getDomain() { throw new Error('Zoho provider not yet configured'); }
  async getDomainDns() { throw new Error('Zoho provider not yet configured'); }
  async createMailbox() { throw new Error('Zoho provider not yet configured'); }
  async updateMailbox() { throw new Error('Zoho provider not yet configured'); }
  async deleteMailbox() { throw new Error('Zoho provider not yet configured'); }
  async suspendMailbox() { throw new Error('Zoho provider not yet configured'); }
  async unsuspendMailbox() { throw new Error('Zoho provider not yet configured'); }
  async createForwarder() { throw new Error('Zoho provider not yet configured'); }
  async deleteForwarder() { throw new Error('Zoho provider not yet configured'); }
  async getUsage() { throw new Error('Zoho provider not yet configured'); }
}
