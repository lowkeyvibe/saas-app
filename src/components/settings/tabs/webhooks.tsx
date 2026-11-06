"use client";

import { useState } from "react";
import { BookOpen, FlaskConical, Loader2, Plus, Trash2, Webhook } from "lucide-react";
import { TODAY } from "@/lib/mock-data";
import { formatRelativeDateTime } from "@/lib/format";
import { WEBHOOK_EVENTS, webhookEndpoints, type WebhookEndpoint, type WebhookEvent } from "@/lib/mock-settings";
import { Checkbox, CopyField, Field, SettingsCard, StatusPill, TextInput, Toggle, primaryButton, secondaryButton } from "../settings-ui";

const eventLabel = (e: WebhookEvent) => WEBHOOK_EVENTS.find((x) => x.value === e)!.label;

// Clave de firma de prueba para un endpoint nuevo.
function newSecret() {
  const hex = Array.from({ length: 32 }, () => Math.floor(Math.random() * 16).toString(16)).join("");
  return `whsec_${hex}`;
}

// Los webhooks se crean, prueban y borran al instante (no pasan por "Guardar cambios"),
// por eso los formularios de acá frenan el aviso de cambios.
export function WebhooksTab() {
  const [endpoints, setEndpoints] = useState<WebhookEndpoint[]>(webhookEndpoints);
  const [adding, setAdding] = useState(false);

  const update = (id: string, patch: Partial<WebhookEndpoint>) =>
    setEndpoints((list) => list.map((w) => (w.id === id ? { ...w, ...patch } : w)));

  return (
    <div onInput={(e) => e.stopPropagation()} className="space-y-6">
      <SettingsCard
        icon={Webhook}
        title="Webhooks"
        description="Te avisamos con un POST a tu URL cada vez que pasa algo con tus ventas, en todas tus tiendas. Cada aviso va firmado y, si tu servidor no responde, lo reintentamos durante 32 horas."
        action={
          <a href="#" className={secondaryButton}>
            <BookOpen className="size-4" /> Documentación
          </a>
        }
      >
        {endpoints.length === 0 && !adding && (
          <p className="rounded-xl border border-dashed border-border px-4 py-8 text-center text-sm text-subtle">
            Todavía no agregaste ningún endpoint.
          </p>
        )}

        {endpoints.map((w) => (
          <EndpointCard
            key={w.id}
            endpoint={w}
            onToggle={(active) => update(w.id, { active })}
            onTested={(status) => update(w.id, { lastDelivery: { status, date: new Date().toISOString() } })}
            onDelete={() => setEndpoints((list) => list.filter((x) => x.id !== w.id))}
          />
        ))}

        {adding ? (
          <NewEndpointForm
            onCancel={() => setAdding(false)}
            onCreate={(url, events) => {
              setEndpoints((list) => [...list, { id: `wh${Date.now()}`, url, events, active: true, secret: newSecret() }]);
              setAdding(false);
            }}
          />
        ) : (
          <button
            type="button"
            onClick={() => setAdding(true)}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-border py-3 text-sm text-muted transition hover:border-violet-500/40 hover:bg-violet-500/5 hover:text-foreground"
          >
            <Plus className="size-4" /> Agregar endpoint
          </button>
        )}
      </SettingsCard>
    </div>
  );
}

function EndpointCard({
  endpoint: w,
  onToggle,
  onTested,
  onDelete,
}: {
  endpoint: WebhookEndpoint;
  onToggle: (active: boolean) => void;
  onTested: (status: number) => void;
  onDelete: () => void;
}) {
  const [testing, setTesting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  return (
    <div className="space-y-4 rounded-xl border border-border bg-background/40 p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
        <div className="min-w-0 flex-1">
          <p className="break-all font-mono text-sm">{w.url}</p>
          <p className="mt-1 text-xs text-subtle">
            {w.events.length} {w.events.length === 1 ? "evento" : "eventos"}
            {w.lastDelivery && (
              <>
                {" · "}Último envío {formatRelativeDateTime(w.lastDelivery.date, TODAY)} ·{" "}
                <span className={w.lastDelivery.status < 300 ? "text-emerald-400" : "text-rose-400"}>
                  {w.lastDelivery.status} {w.lastDelivery.status < 300 ? "OK" : "Error"}
                </span>
              </>
            )}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {w.active ? <StatusPill tone="ok">Activo</StatusPill> : <StatusPill tone="off">Pausado</StatusPill>}
          <Toggle checked={w.active} onChange={onToggle} label={w.active ? "Pausar endpoint" : "Activar endpoint"} />
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {w.events.map((e) => (
          <span key={e} className="rounded-full border border-border bg-surface-2 px-2.5 py-0.5 text-xs text-muted">
            {eventLabel(e)}
          </span>
        ))}
      </div>

      <Field label="Clave de firma" hint={<>Verificá el header <code className="font-mono text-muted">X-Firma</code> con esta clave para asegurarte de que el aviso es nuestro.</>}>
        <CopyField value={w.secret} secret />
      </Field>

      <div className="flex flex-wrap gap-2 border-t border-border pt-4">
        <button
          type="button"
          disabled={testing || !w.active}
          onClick={() => {
            setTesting(true);
            // Simula un envío de prueba: todavía no hay servidor que mande webhooks.
            setTimeout(() => {
              setTesting(false);
              onTested(200);
            }, 900);
          }}
          className={secondaryButton}
        >
          {testing ? <Loader2 className="size-4 animate-spin" /> : <FlaskConical className="size-4" />}
          {testing ? "Enviando…" : "Enviar prueba"}
        </button>
        {confirmDelete ? (
          <>
            <button
              type="button"
              onClick={onDelete}
              className="inline-flex h-9 items-center gap-2 rounded-lg bg-rose-600 px-3.5 text-sm font-medium text-white transition hover:bg-rose-500"
            >
              <Trash2 className="size-4" /> Sí, eliminar
            </button>
            <button type="button" onClick={() => setConfirmDelete(false)} className={secondaryButton}>
              Cancelar
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={() => setConfirmDelete(true)}
            className="ml-auto inline-flex h-9 items-center gap-2 rounded-lg px-3 text-sm text-subtle transition hover:bg-rose-500/10 hover:text-rose-400"
          >
            <Trash2 className="size-4" /> Eliminar
          </button>
        )}
      </div>
    </div>
  );
}

function NewEndpointForm({
  onCancel,
  onCreate,
}: {
  onCancel: () => void;
  onCreate: (url: string, events: WebhookEvent[]) => void;
}) {
  const [url, setUrl] = useState("");
  const [events, setEvents] = useState<WebhookEvent[]>(["venta.aprobada"]);
  const validUrl = /^https:\/\/[^\s/$.?#].[^\s]*$/i.test(url.trim());

  return (
    <div className="space-y-4 rounded-xl border border-violet-500/30 bg-brand-soft p-4">
      <Field
        label="URL del endpoint"
        htmlFor="wh-url"
        hint={url && !validUrl ? <span className="text-amber-400">Tiene que empezar con https://</span> : "Tiene que empezar con https://"}
      >
        <TextInput id="wh-url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://tu-sistema.com/webhooks" mono autoFocus />
      </Field>
      <div>
        <p className="mb-2 text-sm font-medium">Eventos</p>
        <div className="grid gap-2 sm:grid-cols-2">
          {WEBHOOK_EVENTS.map((e) => (
            <Checkbox
              key={e.value}
              label={e.label}
              checked={events.includes(e.value)}
              onChange={(on) => setEvents((list) => (on ? [...list, e.value] : list.filter((x) => x !== e.value)))}
            />
          ))}
        </div>
      </div>
      <div className="flex gap-2">
        <button
          type="button"
          disabled={!validUrl || events.length === 0}
          onClick={() => onCreate(url.trim(), events)}
          className={primaryButton}
        >
          Agregar endpoint
        </button>
        <button type="button" onClick={onCancel} className={secondaryButton}>
          Cancelar
        </button>
      </div>
    </div>
  );
}
