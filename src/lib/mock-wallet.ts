// Datos de prueba de la Wallet. Cuando haya integraciones, salen de las pasarelas y de la base de datos.
// Ver INTEGRACIONES.md → "Saldo, liberaciones y retiros".
import { stats, TODAY } from "@/lib/mock-data";

const DAY_MS = 86_400_000;
const addDays = (date: string, days: number) => new Date(Date.parse(`${date}T00:00:00Z`) + days * DAY_MS).toISOString().slice(0, 10);

// ── Saldos por moneda ────────────────────────────────────────────────────────
// Con una pasarela global (por ejemplo Whop), cada venta entra en la moneda en la que pagó el comprador.
// El vendedor elige una moneda principal (USD o EUR) y convierte los demás saldos cuando quiere.

export type MainCurrency = "USD" | "EUR";

export type CurrencyInfo = {
  code: string;
  name: string;
  flag: string;
  rateToUSD: number; // cuántos USD vale 1 unidad (tasa de referencia de prueba)
  decimals: number;
};

export const CURRENCIES: Record<string, CurrencyInfo> = {
  USD: { code: "USD", name: "Dólar estadounidense", flag: "🇺🇸", rateToUSD: 1, decimals: 2 },
  EUR: { code: "EUR", name: "Euro", flag: "🇪🇺", rateToUSD: 1.08, decimals: 2 },
  ARS: { code: "ARS", name: "Peso argentino", flag: "🇦🇷", rateToUSD: 0.001, decimals: 0 },
  MXN: { code: "MXN", name: "Peso mexicano", flag: "🇲🇽", rateToUSD: 0.055, decimals: 2 },
  COP: { code: "COP", name: "Peso colombiano", flag: "🇨🇴", rateToUSD: 0.00025, decimals: 0 },
  CLP: { code: "CLP", name: "Peso chileno", flag: "🇨🇱", rateToUSD: 0.00105, decimals: 0 },
};

// Saldo de cada moneda: lo disponible y lo que está por acreditarse (a liquidar).
export type CurrencyBalance = { code: string; available: number; pending: number };

export const currencyBalances: CurrencyBalance[] = [
  { code: "USD", available: stats.available, pending: 1200.04 }, // con las demás monedas suma lo mismo que el calendario (US$ 1,926.60)
  { code: "EUR", available: 0, pending: 22 },
  { code: "ARS", available: 0, pending: 310_000 },
  { code: "MXN", available: 850, pending: 2_400 },
  { code: "COP", available: 0, pending: 640_000 },
  { code: "CLP", available: 0, pending: 96_000 },
];

// Convierte un monto entre monedas con la tasa de referencia.
export function convert(amount: number, from: string, to: string) {
  return (amount * CURRENCIES[from].rateToUSD) / CURRENCIES[to].rateToUSD;
}


// Acreditaciones de las próximas 2 semanas: cada venta se acredita en la moneda en la que pagó el comprador,
// en la fecha en que la pasarela la libera. Es la fuente de la card "Acreditaciones", del gráfico y del saldo por pasarela.
// Los montos de cada moneda suman lo "a acreditarse" de currencyBalances (más abajo).
export type Settlement = { date: string; code: string; amount: number; sales: number; gateway: Gateway["id"] };

export const settlements: Settlement[] = (() => {
  // [días desde hoy, moneda, monto, ventas, pasarela] — fijos para que los datos de prueba no cambien.
  const plan: [number, string, number, number, Gateway["id"]][] = [
    [1, "USD", 214.4, 9, "stripe"],
    [1, "MXN", 1200, 3, "whop"],
    [2, "ARS", 96_500, 4, "mercadopago"],
    [3, "USD", 178.2, 8, "stripe"],
    [3, "COP", 320_000, 2, "whop"],
    [4, "EUR", 22, 1, "whop"],
    [4, "CLP", 48_000, 2, "whop"],
    [5, "USD", 61.9, 3, "paypal"],
    [6, "USD", 238.7, 11, "stripe"],
    [6, "ARS", 120_000, 5, "mercadopago"],
    [7, "MXN", 1200, 3, "whop"],
    [8, "USD", 186.6, 8, "stripe"],
    [9, "CLP", 48_000, 2, "whop"],
    [10, "USD", 205.1, 9, "stripe"],
    [10, "COP", 320_000, 2, "whop"],
    [11, "USD", 96.5, 3, "paypal"],
    [12, "ARS", 93_500, 4, "mercadopago"],
    [13, "USD", 18.64, 1, "stripe"],
  ];
  return plan.map(([days, code, amount, sales, gateway]) => ({ date: addDays(TODAY, days), code, amount, sales, gateway }));
})();

// Lo que se acredita cada día, pasado a USD (para el gráfico de barras).
export type Release = { date: string; amount: number; sales: number; codes: string[] };

export const releases: Release[] = (() => {
  const byDate = new Map<string, Release>();
  for (const st of settlements) {
    const r = byDate.get(st.date) ?? { date: st.date, amount: 0, sales: 0, codes: [] };
    r.amount += convert(st.amount, st.code, "USD");
    r.sales += st.sales;
    if (!r.codes.includes(st.code)) r.codes.push(st.code);
    byDate.set(st.date, r);
  }
  return [...byDate.values()].map((r) => ({ ...r, amount: Math.round(r.amount * 100) / 100 }));
})();

// Pasarelas donde está la plata. Cada una retiene las ventas unos días antes de liberarlas.
// Los montos están pasados a USD.
export type Gateway = {
  id: "mercadopago" | "stripe" | "paypal" | "whop";
  name: string;
  available: number;
  pending: number;
  holdDays: number; // días hasta que se libera una venta
};

// Lo "por liberar" de cada pasarela sale de sus acreditaciones.
const pendingOf = (id: Gateway["id"]) =>
  Math.round(settlements.filter((s) => s.gateway === id).reduce((a, s) => a + convert(s.amount, s.code, "USD"), 0) * 100) / 100;

export const gateways: Gateway[] = [
  { id: "mercadopago", name: "Mercado Pago", available: 986.3, pending: pendingOf("mercadopago"), holdDays: 14 },
  { id: "stripe", name: "Stripe", available: 412.2, pending: pendingOf("stripe"), holdDays: 7 },
  { id: "paypal", name: "PayPal", available: 84, pending: pendingOf("paypal"), holdDays: 21 },
  // Whop cobra en la moneda de cada país: acá están los saldos en EUR, MXN, COP y CLP.
  { id: "whop", name: "Whop", available: 46.75, pending: pendingOf("whop"), holdDays: 7 },
];

export const balance = {
  available: stats.available, // 1482.50: lo mismo que la card "Tu saldo" del Resumen
  inTransit: stats.pendingPayout, // retiro en camino a tu cuenta
  pending: gateways.reduce((a, g) => a + g.pending, 0), // ventas que todavía no se liberan
  withdrawnThisMonth: 1840,
};

// Cuentas a las que el vendedor retira la plata.
export type PayoutMethod = {
  id: string;
  kind: "banco" | "mercadopago" | "paypal" | "cripto";
  name: string;
  detail: string;
  holder: string;
  arrives: string;
  fee: number; // comisión fija por retiro, en USD
  isDefault: boolean;
  verified: boolean;
  // Lo que cargó el vendedor, para poder editar la cuenta.
  fields: { bank?: string; cbu?: string; email?: string; address?: string; network?: string };
};

export const payoutMethods: PayoutMethod[] = [
  {
    id: "pm1",
    kind: "banco",
    name: "Banco Galicia",
    detail: "Cuenta en pesos · CBU ···· 4821",
    holder: "Lautaro Carbone",
    arrives: "1 a 2 días hábiles",
    fee: 0,
    isDefault: true,
    verified: true,
    fields: { bank: "Banco Galicia", cbu: "0070999030004123454821" },
  },
  {
    id: "pm2",
    kind: "mercadopago",
    name: "Mercado Pago",
    detail: "lautaro.carbone@gmail.com",
    holder: "Lautaro Carbone",
    arrives: "Al instante",
    fee: 0,
    isDefault: false,
    verified: true,
    fields: { email: "lautaro.carbone@gmail.com" },
  },
  {
    id: "pm3",
    kind: "cripto",
    name: "USDT (red TRC-20)",
    detail: "TQ8n···f4Vz",
    holder: "Billetera propia",
    arrives: "En minutos",
    fee: 1,
    isDefault: false,
    verified: false,
    fields: { address: "TQ8nX2kLm9PqR4sT7vW1yZ3aB5cD6eHf4Vz", network: "TRC-20" },
  },
];

export type WithdrawalStatus = "acreditado" | "en-proceso" | "rechazado";

export type Withdrawal = {
  id: string;
  date: string;
  amount: number;
  currency?: MainCurrency; // si no se indica, USD
  methodId: string;
  status: WithdrawalStatus;
  note?: string;
};

export const withdrawals: Withdrawal[] = [
  { id: "RT-20931", date: `${addDays(TODAY, 0)}T14:12:00.000Z`, amount: stats.pendingPayout, methodId: "pm1", status: "en-proceso" },
  { id: "RT-20877", date: `${addDays(TODAY, -3)}T10:40:00.000Z`, amount: 520, methodId: "pm1", status: "acreditado" },
  { id: "RT-20812", date: `${addDays(TODAY, -8)}T18:05:00.000Z`, amount: 380, methodId: "pm2", status: "acreditado" },
  { id: "RT-20790", date: `${addDays(TODAY, -11)}T09:30:00.000Z`, amount: 250, methodId: "pm3", status: "rechazado", note: "La billetera no está verificada." },
  { id: "RT-20744", date: `${addDays(TODAY, -15)}T16:22:00.000Z`, amount: 575.8, methodId: "pm1", status: "acreditado" },
  { id: "RT-20701", date: `${addDays(TODAY, -22)}T11:48:00.000Z`, amount: 410, methodId: "pm2", status: "acreditado" },
  { id: "RT-20655", date: `${addDays(TODAY, -29)}T13:15:00.000Z`, amount: 690.4, methodId: "pm1", status: "acreditado" },
  { id: "RT-20618", date: `${addDays(TODAY, -36)}T08:57:00.000Z`, amount: 305, methodId: "pm1", status: "acreditado" },
];
