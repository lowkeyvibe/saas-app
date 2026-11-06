"use client";

import { useCallback, useMemo, useState } from "react";
import {
  DollarSign,
  Download,
  Globe2,
  Receipt,
  Repeat,
  ShoppingBag,
  Store,
  TrendingUp,
  Users,
} from "lucide-react";
import { Card, CardHeader, MeterBar, StatCard } from "@/components/dashboard/ui";
import { OrderDrawer } from "@/components/dashboard/order-drawer";
import { SalesTable } from "@/components/dashboard/sales-table";
import { SourceIcon } from "@/components/dashboard/brand-icons";
import { QuickRanges } from "@/components/dashboard/quick-ranges";
import { DateRangePicker, presetLabel, type RangeSelection } from "@/components/dashboard/date-range-picker";
import { presetRange } from "@/lib/analytics";
import { activeStores, COUNTRY_FLAGS, productById, sales, TODAY, type Sale } from "@/lib/mock-data";
import { formatMoney, formatNumber, formatRange } from "@/lib/format";

// Solo ventas aprobadas: este es el historial de lo que se vendió de verdad, en todas las tiendas.
const approved = sales.filter((s) => s.status === "aprobada");

const storeOf = (s: Sale) => activeStores.find((t) => t.id === productById(s.productId)?.storeId);
const upsellRevenue = (s: Sale) =>
  s.upsells.filter((u) => u.status === "aprobada").reduce((a, u) => a + (productById(u.productId)?.price ?? 0), 0);
const approvedUpsells = (s: Sale) => s.upsells.filter((u) => u.status === "aprobada").length;

export function SalesHistory() {
  const [selected, setSelected] = useState<Sale | null>(null);
  const closeDrawer = useCallback(() => setSelected(null), []);

  // Período: mismos atajos y calendario que el Resumen. Arranca en "Histórico" porque es el historial general.
  const [range, setRange] = useState<RangeSelection>({ ...presetRange("maximo"), preset: "maximo" });

  // Ventas del período elegido.
  const rows = useMemo(
    () => approved.filter((s) => s.date.slice(0, 10) >= range.from && s.date.slice(0, 10) <= range.to),
    [range],
  );

  // Números del período y de los filtros elegidos.
  const kpis = useMemo(() => {
    const revenue = rows.reduce((a, s) => a + s.amount, 0);
    const byCustomer = new Map<string, number>();
    for (const s of rows) byCustomer.set(s.email, (byCustomer.get(s.email) ?? 0) + 1);
    const withUpsell = rows.filter((s) => approvedUpsells(s) > 0).length;
    return {
      orders: rows.length,
      revenue,
      avgTicket: rows.length ? revenue / rows.length : 0,
      customers: byCustomer.size,
      returning: [...byCustomer.values()].filter((n) => n > 1).length,
      countries: new Set(rows.map((s) => s.country)).size,
      stores: new Set(rows.map((s) => storeOf(s)?.id)).size,
      upsells: rows.reduce((a, s) => a + approvedUpsells(s), 0),
      upsellRate: rows.length ? (withUpsell / rows.length) * 100 : 0,
      upsellRevenue: rows.reduce((a, s) => a + upsellRevenue(s), 0),
    };
  }, [rows]);

  const breakdown = useMemo(() => {
    const group = (key: (s: Sale) => string) => {
      const map = new Map<string, { orders: number; revenue: number }>();
      for (const s of rows) {
        const k = key(s);
        const g = map.get(k) ?? { orders: 0, revenue: 0 };
        g.orders += 1;
        g.revenue += s.amount;
        map.set(k, g);
      }
      return [...map.entries()].map(([label, v]) => ({ label, ...v })).sort((a, b) => b.revenue - a.revenue);
    };
    return {
      stores: group((s) => storeOf(s)?.name ?? "—"),
      countries: group((s) => s.country),
      sources: group((s) => s.source),
      methods: group((s) => s.method),
    };
  }, [rows]);


  const exportCsv = () => {
    const header = ["Pedido", "Fecha", "Cliente", "Email", "País", "Tienda", "Producto", "Upsells", "Medio de pago", "Canal", "Total USD"];
    const lines = rows.map((s) => [
      s.id,
      s.date,
      s.customer,
      s.email,
      s.country,
      storeOf(s)?.name ?? "",
      productById(s.productId)?.name ?? "",
      String(approvedUpsells(s)),
      s.method,
      s.source,
      s.amount.toFixed(2),
    ]);
    const csv = [header, ...lines].map((r) => r.map((c) => `"${c.replace(/"/g, '""')}"`).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([`﻿${csv}`], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `ventas-${TODAY}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Ventas</h1>
          <p className="mt-1 text-sm text-muted">Historial de todas las ventas aprobadas, de todas tus tiendas.</p>
        </div>
        <button
          type="button"
          onClick={exportCsv}
          disabled={rows.length === 0}
          className="inline-flex h-9 items-center gap-2 self-start rounded-lg border border-border px-3.5 text-sm font-medium transition hover:bg-violet-500/10 disabled:opacity-40 sm:self-auto"
        >
          <Download className="size-4" /> Exportar CSV
        </button>
      </div>

      {/* Período: igual que en el Resumen. */}
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <QuickRanges value={range} onChange={setRange} />
        <div className="ml-auto">
          <DateRangePicker value={range} onApply={setRange} />
        </div>
      </div>

      {/* Números clave */}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={ShoppingBag} label="Ventas aprobadas" value={formatNumber(kpis.orders)} footer={`en ${kpis.stores} ${kpis.stores === 1 ? "tienda" : "tiendas"}`} />
        <StatCard icon={DollarSign} label="Ingresos totales" value={formatMoney(kpis.revenue)} footer="USD, con upsells incluidos" />
        <StatCard icon={Receipt} label="Ticket promedio" value={formatMoney(kpis.avgTicket)} footer="por venta" />
        <StatCard icon={Users} label="Clientes" value={formatNumber(kpis.customers)} footer={`${kpis.returning} ${kpis.returning === 1 ? "compró" : "compraron"} más de una vez`} />
        <StatCard icon={Globe2} label="Países" value={formatNumber(kpis.countries)} footer="distintos que compraron" />
        <StatCard icon={Store} label="Tiendas con ventas" value={`${kpis.stores} de ${activeStores.length}`} footer="tiendas activas" />
        <StatCard icon={Repeat} label="Upsells aceptados" value={formatNumber(kpis.upsells)} footer={`${kpis.upsellRate.toFixed(0)} % de las ventas sumó al menos uno`} />
        <StatCard icon={TrendingUp} label="Ingresos por upsells" value={formatMoney(kpis.upsellRevenue)} footer={`${kpis.revenue ? ((kpis.upsellRevenue / kpis.revenue) * 100).toFixed(0) : 0} % de los ingresos`} />
      </div>

      {/* Desgloses */}
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Breakdown title="Por tienda" items={breakdown.stores} total={kpis.revenue} />
        <Breakdown title="Por país" items={breakdown.countries} total={kpis.revenue} prefix={(l) => COUNTRY_FLAGS[l] ?? "🌎"} />
        <Breakdown title="Por canal" items={breakdown.sources} total={kpis.revenue} icon={(l) => <SourceIcon name={l} />} />
        <Breakdown title="Por medio de pago" items={breakdown.methods} total={kpis.revenue} icon={(l) => <SourceIcon name={l} />} />
      </div>

      {/* Historial */}
      <Card className="mt-4 overflow-hidden">
        <CardHeader
          title="Historial"
          description={`${formatNumber(rows.length)} ${rows.length === 1 ? "venta" : "ventas"} · ${
            range.preset === "custom" ? formatRange(range.from, range.to) : presetLabel(range.preset)
          } · tocá una para ver el detalle`}
        />
        {/* Todas las ventas, sin paginar. Misma tabla que "Últimas ventas" del Resumen. */}
        <div className="mt-3">
          <SalesTable rows={rows} onSelect={setSelected} selectedId={selected?.id} empty="No hay ventas en este período." />
        </div>
      </Card>

      {selected && <OrderDrawer sale={selected} onClose={closeDrawer} />}
    </>
  );
}

function Breakdown({
  title,
  items,
  total,
  prefix,
  icon,
}: {
  title: string;
  items: { label: string; orders: number; revenue: number }[];
  total: number;
  prefix?: (label: string) => string;
  icon?: (label: string) => React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader title={title} />
      <ul className="space-y-3 px-5 pb-5 pt-4">
        {items.length === 0 && <li className="text-sm text-subtle">Sin datos.</li>}
        {items.map((i, index) => {
          const pct = total ? (i.revenue / total) * 100 : 0;
          return (
            <li key={i.label}>
              <div className="flex items-center justify-between gap-3 text-sm">
                <span className="flex min-w-0 items-center gap-2.5 truncate">
                  {icon?.(i.label)}
                  {prefix && <span>{prefix(i.label)}</span>}
                  <span className="truncate">{i.label}</span>
                  <span className="text-xs text-subtle">
                    {i.orders} {i.orders === 1 ? "venta" : "ventas"}
                  </span>
                </span>
                <span className="shrink-0 tabular-nums">
                  {formatMoney(i.revenue)} <span className="text-xs text-subtle">· {pct.toFixed(0)} %</span>
                </span>
              </div>
              <MeterBar value={pct / 100} emphasis={index === 0} className="mt-2" />
            </li>
          );
        })}
      </ul>
    </Card>
  );
}
