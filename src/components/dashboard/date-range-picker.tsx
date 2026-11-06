"use client";

import { useEffect, useRef, useState } from "react";
import { CalendarDays, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import { MAX_DATE, MIN_DATE, rangePresets, type DateRange, type RangePreset } from "@/lib/analytics";
import { formatRange } from "@/lib/format";

export type RangeSelection = DateRange & { preset: RangePreset | "custom" };

type Month = { y: number; m: number }; // m: 0 = enero

const WEEKDAYS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
const MONTHS = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

const monthOf = (date: string): Month => ({ y: Number(date.slice(0, 4)), m: Number(date.slice(5, 7)) - 1 });
const monthIdx = (v: Month) => v.y * 12 + v.m;
const fromIdx = (i: number): Month => ({ y: Math.floor(i / 12), m: i % 12 });
const MIN_IDX = monthIdx(monthOf(MIN_DATE));
const MAX_IDX = monthIdx(monthOf(MAX_DATE));
const YEARS = Array.from({ length: monthOf(MAX_DATE).y - monthOf(MIN_DATE).y + 1 }, (_, i) => monthOf(MIN_DATE).y + i);

// El mes de la izquierda; el de la derecha es siempre el siguiente.
function clampView(idx: number): Month {
  return fromIdx(Math.min(Math.max(idx, MIN_IDX), Math.max(MIN_IDX, MAX_IDX - 1)));
}

// Se abre mostrando el mes del final del rango a la derecha, como Meta.
const viewFor = (to: string) => clampView(monthIdx(monthOf(to)) - 1);

const sorted = (a: string, b: string): DateRange => (a <= b ? { from: a, to: b } : { from: b, to: a });

export function presetLabel(preset: RangeSelection["preset"]) {
  return rangePresets.find((p) => p.value === preset)?.label ?? "Personalizado";
}

// Calendario de dos meses: el primer clic marca el inicio y el segundo cierra el rango y lo aplica.
export function DateRangePicker({
  value,
  onApply,
}: {
  value: RangeSelection;
  onApply: (value: RangeSelection) => void;
}) {
  const [open, setOpen] = useState(false);
  // Primer día elegido de un rango nuevo; el próximo clic cierra el rango.
  const [anchor, setAnchor] = useState<string | null>(null);
  const [hover, setHover] = useState<string | null>(null);
  const [view, setView] = useState<Month>(() => viewFor(value.to));
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function toggle() {
    if (open) return setOpen(false);
    setAnchor(null);
    setHover(null);
    setView(viewFor(value.to));
    setOpen(true);
  }

  function clickDay(day: string) {
    if (!anchor) return setAnchor(day);
    onApply({ ...sorted(anchor, day), preset: "custom" });
    setAnchor(null);
    setOpen(false);
  }

  // Mientras se elige el segundo día, el rango se previsualiza con el mouse.
  const shown = anchor ? sorted(anchor, hover ?? anchor) : value;
  const right = fromIdx(monthIdx(view) + 1);
  const triggerLabel =
    value.preset === "custom"
      ? formatRange(value.from, value.to)
      : `${presetLabel(value.preset)}: ${formatRange(value.from, value.to)}`;

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={toggle}
        aria-haspopup="dialog"
        aria-expanded={open}
        className={`flex h-9 items-center gap-2 rounded-lg border bg-background px-3 text-sm font-medium transition ${
          open ? "border-violet-500/60 ring-4 ring-violet-500/10" : "border-border hover:border-zinc-600"
        }`}
      >
        <CalendarDays className="size-4 text-subtle" />
        <span className="tabular-nums">{triggerLabel}</span>
        <ChevronDown className={`size-4 text-subtle transition ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Elegir rango de fechas"
          className="absolute right-0 top-full z-50 mt-2 max-w-[calc(100vw-2rem)] rounded-xl border border-border bg-surface-2 p-5 shadow-2xl shadow-black/60"
        >
          <div className="flex gap-8" onMouseLeave={() => setHover(null)}>
            <MonthGrid
              month={view}
              onMonthChange={(v) => setView(clampView(monthIdx(v)))}
              prev={monthIdx(view) > MIN_IDX ? () => setView(clampView(monthIdx(view) - 1)) : undefined}
              shown={shown}
              onDay={clickDay}
              onHover={setHover}
            />
            <div className="hidden sm:block">
              <MonthGrid
                month={right}
                onMonthChange={(v) => setView(clampView(monthIdx(v) - 1))}
                next={monthIdx(right) < MAX_IDX ? () => setView(clampView(monthIdx(view) + 1)) : undefined}
                shown={shown}
                onDay={clickDay}
                onHover={setHover}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function MonthGrid({
  month,
  onMonthChange,
  prev,
  next,
  shown,
  onDay,
  onHover,
}: {
  month: Month;
  onMonthChange: (v: Month) => void;
  prev?: () => void;
  next?: () => void;
  shown: DateRange;
  onDay: (day: string) => void;
  onHover: (day: string) => void;
}) {
  const first = new Date(Date.UTC(month.y, month.m, 1));
  const daysInMonth = new Date(Date.UTC(month.y, month.m + 1, 0)).getUTCDate();
  const cells: (string | null)[] = [
    ...Array<null>(first.getUTCDay()).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => new Date(Date.UTC(month.y, month.m, i + 1)).toISOString().slice(0, 10)),
  ];

  const navBtn = "grid size-8 place-items-center rounded-md text-muted transition hover:bg-overlay/[0.06] hover:text-foreground";

  return (
    <div className="w-[252px]">
      <div className="mb-3 flex items-center justify-between">
        {prev ? (
          <button type="button" onClick={prev} aria-label="Mes anterior" className={navBtn}>
            <ChevronLeft className="size-4" />
          </button>
        ) : (
          <span className="size-8" />
        )}
        <div className="flex items-center gap-1">
          <InlineSelect
            value={month.m}
            options={MONTHS.map((label, i) => ({ value: i, label }))}
            onChange={(m) => onMonthChange({ y: month.y, m })}
            label="Mes"
          />
          <InlineSelect
            value={month.y}
            options={YEARS.map((y) => ({ value: y, label: String(y) }))}
            onChange={(y) => onMonthChange({ y, m: month.m })}
            label="Año"
          />
        </div>
        {next ? (
          <button type="button" onClick={next} aria-label="Mes siguiente" className={navBtn}>
            <ChevronRight className="size-4" />
          </button>
        ) : (
          <span className="size-8" />
        )}
      </div>

      <div className="grid grid-cols-7 gap-y-1 text-center">
        {WEEKDAYS.map((d) => (
          <span key={d} className="pb-1 text-[11px] font-medium text-subtle">
            {d}
          </span>
        ))}
        {cells.map((day, i) => {
          if (!day) return <span key={`e${i}`} />;
          const disabled = day < MIN_DATE || day > MAX_DATE;
          const edge = day === shown.from || day === shown.to;
          const inside = day > shown.from && day < shown.to;
          const col = i % 7;
          // Banda continua por fila: se redondea solo en los extremos del rango y de la semana.
          const roundL = edge && day === shown.from ? "rounded-l-md" : col === 0 || day.endsWith("-01") ? "rounded-l-md" : "";
          const roundR =
            edge && day === shown.to
              ? "rounded-r-md"
              : col === 6 || Number(day.slice(8)) === daysInMonth
                ? "rounded-r-md"
                : "";
          return (
            <button
              key={day}
              type="button"
              disabled={disabled}
              onClick={() => onDay(day)}
              onMouseEnter={() => onHover(day)}
              aria-pressed={edge || inside}
              className={`h-8 text-xs tabular-nums transition ${
                disabled
                  ? "cursor-not-allowed text-zinc-700"
                  : edge
                    ? `bg-brand font-semibold text-white ${roundL} ${roundR} ${shown.from === shown.to ? "rounded-md" : ""}`
                    : inside
                      ? `bg-brand/20 text-foreground hover:bg-brand/35 ${roundL} ${roundR}`
                      : `rounded-md hover:bg-overlay/[0.06] hover:text-foreground ${
                          day === MAX_DATE ? "font-semibold text-violet-300" : "text-muted"
                        }`
              }`}
            >
              {Number(day.slice(8))}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function InlineSelect({
  value,
  options,
  onChange,
  label,
}: {
  value: number;
  options: { value: number; label: string }[];
  onChange: (v: number) => void;
  label: string;
}) {
  return (
    <div className="relative">
      <select
        aria-label={label}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-8 cursor-pointer appearance-none rounded-md bg-transparent pl-2 pr-6 text-sm font-medium text-foreground hover:bg-overlay/[0.06] focus:outline-none"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value} className="bg-surface-2">
            {o.label}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-1 top-1/2 size-3.5 -translate-y-1/2 text-subtle" />
    </div>
  );
}
