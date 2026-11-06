import { AR, CL, CO, ES, MX, UY, type FlagComponent } from "country-flag-icons/react/3x2";
import { AR as AR1, CL as CL1, CO as CO1, EU as EU1, MX as MX1, US as US1 } from "country-flag-icons/react/1x1";
import { Globe2 } from "lucide-react";
import { COUNTRY_CODES } from "@/lib/mock-data";

// Banderas en SVG (paquete country-flag-icons, MIT): se ven igual en todos los sistemas,
// a diferencia de los emojis, que en Windows salen como letras ("AR").
// Se importan solo las que se usan para no sumar las ~250 al bundle: al aparecer un país nuevo,
// agregar su código ISO acá y en COUNTRY_CODES.
const FLAGS: Record<string, FlagComponent> = { AR, CL, CO, ES, MX, UY };

export function CountryFlag({ country, className = "" }: { country: string; className?: string }) {
  const code = COUNTRY_CODES[country];
  const Flag = code ? FLAGS[code] : undefined;
  if (!Flag) return <Globe2 aria-hidden className={`h-3.5 w-5 shrink-0 text-subtle ${className}`} />;
  return (
    <Flag
      role="img"
      aria-label={country}
      className={`h-3.5 w-5 shrink-0 rounded-[3px] shadow-[0_0_0_1px_rgba(255,255,255,0.08)] ${className}`}
    />
  );
}

// Bandera cuadrada (1x1) recortada en círculo, para los círculos de la Wallet.
// Recibe el código ISO del país (o "EU" para el euro). Mismo criterio: solo se importan las que se usan.
const ROUND_FLAGS: Record<string, FlagComponent> = { AR: AR1, CL: CL1, CO: CO1, EU: EU1, MX: MX1, US: US1 };

export function RoundFlag({ code, label, className = "size-8" }: { code: string; label?: string; className?: string }) {
  const Flag = ROUND_FLAGS[code];
  return (
    <span className={`grid shrink-0 place-items-center overflow-hidden rounded-full bg-surface-2 ring-1 ring-inset ring-white/10 ${className}`}>
      {Flag ? (
        <Flag role="img" aria-label={label ?? code} className="size-full" />
      ) : (
        <Globe2 aria-hidden className="size-1/2 text-subtle" />
      )}
    </span>
  );
}
