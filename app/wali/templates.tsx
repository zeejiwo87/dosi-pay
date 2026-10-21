
"use client";

import type { ReactNode } from "react";

export default function WaliTemplate({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <div className="wali-page-transition">

      {children}

      <style jsx global>{`

        @keyframes waliPageEnter {
          from {
            opacity: 0;
          }

          to {
            opacity: 1;
          }
        }

        .wali-page-transition {
          min-height: 100dvh;

          animation: waliPageEnter 260ms ease-out both;
        }

        @media (prefers-reduced-motion: reduce) {
          .wali-page-transition {
            animation: none !important;
          }
        }

      `}</style>

    </div>
  );
}
