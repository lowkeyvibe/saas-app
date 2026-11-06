"use client";

import { useEffect, useId, useRef, useState } from "react";
import { ArrowDownRight, ArrowUpRight, ImageIcon, type LucideIcon } from "lucide-react";
import type { SaleStatus, ProductStatus } from "@/lib/mock-data";

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {description && <p className="mt-1 text-sm text-muted">{description}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}

export function Card({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`rounded-xl border border-border bg-surface ${className}`}>{children}</div>
  );
}

export function CardHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4 px-5 pt-5">
      <div>
        <h2 className="text-sm font-medium">{title}</h2>
        {description && <p className="mt-0.5 text-xs text-subtle">{description}</p>}
      </div>
      {action}
    </div>
  );
}

export function buttonStyles(variant: "primary" | "secondary" = "primary") {
  const styles =
    variant === "primary"
      ? "bg-brand text-white hover:bg-violet-500 shadow-lg shadow-violet-500/20"
      : "border border-border text-foreground hover:bg-overlay/5";
  return `inline-flex h-9 items-center gap-2 rounded-lg px-3.5 text-sm font-medium transition ${styles}`;
}

export function Button({
  children,
  variant = "primary",
  className = "",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "secondary" }) {
  return (
    <button
      className={`${buttonStyles(variant)} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export function StatCard({
  label,
  value,
  delta,
  hint,
  icon: Icon,
  footer,
  spark,
  numeric,
  format,
}: {
  label: string;
  value: string;
  delta?: number;
  hint?: string;
  // Ícono que va arriba a la derecha de la card.
  icon?: LucideIcon;
  // Línea de abajo cuando la card no muestra variación.
  footer?: React.ReactNode;
  // Valores diarios para el mini gráfico de tendencia (opcional).
  spark?: number[];
  // Si se pasa, el número sube animado hasta este valor (con `format` para mostrarlo).
  numeric?: number;
  format?: (n: number) => string;
}) {
  const up = (delta ?? 0) >= 0;
  return (
    <Card className="group relative overflow-hidden p-5">
      {/* Patrón de Nexo: puntitos violetas que salen de la esquina del ícono y se desvanecen,
          con un brillo suave detrás. Decorativo: no se lee ni se toca. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle,rgba(139,92,246,0.35)_1px,transparent_1.6px)] bg-[length:14px_14px] opacity-60 transition-opacity duration-300 [mask-image:radial-gradient(ellipse_80%_90%_at_100%_0%,black,transparent_70%)] group-hover:opacity-100"
      />
      <div aria-hidden className="pointer-events-none absolute -right-8 -top-10 size-32 rounded-full bg-violet-500/10 blur-2xl" />
      <div className="relative flex items-start justify-between gap-3">
        <p className="text-sm text-muted">{label}</p>
        {Icon && (
          <span className="-mr-1 -mt-1.5 grid size-9 shrink-0 place-items-center rounded-lg bg-brand-soft text-violet-300 ring-1 ring-inset ring-violet-500/20">
            <Icon className="size-[18px]" />
          </span>
        )}
      </div>
      {/* El número y el mini gráfico van debajo del ícono, sin chocar con él. */}
      <div className="relative mt-2 flex items-end justify-between gap-3">
        <p className="text-2xl font-semibold tracking-tight tabular-nums">
          {numeric !== undefined && format ? <CountUp value={numeric} format={format} /> : value}
        </p>
        {/* Si la card lleva mini gráfico, su lugar queda reservado aunque el período tenga un solo día. */}
        {spark &&
          (spark.length > 1 ? (
            <Sparkline data={spark} className="mb-1 h-8 w-24 shrink-0" />
          ) : (
            <span aria-hidden className="mb-1 h-8 w-24 shrink-0" />
          ))}
      </div>
      {delta !== undefined && (
        <p className="relative mt-2 flex items-center gap-1 text-xs text-muted">
          <span
            className={`inline-flex items-center gap-0.5 font-medium ${
              up ? "text-emerald-400" : "text-rose-400"
            }`}
          >
            {up ? <ArrowUpRight className="size-3.5" /> : <ArrowDownRight className="size-3.5" />}
            {up ? "+" : "−"}
            {Math.abs(delta).toFixed(1)}%
          </span>
          {hint ?? "vs. 30 días anteriores"}
        </p>
      )}
      {/* La línea de abajo siempre está, para que la card no cambie de alto al cambiar el período. */}
      {delta === undefined && (
        <p className="relative mt-2 text-xs text-muted">{footer ?? <span className="text-subtle">Sin período anterior para comparar</span>}</p>
      )}
    </Card>
  );
}

const saleStatus: Record<SaleStatus, { label: string; className: string }> = {
  aprobada: { label: "Aprobada", className: "bg-emerald-500/10 text-emerald-400 ring-emerald-500/20" },
  pendiente: { label: "Pendiente", className: "bg-amber-500/10 text-amber-400 ring-amber-500/20" },
  rechazada: { label: "Rechazada", className: "bg-rose-500/10 text-rose-400 ring-rose-500/20" },
  reembolsada: { label: "Reembolsada", className: "bg-zinc-500/10 text-zinc-300 ring-zinc-500/20" },
};

const productStatus: Record<ProductStatus, { label: string; className: string }> = {
  activo: { label: "Activo", className: "bg-emerald-500/10 text-emerald-400 ring-emerald-500/20" },
  borrador: { label: "Borrador", className: "bg-zinc-500/10 text-zinc-300 ring-zinc-500/20" },
  pausado: { label: "Pausado", className: "bg-amber-500/10 text-amber-400 ring-amber-500/20" },
};

export function StatusBadge({ status }: { status: SaleStatus | ProductStatus }) {
  const s =
    status in saleStatus
      ? saleStatus[status as SaleStatus]
      : productStatus[status as ProductStatus];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${s.className}`}
    >
      <span className="size-1.5 rounded-full bg-current" />
      {s.label}
    </span>
  );
}

// Imagen del producto. Es la ÚNICA que se usa en toda la app (Resumen, Productos, Ventas, menús):
// cuando haya fotos, se cambia acá y se ve en todos lados. Hoy no hay forma de cargarlas, así que
// sin `src` muestra el lugar vacío. Tamaños: xs (filtros), sm (menús), md (listas), lg (destacados).
const THUMB_SIZES = {
  xs: { box: "size-4 rounded", icon: "" },
  sm: { box: "size-7 rounded-md", icon: "size-3" },
  md: { box: "size-9 rounded-lg", icon: "size-3.5" },
  lg: { box: "size-14 rounded-xl", icon: "size-5" },
};

export function ProductThumb({ name, src, size = "md" }: { name: string; src?: string; size?: keyof typeof THUMB_SIZES }) {
  const s = THUMB_SIZES[size];
  if (src) {
    // eslint-disable-next-line @next/next/no-img-element -- todavía no sabemos de dónde van a salir las fotos
    return <img src={src} alt={name} className={`${s.box} shrink-0 object-cover`} />;
  }
  return (
    <span
      role="img"
      aria-label={`Imagen de ${name}`}
      className={`grid shrink-0 place-items-center border border-dashed border-border bg-overlay/[0.03] ${s.box}`}
    >
      {s.icon && <ImageIcon aria-hidden className={`${s.icon} text-subtle/60`} />}
    </span>
  );
}

// Barra de progreso de la app: degradé violeta, brillo arriba, punto luminoso en la punta
// y una animación que la hace crecer al aparecer. `emphasis` le suma un resplandor (para el primer puesto).
export function MeterBar({
  value,
  emphasis = false,
  size = "md",
  className = "",
}: {
  value: number; // de 0 a 1
  emphasis?: boolean;
  size?: "sm" | "md";
  className?: string;
}) {
  const pct = Math.max(0, Math.min(1, value)) * 100;
  return (
    <div
      className={`relative w-full rounded-full bg-surface-2 ring-1 ring-inset ring-overlay/[0.04] ${size === "sm" ? "h-1.5" : "h-2.5"} ${className}`}
      role="meter"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(pct)}
    >
      <div
        className={`relative h-full origin-left rounded-full bg-gradient-to-r from-violet-700 via-violet-500 to-violet-400 transition-transform duration-700 ease-out starting:scale-x-0 ${
          emphasis ? "shadow-[0_0_14px_rgba(139,92,246,0.55)]" : ""
        }`}
        style={{ width: `${pct}%` }}
      >
        <span className="absolute inset-x-1 top-0 h-1/2 rounded-full bg-white/20" />
        {pct >= 4 && (
          <span
            className={`absolute right-0.5 top-1/2 -translate-y-1/2 rounded-full bg-violet-100 shadow-[0_0_6px_rgba(221,214,254,0.9)] ${
              size === "sm" ? "size-1" : "size-1.5"
            }`}
          />
        )}
      </div>
    </div>
  );
}

// Mini gráfico de tendencia: línea con degradé violeta, área suave y punto luminoso en el último valor.
export function Sparkline({ data, className = "" }: { data: number[]; className?: string }) {
  const id = useId().replace(/:/g, "");
  const W = 96;
  const H = 32;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const span = max - min || 1;
  const pts = data.map((v, i) => [(i / (data.length - 1)) * (W - 4) + 2, H - 3 - ((v - min) / span) * (H - 8)] as const);
  const line = pts.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const area = `${line} L${pts.at(-1)![0]},${H} L${pts[0][0]},${H} Z`;
  const [lx, ly] = pts.at(-1)!;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className={className} aria-hidden preserveAspectRatio="none">
      <defs>
        <linearGradient id={`sl-${id}`} x1="0" x2="1">
          <stop offset="0%" stopColor="#6d28d9" />
          <stop offset="100%" stopColor="#a78bfa" />
        </linearGradient>
        <linearGradient id={`sa-${id}`} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.28" />
          <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#sa-${id})`} />
      <path
        d={line}
        fill="none"
        stroke={`url(#sl-${id})`}
        strokeWidth={1.75}
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
      <circle cx={lx} cy={ly} r={4} fill="#8b5cf6" opacity={0.25} />
      <circle cx={lx} cy={ly} r={2} fill="#ede9fe" />
    </svg>
  );
}

// Número que sube animado hasta `value` (en ~0,7 s). Si el valor cambia, anima desde el anterior.
// Respeta "reducir movimiento" del sistema.
export function CountUp({ value, format }: { value: number; format: (n: number) => string }) {
  const [shown, setShown] = useState(0);
  const from = useRef(0);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const start = from.current;
    if (reduce || start === value) {
      from.current = value;
      const raf = requestAnimationFrame(() => setShown(value));
      return () => cancelAnimationFrame(raf);
    }
    const t0 = performance.now();
    const duration = 700;
    let raf = 0;
    const tick = (t: number) => {
      const p = Math.min(1, (t - t0) / duration);
      const eased = 1 - (1 - p) ** 3;
      setShown(start + (value - start) * eased);
      if (p < 1) raf = requestAnimationFrame(tick);
      else from.current = value;
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      from.current = value;
    };
  }, [value]);

  return <>{format(shown)}</>;
}
