import { AccountSettings } from "@/components/settings/account-settings";

export const metadata = { title: "Configuración" };

// Se abre con el engranaje del encabezado o desde el menú del usuario.
// Solo lo de la cuenta: la configuración de cada tienda está en /dashboard/tiendas.
export default function ConfiguracionPage() {
  return <AccountSettings />;
}
