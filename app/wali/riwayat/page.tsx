"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";

import {
  ArrowLeft,
  ArrowRight,
  ChevronRight,
  ReceiptText,
  X,
} from "lucide-react";

// ==========================================
// KONFIGURASI RIWAYAT DOSI PAY
// ==========================================

const RECEIPT_KEY = "dosi_demo_deposit_receipt";
const HISTORY_KEY = "dosi_demo_deposit_history";

const BANKS: Record<
  string,
  {
    name: string;
    logo: string;
  }
> = {
  bri: { name: "BRI", logo: "/banks/bri.svg" },
  bca: { name: "BCA", logo: "/banks/bca.svg" },
  mandiri: { name: "Mandiri", logo: "/banks/mandiri.svg" },
  bni: { name: "BNI", logo: "/banks/bni.svg" },
  bsi: { name: "BSI", logo: "/banks/bsi.svg" },
  cimb: { name: "CIMB Niaga", logo: "/banks/cimb-niaga.svg" },
  permata: { name: "PermataBank", logo: "/banks/permata.svg" },
  btn: { name: "BTN", logo: "/banks/btn.svg" },
  danamon: { name: "Danamon", logo: "/banks/danamon.svg" },
  ocbc: { name: "OCBC", logo: "/banks/ocbc-nisp.svg" },
  maybank: { name: "Maybank", logo: "/banks/maybank.svg" },
  mega: { name: "Bank Mega", logo: "/banks/mega.svg" },
  bjb: { name: "Bank BJB", logo: "/banks/bank-bjb.svg" },
  jago: { name: "Bank Jago", logo: "/banks/jago.svg" },
  seabank: { name: "SeaBank", logo: "/banks/seabank.svg" },
};

// ==========================================
// TYPES
// ==========================================

type Receipt = {
  bankId: string;
  bankName: string;
  bankLogo: string;
  depositAmount: number;
  adminFee: number;
  totalPayment: number;
  createdAt: string;
  isDemo: true;
};

type Group = {
  key: string;
  label: string;
  items: { item: Receipt; index: number }[];
};

// ==========================================
// MOTION (HALUS, SEKALI JALAN)
// ==========================================

const CSS = `
@keyframes dp-up{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
@keyframes dp-fade-in{from{opacity:0}to{opacity:1}}
@keyframes dp-fade-out{from{opacity:1}to{opacity:0}}
@keyframes dp-sheet-in{from{transform:translateY(100%)}to{transform:translateY(0)}}
@keyframes dp-sheet-out{from{transform:translateY(0)}to{transform:translateY(100%)}}
@keyframes dp-draw{from{stroke-dashoffset:26}to{stroke-dashoffset:0}}
@keyframes dp-pop{0%{transform:scale(.6);opacity:0}100%{transform:scale(1);opacity:1}}
@keyframes dp-shimmer{from{background-position:200% 0}to{background-position:-200% 0}}

.dp-up{animation:dp-up .5s cubic-bezier(.2,.8,.2,1) backwards}
.dp-fade-in{animation:dp-fade-in .22s ease-out backwards}
.dp-fade-out{animation:dp-fade-out .2s ease-in forwards}
.dp-sheet-in{animation:dp-sheet-in .38s cubic-bezier(.2,.9,.2,1) backwards}
.dp-sheet-out{animation:dp-sheet-out .22s cubic-bezier(.5,0,.8,.4) forwards}
.dp-draw{stroke-dasharray:26;animation:dp-draw .45s .25s cubic-bezier(.4,0,.2,1) backwards}
.dp-pop{animation:dp-pop .35s .1s cubic-bezier(.2,.9,.3,1.1) backwards}
.dp-skel{background:linear-gradient(100deg,#E9F0EB 30%,#F5F8F5 50%,#E9F0EB 70%);background-size:200% 100%;animation:dp-shimmer 1.5s linear infinite}

@media (prefers-reduced-motion: reduce){
  .dp-root *,.dp-root *::before,.dp-root *::after{
    animation-duration:.001ms !important;
    animation-iteration-count:1 !important;
    transition-duration:.001ms !important;
  }
}
`;

// ==========================================
// HELPERS
// ==========================================

function rupiah(value: number) {
  return `Rp${value.toLocaleString("id-ID")}`;
}

function formatDate(value: string, short = false) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  const formatted = new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: short ? "short" : "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Asia/Jakarta",
  }).format(date);

  return `${formatted} WIB`;
}

function formatTime(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return new Intl.DateTimeFormat("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Asia/Jakarta",
  }).format(date);
}

function dayKey(value: string | number | Date) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
  }).format(new Date(value));
}

function dayLabel(value: string) {
  const key = dayKey(value);

  if (key === dayKey(Date.now())) return "Hari ini";
  if (key === dayKey(Date.now() - 86400000)) return "Kemarin";

  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Asia/Jakarta",
  }).format(new Date(value));
}

function useCountUp(target: number, duration = 800) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    let raf = 0;
    const start = performance.now();

    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);

      setValue(Math.round(target * eased));

      if (progress < 1) {
        raf = requestAnimationFrame(tick);
      }
    };

    setValue(0);
    raf = requestAnimationFrame(tick);

    return () => cancelAnimationFrame(raf);
  }, [target, duration]);

  return value;
}

// ==========================================
// VALIDASI DATA DEMO
// ==========================================

function normalizeReceipt(value: unknown): Receipt | null {
  if (typeof value !== "object" || value === null) {
    return null;
  }

  const item = value as Record<string, unknown>;

  if (
    item.isDemo !== true ||
    typeof item.bankId !== "string" ||
    !Object.prototype.hasOwnProperty.call(BANKS, item.bankId) ||
    typeof item.depositAmount !== "number" ||
    !Number.isFinite(item.depositAmount) ||
    item.depositAmount < 20000 ||
    item.adminFee !== 5000 ||
    typeof item.totalPayment !== "number" ||
    item.totalPayment !== item.depositAmount + 5000 ||
    typeof item.createdAt !== "string" ||
    !Number.isFinite(Date.parse(item.createdAt))
  ) {
    return null;
  }

  const bank = BANKS[item.bankId];

  return {
    bankId: item.bankId,
    bankName: bank.name,
    bankLogo: bank.logo,
    depositAmount: item.depositAmount,
    adminFee: 5000,
    totalPayment: item.totalPayment,
    createdAt: item.createdAt,
    isDemo: true,
  };
}

// ==========================================
// LOAD HISTORY
// ==========================================

function loadDepositHistory(): Receipt[] {
  const results: Receipt[] = [];

  try {
    const saved = localStorage.getItem(HISTORY_KEY);

    if (saved) {
      const parsed: unknown = JSON.parse(saved);

      if (Array.isArray(parsed)) {
        for (const value of parsed) {
          const receipt = normalizeReceipt(value);

          if (receipt) {
            results.push(receipt);
          }
        }
      }
    }
  } catch {
    // Tetap lanjut tanpa riwayat lokal
  }

  try {
    const latestRaw = sessionStorage.getItem(RECEIPT_KEY);

    if (latestRaw) {
      const latest = normalizeReceipt(JSON.parse(latestRaw));

      if (latest) {
        results.push(latest);
      }
    }
  } catch {
    // Tetap gunakan data yang tersedia
  }

  results.sort(
    (a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  const unique = results.filter(
    (item, index, all) =>
      all.findIndex(
        (other) =>
          other.createdAt === item.createdAt &&
          other.bankId === item.bankId &&
          other.depositAmount === item.depositAmount
      ) === index
  );

  return unique.slice(0, 100);
}

// ==========================================
// BANK LOGO
// ==========================================

function BankLogo({
  logo,
  name,
  className = "",
}: {
  logo: string;
  name: string;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [logo]);

  return (
    <span
      className={`flex shrink-0 items-center justify-center overflow-hidden rounded-[12px] border border-[#E4ECE6] bg-white ${className}`}
    >
      {failed ? (
        <span className="px-1 text-center text-[10px] font-bold text-[#0E5A35]">
          {name}
        </span>
      ) : (
        <Image
          src={logo}
          alt={`Logo ${name}`}
          width={64}
          height={42}
          unoptimized
          onError={() => setFailed(true)}
          className="block h-full w-full object-contain p-[6px]"
        />
      )}
    </span>
  );
}

// ==========================================
// DETAIL SHEET
// ==========================================

function DetailSheet({
  receipt,
  closing,
  onClose,
}: {
  receipt: Receipt;
  closing: boolean;
  onClose: () => void;
}) {
  const amount = useCountUp(receipt.depositAmount, 700);

  const rows = [
    { label: "Tujuan", value: "Saldo Santri DOSI Pay" },
    { label: "Nominal", value: rupiah(receipt.depositAmount) },
    { label: "Biaya Admin", value: rupiah(receipt.adminFee) },
  ];

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center sm:p-5">
      <button
        type="button"
        aria-label="Tutup detail deposit"
        onClick={onClose}
        className={`absolute inset-0 bg-[#08150D]/55 ${
          closing ? "dp-fade-out" : "dp-fade-in"
        }`}
      />

      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="detail-deposit-title"
        className={`relative max-h-[92dvh] w-full max-w-[430px] overflow-y-auto overscroll-contain rounded-t-[28px] bg-white px-5 pb-[max(22px,env(safe-area-inset-bottom))] pt-[10px] shadow-2xl sm:rounded-[28px] ${
          closing ? "dp-sheet-out" : "dp-sheet-in"
        }`}
      >
        <div
          aria-hidden="true"
          className="mx-auto h-[4px] w-[36px] rounded-full bg-[#DDE6DF]"
        />

        <div className="mt-[14px] flex items-center justify-between">
          <h2
            id="detail-deposit-title"
            className="text-[16px] font-bold text-[#14231A]"
          >
            Detail Deposit
          </h2>

          <button
            type="button"
            aria-label="Tutup"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-[#F1F5F2] text-[#4F6356] transition active:scale-90"
          >
            <X size={17} />
          </button>
        </div>

        <div className="mt-[24px] flex flex-col items-center text-center">
          <span className="dp-pop flex h-[56px] w-[56px] items-center justify-center rounded-full bg-[#E6F3EA]">
            <svg
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#17803F"
              strokeWidth="2.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path className="dp-draw" d="M5.5 12.8l4.2 4.2 8.8-9.6" />
            </svg>
          </span>

          <p className="mt-[16px] text-[32px] font-bold leading-none tracking-[-1px] text-[#14231A] tabular-nums">
            {rupiah(amount)}
          </p>

          <p className="mt-[10px] text-[12px] text-[#6B7C71]">
            {formatDate(receipt.createdAt)}
          </p>
        </div>

        <div className="mt-[22px] flex items-center gap-3 rounded-[16px] bg-[#F4F7F5] p-3">
          <BankLogo
            logo={receipt.bankLogo}
            name={receipt.bankName}
            className="h-[44px] w-[52px]"
          />

          <div className="min-w-0">
            <p className="text-[11px] text-[#6B7C71]">Metode</p>
            <p className="mt-[3px] truncate text-[13px] font-semibold text-[#14231A]">
              Transfer Bank {receipt.bankName}
            </p>
          </div>
        </div>

        <div className="mt-[18px] space-y-[14px]">
          {rows.map((row, i) => (
            <div
              key={row.label}
              className="dp-up flex items-center justify-between gap-3"
              style={{ animationDelay: `${140 + i * 50}ms` }}
            >
              <span className="text-[12px] text-[#6B7C71]">{row.label}</span>
              <span className="text-right text-[12px] font-semibold text-[#14231A]">
                {row.value}
              </span>
            </div>
          ))}
        </div>

        <div
          className="dp-up mt-[18px] flex items-center justify-between gap-3 rounded-[16px] bg-[#FFF6D6] px-4 py-[14px]"
          style={{ animationDelay: "320ms" }}
        >
          <span className="text-[13px] font-semibold text-[#14231A]">
            Total
          </span>
          <strong className="text-[18px] font-bold tracking-[-0.3px] text-[#0E5A35] tabular-nums">
            {rupiah(receipt.totalPayment)}
          </strong>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="mt-[18px] h-[50px] w-full rounded-[15px] bg-[#0E5A35] text-[14px] font-semibold text-white transition hover:bg-[#0B4D2C] active:scale-[0.98]"
        >
          Tutup
        </button>
      </section>
    </div>
  );
}

// ==========================================
// MAIN PAGE
// ==========================================

export default function RiwayatWaliPage() {
  const [history, setHistory] = useState<Receipt[]>([]);
  const [selected, setSelected] = useState<Receipt | null>(null);
  const [closing, setClosing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [scrolled, setScrolled] = useState(false);
  const [mini, setMini] = useState(false);
  const [barReady, setBarReady] = useState(false);

  useEffect(() => {
    const data = loadDepositHistory();

    setHistory(data);
    setLoading(false);

    try {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(data));
    } catch {
      // Penyimpanan lokal opsional
    }

    const timer = window.setTimeout(() => setBarReady(true), 120);

    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    function onScroll() {
      const y = window.scrollY;

      setScrolled(y > 8);
      setMini(y > 120);
    }

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const requestClose = useCallback(() => {
    setClosing(true);

    window.setTimeout(() => {
      setSelected(null);
      setClosing(false);
    }, 220);
  }, []);

  // Lock background ketika detail dibuka
  useEffect(() => {
    if (!selected) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        requestClose();
      }
    }

    window.addEventListener("keydown", handleEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleEscape);
    };
  }, [selected, requestClose]);

  const totals = useMemo(() => {
    const deposit = history.reduce((sum, item) => sum + item.depositAmount, 0);
    const admin = history.reduce((sum, item) => sum + item.adminFee, 0);

    return {
      deposit,
      admin,
      payment: deposit + admin,
      depositShare: deposit + admin > 0 ? (deposit / (deposit + admin)) * 100 : 0,
    };
  }, [history]);

  const heroAmount = useCountUp(totals.deposit, 900);

  const groups = useMemo<Group[]>(() => {
    const map: Group[] = [];

    history.forEach((item, index) => {
      const key = dayKey(item.createdAt);
      const last = map[map.length - 1];

      if (last && last.key === key) {
        last.items.push({ item, index });
      } else {
        map.push({
          key,
          label: dayLabel(item.createdAt),
          items: [{ item, index }],
        });
      }
    });

    return map;
  }, [history]);

  return (
    <main className="dp-root min-h-screen min-h-[100dvh] w-full bg-[#E3EBE5] font-sans text-[#14231A]">
      <style>{CSS}</style>

      <div className="mx-auto flex min-h-[100dvh] w-full max-w-[430px] flex-col bg-[#F5F8F5]">
        {/* ==================================
            HEADER STICKY
        ================================== */}
        <header
          className={`sticky top-0 z-50 bg-[#0E5A35] text-white transition-shadow duration-300 ${
            scrolled ? "shadow-[0_8px_24px_-12px_rgba(5,30,17,0.6)]" : ""
          }`}
          style={{ paddingTop: "env(safe-area-inset-top)" }}
        >
          <div className="relative flex h-[56px] items-center justify-between px-4">
            <Link
              href="/wali/beranda"
              aria-label="Kembali ke beranda"
              className="relative z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 transition hover:bg-white/20 active:scale-90"
            >
              <ArrowLeft size={18} strokeWidth={2} />
            </Link>

            <div className="pointer-events-none absolute inset-x-0 flex h-full items-center justify-center overflow-hidden">
              <h1
                className={`absolute text-[16px] font-semibold tracking-[-0.2px] transition-all duration-300 ${
                  mini && history.length > 0
                    ? "-translate-y-3 opacity-0"
                    : "translate-y-0 opacity-100"
                }`}
              >
                Riwayat Deposit
              </h1>

              {history.length > 0 && (
                <p
                  className={`absolute text-[16px] font-semibold tracking-[-0.2px] tabular-nums transition-all duration-300 ${
                    mini
                      ? "translate-y-0 opacity-100"
                      : "translate-y-3 opacity-0"
                  }`}
                >
                  {rupiah(totals.deposit)}
                </p>
              )}
            </div>

            <div className="relative z-10 flex h-10 min-w-10 items-center justify-center gap-[6px] rounded-full bg-white/10 px-3 text-[12px] font-semibold tabular-nums">
              <ReceiptText size={15} strokeWidth={2} />
              {history.length}
            </div>
          </div>
        </header>

        {/* ==================================
            HERO
        ================================== */}
        <section className="relative overflow-hidden rounded-b-[30px] bg-[#0E5A35] px-5 pb-[78px] pt-[14px] text-white">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-[70px] -top-[90px] h-[240px] w-[240px] rounded-full bg-white/[0.04]"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -left-[50px] bottom-[-70px] h-[160px] w-[160px] rounded-full bg-[#FFC93C]/[0.08]"
          />

          <div className="relative text-center">
            <p className="text-[12px] font-medium text-[#B7D9C4]">
              Total Deposit
            </p>

            <p className="mt-[10px] text-[40px] font-bold leading-none tracking-[-1.5px] tabular-nums max-[360px]:text-[34px]">
              {loading ? "..." : rupiah(heroAmount)}
            </p>
          </div>
        </section>

        {/* ==================================
            KARTU RINGKASAN
        ================================== */}
        <div className="relative z-10 -mt-[48px] px-4">
          <div className="dp-up rounded-[22px] border border-[#E4ECE6] bg-white p-4 shadow-[0_14px_30px_-18px_rgba(14,90,53,0.45)]">
            <div className="flex items-baseline justify-between gap-3">
              <span className="text-[12px] font-medium text-[#6B7C71]">
                Total Pembayaran
              </span>
              <span className="text-[15px] font-bold tracking-[-0.3px] tabular-nums">
                {rupiah(totals.payment)}
              </span>
            </div>

            <div className="mt-[14px] flex h-[8px] w-full overflow-hidden rounded-full bg-[#EAF0EB]">
              <span
                className="h-full rounded-full bg-[#17803F] transition-[width] duration-[900ms] ease-out"
                style={{
                  width: barReady && totals.payment > 0 ? `${totals.depositShare}%` : "0%",
                }}
              />
              <span
                className="h-full flex-1 bg-[#FFC93C]"
                style={{
                  opacity: barReady && totals.payment > 0 ? 1 : 0,
                  transition: "opacity 600ms ease-out 300ms",
                }}
              />
            </div>

            <div className="mt-[14px] grid grid-cols-2 gap-3">
              <div className="flex items-start gap-[9px]">
                <span className="mt-[5px] h-[8px] w-[8px] shrink-0 rounded-full bg-[#17803F]" />
                <div className="min-w-0">
                  <p className="text-[11px] text-[#6B7C71]">Deposit</p>
                  <p className="mt-[2px] truncate text-[13px] font-semibold tabular-nums">
                    {rupiah(totals.deposit)}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-[9px]">
                <span className="mt-[5px] h-[8px] w-[8px] shrink-0 rounded-full bg-[#FFC93C]" />
                <div className="min-w-0">
                  <p className="text-[11px] text-[#6B7C71]">Biaya Admin</p>
                  <p className="mt-[2px] truncate text-[13px] font-semibold tabular-nums">
                    {rupiah(totals.admin)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ==================================
            RIWAYAT
        ================================== */}
        <section className="flex-1 px-4 pt-[26px]">
          <h2 className="px-1 text-[18px] font-bold tracking-[-0.4px]">
            Riwayat
          </h2>

          {loading ? (
            <div className="mt-[14px] space-y-[10px]">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="dp-skel h-[68px] rounded-[18px]"
                  style={{ animationDelay: `${i * 120}ms` }}
                />
              ))}
            </div>
          ) : history.length === 0 ? (
            <div className="flex min-h-[190px] flex-col items-center justify-center text-center">
              <span className="flex h-[60px] w-[60px] items-center justify-center rounded-[20px] bg-[#E6F3EA] text-[#17803F]">
                <ReceiptText size={27} strokeWidth={1.7} />
              </span>

              <p className="mt-[14px] text-[14px] font-semibold text-[#3A5143]">
                Belum ada deposit
              </p>
            </div>
          ) : (
            <div className="mt-[14px]">
              {groups.map((group) => (
                <div key={group.key} className="mb-[20px]">
                  <p className="mb-[8px] px-1 text-[12px] font-semibold text-[#6B7C71]">
                    {group.label}
                  </p>

                  <ul className="divide-y divide-[#EDF2EE] overflow-hidden rounded-[20px] border border-[#E4ECE6] bg-white">
                    {group.items.map(({ item, index }) => (
                      <li
                        key={`${item.createdAt}-${item.bankId}-${index}`}
                        className="dp-up"
                        style={{
                          animationDelay: `${Math.min(index, 8) * 45 + 100}ms`,
                        }}
                      >
                        <button
                          type="button"
                          onClick={() => setSelected(item)}
                          className="group flex w-full min-w-0 items-center gap-3 px-4 py-[13px] text-left transition-colors hover:bg-[#F7FAF8] active:bg-[#F0F5F1]"
                        >
                          <BankLogo
                            logo={item.bankLogo}
                            name={item.bankName}
                            className="h-[44px] w-[52px]"
                          />

                          <div className="min-w-0 flex-1">
                            <p className="truncate text-[14px] font-semibold">
                              {item.bankName}
                            </p>
                            <p className="mt-[3px] text-[12px] text-[#6B7C71] tabular-nums">
                              {formatTime(item.createdAt)} WIB
                            </p>
                          </div>

                          <p className="shrink-0 whitespace-nowrap text-[14px] font-bold tracking-[-0.2px] text-[#17803F] tabular-nums">
                            +{rupiah(item.depositAmount)}
                          </p>

                          <ChevronRight
                            size={16}
                            strokeWidth={2}
                            className="shrink-0 text-[#B2C1B6] transition-transform duration-200 group-hover:translate-x-[2px]"
                          />
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* ==================================
            CTA STICKY
        ================================== */}
        <div
          className="pointer-events-none sticky bottom-0 z-40 px-4 pb-[max(16px,env(safe-area-inset-bottom))] pt-[30px]"
          style={{
            background:
              "linear-gradient(to top,#F5F8F5 58%,rgba(245,248,245,0))",
          }}
        >
          <Link
            href="/wali/deposit"
            className="pointer-events-auto flex h-[52px] w-full items-center justify-center gap-2 rounded-[16px] bg-[#FFC93C] text-[14px] font-bold text-[#14351F] shadow-[0_12px_24px_-12px_rgba(214,160,0,0.9)] transition hover:bg-[#FFD04F] active:scale-[0.98]"
          >
            Deposit Lagi
            <ArrowRight size={17} strokeWidth={2.4} />
          </Link>
        </div>
      </div>

      {/* ==================================
          MODAL DETAIL DEPOSIT
      ================================== */}
      {selected && (
        <DetailSheet
          receipt={selected}
          closing={closing}
          onClose={requestClose}
        />
      )}
    </main>
  );
}
