import type { EmailProvider } from '../email-provider.interface';
export class MicrosoftProvider implements EmailProvider {
  readonly name = 'microsoft365';
  async createDomain() { throw new Error('Microsoft 365 provider not yet configured'); }
  async deleteDomain() { throw new Error('Microsoft 365 provider not yet configured'); }
  async getDomain() { throw new Error('Microsoft 365 provider not yet configured'); }
  async getDomainDns() { throw new Error('Microsoft 365 provider not yet configured'); }
  async createMailbox() { throw new Error('Microsoft 365 provider not yet configured'); }
  async updateMailbox() { throw new Error('Microsoft 365 provider not yet configured'); }
  async deleteMailbox() { throw new Error('Microsoft 365 provider not yet configured'); }
  async suspendMailbox() { throw new Error('Microsoft 365 provider not yet configured'); }
  async unsuspendMailbox() { throw new Error('Microsoft 365 provider not yet configured'); }
  async createForwarder() { throw new Error('Microsoft 365 provider not yet configured'); }
  async deleteForwarder() { throw new Error('Microsoft 365 provider not yet configured'); }
  async getUsage() { throw new Error('Microsoft 365 provider not yet configured'); }
}
