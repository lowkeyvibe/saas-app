"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Archive,
  Eye,
  Check,
  History,
  Layers,
  Package,
  Plug,
  Receipt,
  RotateCcw,
  Settings2,
  ShoppingBag,
  Sparkles,
  TrendingUp,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { site } from "@/config/site";
import { Card, Sparkline } from "@/components/dashboard/ui";
import { inactiveStoreDaily, inactiveStores, type InactiveStore } from "@/lib/mock-data";
import { getStoreSettings } from "@/lib/mock-settings";
import { formatMoney, formatNumber } from "@/lib/format";

const REASON: Record<InactiveStore["reason"], { label: string; className: string; hint: string }> = {
  pausada: {
    label: "Pausada",
    className: "bg-amber-500/10 text-amber-400 ring-amber-500/20",
    hint: "La apagaste vos. Se puede reactivar y editar.",
  },
  "sin plan": {
    label: "Sin plan",
    className: "bg-rose-500/10 text-rose-400 ring-rose-500/20",
    hint: "Se apagó cuando venció el plan. Se puede reactivar y editar.",
  },
  archivada: {
    label: "Archivada",
    className: "bg-zinc-500/10 text-muted ring-zinc-500/20",
    hint: "Guardada para siempre. Reactivala para volver a editarla.",
  },
};

const day = (iso: string) =>
  new Intl.DateTimeFormat("es-AR", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }).format(
    new Date(`${iso}T00:00:00Z`),
  );
// "mar 2025"
const monthYear = (iso: string) =>
  new Intl.DateTimeFormat("es-AR", { month: "short", year: "numeric", timeZone: "UTC" })
    .format(new Date(`${iso}T00:00:00Z`))
    .replace(" de ", " ");
const monthsBetween = (a: string, b: string) =>
  Math.max(1, Math.round((Date.parse(`${b}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`)) / (30.44 * 86_400_000)));

// Ventas por mes de una tienda inactiva (dentro del historial que tenemos).
function monthly(id: string) {
  const map = new Map<string, number>();
  for (const d of inactiveStoreDaily[id] ?? []) {
    if (!d.revenue) continue;
    const m = d.date.slice(0, 7);
    map.set(m, (map.get(m) ?? 0) + d.revenue);
  }
  return [...map.entries()].map(([month, revenue]) => ({ month, revenue }));
}

export function InactiveStores() {

  if (inactiveStores.length === 0) {
    return (
      <>
        <Header />
        <Card className="grid place-items-center px-6 py-20 text-center">
          <span className="grid size-14 place-items-center rounded-2xl bg-brand-soft text-violet-300">
            <Archive className="size-6" />
          </span>
          <p className="mt-4 font-medium">No tenés tiendas inactivas</p>
          <p className="mt-1 max-w-sm text-sm text-muted">
            Cuando apagues una tienda, va a aparecer acá con su configuración y su historial completo.
          </p>
        </Card>
      </>
    );
  }

  return (
    <>
      <Header />

      {/* Una fila por tienda. El ojo muestra sus métricas al pasar el mouse (o al tocarlo). */}
      <div className="mb-3 hidden grid-cols-[minmax(0,2.2fr)_minmax(0,1.6fr)_minmax(0,1fr)_minmax(0,0.8fr)_auto] gap-4 px-5 text-xs text-subtle lg:grid">
        <span>Tienda</span>
        <span>Estuvo online</span>
        <span className="text-right">Facturó</span>
        <span className="text-right">Ventas</span>
        <span className="w-[13.5rem]" />
      </div>
      <ul className="space-y-2">
        {[...inactiveStores]
          .sort((a, b) => b.totalRevenue - a.totalRevenue)
          .map((s, i, list) => (
            <StoreRow key={s.id} store={s} openUp={i === list.length - 1 && list.length > 1} />
          ))}
      </ul>
    </>
  );
}

function Header() {
  return (
    <div className="mb-6">
      <h1 className="text-2xl font-semibold tracking-tight">Tiendas inactivas</h1>
      <p className="mt-1 max-w-2xl text-sm text-muted">
        Las tiendas que apagaste. Guardamos su configuración y su historial completo para siempre, y vos elegís si sumarlas a tus
        números.
      </p>
    </div>
  );
}


function StoreRow({ store: s, openUp }: { store: InactiveStore; openUp: boolean }) {
  const [peek, setPeek] = useState(false);
  const [reactivating, setReactivating] = useState<"no" | "confirm" | "done">("no");
  const reason = REASON[s.reason];
  const editable = !!getStoreSettings(s.id);
  const lifetime = monthsBetween(s.createdAt, s.deactivatedAt);

  return (
    <li
      className={`group relative rounded-2xl border bg-surface transition ${
        peek ? "z-20 border-violet-500/40 shadow-[0_0_0_1px_rgba(139,92,246,0.15),0_20px_50px_-20px_rgba(139,92,246,0.35)]" : "border-border hover:border-violet-500/30"
      }`}
    >
      <div className="grid items-center gap-4 p-4 lg:grid-cols-[minmax(0,2.2fr)_minmax(0,1.6fr)_minmax(0,1fr)_minmax(0,0.8fr)_auto] lg:px-5">
        {/* Tienda */}
        <div className="flex min-w-0 items-center gap-3">
          <span
            className={`grid size-11 shrink-0 place-items-center rounded-xl bg-gradient-to-br ${s.color} text-base font-bold text-white/90 opacity-80 saturate-50 transition group-hover:opacity-100 group-hover:saturate-100`}
          >
            {s.name[0]}
          </span>
          <div className="min-w-0">
            <p className="flex items-center gap-2">
              <span className="truncate font-semibold">{s.name}</span>
              <span
                title={reason.hint}
                className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ring-inset ${reason.className}`}
              >
                <span className="size-1.5 rounded-full bg-current" />
                {reason.label}
              </span>
            </p>
            <p className="truncate text-xs text-subtle line-through decoration-subtle/50">
              {s.subdomain}.{site.name.toLowerCase()}.app
            </p>
          </div>
        </div>

        {/* Estuvo online */}
        <div className="text-sm">
          <p className="whitespace-nowrap text-muted" title={`${day(s.createdAt)} → ${day(s.deactivatedAt)}`}>
            {monthYear(s.createdAt)} <span className="text-subtle">→</span> {monthYear(s.deactivatedAt)}
          </p>
          <p className="text-xs text-subtle">{lifetime} meses online</p>
        </div>

        {/* Facturó y ventas */}
        <p className="text-sm font-semibold tabular-nums text-violet-300 lg:text-right">
          <span className="mr-1 text-xs font-normal text-subtle lg:hidden">Facturó</span>
          {formatMoney(s.totalRevenue)}
        </p>
        <p className="text-sm tabular-nums lg:text-right">
          <span className="mr-1 text-xs text-subtle lg:hidden">Ventas</span>
          {formatNumber(s.totalSales)}
        </p>

        {/* Acciones */}
        <div className="flex items-center gap-2 lg:w-[13.5rem] lg:justify-end">
          {reactivating === "confirm" ? (
            <>
              <button type="button" onClick={() => setReactivating("no")} className="h-9 rounded-lg px-3 text-xs text-muted transition hover:bg-overlay/5">
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => setReactivating("done")}
                className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-brand px-3 text-xs font-medium text-white shadow-lg shadow-violet-500/20 transition hover:bg-violet-500"
              >
                <Check className="size-3.5" /> Confirmar
              </button>
            </>
          ) : reactivating === "done" ? (
            <span className="inline-flex h-9 items-center gap-1.5 text-xs text-emerald-400">
              <Check className="size-4" /> Reactivando…
            </span>
          ) : (
            <>
              {/* Ojo: muestra las métricas */}
              <button
                type="button"
                aria-label={`Ver métricas de ${s.name}`}
                aria-expanded={peek}
                onMouseEnter={() => setPeek(true)}
                onMouseLeave={() => setPeek(false)}
                onFocus={() => setPeek(true)}
                onBlur={() => setPeek(false)}
                onClick={() => setPeek((p) => !p)}
                className={`grid size-9 place-items-center rounded-lg border transition ${
                  peek ? "border-violet-500/50 bg-brand text-white shadow-lg shadow-violet-500/25" : "border-border text-muted hover:text-foreground"
                }`}
              >
                <Eye className="size-4" />
              </button>
              {editable ? (
                <Link
                  href={`/dashboard/tiendas/${s.id}`}
                  aria-label={`Ver la configuración de ${s.name}`}
                  title="Ver configuración"
                  className="grid size-9 place-items-center rounded-lg border border-border text-muted transition hover:border-violet-500/40 hover:bg-violet-500/10 hover:text-foreground"
                >
                  <Settings2 className="size-4" />
                </Link>
              ) : (
                <span
                  title="Las tiendas archivadas se editan después de reactivarlas."
                  className="grid size-9 cursor-not-allowed place-items-center rounded-lg border border-dashed border-border text-subtle"
                >
                  <Archive className="size-4" />
                </span>
              )}
              <button
                type="button"
                onClick={() => setReactivating("confirm")}
                className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-brand px-3.5 text-xs font-medium text-white shadow-lg shadow-violet-500/20 transition hover:bg-violet-500"
              >
                <RotateCcw className="size-3.5" /> Reactivar
              </button>
            </>
          )}
        </div>
      </div>

      {/* Métricas: aparecen al pasar el mouse por el ojo */}
      {peek && <MetricsPopover store={s} openUp={openUp} />}
    </li>
  );
}

// Tarjeta flotante con las métricas de la tienda: tendencia, números de toda su vida y lo que quedó guardado.
function MetricsPopover({ store: s, openUp }: { store: InactiveStore; openUp: boolean }) {
  const months = monthly(s.id);
  const best = Math.max(0, ...months.map((m) => m.revenue));
  const saved: { icon: LucideIcon; label: string }[] = [
    { icon: Package, label: `${s.products} productos` },
    { icon: Wallet, label: "Pagos y checkout" },
    { icon: Plug, label: "Pixeles e integraciones" },
    { icon: Layers, label: "Diseño y textos" },
  ];

  return (
    <div
      role="tooltip"
      className={`pointer-events-none absolute right-4 z-30 w-[30rem] max-w-[calc(100vw-2rem)] overflow-hidden rounded-2xl border border-violet-500/30 bg-surface-2/95 shadow-2xl shadow-black/60 backdrop-blur-xl transition duration-200 ease-out starting:scale-95 starting:opacity-0 ${
        openUp ? "bottom-full mb-2 origin-bottom-right" : "top-full mt-2 origin-top-right"
      }`}
    >
      <div aria-hidden className="absolute -right-16 -top-16 size-44 rounded-full bg-violet-500/20 blur-3xl" />
      <div className="relative p-4">
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium uppercase tracking-wider text-subtle">Métricas de {s.name}</p>
          <span className="text-[11px] text-subtle">toda su vida</span>
        </div>

        {/* Tendencia */}
        <div className="mt-3 rounded-xl border border-border bg-background/50 px-3 pb-1.5 pt-3">
          {months.length > 1 ? (
            <Sparkline data={months.map((m) => m.revenue)} className="h-14 w-full" />
          ) : (
            <p className="grid h-14 place-items-center text-xs text-subtle">Sin ventas en los últimos 12 meses</p>
          )}
          <p className="mt-1 flex justify-between text-[10px] text-subtle">
            <span>Ventas por mes · últimos 12 meses</span>
            {best > 0 && <span className="tabular-nums">mejor mes {formatMoney(best)}</span>}
          </p>
        </div>

        {/* Números */}
        <dl className="mt-3 grid grid-cols-[1.4fr_1fr_1fr_1fr] gap-2">
          {(
            [
              [TrendingUp, "Facturó", formatMoney(s.totalRevenue), true],
              [ShoppingBag, "Ventas", formatNumber(s.totalSales), false],
              [Sparkles, "Upsells", formatNumber(s.totalUpsells), false],
              [Receipt, "Ticket", formatMoney(s.totalRevenue / s.totalSales), false],
            ] as const
          ).map(([Icon, label, value, strong]) => (
            <div key={label} className="rounded-xl border border-border bg-background/50 px-2.5 py-2">
              <dt className="flex items-center gap-1 text-[10px] text-subtle">
                <Icon className="size-3" /> {label}
              </dt>
              <dd className={`mt-0.5 truncate text-sm tabular-nums ${strong ? "font-semibold text-violet-300" : "font-medium"}`}>{value}</dd>
            </div>
          ))}
        </dl>

        {/* Configuración guardada */}
        <p className="mt-3 flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wider text-subtle">
          <History className="size-3" /> Configuración guardada
        </p>
        <div className="mt-1.5 flex flex-wrap gap-1.5">
          {saved.map((c) => (
            <span key={c.label} className="inline-flex items-center gap-1 rounded-full border border-border bg-background/50 px-2 py-0.5 text-[11px] text-muted">
              <c.icon className="size-3 text-violet-300" /> {c.label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
