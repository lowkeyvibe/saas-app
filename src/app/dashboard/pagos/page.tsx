import { Building2, Check, CreditCard, Landmark, Wallet, Zap } from "lucide-react";
import { Button, Card, PageHeader } from "@/components/dashboard/ui";

export const metadata = { title: "Pagos" };

// Medios de cobro. Ninguno está conectado de verdad todavía: es solo la interfaz.
const providers = [
  {
    name: "Mercado Pago",
    description: "Tarjetas, débito, dinero en cuenta y cuotas en Argentina y LATAM.",
    icon: Wallet,
    color: "from-sky-500 to-blue-600",
    connected: true,
  },
  {
    name: "Stripe",
    description: "Tarjetas internacionales, Apple Pay y Google Pay.",
    icon: CreditCard,
    color: "from-indigo-500 to-violet-600",
    connected: false,
  },
  {
    name: "PayPal",
    description: "Cobrá a compradores de todo el mundo con su cuenta PayPal.",
    icon: Building2,
    color: "from-blue-600 to-cyan-500",
    connected: false,
  },
  {
    name: "Whop",
    description: "Cobros globales con retiro a tu cuenta, sin necesidad de empresa.",
    icon: Zap,
    color: "from-orange-500 to-amber-500",
    connected: false,
  },
  {
    name: "Transferencia bancaria",
    description: "El comprador te transfiere y vos confirmás el pago a mano.",
    icon: Landmark,
    color: "from-emerald-500 to-teal-500",
    connected: true,
  },
];

export default function PagosPage() {
  return (
    <>
      <PageHeader
        title="Pagos"
        description="Elegí cómo te pagan tus compradores. Podés tener varios medios activos a la vez."
      />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {providers.map((p) => {
          const Icon = p.icon;
          return (
            <Card key={p.name} className="flex flex-col p-5">
              <div className="flex items-start justify-between">
                <span className={`grid size-11 place-items-center rounded-xl bg-gradient-to-br ${p.color}`}>
                  <Icon className="size-5 text-white" />
                </span>
                {p.connected && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-400 ring-1 ring-inset ring-emerald-500/20">
                    <Check className="size-3" />
                    Conectado
                  </span>
                )}
              </div>
              <h3 className="mt-4 font-medium">{p.name}</h3>
              <p className="mt-1 flex-1 text-sm leading-relaxed text-muted">{p.description}</p>
              <Button variant={p.connected ? "secondary" : "primary"} className="mt-5 w-full justify-center">
                {p.connected ? "Configurar" : "Conectar"}
              </Button>
            </Card>
          );
        })}
      </div>
    </>
  );
}
