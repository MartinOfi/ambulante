import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Ambulante — Tiendas cerca tuyo",
    short_name: "Ambulante",
    description:
      "Encontrá food trucks, puestos callejeros y vendedores ambulantes activos cerca tuyo, en tiempo real.",
    start_url: "/",
    display: "standalone",
    background_color: "#000000",
    theme_color: "#EA580C",
    orientation: "portrait",
    lang: "es",
    icons: [],
  };
}
