"use client";

import { useCallback, useId, useRef, useState } from "react";
import { Check, ChevronDown, type LucideIcon } from "lucide-react";
import { useDismiss } from "./use-dismiss";

export type DropdownOption = { value: string; label: string; icon?: LucideIcon; hint?: string };

// Menú desplegable de Nexo (reemplaza al <select> del navegador).
// La primera opción es la "por defecto": si hay otra elegida, el botón se marca en violeta.
// Se maneja con el teclado: flechas, Enter y Escape.
export function Dropdown({
  label,
  value,
  onChange,
  options,
  icon: Icon,
  align = "right",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: DropdownOption[];
  icon?: LucideIcon;
  align?: "left" | "right";
}) {
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const listId = useId();
  const close = useCallback(() => setOpen(false), []);
  useDismiss(rootRef, open, close);

  const selected = options.find((o) => o.value === value) ?? options[0];
  const active = value !== options[0].value;

  const choose = (v: string) => {
    onChange(v);
    setOpen(false);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (!open) {
      if (e.key === "ArrowDown" || e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        setHighlight(Math.max(0, options.findIndex((o) => o.value === value)));
        setOpen(true);
      }
      return;
    }
    if (e.key === "Escape") setOpen(false);
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlight((h) => Math.min(options.length - 1, h + 1));
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlight((h) => Math.max(0, h - 1));
    }
    if (e.key === "Enter") {
      e.preventDefault();
      choose(options[highlight].value);
    }
  };

  return (
    <div ref={rootRef} className="relative" onKeyDown={onKeyDown}>
      <button
        type="button"
        onClick={() => {
          setHighlight(Math.max(0, options.findIndex((o) => o.value === value)));
          setOpen((o) => !o);
        }}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-label={`${label}: ${selected.label}`}
        className={`flex h-9 items-center gap-2 rounded-lg border px-3 text-xs font-medium transition ${
          active
            ? "border-violet-500/50 bg-violet-500/10 text-foreground"
            : "border-border bg-surface text-muted hover:border-violet-500/40 hover:text-foreground"
        } ${open ? "ring-4 ring-violet-500/15" : ""}`}
      >
        {Icon && <Icon className={`size-3.5 ${active ? "text-violet-300" : ""}`} />}
        <span className="whitespace-nowrap">{selected.label}</span>
        <ChevronDown className={`size-3.5 text-subtle transition ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div
          className={`absolute top-full z-50 mt-2 min-w-52 overflow-hidden rounded-xl border border-border bg-surface-2 shadow-2xl shadow-black/50 transition duration-150 starting:-translate-y-1 starting:opacity-0 ${
            align === "right" ? "right-0" : "left-0"
          }`}
        >
          <p className="border-b border-border px-3 py-2 text-[11px] font-medium uppercase tracking-wider text-subtle">{label}</p>
          <ul id={listId} role="listbox" aria-label={label} className="max-h-72 overflow-y-auto p-1">
            {options.map((o, i) => {
              const isSelected = o.value === selected.value;
              return (
                <li key={o.value} role="option" aria-selected={isSelected}>
                  <button
                    type="button"
                    onClick={() => choose(o.value)}
                    onMouseEnter={() => setHighlight(i)}
                    className={`flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm transition ${
                      i === highlight ? "bg-violet-500/10 text-foreground" : "text-muted"
                    }`}
                  >
                    {o.icon && (
                      <span className={`grid size-6 shrink-0 place-items-center rounded-md ${isSelected ? "bg-brand text-white" : "bg-surface text-subtle"}`}>
                        <o.icon className="size-3.5" />
                      </span>
                    )}
                    <span className="min-w-0 flex-1">
                      <span className="block truncate">{o.label}</span>
                      {o.hint && <span className="block truncate text-xs text-subtle">{o.hint}</span>}
                    </span>
                    {isSelected && <Check className="size-4 shrink-0 text-violet-300" />}
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
