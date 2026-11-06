// Datos de prueba. Cuando haya base de datos, esto se reemplaza por consultas reales.

export type ProductType = "ebook" | "curso" | "plantilla" | "pack";
export type ProductStatus = "activo" | "borrador" | "pausado";
export type SaleStatus = "aprobada" | "pendiente" | "rechazada" | "reembolsada";
export type PaymentMethod = "Mercado Pago" | "Stripe" | "PayPal" | "Transferencia";

export type Product = {
  id: string;
  name: string;
  type: ProductType;
  price: number;
  status: ProductStatus;
  sales: number;
  revenue: number;
  color: string;
  // Tienda activa a la que pertenece el producto (ver activeStores).
  storeId: string;
  // Upsells post-compra vendidos junto a este producto (históricos, aparte de sus ventas).
  upsells: number;
};

export type Sale = {
  id: string;
  customer: string;
  email: string;
  productId: string;
  amount: number;
  method: PaymentMethod;
  status: SaleStatus;
  date: string;
};

export type Customer = {
  id: string;
  name: string;
  email: string;
  country: string;
  purchases: number;
  spent: number;
  lastPurchase: string;
};

// Fecha fija de referencia para que los datos de prueba no cambien entre renders.
export const TODAY = "2026-11-05";

// Generador pseudoaleatorio con semilla: siempre devuelve la misma secuencia.
function seeded(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

export type ActiveStore = { id: string; name: string; subdomain: string; color: string };

// Tiendas activas del vendedor; cada producto pertenece a una.
export const activeStores: ActiveStore[] = [
  { id: "t1", name: "Vida Simple", subdomain: "vidasimple", color: "from-violet-500 to-fuchsia-500" },
  { id: "t2", name: "Creadores Pro", subdomain: "creadorespro", color: "from-sky-500 to-cyan-400" },
  { id: "t3", name: "Plantillas Lab", subdomain: "plantillaslab", color: "from-amber-500 to-orange-500" },
];

export const products: Product[] = [
  { id: "p1", name: "Guía de finanzas personales", type: "ebook", price: 17, status: "activo", sales: 412, revenue: 7004, color: "from-violet-500 to-fuchsia-500", storeId: "t1", upsells: 96 },
  { id: "p2", name: "Curso de edición en CapCut", type: "curso", price: 47, status: "activo", sales: 187, revenue: 8789, color: "from-sky-500 to-cyan-400", storeId: "t2", upsells: 61 },
  { id: "p3", name: "Pack de 120 plantillas Canva", type: "plantilla", price: 12, status: "activo", sales: 538, revenue: 6456, color: "from-amber-500 to-orange-500", storeId: "t3", upsells: 102 },
  { id: "p4", name: "Recetario saludable 30 días", type: "ebook", price: 14.9, status: "activo", sales: 264, revenue: 3933.6, color: "from-emerald-500 to-teal-400", storeId: "t1", upsells: 58 },
  { id: "p5", name: "Bundle productividad Notion", type: "pack", price: 24, status: "pausado", sales: 96, revenue: 2304, color: "from-rose-500 to-pink-500", storeId: "t3", upsells: 19 },
  { id: "p6", name: "Mini curso de Excel", type: "curso", price: 29, status: "borrador", sales: 0, revenue: 0, color: "from-indigo-500 to-blue-500", storeId: "t2", upsells: 0 },
];

const firstNames = ["Sofía", "Mateo", "Valentina", "Benjamín", "Camila", "Lucas", "Martina", "Joaquín", "Lucía", "Tomás", "Julieta", "Santiago", "Agustina", "Facundo", "Florencia", "Nicolás"];
const lastNames = ["González", "Rodríguez", "Fernández", "López", "Martínez", "Pérez", "Gómez", "Díaz", "Romero", "Sosa", "Álvarez", "Torres"];
const countries = ["Argentina", "Argentina", "Argentina", "México", "Uruguay", "Chile", "Colombia", "España"];
const methods: PaymentMethod[] = ["Mercado Pago", "Mercado Pago", "Mercado Pago", "Stripe", "PayPal", "Transferencia"];
const statuses: SaleStatus[] = ["aprobada", "aprobada", "aprobada", "aprobada", "aprobada", "aprobada", "pendiente", "rechazada", "reembolsada"];

function buildSales(): Sale[] {
  const rand = seeded(42);
  const active = products.filter((p) => p.status !== "borrador");
  const base = new Date(`${TODAY}T23:00:00Z`).getTime();
  return Array.from({ length: 40 }, (_, i) => {
    const first = firstNames[Math.floor(rand() * firstNames.length)];
    const last = lastNames[Math.floor(rand() * lastNames.length)];
    const product = active[Math.floor(rand() * active.length)];
    const minutesAgo = i * 95 + Math.floor(rand() * 80);
    return {
      id: `#${(10482 - i).toString()}`,
      customer: `${first} ${last}`,
      email: `${first}.${last}`.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "") + "@gmail.com",
      productId: product.id,
      amount: product.price,
      method: methods[Math.floor(rand() * methods.length)],
      status: statuses[Math.floor(rand() * statuses.length)],
      date: new Date(base - minutesAgo * 60_000).toISOString(),
    };
  });
}

export const sales = buildSales();

export const customers: Customer[] = (() => {
  const rand = seeded(7);
  const seen = new Map<string, Customer>();
  for (const s of sales) {
    const c = seen.get(s.email);
    if (c) {
      c.purchases += 1;
      c.spent += s.amount;
    } else {
      seen.set(s.email, {
        id: `c${seen.size + 1}`,
        name: s.customer,
        email: s.email,
        country: countries[Math.floor(rand() * countries.length)],
        purchases: 1,
        spent: s.amount,
        lastPurchase: s.date,
      });
    }
  }
  return [...seen.values()];
})();

export type DailyRevenue = { date: string; revenue: number; orders: number };
export type DailyTraffic = DailyRevenue & { visits: number };

// Cuántos días de historial generan los datos de prueba (hasta TODAY inclusive).
export const HISTORY_DAYS = 365;
const DAY_MS = 86_400_000;
const todayMs = new Date(`${TODAY}T00:00:00Z`).getTime();
export const HISTORY_START = new Date(todayMs - (HISTORY_DAYS - 1) * DAY_MS).toISOString().slice(0, 10);

// Días desde TODAY en que se pausó cada producto pausado (deja de vender desde ahí).
const PAUSED_DAYS_AGO = 12;

// Demanda total de cada día: crece a lo largo del año, con más ventas los fines de semana.
const dailyDemand = (() => {
  const rand = seeded(2026);
  return Array.from({ length: HISTORY_DAYS }, (_, i) => {
    const date = new Date(todayMs - (HISTORY_DAYS - 1 - i) * DAY_MS);
    const weekend = [0, 6].includes(date.getUTCDay());
    const growth = (i / (HISTORY_DAYS - 1)) ** 1.6;
    return {
      date: date.toISOString(),
      orders: 6 + growth * 30 + rand() * 12 + (weekend ? 8 : 0),
      conversion: 0.022 + rand() * 0.008,
    };
  });
})();

// Ingresos diarios de cada producto en todo el historial.
export const productDaily: Record<string, DailyRevenue[]> = (() => {
  const totalSales = products.reduce((a, p) => a + p.sales, 0);
  return Object.fromEntries(
    products.map((p) => {
      const share = p.sales / totalSales;
      const rand = seeded(p.id.charCodeAt(1) * 97);
      const series = dailyDemand.map((d, i) => {
        const daysAgo = HISTORY_DAYS - 1 - i;
        const selling = p.status === "activo" || (p.status === "pausado" && daysAgo > PAUSED_DAYS_AGO);
        const orders = selling ? Math.max(0, Math.round(d.orders * share * (0.6 + rand() * 0.8))) : 0;
        return { date: d.date, orders, revenue: Math.round(orders * p.price * 100) / 100 };
      });
      return [p.id, series];
    }),
  );
})();

// Totales diarios de la tienda (suma de todos los productos) con sus visitas.
export const revenueHistory: DailyTraffic[] = dailyDemand.map((d, i) => {
  let revenue = 0;
  let orders = 0;
  for (const p of products) {
    revenue += productDaily[p.id][i].revenue;
    orders += productDaily[p.id][i].orders;
  }
  return {
    date: d.date,
    revenue: Math.round(revenue * 100) / 100,
    orders,
    visits: Math.round(Math.max(orders, 1) / d.conversion),
  };
});

export const revenueLast30: DailyRevenue[] = revenueHistory.slice(-30);

export function productById(id: string) {
  return products.find((p) => p.id === id);
}

// Ingresos diarios de un producto en los últimos 30 días.
export function productRevenueSeries(id: string): DailyRevenue[] {
  return productDaily[id]?.slice(-30) ?? revenueLast30.map((d) => ({ ...d, revenue: 0, orders: 0 }));
}

export const stats = (() => {
  const last30 = revenueHistory.slice(-30);
  const revenue = last30.reduce((a, d) => a + d.revenue, 0);
  const orders = last30.reduce((a, d) => a + d.orders, 0);
  const visits = last30.reduce((a, d) => a + d.visits, 0);
  return {
    revenue,
    revenueDelta: 18.4,
    orders,
    ordersDelta: 12.1,
    conversion: (orders / visits) * 100,
    conversionDelta: -0.3,
    avgTicket: revenue / orders,
    avgTicketDelta: 5.6,
    available: 1482.5,
    pendingPayout: 364.2,
  };
})();

// Tiendas que el vendedor tuvo y ya no están publicadas.
export type InactiveStore = {
  id: string;
  name: string;
  subdomain: string;
  products: number;
  totalSales: number;
  totalRevenue: number;
  // Upsells post-compra vendidos en toda la vida de la tienda.
  totalUpsells: number;
  createdAt: string;
  deactivatedAt: string;
  reason: "pausada" | "sin plan" | "archivada";
  color: string;
};

export const inactiveStores: InactiveStore[] = [
  { id: "s1", name: "Fit en Casa", subdomain: "fitencasa", products: 4, totalSales: 312, totalRevenue: 5840, totalUpsells: 71, createdAt: "2025-03-12", deactivatedAt: "2026-08-21", reason: "pausada", color: "from-emerald-500 to-teal-400" },
  { id: "s2", name: "Inglés en 30 días", subdomain: "ingles30", products: 2, totalSales: 148, totalRevenue: 3256, totalUpsells: 27, createdAt: "2025-06-02", deactivatedAt: "2026-05-30", reason: "archivada", color: "from-sky-500 to-blue-600" },
  { id: "s3", name: "Club de Lectura Kids", subdomain: "lecturakids", products: 6, totalSales: 87, totalRevenue: 1305, totalUpsells: 12, createdAt: "2025-11-18", deactivatedAt: "2026-02-14", reason: "sin plan", color: "from-amber-500 to-orange-500" },
];

// Ventas diarias de las tiendas inactivas dentro del historial: reparten sus totales entre la
// fecha en que se crearon y la de baja, así que después de desactivarse no suman nada.
export const inactiveStoreDaily: Record<string, DailyRevenue[]> = Object.fromEntries(
  inactiveStores.map((store) => {
    const rand = seeded(store.id.charCodeAt(1) * 131);
    const created = Date.parse(`${store.createdAt}T00:00:00Z`);
    const deactivated = Date.parse(`${store.deactivatedAt}T00:00:00Z`);
    const lifetimeDays = Math.round((deactivated - created) / DAY_MS) + 1;
    const perDay = store.totalSales / lifetimeDays;
    const ticket = store.totalRevenue / store.totalSales;
    const series = revenueHistory.map((d) => {
      const t = Date.parse(d.date);
      const alive = t >= created && t <= deactivated;
      const orders = alive ? Math.round(perDay * rand() * 2) : 0;
      return { date: d.date, orders, revenue: Math.round(orders * ticket * 100) / 100 };
    });
    return [store.id, series];
  }),
);
