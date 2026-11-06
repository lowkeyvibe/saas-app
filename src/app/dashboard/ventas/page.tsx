import { SalesHistory } from "@/components/ventas/sales-history";

export const metadata = { title: "Ventas" };

// Historial general: solo ventas aprobadas, de todas las tiendas.
export default function VentasPage() {
  return <SalesHistory />;
}
