"use client";

import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown, LayoutGrid } from "lucide-react";
import type { ProductEarnings } from "@/lib/analytics";
import { formatMoney } from "@/lib/format";
import { ProductThumb } from "./ui";

// Menú desplegable para ver la vista general de un producto (o de todos), con su ganancia en el período.
export function ProductFilter({
  options,
  value,
  total,
  onChange,
  includeInactive,
  onIncludeInactiveChange,
}: {
  options: ProductEarnings[];
  value: string | null;
  total: number;
  onChange: (productId: string | null) => void;
  // Opcional: sin `onIncludeInactiveChange` no se muestra el interruptor de tiendas inactivas.
  includeInactive?: boolean;
  onIncludeInactiveChange?: (include: boolean) => void;
}) {
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);

  // Primera opción = todos; después los productos y, si se cuentan, las tiendas inactivas.
  type Item = { id: string | null; label: string; revenue: number; color?: string; inactive?: boolean };
  const toItem = (o: ProductEarnings): Item => ({
    id: o.id,
    label: o.name,
    revenue: o.revenue,
    color: o.color,
    inactive: o.kind === "tienda-inactiva",
  });
  const items: Item[] = [
    { id: null, label: "Todos los productos", revenue: total },
    ...options.filter((o) => o.kind === "producto").map(toItem),
    ...options.filter((o) => o.kind === "tienda-inactiva").map(toItem),
  ];
  const current = items.find((i) => i.id === value) ?? items[0];

  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  function toggle() {
    setHighlight(Math.max(0, items.findIndex((i) => i.id === value)));
    setOpen((o) => !o);
  }

  function choose(id: string | null) {
    onChange(id);
    setOpen(false);
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (!open) return;
    if (e.key === "Escape") setOpen(false);
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlight((h) => Math.min(items.length - 1, h + 1));
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlight((h) => Math.max(0, h - 1));
    }
    if (e.key === "Enter") {
      e.preventDefault();
      choose(items[highlight].id);
    }
  }

  return (
    <div ref={rootRef} className="relative" onKeyDown={onKeyDown}>
      <button
        type="button"
        onClick={toggle}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={`flex h-9 max-w-72 items-center gap-2 rounded-lg border px-3 text-sm font-medium transition ${
          value
            ? "border-brand bg-brand text-white shadow-lg shadow-violet-500/20"
            : "border-border bg-background hover:border-zinc-600"
        } ${open ? "ring-4 ring-violet-500/20" : ""}`}
      >
        <Swatch color={current.color} name={current.label} inactive={current.inactive} />
        <span className="truncate">{current.label}</span>
        <ChevronDown
          className={`size-4 shrink-0 transition ${value ? "text-white/80" : "text-subtle"} ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="absolute left-0 top-full z-50 mt-2 w-80 max-w-[calc(100vw-2rem)] overflow-hidden rounded-xl border border-border bg-surface-2 shadow-2xl shadow-black/50">
          {onIncludeInactiveChange && (
          <div className="flex items-center justify-between gap-3 border-b border-border px-3 py-2.5">
            <span id="inactive-switch-label" className="text-sm">
              Contar tiendas inactivas
            </span>
            <button
              type="button"
              role="switch"
              aria-checked={includeInactive}
              aria-labelledby="inactive-switch-label"
              onClick={() => onIncludeInactiveChange(!includeInactive)}
              className={`relative h-5 w-9 shrink-0 rounded-full transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/50 ${
                includeInactive ? "bg-brand" : "bg-zinc-700"
              }`}
            >
              <span
                className={`absolute left-0.5 top-0.5 size-4 rounded-full bg-white shadow transition-transform ${
                  includeInactive ? "translate-x-4" : ""
                }`}
              />
            </button>
          </div>
          )}
          <ul role="listbox" className="max-h-80 overflow-y-auto p-1">
            {items.map((item, i) => {
              const selected = item.id === current.id;
              const firstInactive = item.inactive && !items[i - 1]?.inactive;
              return (
                <li key={item.id ?? "todos"} role="option" aria-selected={selected}>
                  {firstInactive && (
                    <p className="mt-1 border-t border-border px-2 pb-1 pt-2.5 text-[11px] font-medium uppercase tracking-wide text-subtle">
                      Tiendas inactivas
                    </p>
                  )}
                  <button
                    type="button"
                    onClick={() => choose(item.id)}
                    onMouseEnter={() => setHighlight(i)}
                    className={`flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-left text-sm ${
                      selected
                        ? "bg-brand text-white"
                        : i === highlight
                          ? "bg-overlay/[0.06] text-foreground"
                          : "text-muted"
                    } ${i === 0 ? "mb-1" : ""}`}
                  >
                    <Swatch color={item.color} name={item.label} inactive={item.inactive} />
                    <span className="min-w-0 flex-1 truncate">{item.label}</span>
                    <span className={`shrink-0 text-xs tabular-nums ${selected ? "text-white/80" : "text-subtle"}`}>
                      {formatMoney(item.revenue)}
                    </span>
                    <Check className={`size-4 shrink-0 ${selected ? "" : "invisible"}`} />
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}

// "Todos" lleva el ícono de grilla; cada producto, su imagen; las tiendas inactivas, su color.
function Swatch({ color, name, inactive }: { color?: string; name: string; inactive?: boolean }) {
  if (!color) return <LayoutGrid className="size-4 shrink-0 opacity-70" />;
  if (inactive) return <span className={`size-4 shrink-0 rounded bg-gradient-to-br ${color}`} />;
  return <ProductThumb name={name} size="xs" />;
}
