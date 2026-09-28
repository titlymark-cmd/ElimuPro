import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "ElimuPro — School Management",
    short_name: "ElimuPro",
    description: "Admission, fees, performance, and future planning for Kenyan schools — all in one place.",
    start_url: "/app",
    id: "/app",
    display: "standalone",
    background_color: "#05070f",
    theme_color: "#05070f",
    orientation: "portrait-primary",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
