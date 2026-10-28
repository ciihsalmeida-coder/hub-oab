import type { MetadataRoute } from "next";

// Permite "Adicionar à tela inicial": o hub abre em tela cheia, como um app.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "XIV Congresso OAB · Direito Marítimo, Portuário e Aduaneiro",
    short_name: "Congresso OAB",
    description: "Programação, resumos, cortes e fotos do XIV Congresso.",
    start_url: "/",
    display: "standalone",
    background_color: "#eef2f5",
    theme_color: "#0f2a44",
    lang: "pt-BR",
    icons: [
      { src: "/icone-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icone-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icone-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
