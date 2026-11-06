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
} from "lucide-react";
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
        : pathname.startsWith(item.href);
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
          ? "bg-white/[0.06] font-medium text-foreground"
          : "text-muted hover:bg-white/[0.03] hover:text-foreground"
      }`}
    >
      <Icon className={`size-4 ${active ? "text-brand" : ""}`} />
      {item.label}
      {item.badge !== undefined && (
        <span className="ml-auto rounded-full bg-white/[0.06] px-1.5 py-0.5 text-[10px] font-medium tabular-nums text-muted">
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
          <span className="rounded-full bg-white/[0.06] px-1.5 py-0.5 text-[10px] normal-case tracking-normal text-muted">
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

      <div className="mt-auto rounded-xl border border-border bg-gradient-to-b from-violet-500/10 to-transparent p-4">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Sparkles className="size-4 text-brand" />
          Plan Gratis
        </div>
        <p className="mt-1 text-xs leading-relaxed text-muted">
          Pasate a Pro para usar dominio propio y bajar la comisión por venta.
        </p>
        <button className="mt-3 w-full rounded-lg bg-brand px-3 py-1.5 text-xs font-medium text-white transition hover:bg-violet-500">
          Mejorar plan
        </button>
      </div>
    </div>
  );
}
