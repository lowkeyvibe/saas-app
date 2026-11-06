"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Archive,
  ArrowRight,
  Bell,
  CornerDownLeft,
  Download,
  Globe,
  LayoutDashboard,
  Moon,
  Palette,
  Plug,
  Receipt,
  Search,
  Settings2,
  ShoppingCart,
  Store,
  Sun,
  UserRound,
  Wallet,
  Webhook,
  type LucideIcon,
} from "lucide-react";
import { OrderDrawer } from "@/components/dashboard/order-drawer";
import { COUNTRY_FLAGS, productById, sales, TODAY, type Sale } from "@/lib/mock-data";
import { configurableStores } from "@/lib/mock-settings";
import { formatMoney, formatRelativeDateTime } from "@/lib/format";
import { setThemePref } from "@/lib/theme";

type Item = {
  id: string;
  group: string;
  label: string;
  hint?: string;
  keywords?: string;
  icon?: LucideIcon;
  leading?: React.ReactNode;
  // Solo aparece al escribir algo (para no llenar la lista inicial).
  searchOnly?: boolean;
  run: () => void;
};

// Saca tildes y pasa a minúsculas, para buscar "configuracion" o "pais" sin acentos.
const norm = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

// Buscador rápido de toda la app. Se abre con ⌘K / Ctrl+K o tocando el buscador del encabezado.
export function CommandPalette({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [highlight, setHighlight] = useState(0);
  const [sale, setSale] = useState<Sale | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const close = useCallback(() => {
    onOpenChange(false);
    setQuery("");
    setHighlight(0);
  }, [onOpenChange]);

  // ⌘K / Ctrl+K abre y cierra desde cualquier pantalla.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        if (open) close();
        else onOpenChange(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, close, onOpenChange]);

  useEffect(() => {
    if (!open) return;
    requestAnimationFrame(() => inputRef.current?.focus());
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = overflow;
    };
  }, [open]);

  const go = useCallback(
    (href: string) => () => {
      close();
      router.push(href);
    },
    [close, router],
  );

  // Lo que siempre se puede buscar: secciones, tiendas y acciones.
  const base = useMemo<Item[]>(() => {
    const pages: Item[] = [
      { id: "p-resumen", group: "Secciones", label: "Resumen", icon: LayoutDashboard, run: go("/dashboard"), keywords: "inicio dashboard" },
      { id: "p-wallet", group: "Secciones", label: "Wallet", hint: "Saldo, acreditaciones y retiros", icon: Wallet, run: go("/dashboard/wallet"), keywords: "saldo dinero plata retirar billetera" },
      { id: "p-ventas", group: "Secciones", label: "Ventas", hint: "Historial de ventas aprobadas", icon: Receipt, run: go("/dashboard/ventas"), keywords: "historial ordenes pedidos" },
      { id: "p-inactivas", group: "Secciones", label: "Tiendas inactivas", icon: Archive, run: go("/dashboard/tiendas-inactivas"), keywords: "archivadas pausadas" },
      { id: "p-cuenta", group: "Configuración", label: "Mi cuenta", icon: UserRound, run: go("/dashboard/configuracion#cuenta"), keywords: "perfil contraseña plan" },
      { id: "p-notif", group: "Configuración", label: "Notificaciones", icon: Bell, run: go("/dashboard/configuracion#notificaciones"), keywords: "avisos email push" },
      { id: "p-apariencia", group: "Configuración", label: "Apariencia", icon: Palette, run: go("/dashboard/configuracion#apariencia"), keywords: "tema claro oscuro" },
      { id: "p-webhooks", group: "Configuración", label: "Webhooks", icon: Webhook, run: go("/dashboard/configuracion#webhooks"), keywords: "endpoint integracion api" },
    ];
    const stores: Item[] = configurableStores.flatMap((s) => [
      {
        id: `s-${s.id}`,
        group: "Tiendas",
        label: s.name,
        hint: s.status === "activa" ? "Configurar" : s.status === "pausada" ? "Pausada · configurar" : "Sin plan · configurar",
        leading: (
          <span className={`grid size-6 place-items-center rounded-md bg-gradient-to-br ${s.color} text-[10px] font-bold text-white/90`}>
            {s.name[0]}
          </span>
        ),
        run: go(`/dashboard/tiendas/${s.id}`),
        keywords: `${s.subdomain} tienda configuracion`,
      },
      ...(
        [
          ["pagos", "Pagos", Wallet],
          ["integraciones", "Integraciones", Plug],
          ["dominio", "Dominio", Globe],
          ["checkout", "Checkout", ShoppingCart],
        ] as const
      ).map(([section, label, icon]) => ({
        id: `s-${s.id}-${section}`,
        group: "Tiendas",
        label: `${s.name} › ${label}`,
        icon,
        run: go(`/dashboard/tiendas/${s.id}#${section}`),
        keywords: `${s.subdomain} ${section}`,
        searchOnly: true,
      })),
    ]);
    const actions: Item[] = [
      { id: "a-claro", group: "Acciones", label: "Pasar al modo claro", icon: Sun, run: () => (setThemePref("claro"), close()), keywords: "tema luz blanco" },
      { id: "a-oscuro", group: "Acciones", label: "Pasar al modo oscuro", icon: Moon, run: () => (setThemePref("oscuro"), close()), keywords: "tema negro" },
      { id: "a-retirar", group: "Acciones", label: "Retirar dinero", icon: Wallet, run: go("/dashboard/wallet"), keywords: "retiro cobrar" },
      { id: "a-exportar", group: "Acciones", label: "Exportar ventas a CSV", icon: Download, run: go("/dashboard/ventas"), keywords: "excel descargar" },
      { id: "a-config", group: "Acciones", label: "Configurar una tienda", icon: Settings2, run: go("/dashboard/tiendas"), keywords: "ajustes" },
    ];
    return [...pages, ...stores, ...actions];
  }, [go, close]);

  const items = useMemo<Item[]>(() => {
    const q = norm(query.trim());
    if (!q) return base.filter((i) => !i.searchOnly).slice(0, 14);

    const match = (i: Item) => norm(`${i.label} ${i.hint ?? ""} ${i.keywords ?? ""}`).includes(q);
    const found = base.filter(match);

    // Ventas: por número de pedido, cliente o email.
    const saleItems: Item[] = sales
      .filter((s) => norm(`${s.id} ${s.customer} ${s.email}`).includes(q))
      .slice(0, 5)
      .map((s) => ({
        id: `v-${s.id}`,
        group: "Ventas",
        label: `${s.id} · ${s.customer}`,
        hint: `${productById(s.productId)?.name} · ${formatMoney(s.amount)} · ${formatRelativeDateTime(s.date, TODAY)}`,
        icon: Receipt,
        run: () => {
          close();
          setSale(s);
        },
      }));

    // Clientes: abre su última compra.
    const byCustomer = new Map<string, Sale[]>();
    for (const s of sales) if (norm(s.customer).includes(q)) byCustomer.set(s.email, [...(byCustomer.get(s.email) ?? []), s]);
    const customerItems: Item[] = [...byCustomer.values()].slice(0, 4).map((list) => ({
      id: `c-${list[0].email}`,
      group: "Clientes",
      label: list[0].customer,
      hint: `${COUNTRY_FLAGS[list[0].country] ?? ""} ${list[0].country} · ${list.length} ${list.length === 1 ? "compra" : "compras"} · ver la última`,
      icon: UserRound,
      run: () => {
        close();
        setSale(list[0]);
      },
    }));

    return [...found, ...saleItems, ...customerItems];
  }, [query, base, close]);

  const safeHighlight = Math.min(highlight, Math.max(0, items.length - 1));

  // Mantiene visible el ítem resaltado al moverse con las flechas.
  useEffect(() => {
    listRef.current?.querySelector(`[data-index="${safeHighlight}"]`)?.scrollIntoView({ block: "nearest" });
  }, [safeHighlight]);

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") close();
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlight((h) => Math.min(items.length - 1, h + 1));
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlight((h) => Math.max(0, h - 1));
    }
    if (e.key === "Enter" && items[safeHighlight]) {
      e.preventDefault();
      items[safeHighlight].run();
    }
  };

  // Agrupado manteniendo el orden.
  const groups: { name: string; items: (Item & { index: number })[] }[] = [];
  items.forEach((item, index) => {
    const g = groups.find((x) => x.name === item.group) ?? groups[groups.push({ name: item.group, items: [] }) - 1];
    g.items.push({ ...item, index });
  });

  return (
    <>
      {open && (
        <div className="fixed inset-0 z-[60] flex items-start justify-center px-4 pt-[12vh]" role="dialog" aria-modal="true" aria-label="Buscar">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-150 starting:opacity-0" onClick={close} />
          <div
            onKeyDown={onKeyDown}
            className="relative w-full max-w-xl overflow-hidden rounded-2xl border border-border bg-surface shadow-2xl shadow-black/60 ring-1 ring-violet-500/10 transition duration-200 ease-out starting:translate-y-2 starting:scale-[0.98] starting:opacity-0"
          >
            <div className="pointer-events-none absolute -top-24 left-1/2 h-40 w-80 -translate-x-1/2 rounded-full bg-violet-500/20 blur-3xl" />
            <div className="relative flex items-center gap-3 border-b border-border px-4">
              <Search className="size-5 shrink-0 text-violet-300" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setHighlight(0);
                }}
                placeholder="Buscá ventas, clientes, tiendas o secciones…"
                className="h-14 flex-1 bg-transparent text-base placeholder:text-subtle focus:outline-none"
                role="combobox"
                aria-expanded="true"
                aria-controls="palette-list"
                aria-activedescendant={items[safeHighlight] ? `palette-${items[safeHighlight].id}` : undefined}
              />
              <kbd className="rounded-md border border-border bg-surface-2 px-1.5 py-0.5 text-[10px] font-medium text-subtle">ESC</kbd>
            </div>

            <ul ref={listRef} id="palette-list" role="listbox" className="relative max-h-[52vh] overflow-y-auto p-2">
              {groups.map((g) => (
                <li key={g.name} role="presentation">
                  <p className="px-2.5 pb-1 pt-2.5 text-[11px] font-medium uppercase tracking-wider text-subtle">{g.name}</p>
                  <ul role="presentation">
                    {g.items.map((item) => {
                      const active = item.index === safeHighlight;
                      return (
                        <li
                          key={item.id}
                          id={`palette-${item.id}`}
                          role="option"
                          aria-selected={active}
                          data-index={item.index}
                          onMouseMove={() => setHighlight(item.index)}
                          onClick={item.run}
                          className={`flex cursor-pointer items-center gap-3 rounded-lg px-2.5 py-2 text-sm transition ${
                            active ? "bg-violet-500/15 text-foreground" : "text-muted"
                          }`}
                        >
                          {item.leading ??
                            (item.icon && (
                              <span
                                className={`grid size-6 place-items-center rounded-md ${
                                  active ? "bg-brand text-white" : "bg-surface-2 text-subtle"
                                }`}
                              >
                                <item.icon className="size-3.5" />
                              </span>
                            ))}
                          <span className="min-w-0 flex-1">
                            <span className="block truncate">{item.label}</span>
                            {item.hint && <span className="block truncate text-xs text-subtle">{item.hint}</span>}
                          </span>
                          {active && <ArrowRight className="size-4 shrink-0 text-violet-300" />}
                        </li>
                      );
                    })}
                  </ul>
                </li>
              ))}
              {items.length === 0 && (
                <li className="px-4 py-10 text-center text-sm text-subtle">
                  No encontramos nada con <span className="text-foreground">“{query}”</span>.
                </li>
              )}
            </ul>

            <div className="relative flex items-center gap-4 border-t border-border px-4 py-2.5 text-[11px] text-subtle">
              <span className="flex items-center gap-1.5">
                <kbd className="rounded border border-border bg-surface-2 px-1">↑</kbd>
                <kbd className="rounded border border-border bg-surface-2 px-1">↓</kbd> moverse
              </span>
              <span className="flex items-center gap-1.5">
                <kbd className="grid place-items-center rounded border border-border bg-surface-2 px-1 py-0.5">
                  <CornerDownLeft className="size-2.5" />
                </kbd>
                abrir
              </span>
              <span className="ml-auto flex items-center gap-1.5">
                <Store className="size-3" /> Busca en todas tus tiendas
              </span>
            </div>
          </div>
        </div>
      )}
      {sale && <OrderDrawer sale={sale} onClose={() => setSale(null)} />}
    </>
  );
}
