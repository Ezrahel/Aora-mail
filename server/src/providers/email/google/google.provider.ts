import type { EmailProvider } from '../email-provider.interface';
export class GoogleProvider implements EmailProvider {
  readonly name = 'google';
  async createDomain() { throw new Error('Google Workspace provider not yet configured'); }
  async deleteDomain() { throw new Error('Google Workspace provider not yet configured'); }
  async getDomain() { throw new Error('Google Workspace provider not yet configured'); }
  async getDomainDns() { throw new Error('Google Workspace provider not yet configured'); }
  async createMailbox() { throw new Error('Google Workspace provider not yet configured'); }
  async updateMailbox() { throw new Error('Google Workspace provider not yet configured'); }
  async deleteMailbox() { throw new Error('Google Workspace provider not yet configured'); }
  async suspendMailbox() { throw new Error('Google Workspace provider not yet configured'); }
  async unsuspendMailbox() { throw new Error('Google Workspace provider not yet configured'); }
  async createForwarder() { throw new Error('Google Workspace provider not yet configured'); }
  async deleteForwarder() { throw new Error('Google Workspace provider not yet configured'); }
  async getUsage() { throw new Error('Google Workspace provider not yet configured'); }
}
