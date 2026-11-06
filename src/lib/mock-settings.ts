import { activeStores, inactiveStores } from "@/lib/mock-data";

// Datos de prueba de Configuración. Cuando haya base de datos, salen de la cuenta y la tienda reales.
// Ver INTEGRACIONES.md → "Configuración".

// Configuración de cada tienda: cada una tiene la suya (se edita en Tiendas).
// Estado de la tienda. Las archivadas no se configuran (se ven solo en Tiendas inactivas).
export type StoreStatus = "activa" | "pausada" | "sin plan";

export type StoreSettings = {
  id: string;
  name: string;
  status: StoreStatus;
  color: string;
  subdomain: string;
  tabTitle: string;
  supportEmail: string;
  language: string;
  timezone: string;
  currency: string;
  customDomain?: { domain: string; verified: boolean };
  pixels: MetaPixel[];
  clarityId?: string;
  metaVerification?: string;
  tiktokPixel?: string;
  ga4?: string;
  brevoConnected?: boolean;
};

const STORE_EXTRAS: Record<string, Partial<StoreSettings>> = {
  t1: {
    tabTitle: "Vida Simple · Guías para ordenar tu dinero y tu vida",
    pixels: [{ id: "px1", pixelId: "1804256307288258", token: "EAAGm0PX4ZCpsBAKZB7uLq9fXnR3vYtT2cW8sQ1dE5hJ" }],
    clarityId: "z70aouxkts",
    metaVerification: "qynhxqzzyo6e7fczkl7bv8c3yizhh3",
  },
  t2: {
    tabTitle: "Creadores Pro · Cursos para creadores de contenido",
    customDomain: { domain: "creadorespro.com", verified: true },
    tiktokPixel: "C4B9K2M7Q1R8T3V6X0Z5",
    ga4: "G-8KX2M4P9QR",
    brevoConnected: true,
    pixels: [
      { id: "px2", pixelId: "2210938475610293", token: "EAAGx8Lm2QpZBnR4tYvW7sK1dF9hJ3cN6bV0aZ" },
      { id: "px3", pixelId: "9937261540018845", token: "" },
    ],
  },
  t3: {
    tabTitle: "",
    language: "en",
    timezone: "America/Mexico_City",
  },
};

// Tiendas que se pueden configurar: todas las que no están archivadas
// (las activas y las inactivas por estar pausadas o sin plan).
export const configurableStores: { id: string; name: string; subdomain: string; color: string; status: StoreStatus }[] = [
  ...activeStores.map((s) => ({ ...s, status: "activa" as const })),
  ...inactiveStores
    .filter((s) => s.reason !== "archivada")
    .map((s) => ({ id: s.id, name: s.name, subdomain: s.subdomain, color: s.color, status: s.reason as StoreStatus })),
];

export function getStoreSettings(id: string): StoreSettings | undefined {
  const store = configurableStores.find((s) => s.id === id);
  if (!store) return undefined;
  return {
    id: store.id,
    name: store.name,
    status: store.status,
    color: store.color,
    subdomain: store.subdomain,
    tabTitle: "",
    supportEmail: `soporte@${store.subdomain}.com`,
    language: "es",
    timezone: "America/Argentina/Buenos_Aires",
    currency: "USD",
    pixels: [],
    ...STORE_EXTRAS[id],
  };
}

export const accountSettings = {
  name: "Lautaro Carbone",
  email: "carbonelauti@gmail.com",
  plan: "Pro",
  renewsOn: "2026-12-05",
};

export const LANGUAGES = [
  { value: "es", label: "🇦🇷 Español" },
  { value: "en", label: "🇺🇸 English" },
  { value: "pt", label: "🇧🇷 Português" },
];

export const TIMEZONES = [
  { value: "America/Argentina/Buenos_Aires", label: "(GMT-03:00) Buenos Aires" },
  { value: "America/Montevideo", label: "(GMT-03:00) Montevideo" },
  { value: "America/Santiago", label: "(GMT-03:00) Santiago" },
  { value: "America/Bogota", label: "(GMT-05:00) Bogotá" },
  { value: "America/Mexico_City", label: "(GMT-06:00) Ciudad de México" },
  { value: "Europe/Madrid", label: "(GMT+01:00) Madrid" },
];

export const CURRENCIES = [
  { value: "USD", label: "USD · Dólar estadounidense" },
  { value: "ARS", label: "ARS · Peso argentino" },
  { value: "MXN", label: "MXN · Peso mexicano" },
  { value: "EUR", label: "EUR · Euro" },
];

export type ProviderStatus = "conectado" | "desconectado";

export type PaymentProvider = {
  id: "mercadopago" | "stripe" | "paypal" | "transferencia";
  name: string;
  description: string;
  note: string;
  status: ProviderStatus;
  account?: string;
  oneClick: boolean; // si permite upsells de un clic
};

export const paymentProviders: PaymentProvider[] = [
  {
    id: "mercadopago",
    name: "Mercado Pago",
    description: "Tarjetas, débito, dinero en cuenta y cuotas.",
    note: "Para cobrar en pesos argentinos. Necesita una cuenta de Argentina.",
    status: "conectado",
    account: "lautaro.carbone@mercadopago",
    oneClick: true,
  },
  {
    id: "stripe",
    name: "Stripe",
    description: "Tarjetas internacionales, Apple Pay y Google Pay.",
    note: "Para compradores de todo el mundo. Necesita una cuenta de un país habilitado (por ejemplo, EE. UU.).",
    status: "desconectado",
    oneClick: true,
  },
  {
    id: "paypal",
    name: "PayPal",
    description: "El comprador paga con su cuenta PayPal o tarjeta.",
    note: "Necesita una cuenta PayPal Business.",
    status: "desconectado",
    oneClick: true,
  },
  {
    id: "transferencia",
    name: "Transferencia bancaria",
    description: "El comprador te transfiere y vos confirmás el pago.",
    note: "No admite upsells de un clic: cada transferencia se confirma a mano.",
    status: "conectado",
    account: "Alias lautaro.digital",
    oneClick: false,
  },
];

export type MetaPixel = { id: string; pixelId: string; token: string };

export const WEBHOOK_EVENTS = [
  { value: "venta.aprobada", label: "Venta aprobada" },
  { value: "venta.rechazada", label: "Pago rechazado" },
  { value: "upsell.aprobado", label: "Upsell aprobado" },
  { value: "upsell.rechazado", label: "Upsell rechazado" },
  { value: "reembolso", label: "Reembolso" },
  { value: "contracargo", label: "Contracargo" },
  { value: "carrito.abandonado", label: "Carrito abandonado" },
] as const;

export type WebhookEvent = (typeof WEBHOOK_EVENTS)[number]["value"];

export type WebhookEndpoint = {
  id: string;
  url: string;
  events: WebhookEvent[];
  active: boolean;
  secret: string;
  lastDelivery?: { status: number; date: string };
};

export const webhookEndpoints: WebhookEndpoint[] = [
  {
    id: "wh1",
    url: "https://hooks.zapier.com/hooks/catch/18273645/3kq9xz/",
    events: ["venta.aprobada", "reembolso", "contracargo"],
    active: true,
    secret: "whsec_945b29c1f07a4e6d8b2a3c5e7f901897",
    lastDelivery: { status: 200, date: "2026-11-05T22:39:00.000Z" },
  },
];
