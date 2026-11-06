"use client";

import { useMemo, useState } from "react";
import { ArrowDownToLine, ArrowRight, ArrowRightLeft, Check, ChevronLeft, ChevronRight, Clock, History, Info, Landmark, Lock, RefreshCw, Send, type LucideIcon } from "lucide-react";
import { Card, CountUp } from "@/components/dashboard/ui";
import { primaryButton } from "@/components/settings/settings-ui";
import { TODAY } from "@/lib/mock-data";
import { formatCurrency } from "@/lib/format";
import {
  convert,
  CURRENCIES,
  settlements,
  type Conversion,
  type CurrencyBalance,
  type MainCurrency,
  type PayoutMethod,
} from "@/lib/mock-wallet";
import { AccountSelect } from "./accounts";
import { ConvertSheet, Flag, fmt } from "./currency-balance";

const DAY_MS = 86_400_000;
// Fecha completa, sin abreviar, en dos partes: "Sábado" y "7 de noviembre".
const unlockWeekday = (date: string) => {
  const w = fmtDay(date, { weekday: "long" });
  return w.charAt(0).toUpperCase() + w.slice(1);
};
const unlockDay = (date: string) => fmtDay(date, { day: "numeric", month: "long" });

// Monto corto para los días: "$280", "$1.2K" (o "€280").
const formatCompactCurrency = (n: number, code: MainCurrency) =>
  `${code === "EUR" ? "€" : "$"}${n >= 1000 ? `${(n / 1000).toFixed(1)}K` : Math.round(n)}`;
const fmtDay = (date: string, opts: Intl.DateTimeFormatOptions) =>
  new Intl.DateTimeFormat("es-AR", { ...opts, timeZone: "UTC" }).format(new Date(`${date}T00:00:00Z`));

// ═══ Panel de la Wallet ═════════════════════════════════════════════════════
// Izquierda: tu disponible, retirar y el resto de tu dinero en tres renglones.
// Es solo la card; cómo se ubica en la página lo decide wallet.tsx.
export function WalletPanel({
  main,
  onChangeMain,
  available,
  pending,
  inTransit,
  withdrawn,
  accounts,
  accountId,
  onSelectAccount,
  onAddAccount,
  onWithdraw,
}: {
  main: MainCurrency;
  onChangeMain: (c: MainCurrency) => void;
  available: number;
  pending: number;
  inTransit: number;
  withdrawn: number;
  accounts: PayoutMethod[];
  accountId: string | null;
  onSelectAccount: (id: string) => void;
  onAddAccount: () => void;
  onWithdraw: () => void;
}) {
  const [refreshing, setRefreshing] = useState(false);

  const rows: { icon: LucideIcon; label: string; hint: string; value: number; approx?: boolean; tone: string }[] = [
    { icon: Clock, label: "Por acreditar", hint: "Las pasarelas lo liberan en los próximos días", value: pending, approx: true, tone: "text-amber-400 bg-amber-500/10" },
    { icon: Send, label: "En camino", hint: "Retiros que van hacia tu cuenta", value: inTransit, tone: "text-sky-300 bg-sky-500/10" },
    { icon: Landmark, label: "Retiraste este mes", hint: "Ya está en tus cuentas", value: withdrawn, tone: "text-emerald-400 bg-emerald-500/10" },
  ];

  // Lo que entra mañana y en los próximos 7 días (igual que en la barra lateral).
  const upcoming = useMemo(() => {
    const t0 = Date.parse(`${TODAY}T00:00:00Z`);
    const day = (n: number) => new Date(t0 + n * DAY_MS).toISOString().slice(0, 10);
    const sum = (from: number, to: number) =>
      settlements.filter((s) => s.date >= day(from) && s.date <= day(to)).reduce((a, s) => a + convert(s.amount, s.code, main), 0);
    return { tomorrow: sum(1, 1), week: sum(1, 7) };
  }, [main]);

  // Cómo se reparte todo tu dinero (lo retirado ya no es tuyo acá: está en tus cuentas).
  const total = available + pending + inTransit;
  const parts = [
    { label: "Disponible", value: available, bar: "bg-gradient-to-r from-violet-600 to-violet-400", dot: "bg-violet-400" },
    { label: "Por acreditar", value: pending, bar: "bg-amber-400/80", dot: "bg-amber-400" },
    { label: "En camino", value: inTransit, bar: "bg-sky-400/80", dot: "bg-sky-400" },
  ];

  return (
        // Sin overflow-hidden: el menú para elegir la cuenta tiene que poder salir de la card.
        <Card className="relative flex min-w-0 flex-col">
          <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden rounded-xl">
            <div className="absolute -left-32 -top-40 size-[28rem] rounded-full bg-violet-600/15 blur-3xl" />
          </div>
        <div className="relative flex flex-1 flex-col p-6 lg:p-8">
          <div className="flex items-center justify-between gap-3">
            <div role="radiogroup" aria-label="Moneda principal" className="inline-flex rounded-full border border-border bg-background/60 p-0.5">
              {(["USD", "EUR"] as const).map((c) => (
                <button
                  key={c}
                  type="button"
                  role="radio"
                  aria-checked={c === main}
                  onClick={() => onChangeMain(c)}
                  title="Tu moneda principal: en la que ves y retirás tu dinero"
                  className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                    c === main ? "bg-foreground text-background" : "text-muted hover:text-foreground"
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
            <button
              type="button"
              disabled={refreshing}
              onClick={() => {
                setRefreshing(true);
                // Simula traer los saldos de las pasarelas.
                setTimeout(() => setRefreshing(false), 900);
              }}
              aria-label="Actualizar saldos"
              title="Actualizar"
              className="grid size-8 place-items-center rounded-lg text-subtle transition hover:bg-violet-500/10 hover:text-foreground"
            >
              <RefreshCw className={`size-4 ${refreshing ? "animate-spin" : ""}`} />
            </button>
          </div>

          {/* mt-auto acá y en los renglones: el espacio que sobra se reparte parejo arriba y abajo del saldo. */}
          <p className="mt-auto pt-8 text-sm text-muted">Disponible para retirar</p>
          <p className="mt-1 text-5xl font-semibold tracking-tight tabular-nums">
            <CountUp value={available} format={(n) => formatCurrency(n, main)} />
          </p>
          {/* Lo próximo que entra, para darle contexto al saldo. */}
          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-1 text-emerald-300 ring-1 ring-inset ring-emerald-500/20">
              <span className="size-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]" />
              Mañana <span className="font-semibold tabular-nums">+{formatCurrency(upcoming.tomorrow, main)}</span>
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-overlay/[0.04] px-2.5 py-1 text-muted ring-1 ring-inset ring-border">
              Esta semana <span className="font-semibold tabular-nums text-foreground">+{formatCurrency(upcoming.week, main)}</span>
            </span>
          </div>

          <div className="mt-6 flex flex-col gap-2 sm:flex-row">
            <div className="min-w-0 flex-1">
              <AccountSelect accounts={accounts} value={accountId} onChange={onSelectAccount} onAddAccount={onAddAccount} />
            </div>
            <button
              type="button"
              onClick={onWithdraw}
              disabled={!accountId}
              title={accountId ? undefined : "Elegí una cuenta para retirar"}
              className={`${primaryButton} shrink-0`}
            >
              <ArrowDownToLine className="size-4" /> Retirar
            </button>
          </div>

          {/* Tu dinero en total y cómo se reparte. Los colores son los mismos que los íconos de abajo. */}
          <div className="mb-6 mt-8">
            <div className="flex items-baseline justify-between gap-3 text-xs">
              <span className="text-muted">Tu dinero en total</span>
              <span className="font-semibold tabular-nums">≈ {formatCurrency(total, main)}</span>
            </div>
            <div className="mt-2 flex h-2 gap-0.5 overflow-hidden rounded-full bg-overlay/[0.06]">
              {parts.map((p) => (
                <span key={p.label} className={`h-full ${p.bar}`} style={{ width: `${total ? (p.value / total) * 100 : 0}%` }} />
              ))}
            </div>
            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-subtle">
              {parts.map((p) => (
                <span key={p.label} className="inline-flex items-center gap-1.5">
                  <span className={`size-2 rounded-full ${p.dot}`} />
                  {p.label} <span className="tabular-nums text-muted">{total ? Math.round((p.value / total) * 100) : 0} %</span>
                </span>
              ))}
            </div>
          </div>

          {/* mt-auto: si la card se estira para igualar al calendario, el espacio se reparte (ver arriba). */}
          <ul className="mt-auto divide-y divide-border border-t border-border">
            {rows.map((r) => (
              <li key={r.label} className="flex items-center gap-3 py-3">
                <span className={`grid size-8 shrink-0 place-items-center rounded-lg ${r.tone}`}>
                  <r.icon className="size-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm">{r.label}</p>
                  <p className="truncate text-xs text-subtle">{r.hint}</p>
                </div>
                <p className="text-sm font-semibold tabular-nums">
                  {r.approx && <span className="font-normal text-subtle">≈ </span>}
                  {formatCurrency(r.value, main)}
                </p>
              </li>
            ))}
          </ul>
        </div>

        </Card>
  );
}

// ═══ Cuándo te entra ════════════════════════════════════════════════════════
// Un calendario mensual. Los días en que entra plata son botones con el monto; tocás uno y la card
// muestra el detalle de ese día (cuánto y de qué monedas), con "Calendario" para volver.
const WEEKDAYS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
const addMonths = (ym: string, n: number) => {
  const [y, m] = ym.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1 + n, 1)).toISOString().slice(0, 7);
};
const capitalize = (t: string) => t.charAt(0).toUpperCase() + t.slice(1);

export function IncomeCalendar({ main }: { main: MainCurrency }) {
  // Lo que entra cada día, ya pasado a la moneda principal.
  const byDate = useMemo(() => {
    const map = new Map<string, { items: typeof settlements; total: number; sales: number }>();
    for (const s of settlements) {
      const d = map.get(s.date) ?? { items: [], total: 0, sales: 0 };
      d.items.push(s);
      d.total += convert(s.amount, s.code, main);
      d.sales += s.sales;
      map.set(s.date, d);
    }
    return map;
  }, [main]);
  const total = [...byDate.values()].reduce((a, d) => a + d.total, 0);

  // Arranca en el mes actual; con las flechas se recorre cualquier mes.
  const firstMonth = TODAY.slice(0, 7);
  const [month, setMonth] = useState(firstMonth);
  const [selected, setSelected] = useState<string | null>(null);

  // Celdas del mes: huecos antes del día 1 (la semana arranca el lunes) y después cada día.
  const cells = useMemo(() => {
    const [y, m] = month.split("-").map(Number);
    const first = new Date(Date.UTC(y, m - 1, 1));
    const lead = (first.getUTCDay() + 6) % 7;
    const count = new Date(Date.UTC(y, m, 0)).getUTCDate();
    return [
      ...Array.from({ length: lead }, () => null),
      ...Array.from({ length: count }, (_, i) => `${month}-${String(i + 1).padStart(2, "0")}`),
    ];
  }, [month]);

  const day = selected ? byDate.get(selected) : undefined;
  const daysAway = selected ? Math.round((Date.parse(`${selected}T00:00:00Z`) - Date.parse(`${TODAY}T00:00:00Z`)) / DAY_MS) : 0;

  return (
    <Card className="flex min-w-0 flex-col p-6 lg:p-8">
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-sm font-medium">Cuándo te entra</p>
        <p className="text-xs text-subtle">
          Próximos 14 días · <span className="tabular-nums text-muted">≈ {formatCurrency(total, main)}</span>
        </p>
      </div>

      {/* El calendario siempre ocupa su lugar (así la card no cambia de alto); el detalle se muestra encima. */}
      <div className="relative mt-4 flex flex-1 flex-col">
      {selected && day && (
        // ── Detalle del día elegido ──
        <div className="absolute inset-0 z-10 flex flex-col overflow-y-auto bg-surface">
          <button
            type="button"
            autoFocus
            onClick={() => setSelected(null)}
            className="-ml-2 inline-flex items-center gap-1.5 self-start rounded-lg px-2 py-1.5 text-sm text-muted transition hover:bg-violet-500/10 hover:text-foreground"
          >
            <ChevronLeft className="size-4" /> Calendario
          </button>

          <p className="mt-4 text-sm text-muted">
            {capitalize(fmtDay(selected, { weekday: "long", day: "numeric", month: "long" }))}
            <span className="text-subtle"> · {daysAway === 1 ? "mañana" : `en ${daysAway} días`}</span>
          </p>
          <p className="mt-1 text-4xl font-semibold tracking-tight tabular-nums">
            <span className="text-violet-300">+</span>
            <CountUp value={day.total} format={(n) => formatCurrency(n, main)} />
          </p>
          <p className="mt-1 text-xs text-subtle">
            {day.sales} {day.sales === 1 ? "venta" : "ventas"} · pasa a tu disponible automáticamente
          </p>

          <ul className="mt-6 space-y-1">
            {day.items.map((s) => (
              <li key={`${s.code}-${s.gateway}`} className="flex items-center gap-3 rounded-xl px-3 py-2.5 transition hover:bg-violet-500/5">
                <Flag code={s.code} size="size-8" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium tabular-nums">{fmt(s.amount, s.code)}</p>
                  <p className="text-xs text-subtle">
                    {CURRENCIES[s.code].name} · {s.sales} {s.sales === 1 ? "venta" : "ventas"}
                  </p>
                </div>
                {s.code !== main && <p className="text-xs tabular-nums text-muted">≈ {formatCurrency(convert(s.amount, s.code, main), main)}</p>}
              </li>
            ))}
          </ul>
        </div>
      )}

        {/* ── Calendario del mes ── */}
        <div className={`flex flex-1 flex-col ${selected ? "invisible" : ""}`} aria-hidden={selected ? true : undefined}>
          {/* Mes: flechas a los costados y el mes al medio. Se recorre libremente; "Hoy" vuelve al mes actual. */}
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => setMonth(addMonths(month, -1))}
              aria-label="Mes anterior"
              className="grid size-8 place-items-center rounded-lg text-muted transition hover:bg-violet-500/10 hover:text-foreground"
            >
              <ChevronLeft className="size-4" />
            </button>
            <div className="flex items-center gap-2">
              <p className="text-sm font-semibold">{capitalize(fmtDay(`${month}-01`, { month: "long", year: "numeric" }))}</p>
              {month !== firstMonth && (
                <button
                  type="button"
                  onClick={() => setMonth(firstMonth)}
                  className="rounded-md border border-border px-1.5 py-0.5 text-[11px] text-muted transition hover:bg-violet-500/10 hover:text-foreground"
                >
                  Hoy
                </button>
              )}
            </div>
            <button
              type="button"
              onClick={() => setMonth(addMonths(month, 1))}
              aria-label="Mes siguiente"
              className="grid size-8 place-items-center rounded-lg text-muted transition hover:bg-violet-500/10 hover:text-foreground"
            >
              <ChevronRight className="size-4" />
            </button>
          </div>

          <div className="mt-3 grid grid-cols-7 gap-1.5 text-center">
            {WEEKDAYS.map((w) => (
              <p key={w} className="pb-1 text-[11px] font-medium uppercase tracking-wide text-subtle">
                {w}
              </p>
            ))}
            {cells.map((date, i) => {
              if (!date) return <span key={`vacio-${i}`} />;
              const info = byDate.get(date);
              const isToday = date === TODAY;
              const num = Number(date.slice(8));
              if (!info) {
                // Sin acreditaciones ese día: solo el número.
                return (
                  <span
                    key={date}
                    className={`grid aspect-square place-items-center rounded-xl text-sm tabular-nums ${
                      isToday ? "font-semibold text-foreground ring-1 ring-inset ring-violet-400/60" : date < TODAY ? "text-subtle/40" : "text-subtle"
                    }`}
                    title={isToday ? "Hoy" : undefined}
                  >
                    {num}
                  </span>
                );
              }
              return (
                <button
                  key={date}
                  type="button"
                  onClick={() => setSelected(date)}
                  aria-label={`${fmtDay(date, { weekday: "long", day: "numeric", month: "long" })}: te entran ${formatCurrency(info.total, main)}`}
                  className="flex aspect-square flex-col items-center justify-center rounded-xl border border-violet-500/30 bg-brand-soft transition hover:border-violet-400 hover:bg-violet-500/20 focus-visible:outline-2 focus-visible:outline-violet-500"
                >
                  <span className="text-sm font-semibold tabular-nums">{num}</span>
                  <span className="text-[10px] font-medium tabular-nums text-violet-300">+{formatCompactCurrency(info.total, main)}</span>
                </button>
              );
            })}
          </div>

          <p className="mt-auto flex items-center gap-1.5 pt-4 text-xs text-subtle">
            <span className="size-2.5 rounded-sm border border-violet-500/30 bg-brand-soft" /> Tocá un día para ver cuánto te entra
          </p>
        </div>
      </div>
    </Card>
  );
}

// ═══ Cambiá tus monedas ════════════════════════════════════════════════════
// Va a la derecha del panel de la Wallet. Cada moneda en un renglón: cuánto tenés, cuánto te queda
// en tu moneda principal y el botón Convertir. Si todavía no hay saldo, dice cuándo se acredita.
export function CurrencyConverter({
  main,
  balances,
  onConvert,
  history,
}: {
  main: MainCurrency;
  balances: CurrencyBalance[];
  onConvert: (code: string, amount: number) => void;
  history: Conversion[];
}) {
  const [converting, setConverting] = useState<string | null>(null);
  const [tab, setTab] = useState<"convertir" | "historial">("convertir");
  // Próxima acreditación de cada moneda.
  const nextDate = (code: string) => settlements.filter((st) => st.code === code).map((st) => st.date).sort()[0];
  // Orden de cobro: primero lo que ya está acreditado (se puede convertir, de mayor a menor en tu moneda),
  // después lo que falta, de la acreditación más cercana a la más lejana. Sin fecha, al final.
  const others = balances
    .filter((b) => b.code !== main)
    .sort((a, b) => {
      const aReady = a.available > 0;
      const bReady = b.available > 0;
      if (aReady !== bReady) return aReady ? -1 : 1;
      if (aReady) return convert(b.available, b.code, main) - convert(a.available, a.code, main);
      return (nextDate(a.code) ?? "9999").localeCompare(nextDate(b.code) ?? "9999");
    });
  const ready = others.reduce((a, b) => a + convert(b.available, b.code, main), 0);

  return (
    <>
      <div id="monedas" className="flex scroll-mt-24 flex-col gap-4 px-6 pt-6 sm:flex-row sm:items-start sm:justify-between lg:px-8 lg:pt-8">
        <div className="flex items-start gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand text-white shadow-lg shadow-violet-500/25">
            <ArrowRightLeft className="size-5" />
          </span>
          <div>
            <p className="font-semibold">Cambiá tus monedas a {main}</p>
            <p className="text-sm text-muted">Cada venta entra en la moneda del comprador. Cuando se acredita, la pasás a {main}.</p>
          </div>
        </div>
        <div
          className={`shrink-0 rounded-xl px-4 py-2 text-right ${
            ready > 0 ? "bg-brand-soft ring-1 ring-inset ring-violet-500/30" : "bg-surface-2"
          }`}
        >
          <p className="text-xs text-muted">{ready > 0 ? "Podés convertir ahora" : "Nada para convertir todavía"}</p>
          <p className={`font-semibold tabular-nums ${ready > 0 ? "text-violet-300" : "text-subtle"}`}>≈ {formatCurrency(ready, main)}</p>
        </div>
      </div>

      {/* Pestañas: convertir o ver lo que ya convertiste */}
      <div className="px-6 pb-4 pt-5 lg:px-8">
        <div role="tablist" aria-label="Monedas" className="inline-flex rounded-lg border border-border bg-background p-1">
          {(
            [
              ["convertir", "Convertir", ArrowRightLeft],
              ["historial", `Historial · ${history.length}`, History],
            ] as const
          ).map(([value, label, Icon]) => (
            <button
              key={value}
              type="button"
              role="tab"
              aria-selected={tab === value}
              onClick={() => setTab(value)}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition ${
                tab === value ? "bg-brand text-white shadow-lg shadow-violet-500/20" : "text-muted hover:bg-overlay/[0.04] hover:text-foreground"
              }`}
            >
              <Icon className="size-3.5" /> {label}
            </button>
          ))}
        </div>
      </div>

      {/* Ocupa el alto que queda; la lista se desplaza adentro. */}
      <div className="min-h-0 flex-1 overflow-y-auto">
      {tab === "historial" ? (
        <ConversionHistory history={history} main={main} />
      ) : (
      <ul className="space-y-2 px-6 pb-5 lg:px-8">
        {others.map((b) => {
          const canConvert = b.available > 0;
          const shown = canConvert ? b.available : b.pending;
          const next = nextDate(b.code);
          return (
            <li
              key={b.code}
              className={`flex flex-wrap items-center gap-x-3 gap-y-2 rounded-2xl border p-3 transition ${
                canConvert ? "border-violet-500/40 bg-brand-soft" : "border-border bg-background/40"
              }`}
            >
              {/* De: tu moneda */}
              <Flag code={b.code} size="size-9" />
              <div className="min-w-0 flex-1">
                <p className={`truncate font-semibold tabular-nums ${canConvert ? "" : "text-muted"}`}>{fmt(shown, b.code)}</p>
                <p className="truncate text-xs text-subtle">
                  {CURRENCIES[b.code].name} · {canConvert ? "disponible" : "por acreditar"}
                </p>
              </div>

              {/* A: tu moneda principal */}
              <div className="min-w-0 text-right">
                <p className={`flex items-center justify-end gap-1 font-semibold tabular-nums ${canConvert ? "text-violet-300" : "text-subtle"}`}>
                  <ArrowRight aria-hidden className={`size-3.5 shrink-0 ${canConvert ? "text-violet-400" : "text-subtle/60"}`} />
                  ≈ {formatCurrency(convert(shown, b.code, main), main)}
                </p>
                <p className="truncate text-xs text-subtle">{canConvert ? `te quedan en ${main}` : "cuando se acredite"}</p>
              </div>

              {/* Acción */}
              <div className="w-full sm:w-36">
                {canConvert ? (
                  <button
                    type="button"
                    onClick={() => setConverting(b.code)}
                    className="inline-flex h-9 w-full items-center justify-center gap-2 rounded-xl bg-brand px-3 text-sm font-medium text-white shadow-lg shadow-violet-500/25 transition hover:bg-violet-500"
                  >
                    <ArrowRightLeft className="size-4" /> Convertir
                  </button>
                ) : (
                  // Candado + fecha: ese día se acredita y se puede convertir.
                  // Dos renglones (día de la semana / día y mes) para que entren las fechas largas sin cortarse.
                  <p
                    title={next ? `Se acredita el ${unlockWeekday(next).toLowerCase()} ${unlockDay(next)}` : undefined}
                    className="flex min-h-9 items-center gap-2 rounded-xl border border-dashed border-border px-3 py-1 text-muted"
                  >
                    <Lock className="size-3.5 shrink-0 text-amber-400" />
                    {next ? (
                      <span className="min-w-0 leading-tight">
                        <span className="block text-xs font-medium text-foreground/80">{unlockWeekday(next)}</span>
                        <span className="block whitespace-nowrap text-[11px] text-subtle">{unlockDay(next)}</span>
                      </span>
                    ) : (
                      <span className="text-xs">Sin saldo por ahora</span>
                    )}
                  </p>
                )}
              </div>
            </li>
          );
        })}
      </ul>
      )}
      </div>

      <p className="flex items-center gap-1.5 border-t border-border px-6 py-3 text-xs text-subtle lg:px-8">
        <Info className="size-3.5" /> La tasa final la define la pasarela en el momento de convertir.
      </p>

      <ConvertSheet
        code={converting}
        main={main}
        balance={balances.find((b) => b.code === converting)}
        onClose={() => setConverting(null)}
        onConfirm={onConvert}
      />
    </>
  );
}

// Lo que ya convertiste: de qué moneda, cuánto, cuánto recibiste y a qué tasa.
function ConversionHistory({ history, main }: { history: Conversion[]; main: MainCurrency }) {
  const [openId, setOpenId] = useState<string | null>(null);
  const thisMonth = history
    .filter((c) => c.date.slice(0, 7) === TODAY.slice(0, 7))
    .reduce((a, c) => a + convert(c.received, c.to, main), 0);
  const total = history.reduce((a, c) => a + convert(c.received, c.to, main), 0);

  if (history.length === 0) {
    return <p className="grid h-full place-items-center px-5 text-sm text-subtle">Todavía no convertiste ninguna moneda.</p>;
  }

  return (
    <div className="px-6 pb-5 lg:px-8">
      <div className="mb-3 grid grid-cols-2 gap-2">
        <div className="rounded-xl border border-border bg-background/40 px-4 py-3">
          <p className="text-xs text-subtle">Convertiste este mes</p>
          <p className="mt-0.5 font-semibold tabular-nums text-violet-300">{formatCurrency(thisMonth, main)}</p>
        </div>
        <div className="rounded-xl border border-border bg-background/40 px-4 py-3">
          <p className="text-xs text-subtle">En total</p>
          <p className="mt-0.5 font-semibold tabular-nums">{formatCurrency(total, main)}</p>
        </div>
      </div>
      {/* Todas las filas usan la misma grilla: fecha · diste · flecha · recibiste · estado.
          Así las banderas quedan alineadas y los montos se ven siempre enteros.
          La cotización y el resto del detalle aparecen al tocar la fila. */}
      <ul className="divide-y divide-border rounded-2xl border border-border">
        {history.map((c) => (
          <ConversionRow key={c.id} c={c} open={openId === c.id} onToggle={() => setOpenId(openId === c.id ? null : c.id)} />
        ))}
      </ul>
    </div>
  );
}

const ROW_GRID = "grid grid-cols-[4.5rem_minmax(0,1fr)_0.875rem_minmax(0,1fr)_1.25rem] items-center gap-x-3";
const shortDate = (iso: string) =>
  new Intl.DateTimeFormat("es-AR", { day: "numeric", month: "short", timeZone: "UTC" }).format(new Date(iso)).replace(".", "");
const time = (iso: string) => new Intl.DateTimeFormat("es-AR", { hour: "2-digit", minute: "2-digit", timeZone: "UTC" }).format(new Date(iso));

// Una conversión: lo que diste y lo que recibiste, siempre a la vista. Tocándola se ve la cotización.
function ConversionRow({ c, open, onToggle }: { c: Conversion; open: boolean; onToggle: () => void }) {
  const rate = c.received / c.amount;
  return (
    <li>
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className={`${ROW_GRID} w-full px-4 py-3 text-left transition hover:bg-violet-500/5 ${open ? "bg-violet-500/5" : ""}`}
      >
        <span>
          <span className="block text-sm font-medium">{shortDate(c.date)}</span>
          <span className="block whitespace-nowrap text-xs tabular-nums text-subtle">{time(c.date)}</span>
        </span>
        {/* Diste */}
        <span className="flex min-w-0 items-center gap-2">
          <Flag code={c.from} size="size-7" />
          <span className="whitespace-nowrap text-sm tabular-nums text-muted">{fmt(c.amount, c.from)}</span>
        </span>
        <ArrowRight aria-hidden className="size-3.5 text-violet-400" />
        {/* Recibiste */}
        <span className="flex min-w-0 items-center gap-2">
          <Flag code={c.to} size="size-7" />
          <span className="whitespace-nowrap text-sm font-semibold tabular-nums">{formatCurrency(c.received, c.to)}</span>
        </span>
        <span title="Hecha" className="grid size-5 place-items-center rounded-full bg-emerald-500/10 text-emerald-400 ring-1 ring-inset ring-emerald-500/20">
          <Check className="size-3" />
          <span className="sr-only">Hecha</span>
        </span>
      </button>

      {open && (
        <dl className="grid grid-cols-2 gap-x-4 gap-y-2 border-t border-border bg-background/40 px-4 py-3 text-xs">
          <div>
            <dt className="text-subtle">Cotización</dt>
            <dd className="mt-0.5 tabular-nums">
              1 {c.from} = {formatCurrency(rate, c.to, rate < 0.01 ? 5 : 4)}
            </dd>
          </div>
          <div>
            <dt className="text-subtle">Fecha</dt>
            <dd className="mt-0.5">
              {new Intl.DateTimeFormat("es-AR", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(c.date))}, {time(c.date)}
            </dd>
          </div>
          <div>
            <dt className="text-subtle">Operación</dt>
            <dd className="mt-0.5 tabular-nums">{c.id}</dd>
          </div>
          <div>
            <dt className="text-subtle">Estado</dt>
            <dd className="mt-0.5 flex items-center gap-1 text-emerald-400">
              <Check className="size-3" /> Hecha
            </dd>
          </div>
        </dl>
      )}
    </li>
  );
}
