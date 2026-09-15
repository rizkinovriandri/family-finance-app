import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Keuangan Keluarga",
    short_name: "Keuangan Keluarga",
    description: "Pencatatan keuangan kolaboratif untuk keluarga",
    start_url: "/dashboard",
    display: "standalone",
    background_color: "#0E263D",
    theme_color: "#0E263D",
    icons: [
      { src: "/icon-192", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-192", sizes: "192x192", type: "image/png", purpose: "maskable" },
      { src: "/icon-512", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon-512", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
