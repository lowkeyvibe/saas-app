"use client";

import { createContext, useContext } from "react";
import type { StoreSettings } from "@/lib/mock-settings";

// La tienda que se está configurando en Tiendas. Las pestañas de tienda la leen de acá.
export const StoreContext = createContext<StoreSettings | null>(null);

export function useStore() {
  const store = useContext(StoreContext);
  if (!store) throw new Error("useStore tiene que usarse dentro de una tienda (StoreContext).");
  return store;
}
