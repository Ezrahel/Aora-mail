export interface CreateDomainInput {
  domain: string;
  idempotencyKey?: string;
}

export interface ProviderDomain {
  id: string;
  name: string;
  status: string;
  verificationKey?: string;
}

export interface DeleteDomainInput {
  domain: string;
  providerDomainId?: string;
}

export interface GetDomainInput {
  domain: string;
}

export interface GetDomainDnsInput {
  domain: string;
}

export interface ProviderDnsRecords {
  mx: { host: string; value: string; priority: number }[];
  spf: string;
  dkim: { selector: string; value: string }[];
  dmarc?: string;
  verificationTxt?: { host: string; value: string };
}

export interface CreateMailboxInput {
  domain: string;
  localPart: string;
  password: string;
  quotaBytes: number;
  idempotencyKey?: string;
}

export interface UpdateMailboxInput {
  providerMailboxId: string;
  quotaBytes?: number;
  password?: string;
}

export interface ProviderMailbox {
  id: string;
  email: string;
  quotaBytes: number;
  usedBytes: number;
  status: 'active' | 'suspended' | 'pending' | 'error';
}

export interface DeleteMailboxInput {
  providerMailboxId: string;
}

export interface SuspendMailboxInput {
  providerMailboxId: string;
}

export interface UnsuspendMailboxInput {
  providerMailboxId: string;
}

export interface CreateForwarderInput {
  domain: string;
  source: string;
  destination: string;
}

export interface ProviderForwarder {
  id: string;
  source: string;
  destination: string;
}

export interface DeleteForwarderInput {
  forwarderId: string;
  domain: string;
  source: string;
}

export interface GetUsageInput {
  domain?: string;
  mailboxId?: string;
}

export interface ProviderUsage {
  totalQuotaBytes: number;
  usedBytes: number;
  mailboxCount: number;
  mailboxes: { id: string; email: string; usedBytes: number; quotaBytes: number }[];
}

export interface EmailProvider {
  readonly name: string;
  createDomain(input: CreateDomainInput): Promise<ProviderDomain>;
  deleteDomain(input: DeleteDomainInput): Promise<void>;
  getDomain(input: GetDomainInput): Promise<ProviderDomain>;
  getDomainDns(input: GetDomainDnsInput): Promise<ProviderDnsRecords>;

  createMailbox(input: CreateMailboxInput): Promise<ProviderMailbox>;
  updateMailbox(input: UpdateMailboxInput): Promise<ProviderMailbox>;
  deleteMailbox(input: DeleteMailboxInput): Promise<void>;
  suspendMailbox(input: SuspendMailboxInput): Promise<void>;
  unsuspendMailbox(input: UnsuspendMailboxInput): Promise<void>;

  createForwarder(input: CreateForwarderInput): Promise<ProviderForwarder>;
  deleteForwarder(input: DeleteForwarderInput): Promise<void>;

  getUsage(input: GetUsageInput): Promise<ProviderUsage>;
}
