"use client";

import { useCallback, useRef, useState } from "react";
import Link from "next/link";
import { ChevronDown, Settings, UserRound } from "lucide-react";
import { initials } from "@/lib/format";
import { useDismiss } from "./use-dismiss";

const LINKS = [
  { label: "Mi cuenta", href: "/dashboard/configuracion#cuenta", icon: UserRound },
  { label: "Configuración", href: "/dashboard/configuracion", icon: Settings },
];

// Avatar con nombre y tienda; al tocarlo abre el menú de la cuenta.
export function UserMenu({ name, store }: { name: string; store: string }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const close = useCallback(() => setOpen(false), []);
  useDismiss(rootRef, open, close);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="true"
        aria-expanded={open}
        aria-label="Menú de la cuenta"
        className={`flex items-center gap-2.5 rounded-lg py-1 pl-1 pr-2 text-left transition hover:bg-violet-500/10 ${
          open ? "bg-violet-500/10" : ""
        }`}
      >
        <span className="grid size-8 place-items-center rounded-full bg-gradient-to-br from-zinc-600 to-zinc-800 text-xs font-semibold">
          {initials(name)}
        </span>
        <span className="hidden leading-tight xl:block">
          <span className="block text-sm font-medium">{name}</span>
          <span className="block text-xs text-subtle">{store}</span>
        </span>
        <ChevronDown className={`size-3.5 text-subtle transition ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-56 overflow-hidden rounded-xl border border-border bg-surface-2 shadow-2xl shadow-black/50">
          {/* En pantallas chicas el nombre no se ve en el botón, así que va arriba del menú. */}
          <div className="border-b border-border px-3 py-2.5 xl:hidden">
            <p className="truncate text-sm font-medium">{name}</p>
            <p className="truncate text-xs text-subtle">{store}</p>
          </div>
          <ul className="p-1">
            {LINKS.map((l) => (
              <li key={l.href}>
                <Link
                  href={l.href}
                  onClick={close}
                  className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm text-muted transition hover:bg-violet-500/10 hover:text-foreground"
                >
                  <l.icon className="size-4" />
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
