import {
  LayoutDashboard,
  Package,
  Receipt,
  Users,
  Wallet,
  Store,
  Megaphone,
  Settings,
  Archive,
  type LucideIcon,
} from "lucide-react";
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
  { label: "Productos", href: "/dashboard/productos", icon: Package },
  { label: "Ventas", href: "/dashboard/ventas", icon: Receipt },
  { label: "Clientes", href: "/dashboard/clientes", icon: Users },
  { label: "Pagos", href: "/dashboard/pagos", icon: Wallet },
  {
    label: "Tiendas inactivas",
    href: "/dashboard/tiendas-inactivas",
    icon: Archive,
    badge: inactiveStores.length,
  },
];

export const secondaryNav: NavItem[] = [
  { label: "Mi tienda", href: "/dashboard/tienda", icon: Store, soon: true },
  { label: "Marketing", href: "/dashboard/marketing", icon: Megaphone, soon: true },
  { label: "Configuración", href: "/dashboard/configuracion", icon: Settings },
];
