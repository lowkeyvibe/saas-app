"use client";

import { useState } from "react";
import { ChevronDown, ExternalLink, Plus, Trash2 } from "lucide-react";
import type { MetaPixel } from "@/lib/mock-settings";
import { useStore } from "../store-context";
import {
  Block,
  Checkbox,
  CopyField,
  Field,
  IntegrationTile,
  Row,
  SecretInput,
  Section,
  Select,
  Sheet,
  TextInput,
  primaryButton,
  secondaryButton,
} from "../settings-ui";

type IntegrationId = "meta" | "tiktok" | "google" | "clarity" | "utmify" | "brevo";

// Parámetros para pegar en cada plataforma de anuncios. Con esto, cada venta guarda de qué campaña,
// conjunto y anuncio vino (sección "Origen" del detalle de la orden). Se guardan nombres e IDs.
const UTM_TEMPLATES = {
  meta: {
    label: "Meta",
    where: "En cada anuncio: Seguimiento → Parámetros de URL.",
    value:
      "utm_source=facebook&utm_medium=paid&utm_campaign={{campaign.name}}&utm_term={{adset.name}}&utm_content={{ad.name}}&utm_id={{campaign.id}}&ad_id={{ad.id}}",
  },
  tiktok: {
    label: "TikTok",
    where: "En cada anuncio: Seguimiento → Parámetros de URL.",
    value: "utm_source=tiktok&utm_medium=paid&utm_campaign=__CAMPAIGN_NAME__&utm_term=__AID_NAME__&utm_content=__CID_NAME__&ad_id=__CID__",
  },
  google: {
    label: "Google",
    where: "En la cuenta: Configuración → Plantilla de seguimiento.",
    value: "utm_source=google&utm_medium=cpc&utm_campaign={campaignid}&utm_term={keyword}&utm_content={creative}",
  },
} as const;
type Platform = keyof typeof UTM_TEMPLATES;

const INFO: Record<IntegrationId, { name: string; description: string }> = {
  meta: { name: "Meta Pixel", description: "Pixel y API de Conversiones para Facebook e Instagram." },
  tiktok: { name: "TikTok Pixel", description: "Mide las compras que vienen de TikTok Ads." },
  google: { name: "Google", description: "Analytics 4 y conversiones de Google Ads." },
  clarity: { name: "Microsoft Clarity", description: "Grabaciones de sesión y mapas de calor gratis." },
  utmify: { name: "Utmify", description: "Manda cada venta para ver el rendimiento real de tus campañas." },
  brevo: { name: "Brevo", description: "Recuperá carritos abandonados con tus automatizaciones de email." },
};

export function IntegracionesTab() {
  const store = useStore();
  const [open, setOpen] = useState<IntegrationId | null>(null);
  const [platform, setPlatform] = useState<Platform>("meta");
  const close = () => setOpen(null);

  const status: Record<IntegrationId, { ok: boolean; label: string }> = {
    meta: store.pixels.length
      ? { ok: true, label: store.pixels.length === 1 ? "1 pixel" : `${store.pixels.length} pixeles` }
      : { ok: false, label: "Sin conectar" },
    tiktok: store.tiktokPixel ? { ok: true, label: "Conectado" } : { ok: false, label: "Sin conectar" },
    google: store.ga4 ? { ok: true, label: "Conectado" } : { ok: false, label: "Sin conectar" },
    clarity: store.clarityId ? { ok: true, label: "Conectado" } : { ok: false, label: "Sin conectar" },
    utmify: { ok: false, label: "Apagado" },
    brevo: store.brevoConnected ? { ok: true, label: "Conectado" } : { ok: false, label: "Sin conectar" },
  };

  const tile = (id: IntegrationId) => (
    <IntegrationTile
      key={id}
      name={INFO[id].name}
      description={INFO[id].description}
      status={status[id].ok ? "ok" : "off"}
      statusLabel={status[id].label}
      onClick={() => setOpen(id)}
    />
  );

  const template = UTM_TEMPLATES[platform];

  return (
    <>
      <Section title="Publicidad y medición" description="Avisan de cada visita y compra a tus plataformas de anuncios y analítica.">
        <Block>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{(["meta", "tiktok", "google", "clarity", "utmify"] as const).map(tile)}</div>
        </Block>
      </Section>

      <Section title="Email marketing">
        <Block>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {tile("brevo")}
            <IntegrationTile name="Klaviyo" description="Flujos de email y SMS." status="off" statusLabel="" soon />
            <IntegrationTile name="Mailchimp" description="Listas y campañas de email." status="off" statusLabel="" soon />
          </div>
        </Block>
        <Row label="Carrito abandonado después de" htmlFor="abandon-after" description="Desde que el comprador dejó su email en el checkout sin pagar.">
          <Select
            id="abandon-after"
            defaultValue="60"
            options={[
              { value: "30", label: "30 minutos" },
              { value: "60", label: "1 hora" },
              { value: "120", label: "2 horas" },
            ]}
          />
        </Row>
      </Section>

      <Section title="Parámetros de tus anuncios" description="Pegalos en tus anuncios para saber de qué campaña, conjunto y anuncio vino cada venta.">
        <Block className="space-y-3">
          <div role="tablist" aria-label="Plataforma" className="inline-flex rounded-lg border border-border bg-background p-1">
            {(Object.keys(UTM_TEMPLATES) as Platform[]).map((p) => (
              <button
                key={p}
                type="button"
                role="tab"
                aria-selected={platform === p}
                onClick={() => setPlatform(p)}
                className={`rounded-md px-3 py-1.5 text-xs font-medium transition ${
                  platform === p ? "bg-brand text-white" : "text-muted hover:bg-overlay/[0.04] hover:text-foreground"
                }`}
              >
                {UTM_TEMPLATES[p].label}
              </button>
            ))}
          </div>
          <CopyField value={template.value} />
          <p className="text-xs text-subtle">{template.where}</p>
        </Block>
      </Section>

      <Sheet
        open={open !== null}
        onClose={close}
        title={open ? INFO[open].name : ""}
        description={open ? `${INFO[open].description} · ${store.name}` : undefined}
        footer={
          <>
            <button type="button" onClick={close} className={secondaryButton}>
              Cancelar
            </button>
            <button type="button" onClick={close} className={primaryButton}>
              Guardar
            </button>
          </>
        }
      >
        {open === "meta" && <MetaForm />}
        {open === "tiktok" && (
          <>
            <Field label="ID del pixel" htmlFor="tt-pixel">
              <TextInput id="tt-pixel" defaultValue={store.tiktokPixel} placeholder="C1A2B3C4D5E6F7G8H9" mono />
            </Field>
            <Field label="Token de Events API" htmlFor="tt-token" hint="Opcional. Hace que el seguimiento no dependa del navegador.">
              <SecretInput id="tt-token" placeholder="Pegalo acá" />
            </Field>
          </>
        )}
        {open === "google" && (
          <>
            <Field label="Google Analytics 4" htmlFor="ga4" hint="El ID de medición, empieza con G-.">
              <TextInput id="ga4" defaultValue={store.ga4} placeholder="G-XXXXXXXXXX" mono />
            </Field>
            <Field label="Google Ads" htmlFor="gads" hint="El ID de conversión, empieza con AW-.">
              <TextInput id="gads" placeholder="AW-XXXXXXXXX" mono />
            </Field>
          </>
        )}
        {open === "clarity" && (
          <Field label="ID del proyecto" htmlFor="clarity" hint="En clarity.microsoft.com → Configuración → Instalación. El script se agrega solo a la tienda y al checkout.">
            <TextInput id="clarity" defaultValue={store.clarityId} placeholder="abcd1234ef" mono />
          </Field>
        )}
        {open === "utmify" && (
          <Field label="Token de la API" htmlFor="utmify" hint="En Utmify: Integraciones → Webhooks → Credenciales de API.">
            <SecretInput id="utmify" placeholder="Pegalo acá" />
          </Field>
        )}
        {open === "brevo" && <BrevoForm connected={!!store.brevoConnected} />}
      </Sheet>
    </>
  );
}

function MetaForm() {
  const store = useStore();
  const [pixels, setPixels] = useState<MetaPixel[]>(store.pixels.length ? store.pixels : [{ id: "nuevo", pixelId: "", token: "" }]);

  return (
    <>
      {pixels.map((px, i) => (
        <div key={px.id} className="space-y-3 rounded-xl border border-border bg-background/40 p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">Pixel {i + 1}</p>
            {pixels.length > 1 && (
              <button
                type="button"
                onClick={() => setPixels((list) => list.filter((p) => p.id !== px.id))}
                aria-label={`Quitar pixel ${i + 1}`}
                className="grid size-7 place-items-center rounded-md text-subtle transition hover:bg-rose-500/10 hover:text-rose-400"
              >
                <Trash2 className="size-4" />
              </button>
            )}
          </div>
          <Field label="ID del pixel" htmlFor={`px-${px.id}`}>
            <TextInput id={`px-${px.id}`} defaultValue={px.pixelId} placeholder="1234567890123456" mono inputMode="numeric" />
          </Field>
          <Field label="Token de la API de Conversiones" htmlFor={`tk-${px.id}`} hint="Sin token, el pixel recibe solo los eventos del navegador.">
            <SecretInput id={`tk-${px.id}`} defaultValue={px.token} placeholder="EAAG…" />
          </Field>
        </div>
      ))}
      <button
        type="button"
        onClick={() => setPixels((list) => [...list, { id: `px${Date.now()}`, pixelId: "", token: "" }])}
        className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-border py-3 text-sm text-muted transition hover:border-violet-500/40 hover:bg-violet-500/5 hover:text-foreground"
      >
        <Plus className="size-4" /> Agregar otro pixel
      </button>
      <Field label="Verificación de dominio" htmlFor="meta-verify" hint="El código de la etiqueta meta que te da Meta Business.">
        <TextInput id="meta-verify" defaultValue={store.metaVerification} placeholder="Código de verificación" mono />
      </Field>
    </>
  );
}

function BrevoForm({ connected }: { connected: boolean }) {
  const [sendPast, setSendPast] = useState(true);
  return (
    <>
      <Field label="API key" htmlFor="brevo-key">
        <SecretInput id="brevo-key" defaultValue={connected ? "xkeysib-4f8a2c9e7b1d3f5a6c8e0b2d4f6a8c0e" : undefined} placeholder="xkeysib-…" />
      </Field>
      <div className="space-y-2">
        <Checkbox checked={sendPast} onChange={setSendPast} label="Al conectar, mandar también los carritos abandonados recientes" />
        {sendPast && (
          <div className="pl-7">
            <Select
              aria-label="Desde cuándo"
              defaultValue="3"
              options={[
                { value: "1", label: "Del último día" },
                { value: "3", label: "De los últimos 3 días" },
                { value: "7", label: "De los últimos 7 días" },
              ]}
            />
          </div>
        )}
      </div>
      <details className="group rounded-xl border border-border bg-background/40">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-sm font-medium">
          Cómo conseguir tu API key
          <ChevronDown className="size-4 text-subtle transition group-open:rotate-180" />
        </summary>
        <ol className="list-decimal space-y-1.5 px-4 pb-4 pl-9 text-sm text-muted">
          <li>
            En Brevo, abrí{" "}
            <a href="https://app.brevo.com/settings/keys/api" target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-violet-300 hover:underline">
              SMTP y API → API keys <ExternalLink className="size-3" />
            </a>{" "}
            y tocá <strong className="font-medium text-foreground">Generar una nueva API key</strong>.
          </li>
          <li>Copiala, pegala arriba y tocá Guardar.</li>
        </ol>
      </details>
    </>
  );
}
