import { site } from "@/config/site";

// Moneda por defecto de la app: dólares (USD), con formato "$1,234.50".
const money = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: site.currency,
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const compact = new Intl.NumberFormat("en-US", {
  notation: "compact",
  maximumFractionDigits: 1,
});

export function formatMoney(value: number) {
  return money.format(value);
}

// Monto en cualquier moneda, con el mismo formato que el resto de la app: "US$ 1,482.50", "MXN 850.00", "ARS 310,000".
export function formatCurrency(value: number, code: string, decimals = 2) {
  const prefix = code === "USD" ? "US$" : code === "EUR" ? "€" : code;
  const number = new Intl.NumberFormat("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
  return `${prefix} ${number}`;
}

export function formatCompactMoney(value: number) {
  return `$${compact.format(value)}`;
}

export function formatNumber(value: number) {
  return new Intl.NumberFormat("en-US").format(value);
}

export function formatDate(iso: string) {
  return new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "short",
    timeZone: "UTC",
  }).format(new Date(iso));
}

export function formatDateTime(iso: string) {
  return new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "UTC",
  }).format(new Date(iso));
}

// "hoy 10:39 p. m.", "ayer 08:26 a. m.", "martes 07:38 a. m." o "28 oct 07:38 a. m." si pasó más de una semana.
// `today` es la fecha de hoy como "AAAA-MM-DD".
export function formatRelativeDateTime(iso: string, today: string) {
  const date = new Date(iso);
  const time = new Intl.DateTimeFormat("es-AR", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
    timeZone: "UTC",
  }).format(date);
  const daysAgo = Math.round(
    (new Date(`${today}T00:00:00Z`).getTime() - new Date(`${iso.slice(0, 10)}T00:00:00Z`).getTime()) / 86_400_000,
  );
  let day: string;
  if (daysAgo === 0) day = "hoy";
  else if (daysAgo === 1) day = "ayer";
  else if (daysAgo > 1 && daysAgo < 7)
    day = new Intl.DateTimeFormat("es-AR", { weekday: "long", timeZone: "UTC" }).format(date);
  else day = new Intl.DateTimeFormat("es-AR", { day: "numeric", month: "short", timeZone: "UTC" }).format(date);
  return `${day} ${time}`;
}

export function initials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

// "5 nov 2026" o "6 oct – 5 nov 2026" a partir de fechas "AAAA-MM-DD".
export function formatRange(from: string, to: string) {
  const fmt = (d: string, withYear: boolean) =>
    new Intl.DateTimeFormat("es-AR", {
      day: "numeric",
      month: "short",
      year: withYear ? "numeric" : undefined,
      timeZone: "UTC",
    }).format(new Date(`${d}T00:00:00Z`));
  if (from === to) return fmt(from, true);
  return `${fmt(from, from.slice(0, 4) !== to.slice(0, 4))} – ${fmt(to, true)}`;
}
