"use client";
import { SITE } from "@/lib/constants/site";
import { useState } from "react";
import { api } from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export default function SupportPage() {
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  async function submit(): Promise<void> {
    if (!subject.trim() || !message.trim()) { toast.error("Add a subject and message."); return; }
    setSending(true);
    try { await api.createSupportTicket({ subject, message }); setSubject(""); setMessage(""); toast.success("Support request sent."); }
    catch { toast.error("We could not send your request. Please try again."); }
    finally { setSending(false); }
  }
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
        <h2 className="font-medium text-ink">Open a support request</h2>
        <p className="mt-1 text-sm text-muted">Do not include passwords or payment details.</p>
        <div className="mt-4 space-y-3">
          <Input aria-label="Subject" value={subject} onChange={(event) => setSubject(event.target.value)} placeholder="What can we help with?" />
          <textarea aria-label="Message" value={message} onChange={(event) => setMessage(event.target.value)} className="min-h-28 w-full rounded-md border border-border p-3 text-sm" placeholder="Tell us what happened and which domain is affected." />
          <Button loading={sending} onClick={() => void submit()}>Send request</Button>
        </div>
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
