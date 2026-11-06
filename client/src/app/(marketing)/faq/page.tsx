import type { Metadata } from "next";
import { faqGraph, JsonLd } from "@/lib/seo/json-ld";
import { publicPage } from "@/lib/seo/metadata";

export const metadata: Metadata = publicPage({
  title: "Business Email FAQ",
  description: "Straight answers about business email: using your own domain, DNS setup, mailbox limits, Outlook and Apple Mail, migration and cancellation.",
  path: "/faq",
});

const FAQS: Array<{ q: string; a: string }> = [
  { q: "What is business email?", a: "Business email is email on your own domain — for example info@yourcompany.ng — so customers recognize and trust your messages. It's the difference between looking established and looking temporary." },
  { q: "Can I use my existing domain?", a: "Yes. Add your domain in the dashboard and follow the DNS instructions we provide for that domain. We cover MX, SPF, DKIM and DMARC." },
  { q: "Can I buy a domain through the platform?", a: "Domain purchase availability depends on configuration. You can always connect a domain registered elsewhere — any registrar works." },
  { q: "How many email addresses can I create?", a: "It depends on your plan. Starter includes 1 mailbox, Business up to 5, and Pro up to 10. Exact limits are shown on Pricing and enforced at creation." },
  { q: "Can I use Gmail/Outlook/Apple Mail with my mailbox?", a: "Yes. Each mailbox includes IMAP and SMTP settings for Outlook, Apple Mail, Thunderbird, Android, iPhone. Webmail is also available." },
  { q: "Do you help configure DNS?", a: "Yes. We show the exact records you need, explain what each one does, and let you verify when they are live. One-click copy, clear status." },
  { q: "Can I migrate from another provider?", a: "Migration assistance is available on higher plans. Contact support after signup to discuss your current setup and timeline." },
  { q: "What happens if I cancel?", a: "Cancellation and retention policies are configurable. Typically, access continues until the end of the paid period; confirm details in your subscription settings." },
];

export default function FaqPage() {
  return (
    <div data-scene={5} className="mx-auto min-h-[100svh] max-w-[1240px] px-5 pb-24 pt-[42svh] sm:px-8 lg:pt-40">
      <JsonLd data={faqGraph(FAQS)} />
      <div className="max-w-[40rem]">
        <p className="eyebrow rise">FAQ</p>
        <h1 className="text-display rise mt-6 text-ink" style={{ "--i": 1 } as React.CSSProperties}>Straight answers.</h1>
        <p className="rise mt-6 text-[17px] leading-7 text-muted" style={{ "--i": 2 } as React.CSSProperties}>For CEOs, marketers and operations teams, with no jargon. Policies marked as configurable are finalized in your account terms.</p>

        <div className="panel rise mt-12 rounded-lg" style={{ "--i": 3 } as React.CSSProperties}>
          {FAQS.map((item) => (
            <details key={item.q} className="group border-b border-border last:border-0">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 text-[15px] font-medium text-ink marker:content-none">
                {item.q}
                <span aria-hidden className="font-mono text-lg leading-none text-muted transition-transform duration-300 group-open:rotate-45 group-open:text-accent">+</span>
              </summary>
              <p className="px-5 pb-5 text-sm leading-6 text-muted">{item.a}</p>
            </details>
          ))}
        </div>
      </div>
    </div>
  );
}
