"use client";

import { useState } from "react";
import { ImageUp, Trash2, TriangleAlert } from "lucide-react";
import { site } from "@/config/site";
import { CURRENCIES, LANGUAGES, TIMEZONES } from "@/lib/mock-settings";
import { useStore } from "../store-context";
import { Block, Notice, Row, Section, Select, TextInput, secondaryButton } from "../settings-ui";

const domain = `.${site.name.toLowerCase()}.app`;

export function GeneralTab() {
  const store = useStore();
  return (
    <>
      <Section title="Identidad" description="Cómo te ven tus compradores en la tienda, el checkout y los emails.">
        <Row label="Nombre" htmlFor="store-name" description="En la tienda, el checkout y los emails.">
          <TextInput id="store-name" defaultValue={store.name} />
        </Row>
        <Row label="Título de la pestaña" htmlFor="tab-title" description="Lo que se lee en el navegador y en Google. Vacío = el nombre.">
          <TextInput id="tab-title" defaultValue={store.tabTitle} placeholder={store.name} />
        </Row>
        <Row label="Ícono de la pestaña" description="Cuadrado, PNG, SVG o ICO de hasta 512 × 512.">
          <div className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-lg border border-dashed border-border bg-background text-sm font-semibold text-subtle">
              {store.name[0]}
            </span>
            <button type="button" className={secondaryButton}>
              <ImageUp className="size-4" /> Subir
            </button>
          </div>
        </Row>
        <Row label="Dirección" htmlFor="subdomain" description="Con el plan Pro podés usar tu propio dominio.">
          <TextInput id="subdomain" defaultValue={store.subdomain} suffix={domain} />
        </Row>
        <Row label="Email de soporte" htmlFor="support" description="Lo ven tus compradores si necesitan ayuda.">
          <TextInput id="support" type="email" defaultValue={store.supportEmail} />
        </Row>
      </Section>

      <Section title="Idioma y región" description="Textos fijos de la tienda, moneda y horario de tus estadísticas.">
        <Row label="Idioma" htmlFor="lang" description="Botones, checkout y emails automáticos.">
          <Select id="lang" defaultValue={store.language} options={LANGUAGES} />
        </Row>
        <Block>
          <Notice tone="warning" icon={TriangleAlert}>
            Cambiar el idioma <strong className="font-medium text-foreground">no traduce</strong> lo que ya escribiste: solo los
            textos fijos.
          </Notice>
        </Block>
        <Row label="Moneda" htmlFor="currency" description="Las ventas en otras monedas se convierten a esta.">
          <Select id="currency" defaultValue={store.currency} options={CURRENCIES} />
        </Row>
        <Row label="Zona horaria" htmlFor="tz" description="Cuándo empieza cada día en tus estadísticas y la hora de las ventas.">
          <Select id="tz" defaultValue={store.timezone} options={TIMEZONES} />
        </Row>
      </Section>

      <DangerZone />
    </>
  );
}

// Para eliminar hay que escribir el nombre de la tienda.
function DangerZone() {
  const store = useStore();
  const [confirming, setConfirming] = useState(false);
  const [typed, setTyped] = useState("");
  const matches = typed.trim() === store.name;

  return (
    <section className="space-y-3">
      <h2 className="font-semibold text-rose-400">Zona de peligro</h2>
      <div className="divide-y divide-rose-500/20 rounded-2xl border border-rose-500/30 bg-rose-500/[0.04]">
        <div className="flex flex-col gap-4 px-5 py-4 sm:flex-row sm:items-center">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium">Eliminar {store.name}</p>
            <p className="mt-0.5 text-xs leading-relaxed text-subtle">
              Deja de estar online y pasa a Tiendas inactivas. Las ventas se conservan y la podés reactivar.
            </p>
          </div>
          {!confirming && (
            <button
              type="button"
              onClick={() => setConfirming(true)}
              className="inline-flex h-9 shrink-0 items-center gap-2 rounded-lg border border-rose-500/40 px-3.5 text-sm font-medium text-rose-400 transition hover:bg-rose-500/10"
            >
              <Trash2 className="size-4" /> Eliminar
            </button>
          )}
        </div>
        {confirming && (
          <div className="space-y-3 px-5 py-4">
            <label htmlFor="confirm-delete" className="block text-sm text-muted">
              Para confirmar, escribí <strong className="font-medium text-foreground">{store.name}</strong>
            </label>
            {/* onInput se frena: escribir la confirmación no es un cambio para guardar. */}
            <div className="flex flex-col gap-2 sm:flex-row" onInput={(e) => e.stopPropagation()}>
              <div className="flex-1">
                <TextInput id="confirm-delete" value={typed} onChange={(e) => setTyped(e.target.value)} autoComplete="off" />
              </div>
              <button
                type="button"
                disabled={!matches}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-rose-600 px-4 text-sm font-medium text-white transition hover:bg-rose-500 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Eliminar definitivamente
              </button>
              <button
                type="button"
                onClick={() => {
                  setConfirming(false);
                  setTyped("");
                }}
                className={`${secondaryButton} h-10`}
              >
                Cancelar
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
