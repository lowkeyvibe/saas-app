"use client";

import { createContext, useContext, useEffect, useId, useRef, useState } from "react";
import { Card } from "@/components/dashboard/ui";
import { Check, ChevronDown, ChevronRight, Copy, Eye, EyeOff, X, type LucideIcon } from "lucide-react";

// Avisa que algo cambió, para mostrar la barra de "Guardar cambios".
// Los campos de texto, selects y casillas avisan solos (el evento input sube hasta la pestaña);
// los interruptores (Toggle) avisan con esto.
export const DirtyContext = createContext<() => void>(() => {});
export const useMarkDirty = () => useContext(DirtyContext);

const inputBase =
  "h-10 w-full rounded-lg border border-border bg-background px-3 text-sm placeholder:text-subtle transition focus:border-violet-500/60 focus:outline-none focus:ring-4 focus:ring-violet-500/10 disabled:cursor-not-allowed disabled:opacity-60";

export function SettingsCard({
  icon: Icon,
  title,
  description,
  action,
  children,
  footer,
  className = "",
}: {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  children?: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
}) {
  return (
    <Card className={className}>
      <div className="flex items-start gap-4 p-5 sm:p-6">
        {Icon && (
          <span className="grid size-10 shrink-0 place-items-center rounded-xl border border-border bg-surface-2 text-muted">
            <Icon className="size-[18px]" />
          </span>
        )}
        <div className="min-w-0 flex-1">
          <h2 className="font-medium">{title}</h2>
          {description && <p className="mt-0.5 text-sm text-muted">{description}</p>}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
      {children && <div className="space-y-5 px-5 pb-6 sm:px-6">{children}</div>}
      {footer && <div className="flex justify-end gap-2 border-t border-border px-5 py-3 sm:px-6">{footer}</div>}
    </Card>
  );
}

// Sección: título afuera y renglones adentro de un solo recuadro, separados por líneas.
export function Section({
  title,
  description,
  action,
  children,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3">
      <div className="flex items-end justify-between gap-4">
        <div className="min-w-0">
          <h2 className="font-semibold">{title}</h2>
          {description && <p className="mt-0.5 text-sm text-muted">{description}</p>}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
      <div className="divide-y divide-border rounded-2xl border border-border bg-surface">{children}</div>
    </section>
  );
}

// Renglón de ajuste: qué es (izquierda) y el control (derecha). En celular, uno abajo del otro.
export function Row({
  label,
  description,
  htmlFor,
  children,
}: {
  label: string;
  description?: React.ReactNode;
  htmlFor?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid gap-3 px-5 py-4 sm:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] sm:gap-8">
      <div className="min-w-0">
        <label htmlFor={htmlFor} className="text-sm font-medium">
          {label}
        </label>
        {description && <p className="mt-0.5 text-xs leading-relaxed text-subtle">{description}</p>}
      </div>
      <div className="min-w-0 sm:self-center">{children}</div>
    </div>
  );
}

// Renglón a todo el ancho, para contenido libre dentro de una sección.
export function Block({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`px-5 py-4 ${className}`}>{children}</div>;
}

export function Field({
  label,
  hint,
  children,
  htmlFor,
}: {
  label: string;
  hint?: React.ReactNode;
  children: React.ReactNode;
  htmlFor?: string;
}) {
  return (
    <div>
      <label htmlFor={htmlFor} className="mb-2 block text-sm font-medium">
        {label}
      </label>
      {children}
      {hint && <p className="mt-1.5 text-xs leading-relaxed text-subtle">{hint}</p>}
    </div>
  );
}

export function TextInput({
  prefix,
  suffix,
  mono,
  className = "",
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { prefix?: string; suffix?: string; mono?: boolean }) {
  if (!prefix && !suffix) {
    return <input {...props} className={`${inputBase} ${mono ? "font-mono" : ""} ${className}`} />;
  }
  return (
    <div className="flex overflow-hidden rounded-lg border border-border bg-background transition focus-within:border-violet-500/60 focus-within:ring-4 focus-within:ring-violet-500/10">
      {prefix && <span className="flex items-center border-r border-border bg-surface-2 px-3 text-sm text-subtle">{prefix}</span>}
      <input
        {...props}
        className={`h-10 min-w-0 flex-1 bg-transparent px-3 text-sm placeholder:text-subtle focus:outline-none ${mono ? "font-mono" : ""} ${className}`}
      />
      {suffix && <span className="flex items-center border-l border-border bg-surface-2 px-3 text-sm text-subtle">{suffix}</span>}
    </div>
  );
}

export function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={`${inputBase} h-auto min-h-24 resize-y py-2.5 leading-relaxed`} />;
}

export function Select({
  options,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement> & { options: { value: string; label: string }[] }) {
  return (
    <div className="relative">
      <select {...props} className={`${inputBase} cursor-pointer appearance-none pr-9`}>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-subtle" />
    </div>
  );
}

// Interruptor on/off.
export function Toggle({
  checked,
  onChange,
  label,
  disabled,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
  disabled?: boolean;
}) {
  const markDirty = useMarkDirty();
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => {
        onChange(!checked);
        markDirty();
      }}
      className={`relative h-6 w-11 shrink-0 rounded-full transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-violet-500/30 disabled:cursor-not-allowed disabled:opacity-60 ${
        checked ? "bg-brand" : "bg-zinc-700"
      }`}
    >
      <span
        className={`absolute left-0.5 top-0.5 size-5 rounded-full bg-white shadow transition-transform ${checked ? "translate-x-5" : ""}`}
      />
    </button>
  );
}

// Renglón con título, descripción y un interruptor a la derecha.
export function ToggleRow({
  title,
  description,
  checked,
  onChange,
  disabled,
  extra,
}: {
  title: string;
  description?: React.ReactNode;
  checked: boolean;
  onChange: (next: boolean) => void;
  disabled?: boolean;
  extra?: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-4 rounded-xl border border-border bg-background/40 px-4 py-3">
      <div className="min-w-0 flex-1">
        <p className="flex flex-wrap items-center gap-2 text-sm font-medium">
          {title}
          {extra}
        </p>
        {description && <p className="mt-0.5 text-xs text-subtle">{description}</p>}
      </div>
      <Toggle checked={checked} onChange={onChange} label={title} disabled={disabled} />
    </div>
  );
}

// Renglón con interruptor para el diseño de Tiendas (va dentro de una Section).
export function SwitchRow({
  title,
  description,
  checked,
  onChange,
  disabled,
  extra,
}: {
  title: string;
  description?: React.ReactNode;
  checked: boolean;
  onChange: (next: boolean) => void;
  disabled?: boolean;
  extra?: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-4 px-5 py-4">
      <div className="min-w-0 flex-1">
        <p className="flex flex-wrap items-center gap-2 text-sm font-medium">
          {title}
          {extra}
        </p>
        {description && <p className="mt-0.5 text-xs leading-relaxed text-subtle">{description}</p>}
      </div>
      <Toggle checked={checked} onChange={onChange} label={title} disabled={disabled} />
    </div>
  );
}

// Casilla con texto.
export function Checkbox({
  label,
  description,
  defaultChecked,
  checked,
  onChange,
}: {
  label: React.ReactNode;
  description?: string;
  defaultChecked?: boolean;
  checked?: boolean;
  onChange?: (next: boolean) => void;
}) {
  const id = useId();
  return (
    <label htmlFor={id} className="flex cursor-pointer items-start gap-3">
      <input
        id={id}
        type="checkbox"
        defaultChecked={defaultChecked}
        checked={checked}
        onChange={onChange ? (e) => onChange(e.target.checked) : undefined}
        className="mt-0.5 size-4 shrink-0 cursor-pointer accent-violet-500"
      />
      <span>
        <span className="block text-sm">{label}</span>
        {description && <span className="mt-0.5 block text-xs text-subtle">{description}</span>}
      </span>
    </label>
  );
}

// Campo para claves y tokens: se ven ocultos y se muestran con el ojito.
export function SecretInput({
  defaultValue,
  placeholder,
  id,
}: {
  defaultValue?: string;
  placeholder?: string;
  id?: string;
}) {
  const [shown, setShown] = useState(false);
  return (
    <div className="relative">
      <input
        id={id}
        type={shown ? "text" : "password"}
        defaultValue={defaultValue}
        placeholder={placeholder}
        autoComplete="off"
        spellCheck={false}
        className={`${inputBase} pr-10 font-mono`}
      />
      <button
        type="button"
        onClick={() => setShown((s) => !s)}
        aria-label={shown ? "Ocultar" : "Mostrar"}
        className="absolute right-1.5 top-1/2 grid size-7 -translate-y-1/2 place-items-center rounded-md text-subtle transition hover:bg-overlay/5 hover:text-foreground"
      >
        {shown ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
      </button>
    </div>
  );
}

// Valor de solo lectura con botón para copiarlo. Con `secret`, se ve oculto hasta tocar el ojito.
export function CopyField({ value, secret = false }: { value: string; secret?: boolean }) {
  const [copied, setCopied] = useState(false);
  const [shown, setShown] = useState(!secret);
  const masked = `${value.slice(0, 6)}${"•".repeat(16)}${value.slice(-4)}`;
  return (
    <div className="flex items-center gap-1 rounded-lg border border-border bg-background py-1 pl-3 pr-1">
      <code className="min-w-0 flex-1 truncate font-mono text-xs text-muted">{shown ? value : masked}</code>
      {secret && (
        <button
          type="button"
          onClick={() => setShown((s) => !s)}
          aria-label={shown ? "Ocultar" : "Mostrar"}
          className="grid size-8 shrink-0 place-items-center rounded-md text-subtle transition hover:bg-overlay/5 hover:text-foreground"
        >
          {shown ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
        </button>
      )}
      <button
        type="button"
        onClick={() => {
          navigator.clipboard?.writeText(value);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        }}
        className="flex h-8 shrink-0 items-center gap-1.5 rounded-md bg-surface-2 px-2.5 text-xs font-medium text-muted transition hover:text-foreground"
      >
        {copied ? <Check className="size-3.5 text-emerald-400" /> : <Copy className="size-3.5" />}
        {copied ? "Copiado" : "Copiar"}
      </button>
    </div>
  );
}

// Recuadro de aviso. Violeta para información, ámbar para advertencias, rojo para peligro.
export function Notice({
  tone = "info",
  icon: Icon,
  children,
}: {
  tone?: "info" | "warning" | "danger";
  icon?: LucideIcon;
  children: React.ReactNode;
}) {
  const styles = {
    info: "border-violet-500/20 bg-brand-soft text-muted",
    warning: "border-amber-500/25 bg-amber-500/10 text-muted",
    danger: "border-rose-500/30 bg-rose-500/10 text-muted",
  }[tone];
  const iconColor = { info: "text-violet-300", warning: "text-amber-400", danger: "text-rose-400" }[tone];
  return (
    <div className={`flex gap-3 rounded-xl border p-4 text-sm leading-relaxed ${styles}`}>
      {Icon && <Icon className={`mt-0.5 size-4 shrink-0 ${iconColor}`} />}
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}

// Estado de una conexión: verde si está conectada, neutro si no, ámbar si está pendiente.
export function StatusPill({ tone, children }: { tone: "ok" | "off" | "pending"; children: React.ReactNode }) {
  const styles = {
    ok: "bg-emerald-500/10 text-emerald-400 ring-emerald-500/20",
    off: "bg-zinc-500/10 text-muted ring-zinc-500/20",
    pending: "bg-amber-500/10 text-amber-400 ring-amber-500/20",
  }[tone];
  return (
    <span className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${styles}`}>
      <span className="size-1.5 rounded-full bg-current" />
      {children}
    </span>
  );
}

export const secondaryButton =
  "inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-border px-3.5 text-sm font-medium transition hover:bg-overlay/5 disabled:pointer-events-none disabled:opacity-50";
export const primaryButton =
  "inline-flex h-9 items-center justify-center gap-2 rounded-lg bg-brand px-3.5 text-sm font-medium text-white shadow-lg shadow-violet-500/20 transition hover:bg-violet-500 disabled:pointer-events-none disabled:opacity-50";

// Mosaico de una integración (Meta, Brevo, Stripe…). Al tocarlo se abre su panel lateral.
export function IntegrationTile({
  name,
  description,
  status,
  statusLabel,
  onClick,
  soon = false,
}: {
  name: string;
  description: string;
  status: "ok" | "off" | "pending";
  statusLabel: string;
  onClick?: () => void;
  soon?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={soon}
      className={`group flex min-h-36 flex-col rounded-2xl border p-4 text-left transition ${
        soon
          ? "cursor-not-allowed border-dashed border-border opacity-60"
          : status === "ok"
            ? "border-emerald-500/25 bg-surface hover:border-violet-500/40 hover:bg-violet-500/5"
            : "border-border bg-surface hover:border-violet-500/40 hover:bg-violet-500/5"
      }`}
    >
      <div className="flex w-full items-start justify-between gap-2">
        <span className="grid size-10 place-items-center rounded-xl border border-border bg-surface-2 text-sm font-semibold text-muted">
          {name[0]}
        </span>
        {soon ? (
          <span className="rounded-full border border-border px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-subtle">
            Pronto
          </span>
        ) : (
          <StatusPill tone={status}>{statusLabel}</StatusPill>
        )}
      </div>
      <p className="mt-3 text-sm font-medium">{name}</p>
      <p className="mt-0.5 flex-1 text-xs leading-relaxed text-subtle">{description}</p>
      {!soon && (
        <span className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-muted transition group-hover:text-violet-300">
          {status === "ok" ? "Administrar" : "Configurar"} <ChevronRight className="size-3.5" />
        </span>
      )}
    </button>
  );
}

// Panel lateral para configurar una integración sin salir de la página.
// Lo que se escribe acá no activa la barra de "Guardar cambios": tiene su propio botón.
export function Sheet({
  open,
  onClose,
  title,
  description,
  children,
  footer,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  const closeRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
    };
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label={title} onInput={(e) => e.stopPropagation()}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-200 starting:opacity-0" onClick={onClose} />
      <aside className="absolute inset-y-0 right-0 flex w-full max-w-lg flex-col border-l border-border bg-surface shadow-2xl shadow-black/60 transition-transform duration-300 ease-out starting:translate-x-full">
        <header className="flex items-start gap-3 border-b border-border p-5">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl border border-border bg-surface-2 text-sm font-semibold text-muted">
            {title[0]}
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="font-semibold">{title}</h2>
            {description && <p className="mt-0.5 text-sm text-muted">{description}</p>}
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
        <div className="flex-1 space-y-5 overflow-y-auto p-5">{children}</div>
        {footer && <footer className="flex justify-end gap-2 border-t border-border p-4">{footer}</footer>}
      </aside>
    </div>
  );
}
