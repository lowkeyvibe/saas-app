import { redirect } from "next/navigation";

// Por ahora la raíz manda directo al panel. Más adelante acá va la landing.
export default function Home() {
  redirect("/dashboard");
}
