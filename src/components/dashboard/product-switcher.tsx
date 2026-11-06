"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, ChevronsUpDown, Plus, Search } from "lucide-react";
import { products, type Product } from "@/lib/mock-data";
import { ProductThumb } from "./ui";

const statusDot = {
  activo: "bg-emerald-400",
  pausado: "bg-amber-400",
  borrador: "bg-zinc-500",
};

const statusLabel = { activo: "Activo", pausado: "Pausado", borrador: "Borrador" };

function Thumb({ p, size = "sm" }: { p: Product; size?: "sm" | "md" }) {
  return <ProductThumb name={p.name} size={size} />;
}

// Botón que despliega la lista de productos para elegir cuál ver.
export function ProductSwitcher({
  selected,
  onNavigate,
}: {
  selected?: Product;
  onNavigate?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [highlight, setHighlight] = useState(0);
  const router = useRouter();
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const q = query.trim().toLowerCase();
  const filtered = products.filter((p) => p.name.toLowerCase().includes(q));

  // Cerrar al hacer clic afuera.
  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  function toggle() {
    if (open) {
      setOpen(false);
      return;
    }
    setQuery("");
    setHighlight(Math.max(0, products.findIndex((p) => p.id === selected?.id)));
    setOpen(true);
    requestAnimationFrame(() => inputRef.current?.focus());
  }

  function choose(p: Product) {
    setOpen(false);
    onNavigate?.();
    router.push(`/dashboard/productos/${p.id}`);
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Escape") setOpen(false);
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlight((h) => Math.min(filtered.length - 1, h + 1));
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlight((h) => Math.max(0, h - 1));
    }
    if (e.key === "Enter" && filtered[highlight]) choose(filtered[highlight]);
  }

  return (
    <div ref={rootRef} className="relative" onKeyDown={onKeyDown}>
      <button
        onClick={toggle}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={`flex w-full items-center gap-3 rounded-xl border bg-background p-2 text-left transition ${
          open ? "border-violet-500/60 ring-4 ring-violet-500/10" : "border-border hover:border-zinc-600"
        }`}
      >
        {selected ? (
          <>
            <Thumb p={selected} size="md" />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-medium">{selected.name}</span>
              <span className="flex items-center gap-1.5 text-xs text-subtle">
                <span className={`size-1.5 rounded-full ${statusDot[selected.status]}`} />
                {statusLabel[selected.status]}
              </span>
            </span>
          </>
        ) : (
          <>
            <span className="grid size-9 shrink-0 place-items-center rounded-md border border-dashed border-border text-subtle">
              ?
            </span>
            <span className="flex-1 text-sm text-muted">Elegí un producto</span>
          </>
        )}
        <ChevronsUpDown className="size-4 shrink-0 text-subtle" />
      </button>

      {open && (
        <div className="absolute inset-x-0 top-full z-50 mt-2 overflow-hidden rounded-xl border border-border bg-surface-2 shadow-2xl shadow-black/50">
          <div className="relative border-b border-border">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-subtle" />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setHighlight(0);
              }}
              placeholder="Buscar producto…"
              className="h-10 w-full bg-transparent pl-9 pr-3 text-sm placeholder:text-subtle focus:outline-none"
            />
          </div>

          <ul role="listbox" className="max-h-72 overflow-y-auto p-1">
            {filtered.map((p, i) => {
              const isSelected = p.id === selected?.id;
              return (
                <li key={p.id} role="option" aria-selected={isSelected}>
                  <button
                    onClick={() => choose(p)}
                    onMouseEnter={() => setHighlight(i)}
                    className={`flex w-full items-center gap-3 rounded-lg px-2 py-1.5 text-left text-sm ${
                      i === highlight ? "bg-overlay/[0.06] text-foreground" : "text-muted"
                    }`}
                  >
                    <Thumb p={p} />
                    <span className="min-w-0 flex-1 truncate">{p.name}</span>
                    {isSelected ? (
                      <Check className="size-4 shrink-0 text-brand" />
                    ) : (
                      <span className={`size-1.5 shrink-0 rounded-full ${statusDot[p.status]}`} />
                    )}
                  </button>
                </li>
              );
            })}
            {filtered.length === 0 && (
              <li className="px-3 py-6 text-center text-sm text-subtle">No hay productos con ese nombre.</li>
            )}
          </ul>

          <div className="border-t border-border p-1">
            <Link
              href="/dashboard/productos"
              onClick={() => {
                setOpen(false);
                onNavigate?.();
              }}
              className="flex items-center gap-2 rounded-lg px-2 py-2 text-sm text-muted hover:bg-overlay/[0.04] hover:text-foreground"
            >
              <Plus className="size-4" />
              Nuevo producto
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
