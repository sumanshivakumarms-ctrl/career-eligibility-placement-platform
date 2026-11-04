"use client";

import { useEffect, useRef } from "react";
import { animate, useInView } from "framer-motion";

/** Counts up from 0 when scrolled into view. */
export default function AnimatedCounter({ value, suffix = "" }: { value: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-50px" });

  useEffect(() => {
    if (!inView || !ref.current) return;
    const el = ref.current;
    const controls = animate(0, value, {
      duration: 1.6,
      ease: "easeOut",
      onUpdate: (v) => {
        el.textContent = Math.round(v).toLocaleString("en-IN") + suffix;
      },
    });
    return () => controls.stop();
  }, [inView, value, suffix]);

  return (
    <span ref={ref} aria-label={`${value.toLocaleString("en-IN")}${suffix}`}>
      0{suffix}
    </span>
  );
}
