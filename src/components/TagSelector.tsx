"use client";

import { useId, useMemo, useState } from "react";
import { Plus, X } from "lucide-react";

/**
 * Tag selector with search, suggestions and (optionally) custom tags.
 * Used for skills, certifications, locations, branches…
 */
export default function TagSelector({
  value,
  onChange,
  options,
  placeholder = "Search or add…",
  allowCustom = true,
  label,
  max = 30,
}: {
  value: string[];
  onChange: (v: string[]) => void;
  options: string[];
  placeholder?: string;
  allowCustom?: boolean;
  label: string;
  max?: number;
}) {
  const [q, setQ] = useState("");
  const [focus, setFocus] = useState(false);
  const listId = useId();

  const lower = value.map((v) => v.toLowerCase());
  const suggestions = useMemo(
    () => options.filter((o) => !lower.includes(o.toLowerCase()) && o.toLowerCase().includes(q.toLowerCase())).slice(0, 8),
    [options, q, lower],
  );
  const canAddCustom = allowCustom && q.trim().length > 1 && !lower.includes(q.trim().toLowerCase()) && !options.some((o) => o.toLowerCase() === q.trim().toLowerCase());

  const add = (t: string) => {
    const tag = t.trim();
    if (!tag || lower.includes(tag.toLowerCase()) || value.length >= max) return;
    onChange([...value, tag]);
    setQ("");
  };
  const remove = (t: string) => onChange(value.filter((v) => v !== t));

  return (
    <div className="relative">
      <div className="flex flex-wrap gap-2" aria-live="polite">
        {value.map((t) => (
          <span key={t} className="chip chip-on">
            {t}
            <button type="button" onClick={() => remove(t)} aria-label={`Remove ${t}`} className="rounded-full hover:bg-white/25">
              <X className="h-3.5 w-3.5" />
            </button>
          </span>
        ))}
      </div>
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        onFocus={() => setFocus(true)}
        onBlur={() => setTimeout(() => setFocus(false), 150)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            if (suggestions[0] && q) add(suggestions[0]);
            else if (canAddCustom) add(q);
          }
          if (e.key === "Backspace" && !q && value.length) remove(value[value.length - 1]);
        }}
        placeholder={placeholder}
        aria-label={label}
        aria-controls={listId}
        className="input mt-2"
      />
      {focus && (suggestions.length > 0 || canAddCustom) && (
        <ul id={listId} className="card absolute z-20 mt-1 max-h-56 w-full overflow-auto p-1 shadow-xl">
          {suggestions.map((s) => (
            <li key={s}>
              <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => add(s)} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm hover:bg-indigo-50 dark:hover:bg-slate-800">
                <Plus className="h-3.5 w-3.5 text-indigo-600" /> {s}
              </button>
            </li>
          ))}
          {canAddCustom && (
            <li>
              <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => add(q)} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-medium hover:bg-indigo-50 dark:hover:bg-slate-800">
                <Plus className="h-3.5 w-3.5 text-indigo-600" /> Add “{q.trim()}”
              </button>
            </li>
          )}
        </ul>
      )}
    </div>
  );
}
