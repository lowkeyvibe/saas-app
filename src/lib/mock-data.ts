// Datos de prueba. Cuando haya base de datos, esto se reemplaza por consultas reales.

export type ProductType = "ebook" | "curso" | "plantilla" | "pack";
export type ProductStatus = "activo" | "borrador" | "pausado";
export type SaleStatus = "aprobada" | "pendiente" | "rechazada" | "reembolsada";
export type PaymentMethod = "Mercado Pago" | "Stripe" | "PayPal" | "Transferencia";
// De dónde llegó el cliente antes de comprar.
export type TrafficSource = "Facebook Ads" | "Instagram" | "TikTok" | "Google" | "Email" | "Directo";

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
  country: string;
  source: TrafficSource;
  // Datos de contacto que deja el comprador en el checkout.
  phone: string;
  city: string;
  // ID del pago en la pasarela (Mercado Pago, Stripe, PayPal...).
  paymentId: string;
  // De qué campaña y anuncio vino (parámetros UTM). null si llegó directo.
  attribution: Attribution | null;
  // Por qué la pasarela rechazó el pago del producto principal. Solo en ventas rechazadas.
  declineReason?: DeclineReason;
  // Seguimiento del email de entrega del producto.
  emailEvents: EmailEvent[];
  // Upsells post-compra que aceptó después del producto principal.
  // `amount` suma el producto principal y los upsells que no fueron rechazados.
  upsells: SaleUpsell[];
};

// Un upsell que aceptó: qué producto y en qué número de upsell del embudo (1 a 10).
// Puede saltear números: si rechazó la oferta 2 y aceptó la 3, queda el 1 y el 3.
// No hay carrito: cada upsell es un cobro aparte (one-click), con su propio estado e ID de pago.
// Por eso un upsell puede salir rechazado aunque el producto principal y otros upsells se hayan cobrado.
export type SaleUpsell = {
  productId: string;
  step: number;
  status: SaleStatus;
  paymentId: string;
  declineReason?: DeclineReason;
};

export const MAX_UPSELLS = 10;

export type Attribution = {
  source: string; // utm_source: facebook, instagram, tiktok, google, email
  medium: string; // utm_medium: paid, cpc, newsletter
  campaign: string;
  adset?: string;
  ad?: string;
};

export type DeclineReason = {
  message: string; // motivo corto, en lenguaje simple
  detail: string; // qué significa y qué puede hacer el cliente
  code: string; // código tal cual lo devuelve la pasarela
};

export type EmailEventType = "enviado" | "entregado" | "abierto";
export type EmailEvent = { type: EmailEventType; date: string };

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
const sources: TrafficSource[] = ["Facebook Ads", "Facebook Ads", "Facebook Ads", "Instagram", "Instagram", "TikTok", "Google", "Email", "Directo"];

// Código ISO de cada país que aparece en los datos (para la bandera en SVG, ver country-flag.tsx).
export const COUNTRY_CODES: Record<string, string> = {
  Argentina: "AR",
  México: "MX",
  Uruguay: "UY",
  Chile: "CL",
  Colombia: "CO",
  España: "ES",
};
const methods: PaymentMethod[] = ["Mercado Pago", "Mercado Pago", "Mercado Pago", "Stripe", "PayPal", "Transferencia"];
const statuses: SaleStatus[] = ["aprobada", "aprobada", "aprobada", "aprobada", "aprobada", "aprobada", "pendiente", "rechazada", "reembolsada"];

// Ciudades y prefijo telefónico de cada país, para los datos de contacto de prueba.
const COUNTRY_DETAILS: Record<string, { cities: string[]; phone: string }> = {
  Argentina: { cities: ["Buenos Aires", "Córdoba", "Rosario", "Mendoza", "La Plata"], phone: "+54 9 11" },
  México: { cities: ["Ciudad de México", "Guadalajara", "Monterrey"], phone: "+52 55" },
  Uruguay: { cities: ["Montevideo", "Punta del Este"], phone: "+598 9" },
  Chile: { cities: ["Santiago", "Valparaíso", "Concepción"], phone: "+56 9" },
  Colombia: { cities: ["Bogotá", "Medellín", "Cali"], phone: "+57 3" },
  España: { cities: ["Madrid", "Barcelona", "Valencia"], phone: "+34 6" },
};

type SaleDetails = "phone" | "city" | "paymentId" | "attribution" | "emailEvents" | "declineReason";

// Motivos de rechazo de prueba, con el código que devuelve cada pasarela.
const DECLINE_REASONS: { message: string; detail: string; codes: Record<PaymentMethod, string> }[] = [
  {
    message: "Fondos insuficientes",
    detail: "La tarjeta no tenía saldo o límite suficiente. El cliente puede reintentar con otra tarjeta u otro medio de pago.",
    codes: { "Mercado Pago": "cc_rejected_insufficient_amount", Stripe: "insufficient_funds", PayPal: "INSTRUMENT_DECLINED", Transferencia: "—" },
  },
  {
    message: "Código de seguridad incorrecto",
    detail: "El CVV que cargó el cliente no coincide con el de la tarjeta.",
    codes: { "Mercado Pago": "cc_rejected_bad_filled_security_code", Stripe: "incorrect_cvc", PayPal: "CVV2_FAILURE", Transferencia: "—" },
  },
  {
    message: "Rechazado por el banco",
    detail: "El banco emisor no autorizó el pago y no dio más detalles. El cliente tiene que llamar a su banco o usar otra tarjeta.",
    codes: { "Mercado Pago": "cc_rejected_call_for_authorize", Stripe: "do_not_honor", PayPal: "PAYER_CANNOT_PAY", Transferencia: "—" },
  },
  {
    message: "Sospecha de fraude",
    detail: "El sistema antifraude de la pasarela bloqueó el pago por considerarlo riesgoso.",
    codes: { "Mercado Pago": "cc_rejected_high_risk", Stripe: "fraudulent", PayPal: "TRANSACTION_REFUSED", Transferencia: "—" },
  },
  {
    message: "Tarjeta vencida",
    detail: "La tarjeta que usó el cliente ya está vencida.",
    codes: { "Mercado Pago": "cc_rejected_bad_filled_date", Stripe: "expired_card", PayPal: "CARD_EXPIRED", Transferencia: "—" },
  },
];

// ID de pago con el formato de cada pasarela.
function paymentIdFor(method: PaymentMethod, rand: () => number) {
  const digits = (n: number) => Array.from({ length: n }, () => Math.floor(rand() * 10)).join("");
  const alnum = (n: number) =>
    Array.from({ length: n }, () => "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789"[Math.floor(rand() * 56)]).join("");
  if (method === "Stripe") return `pi_${alnum(24)}`;
  if (method === "PayPal") return `PAYID-${alnum(20).toUpperCase()}`;
  if (method === "Transferencia") return `TRF-${digits(8)}`;
  return digits(11); // Mercado Pago usa IDs numéricos
}

// Completa cada venta con contacto, ID de pago, atribución y seguimiento del email.
// Usa su propio generador para no cambiar el resto de los datos de prueba.
function addDetails(sales: Omit<Sale, SaleDetails>[]): Sale[] {
  const rand = seeded(2718);
  // Generador aparte para los rechazos, así no cambian los demás datos.
  const declineRand = seeded(1618);
  const pick = <T,>(list: T[]) => list[Math.floor(rand() * list.length)];
  const digits = (n: number) => Array.from({ length: n }, () => Math.floor(rand() * 10)).join("");
  const alnum = (n: number) =>
    Array.from({ length: n }, () => "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789"[Math.floor(rand() * 56)]).join("");
  // Generador aparte para los cobros de los upsells, así no cambian los demás datos.
  const upsellRand = seeded(4242);
  const priceOf = (id: string) => products.find((p) => p.id === id)!.price;

  return sales.map((s) => {
    const geo = COUNTRY_DETAILS[s.country];
    const store = activeStores.find((t) => t.id === products.find((p) => p.id === s.productId)?.storeId)!;
    const paymentId =
      s.method === "Stripe"
        ? `pi_${alnum(24)}`
        : s.method === "PayPal"
          ? `PAYID-${alnum(20).toUpperCase()}`
          : s.method === "Transferencia"
            ? `TRF-${digits(8)}`
            : digits(11); // Mercado Pago usa IDs numéricos

    const campaignDate = `${String(1 + Math.floor(rand() * 5)).padStart(2, "0")}/11`;
    const adNumber = String(1 + Math.floor(rand() * 4)).padStart(2, "0");
    const adsetNumber = String(1 + Math.floor(rand() * 3)).padStart(2, "0");
    const paid = (source: string, medium: string, kind: string): Attribution => ({
      source,
      medium,
      campaign: `${kind} - ${store.name} ${campaignDate}`,
      adset: `CONJUNTO - ${adsetNumber}`,
      ad: `${store.name} ${pick(["VID", "IMG", "CARRUSEL"])} - ${adNumber}`,
    });
    const attribution: Attribution | null =
      s.source === "Facebook Ads"
        ? paid("facebook", "paid", pick(["Ventas", "Remarketing"]))
        : s.source === "Instagram"
          ? paid("instagram", "paid", pick(["Ventas", "Remarketing"]))
          : s.source === "TikTok"
            ? paid("tiktok", "paid", "Ventas TikTok")
            : s.source === "Google"
              ? { source: "google", medium: "cpc", campaign: `Búsqueda - ${store.name}` }
              : s.source === "Email"
                ? { source: "email", medium: "newsletter", campaign: "Newsletter noviembre" }
                : null;

    // El email de entrega solo sale cuando el pago se aprueba.
    const emailEvents: EmailEvent[] = [];
    if (s.status === "aprobada" || s.status === "reembolsada") {
      const t = Date.parse(s.date);
      const at = (minutes: number) => new Date(t + minutes * 60_000).toISOString();
      emailEvents.push({ type: "enviado", date: at(0) }, { type: "entregado", date: at(1) });
      if (rand() < 0.65) emailEvents.push({ type: "abierto", date: at(3 + Math.floor(rand() * 40)) });
    }

    // Las transferencias no se rechazan en una pasarela: si no llegan, el vendedor la cancela.
    let declineReason: DeclineReason | undefined;
    if (s.status === "rechazada") {
      const r = DECLINE_REASONS[Math.floor(declineRand() * DECLINE_REASONS.length)];
      declineReason =
        s.method === "Transferencia"
          ? {
              message: "No se recibió la transferencia",
              detail: "Pasó el plazo para transferir y el pago no se acreditó, así que la orden se canceló.",
              code: "transferencia_vencida",
            }
          : { message: r.message, detail: r.detail, code: r.codes[s.method] };
    }

    // Upsells: solo se ofrecen si el producto principal se cobró, y no con transferencia
    // (el one-click necesita cobrarle de nuevo a la misma tarjeta o cuenta).
    const offered = (s.status === "aprobada" || s.status === "reembolsada") && s.method !== "Transferencia";
    const upsells: SaleUpsell[] = offered
      ? s.upsells.map((u) => {
          // Si se reembolsó la venta, se devolvieron también los upsells. Si no, ~1 de cada 6 se rechaza.
          const status: SaleStatus =
            s.status === "reembolsada" ? "reembolsada" : upsellRand() < 0.17 ? "rechazada" : "aprobada";
          const r = DECLINE_REASONS[Math.floor(upsellRand() * DECLINE_REASONS.length)];
          return {
            ...u,
            status,
            paymentId: paymentIdFor(s.method, upsellRand),
            declineReason:
              status === "rechazada" ? { message: r.message, detail: r.detail, code: r.codes[s.method] } : undefined,
          };
        })
      : [];
    const amount =
      Math.round(
        (priceOf(s.productId) + upsells.filter((u) => u.status !== "rechazada").reduce((a, u) => a + priceOf(u.productId), 0)) * 100,
      ) / 100;

    return {
      ...s,
      upsells,
      amount,
      declineReason,
      phone: `${geo.phone} ${digits(4)}-${digits(4)}`,
      city: pick(geo.cities),
      paymentId,
      attribution,
      emailEvents,
    };
  });
}

function buildSales(): Omit<Sale, SaleDetails>[] {
  const rand = seeded(42);
  // Generador aparte para los upsells, así no cambian los clientes, productos y fechas de siempre.
  const upsellRand = seeded(314);
  // Y otro para país y origen. El país es por cliente: si vuelve a comprar, es el mismo.
  const geoRand = seeded(7);
  const countryByCustomer = new Map<string, string>();
  const active = products.filter((p) => p.status !== "borrador");
  const base = new Date(`${TODAY}T23:00:00Z`).getTime();
  return Array.from({ length: 40 }, (_, i) => {
    const first = firstNames[Math.floor(rand() * firstNames.length)];
    const last = lastNames[Math.floor(rand() * lastNames.length)];
    const product = active[Math.floor(rand() * active.length)];
    const minutesAgo = i * 95 + Math.floor(rand() * 80);
    // ~4 de cada 10 ventas se llevan al menos un upsell; algunas, dos o tres.
    const r = upsellRand();
    const upsellCount = r < 0.05 ? 3 : r < 0.15 ? 2 : r < 0.4 ? 1 : 0;
    const candidates = active.filter((p) => p.id !== product.id);
    const picked: string[] = [];
    while (picked.length < upsellCount) {
      const pick = candidates[Math.floor(upsellRand() * candidates.length)];
      if (!picked.includes(pick.id)) picked.push(pick.id);
    }
    // Número de upsell en el embudo: los primeros se aceptan más que los últimos.
    const steps: number[] = [];
    while (steps.length < upsellCount) {
      const step = 1 + Math.floor(upsellRand() ** 2 * MAX_UPSELLS);
      if (!steps.includes(step)) steps.push(step);
    }
    steps.sort((x, y) => x - y);
    // El estado y el ID de pago de cada upsell se completan en addDetails().
    const upsells: SaleUpsell[] = picked.map((productId, k) => ({
      productId,
      step: steps[k],
      status: "aprobada",
      paymentId: "",
    }));
    const name = `${first} ${last}`;
    if (!countryByCustomer.has(name)) {
      countryByCustomer.set(name, countries[Math.floor(geoRand() * countries.length)]);
    }
    const source = sources[Math.floor(geoRand() * sources.length)];
    const upsellTotal = upsells.reduce((a, u) => a + products.find((p) => p.id === u.productId)!.price, 0);
    return {
      id: `#${(10482 - i).toString()}`,
      customer: name,
      email: `${first}.${last}`.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "") + "@gmail.com",
      productId: product.id,
      amount: Math.round((product.price + upsellTotal) * 100) / 100,
      upsells,
      country: countryByCustomer.get(name)!,
      source,
      method: methods[Math.floor(rand() * methods.length)],
      status: statuses[Math.floor(rand() * statuses.length)],
      date: new Date(base - minutesAgo * 60_000).toISOString(),
    };
  });
}

export const sales = addDetails(buildSales());

export const customers: Customer[] = (() => {
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
        country: s.country,
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

// Un artículo de la venta con su propio cobro: el producto principal (step null) o un upsell.
export type SaleItem = {
  product: Product;
  step: number | null;
  status: SaleStatus;
  paymentId: string;
  declineReason?: DeclineReason;
};

// Lo que se llevó en una venta: el producto principal y después cada upsell, cada uno con su pago.
export function saleItems(sale: Sale): SaleItem[] {
  return [
    {
      product: productById(sale.productId)!,
      step: null,
      status: sale.status,
      paymentId: sale.paymentId,
      declineReason: sale.declineReason,
    },
    ...sale.upsells.map((u) => ({
      product: productById(u.productId)!,
      step: u.step,
      status: u.status,
      paymentId: u.paymentId,
      declineReason: u.declineReason,
    })),
  ];
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

// Notificaciones del menú de la bandeja (arriba a la derecha), armadas a partir de las últimas ventas.
// Las más recientes llegan sin leer.
export type NotificationKind = "venta" | "rechazo" | "upsell-rechazado" | "reembolso" | "retiro";
export type AppNotification = {
  id: string;
  kind: NotificationKind;
  title: string;
  detail: string;
  date: string;
  href: string;
  unread: boolean;
};

export const notifications: AppNotification[] = (() => {
  const list: AppNotification[] = [];
  for (const s of sales.slice(0, 10)) {
    const product = productById(s.productId)!;
    if (s.status === "rechazada") {
      list.push({
        id: `${s.id}-rechazo`,
        kind: "rechazo",
        title: `Pago rechazado · ${s.id}`,
        detail: `${s.customer} · ${s.declineReason?.message ?? product.name}`,
        date: s.date,
        href: "/dashboard/ventas",
        unread: false,
      });
      continue;
    }
    if (s.status === "reembolsada") {
      list.push({
        id: `${s.id}-reembolso`,
        kind: "reembolso",
        title: `Reembolso · ${s.id}`,
        detail: `Le devolviste ${s.amount.toFixed(2)} USD a ${s.customer}`,
        date: s.date,
        href: "/dashboard/ventas",
        unread: false,
      });
      continue;
    }
    if (s.status !== "aprobada") continue;
    const items = s.upsells.filter((u) => u.status === "aprobada").length + 1;
    list.push({
      id: `${s.id}-venta`,
      kind: "venta",
      title: `Nueva venta · ${s.amount.toFixed(2)} USD`,
      detail: `${s.customer} compró ${product.name}${items > 1 ? ` y ${items - 1} upsell${items > 2 ? "s" : ""}` : ""}`,
      date: s.date,
      href: "/dashboard/ventas",
      unread: false,
    });
    for (const u of s.upsells.filter((u) => u.status === "rechazada")) {
      list.push({
        id: `${s.id}-upsell-${u.step}`,
        kind: "upsell-rechazado",
        title: `Upsell ${u.step} rechazado · ${s.id}`,
        detail: `${s.customer} · ${u.declineReason?.message ?? productById(u.productId)!.name}`,
        date: s.date,
        href: "/dashboard/ventas",
        unread: false,
      });
    }
  }
  list.push({
    id: "retiro-1",
    kind: "retiro",
    title: "Retiro acreditado · 520.00 USD",
    detail: "Ya está en tu cuenta bancaria",
    date: `${TODAY}T09:00:00.000Z`,
    href: "/dashboard",
    unread: false,
  });
  list.sort((a, b) => b.date.localeCompare(a.date));
  list.slice(0, 3).forEach((n) => (n.unread = true));
  return list;
})();
