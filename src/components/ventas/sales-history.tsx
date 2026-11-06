"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  DollarSign,
  Download,
  Globe2,
  ImageIcon,
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
import { HideColumnsMenu, SALE_COLUMNS, useHiddenSaleColumns } from "@/components/dashboard/hide-columns-menu";
import { SourceIcon } from "@/components/dashboard/brand-icons";
import { CountryFlag } from "@/components/dashboard/country-flag";
import { QuickRanges } from "@/components/dashboard/quick-ranges";
import { ProductFilter } from "@/components/dashboard/product-filter";
import { DateRangePicker, presetLabel, type RangeSelection } from "@/components/dashboard/date-range-picker";
import { presetRange, type ProductEarnings } from "@/lib/analytics";
import { activeStores, productById, products, sales, TODAY, type Sale } from "@/lib/mock-data";
import { formatMoney, formatNumber, formatRange } from "@/lib/format";

// Solo ventas aprobadas: este es el historial de lo que se vendió de verdad, en todas las tiendas.
const approved = sales.filter((s) => s.status === "aprobada");

// Todas las opciones de cada desglose (salen del historial completo).
const ALL_COUNTRIES = [...new Set(approved.map((s) => s.country))];
const ALL_SOURCES = [...new Set(approved.map((s) => s.source))];
const ALL_METHODS = [...new Set(approved.map((s) => s.method))];

const storeOf = (s: Sale) => activeStores.find((t) => t.id === productById(s.productId)?.storeId);
const upsellRevenue = (s: Sale) =>
  s.upsells.filter((u) => u.status === "aprobada").reduce((a, u) => a + (productById(u.productId)?.price ?? 0), 0);
const approvedUpsells = (s: Sale) => s.upsells.filter((u) => u.status === "aprobada").length;

export function SalesHistory() {
  const [selected, setSelected] = useState<Sale | null>(null);
  const closeDrawer = useCallback(() => setSelected(null), []);
  // "Ocultar datos": las mismas columnas (y lo mismo guardado) que en Últimas ventas del Resumen.
  const [hiddenCols, updateHiddenCols] = useHiddenSaleColumns();

  // Período: mismos atajos y calendario que el Resumen. Al entrar se ve el día de hoy.
  const [range, setRange] = useState<RangeSelection>({ ...presetRange("hoy"), preset: "hoy" });

  // Si llegás con #historial (desde "Ver todas" del Resumen), baja directo a la tabla, en "Histórico".
  useEffect(() => {
    if (window.location.hash !== "#historial") return;
    // "Ver todas" muestra todo el historial, no solo lo de hoy.
    const show = setTimeout(() => setRange({ ...presetRange("maximo"), preset: "maximo" }), 0);
    const t = setTimeout(() => document.getElementById("historial")?.closest(".scroll-mt-24")?.scrollIntoView({ behavior: "smooth", block: "start" }), 150);
    return () => {
      clearTimeout(show);
      clearTimeout(t);
    };
  }, []);

  // Producto elegido (null = todos).
  const [productId, setProductId] = useState<string | null>(null);
  const product = productId ? productById(productId) : undefined;

  // Ventas del período elegido (de todos los productos).
  const periodRows = useMemo(
    () => approved.filter((s) => s.date.slice(0, 10) >= range.from && s.date.slice(0, 10) <= range.to),
    [range],
  );

  // Opciones del menú de productos, con lo que facturó cada uno en el período.
  const productOptions = useMemo<ProductEarnings[]>(() => {
    const total = periodRows.reduce((a, s) => a + s.amount, 0);
    return products
      .map((p) => {
        const own = periodRows.filter((s) => s.productId === p.id);
        const revenue = own.reduce((a, s) => a + s.amount, 0);
        return {
          id: p.id,
          name: p.name,
          color: p.color,
          kind: "producto" as const,
          status: p.status,
          href: `/dashboard/productos/${p.id}`,
          revenue,
          orders: own.length,
          share: total ? revenue / total : 0,
        };
      })
      .sort((a, b) => b.revenue - a.revenue);
  }, [periodRows]);
  const periodRevenue = useMemo(() => periodRows.reduce((a, s) => a + s.amount, 0), [periodRows]);

  // Ventas del período y del producto elegido: de acá sale todo lo demás de la página.
  const rows = useMemo(
    () => (productId ? periodRows.filter((s) => s.productId === productId) : periodRows),
    [periodRows, productId],
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
    // `all`: todas las opciones posibles, para que cada desglose tenga siempre las mismas filas
    // (las que no vendieron en el período quedan en $0) y la card no cambie de alto.
    const group = (key: (s: Sale) => string, all: string[]) => {
      const map = new Map<string, { orders: number; revenue: number }>(all.map((k) => [k, { orders: 0, revenue: 0 }]));
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
      stores: group((s) => storeOf(s)?.name ?? "—", activeStores.map((t) => t.name)),
      countries: group((s) => s.country, ALL_COUNTRIES),
      sources: group((s) => s.source, ALL_SOURCES),
      methods: group((s) => s.method, ALL_METHODS),
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
    a.download = product ? `ventas-${product.id}-${TODAY}.csv` : `ventas-${TODAY}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Ventas</h1>
          <p className="mt-1 text-sm text-muted">
            {product
              ? `Historial de las ventas aprobadas de ${product.name}.`
              : "Historial de todas las ventas aprobadas, de todas tus tiendas."}
          </p>
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

      {/* Producto y período: igual que en el Resumen. */}
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <ProductFilter options={productOptions} value={productId} total={periodRevenue} onChange={setProductId} />
        <QuickRanges value={range} onChange={setRange} />
        <div className="ml-auto">
          <DateRangePicker value={range} onApply={setRange} />
        </div>
      </div>

      {/* Números clave */}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={ShoppingBag} label="Ventas aprobadas" value={formatNumber(kpis.orders)} numeric={kpis.orders} format={(n) => formatNumber(Math.round(n))} footer={`en ${kpis.stores} ${kpis.stores === 1 ? "tienda" : "tiendas"}`} />
        <StatCard icon={DollarSign} label="Ingresos totales" value={formatMoney(kpis.revenue)} numeric={kpis.revenue} format={formatMoney} footer="USD, con upsells incluidos" />
        <StatCard icon={Receipt} label="Ticket promedio" value={formatMoney(kpis.avgTicket)} numeric={kpis.avgTicket} format={formatMoney} footer="por venta" />
        <StatCard icon={Users} label="Clientes" value={formatNumber(kpis.customers)} numeric={kpis.customers} format={(n) => formatNumber(Math.round(n))} footer={`${kpis.returning} ${kpis.returning === 1 ? "compró" : "compraron"} más de una vez`} />
        <StatCard icon={Globe2} label="Países" value={formatNumber(kpis.countries)} numeric={kpis.countries} format={(n) => formatNumber(Math.round(n))} footer="distintos que compraron" />
        <StatCard icon={Store} label="Tiendas con ventas" value={`${kpis.stores} de ${activeStores.length}`} numeric={kpis.stores} format={(n) => `${Math.round(n)} de ${activeStores.length}`} footer="tiendas activas" />
        <StatCard icon={Repeat} label="Upsells aceptados" value={formatNumber(kpis.upsells)} numeric={kpis.upsells} format={(n) => formatNumber(Math.round(n))} footer={`${kpis.upsellRate.toFixed(0)} % de las ventas sumó al menos uno`} />
        <StatCard icon={TrendingUp} label="Ingresos por upsells" value={formatMoney(kpis.upsellRevenue)} numeric={kpis.upsellRevenue} format={formatMoney} footer={`${kpis.revenue ? ((kpis.upsellRevenue / kpis.revenue) * 100).toFixed(0) : 0} % de los ingresos`} />
      </div>

      {/* Desgloses */}
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Breakdown title="Por tienda" items={breakdown.stores} total={kpis.revenue} icon={() => <StoreImage />} />
        <Breakdown title="Por país" items={breakdown.countries} total={kpis.revenue} icon={(l) => <CountryFlag country={l} />} />
        <Breakdown title="Por canal" items={breakdown.sources} total={kpis.revenue} icon={(l) => <SourceIcon name={l} />} />
        <Breakdown title="Por medio de pago" items={breakdown.methods} total={kpis.revenue} icon={(l) => <SourceIcon name={l} />} />
      </div>

      {/* Historial */}
      {/* id="historial": a este lugar lleva "Ver todas" de Últimas ventas del Resumen. */}
      {/* Sin overflow-hidden para que el menú de "Ocultar datos" no quede recortado. */}
      <Card className="mt-4 scroll-mt-24">
        <span id="historial" />
        <div className="flex items-start gap-3 px-5 pt-5">
          <div>
            <h2 className="text-sm font-medium">Historial</h2>
            <p className="mt-0.5 text-xs text-subtle">
              {`${formatNumber(rows.length)} ${rows.length === 1 ? "venta" : "ventas"}${product ? ` de ${product.name}` : ""} · ${
                range.preset === "custom" ? formatRange(range.from, range.to) : presetLabel(range.preset)
              } · tocá una para ver el detalle`}
            </p>
          </div>
          <HideColumnsMenu columns={SALE_COLUMNS} hidden={hiddenCols} onChange={updateHiddenCols} />
        </div>
        {/* Todas las ventas, sin paginar. Misma tabla que "Últimas ventas" del Resumen. */}
        {/* Alto fijo con desplazamiento propio: cambiar el período no cambia el largo de la página. */}
        <div className="mt-3 h-[36rem] overflow-y-auto rounded-b-xl [&_thead]:sticky [&_thead]:top-0 [&_thead]:z-10 [&_thead]:bg-surface">
          <SalesTable rows={rows} onSelect={setSelected} selectedId={selected?.id} hidden={hiddenCols} empty={product ? "Este producto no tiene ventas en este período." : "No hay ventas en este período."} />
        </div>
      </Card>

      {selected && <OrderDrawer sale={selected} onClose={closeDrawer} hidden={hiddenCols} />}
    </>
  );
}

// Lugar para la foto de la tienda. Por ahora vacío: todavía no hay forma de cargarla (ver INTEGRACIONES.md).
function StoreImage() {
  return (
    <span className="grid size-8 shrink-0 place-items-center rounded-lg border border-dashed border-border bg-overlay/[0.03]">
      <ImageIcon className="size-3.5 text-subtle/60" aria-hidden />
    </span>
  );
}

function Breakdown({
  title,
  items,
  total,
  icon,
}: {
  title: string;
  items: { label: string; orders: number; revenue: number }[];
  total: number;
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
