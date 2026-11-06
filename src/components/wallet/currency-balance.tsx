"use client";

import { useState } from "react";
import { ArrowDownToLine, ArrowRightLeft, Check, CircleAlert, Clock, Info, Loader2, RefreshCw } from "lucide-react";
import { Sheet, primaryButton, secondaryButton } from "@/components/settings/settings-ui";
import { formatCurrency } from "@/lib/format";
import { convert, CURRENCIES, type CurrencyBalance, type MainCurrency, type PayoutMethod } from "@/lib/mock-wallet";
import { AccountSelect } from "./accounts";

const fmt = (value: number, code: string) => formatCurrency(value, code, CURRENCIES[code].decimals);

function Flag({ code, size = "size-8" }: { code: string; size?: string }) {
  return (
    <span className={`grid ${size} shrink-0 place-items-center overflow-hidden rounded-full border border-border bg-surface-2 text-base leading-none`}>
      {CURRENCIES[code].flag}
    </span>
  );
}

// Tarjeta principal de la Wallet: saldo en la moneda principal, saldos de cada moneda en la que te pagaron
// (con lo que falta acreditarse) y la elección de moneda principal (USD o EUR).
export function CurrencyBalanceCard({
  main,
  balances,
  onChangeMain,
  onConvert,
  onWithdraw,
  accounts,
  accountId,
  onSelectAccount,
  onAddAccount,
}: {
  main: MainCurrency;
  balances: CurrencyBalance[];
  onChangeMain: (c: MainCurrency) => void;
  onConvert: (code: string, amount: number) => void;
  onWithdraw: () => void;
  accounts: PayoutMethod[];
  accountId: string | null;
  onSelectAccount: (id: string) => void;
  onAddAccount: () => void;
}) {
  const [converting, setConverting] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshedAt, setRefreshedAt] = useState<string | null>(null);

  const mainBalance = balances.find((b) => b.code === main)!;
  const others = balances.filter((b) => b.code !== main);
  // Lo que falta acreditarse en todas las monedas, pasado a la moneda principal (aproximado).
  const pendingInMain = balances.reduce((a, b) => a + convert(b.pending, b.code, main), 0);
  const convertible = others.reduce((a, b) => a + convert(b.available, b.code, main), 0);

  return (
    <div className="relative overflow-hidden rounded-xl border border-border bg-surface">
      <div className="pointer-events-none absolute -right-20 -top-24 size-72 rounded-full bg-violet-500/15 blur-3xl" />

      <div className="relative p-6">
        <div className="flex items-center justify-between gap-3">
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-background/60 py-1 pl-1 pr-3 text-sm">
            <Flag code={main} size="size-6" />
            <span className="font-medium">{main}</span>
            <span className="text-subtle">{CURRENCIES[main].name}</span>
          </span>
          <button
            type="button"
            disabled={refreshing}
            onClick={() => {
              setRefreshing(true);
              // Simula traer los saldos de la pasarela.
              setTimeout(() => {
                setRefreshing(false);
                setRefreshedAt(new Intl.DateTimeFormat("es-AR", { hour: "2-digit", minute: "2-digit" }).format(new Date()));
              }, 900);
            }}
            className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs text-muted transition hover:bg-violet-500/10 hover:text-foreground"
          >
            <RefreshCw className={`size-3.5 ${refreshing ? "animate-spin" : ""}`} />
            {refreshing ? "Actualizando…" : refreshedAt ? `Actualizado ${refreshedAt}` : "Actualizar"}
          </button>
        </div>

        <p className="mt-6 text-xs font-medium uppercase tracking-wider text-subtle">Disponible para retirar</p>
        <p className="mt-1 text-4xl font-semibold tracking-tight tabular-nums">{fmt(mainBalance.available, main)}</p>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span
            title="Lo que te pagaron y todavía no se acreditó, en todas las monedas, pasado a tu moneda principal."
            className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-2.5 py-1 text-xs font-medium text-amber-400 ring-1 ring-inset ring-amber-500/20"
          >
            <Clock className="size-3.5" /> A acreditarse ≈ {fmt(pendingInMain, main)}
          </span>
          {convertible > 0 && (
            <span className="text-xs text-subtle">
              + ≈ {fmt(convertible, main)} para convertir
            </span>
          )}
        </div>

        {/* Cuenta de destino + retirar: sin cuenta elegida no se puede retirar. */}
        <div className="mt-5 flex flex-col gap-2 sm:flex-row">
          <AccountSelect accounts={accounts} value={accountId} onChange={onSelectAccount} onAddAccount={onAddAccount} />
          <button
            type="button"
            onClick={onWithdraw}
            disabled={!accountId}
            title={accountId ? undefined : "Elegí una cuenta para retirar"}
            className={`${primaryButton} shrink-0`}
          >
            <ArrowDownToLine className="size-4" /> Retirar {main}
          </button>
        </div>
      </div>

      {/* Saldos en otras monedas */}
      <div className="relative border-t border-border">
        <p className="px-6 pb-1 pt-4 text-xs font-medium uppercase tracking-wider text-subtle">Saldos en otras monedas</p>
        <ul className="divide-y divide-border">
          {others.map((b) => (
            <li key={b.code} className="flex items-center gap-3 px-6 py-3 transition hover:bg-violet-500/5">
              <Flag code={b.code} />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">{b.code}</p>
                <p className="truncate text-xs text-subtle">{CURRENCIES[b.code].name}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium tabular-nums">{fmt(b.available, b.code)}</p>
                {b.pending > 0 ? (
                  <p className="text-xs tabular-nums text-amber-400/90">+ {fmt(b.pending, b.code)} a acreditarse</p>
                ) : (
                  <p className="text-xs text-subtle">Nada a acreditarse</p>
                )}
              </div>
              <button
                type="button"
                disabled={b.available <= 0}
                onClick={() => setConverting(b.code)}
                title={b.available > 0 ? `Pasar a ${main}` : "Todavía no hay saldo disponible para convertir"}
                className="ml-1 inline-flex h-8 shrink-0 items-center gap-1.5 rounded-lg border border-border px-2.5 text-xs font-medium text-muted transition hover:border-violet-500/40 hover:bg-violet-500/10 hover:text-foreground disabled:pointer-events-none disabled:opacity-35"
              >
                <ArrowRightLeft className="size-3.5" /> Convertir
              </button>
            </li>
          ))}
        </ul>
      </div>

      {/* Moneda principal */}
      <div className="relative border-t border-border p-6">
        <p className="text-xs font-medium uppercase tracking-wider text-subtle">Tu moneda principal</p>
        <div role="radiogroup" aria-label="Moneda principal" className="mt-3 grid grid-cols-2 gap-3">
          {(["USD", "EUR"] as const).map((c) => {
            const active = c === main;
            return (
              <button
                key={c}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => onChangeMain(c)}
                className={`relative flex items-center gap-3 rounded-xl border px-4 py-3 text-left transition ${
                  active ? "border-brand bg-brand-soft ring-4 ring-violet-500/10" : "border-border hover:border-violet-500/40 hover:bg-violet-500/5"
                }`}
              >
                <Flag code={c} />
                <span>
                  <span className="block text-sm font-semibold">{c}</span>
                  <span className="block text-xs text-subtle">{CURRENCIES[c].name}</span>
                </span>
                {active && <Check className="absolute right-3 top-3 size-4 text-violet-300" />}
              </button>
            );
          })}
        </div>
        <p className="mt-3 flex gap-2 text-xs leading-relaxed text-subtle">
          <Info className="mt-0.5 size-3.5 shrink-0" />
          Cada venta entra en la moneda en la que pagó el comprador (la que vio en tu checkout). Cuando se acredita, la pasás a tu
          moneda principal con «Convertir», a la tasa de la pasarela.
        </p>
      </div>

      <ConvertSheet
        code={converting}
        main={main}
        balance={balances.find((b) => b.code === converting)}
        onClose={() => setConverting(null)}
        onConfirm={onConvert}
      />
    </div>
  );
}

// Panel para pasar un saldo de otra moneda a la moneda principal. Por ahora simula la conversión.
function ConvertSheet({
  code,
  main,
  balance,
  onClose,
  onConfirm,
}: {
  code: string | null;
  main: MainCurrency;
  balance?: CurrencyBalance;
  onClose: () => void;
  onConfirm: (code: string, amount: number) => void;
}) {
  const [amountText, setAmountText] = useState("");
  const [step, setStep] = useState<"form" | "sending" | "done">("form");
  const [doneAmount, setDoneAmount] = useState(0);

  const amount = Number(amountText.replace(",", ".")) || 0;
  const available = balance?.available ?? 0;
  const rate = code ? convert(1, code, main) : 0;
  const result = code ? convert(amount, code, main) : 0;
  const error = amount > available ? `Tenés ${code ? fmt(available, code) : ""} disponibles.` : null;
  const canSubmit = amount > 0 && !error;

  const close = () => {
    onClose();
    setTimeout(() => {
      setAmountText("");
      setStep("form");
    }, 300);
  };

  return (
    <Sheet
      open={!!code}
      onClose={close}
      title={code ? `Convertir ${code} a ${main}` : ""}
      description={code && balance ? `Disponible: ${fmt(balance.available, code)}` : undefined}
      footer={
        step === "done" ? (
          <button type="button" onClick={close} className={primaryButton}>
            Listo
          </button>
        ) : (
          <>
            <button type="button" onClick={close} className={secondaryButton}>
              Cancelar
            </button>
            <button
              type="button"
              disabled={!canSubmit || step === "sending"}
              onClick={() => {
                if (!code) return;
                setStep("sending");
                setTimeout(() => {
                  onConfirm(code, amount);
                  setDoneAmount(result);
                  setStep("done");
                }, 900);
              }}
              className={primaryButton}
            >
              {step === "sending" ? <Loader2 className="size-4 animate-spin" /> : <ArrowRightLeft className="size-4" />}
              {step === "sending" ? "Convirtiendo…" : "Convertir"}
            </button>
          </>
        )
      }
    >
      {code &&
        (step === "done" ? (
          <div className="flex flex-col items-center py-8 text-center">
            <span className="grid size-14 place-items-center rounded-full bg-emerald-500/10 text-emerald-400">
              <Check className="size-7" />
            </span>
            <p className="mt-4 font-medium">Sumaste {fmt(doneAmount, main)} a tu saldo</p>
            <p className="mt-1 text-sm text-muted">Ya los podés retirar.</p>
          </div>
        ) : (
          <>
            <div>
              <label htmlFor="convert-amount" className="mb-2 block text-sm font-medium">
                Cuánto convertís
              </label>
              <div className="flex items-center gap-2 rounded-xl border border-border bg-background px-4 transition focus-within:border-violet-500/60 focus-within:ring-4 focus-within:ring-violet-500/10">
                <Flag code={code} size="size-7" />
                <input
                  id="convert-amount"
                  inputMode="decimal"
                  value={amountText}
                  onChange={(e) => setAmountText(e.target.value.replace(/[^\d.,]/g, ""))}
                  placeholder="0"
                  autoFocus
                  className="h-16 min-w-0 flex-1 bg-transparent text-3xl font-semibold tabular-nums placeholder:text-subtle focus:outline-none"
                />
                <span className="text-sm text-subtle">{code}</span>
                <button
                  type="button"
                  onClick={() => setAmountText(String(available))}
                  className="rounded-md bg-surface-2 px-2.5 py-1 text-xs font-medium text-muted transition hover:text-foreground"
                >
                  Todo
                </button>
              </div>
              {error && (
                <p className="mt-2 flex items-center gap-1.5 text-xs text-rose-400">
                  <CircleAlert className="size-3.5" /> {error}
                </p>
              )}
            </div>

            <div className="flex items-center justify-center text-subtle">
              <ArrowRightLeft className="size-4 rotate-90" />
            </div>

            <div className="flex items-center gap-3 rounded-xl border border-border bg-background/40 px-4 py-4">
              <Flag code={main} size="size-7" />
              <span className="flex-1 text-sm text-muted">Recibís aprox.</span>
              <span className="text-2xl font-semibold tabular-nums">{fmt(result, main)}</span>
            </div>

            <dl className="space-y-2 rounded-xl border border-border bg-background/40 p-4 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted">Tasa de referencia</dt>
                <dd className="tabular-nums">
                  1 {code} = {formatCurrency(rate, main, rate < 0.01 ? 5 : 4)}
                </dd>
              </div>
              <p className="text-xs leading-relaxed text-subtle">
                La tasa final la define la pasarela en el momento de convertir y puede incluir su comisión de cambio.
              </p>
            </dl>
          </>
        ))}
    </Sheet>
  );
}
