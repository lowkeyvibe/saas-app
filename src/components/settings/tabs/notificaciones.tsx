"use client";

import { useState } from "react";
import { BellRing, Download, Mail, Smartphone } from "lucide-react";
import { Checkbox, SettingsCard, StatusPill, ToggleRow, secondaryButton } from "../settings-ui";

const KINDS = [
  { key: "ventas", label: "Ventas nuevas", on: true },
  { key: "rechazos", label: "Pagos rechazados", on: true },
  { key: "upsells", label: "Upsells rechazados", on: true },
  { key: "reembolsos", label: "Reembolsos y contracargos", on: true },
  { key: "retiros", label: "Retiros acreditados", on: false },
];

export function NotificacionesTab() {
  const [push, setPush] = useState(false);
  const [showStore, setShowStore] = useState(true);
  const [emailEach, setEmailEach] = useState(false);
  const [dailySummary, setDailySummary] = useState(true);

  return (
    <>
      <SettingsCard
        icon={Smartphone}
        title="App en tu celular o computadora"
        description="Instalá el panel como app y recibí un aviso al instante cada vez que vendés, sin tenerlo abierto."
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="flex items-center justify-between gap-3 rounded-xl border border-border bg-background/40 px-4 py-3">
            <span className="text-sm">App</span>
            <StatusPill tone="off">No instalada</StatusPill>
          </div>
          <div className="flex items-center justify-between gap-3 rounded-xl border border-border bg-background/40 px-4 py-3">
            <span className="text-sm">Avisos</span>
            {push ? <StatusPill tone="ok">Activados</StatusPill> : <StatusPill tone="off">Desactivados</StatusPill>}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" className={secondaryButton}>
            <Download className="size-4" /> Instalar la app
          </button>
        </div>
        <ToggleRow
          title="Avisos en este dispositivo"
          description="Tu navegador te va a pedir permiso la primera vez."
          checked={push}
          onChange={setPush}
        />
        <ToggleRow
          title="Mostrar el nombre de la tienda en el aviso"
          description="El aviso dice en qué tienda fue la venta. Útil si manejás varias."
          checked={showStore}
          onChange={setShowStore}
        />
      </SettingsCard>

      <SettingsCard icon={BellRing} title="Qué te avisamos" description="Aplica a la bandeja de notificaciones, a la app y a los emails.">
        <div className="grid gap-3 sm:grid-cols-2">
          {KINDS.map((k) => (
            <Checkbox key={k.key} label={k.label} defaultChecked={k.on} />
          ))}
        </div>
      </SettingsCard>

      <SettingsCard icon={Mail} title="Por email" description="Te escribimos a tu email de la cuenta.">
        <ToggleRow
          title="Un email por cada venta"
          description="Con el producto, el monto y el comprador, apenas se aprueba el pago."
          checked={emailEach}
          onChange={setEmailEach}
        />
        <ToggleRow
          title="Resumen del día"
          description="Cada mañana: ventas, ingresos y rechazos del día anterior."
          checked={dailySummary}
          onChange={setDailySummary}
        />
      </SettingsCard>
    </>
  );
}
