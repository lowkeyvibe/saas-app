"use client";

import { useEffect, useState } from "react";
import { Monitor, Moon, Palette, Sun } from "lucide-react";
import { getThemePref, onThemeChange, setThemePref, type ThemePref } from "@/lib/theme";
import { SettingsCard } from "../settings-ui";

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
  );
}

