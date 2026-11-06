"use client";

import { useState } from "react";
import { Check, Loader2, RefreshCw } from "lucide-react";
import { site } from "@/config/site";
import { useStore } from "../store-context";
import { Block, CopyField, Notice, Row, Section, StatusPill, TextInput, primaryButton, secondaryButton } from "../settings-ui";

// Limpia lo que escribe el vendedor: sin https://, sin www. y sin barra final.
function cleanDomain(input: string) {
  return input
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .replace(/\/.*$/, "");
}

// Pasos del dominio propio: 1) escribirlo, 2) cargar los DNS, 3) conectado.
const STEPS = ["Tu dominio", "Registros DNS", "Conectado"];

export function DominioTab() {
  const store = useStore();
  const platformAddress = `${store.subdomain}.${site.name.toLowerCase()}.app`;
  const [input, setInput] = useState("");
  const [domain, setDomain] = useState<string | null>(store.customDomain?.domain ?? null);
  const [checking, setChecking] = useState(false);
  const [checkedOnce, setCheckedOnce] = useState(false);
  const verified = !!store.customDomain?.verified && domain === store.customDomain.domain;
  const step = verified ? 2 : domain ? 1 : 0;

  const cleaned = cleanDomain(input);
  const valid = /^[a-z0-9-]+(\.[a-z0-9-]+)+$/.test(cleaned);
  const records = [
    { type: "A", name: "@", value: "76.76.21.21" },
    { type: "CNAME", name: "www", value: `cname.${site.name.toLowerCase()}.app` },
  ];

  return (
    <>
      <Section title="Direcciones">
        <Row label="Dirección de la plataforma" description="Siempre funciona, aunque tengas dominio propio.">
          <CopyField value={`https://${platformAddress}`} />
        </Row>
        <Row label="Dominio propio" description={verified ? "Con certificado de seguridad (https) incluido." : "Todavía no conectaste uno."}>
          {verified ? (
            <div className="flex items-center gap-2">
              <div className="min-w-0 flex-1">
                <CopyField value={`https://${domain}`} />
              </div>
              <StatusPill tone="ok">Conectado</StatusPill>
            </div>
          ) : (
            <StatusPill tone={domain ? "pending" : "off"}>{domain ? "Esperando DNS" : "Sin dominio"}</StatusPill>
          )}
        </Row>
      </Section>

      <Section title={verified ? "Cambiar de dominio" : "Conectar tu dominio"} description="Usá tu propia dirección, por ejemplo tuempresa.com.">
        {/* Pasos */}
        <Block>
          <ol className="flex items-center gap-2 text-xs">
            {STEPS.map((label, i) => (
              <li key={label} className="flex flex-1 items-center gap-2">
                <span
                  className={`grid size-6 shrink-0 place-items-center rounded-full border text-[11px] font-semibold tabular-nums ${
                    i < step || (verified && i === step)
                      ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-400"
                      : i === step
                        ? "border-brand bg-brand text-white"
                        : "border-border text-subtle"
                  }`}
                >
                  {i < step || (verified && i === step) ? <Check className="size-3.5" /> : i + 1}
                </span>
                <span className={i === step ? "font-medium text-foreground" : "text-subtle"}>{label}</span>
                {i < STEPS.length - 1 && <span className="h-px flex-1 bg-border" />}
              </li>
            ))}
          </ol>
        </Block>

        {step === 0 && (
          // onInput se frena: el dominio se conecta con su botón, no con "Guardar".
          <Block>
            <div onInput={(e) => e.stopPropagation()}>
              <div className="flex flex-col gap-2 sm:flex-row">
                <div className="flex-1">
                  <TextInput
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="tuempresa.com"
                    aria-label="Tu dominio"
                    autoComplete="off"
                    spellCheck={false}
                  />
                </div>
                <button type="button" disabled={!valid} onClick={() => setDomain(cleaned)} className={`${primaryButton} h-10`}>
                  Continuar
                </button>
              </div>
              <p className="mt-1.5 text-xs text-subtle">
                Con o sin www, lo resolvemos nosotros.
                {input && !valid && <span className="text-amber-400"> Revisá que esté bien escrito.</span>}
              </p>
            </div>
          </Block>
        )}

        {step === 1 && (
          <>
            <Block>
              <p className="text-sm text-muted">
                En el panel donde compraste <strong className="font-medium text-foreground">{domain}</strong> (GoDaddy, Namecheap,
                NIC Argentina, Cloudflare…) cargá estos registros:
              </p>
            </Block>
            {records.map((r) => (
              <Row key={r.type} label={`${r.type} · ${r.name}`} description={r.type === "A" ? "El dominio sin www." : "La versión con www."}>
                <CopyField value={r.value} />
              </Row>
            ))}
            <Block className="space-y-3">
              {checkedOnce && !checking && (
                <Notice tone="warning" icon={RefreshCw}>
                  Todavía no vemos los registros. Pueden tardar hasta 48 horas; lo revisamos solos y te avisamos.
                </Notice>
              )}
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={checking}
                  onClick={() => {
                    setChecking(true);
                    // Por ahora simula la verificación: todavía no hay API de dominios conectada.
                    setTimeout(() => {
                      setChecking(false);
                      setCheckedOnce(true);
                    }, 1200);
                  }}
                  className={primaryButton}
                >
                  {checking ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
                  {checking ? "Verificando…" : "Ya los cargué, verificar"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setDomain(null);
                    setCheckedOnce(false);
                  }}
                  className={secondaryButton}
                >
                  Usar otro dominio
                </button>
              </div>
            </Block>
          </>
        )}

        {step === 2 && (
          <Block className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <p className="flex-1 text-sm text-muted">
              Tu tienda funciona en <strong className="font-medium text-foreground">{domain}</strong>. Si lo cambiás, la dirección
              actual deja de funcionar cuando conectes la nueva.
            </p>
            <button type="button" onClick={() => setDomain(null)} className={secondaryButton}>
              Cambiar dominio
            </button>
          </Block>
        )}
      </Section>
    </>
  );
}
