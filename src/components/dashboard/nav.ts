import { Archive, LayoutDashboard, Receipt, Wallet, type LucideIcon } from "lucide-react";
import { inactiveStores } from "@/lib/mock-data";

export type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  soon?: boolean;
  badge?: number;
};

export const mainNav: NavItem[] = [
  { label: "Resumen", href: "/dashboard", icon: LayoutDashboard },
  { label: "Wallet", href: "/dashboard/wallet", icon: Wallet },
  { label: "Ventas", href: "/dashboard/ventas", icon: Receipt },
  {
    label: "Tiendas inactivas",
    href: "/dashboard/tiendas-inactivas",
    icon: Archive,
    badge: inactiveStores.length,
  },
];

// Sección "Tienda" de la columna: hoy vacía (si no tiene ítems, no se muestra).
// Configuración y la configuración de cada tienda se abren desde el engranaje del encabezado.
export const secondaryNav: NavItem[] = [];
