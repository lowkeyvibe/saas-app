"use client";

import { useEffect, useState } from "react";
import { Monitor, Moon, Palette, Play, Sun, Volume2 } from "lucide-react";
import { getThemePref, onThemeChange, setThemePref, type ThemePref } from "@/lib/theme";
import { DirtyContext, SettingsCard, ToggleRow } from "../settings-ui";
import { SOUNDS_EVENT, playSuccess, setSounds, soundsEnabled } from "@/lib/sounds";

const THEME_OPTIONS: { value: ThemePref; label: string; hint: string; icon: typeof Sun }[] = [
  { value: "auto", label: "Automático", hint: "Igual que tu computadora", icon: Monitor },
  { value: "claro", label: "Claro", hint: "Blanco y violeta", icon: Sun },
  { value: "oscuro", label: "Oscuro", hint: "Negro y violeta", icon: Moon },
];

// Apariencia: se aplica al instante, no hace falta guardar.
export function AparienciaTab() {
  const [pref, setPref] = useState<ThemePref>("oscuro");

  useEffect(() => {
    const read = () => setPref(getThemePref());
    read();
    return onThemeChange(read);
  }, []);

  return (
    <>
    <SettingsCard icon={Palette} title="Apariencia" description="Cómo se ve el panel en este navegador. Se aplica al instante.">
      <div role="radiogroup" aria-label="Tema" className="grid gap-3 sm:grid-cols-3">
        {THEME_OPTIONS.map((o) => {
          const active = pref === o.value;
          return (
            <button
              key={o.value}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => setThemePref(o.value)}
              className={`flex flex-col items-center gap-2 rounded-xl border px-4 py-5 text-sm transition ${
                active
                  ? "border-brand bg-brand-soft text-foreground ring-4 ring-violet-500/10"
                  : "border-border text-muted hover:border-violet-500/40 hover:bg-violet-500/5 hover:text-foreground"
              }`}
            >
              <o.icon className={`size-5 ${active ? "text-violet-300" : ""}`} />
              <span className="font-medium">{o.label}</span>
              <span className="text-xs text-subtle">{o.hint}</span>
            </button>
          );
        })}
      </div>
    </SettingsCard>
    <SoundCard />
    </>
  );
}

// Sonidos de la app: se aplica al instante (no pasa por "Guardar cambios").
function SoundCard() {
  const [on, setOn] = useState(true);

  useEffect(() => {
    const read = () => setOn(soundsEnabled());
    read();
    window.addEventListener(SOUNDS_EVENT, read);
    return () => window.removeEventListener(SOUNDS_EVENT, read);
  }, []);

  return (
    // DirtyContext vacío: prender o apagar el sonido no activa la barra de "Guardar cambios".
    <DirtyContext.Provider value={() => {}}>
      <SettingsCard
        icon={Volume2}
        title="Sonidos"
        description="Un sonido de dinero cuando convertís una moneda."
        action={
          <button
            type="button"
            onClick={() => playSuccess()}
            className="inline-flex h-9 items-center gap-2 rounded-lg border border-border px-3.5 text-sm font-medium transition hover:bg-violet-500/10"
          >
            <Play className="size-3.5" /> Probar
          </button>
        }
      >
        <ToggleRow
          title="Sonidos de la app"
          description="Se guarda en este navegador."
          checked={on}
          onChange={(v) => {
            setOn(v);
            setSounds(v);
          }}
        />
      </SettingsCard>
    </DirtyContext.Provider>
  );
}
