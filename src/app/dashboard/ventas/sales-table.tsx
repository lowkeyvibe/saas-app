"use client";

import { useMemo, useState } from "react";
import { Download, Search } from "lucide-react";
import { Button, Card, StatusBadge } from "@/components/dashboard/ui";
import { productById, type Sale, type SaleStatus } from "@/lib/mock-data";
import { formatMoney, formatDateTime } from "@/lib/format";

const filters: { value: SaleStatus | "todas"; label: string }[] = [
  { value: "todas", label: "Todas" },
  { value: "aprobada", label: "Aprobadas" },
  { value: "pendiente", label: "Pendientes" },
  { value: "rechazada", label: "Rechazadas" },
  { value: "reembolsada", label: "Reembolsadas" },
];

export function SalesTable({ sales }: { sales: Sale[] }) {
  const [status, setStatus] = useState<SaleStatus | "todas">("todas");
  const [query, setQuery] = useState("");

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return sales.filter(
      (s) =>
        (status === "todas" || s.status === status) &&
        (!q ||
          s.customer.toLowerCase().includes(q) ||
          s.email.includes(q) ||
          s.id.includes(q)),
    );
  }, [sales, status, query]);

  return (
    <Card className="overflow-hidden">
      <div className="flex flex-col gap-3 border-b border-border p-4 lg:flex-row lg:items-center">
        <div className="flex flex-wrap gap-1">
          {filters.map((f) => (
            <button
              key={f.value}
              onClick={() => setStatus(f.value)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                status === f.value
                  ? "bg-white/[0.08] text-foreground"
                  : "text-muted hover:bg-white/[0.04] hover:text-foreground"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="flex gap-2 lg:ml-auto">
          <div className="relative flex-1 lg:w-64 lg:flex-none">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-subtle" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar por cliente o N° de orden"
              className="h-9 w-full rounded-lg border border-border bg-background pl-9 pr-3 text-sm placeholder:text-subtle focus:border-violet-500/60 focus:outline-none"
            />
          </div>
          <Button variant="secondary">
            <Download className="size-4" />
            <span className="hidden sm:inline">Exportar</span>
          </Button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs text-subtle">
              <th className="px-5 py-3 font-medium">Orden</th>
              <th className="px-5 py-3 font-medium">Cliente</th>
              <th className="px-5 py-3 font-medium">Producto</th>
              <th className="px-5 py-3 font-medium">Medio de pago</th>
              <th className="px-5 py-3 font-medium">Estado</th>
              <th className="px-5 py-3 font-medium">Fecha</th>
              <th className="px-5 py-3 text-right font-medium">Monto</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.map((s) => (
              <tr key={s.id} className="transition hover:bg-white/[0.02]">
                <td className="px-5 py-3 font-mono text-xs text-muted">{s.id}</td>
                <td className="px-5 py-3">
                  <p className="font-medium">{s.customer}</p>
                  <p className="text-xs text-subtle">{s.email}</p>
                </td>
                <td className="max-w-56 truncate px-5 py-3 text-muted">{productById(s.productId)?.name}</td>
                <td className="whitespace-nowrap px-5 py-3 text-muted">{s.method}</td>
                <td className="px-5 py-3">
                  <StatusBadge status={s.status} />
                </td>
                <td className="whitespace-nowrap px-5 py-3 text-muted">{formatDateTime(s.date)}</td>
                <td className="px-5 py-3 text-right font-medium tabular-nums">{formatMoney(s.amount)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 && (
          <p className="px-5 py-12 text-center text-sm text-subtle">No hay ventas que coincidan.</p>
        )}
      </div>

      <div className="border-t border-border px-5 py-3 text-xs text-subtle">
        {rows.length} de {sales.length} ventas
      </div>
    </Card>
  );
}
