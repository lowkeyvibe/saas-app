"use client";

import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown, EyeOff } from "lucide-react";

// Clase que difumina el contenido de una columna oculta.
export const BLUR = "blur-[6px] select-none";

export type HideableColumn<K extends string> = { key: K; label: string };

// Botón "Ocultar datos": un menú con las columnas de una tabla para difuminar las que estén tildadas.
// Sirve para compartir pantalla sin mostrar datos de clientes, montos, etc.
export function HideColumnsMenu<K extends string>({
  columns,
  hidden,
  onChange,
}: {
  columns: readonly HideableColumn<K>[];
  hidden: ReadonlySet<K>;
  onChange: (next: Set<K>) => void;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  // Se cierra tocando afuera o con Escape.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const toggle = (key: K) => {
    const next = new Set(hidden);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    onChange(next);
  };
  const allHidden = hidden.size === columns.length;
  const active = hidden.size > 0;

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="true"
        aria-expanded={open}
        className={`flex h-8 items-center gap-2 rounded-lg border px-2.5 text-xs font-medium transition ${
          active
            ? "border-brand bg-brand text-white shadow-lg shadow-violet-500/20"
            : "border-border bg-background text-muted hover:border-zinc-600 hover:text-foreground"
        } ${open ? "ring-4 ring-violet-500/20" : ""}`}
      >
        <EyeOff className="size-3.5" />
        Ocultar datos
        {active && (
          <span className="grid h-4 min-w-4 place-items-center rounded-full bg-white/20 px-1 text-[10px] tabular-nums">
            {hidden.size}
          </span>
        )}
        <ChevronDown className={`size-3.5 transition ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute left-0 top-full z-50 mt-2 w-60 overflow-hidden rounded-xl border border-border bg-surface-2 shadow-2xl shadow-black/50">
          <div className="flex items-center justify-between gap-3 border-b border-border px-3 py-2.5">
            <p className="text-xs text-subtle">Tildá lo que no querés mostrar</p>
            <button
              type="button"
              onClick={() => onChange(allHidden ? new Set() : new Set(columns.map((c) => c.key)))}
              className="shrink-0 text-xs font-medium text-violet-300 hover:text-violet-200"
            >
              {allHidden ? "Mostrar todo" : "Ocultar todo"}
            </button>
          </div>
          <ul className="p-1">
            {columns.map((c) => {
              const checked = hidden.has(c.key);
              return (
                <li key={c.key}>
                  <button
                    type="button"
                    role="menuitemcheckbox"
                    aria-checked={checked}
                    onClick={() => toggle(c.key)}
                    className="flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-left text-sm transition hover:bg-violet-500/10"
                  >
                    <span
                      className={`grid size-4 shrink-0 place-items-center rounded border transition ${
                        checked ? "border-brand bg-brand text-white" : "border-zinc-600"
                      }`}
                    >
                      {checked && <Check className="size-3" strokeWidth={3} />}
                    </span>
                    <span className={checked ? "text-foreground" : "text-muted"}>{c.label}</span>
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

// ═══ Columnas de las tablas de ventas ═══════════════════════════════════════
// Las mismas en "Últimas ventas" (Resumen) e "Historial" (Ventas). Lo que se oculta en una
// se oculta en la otra, y se recuerda en este navegador.
export const SALE_COLUMNS = [
  { key: "cliente", label: "Cliente" },
  { key: "articulos", label: "Artículos" },
  { key: "tienda", label: "Tienda" },
  { key: "total", label: "Total" },
] as const;
export type SaleColumn = (typeof SALE_COLUMNS)[number]["key"];
const HIDDEN_SALE_COLS_KEY = "ultimas-ventas:columnas-ocultas";

export function useHiddenSaleColumns() {
  const [hidden, setHidden] = useState<Set<SaleColumn>>(new Set());
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(HIDDEN_SALE_COLS_KEY) ?? "[]") as SaleColumn[];
      const valid = saved.filter((k) => SALE_COLUMNS.some((c) => c.key === k));
      // eslint-disable-next-line react-hooks/set-state-in-effect -- se lee del navegador después de montar
      if (valid.length) setHidden(new Set(valid));
    } catch {
      // Si lo guardado está roto, se arranca sin columnas ocultas.
    }
  }, []);
  const update = (next: Set<SaleColumn>) => {
    setHidden(next);
    localStorage.setItem(HIDDEN_SALE_COLS_KEY, JSON.stringify([...next]));
  };
  return [hidden, update] as const;
}
