// Tema de la app: oscuro (por defecto), claro (blanco y violeta) o automático (según el sistema).
// Lo usan el botón del sol del encabezado y la sección "Apariencia" de Configuración.

export type ThemePref = "auto" | "claro" | "oscuro";

// Clave en localStorage. El script de src/app/layout.tsx la lee antes de pintar.
export const THEME_KEY = "tema";
// Evento que avisa a los demás componentes que cambió el tema.
export const THEME_EVENT = "tema-cambio";

const LIGHT_QUERY = "(prefers-color-scheme: light)";

export function getThemePref(): ThemePref {
  try {
    const v = localStorage.getItem(THEME_KEY);
    return v === "claro" || v === "auto" ? v : "oscuro";
  } catch {
    return "oscuro";
  }
}

export function isLight(pref: ThemePref) {
  return pref === "claro" || (pref === "auto" && window.matchMedia(LIGHT_QUERY).matches);
}

export function applyTheme(pref: ThemePref) {
  document.documentElement.classList.toggle("light", isLight(pref));
}

export function setThemePref(pref: ThemePref) {
  try {
    localStorage.setItem(THEME_KEY, pref);
  } catch {
    // Sin localStorage el tema cambia igual, solo que no se recuerda.
  }
  applyTheme(pref);
  window.dispatchEvent(new Event(THEME_EVENT));
}

// Avisa cuando cambia el tema (desde otro componente o, en automático, desde el sistema).
export function onThemeChange(callback: () => void) {
  const media = window.matchMedia(LIGHT_QUERY);
  const onSystem = () => {
    if (getThemePref() === "auto") {
      applyTheme("auto");
      callback();
    }
  };
  window.addEventListener(THEME_EVENT, callback);
  media.addEventListener("change", onSystem);
  return () => {
    window.removeEventListener(THEME_EVENT, callback);
    media.removeEventListener("change", onSystem);
  };
}

// Script que corre antes de que cargue la app, para que no parpadee en oscuro.
export const themeScript = `try{var t=localStorage.getItem("${THEME_KEY}");if(t==="claro"||(t==="auto"&&matchMedia("${LIGHT_QUERY}").matches))document.documentElement.classList.add("light")}catch(e){}`;
