
import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "DOSI PAY",
    short_name: "DOSI PAY",
    description:
      "Sistem pembayaran digital dan manajemen keuangan pesantren.",

    start_url: "/",
    scope: "/",

    display: "standalone",

    background_color: "#FFFFFF",
    theme_color: "#105D38",

    lang: "id",

    icons: [
      {
        src: "/favicon-io/android-chrome-192x192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/favicon-io/android-chrome-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
    ],
  };
}
