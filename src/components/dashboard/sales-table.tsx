"use client";

import { StatusBadge } from "@/components/dashboard/ui";
import { BLUR } from "@/components/dashboard/hide-columns-menu";
import { activeStores, productById, TODAY, type Sale } from "@/lib/mock-data";
import { formatMoney, formatRelativeDateTime } from "@/lib/format";

// Tabla de ventas única: la usan "Últimas ventas" del Resumen y el historial de Ventas, con las mismas columnas.
// Tocar una fila llama a onSelect (para abrir el detalle de la orden).
// `hidden`: columnas difuminadas con "Ocultar datos" (cliente, tienda, total).
export function SalesTable({
  rows,
  onSelect,
  selectedId,
  hidden,
  empty = "No hay ventas.",
}: {
  rows: Sale[];
  onSelect: (sale: Sale) => void;
  selectedId?: string;
  hidden?: ReadonlySet<string>;
  empty?: string;
}) {
  const blur = (col: string) => (hidden?.has(col) ? BLUR : "");

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-y border-border text-left text-xs text-subtle">
            <th className="px-5 py-2.5 font-medium">Pedido</th>
            <th className="px-5 py-2.5 font-medium">Fecha</th>
            <th className="px-5 py-2.5 font-medium">Cliente</th>
            <th className="px-5 py-2.5 font-medium">Artículos</th>
            <th className="px-5 py-2.5 font-medium">Tienda</th>
            <th className="px-5 py-2.5 text-right font-medium">Total</th>
            <th className="px-5 py-2.5 font-medium">Estado del pago</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {rows.map((s) => {
            const product = productById(s.productId);
            const store = activeStores.find((t) => t.id === product?.storeId);
            // Upsells que se cobraron (los rechazados se ven en el detalle de la orden).
            const upsells = s.upsells.filter((u) => u.status !== "rechazada").length;
            return (
              <tr
                key={s.id}
                onClick={() => onSelect(s)}
                className={`cursor-pointer transition hover:bg-violet-500/10 ${selectedId === s.id ? "bg-violet-500/10" : ""}`}
              >
                <td className="whitespace-nowrap px-5 py-3 font-medium tabular-nums">
                  {/* Botón para abrir la orden con el teclado; con el mouse se toca toda la fila. */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelect(s);
                    }}
                    className="rounded hover:text-violet-300 focus-visible:outline-2 focus-visible:outline-violet-500"
                  >
                    {s.id}
                  </button>
                </td>
                <td className="whitespace-nowrap px-5 py-3 text-muted">{formatRelativeDateTime(s.date, TODAY)}</td>
                <td className={`whitespace-nowrap px-5 py-3 ${blur("cliente")}`}>{s.customer}</td>
                <td className="max-w-56 px-5 py-3">
                  <p className="truncate text-muted">{product?.name}</p>
                  {upsells > 0 && (
                    <p className="text-xs text-subtle">
                      + {upsells} upsell{upsells > 1 ? "s" : ""}
                    </p>
                  )}
                </td>
                <td className={`whitespace-nowrap px-5 py-3 text-muted ${blur("tienda")}`}>{store?.name ?? "—"}</td>
                <td className={`whitespace-nowrap px-5 py-3 text-right font-medium tabular-nums ${blur("total")}`}>
                  {formatMoney(s.amount)}
                </td>
                <td className="px-5 py-3">
                  <StatusBadge status={s.status} />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {rows.length === 0 && <p className="px-5 py-12 text-center text-sm text-subtle">{empty}</p>}
    </div>
  );
}
