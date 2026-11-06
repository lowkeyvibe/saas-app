"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowDown, ArrowRight, ArrowRightLeft, Check, CircleAlert, Loader2, X } from "lucide-react";
import { primaryButton } from "@/components/settings/settings-ui";
import { playSuccess } from "@/lib/sounds";
import { formatCurrency } from "@/lib/format";
import { convert, CURRENCIES, type CurrencyBalance, type MainCurrency } from "@/lib/mock-wallet";

export const fmt = (value: number, code: string) => formatCurrency(value, code, CURRENCIES[code].decimals);

export function Flag({ code, size = "size-8" }: { code: string; size?: string }) {
  return (
    <span className={`grid ${size} shrink-0 place-items-center overflow-hidden rounded-full border border-border bg-surface-2 text-base leading-none`}>
      {CURRENCIES[code].flag}
    </span>
  );
}

// Ventana en el centro de la pantalla para pasar un saldo de otra moneda a la moneda principal.
// "Convertís" arriba, "Recibís" abajo, y en el medio el ícono de cambio. Por ahora simula la conversión.
// (Se sigue llamando ConvertSheet para no cambiar dónde se usa.)
export function ConvertSheet({
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
  const [done, setDone] = useState({ amount: 0, received: 0 });
  const inputRef = useRef<HTMLInputElement>(null);

  const open = !!code;
  const available = balance?.available ?? 0;
  const amount = Number(amountText.replace(",", ".")) || 0;
  const rate = code ? convert(1, code, main) : 0;
  const result = code ? convert(amount, code, main) : 0;
  const tooMuch = amount > available;
  const canSubmit = amount > 0 && !tooMuch && step === "form";

  const close = useCallback(() => {
    onClose();
    setTimeout(() => {
      setAmountText("");
      setStep("form");
    }, 200);
  }, [onClose]);

  // Escape cierra; la página de atrás no se desplaza mientras está abierta.
  useEffect(() => {
    if (!open) return;
    requestAnimationFrame(() => inputRef.current?.focus());
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    window.addEventListener("keydown", onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
    };
  }, [open, close]);

  if (!code) return null;

  const decimals = CURRENCIES[code].decimals;
  const setPart = (part: number) => setAmountText(String(Math.floor(available * part * 10 ** decimals) / 10 ** decimals));

  const submit = () => {
    if (!canSubmit) return;
    setStep("sending");
    setTimeout(() => {
      onConfirm(code, amount);
      setDone({ amount, received: result });
      setStep("done");
      playSuccess(); // "cha-ching" de dinero
    }, 900);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label={`Convertir ${code} a ${main}`}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm transition-opacity duration-200 starting:opacity-0" onClick={close} />

      <div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-violet-500/25 bg-surface shadow-2xl shadow-violet-950/50 transition duration-300 ease-out starting:translate-y-3 starting:scale-95 starting:opacity-0">
        {/* Brillos de fondo */}
        <div aria-hidden className="pointer-events-none absolute -top-24 left-1/2 h-48 w-80 -translate-x-1/2 rounded-full bg-violet-600/30 blur-3xl" />

        <button
          type="button"
          onClick={close}
          aria-label="Cerrar"
          className="absolute right-4 top-4 z-10 grid size-8 place-items-center rounded-full text-muted transition hover:bg-overlay/10 hover:text-foreground"
        >
          <X className="size-4" />
        </button>

        {step === "done" ? (
          // ── Listo ──
          <div className="relative flex flex-col items-center px-8 pb-8 pt-12 text-center">
            <span className="relative grid size-20 place-items-center">
              <span className="absolute inset-0 animate-ping rounded-full bg-emerald-400/20 [animation-iteration-count:2]" />
              <span className="relative grid size-20 place-items-center rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 text-white shadow-[0_0_40px_rgba(52,211,153,0.45)] transition duration-500 starting:scale-50">
                <Check className="size-10" strokeWidth={3} />
              </span>
            </span>
            <p className="mt-6 text-sm text-muted">Sumaste a tu saldo</p>
            <p className="mt-1 text-4xl font-semibold tracking-tight tabular-nums">{formatCurrency(done.received, main)}</p>
            <p className="mt-3 flex items-center gap-2 text-sm text-muted">
              <Flag code={code} size="size-6" /> {fmt(done.amount, code)}
              <ArrowRight className="size-3.5 text-violet-400" />
              <Flag code={main} size="size-6" /> {formatCurrency(done.received, main)}
            </p>
            <p className="mt-1 text-xs text-subtle">Ya lo podés retirar desde tu Wallet.</p>
            <button type="button" onClick={close} className={`${primaryButton} mt-8 h-11 w-full rounded-xl text-base`}>
              Listo
            </button>
          </div>
        ) : (
          // ── Convertir ──
          <div className="relative p-6 pt-7">
            <p className="text-center text-lg font-semibold">Convertí a {main}</p>
            <p className="mt-1 text-center text-sm text-muted">Tenés {fmt(available, code)} disponibles</p>

            {/* Convertís */}
            <div
              className={`mt-6 rounded-2xl border bg-background/60 p-4 transition focus-within:border-violet-500/60 focus-within:ring-4 focus-within:ring-violet-500/10 ${
                tooMuch ? "border-rose-500/60" : "border-border"
              }`}
            >
              <div className="flex items-center justify-between text-xs text-subtle">
                <span>Convertís</span>
                <div className="flex gap-1">
                  {[
                    ["25%", 0.25],
                    ["50%", 0.5],
                    ["Todo", 1],
                  ].map(([label, part]) => (
                    <button
                      key={label}
                      type="button"
                      onClick={() => setPart(part as number)}
                      className="rounded-md bg-surface-2 px-2 py-0.5 font-medium text-muted transition hover:bg-violet-500/20 hover:text-violet-200"
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="mt-2 flex items-center gap-3">
                <input
                  ref={inputRef}
                  inputMode="decimal"
                  value={amountText}
                  onChange={(e) => setAmountText(e.target.value.replace(/[^\d.,]/g, ""))}
                  onKeyDown={(e) => e.key === "Enter" && submit()}
                  placeholder="0"
                  aria-label={`Monto en ${code}`}
                  className="min-w-0 flex-1 bg-transparent text-4xl font-semibold tracking-tight tabular-nums placeholder:text-subtle/60 focus:outline-none"
                />
                <span className="flex shrink-0 items-center gap-2 rounded-full border border-border bg-surface-2 py-1 pl-1 pr-3">
                  <Flag code={code} size="size-7" />
                  <span className="text-sm font-semibold">{code}</span>
                </span>
              </div>
              {tooMuch && (
                <p className="mt-2 flex items-center gap-1.5 text-xs text-rose-400">
                  <CircleAlert className="size-3.5" /> Tenés {fmt(available, code)} disponibles.
                </p>
              )}
            </div>

            {/* Ícono de cambio */}
            <div className="relative z-10 -my-3 flex justify-center">
              <span className="grid size-11 place-items-center rounded-full border-4 border-surface bg-brand text-white shadow-[0_0_24px_rgba(139,92,246,0.55)]">
                <ArrowDown className="size-5" />
              </span>
            </div>

            {/* Recibís */}
            <div className="rounded-2xl border border-violet-500/30 bg-brand-soft p-4">
              <div className="flex items-center justify-between text-xs text-subtle">
                <span>Recibís aprox.</span>
                <span className="tabular-nums">
                  1 {code} = {formatCurrency(rate, main, rate < 0.01 ? 5 : 4)}
                </span>
              </div>
              <div className="mt-2 flex items-center gap-3">
                <p className={`min-w-0 flex-1 truncate text-4xl font-semibold tracking-tight tabular-nums ${amount ? "text-violet-200" : "text-subtle/60"}`}>
                  {formatCurrency(result, main).replace(/^(US\$|€)\s/, "")}
                </p>
                <span className="flex shrink-0 items-center gap-2 rounded-full border border-violet-500/30 bg-surface-2 py-1 pl-1 pr-3">
                  <Flag code={main} size="size-7" />
                  <span className="text-sm font-semibold">{main}</span>
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={submit}
              disabled={!canSubmit && step !== "sending"}
              className={`${primaryButton} mt-6 h-12 w-full rounded-xl text-base`}
            >
              {step === "sending" ? (
                <>
                  <Loader2 className="size-5 animate-spin" /> Convirtiendo…
                </>
              ) : (
                <>
                  <ArrowRightLeft className="size-5" /> Convertir {code} a {main}
                </>
              )}
            </button>
            <p className="mt-3 text-center text-xs leading-relaxed text-subtle">
              La tasa final la define la pasarela en el momento de convertir y puede incluir su comisión de cambio.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
