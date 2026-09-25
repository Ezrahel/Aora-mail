import type { EmailProvider } from '../email-provider.interface';
export class TitanProvider implements EmailProvider {
  readonly name = 'titan';
  async createDomain() { throw new Error('Titan provider not yet configured'); }
  async deleteDomain() { throw new Error('Titan provider not yet configured'); }
  async getDomain() { throw new Error('Titan provider not yet configured'); }
  async getDomainDns() { throw new Error('Titan provider not yet configured'); }
  async createMailbox() { throw new Error('Titan provider not yet configured'); }
  async updateMailbox() { throw new Error('Titan provider not yet configured'); }
  async deleteMailbox() { throw new Error('Titan provider not yet configured'); }
  async suspendMailbox() { throw new Error('Titan provider not yet configured'); }
  async unsuspendMailbox() { throw new Error('Titan provider not yet configured'); }
  async createForwarder() { throw new Error('Titan provider not yet configured'); }
  async deleteForwarder() { throw new Error('Titan provider not yet configured'); }
  async getUsage() { throw new Error('Titan provider not yet configured'); }
}
