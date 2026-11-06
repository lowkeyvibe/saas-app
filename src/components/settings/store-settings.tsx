"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Archive,
  Check,
  ChevronsUpDown,
  CircleCheck,
  Copy,
  ExternalLink,
  Globe,
  Plug,
  Plus,
  Search,
  Settings2,
  ShoppingCart,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { site } from "@/config/site";
import { inactiveStores } from "@/lib/mock-data";
import { configurableStores, getStoreSettings, paymentProviders, type StoreSettings } from "@/lib/mock-settings";
import { useDismiss } from "@/components/dashboard/use-dismiss";
import { MeterBar } from "@/components/dashboard/ui";
import { DirtyContext, primaryButton, secondaryButton } from "./settings-ui";
import { StoreContext } from "./store-context";
import { GeneralTab } from "./tabs/general";
import { PagosTab } from "./tabs/pagos";
import { CheckoutTab } from "./tabs/checkout";
import { IntegracionesTab } from "./tabs/integraciones";
import { DominioTab } from "./tabs/dominio";

type Section = {
  id: string;
  label: string;
  description: string;
  icon: LucideIcon;
  group: "Tienda" | "Ventas" | "Marketing";
  Component: React.ComponentType;
  // Estado corto que se ve al lado del nombre en el menú.
  badge?: (s: StoreSettings) => { text: string; ok: boolean } | undefined;
};

// Cuántas integraciones de marketing tiene conectadas la tienda.
export function connectedIntegrations(s: StoreSettings) {
  return [s.pixels.length > 0, !!s.tiktokPixel, !!s.ga4, !!s.clarityId, !!s.brevoConnected].filter(Boolean).length;
}

const SECTIONS: Section[] = [
  {
    id: "general",
    label: "General",
    description: "Nombre, dirección, idioma y zona horaria de la tienda.",
    icon: Settings2,
    group: "Tienda",
    Component: GeneralTab,
  },
  {
    id: "dominio",
    label: "Dominio",
    description: "La dirección con la que entran tus compradores.",
    icon: Globe,
    group: "Tienda",
    Component: DominioTab,
    badge: (s) => (s.customDomain?.verified ? { text: "Propio", ok: true } : undefined),
  },
  {
    id: "pagos",
    label: "Pagos",
    description: "Dónde recibís el dinero y cómo pagan tus compradores.",
    icon: Wallet,
    group: "Ventas",
    Component: PagosTab,
    badge: () => {
      const n = paymentProviders.filter((p) => p.status === "conectado").length;
      return { text: `${n} activos`, ok: n > 0 };
    },
  },
  {
    id: "checkout",
    label: "Checkout",
    description: "Qué ve y qué datos completa el comprador al pagar.",
    icon: ShoppingCart,
    group: "Ventas",
    Component: CheckoutTab,
  },
  {
    id: "integraciones",
    label: "Integraciones",
    description: "Pixeles, analítica y email marketing conectados a esta tienda.",
    icon: Plug,
    group: "Marketing",
    Component: IntegracionesTab,
    badge: (s) => {
      const n = connectedIntegrations(s);
      return n ? { text: `${n} conectadas`, ok: true } : undefined;
    },
  },
];
const GROUPS = ["Tienda", "Ventas", "Marketing"] as const;

const publicAddress = (s: StoreSettings) =>
  s.customDomain?.verified ? s.customDomain.domain : `${s.subdomain}.${site.name.toLowerCase()}.app`;

// Lo básico para que una tienda venda bien, con la sección donde se resuelve cada cosa.
function checklist(s: StoreSettings) {
  return [
    { label: "Medio de cobro", done: paymentProviders.some((p) => p.status === "conectado"), section: "pagos" },
    { label: "Email de soporte", done: !!s.supportEmail, section: "general" },
    { label: "Pixel de Meta", done: s.pixels.length > 0, section: "integraciones" },
    { label: "Email marketing", done: !!s.brevoConnected, section: "integraciones" },
    { label: "Dominio propio", done: !!s.customDomain?.verified, section: "dominio" },
  ];
}

const sectionFromHash = () => {
  const id = window.location.hash.slice(1);
  return SECTIONS.some((s) => s.id === id) ? id : SECTIONS[0].id;
};

export function StoreSettingsView({ storeId }: { storeId: string }) {
  const store = getStoreSettings(storeId)!;
  const [sectionId, setSectionId] = useState(SECTIONS[0].id);
  const [dirty, setDirty] = useState(false);
  const [saved, setSaved] = useState(false);
  const [resetKey, setResetKey] = useState(0);
  const savedTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  // La sección sale del # de la dirección (#pagos, #integraciones…).
  useEffect(() => {
    const read = () => setSectionId(sectionFromHash());
    read();
    window.addEventListener("hashchange", read);
    return () => window.removeEventListener("hashchange", read);
  }, []);

  const markDirty = useCallback(() => {
    setDirty(true);
    setSaved(false);
  }, []);

  const goTo = (id: string) => {
    if (id === sectionId) return;
    if (dirty && !window.confirm("Tenés cambios sin guardar en esta sección. ¿Querés descartarlos?")) return;
    setDirty(false);
    setSectionId(id);
    history.replaceState(null, "", `#${id}`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const save = () => {
    // Todavía no hay base de datos: se simula el guardado.
    setDirty(false);
    setSaved(true);
    clearTimeout(savedTimer.current);
    savedTimer.current = setTimeout(() => setSaved(false), 2500);
  };

  const current = SECTIONS.find((s) => s.id === sectionId) ?? SECTIONS[0];

  return (
    <StoreContext.Provider value={store}>
      <DirtyContext.Provider value={markDirty}>
        <StoreHeader store={store} onGoTo={goTo} />

        <div className="mt-8 lg:grid lg:grid-cols-[230px_minmax(0,1fr)] lg:gap-10">
          {/* Menú de secciones: lateral en escritorio, desplegable en celular. */}
          <nav aria-label={`Configuración de ${store.name}`} className="hidden lg:block">
            <div className="sticky top-24 space-y-6">
              {GROUPS.map((g) => (
                <div key={g}>
                  <p className="mb-1.5 px-3 text-[11px] font-medium uppercase tracking-wider text-subtle">{g}</p>
                  <ul className="space-y-0.5">
                    {SECTIONS.filter((s) => s.group === g).map((s) => {
                      const active = s.id === current.id;
                      const badge = s.badge?.(store);
                      return (
                        <li key={s.id}>
                          <button
                            type="button"
                            onClick={() => goTo(s.id)}
                            aria-current={active ? "page" : undefined}
                            className={`relative flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm transition ${
                              active ? "bg-violet-500/10 font-medium text-foreground" : "text-muted hover:bg-violet-500/5 hover:text-foreground"
                            }`}
                          >
                            {active && <span className="absolute inset-y-1.5 left-0 w-0.5 rounded-full bg-brand" />}
                            <s.icon className={`size-4 shrink-0 ${active ? "text-violet-300" : ""}`} />
                            <span className="flex-1">{s.label}</span>
                            {badge && (
                              <span className={`text-[11px] tabular-nums ${badge.ok ? "text-emerald-400" : "text-subtle"}`}>
                                {badge.text}
                              </span>
                            )}
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}
            </div>
          </nav>

          <div className="mb-6 lg:hidden">
            <label htmlFor="section-select" className="sr-only">
              Sección
            </label>
            <select
              id="section-select"
              value={current.id}
              onChange={(e) => goTo(e.target.value)}
              className="h-11 w-full rounded-xl border border-border bg-surface px-3 text-sm font-medium focus:border-violet-500/60 focus:outline-none"
            >
              {GROUPS.map((g) => (
                <optgroup key={g} label={g}>
                  {SECTIONS.filter((s) => s.group === g).map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.label}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>

          <div className="min-w-0 max-w-3xl pb-28">
            <div className="mb-6">
              <h2 className="text-xl font-semibold tracking-tight">{current.label}</h2>
              <p className="mt-1 text-sm text-muted">{current.description}</p>
            </div>
            {/* Cualquier campo que se escriba o se elija adentro avisa que hay cambios. */}
            <div className="space-y-10" onInput={markDirty}>
              <current.Component key={`${current.id}-${resetKey}`} />
            </div>
          </div>
        </div>

        {(dirty || saved) && (
          <div className="pointer-events-none fixed inset-x-0 bottom-6 z-40 flex justify-center px-4">
            <div className="pointer-events-auto flex w-full max-w-xl items-center gap-3 rounded-xl border border-border bg-surface-2/95 p-2 pl-4 shadow-2xl shadow-black/50 backdrop-blur transition duration-200 starting:translate-y-4 starting:opacity-0">
              {dirty ? (
                <>
                  <span className="size-2 shrink-0 rounded-full bg-amber-400" />
                  <p className="min-w-0 flex-1 truncate text-sm">
                    Cambios sin guardar en <span className="font-medium">{store.name}</span>
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setDirty(false);
                      setResetKey((k) => k + 1);
                    }}
                    className={secondaryButton}
                  >
                    Descartar
                  </button>
                  <button type="button" onClick={save} className={primaryButton}>
                    Guardar
                  </button>
                </>
              ) : (
                <p className="flex h-9 flex-1 items-center gap-2 text-sm text-emerald-400">
                  <CircleCheck className="size-4" /> Cambios guardados
                </p>
              )}
            </div>
          </div>
        )}
      </DirtyContext.Provider>
    </StoreContext.Provider>
  );
}

// Encabezado: tienda elegida (con su selector) y la puesta a punto.
function StoreHeader({ store, onGoTo }: { store: StoreSettings; onGoTo: (id: string) => void }) {
  const items = checklist(store);
  const done = items.filter((i) => i.done).length;
  const pct = Math.round((done / items.length) * 100);

  return (
    // Sin overflow-hidden: si no, el menú del selector de tienda queda recortado.
    <div className="rounded-2xl border border-border bg-surface">
      {/* Tres columnas en pantallas anchas: tienda · links (al centro) · espacio libre para lo que venga a la derecha. */}
      <div className="grid gap-5 rounded-t-2xl bg-gradient-to-br from-violet-500/10 via-transparent to-transparent p-5 sm:p-6 xl:grid-cols-[minmax(0,1fr)_26rem_minmax(0,1fr)] xl:items-center">
        <div className="flex min-w-0 items-center gap-5">
          <span
            className={`grid size-14 shrink-0 place-items-center rounded-2xl bg-gradient-to-br ${store.color} text-xl font-bold text-white/90 shadow-lg shadow-black/20`}
          >
            {store.name[0]}
          </span>
          <div className="min-w-0 flex-1">
            <p className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-subtle">
              Configurando
              {store.status !== "activa" && <StatusTag status={store.status} />}
            </p>
            <StoreSelector current={store} />
          </div>
        </div>
        <StoreLinks store={store} />
        {/* Lugar reservado para lo que va a la derecha. */}
        <div className="hidden xl:block" />
      </div>

      {/* Puesta a punto: qué falta para que la tienda esté completa. Cada ítem lleva a su sección. */}
      <div className="border-t border-border px-5 py-4 sm:px-6">
        <div className="flex items-center justify-between gap-4">
          <p className="text-sm font-medium">
            Puesta a punto{" "}
            <span className="font-normal text-subtle">
              · {done} de {items.length} listos
            </span>
          </p>
          <span className="text-xs tabular-nums text-muted">{pct}%</span>
        </div>
        <MeterBar value={pct / 100} emphasis={pct === 100} className="mt-2.5" />
        <div className="mt-3 flex flex-wrap gap-2">
          {items.map((i) => (
            <button
              key={i.label}
              type="button"
              onClick={() => onGoTo(i.section)}
              className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs transition ${
                i.done
                  ? "border-emerald-500/25 text-emerald-400 hover:bg-emerald-500/10"
                  : "border-dashed border-border text-muted hover:border-violet-500/40 hover:bg-violet-500/10 hover:text-foreground"
              }`}
            >
              {i.done ? <Check className="size-3.5" /> : <Plus className="size-3.5" />}
              {i.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// Etiqueta para las tiendas que no están activas (pausadas o sin plan): se configuran igual, pero no venden.
function StatusTag({ status }: { status: StoreSettings["status"] }) {
  return (
    <span
      title={status === "pausada" ? "Pausada: no recibe ventas hasta que la reactives" : "Sin plan: no recibe ventas hasta que renueves el plan"}
      className="shrink-0 rounded-full bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-medium normal-case tracking-normal text-amber-400 ring-1 ring-inset ring-amber-500/20"
    >
      {status === "pausada" ? "Pausada" : "Sin plan"}
    </span>
  );
}

// Links públicos de la tienda para compartir: la tienda y el checkout directo.
// Usan el dominio propio si está conectado.
function StoreLinks({ store }: { store: StoreSettings }) {
  const base = publicAddress(store);
  const links = [
    { label: "Tienda", url: base, icon: Globe },
    { label: "Checkout", url: `${base}/checkout`, icon: ShoppingCart },
  ];
  return (
    <div className="w-full space-y-2" aria-label="Links para compartir">
      {links.map((l) => (
        <ShareLink key={l.label} {...l} />
      ))}
    </div>
  );
}

function ShareLink({ label, url, icon: Icon }: { label: string; url: string; icon: LucideIcon }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="flex items-center gap-3 rounded-xl border border-border bg-surface/80 py-2 pl-2 pr-2 backdrop-blur">
      <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-brand-soft text-violet-300">
        <Icon className="size-4" />
      </span>
      <div className="min-w-0 flex-1 leading-tight">
        <p className="text-[10px] font-medium uppercase tracking-wider text-subtle">{label}</p>
        <p className="truncate text-sm font-medium" title={url}>
          {url}
        </p>
      </div>
      <button
        type="button"
        onClick={() => {
          navigator.clipboard?.writeText(`https://${url}`);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        }}
        aria-label={`Copiar el link de ${label.toLowerCase()}`}
        title={copied ? "Copiado" : "Copiar"}
        className="grid size-8 shrink-0 place-items-center rounded-lg border border-border text-muted transition hover:border-violet-500/40 hover:bg-violet-500/10 hover:text-foreground"
      >
        {copied ? <Check className="size-4 text-emerald-400" /> : <Copy className="size-4" />}
      </button>
      <a
        href={`https://${url}`}
        target="_blank"
        rel="noreferrer"
        aria-label={`Abrir ${label.toLowerCase()} en otra pestaña`}
        title="Abrir"
        className="grid size-8 shrink-0 place-items-center rounded-lg bg-brand text-white shadow-lg shadow-violet-500/20 transition hover:bg-violet-500"
      >
        <ExternalLink className="size-4" />
      </a>
    </div>
  );
}

// Selector de tienda con buscador: el nombre grande es el botón.
function StoreSelector({ current }: { current: StoreSettings }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [highlight, setHighlight] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const close = useCallback(() => setOpen(false), []);
  useDismiss(rootRef, open, close);

  const stores = useMemo(() => configurableStores.map((s) => getStoreSettings(s.id)!), []);
  const filtered = stores.filter((s) => s.name.toLowerCase().includes(query.trim().toLowerCase()));

  const choose = (s: StoreSettings) => {
    setOpen(false);
    if (s.id === current.id) return;
    // Mantiene la sección abierta (#pagos, #integraciones…) al cambiar de tienda.
    router.push(`/dashboard/tiendas/${s.id}${window.location.hash}`);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (!open) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlight((h) => Math.min(filtered.length - 1, h + 1));
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlight((h) => Math.max(0, h - 1));
    }
    if (e.key === "Enter" && filtered[highlight]) {
      e.preventDefault();
      choose(filtered[highlight]);
    }
  };

  return (
    <div ref={rootRef} className="relative" onKeyDown={onKeyDown}>
      <button
        type="button"
        onClick={() => {
          setQuery("");
          setHighlight(Math.max(0, stores.findIndex((s) => s.id === current.id)));
          setOpen((o) => !o);
          requestAnimationFrame(() => inputRef.current?.focus());
        }}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="group -ml-1 flex max-w-full items-center gap-2 rounded-lg px-1 text-left transition hover:bg-violet-500/10"
      >
        <span className="truncate text-2xl font-semibold tracking-tight">{current.name}</span>
        <ChevronsUpDown className="size-5 shrink-0 text-subtle transition group-hover:text-foreground" />
      </button>

      {open && (
        <div className="absolute left-0 top-full z-50 mt-2 w-80 max-w-[calc(100vw-2rem)] overflow-hidden rounded-xl border border-border bg-surface-2 shadow-2xl shadow-black/50">
          <div className="relative border-b border-border">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-subtle" />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setHighlight(0);
              }}
              placeholder="Buscar tienda…"
              className="h-10 w-full bg-transparent pl-9 pr-3 text-sm placeholder:text-subtle focus:outline-none"
            />
          </div>
          <ul role="listbox" aria-label="Tiendas" className="max-h-72 overflow-y-auto p-1">
            {filtered.map((s, i) => {
              const selected = s.id === current.id;
              const n = checklist(s).filter((c) => c.done).length;
              return (
                <li key={s.id} role="option" aria-selected={selected}>
                  <button
                    type="button"
                    onClick={() => choose(s)}
                    onMouseEnter={() => setHighlight(i)}
                    className={`flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left ${
                      i === highlight ? "bg-violet-500/10 text-foreground" : "text-muted"
                    }`}
                  >
                    <span className={`grid size-7 shrink-0 place-items-center rounded-lg bg-gradient-to-br ${s.color} text-[11px] font-bold text-white/90`}>
                      {s.name[0]}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-2">
                        <span className="truncate text-sm">{s.name}</span>
                        {s.status !== "activa" && <StatusTag status={s.status} />}
                      </span>
                      <span className="block truncate text-xs text-subtle">{publicAddress(s)}</span>
                    </span>
                    {selected ? (
                      <Check className="size-4 shrink-0 text-brand" />
                    ) : (
                      <span className="text-[11px] tabular-nums text-subtle">{n}/5</span>
                    )}
                  </button>
                </li>
              );
            })}
            {filtered.length === 0 && <li className="px-3 py-6 text-center text-sm text-subtle">No hay tiendas con ese nombre.</li>}
          </ul>
          <div className="border-t border-border p-1">
            <button type="button" disabled className="flex w-full cursor-not-allowed items-center gap-2 rounded-lg px-2 py-2 text-sm text-subtle">
              <Plus className="size-4" /> Nueva tienda
              <span className="ml-auto rounded-full border border-border px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide">
                Pronto
              </span>
            </button>
            <Link
              href="/dashboard/tiendas-inactivas"
              onClick={close}
              className="flex items-center gap-2 rounded-lg px-2 py-2 text-sm text-muted transition hover:bg-violet-500/10 hover:text-foreground"
            >
              <Archive className="size-4" /> Tiendas inactivas
              <span className="ml-auto text-xs tabular-nums text-subtle">{inactiveStores.length}</span>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
