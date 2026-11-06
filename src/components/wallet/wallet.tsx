"use client";

import { useState } from "react";
import {
  ArrowDownToLine,
  CalendarClock,
  Check,
  CircleAlert,
  Loader2,
  Landmark,
  ShieldCheck,
} from "lucide-react";
import { Card, CardHeader } from "@/components/dashboard/ui";
import { CurrencyBalanceCard } from "./currency-balance";
import { SettlementsCard } from "./settlements-card";
import { AccountsSheet, METHOD_ICON, type AccountsView } from "./accounts";
import { Sheet, primaryButton, secondaryButton } from "@/components/settings/settings-ui";
import { formatCurrency } from "@/lib/format";
import {
  balance,
  convert,
  currencyBalances,
  payoutMethods,
  withdrawals as initialWithdrawals,
  type CurrencyBalance,
  type MainCurrency,
  type PayoutMethod,
  type Withdrawal,
  type WithdrawalStatus,
} from "@/lib/mock-wallet";

const MIN_WITHDRAWAL = 10;

const shortDate = (iso: string) =>
  new Intl.DateTimeFormat("es-AR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "UTC" }).format(new Date(iso));


const STATUS: Record<WithdrawalStatus, { label: string; className: string }> = {
  acreditado: { label: "Acreditado", className: "bg-emerald-500/10 text-emerald-400 ring-emerald-500/20" },
  "en-proceso": { label: "En camino", className: "bg-amber-500/10 text-amber-400 ring-amber-500/20" },
  rechazado: { label: "Rechazado", className: "bg-rose-500/10 text-rose-400 ring-rose-500/20" },
};

export function Wallet() {
  const [main, setMain] = useState<MainCurrency>("USD");
  const [balances, setBalances] = useState<CurrencyBalance[]>(currencyBalances);
  const available = balances.find((b) => b.code === main)!.available;
  const [history, setHistory] = useState<Withdrawal[]>(initialWithdrawals);
  const [withdrawing, setWithdrawing] = useState(false);
  // Cuentas para retirar y la elegida en el desplegable (ninguna al principio: hay que elegir).
  const [accounts, setAccounts] = useState<PayoutMethod[]>(payoutMethods);
  const [accountId, setAccountId] = useState<string | null>(null);
  // Panel "Cuentas": cerrado (null), la lista, agregar o editar una.
  const [accountsView, setAccountsView] = useState<AccountsView | null>(null);
  const account = accounts.find((a) => a.id === accountId);

  // Retiros en camino, pasados a la moneda principal.
  const inTransit = history
    .filter((w) => w.status === "en-proceso")
    .reduce((a, w) => a + convert(w.amount, w.currency ?? "USD", main), 0);

  return (
    <>
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Wallet</h1>
          <p className="mt-1 text-sm text-muted">Tu plata: lo que podés retirar, lo que está por liberarse y a dónde la mandás.</p>
        </div>
        <button type="button" onClick={() => setAccountsView("lista")} className={`${primaryButton} self-start sm:self-auto`}>
          <Landmark className="size-4" /> Cuentas
          <span className="grid h-5 min-w-5 place-items-center rounded-full bg-white/20 px-1.5 text-[11px] tabular-nums">{accounts.length}</span>
        </button>
      </div>

      {/* Dos cards del mismo tamaño: saldos por moneda y acreditaciones por fecha. */}
      <div className="grid gap-4 lg:grid-cols-2">
        <CurrencyBalanceCard
          main={main}
          balances={balances}
          onChangeMain={setMain}
          onWithdraw={() => account && setWithdrawing(true)}
          accounts={accounts}
          accountId={accountId}
          onSelectAccount={setAccountId}
          onAddAccount={() => setAccountsView("agregar")}
          onConvert={(code, amount) =>
            setBalances((list) =>
              list.map((b) =>
                b.code === code
                  ? { ...b, available: Math.round((b.available - amount) * 100) / 100 }
                  : b.code === main
                    ? { ...b, available: Math.round((b.available + convert(amount, code, main)) * 100) / 100 }
                    : b,
              ),
            )
          }
        />
        {/* Mismo alto que la card de saldos: la lista de fechas scrollea adentro. */}
        <div className="relative lg:min-h-[32rem]">
          <SettlementsCard main={main} className="lg:absolute lg:inset-0" />
        </div>
      </div>

      {/* Historial de retiros */}
      <Card className="mt-4 overflow-hidden">
        <CardHeader
          title="Historial de retiros"
          description={`${history.length} retiros`}
          action={
            <div className="flex gap-6 text-right text-xs">
              <div>
                <p className="text-subtle">Retirado este mes</p>
                <p className="mt-0.5 text-sm font-medium tabular-nums">
                  {formatCurrency(convert(balance.withdrawnThisMonth, "USD", main), main)}
                </p>
              </div>
              <div>
                <p className="text-subtle">En camino</p>
                <p className="mt-0.5 text-sm font-medium tabular-nums text-amber-400">
                  {inTransit ? formatCurrency(inTransit, main) : "Nada"}
                </p>
              </div>
            </div>
          }
        />
        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-y border-border text-left text-xs text-subtle">
                <th className="px-5 py-2.5 font-medium">Retiro</th>
                <th className="px-5 py-2.5 font-medium">Fecha</th>
                <th className="px-5 py-2.5 font-medium">Cuenta</th>
                <th className="px-5 py-2.5 font-medium">Estado</th>
                <th className="px-5 py-2.5 text-right font-medium">Monto</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {history.map((w) => {
                const method = accounts.find((m) => m.id === w.methodId);
                const st = STATUS[w.status];
                return (
                  <tr key={w.id} className="transition hover:bg-violet-500/10">
                    <td className="whitespace-nowrap px-5 py-3 font-medium tabular-nums">{w.id}</td>
                    <td className="whitespace-nowrap px-5 py-3 text-muted">{shortDate(w.date)}</td>
                    <td className="whitespace-nowrap px-5 py-3 text-muted">{method?.name ?? "—"}</td>
                    <td className="px-5 py-3">
                      <span
                        title={w.note}
                        className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${st.className}`}
                      >
                        <span className="size-1.5 rounded-full bg-current" />
                        {st.label}
                      </span>
                      {w.note && <p className="mt-1 text-xs text-subtle">{w.note}</p>}
                    </td>
                    <td className="whitespace-nowrap px-5 py-3 text-right font-medium tabular-nums">
                      {formatCurrency(w.amount, w.currency ?? "USD")}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      <AccountsSheet
        view={accountsView}
        onViewChange={setAccountsView}
        onClose={() => setAccountsView(null)}
        accounts={accounts}
        onAccountsChange={setAccounts}
        selectedId={accountId}
        onSelect={setAccountId}
        inUseIds={history.filter((w) => w.status === "en-proceso").map((w) => w.methodId)}
      />

      {account && (
      <WithdrawSheet
        open={withdrawing}
        method={account}
        available={available}
        currency={main}
        onClose={() => setWithdrawing(false)}
        onConfirm={(amount, methodId) => {
          setBalances((list) =>
            list.map((b) => (b.code === main ? { ...b, available: Math.round((b.available - amount) * 100) / 100 } : b)),
          );
          setHistory((h) => [
            { id: `RT-${20932 + h.length}`, date: new Date().toISOString(), amount, currency: main, methodId, status: "en-proceso" },
            ...h,
          ]);
        }}
      />
      )}
    </>
  );
}

// Panel para pedir un retiro. Por ahora simula la solicitud: no hay pasarela conectada.
function WithdrawSheet({
  open,
  available,
  currency,
  method,
  onClose,
  onConfirm,
}: {
  open: boolean;
  available: number;
  currency: MainCurrency;
  method: PayoutMethod;
  onClose: () => void;
  onConfirm: (amount: number, methodId: string) => void;
}) {
  const [amountText, setAmountText] = useState("");
  const [step, setStep] = useState<"form" | "sending" | "done">("form");

  const methodId = method.id;
  const MethodIcon = METHOD_ICON[method.kind];
  const money = (v: number) => formatCurrency(v, currency);
  const amount = Number(amountText.replace(",", ".")) || 0;
  const receive = Math.max(0, amount - method.fee);
  const error =
    amount > available
      ? `No podés retirar más de ${money(available)}.`
      : amount > 0 && amount < MIN_WITHDRAWAL
        ? `El mínimo es ${money(MIN_WITHDRAWAL)}.`
        : !method.verified
          ? "Esta cuenta todavía no está verificada."
          : null;
  const canSubmit = amount >= MIN_WITHDRAWAL && !error;

  const close = () => {
    onClose();
    // Se resetea al cerrar, para el próximo retiro.
    setTimeout(() => {
      setAmountText("");
      setStep("form");
    }, 300);
  };

  return (
    <Sheet
      open={open}
      onClose={close}
      title="Retirar dinero"
      description={`Disponible: ${money(available)}`}
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
                setStep("sending");
                setTimeout(() => {
                  onConfirm(amount, methodId);
                  setStep("done");
                }, 900);
              }}
              className={primaryButton}
            >
              {step === "sending" ? <Loader2 className="size-4 animate-spin" /> : <ArrowDownToLine className="size-4" />}
              {step === "sending" ? "Enviando…" : `Retirar ${amount ? money(amount) : ""}`}
            </button>
          </>
        )
      }
    >
      {step === "done" ? (
        <div className="flex flex-col items-center py-8 text-center">
          <span className="grid size-14 place-items-center rounded-full bg-emerald-500/10 text-emerald-400">
            <Check className="size-7" />
          </span>
          <p className="mt-4 font-medium">Pedimos tu retiro de {money(amount)}</p>
          <p className="mt-1 text-sm text-muted">
            Llega a {method.name} · {method.arrives.toLowerCase()}. Lo vas a ver en el historial como “En camino”.
          </p>
        </div>
      ) : (
        <>
          <div>
            <label htmlFor="withdraw-amount" className="mb-2 block text-sm font-medium">
              Monto
            </label>
            <div className="flex items-center gap-2 rounded-xl border border-border bg-background px-4 transition focus-within:border-violet-500/60 focus-within:ring-4 focus-within:ring-violet-500/10">
              <span className="text-lg text-subtle">{currency === "EUR" ? "€" : "US$"}</span>
              <input
                id="withdraw-amount"
                inputMode="decimal"
                value={amountText}
                onChange={(e) => setAmountText(e.target.value.replace(/[^\d.,]/g, ""))}
                placeholder="0.00"
                autoFocus
                className="h-16 min-w-0 flex-1 bg-transparent text-3xl font-semibold tabular-nums placeholder:text-subtle focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setAmountText(available.toFixed(2))}
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

          <div>
            <p className="mb-2 text-sm font-medium">A dónde</p>
            {/* La cuenta se elige en la card de saldos, antes de abrir este panel. */}
            <div className="flex items-center gap-3 rounded-xl border border-brand bg-brand-soft px-3 py-3">
              <MethodIcon className="size-4 shrink-0 text-violet-300" />
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-medium">{method.name}</span>
                <span className="block truncate text-xs text-subtle">{method.detail}</span>
              </span>
              <span className="text-right text-xs text-subtle">{method.arrives}</span>
            </div>
          </div>

          <dl className="space-y-2 rounded-xl border border-border bg-background/40 p-4 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted">Retirás</dt>
              <dd className="tabular-nums">{money(amount)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted">Comisión</dt>
              <dd className="tabular-nums">{method.fee ? `−${money(method.fee)}` : "Sin comisión"}</dd>
            </div>
            <div className="flex justify-between border-t border-border pt-2 font-medium">
              <dt>Te llega</dt>
              <dd className="tabular-nums">{money(receive)}</dd>
            </div>
            <p className="flex items-center gap-1.5 pt-1 text-xs text-subtle">
              <CalendarClock className="size-3.5" /> {method.arrives}
              <span className="mx-1">·</span>
              <ShieldCheck className="size-3.5" /> Retiro mínimo {money(MIN_WITHDRAWAL)}
            </p>
          </dl>
        </>
      )}
    </Sheet>
  );
}
