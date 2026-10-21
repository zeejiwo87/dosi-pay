
import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-dosi",
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: {
    default: "DOSI Pay",
    template: "%s | DOSI Pay",
  },

  description:
    "DOSI Pay adalah platform keuangan digital pesantren yang membantu wali santri, koperasi, dan manajemen pesantren mengelola keuangan secara mudah dan transparan.",

  applicationName: "DOSI Pay",

  keywords: [
    "DOSI Pay",
    "Dompet Santri",
    "Keuangan Pesantren",
    "Pembayaran Digital Santri",
    "Sistem Keuangan Pesantren",
  ],

  manifest: "/manifest.webmanifest",

  icons: {
    icon: [
      {
        url: "/favicon-io/favicon.ico",
        sizes: "any",
      },
      {
        url: "/favicon-io/favicon-32x32.png",
        sizes: "32x32",
        type: "image/png",
      },
      {
        url: "/favicon-io/favicon-16x16.png",
        sizes: "16x16",
        type: "image/png",
      },
    ],
    apple: [
      {
        url: "/favicon-io/apple-touch-icon.png",
        sizes: "180x180",
        type: "image/png",
      },
    ],
    shortcut: "/favicon-io/favicon.ico",
  },

  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "DOSI Pay",
  },

  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#105D38",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="id"
      className={`${plusJakartaSans.variable} antialiased`}
    >
      <body
        className={`${plusJakartaSans.className} min-h-screen bg-white text-[#1D2923]`}
      >
        {children}
      </body>
    </html>
  );
}
