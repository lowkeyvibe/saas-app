"use client";

import { useState } from "react";
import { Crown, KeyRound, ShieldCheck, UserRound } from "lucide-react";
import { accountSettings } from "@/lib/mock-settings";
import { initials } from "@/lib/format";
import { Field, SettingsCard, TextInput, ToggleRow, StatusPill, secondaryButton } from "../settings-ui";

const renews = new Intl.DateTimeFormat("es-AR", { day: "numeric", month: "long", timeZone: "UTC" }).format(
  new Date(`${accountSettings.renewsOn}T00:00:00Z`),
);

export function CuentaTab() {
  const [twoFactor, setTwoFactor] = useState(false);

  return (
    <>
      <SettingsCard icon={UserRound} title="Datos personales" description="Con estos datos entrás al panel. Tus compradores no los ven.">
        <div className="flex items-center gap-4">
          <span className="grid size-14 place-items-center rounded-full bg-gradient-to-br from-zinc-600 to-zinc-800 text-lg font-semibold">
            {initials(accountSettings.name)}
          </span>
          <button type="button" className={secondaryButton}>
            Cambiar foto
          </button>
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Nombre y apellido" htmlFor="acc-name">
            <TextInput id="acc-name" defaultValue={accountSettings.name} autoComplete="name" />
          </Field>
          <Field label="Email" htmlFor="acc-email" hint="Te llegan acá los avisos de ventas y los cobros del plan.">
            <TextInput id="acc-email" type="email" defaultValue={accountSettings.email} autoComplete="email" />
          </Field>
        </div>
      </SettingsCard>

      <SettingsCard icon={KeyRound} title="Contraseña y seguridad">
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Contraseña actual" htmlFor="pw-current">
            <TextInput id="pw-current" type="password" autoComplete="current-password" placeholder="••••••••" />
          </Field>
          <Field label="Nueva contraseña" htmlFor="pw-new" hint="Mínimo 8 caracteres.">
            <TextInput id="pw-new" type="password" autoComplete="new-password" />
          </Field>
        </div>
        <ToggleRow
          title="Verificación en dos pasos"
          description="Además de la contraseña, te pedimos un código de tu app de autenticación al entrar."
          checked={twoFactor}
          onChange={setTwoFactor}
          extra={twoFactor ? <StatusPill tone="ok">Activa</StatusPill> : undefined}
        />
      </SettingsCard>

      <SettingsCard
        icon={Crown}
        title={`Plan ${accountSettings.plan}`}
        description={`Se renueva el ${renews}. Incluye dominio propio, upsells ilimitados y webhooks.`}
        action={<StatusPill tone="ok">Activo</StatusPill>}
        footer={
          <>
            <button type="button" className={secondaryButton}>
              Ver facturas
            </button>
            <button type="button" className={secondaryButton}>
              <ShieldCheck className="size-4" /> Administrar plan
            </button>
          </>
        }
      />
    </>
  );
}
