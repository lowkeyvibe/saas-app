"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { onThemeChange, setThemePref } from "@/lib/theme";

// Botón del tema:
// - En oscuro muestra el sol: al tocarlo pasa al tema claro (blanco y violeta).
// - En claro muestra el sol y, al pasar el mouse, la luna: al tocarlo vuelve a oscuro.
// También se puede elegir el tema (incluido "Automático") en Configuración → General → Apariencia.
export function ThemeToggle({ className = "" }: { className?: string }) {
  const [light, setLight] = useState(false);

  useEffect(() => {
    const read = () => setLight(document.documentElement.classList.contains("light"));
    read();
    return onThemeChange(read);
  }, []);

  const label = light ? "Volver al tema oscuro" : "Pasar al tema claro";

  return (
    <button
      type="button"
      onClick={() => setThemePref(light ? "oscuro" : "claro")}
      aria-label={label}
      title={label}
      className={`group ${className}`}
    >
      {light ? (
        <>
          <Sun className="size-4 group-hover:hidden" />
          <Moon className="hidden size-4 group-hover:block" />
        </>
      ) : (
        <Sun className="size-4" />
      )}
    </button>
  );
}
