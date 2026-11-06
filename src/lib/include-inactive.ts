"use client";

import { useCallback, useEffect, useState } from "react";

// Si los números de la app suman las ventas de las tiendas inactivas.
// Lo comparten el filtro del Resumen y el interruptor de Tiendas inactivas, y se recuerda en el navegador.
const KEY = "contar-tiendas-inactivas";
const EVENT = "contar-tiendas-inactivas";

export function useIncludeInactive() {
  const [include, setInclude] = useState(false);

  useEffect(() => {
    const read = () => {
      try {
        setInclude(localStorage.getItem(KEY) === "si");
      } catch {
        // Sin localStorage, queda apagado.
      }
    };
    read();
    window.addEventListener(EVENT, read);
    return () => window.removeEventListener(EVENT, read);
  }, []);

  const update = useCallback((next: boolean) => {
    setInclude(next);
    try {
      localStorage.setItem(KEY, next ? "si" : "no");
    } catch {
      // Sin localStorage, cambia igual pero no se recuerda.
    }
    window.dispatchEvent(new Event(EVENT));
  }, []);

  return [include, update] as const;
}
