"use client";

import { useMemo, useState } from "react";
import { ArrowDownToLine, ArrowRight, ArrowRightLeft, Check, Clock, History, Info, Landmark, RefreshCw, Send, type LucideIcon } from "lucide-react";
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

// Monto corto para los días: "$280", "$1.2K" (o "€280").
const formatCompactCurrency = (n: number, code: MainCurrency) =>
  `${code === "EUR" ? "€" : "$"}${n >= 1000 ? `${(n / 1000).toFixed(1)}K` : Math.round(n)}`;
const fmtDay = (date: string, opts: Intl.DateTimeFormatOptions) =>
  new Intl.DateTimeFormat("es-AR", { ...opts, timeZone: "UTC" }).format(new Date(`${date}T00:00:00Z`));

// ═══ Panel de la Wallet ═════════════════════════════════════════════════════
// Izquierda: tu disponible, retirar y el resto de tu dinero en tres renglones.
// Derecha: los próximos 14 días; tocás uno y ves cuánto te entra ese día.
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
    { icon: Clock, label: "Por acreditar", hint: "Las pasarelas lo liberan en los próximos días", value: pending, approx: true, tone: "text-amber-400" },
    { icon: Send, label: "En camino", hint: "Retiros que van hacia tu cuenta", value: inTransit, tone: "text-violet-300" },
    { icon: Landmark, label: "Retiraste este mes", hint: "Ya está en tus cuentas", value: withdrawn, tone: "text-emerald-400" },
  ];

  return (
    // Sin overflow-hidden: el menú para elegir la cuenta tiene que poder salir de la card.
    <Card className="relative">
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden rounded-xl">
        <div className="absolute -left-32 -top-40 size-[28rem] rounded-full bg-violet-600/15 blur-3xl" />
      </div>

      <div className="relative grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
        {/* ── Izquierda: tu dinero ── */}
        <div className="flex flex-col p-6 lg:border-r lg:border-border lg:p-8">
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

          <p className="mt-8 text-sm text-muted">Disponible para retirar</p>
          <p className="mt-1 text-5xl font-semibold tracking-tight tabular-nums">
            <CountUp value={available} format={(n) => formatCurrency(n, main)} />
          </p>

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

          <ul className="mt-8 divide-y divide-border border-t border-border">
            {rows.map((r) => (
              <li key={r.label} className="flex items-center gap-3 py-3.5">
                <r.icon className={`size-4 shrink-0 ${r.tone}`} />
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

        {/* ── Derecha: cuándo te entra ── */}
        <DayPicker main={main} />
      </div>
    </Card>
  );
}

// Tira de los próximos 14 días. Tocás un día y abajo ves cuánto te entra y de qué.
function DayPicker({ main }: { main: MainCurrency }) {
  const days = useMemo(() => {
    const t0 = Date.parse(`${TODAY}T00:00:00Z`);
    return Array.from({ length: 14 }, (_, i) => {
      const date = new Date(t0 + (i + 1) * DAY_MS).toISOString().slice(0, 10);
      const items = settlements.filter((s) => s.date === date);
      return { date, items, total: items.reduce((a, s) => a + convert(s.amount, s.code, main), 0) };
    });
  }, [main]);
  const [selected, setSelected] = useState(days[0].date);
  const day = days.find((d) => d.date === selected) ?? days[0];
  const index = days.indexOf(day);
  const total = days.reduce((a, d) => a + d.total, 0);
  const sales = day.items.reduce((a, s) => a + s.sales, 0);

  return (
    <div className="flex min-w-0 flex-col border-t border-border p-6 lg:border-t-0 lg:p-8">
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-sm font-medium">Cuándo te entra</p>
        <p className="text-xs text-subtle">
          Próximos 14 días · <span className="tabular-nums text-muted">≈ {formatCurrency(total, main)}</span>
        </p>
      </div>

      {/* Días */}
      {/* Se desliza de costado; el desvanecido de la derecha avisa que hay más días. */}
      <div
        className="-mx-1 mt-4 flex snap-x gap-2 overflow-x-auto px-1 pb-2 [mask-image:linear-gradient(to_right,black_88%,transparent)] [scrollbar-width:none]"
        role="tablist"
        aria-label="Días"
      >
        {days.map((d, i) => {
          const active = d.date === day.date;
          const empty = d.total === 0;
          return (
            <button
              key={d.date}
              type="button"
              role="tab"
              aria-selected={active}
              disabled={empty}
              onClick={() => setSelected(d.date)}
              className={`flex w-[4.5rem] shrink-0 snap-start flex-col items-center rounded-2xl border px-1 py-3 transition ${
                active
                  ? "border-transparent bg-brand text-white shadow-lg shadow-violet-500/25"
                  : empty
                    ? "cursor-default border-dashed border-border text-subtle/50"
                    : "border-border text-muted hover:border-violet-500/40 hover:bg-violet-500/10 hover:text-foreground"
              }`}
            >
              <span className={`text-[10px] uppercase ${active ? "text-white/80" : ""}`}>
                {i === 0 ? "mañ" : fmtDay(d.date, { weekday: "short" }).replace(".", "")}
              </span>
              <span className="mt-0.5 text-xl font-semibold tabular-nums">{fmtDay(d.date, { day: "numeric" })}</span>
              {/* Cuánto entra ese día, sin tener que tocarlo */}
              <span
                className={`mt-1.5 text-[11px] font-medium tabular-nums ${
                  active ? "text-white" : empty ? "" : "text-violet-300"
                }`}
              >
                {empty ? "—" : `+${formatCompactCurrency(d.total, main)}`}
              </span>
            </button>
          );
        })}
      </div>

      {/* El día elegido */}
      <div className="mt-4 flex flex-1 flex-col">
        <p className="text-sm text-muted first-letter:uppercase">
          {fmtDay(day.date, { weekday: "long", day: "numeric", month: "long" })}
          {index === 0 && <span className="text-subtle"> · mañana</span>}
          {index > 0 && <span className="text-subtle"> · en {index + 1} días</span>}
        </p>
        <p className="mt-1 text-4xl font-semibold tracking-tight tabular-nums">
          <span className="text-violet-300">+</span>
          <CountUp value={day.total} format={(n) => formatCurrency(n, main)} />
        </p>
        <p className="mt-1 text-xs text-subtle">
          {sales} {sales === 1 ? "venta" : "ventas"} · pasa a tu disponible automáticamente
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
    </div>
  );
}

// ═══ Cambiá tus monedas ════════════════════════════════════════════════════
// Un convertidor: cada moneda en un renglón "de → a", con lo que te queda en tu moneda principal
// y el botón Convertir. Si todavía no hay saldo, dice cuándo se acredita.
export function CurrencyList({
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
  const others = balances.filter((b) => b.code !== main);
  const ready = others.reduce((a, b) => a + convert(b.available, b.code, main), 0);
  // Próxima acreditación de cada moneda.
  const nextDate = (code: string) => settlements.filter((st) => st.code === code).map((st) => st.date).sort()[0];

  return (
    <Card className="mt-4 scroll-mt-24">
      <div id="monedas" className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand text-white shadow-lg shadow-violet-500/25">
            <ArrowRightLeft className="size-5" />
          </span>
          <div>
            <p className="font-semibold">Cambiá tus monedas a {main}</p>
            <p className="text-sm text-muted">Cada venta entra en la moneda del comprador. Cuando se acredita, la pasás a {main} acá.</p>
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
      <div className="px-5 pb-4">
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

      {/* Mismo alto en las dos pestañas, para que la página no se mueva al cambiar. */}
      <div className="h-[28rem] overflow-y-auto">
      {tab === "historial" ? (
        <ConversionHistory history={history} main={main} />
      ) : (
      <ul className="space-y-2 px-5 pb-5">
        {others.map((b) => {
          const canConvert = b.available > 0;
          const shown = canConvert ? b.available : b.pending;
          const next = nextDate(b.code);
          return (
            <li
              key={b.code}
              className={`grid items-center gap-3 rounded-2xl border p-3 transition sm:grid-cols-[minmax(0,1fr)_minmax(4rem,1fr)_minmax(0,1fr)_auto] sm:gap-4 sm:p-4 ${
                canConvert ? "border-violet-500/40 bg-brand-soft" : "border-border bg-background/40"
              }`}
            >
              {/* De: tu moneda */}
              <div className="flex min-w-0 items-center gap-3">
                <Flag code={b.code} size="size-10" />
                <div className="min-w-0">
                  <p className={`truncate text-lg font-semibold tabular-nums ${canConvert ? "" : "text-muted"}`}>{fmt(shown, b.code)}</p>
                  <p className="truncate text-xs text-subtle">
                    {CURRENCIES[b.code].name} · {canConvert ? "disponible" : "por acreditar"}
                  </p>
                </div>
              </div>

              {/* Flecha de cambio */}
              <div aria-hidden className="relative hidden h-px sm:block">
                <span className={`absolute inset-0 ${canConvert ? "bg-gradient-to-r from-violet-500/20 via-violet-400 to-violet-500/20" : "bg-border"}`} />
                {canConvert && (
                  <span className="absolute inset-y-0 w-8 animate-[flow_1.8s_linear_infinite] bg-gradient-to-r from-transparent via-white/80 to-transparent" />
                )}
                <span
                  className={`absolute left-1/2 top-1/2 grid size-7 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border ${
                    canConvert ? "border-violet-400/60 bg-surface text-violet-300" : "border-border bg-surface text-subtle"
                  }`}
                >
                  <ArrowRight className="size-3.5" />
                </span>
              </div>

              {/* A: tu moneda principal */}
              <div className="flex min-w-0 items-center gap-3 sm:justify-end">
                <div className="min-w-0 sm:text-right">
                  <p className={`truncate text-lg font-semibold tabular-nums ${canConvert ? "text-violet-300" : "text-subtle"}`}>
                    ≈ {formatCurrency(convert(shown, b.code, main), main)}
                  </p>
                  <p className="truncate text-xs text-subtle">{canConvert ? `te quedan en ${main}` : `cuando se acredite`}</p>
                </div>
                <Flag code={main} size="size-10" />
              </div>

              {/* Acción */}
              <div className="sm:w-40 sm:text-right">
                {canConvert ? (
                  <button
                    type="button"
                    onClick={() => setConverting(b.code)}
                    className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-brand px-4 text-sm font-medium text-white shadow-lg shadow-violet-500/25 transition hover:bg-violet-500"
                  >
                    <ArrowRightLeft className="size-4" /> Convertir
                  </button>
                ) : (
                  <p className="flex h-10 items-center justify-center gap-1.5 rounded-xl border border-dashed border-border px-3 text-xs text-muted sm:justify-end sm:border-0">
                    <Clock className="size-3.5 text-amber-400" />
                    {next ? `Se acredita el ${fmtDay(next, { weekday: "short", day: "numeric" }).replace(".", "")}` : "Sin saldo por ahora"}
                  </p>
                )}
              </div>
            </li>
          );
        })}
      </ul>
      )}
      </div>

      <p className="flex items-center gap-1.5 border-t border-border px-5 py-3 text-xs text-subtle">
        <Info className="size-3.5" /> La tasa final la define la pasarela en el momento de convertir.
      </p>

      <ConvertSheet
        code={converting}
        main={main}
        balance={balances.find((b) => b.code === converting)}
        onClose={() => setConverting(null)}
        onConfirm={onConvert}
      />
    </Card>
  );
}

// Lo que ya convertiste: de qué moneda, cuánto, cuánto recibiste y a qué tasa.
function ConversionHistory({ history, main }: { history: Conversion[]; main: MainCurrency }) {
  const thisMonth = history
    .filter((c) => c.date.slice(0, 7) === TODAY.slice(0, 7))
    .reduce((a, c) => a + convert(c.received, c.to, main), 0);
  const total = history.reduce((a, c) => a + convert(c.received, c.to, main), 0);

  if (history.length === 0) {
    return <p className="grid h-full place-items-center px-5 text-sm text-subtle">Todavía no convertiste ninguna moneda.</p>;
  }

  return (
    <div className="px-5 pb-5">
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
      <ul className="divide-y divide-border rounded-2xl border border-border">
        {history.map((c) => {
          const rate = c.received / c.amount;
          return (
            <li key={c.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3 transition hover:bg-violet-500/5">
              <div className="w-24 shrink-0" title={c.id}>
                <p className="text-sm font-medium first-letter:uppercase">
                  {new Intl.DateTimeFormat("es-AR", { day: "numeric", month: "short", timeZone: "UTC" }).format(new Date(c.date))}
                </p>
                <p className="text-xs tabular-nums text-subtle">
                  {new Intl.DateTimeFormat("es-AR", { hour: "2-digit", minute: "2-digit", timeZone: "UTC" }).format(new Date(c.date))}
                </p>
              </div>
              {/* De → a */}
              <div className="flex min-w-0 flex-1 items-center gap-3">
                <span className="flex min-w-0 items-center gap-2">
                  <Flag code={c.from} size="size-7" />
                  <span className="truncate text-sm tabular-nums text-muted">{fmt(c.amount, c.from)}</span>
                </span>
                <ArrowRight className="size-3.5 shrink-0 text-violet-400" />
                <span className="flex min-w-0 items-center gap-2">
                  <Flag code={c.to} size="size-7" />
                  <span className="truncate text-sm font-semibold tabular-nums">{formatCurrency(c.received, c.to)}</span>
                </span>
              </div>
              <p className="text-xs tabular-nums text-subtle">
                1 {c.from} = {formatCurrency(rate, c.to, rate < 0.01 ? 5 : 4)}
              </p>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-400 ring-1 ring-inset ring-emerald-500/20">
                <Check className="size-3" /> Hecha
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
