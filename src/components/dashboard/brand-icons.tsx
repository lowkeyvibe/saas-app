import Image from "next/image";
import { Landmark, Mail, MousePointerClick, type LucideIcon } from "lucide-react";

// Logos oficiales a color, en public/brands/. Fuentes:
// - Facebook, Google, TikTok: Iconify "logos" (gilbarbara/logos, CC0).
// - Instagram, PayPal, Mercado Pago: Iconify "thesvg-color" (thesvg.org, MIT).
// - Stripe: path de Simple Icons (CC0), en blanco sobre el violeta de marca, como su ícono de app.
// TikTok: la nota negra se pasó a blanco para que se lea sobre el fondo negro de su ícono.

// Todas las marcas se muestran como ícono de app: el cuadradito entero con el fondo de la marca,
// así todas miden lo mismo. `fill`: el SVG ya es el ícono completo (trae su propio fondo).
// `logo`: tamaño del logo dentro del cuadradito, ajustado a ojo según la forma de cada uno.
type IconSpec = { src?: string; icon?: LucideIcon; bg: string; fill?: boolean; logo?: string; color?: string };

const SPECS: Record<string, IconSpec> = {
  // Canales
  "Facebook Ads": { src: "/brands/facebook.svg", bg: "bg-[#1877F2]", logo: "size-[88%]" }, // el círculo se funde con el fondo: queda la "f" blanca
  Instagram: { src: "/brands/instagram.svg", bg: "", fill: true },
  TikTok: { src: "/brands/tiktok.svg", bg: "bg-black ring-1 ring-inset ring-white/10", logo: "size-[60%]" },
  Google: { src: "/brands/google.svg", bg: "bg-white", logo: "size-[58%]" },
  Email: { icon: Mail, color: "text-violet-300", bg: "bg-violet-500/10" },
  Directo: { icon: MousePointerClick, color: "text-muted", bg: "bg-overlay/[0.06]" },
  // Medios de pago
  "Mercado Pago": { src: "/brands/mercadopago.svg", bg: "bg-white", logo: "size-[78%]" },
  Stripe: { src: "/brands/stripe.svg", bg: "", fill: true },
  PayPal: { src: "/brands/paypal.svg", bg: "bg-white", logo: "size-[58%]" },
  Transferencia: { icon: Landmark, color: "text-muted", bg: "bg-overlay/[0.06]" },
};

// Cuadradito con el logo. Si el nombre no tiene ícono, no muestra nada.
export function SourceIcon({ name, size = "size-6" }: { name: string; size?: string }) {
  const spec = SPECS[name];
  if (!spec) return null;
  return (
    <span className={`relative grid ${size} shrink-0 place-items-center overflow-hidden rounded-lg ${spec.bg} ${spec.color ?? ""}`}>
      {spec.src ? (
        spec.fill ? (
          <Image src={spec.src} alt="" fill unoptimized className="object-contain" />
        ) : (
          <Image src={spec.src} alt="" width={28} height={28} unoptimized className={`${spec.logo} object-contain`} />
        )
      ) : (
        spec.icon && <spec.icon className="size-3.5" />
      )}
    </span>
  );
}
