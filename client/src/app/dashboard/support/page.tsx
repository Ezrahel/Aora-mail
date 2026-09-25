import type { Metadata } from "next";
import { SITE } from "@/lib/constants/site";

export const metadata: Metadata = {
  title: "Support",
  robots: { index: false, follow: false },
};

export default function SupportPage() {
  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-ink">Support</h1>
        <p className="mt-1 text-sm text-muted">
          We help Nigerian businesses get email working — domains, DNS, and clients.
        </p>
      </div>
      <section className="rounded-md border border-border bg-white p-5">
        <p className="text-sm font-medium text-ink">Email support</p>
        <a
          href={`mailto:${SITE.supportEmail}`}
          className="mt-2 inline-block text-sm text-ink underline underline-offset-4"
        >
          {SITE.supportEmail}
        </a>
        <p className="mt-4 text-sm text-muted">
          Include your business name, domain, and a short description of the issue.
          Do not send passwords or provider credentials.
        </p>
      </section>
      <section className="rounded-md border border-border bg-white p-5">
        <p className="text-sm font-medium text-ink">Common topics</p>
        <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-muted">
          <li>DNS records not verifying</li>
          <li>Connecting Outlook or Apple Mail</li>
          <li>Mailbox password resets</li>
          <li>Plan upgrades and invoices</li>
        </ul>
      </section>
    </div>
  );
}
