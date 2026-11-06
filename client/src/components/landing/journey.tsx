"use client";

import { AnimatePresence, motion, useMotionValueEvent, useScroll } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { JOURNEY_STEPS } from "@/lib/constants/journey";
import { cn } from "@/lib/formatting";
import { sceneState } from "@/lib/scene/store";

/** A pinned walk down the spiral tunnel: one arm of the spiral per setup step. */
export function Journey() {
  const section = useRef<HTMLElement>(null);
  const [step, setStep] = useState(0);
  const { scrollYProgress } = useScroll({ target: section, offset: ["start start", "end end"] });

  useMotionValueEvent(scrollYProgress, "change", (value) => {
    const next = Math.min(JOURNEY_STEPS.length - 1, Math.floor(value * JOURNEY_STEPS.length));
    setStep(next);
    sceneState.step = next;
  });

  useEffect(() => () => { sceneState.step = 0; }, []);

  const current = JOURNEY_STEPS[step];

  return (
    <section ref={section} id="journey" data-scene={1} className="relative h-[340vh]">
      <div className="sticky top-0 flex h-[100svh] flex-col items-center justify-center px-6 text-center">
        <p className="eyebrow">From domain to first email</p>
        <div className="relative mt-7 grid min-h-[15rem] w-full max-w-[34rem] place-items-start justify-items-center sm:min-h-[13.5rem]">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={current.title}
              initial={{ opacity: 0, scale: 0.86, filter: "blur(10px)" }}
              animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
              exit={{ opacity: 0, scale: 1.14, filter: "blur(10px)" }}
              transition={{ duration: 0.42, ease: [0.16, 1, 0.3, 1] }}
            >
              <p className="font-mono text-sm text-accent">0{step + 1} / 0{JOURNEY_STEPS.length}</p>
              <h2 className="text-title mt-4 text-ink">{current.title}</h2>
              <p className="mx-auto mt-4 max-w-[26rem] text-base leading-7 text-ink-soft">{current.body}</p>
            </motion.div>
          </AnimatePresence>
        </div>
        <ol className="mt-8 flex gap-1.5" aria-label="Setup steps">
          {JOURNEY_STEPS.map((item, index) => (
            <li key={item.title} aria-current={index === step ? "step" : undefined} className="w-[4.6rem] sm:w-24">
              <span className={cn("block h-px transition-colors duration-500", index <= step ? "bg-accent" : "bg-border-strong")} />
              <span className={cn("mt-2 block font-mono text-[10px] transition-colors sm:text-[11px]", index === step ? "text-ink" : "text-muted-2")}>{item.short}</span>
            </li>
          ))}
        </ol>
        {/* The steps stay readable for assistive tech, not only one at a time. */}
        <ul className="sr-only">{JOURNEY_STEPS.map((item) => <li key={item.title}>{item.title}: {item.body}</li>)}</ul>
      </div>
    </section>
  );
}
