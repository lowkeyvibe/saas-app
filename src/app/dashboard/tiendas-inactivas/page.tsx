import { InactiveStores } from "@/components/inactive/inactive-stores";

export const metadata = { title: "Tiendas inactivas" };

// Tiendas apagadas: su configuración y su historial quedan guardados para siempre.
export default function TiendasInactivasPage() {
  return <InactiveStores />;
}
