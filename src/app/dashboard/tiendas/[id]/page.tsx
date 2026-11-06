import { Suspense } from "react";
import { notFound } from "next/navigation";
import { configurableStores, getStoreSettings } from "@/lib/mock-settings";
import { StoreSettingsView } from "@/components/settings/store-settings";

// Configuración de una tienda: /dashboard/tiendas/t1#pagos, etc.
export function generateStaticParams() {
  return configurableStores.map((s) => ({ id: s.id }));
}

export async function generateMetadata({ params }: PageProps<"/dashboard/tiendas/[id]">) {
  const { id } = await params;
  return { title: getStoreSettings(id)?.name ?? "Tiendas" };
}

// Con Cache Components, el id de la dirección se lee dentro de <Suspense> (ver la guía de dynamic routes).
export default function TiendaPage({ params }: PageProps<"/dashboard/tiendas/[id]">) {
  return (
    <Suspense fallback={<p className="text-sm text-subtle">Cargando tienda…</p>}>
      {params.then(({ id }) => (
        <Store id={id} />
      ))}
    </Suspense>
  );
}

function Store({ id }: { id: string }) {
  if (!getStoreSettings(id)) notFound();
  return <StoreSettingsView storeId={id} />;
}
