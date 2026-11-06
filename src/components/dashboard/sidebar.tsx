"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  LayoutGrid,
  Package,
  PanelsTopLeft,
  Settings,
  ShoppingCart,
  Sparkles,
  Ticket,
  ChevronRight,
  Wallet as WalletIcon,
} from "lucide-react";
import { accountSettings } from "@/lib/mock-settings";
import { balance, releases } from "@/lib/mock-wallet";
import { formatMoney } from "@/lib/format";
import { CountUp } from "./ui";
import { site } from "@/config/site";
import { products } from "@/lib/mock-data";
import { mainNav, secondaryNav, type NavItem } from "./nav";
import { ProductSwitcher } from "./product-switcher";

type SidebarMode = "general" | "productos";

function NavLink({ item, onNavigate }: { item: NavItem; onNavigate?: () => void }) {
  const pathname = usePathname();
  const active =
    item.href === "/dashboard"
      ? pathname === item.href
      : item.href === "/dashboard/productos"
        ? pathname === item.href
        : // Con "/" al final para que "Tiendas" no quede marcado en "Tiendas inactivas".
          pathname === item.href || pathname.startsWith(`${item.href}/`);
  const Icon = item.icon;

  if (item.soon) {
    return (
      <span className="flex cursor-not-allowed items-center gap-3 rounded-lg px-3 py-2 text-sm text-subtle">
        <Icon className="size-4" />
        {item.label}
        <span className="ml-auto rounded-full border border-border px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide">
          Pronto
        </span>
      </span>
    );
  }

  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
        active
          ? "bg-overlay/[0.06] font-medium text-foreground"
          : "text-muted hover:bg-overlay/[0.03] hover:text-foreground"
      }`}
    >
      <Icon className={`size-4 ${active ? "text-brand" : ""}`} />
      {item.label}
      {item.badge !== undefined && (
        <span className="ml-auto rounded-full bg-overlay/[0.06] px-1.5 py-0.5 text-[10px] font-medium tabular-nums text-muted">
          {item.badge}
        </span>
      )}
    </Link>
  );
}

export function Logo() {
  return (
    <Link href="/dashboard" className="flex items-center gap-2.5">
      <span className="grid size-8 place-items-center rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-500 text-sm font-bold text-white shadow-lg shadow-violet-500/20">
        {site.name[0]}
      </span>
      <span className="text-base font-semibold tracking-tight">{site.name}</span>
    </Link>
  );
}

// Switch para cambiar entre la vista general y la vista por producto.
function ModeSwitch({ mode, onChange }: { mode: SidebarMode; onChange: (m: SidebarMode) => void }) {
  const options = [
    { value: "general" as const, label: "Vista general", icon: LayoutGrid },
    { value: "productos" as const, label: "Vista por producto", icon: Package },
  ];
  return (
    <div role="tablist" aria-label="Vista del menú" className="relative flex rounded-lg border border-border bg-background p-0.5">
      <span
        aria-hidden
        className={`absolute inset-y-0.5 w-9 rounded-md bg-brand shadow-md shadow-violet-500/30 transition-transform duration-200 ${
          mode === "productos" ? "translate-x-9" : "translate-x-0"
        }`}
      />
      {options.map((o) => {
        const Icon = o.icon;
        const active = mode === o.value;
        return (
          <button
            key={o.value}
            role="tab"
            aria-selected={active}
            title={o.label}
            aria-label={o.label}
            onClick={() => onChange(o.value)}
            className={`relative z-10 grid h-8 w-9 cursor-pointer place-items-center rounded-md transition-colors ${
              active ? "text-white" : "text-subtle hover:text-foreground"
            }`}
          >
            <Icon className="size-4" />
          </button>
        );
      })}
    </div>
  );
}

function GeneralNav({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <>
      <nav className="flex flex-col gap-0.5">
        {mainNav.map((item) => (
          <NavLink key={item.href} item={item} onNavigate={onNavigate} />
        ))}
      </nav>

      {secondaryNav.length > 0 && (
        <div>
          <p className="mb-2 px-3 text-[11px] font-medium uppercase tracking-wider text-subtle">
            Tienda
          </p>
          <nav className="flex flex-col gap-0.5">
            {secondaryNav.map((item) => (
              <NavLink key={item.href} item={item} onNavigate={onNavigate} />
            ))}
          </nav>
        </div>
      )}
    </>
  );
}

function ProductsNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const selectedId = pathname.match(/^\/dashboard\/productos\/([^/]+)/)?.[1];
  const selected = products.find((p) => p.id === selectedId);

  // Secciones de cada producto. Por ahora solo existe el resumen.
  const productNav: NavItem[] = selected
    ? [
        { label: "Resumen", href: `/dashboard/productos/${selected.id}`, icon: LayoutDashboard },
        { label: "Página de venta", href: "#pagina", icon: PanelsTopLeft, soon: true },
        { label: "Checkout", href: "#checkout", icon: ShoppingCart, soon: true },
        { label: "Cupones", href: "#cupones", icon: Ticket, soon: true },
        { label: "Ajustes", href: "#ajustes", icon: Settings, soon: true },
      ]
    : [];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="mb-2 flex items-center justify-between px-1 text-[11px] font-medium uppercase tracking-wider text-subtle">
          Producto
          <span className="rounded-full bg-overlay/[0.06] px-1.5 py-0.5 text-[10px] normal-case tracking-normal text-muted">
            {products.length} en total
          </span>
        </p>
        <ProductSwitcher selected={selected} onNavigate={onNavigate} />
      </div>

      {selected ? (
        <nav className="flex flex-col gap-0.5">
          {productNav.map((item) => (
            <NavLink key={item.label} item={item} onNavigate={onNavigate} />
          ))}
        </nav>
      ) : (
        <p className="px-1 text-sm leading-relaxed text-subtle">
          Tocá el botón de arriba para elegir qué producto querés ver.
        </p>
      )}
    </div>
  );
}

export function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  // Si entrás directo al panel de un producto, el menú arranca en la vista por producto.
  const [mode, setMode] = useState<SidebarMode>(
    pathname.startsWith("/dashboard/productos/") ? "productos" : "general",
  );

  return (
    <div className="flex h-full flex-col gap-6 p-4">
      <div className="flex items-center justify-between gap-2 px-2 pt-1">
        <Logo />
        <ModeSwitch mode={mode} onChange={setMode} />
      </div>

      {mode === "general" ? (
        <GeneralNav onNavigate={onNavigate} />
      ) : (
        <ProductsNav onNavigate={onNavigate} />
      )}

      {/* Abajo: tu saldo y tu plan, siempre a mano. */}
      <div className="mt-auto space-y-3">
        <WalletWidget onNavigate={onNavigate} />
        <PlanCard onNavigate={onNavigate} />
      </div>
    </div>
  );
}

// Tarjeta de la Wallet en la columna (siempre violeta oscura, como una tarjeta bancaria, en los dos temas):
// saldo disponible, lo que entra mañana y en los próximos 7 días. Lleva a la Wallet.
function WalletWidget({ onNavigate }: { onNavigate?: () => void }) {
  const week = releases.slice(0, 7);
  const weekTotal = week.reduce((a, r) => a + r.amount, 0);

  return (
    <Link
      href="/dashboard/wallet"
      onClick={onNavigate}
      className="group relative block overflow-hidden rounded-2xl border border-violet-400/30 bg-[linear-gradient(135deg,#5b21b6_0%,#3b0764_48%,#1e1b4b_100%)] p-4 shadow-lg shadow-violet-950/30 transition hover:border-violet-400/50 hover:shadow-violet-900/40"
    >
      {/* Brillos de fondo */}
      <div className="pointer-events-none absolute -right-10 -top-12 size-32 rounded-full bg-violet-400/25 blur-2xl transition group-hover:bg-violet-400/35" />
      <div className="pointer-events-none absolute -bottom-16 -left-10 size-32 rounded-full bg-fuchsia-500/15 blur-2xl" />

      <div className="relative flex items-center justify-between">
        <p className="text-[11px] font-medium uppercase tracking-wider text-[#ddd6fe]/80">Saldo disponible</p>
        <span className="grid size-7 place-items-center rounded-lg bg-white/10 text-[#ede9fe] ring-1 ring-inset ring-white/15">
          <WalletIcon className="size-3.5" />
        </span>
      </div>
      <p className="relative mt-1.5 text-2xl font-semibold tracking-tight tabular-nums text-white">
        <CountUp value={balance.available} format={formatMoney} />
      </p>

      {/* Lo que entra: mañana y en los próximos 7 días */}
      <div className="relative mt-4 divide-y divide-white/10 rounded-xl bg-black/25 ring-1 ring-inset ring-white/10">
        <div className="flex items-center justify-between px-3 py-2 text-xs">
          <span className="flex items-center gap-1.5 text-[#ede9fe]/80">
            <span className="size-1.5 rounded-full bg-[#34d399] shadow-[0_0_6px_rgba(52,211,153,0.8)]" />
            Mañana
          </span>
          <span className="font-semibold tabular-nums text-[#6ee7b7]">+{formatMoney(week[0].amount)}</span>
        </div>
        <div className="flex items-center justify-between px-3 py-2 text-xs">
          <span className="text-[#ddd6fe]/70">Esta semana</span>
          <span className="flex items-center gap-1 font-medium tabular-nums text-[#ede9fe]">
            +{formatMoney(weekTotal)}
            <ChevronRight className="size-3.5 text-[#ddd6fe]/60 transition group-hover:translate-x-0.5" />
          </span>
        </div>
      </div>
    </Link>
  );
}

// Plan de la cuenta (el mismo que en Configuración → Mi cuenta).
function PlanCard({ onNavigate }: { onNavigate?: () => void }) {
  const renews = new Intl.DateTimeFormat("es-AR", { day: "numeric", month: "short", timeZone: "UTC" }).format(
    new Date(`${accountSettings.renewsOn}T00:00:00Z`),
  );
  return (
    <Link
      href="/dashboard/configuracion#cuenta"
      onClick={onNavigate}
      className="flex items-center gap-3 rounded-xl border border-border px-3 py-2.5 transition hover:border-violet-500/40 hover:bg-violet-500/5"
    >
      <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white shadow-lg shadow-violet-500/20">
        <Sparkles className="size-4" />
      </span>
      <span className="min-w-0 flex-1 leading-tight">
        <span className="block text-sm font-medium">Plan {accountSettings.plan}</span>
        <span className="block text-[11px] text-subtle">Se renueva el {renews}</span>
      </span>
      <ChevronRight className="size-4 text-subtle" />
    </Link>
  );
}
