"use client";

import { useCallback, useRef, useState } from "react";
import Link from "next/link";
import { ChevronDown, ExternalLink, Settings2, Store } from "lucide-react";
import { site } from "@/config/site";
import { configurableStores, getStoreSettings } from "@/lib/mock-settings";
import { useDismiss } from "./use-dismiss";

const address = (id: string) => {
  const s = getStoreSettings(id)!;
  return s.customDomain?.verified ? s.customDomain.domain : `${s.subdomain}.${site.name.toLowerCase()}.app`;
};

// "Mis tiendas" del encabezado: abrir cada tienda o ir a configurarla.
export function StoresMenu() {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const close = useCallback(() => setOpen(false), []);
  useDismiss(rootRef, open, close);

  return (
    <div ref={rootRef} className="relative hidden sm:block">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="true"
        aria-expanded={open}
        className={`flex h-9 items-center gap-2 rounded-lg border px-3 text-sm text-muted transition hover:border-violet-500/40 hover:bg-violet-500/10 hover:text-foreground ${
          open ? "border-violet-500/40 bg-violet-500/10 text-foreground" : "border-border"
        }`}
      >
        <Store className="size-4" />
        Mis tiendas
        <ChevronDown className={`size-3.5 transition ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-80 overflow-hidden rounded-xl border border-border bg-surface-2 shadow-2xl shadow-black/50">
          <ul className="max-h-80 overflow-y-auto p-1">
            {configurableStores.map((s) => (
              <li key={s.id} className="group flex items-center gap-3 rounded-lg px-2 py-2 transition hover:bg-violet-500/10">
                <span className={`grid size-8 shrink-0 place-items-center rounded-lg bg-gradient-to-br ${s.color} text-xs font-bold text-white/90`}>
                  {s.name[0]}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex min-w-0 items-center gap-1.5 text-sm font-medium">
                    <span className="truncate">{s.name}</span>
                    {s.status !== "activa" && (
                      <span className="shrink-0 whitespace-nowrap rounded-full bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-medium text-amber-400 ring-1 ring-inset ring-amber-500/20">
                        {s.status === "pausada" ? "Pausada" : "Sin plan"}
                      </span>
                    )}
                  </span>
                  <span className="block truncate text-xs text-subtle">{address(s.id)}</span>
                </span>
                <Link
                  href={`/dashboard/tiendas/${s.id}`}
                  onClick={close}
                  aria-label={`Configurar ${s.name}`}
                  title="Configurar"
                  className="grid size-8 shrink-0 place-items-center rounded-lg text-subtle transition hover:bg-overlay/5 hover:text-foreground"
                >
                  <Settings2 className="size-4" />
                </Link>
                <a
                  href={`https://${address(s.id)}`}
                  target="_blank"
                  rel="noreferrer"
                  onClick={close}
                  aria-label={`Abrir ${s.name}`}
                  title="Abrir la tienda"
                  className="grid size-8 shrink-0 place-items-center rounded-lg bg-brand text-white shadow-lg shadow-violet-500/20 transition hover:bg-violet-500"
                >
                  <ExternalLink className="size-3.5" />
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
