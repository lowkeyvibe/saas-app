import {
  HISTORY_START,
  TODAY,
  activeStores,
  inactiveStoreDaily,
  inactiveStores,
  productDaily,
  products,
  revenueHistory,
  type DailyRevenue,
  type ProductStatus,
} from "@/lib/mock-data";

// Las fechas de los rangos van como "AAAA-MM-DD" (días completos, en UTC).
export type DateRange = { from: string; to: string };

export type RangePreset =
  | "hoy"
  | "ayer"
  | "hoy-ayer"
  | "7d"
  | "14d"
  | "28d"
  | "30d"
  | "semana"
  | "semana-pasada"
  | "mes"
  | "mes-pasado"
  | "maximo";

// Mismos atajos que Meta: "Últimos N días" no incluye hoy y la semana arranca el domingo.
export const rangePresets: { value: RangePreset; label: string }[] = [
  { value: "hoy", label: "Hoy" },
  { value: "ayer", label: "Ayer" },
  { value: "hoy-ayer", label: "Hoy y ayer" },
  { value: "7d", label: "Últimos 7 días" },
  { value: "14d", label: "Últimos 14 días" },
  { value: "28d", label: "Últimos 28 días" },
  { value: "30d", label: "Últimos 30 días" },
  { value: "semana", label: "Esta semana" },
  { value: "semana-pasada", label: "Semana pasada" },
  { value: "mes", label: "Este mes" },
  { value: "mes-pasado", label: "Mes pasado" },
  { value: "maximo", label: "Histórico" },
];

const DAY_MS = 86_400_000;
const startMs = Date.parse(`${HISTORY_START}T00:00:00Z`);

export const MIN_DATE = HISTORY_START;
export const MAX_DATE = TODAY;

export function addDays(date: string, days: number) {
  return new Date(Date.parse(`${date}T00:00:00Z`) + days * DAY_MS).toISOString().slice(0, 10);
}

export function presetRange(preset: RangePreset): DateRange {
  const [y, m] = TODAY.split("-").map(Number);
  const weekday = new Date(`${TODAY}T00:00:00Z`).getUTCDay(); // 0 = domingo
  const lastDays = (n: number) => ({ from: addDays(TODAY, -n), to: addDays(TODAY, -1) });
  switch (preset) {
    case "hoy":
      return { from: TODAY, to: TODAY };
    case "ayer":
      return { from: addDays(TODAY, -1), to: addDays(TODAY, -1) };
    case "hoy-ayer":
      return { from: addDays(TODAY, -1), to: TODAY };
    case "7d":
      return lastDays(7);
    case "14d":
      return lastDays(14);
    case "28d":
      return lastDays(28);
    case "30d":
      return lastDays(30);
    case "semana":
      return { from: addDays(TODAY, -weekday), to: TODAY };
    case "semana-pasada":
      return { from: addDays(TODAY, -weekday - 7), to: addDays(TODAY, -weekday - 1) };
    case "mes":
      return { from: `${TODAY.slice(0, 7)}-01`, to: TODAY };
    case "mes-pasado": {
      const first = new Date(Date.UTC(y, m - 2, 1)).toISOString().slice(0, 10);
      const last = new Date(Date.UTC(y, m - 1, 0)).toISOString().slice(0, 10);
      return { from: first, to: last };
    }
    case "maximo":
      return { from: MIN_DATE, to: MAX_DATE };
  }
}

// Ajusta un rango para que quede dentro del historial y con "desde" <= "hasta".
export function clampRange({ from, to }: DateRange): DateRange {
  const clamp = (d: string) => (d < MIN_DATE ? MIN_DATE : d > MAX_DATE ? MAX_DATE : d);
  const a = clamp(from);
  const b = clamp(to);
  return a <= b ? { from: a, to: b } : { from: b, to: a };
}

function dayIndex(date: string) {
  return Math.round((Date.parse(`${date}T00:00:00Z`) - startMs) / DAY_MS);
}

type DayPoint = DailyRevenue & { visits?: number };

export type Totals = {
  revenue: number;
  orders: number;
  avgTicket: number;
  // Solo hay visitas de la tienda entera, así que por producto la conversión es null.
  conversion: number | null;
  // Parte de los ingresos de la tienda que representa esta serie (1 = toda la tienda).
  share: number;
};

function sumRevenue(series: DayPoint[]) {
  return series.reduce((a, d) => a + d.revenue, 0);
}

function totals(series: DayPoint[], storeRevenue: number): Totals {
  let revenue = 0;
  let orders = 0;
  let visits = 0;
  for (const d of series) {
    revenue += d.revenue;
    orders += d.orders;
    visits += d.visits ?? 0;
  }
  return {
    revenue,
    orders,
    avgTicket: orders ? revenue / orders : 0,
    conversion: visits ? (orders / visits) * 100 : null,
    share: storeRevenue ? revenue / storeRevenue : 0,
  };
}

// Una fila de "Ganancias por producto": un producto o, si se cuentan, una tienda inactiva.
export type ProductEarnings = {
  id: string;
  name: string;
  color: string;
  kind: "producto" | "tienda-inactiva";
  status?: ProductStatus; // solo productos
  href: string;
  revenue: number;
  orders: number;
  share: number;
};

export type RangeSummary = Totals & {
  days: number;
  series: DayPoint[];
  // Totales del período anterior de igual duración (null si cae fuera del historial).
  previous: Totals | null;
  // Ganancia de cada producto (y de cada tienda inactiva, si se cuentan) en el período.
  byProduct: ProductEarnings[];
};

// Ventas de la tienda activa más las de las tiendas inactivas, día por día.
// Las visitas son solo de la tienda activa (de las inactivas no hay datos).
const withInactive: DayPoint[] = revenueHistory.map((d, i) => {
  let revenue = d.revenue;
  let orders = d.orders;
  for (const s of inactiveStores) {
    revenue += inactiveStoreDaily[s.id][i].revenue;
    orders += inactiveStoreDaily[s.id][i].orders;
  }
  return { date: d.date, revenue: Math.round(revenue * 100) / 100, orders, visits: d.visits };
});

// Resumen del período para toda la tienda o, si se pasa id, para un producto o tienda inactiva.
// Con includeInactive, los totales de la tienda suman también las tiendas inactivas.
export function summarizeRange(
  range: DateRange,
  id: string | null = null,
  includeInactive = false,
): RangeSummary {
  const { from, to } = clampRange(range);
  const start = dayIndex(from);
  const end = dayIndex(to);
  const days = end - start + 1;
  const store = includeInactive ? withInactive : revenueHistory;
  const source: DayPoint[] =
    (id && (productDaily[id] ?? (includeInactive ? inactiveStoreDaily[id] : undefined))) || store;

  // La conversión siempre se calcula con la tienda activa: es la única con visitas.
  const summarize = (a: number, b: number): Totals => {
    const t = totals(source.slice(a, b), sumRevenue(store.slice(a, b)));
    if (source === withInactive) t.conversion = totals(revenueHistory.slice(a, b), 0).conversion;
    return t;
  };

  const series = source.slice(start, end + 1);
  const current = summarize(start, end + 1);
  const previous = start - days >= 0 ? summarize(start - days, start) : null;
  const storeNow = sumRevenue(store.slice(start, end + 1));

  const productRows: ProductEarnings[] = products
    // Los borradores que nunca vendieron no aportan nada.
    .filter((p) => p.status !== "borrador" || productDaily[p.id].some((d) => d.orders > 0))
    .map((p) => {
      const t = totals(productDaily[p.id].slice(start, end + 1), storeNow);
      return {
        id: p.id,
        name: p.name,
        color: p.color,
        kind: "producto",
        status: p.status,
        href: `/dashboard/productos/${p.id}`,
        revenue: t.revenue,
        orders: t.orders,
        share: t.share,
      };
    });

  const storeRows: ProductEarnings[] = includeInactive
    ? inactiveStores.map((s) => {
        const t = totals(inactiveStoreDaily[s.id].slice(start, end + 1), storeNow);
        return {
          id: s.id,
          name: s.name,
          color: s.color,
          kind: "tienda-inactiva",
          href: "/dashboard/tiendas-inactivas",
          revenue: t.revenue,
          orders: t.orders,
          share: t.share,
        };
      })
    : [];

  const byProduct = [...productRows, ...storeRows].sort((a, b) => b.revenue - a.revenue);
  return { ...current, days, series, previous, byProduct };
}

// Variación porcentual contra el período anterior; undefined si no hay con qué comparar.
export function percentChange(current: number | null, previous: number | null | undefined) {
  if (current === null || previous === null || previous === undefined || previous === 0) return undefined;
  return ((current - previous) / previous) * 100;
}


export type StoreRankingRow = {
  id: string;
  name: string;
  color: string;
  subdomain: string;
  active: boolean;
  products: number;
  orders: number;
  upsells: number;
  revenue: number;
  href: string;
};

// Ranking histórico de tiendas por ventas (de toda su vida, sin importar el período elegido).
// Con includeInactive = true suma también las tiendas inactivas.
export function storeRanking(includeInactive: boolean): StoreRankingRow[] {
  const active: StoreRankingRow[] = activeStores.map((t) => {
    const own = products.filter((p) => p.storeId === t.id);
    return {
      id: t.id,
      name: t.name,
      color: t.color,
      subdomain: t.subdomain,
      active: true,
      products: own.length,
      orders: own.reduce((a, p) => a + p.sales, 0),
      upsells: own.reduce((a, p) => a + p.upsells, 0),
      revenue: own.reduce((a, p) => a + p.revenue, 0),
      href: "/dashboard/productos",
    };
  });
  const inactive: StoreRankingRow[] = includeInactive
    ? inactiveStores.map((s) => ({
        id: s.id,
        name: s.name,
        color: s.color,
        subdomain: s.subdomain,
        active: false,
        products: s.products,
        orders: s.totalSales,
        upsells: s.totalUpsells,
        revenue: s.totalRevenue,
        href: "/dashboard/tiendas-inactivas",
      }))
    : [];
  return [...active, ...inactive].sort((a, b) => b.orders - a.orders || b.revenue - a.revenue);
}
