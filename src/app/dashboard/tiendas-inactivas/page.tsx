import { Archive, CalendarOff, Package, RotateCcw, Trash2 } from "lucide-react";
import { Button, Card, PageHeader } from "@/components/dashboard/ui";
import { inactiveStores, type InactiveStore } from "@/lib/mock-data";
import { formatMoney, formatNumber } from "@/lib/format";
import { site } from "@/config/site";

export const metadata = { title: "Tiendas inactivas" };

const reasonStyle: Record<InactiveStore["reason"], { label: string; className: string }> = {
  pausada: { label: "Pausada", className: "bg-amber-500/10 text-amber-400 ring-amber-500/20" },
  archivada: { label: "Archivada", className: "bg-zinc-500/10 text-zinc-300 ring-zinc-500/20" },
  "sin plan": { label: "Sin plan activo", className: "bg-rose-500/10 text-rose-400 ring-rose-500/20" },
};

function formatDay(iso: string) {
  return new Intl.DateTimeFormat("es-AR", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${iso}T00:00:00Z`));
}

export default function TiendasInactivasPage() {
  return (
    <>
      <PageHeader
        title="Tiendas inactivas"
        description="Tiendas que ya no están publicadas. Tus compradores no las ven, pero sus datos siguen guardados y las podés reactivar cuando quieras."
      />

      {inactiveStores.length === 0 ? (
        <Card className="grid place-items-center px-6 py-16 text-center">
          <Archive className="size-8 text-subtle" />
          <p className="mt-3 font-medium">No tenés tiendas inactivas</p>
          <p className="mt-1 text-sm text-muted">Cuando pauses o archives una tienda, va a aparecer acá.</p>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {inactiveStores.map((s) => {
            const reason = reasonStyle[s.reason];
            return (
              <Card key={s.id} className="flex flex-col p-5">
                <div className="flex flex-col gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <span
                      className={`grid size-11 shrink-0 place-items-center rounded-xl bg-gradient-to-br ${s.color} text-sm font-bold text-white/90 opacity-60 grayscale-[40%]`}
                    >
                      {s.name[0]}
                    </span>
                    <div className="min-w-0">
                      <h3 className="truncate font-medium">{s.name}</h3>
                      <p className="truncate text-xs text-subtle">
                        {s.subdomain}.{site.name.toLowerCase()}.app
                      </p>
                    </div>
                  </div>
                  <span
                    className={`inline-flex w-fit items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${reason.className}`}
                  >
                    <span className="size-1.5 rounded-full bg-current" />
                    {reason.label}
                  </span>
                </div>

                <dl className="mt-5 grid grid-cols-3 gap-2 rounded-lg border border-border bg-background p-3 text-center">
                  <div>
                    <dt className="text-[11px] text-subtle">Productos</dt>
                    <dd className="mt-0.5 text-sm font-medium tabular-nums">{s.products}</dd>
                  </div>
                  <div>
                    <dt className="text-[11px] text-subtle">Ventas</dt>
                    <dd className="mt-0.5 text-sm font-medium tabular-nums">{formatNumber(s.totalSales)}</dd>
                  </div>
                  <div>
                    <dt className="text-[11px] text-subtle">Facturó</dt>
                    <dd className="mt-0.5 text-sm font-medium tabular-nums">{formatMoney(s.totalRevenue)}</dd>
                  </div>
                </dl>

                <div className="mt-4 flex flex-col gap-1.5 text-xs text-muted">
                  <p className="flex items-center gap-2">
                    <CalendarOff className="size-3.5 text-subtle" />
                    Inactiva desde el {formatDay(s.deactivatedAt)}
                  </p>
                  <p className="flex items-center gap-2">
                    <Package className="size-3.5 text-subtle" />
                    Creada el {formatDay(s.createdAt)}
                  </p>
                </div>

                <div className="mt-5 flex gap-2">
                  <Button className="flex-1 justify-center">
                    <RotateCcw className="size-4" />
                    Reactivar
                  </Button>
                  <Button variant="secondary" aria-label="Eliminar tienda" title="Eliminar tienda">
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </>
  );
}
