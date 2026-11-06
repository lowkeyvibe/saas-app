"use client";

import { presetRange, type RangePreset } from "@/lib/analytics";
import type { RangeSelection } from "@/components/dashboard/date-range-picker";

// Atajos rápidos de período (los mismos en Resumen y Ventas). Van junto al calendario (DateRangePicker).
export const QUICK_RANGES: { value: RangePreset; label: string }[] = [
  { value: "hoy", label: "Hoy" },
  { value: "ayer", label: "Ayer" },
  { value: "7d", label: "7 días" },
  { value: "30d", label: "Un mes" },
  { value: "maximo", label: "Histórico" },
];

export function QuickRanges({ value, onChange }: { value: RangeSelection; onChange: (r: RangeSelection) => void }) {
  return (
    <div className="flex h-9 items-center gap-1 rounded-lg border border-border bg-surface p-1">
      {QUICK_RANGES.map((q) => (
        <button
          key={q.value}
          type="button"
          onClick={() => onChange({ ...presetRange(q.value), preset: q.value })}
          aria-pressed={value.preset === q.value}
          className={`h-full rounded-md px-3 text-xs font-medium transition ${
            value.preset === q.value
              ? "bg-brand text-white shadow-lg shadow-violet-500/20"
              : "text-muted hover:bg-overlay/[0.04] hover:text-foreground"
          }`}
        >
          {q.label}
        </button>
      ))}
    </div>
  );
}
