"use client";

import { useCallback, useRef, useState } from "react";
import { Bitcoin, Check, ChevronDown, CircleAlert, Landmark, Pencil, Plus, Star, Trash2, Wallet as WalletIcon } from "lucide-react";
import { useDismiss } from "@/components/dashboard/use-dismiss";
import { Field, Select, Sheet, TextInput, primaryButton, secondaryButton } from "@/components/settings/settings-ui";
import type { PayoutMethod } from "@/lib/mock-wallet";

export const METHOD_ICON: Record<PayoutMethod["kind"], typeof Landmark> = {
  banco: Landmark,
  mercadopago: WalletIcon,
  paypal: WalletIcon,
  cripto: Bitcoin,
};

// Desplegable para elegir a qué cuenta va el retiro. Las cuentas sin verificar se ven pero no se pueden elegir.
export function AccountSelect({
  accounts,
  value,
  onChange,
  onAddAccount,
}: {
  accounts: PayoutMethod[];
  value: string | null;
  onChange: (id: string) => void;
  onAddAccount: () => void;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const close = useCallback(() => setOpen(false), []);
  useDismiss(rootRef, open, close);
  const selected = accounts.find((a) => a.id === value);
  const SelectedIcon = selected ? METHOD_ICON[selected.kind] : null;

  return (
    <div ref={rootRef} className="relative min-w-0 flex-1">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={`flex h-9 w-full items-center gap-2.5 rounded-lg border bg-background/60 px-3 text-left text-sm transition ${
          open ? "border-violet-500/60 ring-4 ring-violet-500/10" : selected ? "border-border hover:border-violet-500/40" : "border-dashed border-border hover:border-violet-500/40"
        }`}
      >
        {selected && SelectedIcon ? (
          <>
            <SelectedIcon className="size-4 shrink-0 text-violet-300" />
            <span className="min-w-0 flex-1 truncate">
              <span className="font-medium">{selected.name}</span>
              <span className="text-subtle"> · {selected.detail}</span>
            </span>
          </>
        ) : (
          <span className="flex-1 truncate text-muted">Elegí a qué cuenta retirar</span>
        )}
        <ChevronDown className={`size-4 shrink-0 text-subtle transition ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute left-0 right-0 top-full z-50 mt-2 min-w-72 overflow-hidden rounded-xl border border-border bg-surface-2 shadow-2xl shadow-black/50">
          <ul role="listbox" aria-label="Cuentas para retirar" className="max-h-72 overflow-y-auto p-1">
            {accounts.map((a) => {
              const Icon = METHOD_ICON[a.kind];
              const isSelected = a.id === value;
              return (
                <li key={a.id} role="option" aria-selected={isSelected} aria-disabled={!a.verified}>
                  <button
                    type="button"
                    disabled={!a.verified}
                    onClick={() => {
                      onChange(a.id);
                      close();
                    }}
                    title={a.verified ? undefined : "Todavía no está verificada: no se puede usar para retirar."}
                    className="flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left transition hover:bg-violet-500/10 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-transparent"
                  >
                    <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-brand-soft text-violet-300">
                      <Icon className="size-4" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-1.5 text-sm font-medium">
                        {a.name}
                        {a.isDefault && <Star className="size-3 fill-violet-300 text-violet-300" aria-label="Predeterminada" />}
                        {!a.verified && (
                          <span className="rounded-full bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-medium text-amber-400 ring-1 ring-inset ring-amber-500/20">
                            Sin verificar
                          </span>
                        )}
                      </span>
                      <span className="block truncate text-xs text-subtle">
                        {a.detail} · {a.arrives}
                        {a.fee ? ` · comisión US$ ${a.fee.toFixed(2)}` : ""}
                      </span>
                    </span>
                    {isSelected && <Check className="size-4 shrink-0 text-brand" />}
                  </button>
                </li>
              );
            })}
          </ul>
          <div className="border-t border-border p-1">
            <button
              type="button"
              onClick={() => {
                close();
                onAddAccount();
              }}
              className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-sm text-muted transition hover:bg-violet-500/10 hover:text-foreground"
            >
              <Plus className="size-4" /> Agregar cuenta nueva
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

type Kind = PayoutMethod["kind"];

const KINDS: { value: Kind; label: string; hint: string }[] = [
  { value: "banco", label: "Cuenta bancaria", hint: "1 a 2 días hábiles · sin comisión" },
  { value: "mercadopago", label: "Mercado Pago", hint: "Al instante · sin comisión" },
  { value: "cripto", label: "USDT", hint: "En minutos · comisión US$ 1" },
];

export type AccountsView = "lista" | "agregar" | { editar: string };

// Panel "Cuentas": todo lo de las cuentas para retirar en un solo lugar.
// Ver, agregar, editar, eliminar y elegir la predeterminada. Por ahora todo queda solo en pantalla.
export function AccountsSheet({
  view,
  onViewChange,
  onClose,
  accounts,
  onAccountsChange,
  selectedId,
  onSelect,
  inUseIds,
}: {
  view: AccountsView | null;
  onViewChange: (v: AccountsView) => void;
  onClose: () => void;
  accounts: PayoutMethod[];
  onAccountsChange: (list: PayoutMethod[]) => void;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  inUseIds: string[]; // cuentas con un retiro en camino: no se pueden eliminar
}) {
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const editing = view && typeof view === "object" ? accounts.find((a) => a.id === view.editar) : undefined;

  const setDefault = (id: string) => onAccountsChange(accounts.map((a) => ({ ...a, isDefault: a.id === id })));

  const remove = (id: string) => {
    const removed = accounts.find((a) => a.id === id);
    let next = accounts.filter((a) => a.id !== id);
    // Si era la predeterminada, pasa a serlo la primera verificada que quede.
    if (removed?.isDefault) {
      const first = next.find((a) => a.verified);
      next = next.map((a) => ({ ...a, isDefault: a.id === first?.id }));
    }
    onAccountsChange(next);
    if (selectedId === id) onSelect(null);
    setConfirmDelete(null);
  };

  const save = (account: PayoutMethod) => {
    const exists = accounts.some((a) => a.id === account.id);
    let next = exists ? accounts.map((a) => (a.id === account.id ? account : a)) : [...accounts, account];
    if (account.isDefault) next = next.map((a) => ({ ...a, isDefault: a.id === account.id }));
    onAccountsChange(next);
    // Una cuenta nueva verificada queda elegida para retirar.
    if (!exists && account.verified) onSelect(account.id);
    // Si se editó la elegida y dejó de estar verificada, se des-elige.
    if (exists && selectedId === account.id && !account.verified) onSelect(null);
    onViewChange("lista");
  };

  const close = () => {
    setConfirmDelete(null);
    onClose();
  };

  const title = view === "agregar" ? "Agregar cuenta" : editing ? `Editar ${editing.name}` : "Cuentas";
  const description =
    view === "agregar" || editing
      ? "A dónde te mandamos el dinero cuando retirás."
      : `${accounts.length} ${accounts.length === 1 ? "cuenta" : "cuentas"} para retirar`;

  return (
    <Sheet
      open={view !== null}
      onClose={close}
      title={title}
      description={description}
      footer={
        view === "lista" ? (
          <button type="button" onClick={() => onViewChange("agregar")} className={`${primaryButton} w-full`}>
            <Plus className="size-4" /> Agregar cuenta
          </button>
        ) : undefined
      }
    >
      {view === "lista" && (
        <>
          {accounts.length === 0 && (
            <p className="rounded-xl border border-dashed border-border px-4 py-10 text-center text-sm text-subtle">
              Todavía no tenés cuentas. Agregá una para poder retirar.
            </p>
          )}
          <ul className="space-y-3">
            {accounts.map((a) => {
              const Icon = METHOD_ICON[a.kind];
              const inUse = inUseIds.includes(a.id);
              return (
                <li key={a.id} className={`rounded-xl border bg-background/40 ${a.isDefault ? "border-violet-500/40" : "border-border"}`}>
                  <div className="flex items-start gap-3 p-4">
                    <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-brand-soft text-violet-300">
                      <Icon className="size-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="flex flex-wrap items-center gap-1.5 text-sm font-medium">
                        {a.name}
                        {a.isDefault && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-violet-500/10 px-1.5 py-0.5 text-[10px] font-medium text-violet-300 ring-1 ring-inset ring-violet-500/20">
                            <Star className="size-2.5 fill-current" /> Predeterminada
                          </span>
                        )}
                        {a.verified ? (
                          <span className="rounded-full bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-medium text-emerald-400 ring-1 ring-inset ring-emerald-500/20">
                            Verificada
                          </span>
                        ) : (
                          <span className="rounded-full bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-medium text-amber-400 ring-1 ring-inset ring-amber-500/20">
                            Sin verificar
                          </span>
                        )}
                      </p>
                      <p className="mt-0.5 truncate text-xs text-muted">{a.detail}</p>
                      <p className="text-xs text-subtle">
                        {a.holder} · {a.arrives} · {a.fee ? `comisión US$ ${a.fee.toFixed(2)}` : "sin comisión"}
                      </p>
                    </div>
                  </div>

                  {confirmDelete === a.id ? (
                    <div className="flex flex-wrap items-center gap-2 border-t border-rose-500/20 bg-rose-500/[0.06] px-4 py-3">
                      <p className="flex-1 text-xs text-muted">¿Eliminar esta cuenta? No se puede deshacer.</p>
                      <button type="button" onClick={() => setConfirmDelete(null)} className={`${secondaryButton} h-8 px-3 text-xs`}>
                        Cancelar
                      </button>
                      <button
                        type="button"
                        onClick={() => remove(a.id)}
                        className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-rose-600 px-3 text-xs font-medium text-white transition hover:bg-rose-500"
                      >
                        <Trash2 className="size-3.5" /> Eliminar
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-wrap items-center gap-1 border-t border-border px-2 py-1.5">
                      {!a.isDefault && a.verified && (
                        <button type="button" onClick={() => setDefault(a.id)} className={actionButton}>
                          <Star className="size-3.5" /> Hacer predeterminada
                        </button>
                      )}
                      <button type="button" onClick={() => onViewChange({ editar: a.id })} className={actionButton}>
                        <Pencil className="size-3.5" /> Editar
                      </button>
                      <button
                        type="button"
                        disabled={inUse}
                        onClick={() => setConfirmDelete(a.id)}
                        title={inUse ? "Tiene un retiro en camino: la podés eliminar cuando se acredite." : undefined}
                        className={`${actionButton} ml-auto hover:bg-rose-500/10 hover:text-rose-400`}
                      >
                        <Trash2 className="size-3.5" /> Eliminar
                      </button>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </>
      )}

      {(view === "agregar" || editing) && (
        <AccountForm
          key={editing?.id ?? "nueva"}
          initial={editing}
          onCancel={() => onViewChange("lista")}
          onSave={save}
        />
      )}
    </Sheet>
  );
}

const actionButton =
  "inline-flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-xs text-muted transition hover:bg-violet-500/10 hover:text-foreground disabled:pointer-events-none disabled:opacity-40";

// Formulario para agregar o editar una cuenta.
function AccountForm({
  initial,
  onCancel,
  onSave,
}: {
  initial?: PayoutMethod;
  onCancel: () => void;
  onSave: (account: PayoutMethod) => void;
}) {
  const f = initial?.fields ?? {};
  const [kind, setKind] = useState<Kind>(initial?.kind === "paypal" ? "banco" : (initial?.kind ?? "banco"));
  const [bank, setBank] = useState(f.bank ?? "");
  const [cbu, setCbu] = useState(f.cbu ?? "");
  const [holder, setHolder] = useState(initial?.kind === "banco" ? initial.holder : "");
  const [email, setEmail] = useState(f.email ?? "");
  const [address, setAddress] = useState(f.address ?? "");
  const [network, setNetwork] = useState(f.network ?? "TRC-20");
  const [makeDefault, setMakeDefault] = useState(initial?.isDefault ?? false);

  // CBU/CVU: 22 dígitos. Alias: 6 a 20 caracteres con letras, números, puntos o guiones.
  const cbuValid = /^\d{22}$/.test(cbu.trim()) || /^[a-zA-Z0-9.-]{6,20}$/.test(cbu.trim());
  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  const addressValid = address.trim().length >= 26;
  const valid = kind === "banco" ? !!bank.trim() && cbuValid && !!holder.trim() : kind === "mercadopago" ? emailValid : addressValid;

  const submit = () => {
    const mask = (v: string) => (v.length > 8 ? `${v.slice(0, 4)}···${v.slice(-4)}` : v);
    // Si se edita una billetera cripto y cambia la dirección o la red, hay que volver a verificarla.
    const cryptoChanged = initial?.kind === "cripto" && (address.trim() !== f.address || network !== f.network);
    const base = { id: initial?.id ?? `pm${Date.now()}`, isDefault: makeDefault };
    const account: PayoutMethod =
      kind === "banco"
        ? {
            ...base,
            kind,
            name: bank.trim(),
            detail: /^\d+$/.test(cbu.trim()) ? `CBU ···· ${cbu.trim().slice(-4)}` : `Alias ${cbu.trim()}`,
            holder: holder.trim(),
            arrives: "1 a 2 días hábiles",
            fee: 0,
            verified: true,
            fields: { bank: bank.trim(), cbu: cbu.trim() },
          }
        : kind === "mercadopago"
          ? {
              ...base,
              kind,
              name: "Mercado Pago",
              detail: email.trim(),
              holder: initial?.holder ?? "Lautaro Carbone",
              arrives: "Al instante",
              fee: 0,
              verified: true,
              fields: { email: email.trim() },
            }
          : {
              ...base,
              kind,
              name: `USDT (red ${network})`,
              detail: mask(address.trim()),
              holder: "Billetera propia",
              arrives: "En minutos",
              fee: 1,
              // Las billeteras cripto se verifican aparte antes del primer retiro.
              verified: initial?.kind === "cripto" && !cryptoChanged ? initial.verified : false,
              fields: { address: address.trim(), network },
            };
    onSave(account);
  };

  return (
    <div className="space-y-5">
      <div role="radiogroup" aria-label="Tipo de cuenta" className="grid gap-2">
        {KINDS.map((k) => {
          const Icon = METHOD_ICON[k.value];
          const active = k.value === kind;
          return (
            <button
              key={k.value}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => setKind(k.value)}
              className={`flex items-center gap-3 rounded-xl border px-3 py-3 text-left transition ${
                active ? "border-brand bg-brand-soft" : "border-border hover:border-violet-500/40 hover:bg-violet-500/5"
              }`}
            >
              <Icon className={`size-4 shrink-0 ${active ? "text-violet-300" : "text-subtle"}`} />
              <span className="flex-1 text-sm font-medium">{k.label}</span>
              <span className="text-xs text-subtle">{k.hint}</span>
            </button>
          );
        })}
      </div>

      {kind === "banco" && (
        <>
          <Field label="Banco" htmlFor="acc-bank">
            <TextInput id="acc-bank" value={bank} onChange={(e) => setBank(e.target.value)} placeholder="Banco Galicia" />
          </Field>
          <Field
            label="CBU, CVU o alias"
            htmlFor="acc-cbu"
            hint={cbu && !cbuValid ? <span className="text-amber-400">El CBU tiene 22 números; el alias, de 6 a 20 caracteres.</span> : "Tiene que estar a tu nombre."}
          >
            <TextInput id="acc-cbu" value={cbu} onChange={(e) => setCbu(e.target.value)} placeholder="0000003100000000000000 o mi.alias" mono />
          </Field>
          <Field label="Titular" htmlFor="acc-holder">
            <TextInput id="acc-holder" value={holder} onChange={(e) => setHolder(e.target.value)} placeholder="Nombre y apellido" />
          </Field>
        </>
      )}

      {kind === "mercadopago" && (
        <Field
          label="Email de tu cuenta de Mercado Pago"
          htmlFor="acc-mp"
          hint={email && !emailValid ? <span className="text-amber-400">Revisá el email.</span> : undefined}
        >
          <TextInput id="acc-mp" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="vos@email.com" />
        </Field>
      )}

      {kind === "cripto" && (
        <>
          <Field label="Red" htmlFor="acc-network">
            <Select
              id="acc-network"
              value={network}
              onChange={(e) => setNetwork(e.target.value)}
              options={[
                { value: "TRC-20", label: "TRC-20 (Tron)" },
                { value: "ERC-20", label: "ERC-20 (Ethereum)" },
                { value: "BEP-20", label: "BEP-20 (BNB Chain)" },
              ]}
            />
          </Field>
          <Field label="Dirección de la billetera" htmlFor="acc-address">
            <TextInput id="acc-address" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="T…" mono spellCheck={false} />
          </Field>
          <p className="flex gap-2 rounded-xl border border-amber-500/25 bg-amber-500/10 p-3 text-xs leading-relaxed text-muted">
            <CircleAlert className="mt-0.5 size-3.5 shrink-0 text-amber-400" />
            Revisá que la red coincida con la de tu billetera: si no, el dinero se pierde. La verificamos antes del primer retiro
            {initial?.kind === "cripto" ? " (y otra vez si cambiás la dirección o la red)" : ""}.
          </p>
        </>
      )}

      <label className="flex cursor-pointer items-center gap-3 text-sm">
        <input type="checkbox" checked={makeDefault} onChange={(e) => setMakeDefault(e.target.checked)} className="size-4 accent-violet-500" />
        Usarla como cuenta predeterminada
      </label>

      <div className="flex justify-end gap-2 border-t border-border pt-4">
        <button type="button" onClick={onCancel} className={secondaryButton}>
          {initial ? "Volver" : "Cancelar"}
        </button>
        <button type="button" disabled={!valid} onClick={submit} className={primaryButton}>
          {initial ? <Check className="size-4" /> : <Plus className="size-4" />}
          {initial ? "Guardar cambios" : "Agregar cuenta"}
        </button>
      </div>
    </div>
  );
}
