"use client";

import { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Medal,
  DollarSign,
  Receipt,
  ShoppingBag,
  Store,
} from "lucide-react";
import {
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
import { HideColumnsMenu, SALE_COLUMNS, useHiddenSaleColumns, type SaleColumn } from "@/components/dashboard/hide-columns-menu";
import { DateRangePicker, presetLabel, type RangeSelection } from "@/components/dashboard/date-range-picker";
import { QuickRanges } from "@/components/dashboard/quick-ranges";
import { useIncludeInactive } from "@/lib/include-inactive";
import { ProductFilter } from "@/components/dashboard/product-filter";
import { percentChange, presetRange, summarizeRange, type ProductEarnings } from "@/lib/analytics";
import {
  activeStores,
  inactiveStores,
  productById,
  sales,
  type Sale,
} from "@/lib/mock-data";
import { formatMoney, formatNumber, formatRange } from "@/lib/format";

// Al entrar se ve el día de hoy; el usuario lo cambia con los atajos o el calendario.
const DEFAULT_PRESET = "hoy";

export function Overview() {
  const [range, setRange] = useState<RangeSelection>({ ...presetRange(DEFAULT_PRESET), preset: DEFAULT_PRESET });
  const [productId, setProductId] = useState<string | null>(null);
  // Si se suman a los totales las ventas que hicieron las tiendas que ya están inactivas.
  // Compartido con el interruptor de Tiendas inactivas (y se recuerda en el navegador).
  const [includeInactive, setIncludeInactive] = useIncludeInactive();
  const summary = useMemo(
    () => summarizeRange(range, productId, includeInactive),
    [range, productId, includeInactive],
  );
  const prev = summary.previous;
  // Tendencia diaria del período para los mini gráficos de las cards.
  const sparkRevenue = summary.series.map((d) => d.revenue);
  const sparkOrders = summary.series.map((d) => d.orders);
  const sparkTicket = summary.series.map((d) => (d.orders ? d.revenue / d.orders : 0));

  // Columnas de "Últimas ventas" difuminadas para compartir pantalla (las mismas que en Ventas).
  const [hiddenCols, updateHiddenCols] = useHiddenSaleColumns();
  // Lo elegido en el menú: un producto o una tienda inactiva.
  const product = productId ? summary.byProduct.find((e) => e.id === productId) : undefined;

  const rangeLabel = formatRange(range.from, range.to);
  const whose = product ? `las ventas de ${product.name}` : "tus ventas";
  const description =
    range.preset === "custom"
      ? `Así vienen ${whose} del ${rangeLabel}.`
      : `Así vienen ${whose}: ${presetLabel(range.preset).toLowerCase()} (${rangeLabel}).`;
  const deltaHint = summary.days === 1 ? "vs. el día anterior" : `vs. ${summary.days} días anteriores`;
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
          numeric={summary.revenue}
          format={formatMoney}
          spark={sparkRevenue}
          delta={percentChange(summary.revenue, prev?.revenue)}
          hint={deltaHint}
        />
        <StatCard
          label="Ventas"
          icon={ShoppingBag}
          value={formatNumber(summary.orders)}
          numeric={summary.orders}
          format={(n) => formatNumber(Math.round(n))}
          spark={sparkOrders}
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
          numeric={summary.avgTicket}
          format={formatMoney}
          spark={sparkTicket}
          delta={percentChange(summary.avgTicket, prev?.avgTicket)}
          hint={deltaHint}
        />
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-3">
        {/* Qué se vendió en el período: cambia con los filtros, igual que el gráfico de al lado. */}
        <TopProducts items={summary.byProduct} selectedId={productId} onSelect={setProductId} rangeLabel={rangeLabel} />

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

      {/* Últimas ventas: tabla a todo el ancho, debajo de "Productos más vendidos" e "Ingresos diarios". Es lo último del Resumen. */}
      {/* Sin overflow-hidden para que el menú de "Ocultar datos" no quede recortado. */}
      <Card className="mt-4">
        <div className="flex items-center gap-3 px-5 pt-5">
          <h2 className="text-sm font-medium">Últimas {RECENT_SALES} ventas</h2>
          <HideColumnsMenu columns={SALE_COLUMNS} hidden={hiddenCols} onChange={updateHiddenCols} />
          <Link
            // Lleva directo al historial completo de Ventas, en "Histórico".
            href="/dashboard/ventas#historial"
            className="ml-auto flex items-center gap-1 text-xs text-muted hover:text-foreground"
          >
            Ver todas <ArrowRight className="size-3.5" />
          </Link>
        </div>
        <RecentSalesTable rows={recent} hidden={hiddenCols} />
      </Card>

    </>
  );
}

// Últimas ventas del Resumen: solo las 10 más recientes. El historial completo está en Ventas.
const RECENT_SALES = 10;



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

// Productos más vendidos del período, con su barra y su parte del total.
// Tocar uno lo elige en el filtro de arriba (y lo vuelve a tocar para ver todos).
// Siempre un top 3, para que la card no cambie de tamaño.
const TOP_PRODUCTS = 3;

// Medalla de cada puesto: oro, plata y bronce.
const MEDALS = [
  { label: "1.er puesto · oro", ring: "ring-amber-300/70", badge: "from-amber-200 via-amber-400 to-amber-600 text-amber-950", glow: "shadow-[0_0_14px_rgba(251,191,36,0.45)]" },
  { label: "2.º puesto · plata", ring: "ring-zinc-300/60", badge: "from-zinc-100 via-zinc-300 to-zinc-500 text-zinc-900", glow: "shadow-[0_0_12px_rgba(212,212,216,0.35)]" },
  { label: "3.er puesto · bronce", ring: "ring-orange-400/60", badge: "from-orange-200 via-orange-400 to-orange-700 text-orange-950", glow: "shadow-[0_0_12px_rgba(251,146,60,0.35)]" },
];

function TopProducts({
  items,
  selectedId,
  onSelect,
  rangeLabel,
}: {
  items: ProductEarnings[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  rangeLabel: string;
}) {
  const ranked = items
    .filter((i) => i.kind === "producto" && i.orders > 0)
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, TOP_PRODUCTS);
  const max = ranked[0]?.revenue ?? 1;

  return (
    <Card className="flex flex-col">
      <CardHeader
        title="Productos más vendidos"
        description={rangeLabel}
        action={
          <Link href="/dashboard/ventas" className="flex items-center gap-1 text-xs text-muted hover:text-foreground">
            Ver ventas <ArrowRight className="size-3.5" />
          </Link>
        }
      />
      <ol className="flex flex-1 flex-col justify-around gap-1 p-3 pt-4">
        {ranked.map((p, i) => {
          const selected = selectedId === p.id;
          return (
            <li key={p.id}>
              <button
                type="button"
                onClick={() => onSelect(selected ? null : p.id)}
                aria-pressed={selected}
                title={selected ? "Ver todos los productos" : `Ver solo ${p.name}`}
                className={`w-full rounded-xl px-2.5 py-2.5 text-left transition ${
                  selected ? "bg-violet-500/10 ring-1 ring-inset ring-violet-500/30" : "hover:bg-violet-500/5"
                }`}
              >
                <div className="flex items-center gap-3.5">
                  {/* Imagen del producto con su medalla en la esquina */}
                  <span className={`relative shrink-0 rounded-xl ring-2 ${MEDALS[i].ring}`} title={MEDALS[i].label}>
                    <ProductThumb name={p.name} size="lg" />
                    <span
                      aria-label={MEDALS[i].label}
                      className={`absolute -bottom-2 -right-2 grid size-7 place-items-center rounded-full bg-gradient-to-br ring-2 ring-surface ${MEDALS[i].badge} ${MEDALS[i].glow}`}
                    >
                      <Medal className="size-4" strokeWidth={2.25} />
                    </span>
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{p.name}</p>
                    <p className="text-xs text-subtle">
                      {formatNumber(p.orders)} ventas · {(p.share * 100).toFixed(0)} % del total
                    </p>
                  </div>
                  <p className="shrink-0 text-sm font-semibold tabular-nums">{formatMoney(p.revenue)}</p>
                </div>
                {/* La sangría va en un contenedor: si va en la barra, el fondo y el relleno quedan desfasados. */}
                <div className="mt-3">
                  <MeterBar value={p.revenue / max} emphasis={i === 0} size="sm" />
                </div>
              </button>
            </li>
          );
        })}
        {ranked.length === 0 && <li className="m-auto py-10 text-sm text-subtle">No hubo ventas en este período.</li>}
      </ol>
    </Card>
  );
}
