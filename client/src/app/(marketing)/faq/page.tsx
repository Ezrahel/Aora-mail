import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "FAQ",
  description: "Answers about business email, domains, DNS, clients, and billing.",
};

const FAQS: Array<{ q: string; a: string; accent: string }> = [
  { q: "What is business email?", a: "Business email is email on your own domain — for example info@yourcompany.ng — so customers recognize and trust your messages. It's the difference between looking established and looking temporary.", accent: "#16FF00" },
  { q: "Can I use my existing domain?", a: "Yes. Add your domain in the dashboard and follow the DNS instructions we provide for that domain. We handle MX, SPF, DKIM, DMARC.", accent: "#0A84FF" },
  { q: "Can I buy a domain through the platform?", a: "Domain purchase availability depends on configuration. You can always connect a domain registered elsewhere — any registrar works.", accent: "#BF5AF2" },
  { q: "How many email addresses can I create?", a: "It depends on your plan. Starter includes 1 mailbox, Business up to 5, and Pro up to 10. Exact limits are shown on Pricing and enforced at creation.", accent: "#FF9F0A" },
  { q: "Can I use Gmail/Outlook/Apple Mail with my mailbox?", a: "Yes. Each mailbox includes IMAP and SMTP settings for Outlook, Apple Mail, Thunderbird, Android, iPhone. Webmail is also available.", accent: "#64D2FF" },
  { q: "Do you help configure DNS?", a: "Yes. We show the exact records you need, explain what each one does, and let you verify when they are live. One-click copy, clear status.", accent: "#16FF00" },
  { q: "Can I migrate from another provider?", a: "Migration assistance is available on higher plans. Contact support after signup to discuss your current setup and timeline.", accent: "#BF5AF2" },
  { q: "What happens if I cancel?", a: "Cancellation and retention policies are configurable. Typically, access continues until the end of the paid period; confirm details in your subscription settings.", accent: "#0A84FF" },
];

export default function FaqPage() {
  return (
    <div className="relative overflow-hidden">
      <div className="absolute inset-0 mesh-bg-dark -z-10" />
      <div className="mx-auto max-w-[900px] px-4 sm:px-6 py-12 sm:py-16">
        <div className="mx-auto max-w-2xl text-center">
          <div className="inline-flex rounded-full glass px-3 py-1 text-xs font-semibold text-ink">FAQ</div>
          <h1 className="mt-4 text-title text-ink">Straight answers.</h1>
          <p className="mt-3 text-[15px] text-muted">For CEOs, marketers, and ops — no jargon. Policies marked as configurable will be finalized in your account terms.</p>
        </div>

        <div className="mt-10 overflow-hidden rounded-[28px] border border-border bg-surface shadow-float">
          {FAQS.map((item) => (
            <details key={item.q} className="group border-b border-border last:border-0 open:bg-white/[0.04]">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-6 py-5 marker:content-none">
                <span className="flex items-center gap-3 font-medium text-ink">
                  <span className="size-2 rounded-full" style={{ background: item.accent, boxShadow: `0 0 8px ${item.accent}` }} />
                  {item.q}
                </span>
                <span className="flex size-7 shrink-0 items-center justify-center rounded-full border border-border bg-white/[0.05] text-muted transition group-open:rotate-45 group-open:bg-accent group-open:text-[#0a1f0a]">+</span>
              </summary>
              <p className="px-6 pb-5 pl-11 text-sm leading-relaxed text-muted">{item.a}</p>
            </details>
          ))}
        </div>
      </div>
    </div>
  );
}
