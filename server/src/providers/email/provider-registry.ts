import type { EmailProvider } from './email-provider.interface';
import { emailProvider as mxrouteProvider } from './mxroute/mxroute.provider';

// Application modules depend on this contract, never a concrete provider.
// Provider choice can later be made per ProviderAccount without changing callers.
let activeProvider: EmailProvider = mxrouteProvider;
export function getEmailProvider(): EmailProvider { return activeProvider; }
export function setEmailProvider(provider: EmailProvider): void { activeProvider = provider; }
