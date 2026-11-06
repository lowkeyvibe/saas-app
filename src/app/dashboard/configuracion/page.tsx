import { Button, Card, CardHeader, PageHeader } from "@/components/dashboard/ui";
import { site } from "@/config/site";

export const metadata = { title: "Configuración" };

function Field({
  label,
  hint,
  defaultValue,
  suffix,
}: {
  label: string;
  hint?: string;
  defaultValue: string;
  suffix?: string;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium">{label}</span>
      {hint && <span className="mt-0.5 block text-xs text-subtle">{hint}</span>}
      <div className="mt-2 flex overflow-hidden rounded-lg border border-border bg-background focus-within:border-violet-500/60">
        <input defaultValue={defaultValue} className="h-9 flex-1 bg-transparent px-3 text-sm focus:outline-none" />
        {suffix && (
          <span className="flex items-center border-l border-border bg-surface-2 px-3 text-sm text-subtle">
            {suffix}
          </span>
        )}
      </div>
    </label>
  );
}

export default function ConfiguracionPage() {
  const domain = `.${site.name.toLowerCase()}.app`;
  return (
    <>
      <PageHeader title="Configuración" description="Los datos de tu cuenta y de tu tienda." />
      <div className="grid max-w-3xl gap-4">
        <Card>
          <CardHeader title="Tu tienda" description="Así te ven tus compradores." />
          <div className="grid gap-5 p-5">
            <Field label="Nombre de la tienda" defaultValue="Lautaro Digital" />
            <Field label="Dirección" hint="Podés usar tu propio dominio con el plan Pro." defaultValue="lautaro" suffix={domain} />
            <Field label="Email de soporte" hint="Lo ven tus compradores si tienen un problema." defaultValue="soporte@lautarodigital.com" />
          </div>
          <div className="flex justify-end border-t border-border px-5 py-3">
            <Button>Guardar cambios</Button>
          </div>
        </Card>

        <Card>
          <CardHeader title="Tu cuenta" />
          <div className="grid gap-5 p-5 sm:grid-cols-2">
            <Field label="Nombre" defaultValue="Lautaro Carbone" />
            <Field label="Email" defaultValue="carbonelauti@gmail.com" />
          </div>
          <div className="flex justify-end border-t border-border px-5 py-3">
            <Button>Guardar cambios</Button>
          </div>
        </Card>
      </div>
    </>
  );
}
