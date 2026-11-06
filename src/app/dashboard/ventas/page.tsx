import { PageHeader, StatCard } from "@/components/dashboard/ui";
import { sales } from "@/lib/mock-data";
import { formatMoney, formatNumber } from "@/lib/format";
import { SalesTable } from "./sales-table";

export const metadata = { title: "Ventas" };

export default function VentasPage() {
  const approved = sales.filter((s) => s.status === "aprobada");
  const pending = sales.filter((s) => s.status === "pendiente");

  return (
    <>
      <PageHeader title="Ventas" description="Cada compra que hicieron en tu tienda." />
      <div className="mb-4 grid gap-4 sm:grid-cols-3">
        <StatCard label="Ventas aprobadas" value={formatNumber(approved.length)} />
        <StatCard label="Cobrado" value={formatMoney(approved.reduce((a, s) => a + s.amount, 0))} />
        <StatCard label="Esperando pago" value={formatNumber(pending.length)} />
      </div>
      <SalesTable sales={sales} />
    </>
  );
}
