"use client";

import { useEffect, useRef, useState } from "react";
import {
  Check,
  CircleAlert,
  CircleCheck,
  Copy,
  CreditCard,
  Eye,
  Mail,
  MapPin,
  Megaphone,
  Phone,
  RotateCw,
  Send,
  X,
} from "lucide-react";
import { Button, ProductThumb, StatusBadge } from "@/components/dashboard/ui";
import {
  activeStores,
  saleItems,
  type EmailEventType,
  type Sale,
} from "@/lib/mock-data";
import { formatMoney, initials } from "@/lib/format";
import { BLUR } from "@/components/dashboard/hide-columns-menu";
import { CountryFlag } from "@/components/dashboard/country-flag";
import { SourceIcon } from "@/components/dashboard/brand-icons";

const fullDate = new Intl.DateTimeFormat("es-AR", {
  day: "2-digit",
  month: "2-digit",
  year: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hour12: true,
  timeZone: "UTC",
});

const EMAIL_EVENTS: Record<EmailEventType, { label: string; icon: typeof Send; className: string }> = {
  enviado: { label: "Enviado", icon: Send, className: "text-muted" },
  entregado: { label: "Entregado", icon: CircleCheck, className: "text-emerald-400" },
  abierto: { label: "Abierto", icon: Eye, className: "text-violet-300" },
};


// Panel lateral con el detalle de una orden. Se cierra con Escape, la X o tocando afuera.
// `hidden` son las columnas que se ocultaron en la tabla ("Ocultar datos"): acá se difuminan los mismos datos.
export function OrderDrawer({
  sale,
  onClose,
  hidden = new Set(),
}: {
  sale: Sale;
  onClose: () => void;
  hidden?: ReadonlySet<string>;
}) {
  const b = (col: string) => (hidden.has(col) ? BLUR : "");
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    // Mientras está abierto, la página de atrás no scrollea.
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
    };
  }, [onClose]);

  const items = saleItems(sale);
  // Cada artículo es un cobro aparte: pueden estar rechazados el principal o algún upsell.
  const declined = items.filter((it) => it.declineReason);
  const charged = items.filter((it) => it.status !== "rechazada").reduce((a, it) => a + it.product.price, 0);
  const store = activeStores.find((t) => t.id === items[0].product.storeId);
  const a = sale.attribution;

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-labelledby="order-title">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-200 starting:opacity-0"
        onClick={onClose}
      />

      <aside className="absolute inset-y-0 right-0 flex w-full max-w-md flex-col border-l border-border bg-surface shadow-2xl shadow-black/60 transition-transform duration-300 ease-out starting:translate-x-full">
        {/* Encabezado */}
        <header className="flex items-start gap-3 border-b border-border p-5">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h2 id="order-title" className="text-lg font-semibold tracking-tight tabular-nums">
                Orden {sale.id}
              </h2>
              <StatusBadge status={sale.status} />
            </div>
            <p className="mt-1 text-xs text-subtle">
              {fullDate.format(new Date(sale.date))} ·{" "}
              <span className={b("tienda")}>{store?.name}</span>
            </p>
          </div>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="grid size-8 place-items-center rounded-lg text-muted transition hover:bg-overlay/5 hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        </header>

        <div className="flex-1 space-y-6 overflow-y-auto p-5">
          {/* Motivos de rechazo: arriba de todo para ver enseguida qué pasó con cada pago. */}
          {declined.map((it) => (
            <div
              key={it.product.id}
              role="alert"
              className="flex gap-3 rounded-xl border border-rose-500/30 bg-rose-500/10 p-4"
            >
              <CircleAlert className="mt-0.5 size-5 shrink-0 text-rose-400" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-rose-300">
                  {it.step === null ? "Pago rechazado" : `Upsell ${it.step} rechazado`}: {it.declineReason!.message}
                </p>
                {it.step !== null && (
                  <p className="mt-0.5 text-xs text-subtle">{it.product.name}</p>
                )}
                <p className="mt-1 text-sm leading-relaxed text-muted">{it.declineReason!.detail}</p>
                <p className="mt-2 text-xs text-subtle">
                  Código de {sale.method}:{" "}
                  <code className="rounded bg-black/30 px-1.5 py-0.5 font-mono text-rose-300/90">
                    {it.declineReason!.code}
                  </code>
                </p>
              </div>
            </div>
          ))}

          {/* Cliente */}
          <Section title="Cliente" blurred={hidden.has("cliente")}>
            <div className="flex items-center gap-3 border-b border-border p-4">
              <span className="grid size-10 shrink-0 place-items-center rounded-full bg-brand-soft text-sm font-semibold text-violet-300">
                {initials(sale.customer)}
              </span>
              <div className="min-w-0">
                <p className="truncate font-medium">{sale.customer}</p>
                <p className="flex items-center gap-1.5 text-xs text-subtle">
                  <CountryFlag country={sale.country} className="h-3 w-[18px]" /> {sale.country}
                </p>
              </div>
            </div>
            <dl className="divide-y divide-border text-sm">
              <InfoRow icon={Mail} label="Email" value={sale.email} copy />
              <InfoRow icon={Phone} label="Teléfono" value={sale.phone} copy />
              <InfoRow icon={MapPin} label="Ubicación" value={`${sale.city}, ${sale.country}`} />
            </dl>
          </Section>

          {/* Productos */}
          <Section title={`Productos · ${items.length}`}>
            <ul className="divide-y divide-border">
              {items.map(({ product: item, step, status }) => (
                <li key={item.id} className="flex items-center gap-3 px-4 py-3">
                  <span className={b("articulos")}>
                    <ProductThumb name={item.name} />
                  </span>
                  <div className="min-w-0 flex-1">
                    {/* Qué es cada uno va entre paréntesis: el único color que queda es el del estado del pago. */}
                    <p className="truncate text-sm font-medium">
                      <span className={b("articulos")}>{item.name}</span>{" "}
                      <span className="font-normal text-subtle">({step === null ? "Producto" : `Upsell ${step}`})</span>
                    </p>
                    <div className="mt-1">
                      <StatusBadge status={status} />
                    </div>
                  </div>
                  <span
                    className={`text-sm tabular-nums ${status === "rechazada" ? "text-subtle line-through" : ""}`}
                  >
                    <span className={b("total")}>{formatMoney(item.price)}</span>
                  </span>
                </li>
              ))}
            </ul>
          </Section>

          {/* Pago */}
          <Section title="Pago">
            <dl className="divide-y divide-border text-sm">
              <div className="flex items-center gap-3 px-4 py-2.5">
                <dt className="flex w-32 shrink-0 items-center gap-2 text-muted">
                  <CreditCard className="size-3.5 text-subtle" />
                  Medio de pago
                </dt>
                <dd className="ml-auto flex items-center gap-2 font-medium">
                  <SourceIcon name={sale.method} size="size-5" />
                  {sale.method}
                </dd>
              </div>
              {/* Un ID de pago por cobro: no hay carrito, cada artículo se cobra por separado. */}
              {items.map((it) => (
                <InfoRow
                  key={it.product.id}
                  label={it.step === null ? "ID · Product" : `ID · Upsell ${it.step}`}
                  value={it.paymentId}
                  mono
                  copy
                />
              ))}
              <div className="flex items-center justify-between bg-brand-soft px-4 py-3">
                <dt className="font-medium">Total cobrado</dt>
                <dd className={`text-base font-semibold tabular-nums ${b("total")}`}>{formatMoney(charged)}</dd>
              </div>
            </dl>
          </Section>

          {/* Origen */}
          <Section title="Origen">
            <div className="flex items-center gap-3 border-b border-border px-4 py-2.5 text-sm">
              <span className="w-32 shrink-0 text-muted">Canal</span>
              <span className="ml-auto inline-flex items-center gap-2 font-medium">
                <SourceIcon name={sale.source} size="size-5" />
                {sale.source}
              </span>
            </div>
            {a ? (
              <dl className="divide-y divide-border text-sm">
                <InfoRow icon={Megaphone} label="Fuente" value={`${a.source} / ${a.medium}`} />
                <InfoRow label="Campaña" value={a.campaign} />
                {a.adset && <InfoRow label="Conjunto" value={a.adset} />}
                {a.ad && <InfoRow label="Anuncio" value={a.ad} />}
              </dl>
            ) : (
              <p className="px-4 py-3 text-sm text-muted">
                Llegó directo, sin campaña ni anuncio.
              </p>
            )}
          </Section>

          {/* Seguimiento del email */}
          <Section title="Email de entrega">
            {sale.emailEvents.length > 0 ? (
              <ol className="relative space-y-3 px-4 py-3">
                {sale.emailEvents.map((e) => {
                  const ev = EMAIL_EVENTS[e.type];
                  return (
                    <li key={e.type} className="flex items-center gap-3 text-sm">
                      <ev.icon className={`size-4 shrink-0 ${ev.className}`} />
                      <span className={`flex-1 font-medium ${ev.className}`}>{ev.label}</span>
                      <span className="text-xs tabular-nums text-subtle">
                        {fullDate.format(new Date(e.date))}
                      </span>
                    </li>
                  );
                })}
              </ol>
            ) : (
              <p className="px-4 py-3 text-sm text-muted">
                {sale.status === "pendiente"
                  ? "Se envía cuando se apruebe el pago."
                  : "No se envió: el pago fue rechazado."}
              </p>
            )}
          </Section>
        </div>

        {/* Acciones */}
        {sale.status === "aprobada" && (
          <footer className="flex gap-2 border-t border-border p-4">
            <Button variant="secondary" className="flex-1 justify-center">
              <Send className="size-4" /> Reenviar entrega
            </Button>
            <Button variant="secondary" className="flex-1 justify-center">
              <RotateCw className="size-4" /> Reembolsar
            </Button>
          </footer>
        )}
      </aside>
    </div>
  );
}

function Section({
  title,
  children,
  blurred = false,
}: {
  title: string;
  children: React.ReactNode;
  blurred?: boolean;
}) {
  return (
    <section>
      <h3 className="mb-2 text-xs font-medium uppercase tracking-wider text-subtle">{title}</h3>
      <div className="overflow-hidden rounded-xl border border-border bg-background/40">
        {/* Si está oculto se difumina y no se puede tocar (ni copiar). */}
        <div className={blurred ? `${BLUR} pointer-events-none` : ""} aria-hidden={blurred || undefined}>
          {children}
        </div>
      </div>
    </section>
  );
}

function InfoRow({
  icon: Icon,
  label,
  value,
  mono = false,
  copy = false,
  blurred = false,
}: {
  icon?: typeof Mail;
  label: string;
  value: string;
  mono?: boolean;
  copy?: boolean;
  blurred?: boolean;
}) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="group flex items-center gap-3 px-4 py-2.5">
      <dt className="flex w-32 shrink-0 items-center gap-2 text-muted">
        {Icon && <Icon className="size-3.5 text-subtle" />}
        {label}
      </dt>
      <dd
        className={`min-w-0 flex-1 truncate text-right ${mono ? "font-mono text-xs" : ""} ${blurred ? BLUR : ""}`}
        title={blurred ? undefined : value}
      >
        {value}
      </dd>
      {copy && !blurred && (
        <button
          type="button"
          onClick={() => {
            navigator.clipboard?.writeText(value);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
          }}
          aria-label={`Copiar ${label.toLowerCase()}`}
          className="grid size-6 shrink-0 place-items-center rounded-md text-subtle transition hover:bg-overlay/5 hover:text-foreground"
        >
          {copied ? <Check className="size-3.5 text-emerald-400" /> : <Copy className="size-3.5" />}
        </button>
      )}
    </div>
  );
}
