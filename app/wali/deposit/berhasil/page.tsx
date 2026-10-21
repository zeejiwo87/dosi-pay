"use client";

import { useEffect, useState, type CSSProperties } from "react";
import Image from "next/image";
import Link from "next/link";
import { Info, Plus, Wallet } from "lucide-react";

const RECEIPT_KEY = "dosi_demo_deposit_receipt";

type ReceiptData = {
  bankId: string;
  bankName: string;
  bankLogo: string;
  depositAmount: number;
  adminFee: number;
  totalPayment: number;
  createdAt: string;
  isDemo: true;
};

function rupiah(value: number) {
  return `Rp${value.toLocaleString("id-ID")}`;
}

function formatDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return (
    new Intl.DateTimeFormat("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
      timeZone: "Asia/Jakarta",
    }).format(date) + " WIB"
  );
}

// Nomor referensi demo, diturunkan dari waktu transaksi (bukan nomor asli)
function makeReference(createdAt: string) {
  const code = Math.abs(Date.parse(createdAt))
    .toString(36)
    .toUpperCase()
    .slice(-8)
    .padStart(8, "0");
  return `DEMO-${code}`;
}

// Helper untuk CSS custom property di inline style
function cssVars(vars: Record<string, string | number>): CSSProperties {
  return vars as unknown as CSSProperties;
}

// Delay masuk bertahap untuk elemen struk
const reveal = (ms: number) => cssVars({ "--d": `${ms}ms` });

// ==========================================
// COUNT-UP: nominal naik halus dari 0
// ==========================================
function useCountUp(target: number, delay: number, duration: number) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (target <= 0) {
      setValue(0);
      return;
    }

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    if (reduceMotion) {
      setValue(target);
      return;
    }

    let raf = 0;
    let startTime = 0;

    const tick = (now: number) => {
      if (!startTime) startTime = now;
      const progress = Math.min((now - startTime) / duration, 1);
      // ease-out expo: cepat di awal, melambat halus di akhir
      const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      setValue(Math.round(target * eased));
      if (progress < 1) raf = requestAnimationFrame(tick);
    };

    const timer = window.setTimeout(() => {
      raf = requestAnimationFrame(tick);
    }, delay);

    return () => {
      window.clearTimeout(timer);
      cancelAnimationFrame(raf);
    };
  }, [target, delay, duration]);

  return value;
}

// ==========================================
// DECORATION — pita yang tergambar halus
// ==========================================
const RIBBONS = [
  { d: "M12 -10 C8 30 48 31 68 53 S95 84 87 110", color: "#F9A13A", width: 3 },
  { d: "M135 -10 C152 19 167 37 151 63", color: "#55D58D", width: 3 },
  { d: "M251 -10 C235 22 239 40 250 60 S263 88 253 110", color: "#5BBE57", width: 3 },
  { d: "M321 -15 C315 12 339 20 365 9", color: "#F9A13A", width: 3 },
  { d: "M395 5 C365 28 380 43 355 63 S346 85 359 100", color: "#27BDD9", width: 2.5 },
] as const;

function CelebrationDecoration() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 390 110"
      preserveAspectRatio="xMidYMin slice"
      className="pointer-events-none absolute left-0 top-0 h-[110px] w-full"
    >
      {RIBBONS.map((ribbon, index) => (
        <path
          key={ribbon.d}
          d={ribbon.d}
          pathLength={1}
          fill="none"
          stroke={ribbon.color}
          strokeWidth={ribbon.width}
          strokeLinecap="round"
          className="dosi-ribbon"
          style={cssVars({ "--i": index })}
        />
      ))}
      <g className="dosi-pop-dots">
        <rect x="42" y="75" width="5" height="5" rx="1" fill="#FF5656" />
        <rect x="175" y="9" width="5" height="5" rx="1" fill="#27BDD9" />
        <rect x="302" y="60" width="5" height="5" rx="1" fill="#FF5656" />
        <circle cx="192" cy="16" r="2.5" fill="#FFFFFF" />
        <circle cx="317" cy="91" r="3" fill="#5BBE57" />
        <path d="M103 44 l8 4 -8 5 z" fill="#F9A13A" />
      </g>
    </svg>
  );
}

// ==========================================
// ONE-SHOT FIREWORKS + CONFETTI — CSS ONLY
// ==========================================
const FIREWORKS = [
  { left: "15%", top: "122px", delay: 0.62 },
  { left: "85%", top: "150px", delay: 0.8 },
  { left: "50%", top: "84px", delay: 1.0 },
] as const;

const FIREWORK_COLORS = ["#4CD080", "#F9C767", "#EAF9EF", "#70D9BE"];
const CONFETTI_COLORS = ["#4CD080", "#F5BC57", "#FFFFFF", "#A5E7BC", "#FF8A5B"];

// Confetti meledak dari ikon sukses, naik sebentar, lalu jatuh melayang
const CONFETTI = Array.from({ length: 36 }, (_, index) => {
  const direction = index % 2 === 0 ? -1 : 1;
  const round = index % 4 === 0;

  return {
    x: direction * (28 + ((index * 53) % 132)),
    rise: 48 + ((index * 29) % 72),
    fall: 120 + ((index * 43) % 170),
    spin: (index % 3 === 0 ? -1 : 1) * (240 + ((index * 37) % 320)),
    delay: 0.74 + ((index * 11) % 14) * 0.032,
    width: round ? 6 : 5,
    height: round ? 6 : 10,
    round,
    color: CONFETTI_COLORS[index % CONFETTI_COLORS.length],
  };
});

function CelebrationFireworks() {
  return (
    <div
      aria-hidden="true"
      className="fireworks-layer pointer-events-none absolute inset-0 z-20 overflow-hidden"
    >
      {FIREWORKS.map((burst, burstIndex) => (
        <div
          key={burstIndex}
          className="firework-origin absolute"
          style={{ left: burst.left, top: burst.top }}
        >
          <span
            className="firework-ring"
            style={cssVars({ "--delay": `${burst.delay}s` })}
          />
          {Array.from({ length: 12 }, (_, rayIndex) => (
            <span
              key={`ray-${rayIndex}`}
              className="firework-ray"
              style={{
                backgroundColor:
                  FIREWORK_COLORS[(rayIndex + burstIndex) % FIREWORK_COLORS.length],
                ...cssVars({
                  "--a": `${rayIndex * 30}deg`,
                  "--dist": `-${34 + (rayIndex % 3) * 9}px`,
                  "--delay": `${burst.delay + (rayIndex % 3) * 0.03}s`,
                }),
              }}
            />
          ))}
          {Array.from({ length: 8 }, (_, dotIndex) => (
            <span
              key={`dot-${dotIndex}`}
              className="firework-dot"
              style={{
                backgroundColor:
                  FIREWORK_COLORS[(dotIndex + burstIndex + 1) % FIREWORK_COLORS.length],
                ...cssVars({
                  "--a": `${dotIndex * 45 + 22}deg`,
                  "--dist": `-${58 + (dotIndex % 2) * 12}px`,
                  "--delay": `${burst.delay + 0.08 + (dotIndex % 4) * 0.025}s`,
                }),
              }}
            />
          ))}
        </div>
      ))}

      {CONFETTI.map((piece, index) => (
        <span
          key={index}
          className="confetti-x absolute"
          style={cssVars({
            left: "50%",
            top: "168px",
            "--cx": `${piece.x}px`,
            "--delay": `${piece.delay}s`,
          })}
        >
          <span
            className="confetti-y"
            style={{
              width: piece.width,
              height: piece.height,
              borderRadius: piece.round ? "9999px" : "1.5px",
              backgroundColor: piece.color,
              ...cssVars({
                "--rise": `${piece.rise}px`,
                "--fall": `${piece.fall}px`,
                "--spin": `${piece.spin}deg`,
              }),
            }}
          />
        </span>
      ))}
    </div>
  );
}

// ==========================================
// MAIN PAGE
// ==========================================
export default function DepositBerhasilPage() {
  const [receipt, setReceipt] = useState<ReceiptData | null>(null);
  const [loading, setLoading] = useState(true);
  const [logoFailed, setLogoFailed] = useState(false);

  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(RECEIPT_KEY);

      if (!saved) return;

      const data: unknown = JSON.parse(saved);

      if (
        typeof data !== "object" ||
        data === null ||
        !("isDemo" in data) ||
        data.isDemo !== true ||
        !("bankName" in data) ||
        typeof data.bankName !== "string" ||
        !("bankLogo" in data) ||
        typeof data.bankLogo !== "string" ||
        !/^\/(?:banks|merchants)\/[a-z0-9-]+\.svg$/.test(data.bankLogo) ||
        !("depositAmount" in data) ||
        typeof data.depositAmount !== "number" ||
        !Number.isSafeInteger(data.depositAmount) ||
        data.depositAmount < 20000 ||
        !("adminFee" in data) ||
        data.adminFee !== 5000 ||
        !("totalPayment" in data) ||
        data.totalPayment !== data.depositAmount + 5000 ||
        !Number.isSafeInteger(data.totalPayment) ||
        !("createdAt" in data) ||
        typeof data.createdAt !== "string" ||
        !Number.isFinite(Date.parse(data.createdAt))
      ) {
        return;
      }

      setReceipt(data as ReceiptData);
    } catch {
      setReceipt(null);
    } finally {
      setLoading(false);
    }
  }, []);

  // Hook harus dipanggil sebelum early return
  const animatedAmount = useCountUp(receipt?.depositAmount ?? 0, 900, 1500);

  // ========================================
  // LOADING
  // ========================================
  if (loading) {
    return (
      <main className="flex h-[100dvh] items-center justify-center bg-[#105D38]">
        <span className="h-7 w-7 animate-spin rounded-full border-[3px] border-white/20 border-t-white" />
      </main>
    );
  }

  // ========================================
  // NO RECEIPT
  // ========================================
  if (!receipt) {
    return (
      <main className="flex h-[100dvh] items-center justify-center bg-[#F5F7F5] px-5">
        <div className="dosi-empty w-full max-w-[350px] rounded-[22px] bg-white p-7 text-center shadow-[0_20px_50px_-24px_rgba(16,93,56,.35)]">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#EDF8F1]">
            <Wallet size={26} className="text-[#105D38]" />
          </div>
          <h1 className="mt-4 text-[19px] font-bold text-[#111827]">
            Struk Belum Tersedia
          </h1>
          <p className="mt-2 text-[12px] leading-5 text-[#8D998F]">
            Silakan lakukan simulasi deposit terlebih dahulu.
          </p>
          <Link
            href="/wali/deposit"
            className="mt-6 flex h-[46px] items-center justify-center rounded-[13px] bg-[#105D38] text-[12px] font-semibold text-white transition-transform duration-200 active:scale-[.98]"
          >
            Kembali ke Deposit
          </Link>
        </div>

        <style jsx global>{`
          @keyframes dosiEmptyIn {
            from { opacity: 0; transform: translate3d(0, 16px, 0) scale(.98); }
            to { opacity: 1; transform: none; }
          }
          .dosi-empty { animation: dosiEmptyIn 600ms cubic-bezier(.22,1,.36,1) both; }
          @media (prefers-reduced-motion: reduce) {
            .dosi-empty { animation: none !important; }
          }
        `}</style>
      </main>
    );
  }

  const isOutlet =
    receipt.bankId === "indomaret" || receipt.bankId === "alfamart";

  // ========================================
  // SUCCESS PAGE
  // ========================================
  return (
    <main className="h-[100dvh] overflow-hidden bg-[#EEF2EF] font-sans">
      <div className="receipt-screen relative mx-auto flex h-full w-full max-w-[430px] flex-col overflow-hidden bg-[#105D38] px-[17px] text-[#111827]">
        {/* BACKGROUND GLOW */}
        <div aria-hidden="true" className="dosi-glow dosi-glow-a" />
        <div aria-hidden="true" className="dosi-glow dosi-glow-b" />

        {/* DECORATION */}
        <CelebrationDecoration />
        <CelebrationFireworks />

        {/* HEADER */}
        <header className="receipt-header relative z-10 shrink-0 text-center">
          <h1 className="text-[16px] font-semibold tracking-[-0.3px] text-white">
            Struk Deposit
          </h1>
        </header>

        {/* =====================================
            RECEIPT
        ===================================== */}
        <section
          aria-labelledby="receipt-title"
          className="receipt-card relative z-10 flex min-h-0 flex-1 flex-col rounded-t-[26px] bg-white shadow-[0_-16px_44px_-14px_rgba(0,0,0,.3)]"
        >
          {/* SCROLLABLE INTERNAL CONTENT
              Hanya dipakai jika layar sangat pendek */}
          <div className="receipt-content min-h-0 flex-1 overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {/* SUCCESS ICON */}
            <div className="receipt-icon-wrap flex justify-center">
              <div className="icon-stage relative">
                <span className="icon-ripple" />
                <span className="icon-ripple icon-ripple-2" />
                <div className="receipt-success-icon flex items-center justify-center rounded-[23px] border-[6px] border-[#105D38] bg-gradient-to-br from-[#FFC47F] to-[#FF9A3D] shadow-[0_12px_26px_-8px_rgba(255,154,61,.75)]">
                  <svg
                    viewBox="0 0 24 24"
                    width={39}
                    height={39}
                    fill="none"
                    stroke="#FFFFFF"
                    strokeWidth={3.2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="receipt-check-mark"
                    aria-hidden="true"
                  >
                    <path d="M5 12.5l4.5 4.5L19 7.5" pathLength={1} />
                  </svg>
                </div>
              </div>
            </div>

            {/* SUCCESS TITLE */}
            <div className="receipt-heading px-4 text-center">
              <h2
                id="receipt-title"
                className="dosi-reveal text-[22px] font-bold tracking-[-0.6px] text-[#111827]"
                style={reveal(820)}
              >
                Deposit Berhasil!
              </h2>
              <p
                className="receipt-description dosi-reveal mt-1.5 text-[11px] leading-[1.6] text-[#949CAB]"
                style={reveal(900)}
              >
                Simulasi deposit berhasil diselesaikan.
              </p>

              <div className="receipt-amount dosi-reveal" style={reveal(960)}>
                <p className="text-[11px] text-[#949CAB]">Nominal Deposit</p>
                <p
                  aria-label={rupiah(receipt.depositAmount)}
                  className="mt-1 bg-gradient-to-b from-[#0B3D26] to-[#1F8B58] bg-clip-text text-[30px] font-extrabold leading-[1.2] tracking-[-1px] text-transparent [font-variant-numeric:tabular-nums]"
                >
                  <span
                    aria-hidden="true"
                    className="mr-1 align-[0.5em] text-[0.5em] font-bold tracking-normal"
                  >
                    Rp
                  </span>
                  <span aria-hidden="true">
                    {animatedAmount.toLocaleString("id-ID")}
                  </span>
                </p>
                <span className="dosi-badge mt-2 inline-flex items-center gap-1.5 rounded-full bg-[#EDF8F1] px-2.5 py-1 text-[9px] font-semibold text-[#24744B]">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#4CD080]" />
                  Berhasil — Demo
                </span>
              </div>
            </div>

            {/* TICKET DIVIDER */}
            <div className="receipt-divider relative">
              <span className="absolute -left-[10px] -top-[10px] h-5 w-5 rounded-full bg-[#105D38]" />
              <span className="absolute -right-[10px] -top-[10px] h-5 w-5 rounded-full bg-[#105D38]" />
              <div className="dosi-divider mx-[18px] border-t-2 border-dashed border-[#E7E7E7]" />
            </div>

            {/* TRANSACTION DETAILS */}
            <div className="receipt-details px-[18px]">
              <p
                className="dosi-reveal text-[11px] text-[#929AAA]"
                style={reveal(1040)}
              >
                Tujuan Deposit
              </p>

              <div
                className="receipt-destination dosi-reveal flex items-center gap-2.5 rounded-[14px] bg-[#F3F6F4] px-3"
                style={reveal(1090)}
              >
                <div className="flex h-[39px] w-[39px] shrink-0 items-center justify-center rounded-[11px] bg-white text-[#105D38] shadow-[0_3px_10px_-3px_rgba(16,93,56,.25)]">
                  <Wallet size={21} strokeWidth={1.8} />
                </div>
                <div className="min-w-0">
                  <p className="text-[12px] font-bold text-[#17261D]">
                    Saldo Santri DOSI Pay
                  </p>
                  <p className="mt-0.5 text-[10px] text-[#929AAA]">
                    {formatDate(receipt.createdAt)}
                  </p>
                </div>
              </div>

              {/* BANK */}
              <div
                className="receipt-bank dosi-reveal flex items-center justify-between gap-2"
                style={reveal(1150)}
              >
                <span className="text-[11px] text-[#929AAA]">
                  {isOutlet ? "Gerai" : "Bank"}
                </span>
                <span className="flex items-center gap-2">
                  <span className="flex h-[27px] w-[43px] items-center justify-center rounded-[7px] border border-[#EFF1EF] bg-white">
                    {!logoFailed ? (
                      <Image
                        src={receipt.bankLogo}
                        alt={`Logo ${receipt.bankName}`}
                        width={40}
                        height={25}
                        unoptimized
                        onError={() => setLogoFailed(true)}
                        className="h-full w-full object-contain p-1"
                      />
                    ) : (
                      <span className="text-[9px] font-bold text-[#105D38]">
                        {receipt.bankName}
                      </span>
                    )}
                  </span>
                  <span className="text-[11px] font-semibold">
                    {receipt.bankName}
                  </span>
                </span>
              </div>

              {/* REFERENCE */}
              <div
                className="receipt-bank dosi-reveal flex items-center justify-between gap-2"
                style={reveal(1200)}
              >
                <span className="text-[11px] text-[#929AAA]">No. Referensi</span>
                <span className="text-[11px] font-semibold tracking-[0.2px] [font-variant-numeric:tabular-nums]">
                  {makeReference(receipt.createdAt)}
                </span>
              </div>

              {/* BREAKDOWN */}
              <div
                className="receipt-breakdown dosi-reveal border-t border-[#EDF0ED]"
                style={reveal(1260)}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] text-[#929AAA]">
                    Nominal Deposit
                  </span>
                  <span className="text-[11px] font-semibold">
                    {rupiah(receipt.depositAmount)}
                  </span>
                </div>
                <div className="mt-2 flex items-center justify-between gap-2">
                  <span className="text-[11px] text-[#929AAA]">Biaya Admin</span>
                  <span className="text-[11px] font-semibold">
                    {rupiah(receipt.adminFee)}
                  </span>
                </div>
                <div className="mt-2.5 border-t border-dashed border-[#DFE4DF] pt-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[12px] font-semibold">
                      Total Pembayaran
                    </span>
                    <strong className="text-[15px] text-[#105D38]">
                      {rupiah(receipt.totalPayment)}
                    </strong>
                  </div>
                </div>
              </div>

              {/* DEMO INFORMATION */}
              <div
                className="receipt-note dosi-reveal flex items-start gap-2 rounded-[10px] bg-[#F5F8F5] px-2.5 py-2"
                style={reveal(1330)}
              >
                <Info size={13} className="mt-0.5 shrink-0 text-[#4A865E]" />
                <p className="text-[9px] leading-[1.5] text-[#88968B]">
                  Struk simulasi. Belum ada pembayaran nyata dan saldo santri
                  belum berubah.
                </p>
              </div>
            </div>
          </div>

          {/* =====================================
              BOTTOM BUTTONS
          ===================================== */}
          <div
            className="receipt-actions dosi-reveal shrink-0 px-[18px]"
            style={reveal(1400)}
          >
            <Link
              href="/wali/beranda"
              className="dosi-primary relative flex h-[46px] w-full items-center justify-center overflow-hidden rounded-[13px] bg-gradient-to-b from-[#58DA8B] to-[#3FC578] text-[12px] font-semibold text-[#0B4A2D] shadow-[0_10px_22px_-10px_rgba(60,189,113,.9)]"
            >
              Selesai
            </Link>
            <Link
              href="/wali/deposit"
              className="mt-2 flex h-[34px] w-full items-center justify-center gap-1.5 rounded-[10px] text-[11px] font-semibold text-[#105D38] hover:bg-[#F1F7F3]"
            >
              <Plus size={13} strokeWidth={2.4} />
              Deposit Lagi
            </Link>
          </div>

          {/* TICKET BOTTOM */}
          <div
            aria-hidden="true"
            className="receipt-ticket-bottom absolute -bottom-[8px] left-0 h-[16px] w-full"
            style={{
              backgroundImage:
                "radial-gradient(circle at 8px 8px, #105D38 7.5px, transparent 8px)",
              backgroundSize: "16px 16px",
              backgroundRepeat: "repeat-x",
            }}
          />
        </section>

        {/* SPACE BELOW RECEIPT */}
        <div className="receipt-bottom-space shrink-0" />

        {/* HOME INDICATOR */}
        <div
          aria-hidden="true"
          className="receipt-home-indicator mx-auto shrink-0 rounded-full bg-white/70"
        />
      </div>

      {/* =====================================
          STYLES: ANIMASI + PENYESUAIAN TINGGI LAYAR
      ===================================== */}
      <style jsx global>{`
        /* ---------- BACKGROUND GLOW (statis, hanya di area atas) ---------- */
        .dosi-glow {
          position: absolute;
          pointer-events: none;
          border-radius: 9999px;
          animation: dosiGlowIn 1400ms ease-out both;
        }
        .dosi-glow-a {
          top: -140px;
          left: -100px;
          width: 340px;
          height: 340px;
          background: radial-gradient(circle, rgba(76, 208, 128, 0.32), transparent 66%);
        }
        .dosi-glow-b {
          top: -90px;
          right: -130px;
          width: 320px;
          height: 320px;
          background: radial-gradient(circle, rgba(245, 188, 87, 0.2), transparent 66%);
        }
        @keyframes dosiGlowIn {
          from { opacity: 0; transform: scale(.85); }
          to { opacity: 1; transform: scale(1); }
        }

        /* ---------- ENTRANCE: STRUK NAIK DARI BAWAH ---------- */
        @keyframes dosiCardRise {
          from { opacity: 0; transform: translate3d(0, 92vh, 0) scale(.975); }
          to { opacity: 1; transform: translate3d(0, 0, 0) scale(1); }
        }
        .receipt-card {
          animation: dosiCardRise 1050ms cubic-bezier(.16, 1, .3, 1) 120ms both;
        }

        @keyframes dosiHeaderAppear {
          from { opacity: 0; transform: translate3d(0, -10px, 0); }
          to { opacity: 1; transform: translate3d(0, 0, 0); }
        }
        .receipt-header {
          animation: dosiHeaderAppear 600ms cubic-bezier(.22, 1, .36, 1) 60ms both;
        }

        /* ---------- ELEMEN STRUK MUNCUL BERURUTAN ---------- */
        @keyframes dosiReveal {
          from { opacity: 0; transform: translate3d(0, 14px, 0); }
          to { opacity: 1; transform: translate3d(0, 0, 0); }
        }
        .dosi-reveal {
          animation: dosiReveal 700ms cubic-bezier(.22, 1, .36, 1) var(--d, 0ms) both;
        }
        @keyframes dosiDividerGrow {
          from { opacity: 0; transform: scaleX(.4); }
          to { opacity: 1; transform: scaleX(1); }
        }
        .dosi-divider {
          animation: dosiDividerGrow 700ms cubic-bezier(.22, 1, .36, 1) 980ms both;
        }

        /* ---------- PITA DEKORASI TERGAMBAR ---------- */
        .dosi-ribbon {
          stroke-dasharray: 1 1;
          stroke-dashoffset: 1;
          animation: dosiDraw 1100ms cubic-bezier(.45, .05, .25, 1)
            calc(160ms + var(--i, 0) * 90ms) forwards;
        }
        @keyframes dosiDraw {
          to { stroke-dashoffset: 0; }
        }
        .dosi-pop-dots {
          animation: dosiDotsIn 700ms ease-out 700ms both;
        }
        @keyframes dosiDotsIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        /* ---------- IKON SUKSES ---------- */
        @keyframes dosiIconPop {
          0% { opacity: 0; transform: rotate(-20deg) scale(.2); }
          50% { opacity: 1; transform: rotate(14deg) scale(1.15); }
          75% { transform: rotate(5deg) scale(.96); }
          100% { opacity: 1; transform: rotate(8deg) scale(1); }
        }
        .receipt-success-icon {
          transform: rotate(8deg);
          animation: dosiIconPop 780ms cubic-bezier(.3, .9, .3, 1) 540ms both;
        }
        .receipt-check-mark path {
          stroke-dasharray: 1 1;
          stroke-dashoffset: 1;
          animation: dosiDraw 520ms cubic-bezier(.65, 0, .35, 1) 860ms forwards;
        }

        /* Riak gelombang di belakang ikon (dua kali, lalu berhenti) */
        .icon-ripple {
          position: absolute;
          inset: 0;
          border-radius: 23px;
          border: 2px solid rgba(255, 174, 88, 0.75);
          opacity: 0;
          pointer-events: none;
          animation: dosiRipple 1300ms cubic-bezier(.2, .7, .3, 1) 880ms 2 forwards;
        }
        .icon-ripple-2 {
          animation-delay: 1180ms;
        }
        @keyframes dosiRipple {
          0% { opacity: .75; transform: rotate(8deg) scale(1); }
          100% { opacity: 0; transform: rotate(8deg) scale(1.65); }
        }

        /* Kilau sekali lewat pada badge dan tombol utama */
        .dosi-badge,
        .dosi-primary {
          position: relative;
          overflow: hidden;
        }
        .dosi-badge::after,
        .dosi-primary::after {
          content: "";
          position: absolute;
          inset: 0;
          background: linear-gradient(100deg, transparent 30%, rgba(255, 255, 255, .8) 50%, transparent 70%);
          transform: translate3d(-130%, 0, 0);
          pointer-events: none;
          animation: dosiShine 1200ms ease-in-out 1900ms 1 forwards;
        }
        .dosi-primary::after {
          animation-delay: 2300ms;
        }
        @keyframes dosiShine {
          to { transform: translate3d(130%, 0, 0); }
        }

        /* ---------- FIREWORKS ---------- */
        .fireworks-layer { contain: paint; }
        .firework-origin { width: 0; height: 0; }

        .firework-ray {
          position: absolute;
          top: -7px;
          left: -1.5px;
          width: 3px;
          height: 14px;
          border-radius: 6px;
          opacity: 0;
          animation: dosiFireworkRay 900ms cubic-bezier(.12, .75, .3, 1) var(--delay) both;
        }
        @keyframes dosiFireworkRay {
          0% { opacity: 0; transform: rotate(var(--a)) translateY(-4px) scaleY(.3); }
          15% { opacity: 1; }
          60% { opacity: 1; transform: rotate(var(--a)) translateY(var(--dist)) scaleY(1); }
          100% { opacity: 0; transform: rotate(var(--a)) translateY(calc(var(--dist) * 1.25)) scaleY(.2); }
        }

        .firework-dot {
          position: absolute;
          top: -2px;
          left: -2px;
          width: 4px;
          height: 4px;
          border-radius: 9999px;
          opacity: 0;
          animation: dosiFireworkDot 1000ms cubic-bezier(.1, .7, .25, 1) var(--delay) both;
        }
        @keyframes dosiFireworkDot {
          0% { opacity: 0; transform: rotate(var(--a)) translateY(-6px) scale(.5); }
          20% { opacity: 1; }
          70% { opacity: 1; transform: rotate(var(--a)) translateY(var(--dist)) scale(1); }
          100% { opacity: 0; transform: rotate(var(--a)) translateY(calc(var(--dist) * 1.18)) scale(.1); }
        }

        .firework-ring {
          position: absolute;
          top: -18px;
          left: -18px;
          width: 36px;
          height: 36px;
          border: 2px solid rgba(186, 250, 207, .9);
          border-radius: 9999px;
          opacity: 0;
          animation: dosiFireworkRing 760ms cubic-bezier(.2, .7, .3, 1) var(--delay) both;
        }
        @keyframes dosiFireworkRing {
          0% { opacity: 0; transform: scale(.12); }
          20% { opacity: .9; }
          100% { opacity: 0; transform: scale(2.5); }
        }

        /* ---------- CONFETTI: meledak, naik, lalu melayang jatuh ---------- */
        .confetti-x {
          width: 0;
          height: 0;
          animation: dosiConfettiX 1700ms cubic-bezier(.12, .7, .3, 1) var(--delay) both;
        }
        @keyframes dosiConfettiX {
          from { transform: translate3d(0, 0, 0); }
          to { transform: translate3d(var(--cx), 0, 0); }
        }
        .confetti-y {
          position: absolute;
          top: -5px;
          left: -3px;
          display: block;
          opacity: 0;
          animation: dosiConfettiY 1700ms linear var(--delay) both;
        }
        @keyframes dosiConfettiY {
          0% {
            opacity: 0;
            transform: translate3d(0, 0, 0) rotate(0deg) scale(.6);
            animation-timing-function: cubic-bezier(.2, .8, .4, 1);
          }
          8% { opacity: 1; }
          28% {
            transform: translate3d(0, calc(var(--rise) * -1), 0) rotate(calc(var(--spin) * .4)) scale(1);
            animation-timing-function: cubic-bezier(.45, 0, .9, .6);
          }
          78% { opacity: 1; }
          100% {
            opacity: 0;
            transform: translate3d(0, var(--fall), 0) rotate(var(--spin)) scale(.9);
          }
        }

        /* ---------- TOMBOL ---------- */
        .receipt-actions a {
          transition: transform 200ms cubic-bezier(.22, 1, .36, 1),
            background-color 200ms ease, box-shadow 200ms ease;
        }
        .receipt-actions a:active { transform: scale(.97); }
        .dosi-primary:hover { transform: translateY(-1px); }

        /* ---------- ACCESSIBILITY: kurangi gerakan ---------- */
        @media (prefers-reduced-motion: reduce) {
          .receipt-card, .receipt-header, .receipt-success-icon, .dosi-reveal,
          .dosi-divider, .dosi-glow, .dosi-pop-dots, .dosi-badge::after,
          .dosi-primary::after { animation: none !important; }
          .dosi-ribbon, .receipt-check-mark path {
            animation: none !important;
            stroke-dashoffset: 0 !important;
          }
          .firework-ray, .firework-dot, .firework-ring, .confetti-x,
          .confetti-y, .icon-ripple { display: none !important; }
          .receipt-actions a { transition: none !important; }
        }

        /* ---------- LAYOUT DASAR ---------- */
        .receipt-screen {
          padding-top: max(20px, env(safe-area-inset-top));
          padding-bottom: max(12px, env(safe-area-inset-bottom));
        }
        .receipt-header { margin-bottom: 21px; }
        .receipt-card { margin-left: 1px; margin-right: 1px; }
        .receipt-content {
          overscroll-behavior: contain;
          -webkit-overflow-scrolling: touch;
        }
        .receipt-icon-wrap { padding-top: 30px; }
        .receipt-success-icon { width: 75px; height: 75px; }
        .receipt-heading { margin-top: 19px; }
        .receipt-amount { margin-top: 17px; }
        .receipt-divider { margin-top: 20px; margin-bottom: 18px; }
        .receipt-destination { min-height: 57px; margin-top: 9px; }
        .receipt-bank { margin-top: 12px; }
        .receipt-breakdown { margin-top: 12px; padding-top: 12px; }
        .receipt-note { margin-top: 13px; }
        .receipt-actions { padding-top: 10px; padding-bottom: 20px; }
        .receipt-bottom-space { height: clamp(12px, 5dvh, 46px); }
        .receipt-home-indicator { width: 100px; height: 4px; }

        /* HP dengan tinggi sedang */
        @media (max-height: 760px) {
          .receipt-header { margin-bottom: 15px; }
          .receipt-icon-wrap { padding-top: 21px; }
          .receipt-success-icon { width: 67px; height: 67px; }
          .receipt-heading { margin-top: 14px; }
          .receipt-amount { margin-top: 12px; }
          .receipt-divider { margin-top: 14px; margin-bottom: 13px; }
          .receipt-destination { min-height: 51px; }
          .receipt-bank { margin-top: 9px; }
          .receipt-breakdown { margin-top: 9px; padding-top: 9px; }
          .receipt-note { margin-top: 9px; }
          .receipt-actions { padding-top: 8px; padding-bottom: 16px; }
          .receipt-bottom-space { height: 14px; }
        }

        /* HP dengan layar pendek */
        @media (max-height: 650px) {
          .receipt-screen {
            padding-top: max(12px, env(safe-area-inset-top));
            padding-bottom: max(9px, env(safe-area-inset-bottom));
          }
          .receipt-header { margin-bottom: 11px; }
          .receipt-icon-wrap { padding-top: 15px; }
          .receipt-success-icon {
            width: 58px;
            height: 58px;
            border-width: 5px;
            border-radius: 19px;
          }
          .receipt-success-icon svg { width: 31px; height: 31px; }
          .receipt-heading { margin-top: 10px; }
          .receipt-heading h2 { font-size: 19px; }
          .receipt-amount { margin-top: 9px; }
          .receipt-amount > p:nth-child(2) { font-size: 26px; }
          .receipt-divider { margin-top: 11px; margin-bottom: 11px; }
          .receipt-destination { min-height: 47px; }
          .receipt-bank { margin-top: 7px; }
          .receipt-breakdown { margin-top: 7px; padding-top: 7px; }
          .receipt-note { margin-top: 7px; }
          .receipt-actions { padding-top: 7px; padding-bottom: 13px; }
          .receipt-bottom-space { height: 9px; }
        }
      `}</style>
    </main>
  );
}
