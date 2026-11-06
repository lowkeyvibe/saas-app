import { ArrowDownRight, ArrowUpRight, type LucideIcon } from "lucide-react";
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
}: {
  label: string;
  value: string;
  delta?: number;
  hint?: string;
  // Ícono que va arriba a la derecha de la card.
  icon?: LucideIcon;
  // Línea de abajo cuando la card no muestra variación.
  footer?: React.ReactNode;
}) {
  const up = (delta ?? 0) >= 0;
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm text-muted">{label}</p>
        {Icon && (
          <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-brand-soft text-violet-300 ring-1 ring-inset ring-violet-500/20">
            <Icon className="size-[18px]" />
          </span>
        )}
      </div>
      <p className={`${Icon ? "-mt-2" : "mt-2"} text-2xl font-semibold tracking-tight tabular-nums`}>{value}</p>
      {delta !== undefined && (
        <p className="mt-2 flex items-center gap-1 text-xs text-muted">
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
      {delta === undefined && footer && <p className="mt-2 text-xs text-muted">{footer}</p>}
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

export function ProductThumb({ color, name }: { color: string; name: string }) {
  return (
    <span
      className={`grid size-9 shrink-0 place-items-center rounded-lg bg-gradient-to-br ${color} text-xs font-bold text-white/90`}
    >
      {name[0]}
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
