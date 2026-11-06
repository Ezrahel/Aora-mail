"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, ChevronDown } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { cleanDomain, previewDomain, rememberPendingDomain, setTypedDomain, useTypedDomain } from "@/lib/scene/address";
import { firePulse } from "@/lib/scene/store";
import { cn } from "@/lib/formatting";

const AUDIENCES = ["your business.", "your shop.", "your studio.", "your firm."];
const LOCAL_PARTS = ["hello", "sales", "info", "admin"];

function RotatingWord() {
  const [index, setIndex] = useState(0);
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = setInterval(() => setIndex((value) => (value + 1) % AUDIENCES.length), 2800);
    return () => clearInterval(timer);
  }, []);
  return (
    <span aria-hidden className="relative block h-[1.08em] overflow-visible text-accent">
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={AUDIENCES[index]}
          className="absolute left-0 top-0 whitespace-nowrap"
          initial={{ opacity: 0, y: "0.28em", filter: "blur(14px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          exit={{ opacity: 0, y: "-0.28em", filter: "blur(14px)" }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        >
          {AUDIENCES[index]}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

export function Hero() {
  const router = useRouter();
  const typed = useTypedDomain();
  const [localPart, setLocalPart] = useState(LOCAL_PARTS[0]);
  const domain = previewDomain(typed);

  function onType(value: string) {
    setTypedDomain(value);
    firePulse();
  }

  function pickLocalPart(value: string) {
    setLocalPart(value);
    firePulse();
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (cleanDomain(typed)) rememberPendingDomain(domain);
    router.push("/register");
  }

  return (
    <section data-scene={0} className="relative flex min-h-[100svh] flex-col justify-end pb-10 pt-[36svh] lg:justify-center lg:pb-16 lg:pt-24">
      <div className="mx-auto w-full max-w-[1240px] px-5 sm:px-8">
        <div className="max-w-[640px]">
          <p className="eyebrow rise flex items-center gap-2.5"><span className="live-dot" />Business email, made clear</p>
          <h1 className="text-display rise mt-6 text-ink" style={{ "--i": 1 } as React.CSSProperties}>
            <span className="sr-only">Email that looks like your business.</span>
            <span aria-hidden className="block">Email that</span>
            <span aria-hidden className="block">looks like</span>
            <RotatingWord />
          </h1>
          <p className="rise mt-6 max-w-[30rem] text-[17px] leading-7 text-muted" style={{ "--i": 2 }  as React.CSSProperties}>
            A professional address on your own domain, with the setup handled and the controls you actually need.
          </p>

          <form onSubmit={onSubmit} className="panel crosshair rise mt-8 max-w-[34rem] rounded-lg" style={{ "--i": 3 } as React.CSSProperties}>
            <div className="flex items-center gap-2 px-4 pt-3.5">
              <label htmlFor="hero-domain" className="eyebrow">Try your domain</label>
            </div>
            <div className="flex flex-col gap-2 p-2 pt-1.5 sm:flex-row sm:items-center">
              <input
                id="hero-domain"
                value={typed}
                onChange={(event) => onType(event.target.value)}
                placeholder="yourcompany.ng"
                autoComplete="off"
                autoCapitalize="none"
                spellCheck={false}
                className="h-11 min-w-0 flex-1 bg-transparent px-2 font-mono text-[15px] text-ink outline-none placeholder:text-muted-2"
              />
              <button type="submit" className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-md bg-accent px-4 text-sm font-semibold text-accent-ink transition hover:bg-[#4dff3a] active:translate-y-px">
                Set up this address <ArrowRight className="size-4" />
              </button>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-t border-border px-4 py-3">
              <p className="min-w-0 truncate font-mono text-[13px] text-ink" aria-live="polite">
                <span className="text-accent">{localPart}</span><span className="text-muted-2">@</span>{domain}
              </p>
              <div className="flex gap-1" role="group" aria-label="Choose a mailbox name">
                {LOCAL_PARTS.map((part) => (
                  <button
                    key={part}
                    type="button"
                    aria-pressed={part === localPart}
                    onClick={() => pickLocalPart(part)}
                    className={cn("rounded-sm px-1.5 py-1 font-mono text-[11px] transition", part === localPart ? "bg-white/10 text-ink" : "text-muted-2 hover:text-ink")}
                  >
                    {part}
                  </button>
                ))}
              </div>
            </div>
          </form>

          <div className="rise mt-5 flex flex-wrap items-center gap-x-6 gap-y-2 text-[13px] text-muted" style={{ "--i": 4 } as React.CSSProperties}>
            <Link href="/pricing" className="underline decoration-border-strong underline-offset-4 transition hover:text-ink">View plans</Link>
            <span>Pay in Naira or US Dollars</span>
          </div>
        </div>
      </div>
      <a href="#journey" aria-label="Scroll to how it works" className="absolute bottom-5 right-8 hidden items-center gap-2 text-muted lg:flex">
        <span className="eyebrow">Follow the mail</span><ChevronDown className="size-4 animate-bounce" />
      </a>
    </section>
  );
}
