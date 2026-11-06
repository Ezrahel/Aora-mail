"use client";

import { Check, RotateCcw, X } from "lucide-react";
import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";
import { previewDomain, useTypedDomain } from "@/lib/scene/address";
import { sceneState } from "@/lib/scene/store";
import { checkZone, RECORD_INFO, RECORD_ORDER, toggleRecord, verdictFor, zoneFile, type RecordId } from "@/lib/scene/zone";
import { cn } from "@/lib/formatting";
import { Reveal } from "./reveal";

const ZoneCode = dynamic(() => import("./zone-code"), {
  ssr: false,
  loading: () => <div className="h-[147px]" />,
});

const VERDICT_STYLES = { good: "text-accent", warn: "text-warning", fail: "text-danger" } as const;

export function ZoneEditor() {
  const domain = previewDomain(useTypedDomain());
  const pristine = useMemo(() => zoneFile(domain), [domain]);
  const [edited, setEdited] = useState<{ domain: string; text: string } | null>(null);

  // An edit belongs to the domain it was made for; a new domain starts clean.
  const text = edited?.domain === domain ? edited.text : pristine;
  const health = useMemo(() => checkZone(text), [text]);
  const verdict = verdictFor(health, domain);
  const untouched = text === pristine;

  useEffect(() => {
    sceneState.records = [Number(health.mx), Number(health.spf), Number(health.dkim), Number(health.dmarc)];
  }, [health]);

  useEffect(() => () => { sceneState.records = [1, 1, 1, 1]; }, []);

  const update = (next: string) => setEdited({ domain, text: next });
  const toggle = (record: RecordId) => update(toggleRecord(text, record, domain));

  return (
    <section data-scene={2} className="relative py-24 sm:py-32">
      <div className="mx-auto max-w-[1240px] px-5 sm:px-8">
        <div className="max-w-[46rem]">
          <Reveal>
            <p className="eyebrow">The part nobody enjoys</p>
            <h2 className="text-title mt-5 text-ink">Your email shouldn&apos;t need an IT degree.</h2>
            <p className="mt-5 max-w-[34rem] text-[17px] leading-7 text-muted">
              Four records decide whether your mail arrives. We tell you exactly what to add and check it for you. Go on: edit a line, or break one below.
            </p>
          </Reveal>

          <Reveal delay={0.08} className="mt-10">
            <div className="panel crosshair rounded-lg">
              <div className="flex items-center justify-between gap-4 border-b border-border px-4 py-2.5">
                <p className="truncate font-mono text-xs text-muted">{domain}.zone</p>
                <button
                  type="button"
                  onClick={() => setEdited(null)}
                  disabled={untouched}
                  className="inline-flex shrink-0 items-center gap-1.5 font-mono text-xs text-muted transition hover:text-ink disabled:opacity-40"
                >
                  <RotateCcw className="size-3" /> Reset
                </button>
              </div>
              <div className="px-1 py-2"><ZoneCode value={text} onChange={update} /></div>
              <div className="grid grid-cols-2 border-t border-border sm:grid-cols-4">
                {RECORD_ORDER.map((record, index) => {
                  const ok = health[record];
                  return (
                    <button
                      key={record}
                      type="button"
                      aria-pressed={!ok}
                      aria-label={`${ok ? "Break" : "Repair"} the ${RECORD_INFO[record].label} record`}
                      onClick={() => toggle(record)}
                      className={cn(
                        "group flex flex-col gap-1.5 border-border p-3 text-left transition hover:bg-white/[0.03]",
                        index % 2 === 0 && "border-r",
                        index === 1 && "sm:border-r",
                        index < 2 && "border-b sm:border-b-0",
                      )}
                    >
                      <span className="flex items-center justify-between">
                        <span className="font-mono text-xs font-medium text-ink">{RECORD_INFO[record].label}</span>
                        {ok ? <Check className="size-3.5 text-accent" /> : <X className="size-3.5 text-danger" />}
                      </span>
                      <span className="text-[11px] leading-4 text-muted">{RECORD_INFO[record].job}</span>
                      <span className={cn("font-mono text-[10px]", ok ? "text-muted-2 group-hover:text-ink" : "text-danger")}>{ok ? "Break it" : "Repair"}</span>
                    </button>
                  );
                })}
              </div>
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 border-t border-border px-4 py-3" aria-live="polite">
                <p className={cn("text-sm font-medium", VERDICT_STYLES[verdict.tone])}>{verdict.headline}</p>
                <p className="text-sm text-muted">{verdict.detail}</p>
              </div>
            </div>
            <p className="mt-3 font-mono text-[11px] text-muted-2">A simulation of how receiving servers react. Your real records appear in your dashboard.</p>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
