"use client";

import { useState } from "react";
import { Coins, Globe, Info } from "lucide-react";
import { paymentProviders, type PaymentProvider } from "@/lib/mock-settings";
import { useStore } from "../store-context";
import {
  Block,
  Field,
  IntegrationTile,
  Notice,
  Section,
  Sheet,
  StatusPill,
  SwitchRow,
  TextInput,
  primaryButton,
  secondaryButton,
  useMarkDirty,
} from "../settings-ui";

type Mode = "unica" | "multidivisa";

const MODES: { value: Mode; title: string; description: string; icon: typeof Coins }[] = [
  { value: "unica", title: "Moneda única", description: "Todos pagan en la moneda de la tienda, estén donde estén.", icon: Coins },
  { value: "multidivisa", title: "Multidivisa", description: "Cada comprador ve su moneda y paga con el medio que le corresponde.", icon: Globe },
];

export function PagosTab() {
  const markDirty = useMarkDirty();
  const store = useStore();
  const [mode, setMode] = useState<Mode>("multidivisa");
  const [oneClick, setOneClick] = useState(true);
  const [openId, setOpenId] = useState<PaymentProvider["id"] | null>(null);
  const openProvider = paymentProviders.find((p) => p.id === openId);

  return (
    <>
      <Section title="Medios de cobro" description="Las cuentas donde recibís la plata de esta tienda. Podés tener varias activas.">
        <Block>
          <div className="grid gap-3 sm:grid-cols-2">
            {paymentProviders.map((p) => (
              <IntegrationTile
                key={p.id}
                name={p.name}
                description={p.description}
                status={p.status === "conectado" ? "ok" : "off"}
                statusLabel={p.status === "conectado" ? "Conectado" : "Sin conectar"}
                onClick={() => setOpenId(p.id)}
              />
            ))}
          </div>
        </Block>
      </Section>

      <Section title="Modo de cobro" description="Cómo ven el precio y en qué moneda pagan tus compradores.">
        <div role="radiogroup" aria-label="Modo de cobro" className="divide-y divide-border">
          {MODES.map((m) => {
            const active = mode === m.value;
            return (
              <button
                key={m.value}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => {
                  setMode(m.value);
                  markDirty();
                }}
                className={`flex w-full items-center gap-4 px-5 py-4 text-left transition first:rounded-t-2xl last:rounded-b-2xl ${
                  active ? "bg-brand-soft" : "hover:bg-violet-500/5"
                }`}
              >
                <m.icon className={`size-5 shrink-0 ${active ? "text-violet-300" : "text-subtle"}`} />
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium">{m.title}</span>
                  <span className="mt-0.5 block text-xs text-subtle">{m.description}</span>
                </span>
                <span
                  className={`grid size-5 shrink-0 place-items-center rounded-full border-2 ${active ? "border-brand" : "border-zinc-600"}`}
                >
                  {active && <span className="size-2 rounded-full bg-brand" />}
                </span>
              </button>
            );
          })}
        </div>
      </Section>

      <Section title="Upsells de un clic" description="Después de pagar, el comprador acepta cada oferta sin volver a cargar la tarjeta.">
        <SwitchRow
          title="Ofrecer upsells después del pago"
          description="Cada upsell es un cobro aparte: si uno se rechaza, los demás siguen cobrados."
          checked={oneClick}
          onChange={setOneClick}
        />
        <Block>
          <Notice tone="info" icon={Info}>
            Funciona con Mercado Pago, Stripe y PayPal. Con transferencia no se ofrecen upsells.
          </Notice>
        </Block>
      </Section>

      {/* Panel de cada medio de cobro. */}
      <Sheet
        open={!!openProvider}
        onClose={() => setOpenId(null)}
        title={openProvider?.name ?? ""}
        description={openProvider ? `${openProvider.description} · ${store.name}` : undefined}
        footer={
          openProvider?.status === "conectado" ? (
            <>
              <button type="button" className="mr-auto inline-flex h-9 items-center rounded-lg px-3 text-sm text-subtle transition hover:bg-rose-500/10 hover:text-rose-400">
                Desconectar
              </button>
              <button type="button" onClick={() => setOpenId(null)} className={primaryButton}>
                Listo
              </button>
            </>
          ) : (
            <>
              <button type="button" onClick={() => setOpenId(null)} className={secondaryButton}>
                Cancelar
              </button>
              <button type="button" className={primaryButton}>
                Conectar {openProvider?.name}
              </button>
            </>
          )
        }
      >
        {openProvider && <ProviderDetail provider={openProvider} />}
      </Sheet>
    </>
  );
}

function ProviderDetail({ provider: p }: { provider: PaymentProvider }) {
  const connected = p.status === "conectado";
  return (
    <>
      <div className="flex items-center justify-between gap-3 rounded-xl border border-border bg-background/40 px-4 py-3">
        <span className="text-sm">Estado</span>
        {connected ? <StatusPill tone="ok">Conectado</StatusPill> : <StatusPill tone="off">Sin conectar</StatusPill>}
      </div>
      {connected && p.account && (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-border bg-background/40 px-4 py-3">
          <span className="text-sm">Cuenta</span>
          <span className="truncate font-mono text-xs text-muted">{p.account}</span>
        </div>
      )}
      <Notice tone="info" icon={Info}>
        {p.note}
      </Notice>
      {!connected && (
        <p className="text-sm leading-relaxed text-muted">
          Al tocar <strong className="font-medium text-foreground">Conectar</strong> te llevamos a {p.name} para que autorices la
          conexión. Volvés acá solo cuando termina.
        </p>
      )}
      {p.id === "transferencia" && (
        <div className="space-y-4">
          <Field label="Alias o CBU" htmlFor="tr-alias">
            <TextInput id="tr-alias" defaultValue="lautaro.digital" />
          </Field>
          <Field label="Titular" htmlFor="tr-holder">
            <TextInput id="tr-holder" defaultValue="Lautaro Carbone" />
          </Field>
          <Field label="Plazo para transferir" htmlFor="tr-deadline" hint="Si no se acredita en ese tiempo, la orden se cancela.">
            <TextInput id="tr-deadline" type="number" min={1} defaultValue={48} suffix="horas" />
          </Field>
        </div>
      )}
    </>
  );
}
