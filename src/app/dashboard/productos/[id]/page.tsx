import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, Copy, ExternalLink, Pencil } from "lucide-react";
import {
  Button,
  Card,
  CardHeader,
  ProductThumb,
  StatCard,
  StatusBadge,
} from "@/components/dashboard/ui";
import { RevenueChart } from "@/components/dashboard/revenue-chart";
import { productById, productRevenueSeries, products, sales } from "@/lib/mock-data";
import { formatDateTime, formatMoney, formatNumber, initials } from "@/lib/format";
import { site } from "@/config/site";

const typeLabel = { ebook: "Ebook", curso: "Curso", plantilla: "Plantillas", pack: "Pack" };

export function generateStaticParams() {
  return products.map((p) => ({ id: p.id }));
}

export async function generateMetadata({ params }: PageProps<"/dashboard/productos/[id]">) {
  const { id } = await params;
  return { title: productById(id)?.name ?? "Producto" };
}

export default async function ProductoPage({ params }: PageProps<"/dashboard/productos/[id]">) {
  const { id } = await params;
  const product = productById(id);
  if (!product) notFound();

  const series = productRevenueSeries(product.id);
  const revenue30 = series.reduce((a, d) => a + d.revenue, 0);
  const orders30 = series.reduce((a, d) => a + d.orders, 0);
  const productSales = sales.filter((s) => s.productId === product.id);
  const refunds = productSales.filter((s) => s.status === "reembolsada").length;
  const slug = product.name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  const publicUrl = `lautaro.${site.name.toLowerCase()}.app/${slug}`;
  const isDraft = product.status === "borrador";

  return (
    <>
      <Link
        href="/dashboard/productos"
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted transition hover:text-foreground"
      >
        <ChevronLeft className="size-4" />
        Productos
      </Link>

      <div className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <div className="scale-125">
            <ProductThumb color={product.color} name={product.name} />
          </div>
          <div className="ml-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-semibold tracking-tight">{product.name}</h1>
              <StatusBadge status={product.status} />
            </div>
            <p className="mt-1 text-sm text-muted">
              {typeLabel[product.type]} · {formatMoney(product.price)}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary">
            <ExternalLink className="size-4" />
            Ver página
          </Button>
          <Button>
            <Pencil className="size-4" />
            Editar
          </Button>
        </div>
      </div>

      <Card className="mb-4 flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
        <p className="text-sm text-muted">Link de venta</p>
        <code className="flex-1 truncate rounded-md bg-background px-3 py-1.5 font-mono text-sm text-foreground ring-1 ring-border">
          {publicUrl}
        </code>
        <Button variant="secondary">
          <Copy className="size-4" />
          Copiar
        </Button>
      </Card>

      {isDraft ? (
        <Card className="grid place-items-center px-6 py-16 text-center">
          <p className="font-medium">Este producto todavía es un borrador</p>
          <p className="mt-1 max-w-sm text-sm text-muted">
            Cuando lo publiques vas a ver acá sus ventas, ingresos y compradores.
          </p>
          <Button className="mt-5">Publicar producto</Button>
        </Card>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Ingresos (30 días)" value={formatMoney(revenue30)} delta={14.2} />
            <StatCard label="Ventas (30 días)" value={formatNumber(orders30)} delta={9.8} />
            <StatCard label="Ventas totales" value={formatNumber(product.sales)} />
            <StatCard label="Reembolsos" value={formatNumber(refunds)} />
          </div>

          <div className="mt-4 grid gap-4 xl:grid-cols-3">
            <Card className="xl:col-span-2">
              <CardHeader title="Ingresos diarios" description="Últimos 30 días" />
              <div className="px-3 pb-3 pt-4">
                <RevenueChart data={series} />
              </div>
            </Card>

            <Card>
              <CardHeader title="Últimos compradores" />
              <div className="mt-3 divide-y divide-border">
                {productSales.slice(0, 6).map((s) => (
                  <div key={s.id} className="flex items-center gap-3 px-5 py-3">
                    <span className="grid size-8 shrink-0 place-items-center rounded-full bg-surface-2 text-xs font-medium text-muted">
                      {initials(s.customer)}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{s.customer}</p>
                      <p className="text-xs text-subtle">{formatDateTime(s.date)}</p>
                    </div>
                    <StatusBadge status={s.status} />
                  </div>
                ))}
                {productSales.length === 0 && (
                  <p className="px-5 py-8 text-center text-sm text-subtle">Todavía no hay compras.</p>
                )}
              </div>
            </Card>
          </div>
        </>
      )}
    </>
  );
}
