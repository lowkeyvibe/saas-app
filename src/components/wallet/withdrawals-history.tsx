"use client";

import { useState } from "react";
import { CircleCheck, CircleDot, CircleX, Clock, Coins, Landmark, Layers, X } from "lucide-react";
import { Dropdown } from "@/components/dashboard/dropdown";
import { Card, CountUp } from "@/components/dashboard/ui";
import { formatCurrency } from "@/lib/format";
import { convert, type MainCurrency, type PayoutMethod, type Withdrawal, type WithdrawalStatus } from "@/lib/mock-wallet";
import { METHOD_ICON } from "./accounts";

type View = "retiro" | "dia" | "semana" | "mes";

const VIEWS: { value: View; label: string }[] = [
  { value: "retiro", label: "Cada retiro" },
  { value: "dia", label: "Por día" },
  { value: "semana", label: "Por semana" },
  { value: "mes", label: "Por mes" },
];

const STATUS: Record<WithdrawalStatus, { label: string; className: string; dot: string }> = {
  acreditado: { label: "Acreditado", className: "bg-emerald-500/10 text-emerald-400 ring-emerald-500/20", dot: "bg-emerald-400" },
  "en-proceso": { label: "En camino", className: "bg-amber-500/10 text-amber-400 ring-amber-500/20", dot: "bg-amber-400" },
  rechazado: { label: "Rechazado", className: "bg-rose-500/10 text-rose-400 ring-rose-500/20", dot: "bg-rose-400" },
};

const KIND_LABEL: Record<PayoutMethod["kind"], string> = {
  banco: "Cuenta bancaria",
  mercadopago: "Mercado Pago",
  paypal: "PayPal",
  cripto: "Cripto (USDT)",
};

const fmtDate = (iso: string, opts: Intl.DateTimeFormatOptions) =>
  new Intl.DateTimeFormat("es-AR", { ...opts, timeZone: "UTC" }).format(new Date(iso));

// Lunes de la semana de una fecha (AAAA-MM-DD).
function weekStart(iso: string) {
  const d = new Date(`${iso.slice(0, 10)}T00:00:00Z`);
  const day = (d.getUTCDay() + 6) % 7; // 0 = lunes
  d.setUTCDate(d.getUTCDate() - day);
  return d.toISOString().slice(0, 10);
}

function periodKey(w: Withdrawal, view: View) {
  if (view === "dia") return w.date.slice(0, 10);
  if (view === "semana") return weekStart(w.date);
  return w.date.slice(0, 7);
}

function periodLabel(key: string, view: View) {
  if (view === "dia") return fmtDate(`${key}T00:00:00Z`, { weekday: "short", day: "numeric", month: "short" });
  if (view === "semana") {
    const end = new Date(Date.parse(`${key}T00:00:00Z`) + 6 * 86_400_000).toISOString();
    return `${fmtDate(`${key}T00:00:00Z`, { day: "numeric", month: "short" })} – ${fmtDate(end, { day: "numeric", month: "short" })}`;
  }
  return fmtDate(`${key}-01T00:00:00Z`, { month: "long", year: "numeric" });
}

// Historial de retiros con filtros: cómo verlos (cada retiro, por día, semana o mes),
// estado, tipo de cuenta y moneda. Los totales siempre se ven, en la moneda principal.
export function WithdrawalsHistory({
  history,
  accounts,
  main,
}: {
  history: Withdrawal[];
  accounts: PayoutMethod[];
  main: MainCurrency;
}) {
  const [view, setView] = useState<View>("retiro");
  const [status, setStatus] = useState<WithdrawalStatus | "todos">("todos");
  const [kind, setKind] = useState<PayoutMethod["kind"] | "todas">("todas");
  const [currency, setCurrency] = useState<"todas" | "USD" | "EUR">("todas");

  const accountOf = (w: Withdrawal) => accounts.find((a) => a.id === w.methodId);
  const kinds = [...new Set(history.map((w) => accountOf(w)?.kind).filter(Boolean))] as PayoutMethod["kind"][];
  const currencies = [...new Set(history.map((w) => w.currency ?? "USD"))];

  const rows = history.filter(
    (w) =>
      (status === "todos" || w.status === status) &&
      (kind === "todas" || accountOf(w)?.kind === kind) &&
      (currency === "todas" || (w.currency ?? "USD") === currency),
  );
  const filtered = status !== "todos" || kind !== "todas" || currency !== "todas";

  const inMain = (w: Withdrawal) => convert(w.amount, w.currency ?? "USD", main);
  const sumOf = (list: Withdrawal[], st: WithdrawalStatus) => list.filter((w) => w.status === st).reduce((a, w) => a + inMain(w), 0);
  const totals = {
    withdrawn: sumOf(rows, "acreditado"),
    inTransit: sumOf(rows, "en-proceso"),
    rejected: rows.filter((w) => w.status === "rechazado").length,
  };

  // Agrupado por día, semana o mes.
  const groups: [string, Withdrawal[]][] = [];
  if (view !== "retiro") {
    const map = new Map<string, Withdrawal[]>();
    for (const w of rows) {
      const k = periodKey(w, view);
      map.set(k, [...(map.get(k) ?? []), w]);
    }
    groups.push(...[...map.entries()].sort((a, b) => b[0].localeCompare(a[0])));
  }
  const maxGroup = Math.max(1, ...groups.map(([, list]) => list.filter((w) => w.status !== "rechazado").reduce((a, w) => a + inMain(w), 0)));

  return (
    // Sin overflow-hidden: si no, los menús de los filtros quedan recortados.
    <Card className="mt-4 scroll-mt-24">
      <span id="historial" />

      {/* Encabezado con los totales de lo que estás viendo */}
      <div className="flex flex-col gap-4 p-5 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h2 className="font-medium">Historial de retiros</h2>
          <p className="mt-0.5 text-sm text-muted">
            {rows.length} {rows.length === 1 ? "retiro" : "retiros"}
            {filtered && " con los filtros elegidos"}
          </p>
        </div>
        <dl className="grid grid-cols-3 gap-3 sm:gap-6">
          <Total label="Retirado" value={totals.withdrawn} main={main} className="text-emerald-400" />
          <Total label="En camino" value={totals.inTransit} main={main} className="text-amber-400" />
          <div className="text-right">
            <dt className="text-xs text-subtle">Rechazados</dt>
            <dd className={`mt-0.5 text-lg font-semibold tabular-nums ${totals.rejected ? "text-rose-400" : ""}`}>{totals.rejected}</dd>
          </div>
        </dl>
      </div>

      {/* Filtros */}
      <div className="flex flex-col gap-2 border-t border-border px-5 py-3 lg:flex-row lg:items-center">
        <div role="radiogroup" aria-label="Cómo ver los retiros" className="inline-flex self-start rounded-lg border border-border bg-background p-1">
          {VIEWS.map((v) => (
            <button
              key={v.value}
              type="button"
              role="radio"
              aria-checked={view === v.value}
              onClick={() => setView(v.value)}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition ${
                view === v.value ? "bg-brand text-white shadow-lg shadow-violet-500/20" : "text-muted hover:bg-overlay/[0.04] hover:text-foreground"
              }`}
            >
              {v.label}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2 lg:ml-auto">
          <Dropdown
            label="Estado"
            icon={CircleDot}
            value={status}
            onChange={(v) => setStatus(v as WithdrawalStatus | "todos")}
            options={[
              { value: "todos", label: "Todos los estados", icon: Layers },
              { value: "acreditado", label: "Acreditados", icon: CircleCheck },
              { value: "en-proceso", label: "En camino", icon: Clock },
              { value: "rechazado", label: "Rechazados", icon: CircleX },
            ]}
          />
          <Dropdown
            label="Tipo de cuenta"
            icon={Landmark}
            value={kind}
            onChange={(v) => setKind(v as PayoutMethod["kind"] | "todas")}
            options={[
              { value: "todas", label: "Todas las cuentas", icon: Layers },
              ...kinds.map((k) => ({ value: k, label: KIND_LABEL[k], icon: METHOD_ICON[k] })),
            ]}
          />
          <Dropdown
            label="Moneda"
            icon={Coins}
            value={currency}
            onChange={(v) => setCurrency(v as "todas" | "USD" | "EUR")}
            options={[
              { value: "todas", label: "Todas las monedas", icon: Layers },
              ...currencies.map((c) => ({ value: c, label: c === "USD" ? "🇺🇸 Dólares (USD)" : "🇪🇺 Euros (EUR)" })),
            ]}
          />
          {filtered && (
            <button
              type="button"
              onClick={() => {
                setStatus("todos");
                setKind("todas");
                setCurrency("todas");
              }}
              className="inline-flex h-9 items-center gap-1 rounded-lg px-2.5 text-xs text-muted transition hover:bg-violet-500/10 hover:text-foreground"
            >
              <X className="size-3.5" /> Limpiar
            </button>
          )}
        </div>
      </div>

      {/* Alto fijo con desplazamiento propio: cambiar de vista o de filtro no cambia el largo de la página. */}
      <div className="h-[30rem] overflow-auto border-t border-border [&_thead]:sticky [&_thead]:top-0 [&_thead]:z-10 [&_thead]:bg-surface [&_thead_tr]:border-t-0">
        {view === "retiro" ? (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-y border-border text-left text-xs text-subtle">
                <th className="px-5 py-2.5 font-medium">Retiro</th>
                <th className="px-5 py-2.5 font-medium">Fecha</th>
                <th className="px-5 py-2.5 font-medium">Cuenta</th>
                <th className="px-5 py-2.5 font-medium">Estado</th>
                <th className="px-5 py-2.5 text-right font-medium">Monto</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.map((w) => {
                const acc = accountOf(w);
                const Icon = acc ? METHOD_ICON[acc.kind] : null;
                const st = STATUS[w.status];
                return (
                  <tr key={w.id} className="transition hover:bg-violet-500/10">
                    <td className="whitespace-nowrap px-5 py-3 font-medium tabular-nums">{w.id}</td>
                    <td className="whitespace-nowrap px-5 py-3 text-muted">
                      {fmtDate(w.date, { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                    </td>
                    <td className="whitespace-nowrap px-5 py-3 text-muted">
                      <span className="inline-flex items-center gap-2">
                        {Icon && (
                          <span className="grid size-6 place-items-center rounded-md bg-brand-soft text-violet-300">
                            <Icon className="size-3.5" />
                          </span>
                        )}
                        {acc?.name ?? "Cuenta eliminada"}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${st.className}`}>
                        <span className="size-1.5 rounded-full bg-current" />
                        {st.label}
                      </span>
                      {w.note && <p className="mt-1 text-xs text-subtle">{w.note}</p>}
                    </td>
                    <td
                      className={`whitespace-nowrap px-5 py-3 text-right font-medium tabular-nums ${w.status === "rechazado" ? "text-subtle line-through" : ""}`}
                    >
                      {formatCurrency(w.amount, w.currency ?? "USD")}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-y border-border text-left text-xs text-subtle">
                <th className="px-5 py-2.5 font-medium">{view === "dia" ? "Día" : view === "semana" ? "Semana" : "Mes"}</th>
                <th className="px-5 py-2.5 font-medium">Retiros</th>
                <th className="px-5 py-2.5 font-medium">Cuentas</th>
                <th className="w-1/3 px-5 py-2.5 font-medium">Total retirado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {groups.map(([key, list]) => {
                const ok = list.filter((w) => w.status !== "rechazado");
                const total = ok.reduce((a, w) => a + inMain(w), 0);
                const names = [...new Set(list.map((w) => accountOf(w)?.name ?? "Cuenta eliminada"))];
                return (
                  <tr key={key} className="transition hover:bg-violet-500/10">
                    <td className="whitespace-nowrap px-5 py-3 font-medium first-letter:uppercase">{periodLabel(key, view)}</td>
                    <td className="px-5 py-3">
                      <span className="flex flex-wrap items-center gap-2 text-muted">
                        <span className="tabular-nums text-foreground">{list.length}</span>
                        {(["acreditado", "en-proceso", "rechazado"] as const).map((st) => {
                          const n = list.filter((w) => w.status === st).length;
                          return n ? (
                            <span key={st} className="inline-flex items-center gap-1 text-xs" title={STATUS[st].label}>
                              <span className={`size-1.5 rounded-full ${STATUS[st].dot}`} /> {n}
                            </span>
                          ) : null;
                        })}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-muted">{names.join(" · ")}</td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="h-2 flex-1 overflow-hidden rounded-full bg-surface-2">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-violet-700 to-violet-400"
                            style={{ width: `${(total / maxGroup) * 100}%` }}
                          />
                        </div>
                        <span className="w-28 text-right font-medium tabular-nums">{formatCurrency(total, main)}</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
        {rows.length === 0 && <p className="px-5 py-16 text-center text-sm text-subtle">No hay retiros con esos filtros.</p>}
      </div>

      {/* Total de lo que estás viendo */}
      {(
        <div className="flex items-center justify-between rounded-b-xl border-t border-border bg-background/40 px-5 py-3 text-sm">
          <span className="text-muted">
            Total{filtered ? " con estos filtros" : ""}{" "}
            <span className="text-xs text-subtle">(retirado + en camino, sin rechazados, en {main})</span>
          </span>
          <span className="font-semibold tabular-nums">{formatCurrency(totals.withdrawn + totals.inTransit, main)}</span>
        </div>
      )}
    </Card>
  );
}

function Total({ label, value, main, className }: { label: string; value: number; main: MainCurrency; className: string }) {
  return (
    <div className="text-right">
      <dt className="text-xs text-subtle">{label}</dt>
      <dd className={`mt-0.5 text-lg font-semibold tabular-nums ${value ? className : ""}`}>
        <CountUp value={value} format={(n) => formatCurrency(n, main)} />
      </dd>
    </div>
  );
}
