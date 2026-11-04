"use client";

import { useEffect } from "react";
import { animate, motion, useMotionValue, useTransform } from "framer-motion";

/** Animated circular progress meter. */
export default function CircularScore({
  value,
  size = 160,
  stroke = 12,
  label,
}: {
  value: number;
  size?: number;
  stroke?: number;
  label?: string;
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const mv = useMotionValue(0);
  const offset = useTransform(mv, (v) => c - (v / 100) * c);
  const text = useTransform(mv, (v) => Math.round(v).toString());
  const color = value >= 75 ? "#10b981" : value >= 50 ? "#f59e0b" : "#ef4444";

  useEffect(() => {
    const controls = animate(mv, value, { duration: 1.2, ease: "easeOut" });
    return () => controls.stop();
  }, [value, mv]);

  return (
    <div
      className="relative inline-flex items-center justify-center"
      style={{ width: size, height: size }}
      role="img"
      aria-label={`${label ?? "Score"}: ${value} percent`}
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={stroke} className="stroke-slate-200 dark:stroke-slate-800" />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          style={{ strokeDashoffset: offset }}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <div className="flex items-baseline">
          <motion.span className="text-4xl font-extrabold">{text}</motion.span>
          <span className="text-lg font-bold">%</span>
        </div>
        {label && <span className="muted text-xs">{label}</span>}
      </div>
    </div>
  );
}
