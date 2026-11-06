import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // Para abrir el servidor de desarrollo desde el celular en la misma red wifi.
  // Si cambia la IP de la compu, hay que actualizarla acá.
  allowedDevOrigins: ["192.168.1.46"],
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
