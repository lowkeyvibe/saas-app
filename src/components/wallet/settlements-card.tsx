"use client";

import { CalendarClock, Clock } from "lucide-react";
import { TODAY } from "@/lib/mock-data";
import { formatCurrency } from "@/lib/format";
import { convert, CURRENCIES, settlements, type MainCurrency, type Settlement } from "@/lib/mock-wallet";

const fmt = (value: number, code: string) => formatCurrency(value, code, CURRENCIES[code].decimals);

const daysFromToday = (date: string) =>
  Math.round((Date.parse(`${date}T00:00:00Z`) - Date.parse(`${TODAY}T00:00:00Z`)) / 86_400_000);

// "Mañana" o "Mar 10 nov", y abajo "en 5 días".
function dateLabel(date: string) {
  const d = new Date(`${date}T00:00:00Z`);
  const text = new Intl.DateTimeFormat("es-AR", { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" })
    .format(d)
    .replace(",", "");
  return daysFromToday(date) === 1 ? "Mañana" : text.charAt(0).toUpperCase() + text.slice(1);
}

function inDays(date: string) {
  const n = daysFromToday(date);
  return n === 1 ? `${new Intl.DateTimeFormat("es-AR", { weekday: "long", day: "numeric", timeZone: "UTC" }).format(new Date(`${date}T00:00:00Z`))}` : `en ${n} días`;
}

function Flag({ code }: { code: string }) {
  return (
    <span className="grid size-6 shrink-0 place-items-center overflow-hidden rounded-full border border-border bg-surface-2 text-sm leading-none">
      {CURRENCIES[code].flag}
    </span>
  );
}

// Card "Acreditaciones": qué se acredita cada día, en la moneda en la que te pagaron y su equivalente
// en tu moneda principal. Va al lado de la card de saldos, con su mismo alto.
export function SettlementsCard({ main, className = "" }: { main: MainCurrency; className?: string }) {
  // Agrupado por fecha.
  const days = new Map<string, Settlement[]>();
  for (const s of settlements) days.set(s.date, [...(days.get(s.date) ?? []), s]);
  const grouped = [...days.entries()];

  const toMain = (list: Settlement[]) => list.reduce((a, s) => a + convert(s.amount, s.code, main), 0);
  const total = toMain(settlements);
  const lastDays = daysFromToday(grouped[grouped.length - 1][0]);
  const [nextDate, nextItems] = grouped[0];
  const thisWeek = toMain(settlements.filter((s) => daysFromToday(s.date) <= 7));

  return (
    <div className={`flex flex-col overflow-hidden rounded-xl border border-border bg-surface ${className}`}>
      {/* Resumen */}
      <div className="relative p-6">
        <div className="pointer-events-none absolute -left-20 -top-24 size-72 rounded-full bg-amber-500/10 blur-3xl" />
        <div className="relative flex items-center justify-between gap-3">
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-background/60 px-3 py-1 text-sm">
            <CalendarClock className="size-4 text-amber-400" />
            <span className="font-medium">Acreditaciones</span>
          </span>
          <span className="text-xs text-subtle">Próximos {lastDays} días</span>
        </div>

        <p className="relative mt-6 text-xs font-medium uppercase tracking-wider text-subtle">Total a acreditarse</p>
        <p className="relative mt-1 text-4xl font-semibold tracking-tight tabular-nums">≈ {formatCurrency(total, main)}</p>
        <p className="relative mt-3 text-xs text-muted">
          Esta semana entran <span className="font-medium tabular-nums text-foreground">≈ {formatCurrency(thisWeek, main)}</span>
        </p>

        {/* La próxima, destacada */}
        <div className="relative mt-5 flex items-center gap-3 rounded-xl border border-emerald-500/25 bg-emerald-500/[0.06] px-4 py-3">
          <span className="grid size-9 shrink-0 place-items-center rounded-full bg-emerald-500/10 text-emerald-400">
            <Clock className="size-4" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium">Próxima: {dateLabel(nextDate).toLowerCase()}</p>
            <p className="truncate text-xs text-subtle">{nextItems.map((s) => fmt(s.amount, s.code)).join(" · ")}</p>
          </div>
          <p className="text-right text-sm font-semibold tabular-nums text-emerald-400">+{formatCurrency(toMain(nextItems), main)}</p>
        </div>
      </div>

      {/* Calendario: una fila por día, con lo que entra en cada moneda */}
      <div className="relative flex min-h-0 flex-1 flex-col border-t border-border">
        {/* Degradé abajo: avisa que la lista sigue si se desplaza. */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-10 rounded-b-xl bg-gradient-to-t from-surface to-transparent" />
        <p className="flex items-center justify-between px-6 pb-1 pt-4 text-xs font-medium uppercase tracking-wider text-subtle">
          <span>Por fecha</span>
          <span className="normal-case tracking-normal">≈ en {main}</span>
        </p>
        <ol className="min-h-0 flex-1 overflow-y-auto pb-3">
          {grouped.map(([date, items], i) => (
            <li key={date} className="relative flex gap-4 px-6 py-3 transition hover:bg-violet-500/5">
              {/* Línea de tiempo */}
              <span className="relative flex w-3 shrink-0 justify-center">
                <span className={`mt-1.5 size-2.5 rounded-full ${i === 0 ? "bg-emerald-400 ring-4 ring-emerald-400/15" : "bg-zinc-600"}`} />
                {i < grouped.length - 1 && <span className="absolute bottom-[-0.75rem] top-5 w-px bg-border" />}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-3">
                  <p className="text-sm font-medium">
                    {dateLabel(date)}
                    <span className="ml-2 text-xs font-normal text-subtle">{inDays(date)}</span>
                  </p>
                  <p className="text-sm font-semibold tabular-nums">+{formatCurrency(toMain(items), main)}</p>
                </div>
                <ul className="mt-1.5 space-y-1">
                  {items.map((s) => (
                    <li key={`${s.code}-${s.gateway}`} className="flex items-center gap-2 text-xs">
                      <Flag code={s.code} />
                      <span className="tabular-nums text-muted">{fmt(s.amount, s.code)}</span>
                      <span className="text-subtle">
                        · {s.sales} {s.sales === 1 ? "venta" : "ventas"}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
