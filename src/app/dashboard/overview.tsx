"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Clock,
  Crown,
  DollarSign,
  Medal,
  Receipt,
  ShoppingBag,
  Store,
  Wallet,
} from "lucide-react";
import {
  buttonStyles,
  Card,
  CardHeader,
  PageHeader,
  MeterBar,
  ProductThumb,
  StatCard,
} from "@/components/dashboard/ui";
import { RevenueChart } from "@/components/dashboard/revenue-chart";
import { OrderDrawer } from "@/components/dashboard/order-drawer";
import { SalesTable } from "@/components/dashboard/sales-table";
import { HideColumnsMenu } from "@/components/dashboard/hide-columns-menu";
import { DateRangePicker, presetLabel, type RangeSelection } from "@/components/dashboard/date-range-picker";
import { QuickRanges } from "@/components/dashboard/quick-ranges";
import { ProductFilter } from "@/components/dashboard/product-filter";
import { percentChange, presetRange, storeRanking, summarizeRange } from "@/lib/analytics";
import {
  activeStores,
  inactiveStores,
  productById,
  sales,
  stats,
  type Sale,
} from "@/lib/mock-data";
import { formatMoney, formatNumber, formatRange } from "@/lib/format";

const DEFAULT_PRESET = "30d";

export function Overview() {
  const [range, setRange] = useState<RangeSelection>({ ...presetRange(DEFAULT_PRESET), preset: DEFAULT_PRESET });
  const [productId, setProductId] = useState<string | null>(null);
  // Si se suman a los totales las ventas que hicieron las tiendas que ya están inactivas.
  const [includeInactive, setIncludeInactive] = useState(false);
  const summary = useMemo(
    () => summarizeRange(range, productId, includeInactive),
    [range, productId, includeInactive],
  );
  const prev = summary.previous;

  // Columnas de "Últimas ventas" difuminadas para compartir pantalla. Se recuerdan en este navegador.
  const [hiddenCols, setHiddenCols] = useState<Set<SaleColumn>>(new Set());
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(HIDDEN_COLS_KEY) ?? "[]") as SaleColumn[];
      const valid = saved.filter((k) => SALE_COLUMNS.some((c) => c.key === k));
      // eslint-disable-next-line react-hooks/set-state-in-effect -- se lee del navegador después de montar
      if (valid.length) setHiddenCols(new Set(valid));
    } catch {
      // Si lo guardado está roto, se arranca sin columnas ocultas.
    }
  }, []);
  const updateHiddenCols = (next: Set<SaleColumn>) => {
    setHiddenCols(next);
    localStorage.setItem(HIDDEN_COLS_KEY, JSON.stringify([...next]));
  };
  // Lo elegido en el menú: un producto o una tienda inactiva.
  const product = productId ? summary.byProduct.find((e) => e.id === productId) : undefined;

  const rangeLabel = formatRange(range.from, range.to);
  const whose = product ? `las ventas de ${product.name}` : "tus ventas";
  const description =
    range.preset === "custom"
      ? `Así vienen ${whose} del ${rangeLabel}.`
      : `Así vienen ${whose}: ${presetLabel(range.preset).toLowerCase()} (${rangeLabel}).`;
  const deltaHint = `vs. ${summary.days === 1 ? "día" : `${summary.days} días`} anteriores`;
  const recent = sales.filter((s) => !productId || s.productId === productId).slice(0, RECENT_SALES);
  const storeRevenue = summary.byProduct.reduce((a, e) => a + e.revenue, 0);

  // Pie de la card de tiendas: a qué tienda pertenece lo elegido o cuántas vendieron en el período.
  const storesWithSales = new Set(
    summary.byProduct
      .filter((e) => e.kind === "producto" && e.orders > 0)
      .map((e) => productById(e.id)?.storeId),
  ).size;
  const productStore =
    product?.kind === "producto" ? activeStores.find((t) => t.id === productById(product.id)?.storeId) : undefined;
  const storesFooter =
    product?.kind === "tienda-inactiva"
      ? "Estás viendo una tienda inactiva"
      : productStore
        ? `Este producto es de ${productStore.name}`
        : `${storesWithSales} con ventas en el período${includeInactive ? ` · ${inactiveStores.length} inactivas sumadas` : ""}`;

  return (
    <>
      <PageHeader
        title="Hola, Lautaro 👋"
        description={description}
      />

      {/* Primero qué ver (producto), después el período: atajos rápidos o calendario. */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <ProductFilter
          options={summary.byProduct}
          value={productId}
          total={storeRevenue}
          onChange={setProductId}
          includeInactive={includeInactive}
          onIncludeInactiveChange={(include) => {
            setIncludeInactive(include);
            // Al dejar de contarlas, si había una tienda inactiva elegida se vuelve a ver todo.
            if (!include && product?.kind === "tienda-inactiva") setProductId(null);
          }}
        />
        <QuickRanges value={range} onChange={setRange} />
        <div className="ml-auto">
          <DateRangePicker value={range} onApply={setRange} />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Ingresos"
          icon={DollarSign}
          value={formatMoney(summary.revenue)}
          delta={percentChange(summary.revenue, prev?.revenue)}
          hint={deltaHint}
        />
        <StatCard
          label="Ventas"
          icon={ShoppingBag}
          value={formatNumber(summary.orders)}
          delta={percentChange(summary.orders, prev?.orders)}
          hint={deltaHint}
        />
        <StatCard
          label="Tiendas activas"
          value={formatNumber(activeStores.length)}
          icon={Store}
          footer={storesFooter}
        />
        <StatCard
          label="Ticket promedio"
          icon={Receipt}
          value={formatMoney(summary.avgTicket)}
          delta={percentChange(summary.avgTicket, prev?.avgTicket)}
          hint={deltaHint}
        />
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-3">
        <Card className="flex flex-col">
          <CardHeader title="Tu saldo" description="Lo que cobraste por tus ventas" />
          <div className="flex flex-1 flex-col gap-4 p-5">
            <div className="rounded-lg border border-border bg-gradient-to-br from-violet-500/15 via-transparent to-transparent p-4">
              <p className="flex items-center gap-2 text-xs text-muted">
                <Wallet className="size-3.5" /> Disponible para retirar
              </p>
              <p className="mt-2 text-3xl font-semibold tracking-tight tabular-nums">
                {formatMoney(stats.available)}
              </p>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border p-4">
              <div>
                <p className="flex items-center gap-2 text-xs text-muted">
                  <Clock className="size-3.5" /> En camino
                </p>
                <p className="mt-1 text-lg font-semibold tabular-nums">{formatMoney(stats.pendingPayout)}</p>
              </div>
              <p className="text-right text-xs text-subtle">Se acredita<br />en 2 días</p>
            </div>
            <Link href="/dashboard/wallet" className={`${buttonStyles()} mt-auto w-full justify-center`}>
              Ir a la Wallet
            </Link>
          </div>
        </Card>

        <Card className="xl:col-span-2">
          <CardHeader
            title="Ingresos diarios"
            description={product ? `${product.name} · ${rangeLabel}` : rangeLabel}
          />
          <div className="px-3 pb-3 pt-4">
            <RevenueChart
              data={summary.series}
              label={`Ingresos diarios${product ? ` de ${product.name}` : ""}, ${rangeLabel}`}
            />
          </div>
        </Card>
      </div>

      {/* Últimas ventas: tabla a todo el ancho, debajo de "Tu saldo" e "Ingresos diarios". */}
      {/* Sin overflow-hidden para que el menú de "Ocultar datos" no quede recortado. */}
      <Card className="mt-4">
        <div className="flex items-center gap-3 px-5 pt-5">
          <h2 className="text-sm font-medium">Últimas ventas</h2>
          <HideColumnsMenu columns={SALE_COLUMNS} hidden={hiddenCols} onChange={updateHiddenCols} />
          <Link
            href="/dashboard/ventas"
            className="ml-auto flex items-center gap-1 text-xs text-muted hover:text-foreground"
          >
            Ver todas <ArrowRight className="size-3.5" />
          </Link>
        </div>
        <RecentSalesTable rows={recent} hidden={hiddenCols} />
      </Card>

      <Card className="mt-4 overflow-hidden">
        <CardHeader title="Top 5 tiendas" description="Histórico · las tiendas con más ventas desde que se crearon" />
        <StoreRankingTable />
      </Card>
    </>
  );
}

// Últimas ventas del Resumen: solo las 10 más recientes. El historial completo está en Ventas.
const RECENT_SALES = 10;

// Columnas de "Últimas ventas" que se pueden ocultar con el botón "Ocultar datos".
const SALE_COLUMNS = [
  { key: "cliente", label: "Cliente" },
  { key: "tienda", label: "Tienda" },
  { key: "total", label: "Total" },
] as const;
type SaleColumn = (typeof SALE_COLUMNS)[number]["key"];
const HIDDEN_COLS_KEY = "ultimas-ventas:columnas-ocultas";


// Últimas ventas: la tabla compartida con Ventas y el panel de detalle de la orden.
function RecentSalesTable({ rows, hidden }: { rows: Sale[]; hidden: ReadonlySet<SaleColumn> }) {
  // Orden abierta en el panel de detalle.
  const [selected, setSelected] = useState<Sale | null>(null);
  const closeDrawer = useCallback(() => setSelected(null), []);

  return (
    <div className="mt-3">
      <SalesTable
        rows={rows}
        onSelect={setSelected}
        selectedId={selected?.id}
        hidden={hidden}
        empty="No hay ventas recientes para lo que elegiste."
      />
      {selected && <OrderDrawer sale={selected} onClose={closeDrawer} hidden={hidden} />}
    </div>
  );
}

// Top 5 histórico de tiendas, ordenado por cantidad de ventas.
// Siempre cuenta las tiendas inactivas, sin depender del switch del menú de productos.
// Los ingresos con los que la barra de cada tienda queda llena.
const RANKING_BAR_MAX = 50_000;

function StoreRankingTable() {
  const rows = storeRanking(true).slice(0, 5);
  const totalOrders = rows.reduce((a, r) => a + r.orders, 0);
  const totalUpsells = rows.reduce((a, r) => a + r.upsells, 0);
  const totalRevenue = rows.reduce((a, r) => a + r.revenue, 0);

  return (
    <div className="mt-3 overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-y border-border text-left text-xs text-subtle">
            <th className="w-14 py-2.5 pl-5 font-medium">#</th>
            <th className="px-5 py-2.5 font-medium">Tienda</th>
            <th className="px-5 py-2.5 text-right font-medium">Ingresos</th>
            <th className="px-5 py-2.5 text-right font-medium">Ventas</th>
            <th className="px-5 py-2.5 text-right font-medium">Upsells</th>
            <th className="px-5 py-2.5 font-medium">Estado</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {rows.map((r, i) => (
            <tr key={r.id} className="transition hover:bg-overlay/[0.02]">
              <td className="py-3 pl-5">
                <span
                  className={`relative grid size-7 place-items-center rounded-md text-xs font-semibold tabular-nums ${
                    i < 3 ? "bg-brand text-white shadow-lg shadow-violet-500/20" : "bg-surface-2 text-muted"
                  }`}
                >
                  {i === 0 && (
                    // Coronita para el primer puesto.
                    <Crown
                      aria-label="Primer puesto"
                      className="absolute -left-2.5 -top-3 size-[18px] -rotate-[25deg] fill-amber-300 text-amber-400 drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]"
                    />
                  )}
                  {(i === 1 || i === 2) && (
                    // Medalla colgando: plata para el 2.º puesto, bronce para el 3.º.
                    <Medal
                      aria-label={i === 1 ? "Segundo puesto" : "Tercer puesto"}
                      className={`absolute -bottom-3 -right-2.5 size-[18px] -rotate-12 drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)] ${
                        i === 1 ? "fill-zinc-300 text-zinc-400" : "fill-orange-400 text-orange-700"
                      }`}
                    />
                  )}
                  {i + 1}
                </span>
              </td>
              <td className="px-5 py-3">
                <div className="flex items-center gap-3">
                  <ProductThumb color={r.color} name={r.name} />
                  <div className="min-w-0 flex-1">
                    <Link href={r.href} className="block truncate font-medium hover:underline">
                      {r.name}
                    </Link>
                    {/* Barra de ingresos: se llena del todo en RANKING_BAR_MAX. */}
                    <div className="mt-2 max-w-64" title={`${formatMoney(r.revenue)} de ${formatMoney(RANKING_BAR_MAX)}`}>
                      <MeterBar value={r.revenue / RANKING_BAR_MAX} emphasis={i === 0} />
                    </div>
                  </div>
                </div>
              </td>
              <td className="px-5 py-3 text-right tabular-nums text-muted">{formatMoney(r.revenue)}</td>
              <td className="px-5 py-3 text-right font-medium tabular-nums">{formatNumber(r.orders)}</td>
              <td className="px-5 py-3 text-right tabular-nums text-muted">{formatNumber(r.upsells)}</td>
              <td className="px-5 py-3">
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${
                    r.active
                      ? "bg-emerald-500/10 text-emerald-400 ring-emerald-500/20"
                      : "bg-rose-500/10 text-rose-400 ring-rose-500/20"
                  }`}
                >
                  <span className="size-1.5 rounded-full bg-current" />
                  {r.active ? "Activa" : "Inactiva"}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="border-t border-border">
            <td />
            <td className="px-5 py-3 font-medium">Total</td>
            <td className="px-5 py-3 text-right font-semibold tabular-nums">{formatMoney(totalRevenue)}</td>
            <td className="px-5 py-3 text-right font-medium tabular-nums">{formatNumber(totalOrders)}</td>
            <td className="px-5 py-3 text-right font-medium tabular-nums">{formatNumber(totalUpsells)}</td>
            <td />
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
