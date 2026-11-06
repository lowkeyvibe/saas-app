import Link from "next/link";
import { MoreHorizontal, Plus } from "lucide-react";
import { Button, Card, PageHeader, ProductThumb, StatusBadge } from "@/components/dashboard/ui";
import { products } from "@/lib/mock-data";
import { formatMoney, formatNumber } from "@/lib/format";

export const metadata = { title: "Productos" };

const typeLabel = { ebook: "Ebook", curso: "Curso", plantilla: "Plantillas", pack: "Pack" };

export default function ProductosPage() {
  return (
    <>
      <PageHeader
        title="Productos"
        description="Todo lo que vendés en tu tienda."
        actions={
          <Button>
            <Plus className="size-4" />
            Nuevo producto
          </Button>
        }
      />

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs text-subtle">
                <th className="px-5 py-3 font-medium">Producto</th>
                <th className="px-5 py-3 font-medium">Estado</th>
                <th className="px-5 py-3 text-right font-medium">Precio</th>
                <th className="px-5 py-3 text-right font-medium">Ventas</th>
                <th className="px-5 py-3 text-right font-medium">Ingresos</th>
                <th className="w-12 px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {products.map((p) => (
                <tr key={p.id} className="transition hover:bg-white/[0.02]">
                  <td className="px-5 py-3">
                    <Link href={`/dashboard/productos/${p.id}`} className="group flex items-center gap-3">
                      <ProductThumb color={p.color} name={p.name} />
                      <div>
                        <p className="font-medium group-hover:text-violet-300">{p.name}</p>
                        <p className="text-xs text-subtle">{typeLabel[p.type]}</p>
                      </div>
                    </Link>
                  </td>
                  <td className="px-5 py-3">
                    <StatusBadge status={p.status} />
                  </td>
                  <td className="px-5 py-3 text-right tabular-nums">{formatMoney(p.price)}</td>
                  <td className="px-5 py-3 text-right tabular-nums text-muted">{formatNumber(p.sales)}</td>
                  <td className="px-5 py-3 text-right font-medium tabular-nums">{formatMoney(p.revenue)}</td>
                  <td className="px-5 py-3">
                    <button className="rounded-md p-1 text-subtle hover:bg-white/5 hover:text-foreground" aria-label="Opciones">
                      <MoreHorizontal className="size-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  );
}
