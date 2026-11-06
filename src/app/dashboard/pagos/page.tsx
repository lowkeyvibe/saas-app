import { redirect } from "next/navigation";
import { activeStores } from "@/lib/mock-data";

// Pagos ahora es una pestaña de la configuración de cada tienda.
export default function PagosPage() {
  redirect(`/dashboard/tiendas/${activeStores[0].id}#pagos`);
}
