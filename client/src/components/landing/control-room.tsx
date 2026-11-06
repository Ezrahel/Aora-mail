"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { ArrowRight, Plus, Trash2 } from "lucide-react";
import { useRef, useState } from "react";
import { previewDomain, useTypedDomain } from "@/lib/scene/address";
import { usePrefersStillness } from "@/lib/scene/motion";
import { firePulse } from "@/lib/scene/store";
import { Reveal } from "./reveal";

const LIMIT = 5;
const CANDIDATES = ["sales", "accounts", "support", "admin"];
const PER_MAILBOX_GB = 10;

/**
 * A working miniature of the dashboard. It starts tipped back in perspective
 * and stands up as it scrolls into place.
 */
export function ControlRoom() {
  const frame = useRef<HTMLDivElement>(null);
  const domain = previewDomain(useTypedDomain());
  const still = usePrefersStillness();
  const [mailboxes, setMailboxes] = useState(["hello", "info"]);
  const [forwarding, setForwarding] = useState(true);

  const { scrollYProgress } = useScroll({ target: frame, offset: ["start end", "center center"] });
  const rotateX = useTransform(scrollYProgress, [0, 1], [still ? 0 : 34, 0]);
  const scale = useTransform(scrollYProgress, [0, 1], [still ? 1 : 0.9, 1]);

  const nextName = CANDIDATES.find((name) => !mailboxes.includes(name));
  const atLimit = mailboxes.length >= LIMIT || !nextName;
  const used = mailboxes.length * 1.2;
  const total = mailboxes.length * PER_MAILBOX_GB;

  function addMailbox() {
    if (atLimit || !nextName) return;
    setMailboxes((list) => [...list, nextName]);
    firePulse();
  }

  return (
    <section id="product" data-scene={3} className="relative py-24 sm:py-32">
      <div className="mx-auto max-w-[1240px] px-5 sm:px-8">
        <Reveal className="max-w-[34rem]">
          <p className="eyebrow">After setup</p>
          <h2 className="text-title mt-5 text-ink">A calm control room for everything else.</h2>
          <p className="mt-5 text-[17px] leading-7 text-muted">
            Add a teammate, redirect an address, check your storage. It takes a click, not a support ticket.
          </p>
        </Reveal>

        <div className="mt-[22vh] [perspective:1400px] sm:mt-[30vh]">
          <motion.div ref={frame} style={{ rotateX, scale, transformOrigin: "50% 100%" }} className="panel crosshair rounded-lg bg-surface! shadow-float">
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <p className="font-mono text-xs text-muted">aora / {domain}</p>
              <p className="flex items-center gap-2 font-mono text-[11px] text-ink"><span className="live-dot" /> Preview, try it</p>
            </div>

            <div className="grid lg:grid-cols-[1.35fr_1fr]">
              <div className="border-b border-border p-5 lg:border-b-0 lg:border-r">
                <div className="flex items-center justify-between">
                  <p className="eyebrow">Mailboxes {mailboxes.length}/{LIMIT}</p>
                  <button
                    type="button"
                    onClick={addMailbox}
                    disabled={atLimit}
                    className="inline-flex h-8 items-center gap-1.5 rounded-md border border-border px-2.5 text-xs font-medium text-ink transition hover:border-border-strong disabled:opacity-40"
                  >
                    <Plus className="size-3.5" /> Add mailbox
                  </button>
                </div>
                <ul className="mt-4 divide-y divide-border border-y border-border">
                  {mailboxes.map((name) => (
                    <motion.li key={name} layout initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="flex items-center justify-between gap-3 py-3">
                      <span className="min-w-0 truncate font-mono text-[13px] text-ink">{name}@{domain}</span>
                      <span className="flex shrink-0 items-center gap-3">
                        <span className="hidden text-xs text-muted sm:inline">{PER_MAILBOX_GB} GB</span>
                        <span className="flex items-center gap-1.5 text-xs text-accent"><span className="live-dot size-1.5!" />Active</span>
                        <button
                          type="button"
                          aria-label={`Remove ${name}`}
                          disabled={mailboxes.length === 1}
                          onClick={() => setMailboxes((list) => list.filter((item) => item !== name))}
                          className="text-muted-2 transition hover:text-danger disabled:opacity-30"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      </span>
                    </motion.li>
                  ))}
                </ul>
              </div>

              <div className="grid content-start divide-y divide-border">
                <div className="p-5">
                  <div className="flex items-center justify-between">
                    <p className="eyebrow">Forwarding</p>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={forwarding}
                      aria-label="Forward info to hello"
                      onClick={() => { setForwarding((value) => !value); firePulse(); }}
                      className={`relative h-5 w-9 rounded-sm border transition ${forwarding ? "border-accent/50 bg-accent/20" : "border-border-strong bg-transparent"}`}
                    >
                      <span className={`absolute top-[3px] size-3 rounded-[1px] transition-all ${forwarding ? "left-[19px] bg-accent" : "left-[3px] bg-muted"}`} />
                    </button>
                  </div>
                  <p className="mt-4 flex flex-wrap items-center gap-2 font-mono text-[13px]">
                    <span className="text-ink">info@</span>
                    <ArrowRight className={`size-3.5 transition-colors ${forwarding ? "text-accent" : "text-muted-2"}`} />
                    <span className={forwarding ? "text-ink" : "text-muted-2 line-through"}>hello@</span>
                  </p>
                </div>
                <div className="p-5">
                  <div className="flex items-baseline justify-between">
                    <p className="eyebrow">Storage</p>
                    <p className="font-mono text-xs text-muted">{used.toFixed(1)} of {total} GB</p>
                  </div>
                  <div className="mt-4 h-1 bg-white/10"><div className="h-full bg-accent transition-all duration-700" style={{ width: `${(used / total) * 100}%` }} /></div>
                </div>
                <div className="flex items-center justify-between gap-4 p-5">
                  <div><p className="eyebrow">Domain</p><p className="mt-3 truncate font-mono text-[13px] text-ink">{domain}</p></div>
                  <p className="font-mono text-xs text-accent">Verified</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        <div className="mt-20 grid gap-px border border-border bg-border sm:grid-cols-2 lg:grid-cols-4">
          {[
            ["Your domain, not ours", "Send from your own name. Customers see you, not a free inbox."],
            ["Works where you work", "Webmail, Outlook, Apple Mail and your phone, over IMAP and SMTP."],
            ["Aliases and forwarding", "Point info@ wherever it needs to go, and change your mind later."],
            ["Spam protection", "Junk gets filtered, and your own mail is signed so it gets through."],
          ].map(([title, body], index) => (
            <Reveal key={title} delay={index * 0.05} className="bg-background p-6">
              <h3 className="text-[15px] font-medium text-ink">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-muted">{body}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
