export type RecordId = "mx" | "spf" | "dkim" | "dmarc";

export const RECORD_ORDER: RecordId[] = ["mx", "spf", "dkim", "dmarc"];

export const RECORD_INFO: Record<RecordId, { label: string; job: string }> = {
  mx: { label: "MX", job: "Tells the internet where to deliver your mail" },
  spf: { label: "SPF", job: "Lists who is allowed to send as you" },
  dkim: { label: "DKIM", job: "Signs each message so it can't be altered" },
  dmarc: { label: "DMARC", job: "Says what to do with anything that fails" },
};

const CHECKS: Record<RecordId, RegExp> = {
  mx: /^@\s+MX\s+\d+\s+mail\.aora\.email\.?\s*$/m,
  spf: /^@\s+TXT\s+"v=spf1\b[^"]*\binclude:spf\.aora\.email\b[^"]*[~-]all"\s*$/m,
  dkim: /^\S*\._domainkey\s+TXT\s+"v=DKIM1;[^"]*\bp=[A-Za-z0-9+/]{8,}[^"]*"\s*$/m,
  dmarc: /^_dmarc\s+TXT\s+"v=DMARC1;\s*p=(none|quarantine|reject)\b[^"]*"\s*$/m,
};

/** Line fragments swapped out by the "break it" buttons, for touch visitors. */
const BREAKS: Record<RecordId, [string, string]> = {
  mx: ["mail.aora.email.", "mail.oldhost.example."],
  spf: ["include:spf.aora.email ", ""],
  dkim: ["p=MIIBIjANBgkqhkiG9w0", "p="],
  dmarc: ["v=DMARC1; p=none", "v=DMARC1; p=maybe"],
};

export function zoneFile(domain: string) {
  return [
    `; ${domain}: the four records that make email work`,
    `@                 MX   10 mail.aora.email.`,
    `@                 TXT  "v=spf1 include:spf.aora.email ~all"`,
    `aora._domainkey   TXT  "v=DKIM1; k=rsa; p=MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8A"`,
    `_dmarc            TXT  "v=DMARC1; p=none; rua=mailto:dmarc@${domain}"`,
  ].join("\n");
}

export type ZoneHealth = Record<RecordId, boolean>;

export function checkZone(text: string): ZoneHealth {
  return {
    mx: CHECKS.mx.test(text),
    spf: CHECKS.spf.test(text),
    dkim: CHECKS.dkim.test(text),
    dmarc: CHECKS.dmarc.test(text),
  };
}

/** Flips one record between its working and broken form. */
export function toggleRecord(text: string, record: RecordId, domain: string) {
  const [good, bad] = BREAKS[record];
  if (checkZone(text)[record]) return text.replace(good, bad);
  const repaired = zoneFile(domain).split("\n");
  const lines = text.split("\n");
  const row = RECORD_ORDER.indexOf(record) + 1;
  lines[row] = repaired[row];
  return lines.join("\n");
}

export type Verdict = { tone: "good" | "warn" | "fail"; headline: string; detail: string };

/** What a customer would actually experience with the zone in this state. */
export function verdictFor(health: ZoneHealth, domain: string): Verdict {
  if (!health.mx) {
    return { tone: "fail", headline: "Mail bounces", detail: `Nothing knows where to deliver mail for ${domain}.` };
  }
  if (!health.spf || !health.dkim) {
    return { tone: "warn", headline: "Headed for spam", detail: "Mail arrives, but receivers can't confirm it really came from you." };
  }
  if (!health.dmarc) {
    return { tone: "warn", headline: "Open to spoofing", detail: "Mail flows, but nothing stops someone sending in your name." };
  }
  return { tone: "good", headline: "Delivered to the inbox", detail: "All four records check out. This is what verified looks like." };
}
