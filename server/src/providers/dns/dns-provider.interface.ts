export interface DnsRecord {
  type: 'MX' | 'TXT' | 'CNAME' | 'A' | 'SRV';
  host: string;
  value: string;
  priority?: number;
  ttl?: number;
}

export interface CreateDnsRecordInput {
  domain: string;
  zoneId?: string;
  record: DnsRecord;
}

export interface UpdateDnsRecordInput {
  recordId: string;
  zoneId: string;
  record: Partial<DnsRecord>;
}

export interface DeleteDnsRecordInput {
  recordId: string;
  zoneId: string;
}

export interface VerifyDomainInput {
  domain: string;
  expectedRecords: DnsRecord[];
}

export type DnsStatus = 'missing' | 'pending' | 'configured' | 'verified' | 'error';

export interface VerificationResult {
  domain: string;
  verified: boolean;
  records: { record: DnsRecord; status: DnsStatus; actual?: string }[];
}

export interface DnsProvider {
  readonly name: string;
  getRecords(domain: string, zoneId?: string): Promise<DnsRecord[]>;
  createRecord(input: CreateDnsRecordInput): Promise<DnsRecord & { id: string }>;
  updateRecord(input: UpdateDnsRecordInput): Promise<DnsRecord & { id: string }>;
  deleteRecord(input: DeleteDnsRecordInput): Promise<void>;
  verifyDomain(input: VerifyDomainInput): Promise<VerificationResult>;
}
