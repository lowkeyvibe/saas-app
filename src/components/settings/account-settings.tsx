"use client";

import Link from "next/link";
import { Bell, Palette, Store, UserRound, Webhook } from "lucide-react";
import { SettingsTabs, type SettingsTab } from "./settings-tabs";
import { CuentaTab } from "./tabs/cuenta";
import { AparienciaTab } from "./tabs/apariencia";
import { NotificacionesTab } from "./tabs/notificaciones";
import { WebhooksTab } from "./tabs/webhooks";

// Lo que es de tu cuenta y vale para todas las tiendas. Lo de cada tienda está en Tiendas.
const ACCOUNT_TABS: SettingsTab[] = [
  { id: "cuenta", label: "Mi cuenta", icon: UserRound, Component: CuentaTab },
  { id: "notificaciones", label: "Notificaciones", icon: Bell, Component: NotificacionesTab },
  { id: "apariencia", label: "Apariencia", icon: Palette, Component: AparienciaTab },
  { id: "webhooks", label: "Webhooks", icon: Webhook, Component: WebhooksTab },
];

export function AccountSettings() {
  return (
    <>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Configuración</h1>
          <p className="mt-1 text-sm text-muted">Tu cuenta y lo que vale para todas tus tiendas.</p>
        </div>
        <Link
          href="/dashboard/tiendas"
          className="inline-flex h-9 items-center gap-2 self-start rounded-lg border border-border px-3.5 text-sm text-muted transition hover:bg-violet-500/10 hover:text-foreground sm:self-auto"
        >
          <Store className="size-4" /> Configurar una tienda
        </Link>
      </div>
      <SettingsTabs tabs={ACCOUNT_TABS} label="Secciones de configuración" />
    </>
  );
}
