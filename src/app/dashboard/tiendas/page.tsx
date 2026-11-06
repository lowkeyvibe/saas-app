import { redirect } from "next/navigation";
import { activeStores } from "@/lib/mock-data";

// Sin tienda elegida, abre la primera.
export default function TiendasPage() {
  redirect(`/dashboard/tiendas/${activeStores[0].id}`);
}
