import { Download } from "lucide-react";
import { Button, Card, PageHeader } from "@/components/dashboard/ui";
import { customers } from "@/lib/mock-data";
import { formatMoney, formatDateTime, initials } from "@/lib/format";

export const metadata = { title: "Clientes" };

export default function ClientesPage() {
  const sorted = [...customers].sort((a, b) => b.spent - a.spent);

  return (
    <>
      <PageHeader
        title="Clientes"
        description={`${customers.length} personas compraron en tu tienda.`}
        actions={
          <Button variant="secondary">
            <Download className="size-4" />
            Exportar contactos
          </Button>
        }
      />
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs text-subtle">
                <th className="px-5 py-3 font-medium">Cliente</th>
                <th className="px-5 py-3 font-medium">País</th>
                <th className="px-5 py-3 text-right font-medium">Compras</th>
                <th className="px-5 py-3 text-right font-medium">Total gastado</th>
                <th className="px-5 py-3 text-right font-medium">Última compra</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {sorted.map((c) => (
                <tr key={c.id} className="transition hover:bg-overlay/[0.02]">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <span className="grid size-9 shrink-0 place-items-center rounded-full bg-surface-2 text-xs font-medium text-muted">
                        {initials(c.name)}
                      </span>
                      <div>
                        <p className="font-medium">{c.name}</p>
                        <p className="text-xs text-subtle">{c.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-muted">{c.country}</td>
                  <td className="px-5 py-3 text-right tabular-nums text-muted">{c.purchases}</td>
                  <td className="px-5 py-3 text-right font-medium tabular-nums">{formatMoney(c.spent)}</td>
                  <td className="whitespace-nowrap px-5 py-3 text-right text-muted">{formatDateTime(c.lastPurchase)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  );
}
