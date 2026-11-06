"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { CircleCheck, type LucideIcon } from "lucide-react";
import { DirtyContext, primaryButton, secondaryButton } from "./settings-ui";

export type SettingsTab = { id: string; label: string; icon: LucideIcon; Component: React.ComponentType };

// Pestañas con su dirección (#id), aviso de cambios sin guardar y barra de "Guardar cambios".
// La usan Configuración (cuenta) y Tiendas (cada tienda).
export function SettingsTabs({ tabs, label }: { tabs: SettingsTab[]; label: string }) {
  const tabFromHash = useCallback(() => {
    const id = window.location.hash.slice(1);
    return tabs.some((t) => t.id === id) ? id : tabs[0].id;
  }, [tabs]);
  const [tab, setTab] = useState(tabs[0].id);
  const [dirty, setDirty] = useState(false);
  const [saved, setSaved] = useState(false);
  // Cambia para volver a montar la pestaña con los valores originales ("Descartar").
  const [resetKey, setResetKey] = useState(0);
  const savedTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  // La pestaña sale del # de la dirección (así funcionan los links del menú del usuario y del engranaje).
  useEffect(() => {
    const read = () => setTab(tabFromHash());
    read();
    window.addEventListener("hashchange", read);
    return () => window.removeEventListener("hashchange", read);
  }, [tabFromHash]);

  const markDirty = useCallback(() => {
    setDirty(true);
    setSaved(false);
  }, []);

  const goTo = (id: string) => {
    if (id === tab) return;
    // Por ahora, al cambiar de pestaña se descartan los cambios sin guardar.
    if (dirty && !window.confirm("Tenés cambios sin guardar en esta pestaña. ¿Querés descartarlos?")) return;
    setDirty(false);
    setTab(id);
    history.replaceState(null, "", `#${id}`);
  };

  const save = () => {
    // Todavía no hay base de datos: se simula el guardado.
    setDirty(false);
    setSaved(true);
    clearTimeout(savedTimer.current);
    savedTimer.current = setTimeout(() => setSaved(false), 2500);
  };

  const discard = () => {
    setDirty(false);
    setResetKey((k) => k + 1);
  };

  const current = tabs.find((t) => t.id === tab) ?? tabs[0];

  return (
    <DirtyContext.Provider value={markDirty}>
      {/* Pestañas: en pantallas chicas se deslizan hacia el costado. */}
      <div className="-mx-4 mb-6 overflow-x-auto px-4 sm:mx-0 sm:px-0">
        <div role="tablist" aria-label={label} className="flex w-max gap-1 rounded-xl border border-border bg-surface p-1">
          {tabs.map((t) => {
            const active = t.id === tab;
            return (
              <button
                key={t.id}
                type="button"
                role="tab"
                aria-selected={active}
                aria-controls="settings-panel"
                onClick={() => goTo(t.id)}
                className={`flex h-9 items-center gap-2 whitespace-nowrap rounded-lg px-3 text-sm font-medium transition ${
                  active
                    ? "bg-brand text-white shadow-lg shadow-violet-500/20"
                    : "text-muted hover:bg-violet-500/10 hover:text-foreground"
                }`}
              >
                <t.icon className="size-4" />
                {t.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Cualquier campo que se escriba o se elija adentro avisa que hay cambios. */}
      <div id="settings-panel" role="tabpanel" aria-label={current.label} className="max-w-4xl space-y-6 pb-28" onInput={markDirty}>
        <current.Component key={`${tab}-${resetKey}`} />
      </div>

      {/* Barra de guardado: aparece solo cuando hay algo para guardar. */}
      {(dirty || saved) && (
        <div className="pointer-events-none fixed inset-x-0 bottom-6 z-40 flex justify-center px-4">
          <div className="pointer-events-auto flex w-full max-w-xl items-center gap-3 rounded-xl border border-border bg-surface-2/95 p-2 pl-4 shadow-2xl shadow-black/50 backdrop-blur transition duration-200 starting:translate-y-4 starting:opacity-0">
            {dirty ? (
              <>
                <span className="size-2 shrink-0 rounded-full bg-amber-400" />
                <p className="flex-1 text-sm">Tenés cambios sin guardar</p>
                <button type="button" onClick={discard} className={secondaryButton}>
                  Descartar
                </button>
                <button type="button" onClick={save} className={primaryButton}>
                  Guardar cambios
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
  );
}
