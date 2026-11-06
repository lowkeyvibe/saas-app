"use client";

import { useState } from "react";
import Link from "next/link";
import { ExternalLink, Menu, Settings, PanelLeftClose, PanelLeftOpen, Search, X } from "lucide-react";
import { SidebarContent, Logo } from "./sidebar";
import { ThemeToggle } from "./theme-toggle";
import { NotificationsMenu } from "./notifications-menu";
import { UserMenu } from "./user-menu";

const user = { name: "Lautaro Carbone", store: "lautaro.nexo.app" };

// Botones cuadrados del encabezado (notificaciones, tema y configuración).
const iconButton =
  "relative grid size-9 shrink-0 place-items-center rounded-lg border border-border bg-surface text-muted transition hover:border-violet-500/40 hover:bg-violet-500/10 hover:text-foreground";

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  // En escritorio la columna se puede esconder con el botón del borde.
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="min-h-screen">
      {/* Menú lateral fijo en escritorio. Al cerrarse queda una franja angosta con su borde. */}
      <aside
        className={`fixed inset-y-0 left-0 z-30 hidden overflow-hidden border-r border-border bg-surface transition-[width] duration-300 ease-out lg:block ${
          collapsed ? "w-5" : "w-64"
        }`}
      >
        <div
          inert={collapsed}
          className={`h-full w-64 transition-opacity duration-200 ${collapsed ? "opacity-0" : "opacity-100"}`}
        >
          <SidebarContent />
        </div>
      </aside>

      {/* Botón para esconder/mostrar la columna, siempre centrado sobre su borde */}
      <button
        onClick={() => setCollapsed((c) => !c)}
        aria-label={collapsed ? "Mostrar menú" : "Esconder menú"}
        title={collapsed ? "Mostrar menú" : "Esconder menú"}
        className={`fixed top-1/2 z-40 hidden size-9 -translate-y-1/2 cursor-pointer items-center justify-center rounded-lg border border-border bg-surface text-muted shadow-lg shadow-black/40 transition-all duration-300 ease-out hover:border-violet-500/60 hover:bg-brand hover:text-white lg:flex ${
          collapsed ? "left-0.5" : "left-[14.875rem]"
        }`}
      >
        {collapsed ? <PanelLeftOpen className="size-[18px]" /> : <PanelLeftClose className="size-[18px]" />}
      </button>

      {/* Menú desplegable en celular */}
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-72 border-r border-border bg-surface">
            <button
              onClick={() => setOpen(false)}
              className="absolute -right-11 top-4 rounded-md bg-surface p-1.5 text-muted ring-1 ring-border hover:text-foreground"
              aria-label="Cerrar menú"
            >
              <X className="size-5" />
            </button>
            <SidebarContent onNavigate={() => setOpen(false)} />
          </aside>
        </div>
      )}

      <div className={`transition-[padding] duration-300 ease-out ${collapsed ? "lg:pl-5" : "lg:pl-64"}`}>
        <header className="sticky top-0 z-40 flex h-16 items-center gap-3 border-b border-border bg-background/80 px-4 backdrop-blur-xl sm:px-6">
          <button
            onClick={() => setOpen(true)}
            className="rounded-md p-1.5 text-muted hover:bg-overlay/5 lg:hidden"
            aria-label="Abrir menú"
          >
            <Menu className="size-5" />
          </button>
          <div className={collapsed ? "pl-4" : "lg:hidden"}>
            <Logo />
          </div>

          {/* Buscador y, a su derecha, notificaciones y tema. */}
          <div className="flex items-center gap-2 md:max-w-md md:flex-1">
            <div className="relative hidden flex-1 md:block">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-subtle" />
              <input
                placeholder="Buscar productos, ventas, clientes…"
                className="h-9 w-full rounded-lg border border-border bg-surface pl-9 pr-3 text-sm placeholder:text-subtle focus:border-violet-500/60 focus:outline-none"
              />
            </div>
            <NotificationsMenu buttonClassName={iconButton} />
            <ThemeToggle className={iconButton} />
          </div>

          <div className="ml-auto flex items-center gap-2">
            <a
              href="#"
              className="hidden items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-sm text-muted transition hover:bg-overlay/5 hover:text-foreground sm:flex"
            >
              Ver mi tienda
              <ExternalLink className="size-3.5" />
            </a>
            <Link href="/dashboard/configuracion" className={iconButton} aria-label="Configuración" title="Configuración">
              <Settings className="size-4" />
            </Link>
            <UserMenu name={user.name} store={user.store} />
          </div>
        </header>

        <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">{children}</main>
      </div>
    </div>
  );
}
