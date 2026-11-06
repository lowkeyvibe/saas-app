"use client";

import { useState } from "react";
import { useStore } from "../store-context";
import { Block, Row, Section, SwitchRow, TextInput } from "../settings-ui";

// Cuánto suma cada dato del comprador a la coincidencia de eventos de Meta (puntaje de 0 a 10).
// Son valores orientativos, para que el vendedor vea el impacto de pedir o no cada campo.
const FIELDS = [
  { key: "telefono", title: "Teléfono", boost: 2.4, impact: "+44 % de coincidencia en Meta" },
  { key: "nombre", title: "Nombre", boost: 1.2, impact: "+25 % de coincidencia en Meta" },
  { key: "apellido", title: "Apellido", boost: 1.2, impact: "+25 % de coincidencia en Meta" },
  { key: "pais", title: "País", boost: 0.6, impact: "Un poco más de coincidencia y sabés de dónde compran" },
] as const;
type FieldKey = (typeof FIELDS)[number]["key"];
const EMAIL_SCORE = 4;

export function CheckoutTab() {
  const store = useStore();
  const [enabled, setEnabled] = useState<Record<FieldKey, boolean>>({
    telefono: true,
    nombre: true,
    apellido: false,
    pais: true,
  });
  const [hideUpsellDescription, setHideUpsellDescription] = useState(false);

  const score = EMAIL_SCORE + FIELDS.reduce((a, f) => a + (enabled[f.key] ? f.boost : 0), 0);
  const level = score >= 8 ? "Alta" : score >= 6 ? "Buena" : "Baja";
  const asked = 1 + FIELDS.filter((f) => enabled[f.key]).length;

  return (
    <>
      <Section title="Lo que ve el comprador">
        <Row label="Nombre en el checkout" htmlFor="checkout-name" description="En el checkout, las ofertas y la página de gracias. Vacío = el de la tienda.">
          <TextInput id="checkout-name" placeholder={store.name} />
        </Row>
        <SwitchRow
          title="Ocultar la descripción de los upsells"
          description="Cada oferta del checkout muestra solo el nombre y el precio."
          checked={hideUpsellDescription}
          onChange={setHideUpsellDescription}
        />
      </Section>

      <Section
        title="Datos que le pedís"
        description="Más datos: Meta reconoce mejor a quién le vendiste. Menos datos: un checkout más corto."
      >
        {/* Medidor en vivo: cambia al prender o apagar cada campo. */}
        <Block>
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-xs text-subtle">Calidad de coincidencia estimada</p>
              <p className="mt-1 text-2xl font-semibold tabular-nums tracking-tight">
                {score.toFixed(1)}
                <span className="text-base font-normal text-subtle"> / 10</span>
              </p>
            </div>
            <div className="text-right">
              <p className={`text-sm font-medium ${level === "Baja" ? "text-amber-400" : "text-emerald-400"}`}>{level}</p>
              <p className="text-xs text-subtle">{asked} campos en el checkout</p>
            </div>
          </div>
          <div className="mt-3 flex gap-1">
            {Array.from({ length: 10 }, (_, i) => (
              <span
                key={i}
                className={`h-1.5 flex-1 rounded-full transition-colors duration-300 ${i < Math.round(score) ? "bg-brand" : "bg-surface-2"}`}
              />
            ))}
          </div>
        </Block>
        <SwitchRow title="Email" description="Siempre se pide: ahí le llega el producto." checked onChange={() => {}} disabled />
        {FIELDS.map((f) => (
          <SwitchRow
            key={f.key}
            title={f.title}
            description={f.impact}
            checked={enabled[f.key]}
            onChange={(v) => setEnabled((e) => ({ ...e, [f.key]: v }))}
          />
        ))}
      </Section>
    </>
  );
}
