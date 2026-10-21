"use client";

import {
  useEffect,
  useState,
  type MouseEvent,
  type ReactNode,
} from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Plus_Jakarta_Sans } from "next/font/google";

import { Bell, Gauge, House, Plus, UserRound } from "lucide-react";

// Font mengikuti halaman beranda. Tidak mau pakai Google Font?
// Hapus import + konstanta `jakarta`, lalu hapus `jakarta.className` di <nav>.
const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

// Ikon duotone: garis + isi tipis, sama seperti halaman beranda
const DUO = { fill: "currentColor", fillOpacity: 0.16 } as const;

// `slot` = kolom di bar (0-4). Kolom 2 dipakai tombol Deposit.
const NAV_ITEMS = [
  { label: "Beranda", href: "/wali/beranda", icon: House, slot: 0 },
  { label: "Limit", href: "/wali/aktivitas", icon: Gauge, slot: 1 },
  { label: "Notifikasi", href: "/wali/notifikasi", icon: Bell, slot: 3 },
  { label: "Akun", href: "/wali/akun", icon: UserRound, slot: 4 },
] as const;

// Navbar hanya ditampilkan pada halaman
// utama, bukan pada alur pembayaran.

const NAVBAR_PAGES = [
  "/wali/beranda",
  "/wali/aktivitas",
  "/wali/notifikasi",
  "/wali/pengumuman",
  "/wali/akun",
];

// Posisi lekukan saat tidak ada menu aktif (di luar layar, kiri)
const HIDDEN_SLOT = -2;

export default function WaliNavigationShell({
  children,
}: {
  children: ReactNode;
}) {
  const pathname = usePathname();

  // Bola langsung berpindah saat menu ditekan, tanpa menunggu halaman selesai dimuat
  const [pending, setPending] = useState<string | null>(null);

  useEffect(() => {
    setPending(null);
  }, [pathname]);

  useEffect(() => {
    if (!pending) return undefined;
    const timer = window.setTimeout(() => setPending(null), 3000);
    return () => window.clearTimeout(timer);
  }, [pending]);

  const showNavbar = NAVBAR_PAGES.includes(pathname);
  const currentHref = pending ?? pathname;
  const activeItem = NAV_ITEMS.find((item) => item.href === currentHref);
  const activeSlot = activeItem ? activeItem.slot : HIDDEN_SLOT;

  const travel = {
    transform: `translate3d(${activeSlot * 100}%, 0, 0)`,
  };

  function handleClick(event: MouseEvent<HTMLAnchorElement>, href: string) {
    if (
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    ) {
      return;
    }
    setPending(href);
  }

  return (
    <>
      {/* CONTENT */}
      <div
        className={
          showNavbar ? "pb-[calc(92px+env(safe-area-inset-bottom))]" : ""
        }
      >
        {children}
      </div>

      {/* SHARED BOTTOM NAVBAR */}
      {showNavbar && (
        <nav
          aria-label="Navigasi utama wali santri"
          className={`${jakarta.className} pointer-events-none fixed inset-x-0 bottom-0 z-50`}
        >
          <div className="wn-enter relative mx-auto w-full max-w-[430px]">
            {/* PERMUKAAN BAR + LEKUKAN U (ikut berpindah) */}
            <div className="wn-shadow">
              <div className="relative h-[calc(68px+env(safe-area-inset-bottom))] overflow-hidden">
                <div
                  className="wn-travel absolute left-0 top-0 h-full w-[20%]"
                  style={travel}
                >
                  <span
                    aria-hidden="true"
                    className="absolute top-0 h-full w-[600px] border-t border-[#E8EDF1] bg-white"
                    style={{ right: "calc(50% + 49.5px)" }}
                  />
                  <span
                    aria-hidden="true"
                    className="absolute top-0 h-full w-[600px] border-t border-[#E8EDF1] bg-white"
                    style={{ left: "calc(50% + 49.5px)" }}
                  />
                  <span
                    aria-hidden="true"
                    className="absolute bottom-0 left-1/2 top-[39px] w-[100px] -translate-x-1/2 bg-white"
                  />
                  <svg
                    aria-hidden="true"
                    width="100"
                    height="40"
                    viewBox="0 0 100 40"
                    className="absolute left-1/2 top-0 -ml-[50px]"
                  >
                    <path
                      d="M0 0 H12 C26 0 26 30 50 30 C74 30 74 0 88 0 H100 V40 H0 Z"
                      fill="#FFFFFF"
                    />
                    <path
                      d="M0 0.5 H12 C26 0.5 26 30.5 50 30.5 C74 30.5 74 0.5 88 0.5 H100"
                      fill="none"
                      stroke="#E8EDF1"
                      strokeWidth="1"
                    />
                  </svg>
                </div>
              </div>
            </div>

            {/* BOLA AKTIF */}
            <div
              aria-hidden="true"
              className="wn-travel pointer-events-none absolute left-0 top-0 z-10 h-0 w-[20%]"
              style={travel}
            >
              <span
                className="wn-ball-wrap absolute left-1/2 -ml-[23px] -top-[22px] block h-[46px] w-[46px]"
                style={{
                  transform: activeItem ? "scale(1)" : "scale(0)",
                }}
              >
                <span
                  key={activeSlot}
                  className="wn-ball block h-full w-full rounded-full bg-[#105D38] shadow-[0_10px_18px_-8px_rgba(16,93,56,0.7)]"
                />
              </span>
            </div>

            {/* MENU */}
            <div className="pointer-events-auto absolute inset-x-0 top-0 z-20 grid h-[68px] grid-cols-5">
              {[0, 1, 2, 3, 4].map((slot) => {
                const item = NAV_ITEMS.find((entry) => entry.slot === slot);

                if (!item) {
                  return <div key={slot} aria-hidden="true" />;
                }

                const Icon = item.icon;
                const active = item.href === currentHref;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-current={pathname === item.href ? "page" : undefined}
                    onClick={(event) => handleClick(event, item.href)}
                    className="wn-link flex h-full flex-col items-center"
                  >
                    <span
                      className="wn-icon relative mt-[11px] flex h-[28px] w-[28px] items-center justify-center"
                      style={{
                        transform: active
                          ? "translate3d(0, -24px, 0)"
                          : "translate3d(0, 0, 0)",
                        color: active ? "#FFFFFF" : "#8B95A5",
                      }}
                    >
                      <span className="wn-icon-press flex">
                        <Icon
                          size={22}
                          strokeWidth={1.9}
                          aria-hidden="true"
                          {...DUO}
                        />
                      </span>
                    </span>

                    <span
                      className="wn-label mt-[9px] text-[10px] font-semibold leading-[12px]"
                      style={{ color: active ? "#105D38" : "#8B95A5" }}
                    >
                      {item.label}
                    </span>
                  </Link>
                );
              })}
            </div>

            {/* CENTER DEPOSIT BUTTON */}
            <div className="pointer-events-auto absolute -top-[29px] left-1/2 z-30 -ml-[30px] h-[60px] w-[60px]">
              <span
                aria-hidden="true"
                className="wn-fab-ring pointer-events-none absolute inset-0 rounded-full border-2 border-[#4CD080]"
              />
              <Link
                href="/wali/deposit"
                aria-label="Deposit Santri"
                className="wn-fab group relative flex h-[60px] w-[60px] items-center justify-center rounded-full border-[6px] border-white bg-[#4CD080] text-[#0B3D26] shadow-[0_10px_22px_-10px_rgba(76,208,128,0.95)] hover:bg-[#43C477]"
              >
                <Plus
                  size={24}
                  strokeWidth={2.6}
                  className="transition-transform duration-300 group-hover:rotate-90"
                />
              </Link>
            </div>
          </div>
        </nav>
      )}

      <style jsx global>{`
        /* Bayangan mengikuti bentuk bar, termasuk lekukan U */
        .wn-shadow {
          filter: drop-shadow(0 -4px 14px rgba(15, 27, 20, 0.09));
        }

        /* Lekukan dan bola bergerak bersamaan dengan pantulan halus */
        .wn-travel {
          transition: transform 620ms cubic-bezier(0.34, 1.32, 0.64, 1);
        }

        .wn-ball-wrap {
          transition: transform 460ms cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        /* Bola memipih lalu melenting saat berpindah, seperti balon */
        @keyframes wnBall {
          0% { transform: scale(1, 1); }
          30% { transform: scale(1.3, 0.82); }
          62% { transform: scale(0.92, 1.1); }
          100% { transform: scale(1, 1); }
        }
        .wn-ball {
          animation: wnBall 640ms cubic-bezier(0.34, 1.3, 0.64, 1);
        }

        /* Ikon aktif naik ke dalam bola */
        .wn-icon {
          transition:
            transform 520ms cubic-bezier(0.34, 1.45, 0.64, 1) 60ms,
            color 280ms ease 60ms;
        }
        .wn-label {
          transition: color 300ms ease;
        }

        .wn-link {
          -webkit-tap-highlight-color: transparent;
        }
        .wn-link:focus-visible {
          outline: 2px solid #4cd080;
          outline-offset: -4px;
          border-radius: 18px;
        }
        .wn-icon-press {
          transition: transform 380ms cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        .wn-link:active .wn-icon-press {
          transform: scale(0.86);
          transition-duration: 90ms;
        }

        /* Tombol deposit */
        .wn-fab {
          -webkit-tap-highlight-color: transparent;
          transition:
            transform 380ms cubic-bezier(0.34, 1.56, 0.64, 1),
            background-color 200ms ease;
        }
        .wn-fab:active {
          transform: scale(0.94);
          transition-duration: 90ms;
        }
        .wn-fab:focus-visible {
          outline: 2px solid #4cd080;
          outline-offset: 3px;
        }

        /* Masuk: bar naik, tombol deposit muncul memantul */
        @keyframes wnEnter {
          from { transform: translate3d(0, 100%, 0); }
          to { transform: translate3d(0, 0, 0); }
        }
        .wn-enter {
          animation: wnEnter 600ms cubic-bezier(0.22, 1, 0.36, 1) backwards;
        }

        @keyframes wnFab {
          from { opacity: 0; transform: scale(0.3) translate3d(0, 16px, 0); }
          to { opacity: 1; transform: scale(1) translate3d(0, 0, 0); }
        }
        .wn-fab { animation: wnFab 640ms cubic-bezier(0.34, 1.56, 0.64, 1) 360ms backwards; }

        /* Riak satu kali di belakang tombol deposit */
        @keyframes wnFabRing {
          0% { opacity: 0.7; transform: scale(1); }
          100% { opacity: 0; transform: scale(1.7); }
        }
        .wn-fab-ring {
          opacity: 0;
          animation: wnFabRing 1200ms cubic-bezier(0.2, 0.7, 0.3, 1) 900ms 1 forwards;
        }

        @media (prefers-reduced-motion: reduce) {
          .wn-travel,
          .wn-ball-wrap,
          .wn-icon,
          .wn-label,
          .wn-icon-press,
          .wn-fab {
            transition: none !important;
          }

          .wn-ball,
          .wn-enter,
          .wn-fab {
            animation: none !important;
          }

          .wn-fab-ring {
            display: none !important;
          }

          .wn-link:active .wn-icon-press,
          .wn-fab:active {
            transform: none !important;
          }
        }
      `}</style>
    </>
  );
}
