"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import Image from "next/image";
import Link from "next/link";
import { Plus_Jakarta_Sans } from "next/font/google";

import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  ChevronRight,
  Info,
  Search,
  X,
} from "lucide-react";

// ==========================================
// DOSI PAY — SPP CICILAN
// ==========================================

// Font mengikuti beranda. Tidak mau pakai Google Font?
// Hapus import + konstanta `jakarta`, lalu ganti `jakarta.className` dengan "font-sans".
const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

const DEMO_BILL = {
  id: "spp-demo-001",
  student: "Ahmad Fauzan",
  nis: "20260001",
  period: "SPP Tahun Ajaran 2026/2027",
  total: 1200000,
};

const STORAGE_KEY = `dosi_demo_spp_${DEMO_BILL.id}`;

const QUICK_AMOUNTS = [50000, 100000, 200000];

// 12 segmen = 12 bulan. Setiap segmen mewakili 1/12 tagihan (Rp100.000).
const SEGMENTS = 12;
const SEGMENT_VALUE = DEMO_BILL.total / SEGMENTS;

const BANKS = [
  { id: "bri", name: "BRI", logo: "/banks/bri.svg" },
  { id: "bca", name: "BCA", logo: "/banks/bca.svg" },
  { id: "mandiri", name: "Mandiri", logo: "/banks/mandiri.svg" },
  { id: "bni", name: "BNI", logo: "/banks/bni.svg" },
  { id: "bsi", name: "BSI", logo: "/banks/bsi.svg" },
  { id: "cimb", name: "CIMB Niaga", logo: "/banks/cimb-niaga.svg" },
  { id: "permata", name: "PermataBank", logo: "/banks/permata.svg" },
  { id: "btn", name: "BTN", logo: "/banks/btn.svg" },
  { id: "danamon", name: "Danamon", logo: "/banks/danamon.svg" },
  { id: "ocbc", name: "OCBC", logo: "/banks/ocbc-nisp.svg" },
  { id: "maybank", name: "Maybank", logo: "/banks/maybank.svg" },
  { id: "mega", name: "Bank Mega", logo: "/banks/mega.svg" },
  { id: "bjb", name: "Bank BJB", logo: "/banks/bank-bjb.svg" },
  { id: "jago", name: "Bank Jago", logo: "/banks/jago.svg" },
  { id: "seabank", name: "SeaBank", logo: "/banks/seabank.svg" },
] as const;

type Bank = (typeof BANKS)[number];
type BankId = Bank["id"];

type Payment = {
  id: string;
  amount: number;
  bankId: BankId;
  createdAt: string;
  isDemo: true;
};

function cssVars(vars: Record<string, string | number>): CSSProperties {
  return vars as unknown as CSSProperties;
}
const rise = (index: number) => cssVars({ "--i": index });

// ==========================================
// HELPERS
// ==========================================

function rupiah(value: number) {
  return `Rp${value.toLocaleString("id-ID")}`;
}

function formatDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "-";

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

function getBank(id: BankId): Bank {
  return BANKS.find((bank) => bank.id === id) ?? BANKS[0];
}

function validatePayment(value: unknown): value is Payment {
  if (!value || typeof value !== "object") return false;

  const item = value as Record<string, unknown>;

  return (
    item.isDemo === true &&
    typeof item.id === "string" &&
    typeof item.amount === "number" &&
    Number.isSafeInteger(item.amount) &&
    item.amount > 0 &&
    item.amount <= DEMO_BILL.total &&
    typeof item.bankId === "string" &&
    BANKS.some((bank) => bank.id === item.bankId) &&
    typeof item.createdAt === "string" &&
    Number.isFinite(Date.parse(item.createdAt))
  );
}

function readPayments(): Payment[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];

    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    const valid = parsed
      .filter(validatePayment)
      .sort((a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt));

    let total = 0;
    const accepted: Payment[] = [];
    const seen = new Set<string>();

    for (const item of valid) {
      if (seen.has(item.id)) continue;
      if (total + item.amount > DEMO_BILL.total) continue;

      seen.add(item.id);
      total += item.amount;
      accepted.push(item);
    }

    return accepted.slice(-100);
  } catch {
    return [];
  }
}

// Angka berubah halus dari nilai sebelumnya ke nilai baru
function useAnimatedNumber(target: number, duration = 800) {
  const [value, setValue] = useState(target);
  const fromRef = useRef(target);

  useEffect(() => {
    if (fromRef.current === target) return undefined;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      fromRef.current = target;
      setValue(target);
      return undefined;
    }

    const from = fromRef.current;
    const start = performance.now();
    let frame = 0;

    const tick = (time: number) => {
      const progress = Math.min(1, (time - start) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      const next = Math.round(from + (target - from) * eased);

      fromRef.current = next;
      setValue(next);

      if (progress < 1) frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);

    return () => cancelAnimationFrame(frame);
  }, [target, duration]);

  return value;
}

// ==========================================
// BANK LOGO
// ==========================================

function BankLogo({
  bank,
  className = "",
}: {
  bank: Bank;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [bank.logo]);

  return (
    <span
      className={`flex shrink-0 items-center justify-center overflow-hidden rounded-[10px] bg-white ${className}`}
    >
      {failed ? (
        <span className="px-1 text-center text-[10px] font-bold text-[#105D38]">
          {bank.name}
        </span>
      ) : (
        <Image
          src={bank.logo}
          alt={`Logo ${bank.name}`}
          width={80}
          height={44}
          unoptimized
          onError={() => setFailed(true)}
          className="h-full w-full object-contain p-[6px]"
        />
      )}
    </span>
  );
}

// ==========================================
// BOTTOM SHEET
// ==========================================

function Sheet({
  labelledBy,
  zIndex,
  onClose,
  closeLabel,
  centerText = false,
  children,
}: {
  labelledBy: string;
  zIndex: number;
  onClose?: () => void;
  closeLabel?: string;
  centerText?: boolean;
  children: ReactNode;
}) {
  return (
    <div
      className="fixed inset-0 flex items-end justify-center sm:items-center sm:p-5"
      style={{ zIndex }}
    >
      {onClose ? (
        <button
          type="button"
          aria-label={closeLabel}
          onClick={onClose}
          className="spp-backdrop absolute inset-0 bg-[#0F1B14]/45"
        />
      ) : (
        <div className="spp-backdrop absolute inset-0 bg-[#0F1B14]/45" />
      )}

      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        className={`spp-sheet relative flex max-h-[88dvh] w-full max-w-[430px] flex-col overflow-y-auto rounded-t-[28px] bg-white px-5 pb-[max(22px,env(safe-area-inset-bottom))] pt-3 shadow-[0_-20px_50px_-30px_rgba(15,27,20,0.45)] sm:rounded-[28px] ${
          centerText ? "text-center" : ""
        }`}
      >
        <span
          aria-hidden="true"
          className="mx-auto mb-3 h-[4px] w-[36px] shrink-0 rounded-full bg-[#DDE4DE] sm:hidden"
        />
        {children}
      </section>
    </div>
  );
}

function SheetHeader({
  id,
  title,
  onClose,
}: {
  id: string;
  title: string;
  onClose: () => void;
}) {
  return (
    <div className="flex items-center justify-between">
      <h2 id={id} className="text-[17px] font-bold tracking-[-0.3px]">
        {title}
      </h2>

      <button
        type="button"
        aria-label="Tutup"
        onClick={onClose}
        className="spp-tap flex h-[36px] w-[36px] items-center justify-center rounded-full bg-[#F1F4F1]"
      >
        <X size={18} />
      </button>
    </div>
  );
}

// ==========================================
// MAIN PAGE
// ==========================================

export default function WaliSppPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [ready, setReady] = useState(false);

  const [bankId, setBankId] = useState<BankId>("bri");
  const [amountInput, setAmountInput] = useState("100000");

  const [showBanks, setShowBanks] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showInfo, setShowInfo] = useState(false);

  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [scrolled, setScrolled] = useState(false);

  const [lastPayment, setLastPayment] = useState<Payment | null>(null);

  // ========================================
  // LOAD PAYMENT HISTORY
  // ========================================

  useEffect(() => {
    setPayments(readPayments());
    setReady(true);
  }, []);

  // Garis tipis di bawah header muncul saat halaman digulir
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 4);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // ========================================
  // MODAL SCROLL LOCK
  // ========================================

  useEffect(() => {
    const modalOpen = showBanks || showConfirm || showSuccess || showInfo;

    if (!modalOpen) return undefined;

    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleEscape(event: KeyboardEvent) {
      if (event.key !== "Escape") return;

      setShowBanks(false);
      setShowConfirm(false);
      setShowInfo(false);
      setShowSuccess(false);
    }

    window.addEventListener("keydown", handleEscape);

    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", handleEscape);
    };
  }, [showBanks, showConfirm, showSuccess, showInfo]);

  // ========================================
  // CALCULATIONS
  // ========================================

  const totalPaid = useMemo(
    () => payments.reduce((sum, item) => sum + item.amount, 0),
    [payments]
  );

  const remaining = Math.max(0, DEMO_BILL.total - totalPaid);

  const percentage = Math.min(
    100,
    Math.round((totalPaid / DEMO_BILL.total) * 100)
  );

  const isPaidOff = remaining === 0;
  const amount = Number(amountInput || "0");

  const isValidAmount =
    Number.isSafeInteger(amount) && amount > 0 && amount <= remaining;

  const selectedBank = getBank(bankId);

  const filteredBanks = BANKS.filter((bank) =>
    bank.name.toLowerCase().includes(search.trim().toLowerCase())
  );

  // Sisa tagihan setelah tiap cicilan, dihitung dari yang paling lama
  const history = useMemo(() => {
    const ascending = [...payments].sort(
      (a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt)
    );

    let paid = 0;

    return ascending
      .map((payment) => {
        paid += payment.amount;
        return { payment, left: Math.max(0, DEMO_BILL.total - paid) };
      })
      .reverse();
  }, [payments]);

  const remainingShown = useAnimatedNumber(remaining);
  const paidShown = useAnimatedNumber(totalPaid);

  // ========================================
  // ACTIONS
  // ========================================

  function handleAmountChange(value: string) {
    setAmountInput(value.replace(/\D/g, "").slice(0, 12));
    setError("");
  }

  function chooseAmount(value: number) {
    setAmountInput(String(value));
    setError("");
  }

  function closeBanks() {
    setShowBanks(false);
    setSearch("");
  }

  function openConfirm() {
    setError("");

    if (!ready) return;

    if (isPaidOff) {
      setError("Tagihan SPP sudah lunas.");
      return;
    }

    if (!isValidAmount) {
      setError(
        amount <= 0
          ? "Masukkan nominal cicilan."
          : "Nominal tidak boleh melebihi sisa tagihan."
      );
      return;
    }

    setShowConfirm(true);
  }

  function confirmPayment() {
    const currentPaid = payments.reduce((sum, item) => sum + item.amount, 0);
    const currentRemaining = Math.max(0, DEMO_BILL.total - currentPaid);

    if (
      !ready ||
      !Number.isSafeInteger(amount) ||
      amount <= 0 ||
      amount > currentRemaining
    ) {
      setShowConfirm(false);
      setError("Nominal cicilan tidak valid.");
      return;
    }

    const payment: Payment = {
      id: `SPP-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      amount,
      bankId,
      createdAt: new Date().toISOString(),
      isDemo: true,
    };

    const updated = [...payments, payment];

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));

      setPayments(updated);
      setLastPayment(payment);
      setAmountInput("");
      setError("");

      setShowConfirm(false);
      setShowSuccess(true);
    } catch {
      setShowConfirm(false);
      setError("Gagal menyimpan pembayaran demo.");
    }
  }

  const statusLabel = isPaidOff
    ? "Lunas"
    : totalPaid > 0
      ? "Dicicil"
      : "Belum dibayar";

  return (
    <main
      className={`${jakarta.className} min-h-[100dvh] w-full bg-[#EEF2EF] text-[#17251D] antialiased`}
    >
      <div className="mx-auto min-h-[100dvh] w-full max-w-[430px] bg-white sm:shadow-[0_0_0_1px_#E1E7E2]">
        {/* =====================================
            STICKY HEADER
        ===================================== */}

        <header
          className={`sticky top-0 z-40 bg-white pt-[env(safe-area-inset-top)] transition-shadow duration-300 ${
            scrolled ? "shadow-[0_1px_0_#E1E7E2]" : "shadow-[0_1px_0_transparent]"
          }`}
        >
          <div className="grid h-[64px] grid-cols-[44px_1fr_44px] items-center px-5">
            <Link
              href="/wali/beranda"
              aria-label="Kembali ke beranda"
              className="spp-tap spp-focus flex h-[44px] w-[44px] items-center justify-center rounded-[16px] border border-[#E1E7E2] bg-white hover:bg-[#F6F8F6]"
            >
              <ArrowLeft size={20} strokeWidth={1.8} />
            </Link>

            <h1 className="text-center text-[16px] font-bold tracking-[-0.3px]">
              Cicilan SPP
            </h1>

            <button
              type="button"
              onClick={() => setShowInfo(true)}
              aria-label="Informasi SPP"
              className="spp-tap spp-focus flex h-[44px] w-[44px] items-center justify-center rounded-[16px] border border-[#E1E7E2] bg-white hover:bg-[#F6F8F6]"
            >
              <Info size={20} strokeWidth={1.8} />
            </button>
          </div>
        </header>

        <div className="px-5 pb-[calc(116px+env(safe-area-inset-bottom))]">
          {/* =====================================
              RINGKASAN TAGIHAN
          ===================================== */}

          <section
            aria-label="Ringkasan tagihan SPP"
            className="spp-rise mt-3 rounded-[24px] bg-[#105D38] p-5 text-white"
            style={rise(0)}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[12px] font-medium text-white/70">
                  {DEMO_BILL.period}
                </p>

                <p className="mt-[6px] text-[14px] font-semibold">
                  {DEMO_BILL.student}
                </p>

                <p className="mt-[2px] text-[12px] text-white/60">
                  NIS {DEMO_BILL.nis}
                </p>
              </div>

              <span
                key={statusLabel}
                className={`spp-money-enter shrink-0 rounded-full px-[11px] py-[6px] text-[11.5px] font-semibold leading-none ${
                  isPaidOff
                    ? "bg-[#4CD080] text-[#0B3D26]"
                    : "bg-white/12 text-white"
                }`}
              >
                {statusLabel}
              </span>
            </div>

            <p className="mt-7 text-[12px] text-white/70">Sisa tagihan</p>

            <p
              aria-live="polite"
              className="mt-[6px] break-words text-[36px] font-extrabold leading-none tracking-[-1.4px] tabular-nums max-[360px]:text-[31px]"
            >
              {rupiah(remainingShown)}
            </p>

            {/* PROGRESS 12 SEGMEN */}
            <div
              role="progressbar"
              aria-label="Progres pelunasan SPP"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={percentage}
              className="mt-6 flex gap-[3px]"
            >
              {Array.from({ length: SEGMENTS }, (_, i) => {
                const fill = Math.max(
                  0,
                  Math.min(1, (totalPaid - i * SEGMENT_VALUE) / SEGMENT_VALUE)
                );

                return (
                  <span
                    key={i}
                    aria-hidden="true"
                    className="relative h-[8px] flex-1 overflow-hidden rounded-[3px] bg-white/15"
                  >
                    <span
                      className="spp-seg absolute inset-0 rounded-[3px] bg-[#4CD080]"
                      style={{
                        transform: `scaleX(${fill})`,
                        transitionDelay: `${i * 45}ms`,
                      }}
                    />
                  </span>
                );
              })}
            </div>

            <div className="mt-[9px] flex items-center justify-between gap-3 text-[11.5px] text-white/70">
              <span className="font-semibold text-white">
                {percentage}% terbayar
              </span>

              <span>1 segmen = {rupiah(SEGMENT_VALUE)}</span>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-4 border-t border-white/15 pt-4">
              <div>
                <p className="text-[11.5px] text-white/65">Sudah dibayar</p>
                <p className="mt-[4px] break-words text-[14px] font-bold tabular-nums">
                  {rupiah(paidShown)}
                </p>
              </div>

              <div>
                <p className="text-[11.5px] text-white/65">Total tagihan</p>
                <p className="mt-[4px] break-words text-[14px] font-bold tabular-nums">
                  {rupiah(DEMO_BILL.total)}
                </p>
              </div>
            </div>
          </section>

          {/* =====================================
              BAYAR CICILAN
          ===================================== */}

          <section
            aria-label="Bayar cicilan"
            className="spp-rise mt-8"
            style={rise(1)}
          >
            <h2 className="text-[16px] font-bold tracking-[-0.3px]">
              Bayar cicilan
            </h2>

            <p className="mt-[3px] text-[12.5px] text-[#6F7D74]">
              Nominal bebas, sampai sisa tagihan.
            </p>

            {!isPaidOff ? (
              <>
                {/* AMOUNT FIELD */}
                <label
                  htmlFor="spp-amount"
                  className="mt-5 block text-[12.5px] font-semibold"
                >
                  Nominal pembayaran
                </label>

                <div
                  className={`mt-2 flex h-[68px] items-center rounded-[18px] border bg-[#F6F8F6] px-4 transition-[border-color,box-shadow,background-color] duration-200 focus-within:border-[#278353] focus-within:bg-white focus-within:shadow-[0_0_0_4px_rgba(39,131,83,0.10)] ${
                    error ? "border-red-400" : "border-[#E1E7E2]"
                  }`}
                >
                  <span className="mr-2 text-[18px] font-semibold text-[#105D38]">
                    Rp
                  </span>

                  <input
                    id="spp-amount"
                    type="text"
                    inputMode="numeric"
                    autoComplete="off"
                    value={amountInput ? amount.toLocaleString("id-ID") : ""}
                    onChange={(event) => handleAmountChange(event.target.value)}
                    placeholder="0"
                    aria-invalid={Boolean(error)}
                    aria-describedby="spp-amount-help"
                    className="min-w-0 flex-1 bg-transparent text-[28px] font-extrabold tracking-[-0.8px] text-[#17251D] outline-none placeholder:font-semibold placeholder:text-[#B2BCB5]"
                  />
                </div>

                <p
                  id="spp-amount-help"
                  className="mt-[7px] text-[11.5px] text-[#6F7D74]"
                >
                  Maksimal {rupiah(remaining)}
                </p>

                {error && (
                  <p
                    role="alert"
                    className="spp-money-enter mt-[6px] text-[12px] font-medium text-red-500"
                  >
                    {error}
                  </p>
                )}

                {/* QUICK AMOUNTS */}
                <div className="mt-4 grid grid-cols-4 gap-2">
                  {QUICK_AMOUNTS.map((value) => {
                    const selected = amount === value;
                    const disabled = value > remaining;

                    return (
                      <button
                        key={value}
                        type="button"
                        disabled={disabled}
                        aria-pressed={selected}
                        onClick={() => chooseAmount(value)}
                        className={`spp-tap spp-focus ${
                          selected ? "spp-selected" : ""
                        } h-[42px] rounded-[12px] border text-[13px] font-semibold ${
                          selected
                            ? "border-[#176B45] bg-[#EAF7EE] text-[#176B45]"
                            : "border-[#E1E7E2] bg-white text-[#4F5F55]"
                        } disabled:cursor-not-allowed disabled:opacity-35`}
                      >
                        {value / 1000}K
                      </button>
                    );
                  })}

                  <button
                    type="button"
                    aria-pressed={amount === remaining}
                    onClick={() => chooseAmount(remaining)}
                    className={`spp-tap spp-focus ${
                      amount === remaining ? "spp-selected" : ""
                    } h-[42px] rounded-[12px] border text-[13px] font-semibold ${
                      amount === remaining
                        ? "border-[#176B45] bg-[#EAF7EE] text-[#176B45]"
                        : "border-[#E1E7E2] bg-white text-[#4F5F55]"
                    }`}
                  >
                    Lunasi
                  </button>
                </div>

                {/* BANK */}
                <button
                  type="button"
                  onClick={() => setShowBanks(true)}
                  className="spp-tap spp-focus mt-5 flex w-full items-center gap-3 rounded-[16px] border border-[#E1E7E2] bg-white px-3 py-[10px] text-left hover:bg-[#F6F8F6]"
                >
                  <BankLogo
                    bank={selectedBank}
                    className="h-[40px] w-[60px] border border-[#EAEFEB]"
                  />

                  <span className="min-w-0 flex-1">
                    <span className="block text-[11.5px] text-[#6F7D74]">
                      Transfer lewat
                    </span>

                    <span className="mt-[1px] block text-[14px] font-semibold">
                      {selectedBank.name}
                    </span>
                  </span>

                  <ChevronRight
                    size={18}
                    className="shrink-0 text-[#8E9A91]"
                  />
                </button>

                {/* SISA SETELAH BAYAR */}
                <div className="mt-3 flex items-center justify-between gap-3 rounded-[14px] bg-[#F6F8F6] px-4 py-[13px]">
                  <span className="text-[12.5px] text-[#6F7D74]">
                    Sisa setelah bayar
                  </span>

                  <span
                    key={`${amount}-${remaining}`}
                    className="spp-money-enter text-[14px] font-bold tabular-nums text-[#105D38]"
                  >
                    {rupiah(Math.max(0, remaining - amount))}
                  </span>
                </div>
              </>
            ) : (
              <div className="mt-5 rounded-[18px] bg-[#F6F8F6] px-4 py-6 text-center">
                <CheckCircle2
                  size={30}
                  className="spp-success-pop mx-auto text-[#1F8754]"
                />

                <p className="mt-3 text-[14px] font-semibold text-[#175C3A]">
                  SPP sudah lunas
                </p>

                <p className="mt-1 text-[12.5px] text-[#6F7D74]">
                  Semua cicilan sudah tercatat.
                </p>
              </div>
            )}
          </section>

          {/* =====================================
              RIWAYAT CICILAN
          ===================================== */}

          <section
            aria-label="Riwayat cicilan"
            className="spp-rise mt-9"
            style={rise(2)}
          >
            <div className="flex items-baseline justify-between gap-3">
              <h2 className="text-[16px] font-bold tracking-[-0.3px]">
                Riwayat cicilan
              </h2>

              <span className="text-[12px] text-[#6F7D74]">
                {payments.length} transaksi
              </span>
            </div>

            {!ready ? (
              <div
                aria-hidden="true"
                className="mt-4 animate-pulse space-y-4"
              >
                {[0, 1].map((i) => (
                  <div key={i} className="flex items-center gap-3">
                    <span className="h-[40px] w-[56px] rounded-[10px] bg-[#EEF2EF]" />
                    <span className="flex-1">
                      <span className="block h-[11px] w-[40%] rounded-full bg-[#EEF2EF]" />
                      <span className="mt-2 block h-[9px] w-[65%] rounded-full bg-[#F3F6F4]" />
                    </span>
                  </div>
                ))}
              </div>
            ) : history.length === 0 ? (
              <div className="mt-4 rounded-[16px] bg-[#F6F8F6] px-4 py-6 text-center">
                <p className="text-[13.5px] font-semibold">
                  Belum ada cicilan
                </p>

                <p className="mx-auto mt-1 max-w-[240px] text-[12.5px] leading-[19px] text-[#6F7D74]">
                  Cicilan yang Anda bayar akan tercatat di sini.
                </p>
              </div>
            ) : (
              <ul className="mt-2">
                {history.map(({ payment, left }) => {
                  const bank = getBank(payment.bankId);

                  return (
                    <li
                      key={payment.id}
                      className="spp-history-enter flex items-center gap-3 border-b border-[#EEF2EF] py-[14px] last:border-b-0"
                    >
                      <BankLogo
                        bank={bank}
                        className="h-[40px] w-[56px] border border-[#EAEFEB]"
                      />

                      <div className="min-w-0 flex-1">
                        <p className="text-[13.5px] font-semibold">
                          Cicilan SPP
                        </p>

                        <p className="mt-[3px] truncate text-[11.5px] text-[#6F7D74]">
                          {bank.name}, {formatDate(payment.createdAt)}
                        </p>
                      </div>

                      <div className="shrink-0 text-right">
                        <p className="text-[13.5px] font-bold tabular-nums text-[#105D38]">
                          {rupiah(payment.amount)}
                        </p>

                        <p className="mt-[3px] text-[11.5px] tabular-nums text-[#6F7D74]">
                          Sisa {rupiah(left)}
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          {/* CATATAN SIMULASI */}
          <div className="mt-7 flex items-start gap-2">
            <Info
              size={15}
              strokeWidth={1.8}
              className="mt-[2px] shrink-0 text-[#5A8E6C]"
            />

            <p className="text-[11.5px] leading-[18px] text-[#6F7D74]">
              Halaman ini masih simulasi cicilan SPP. Pembayaran nyata dan
              status lunas resmi akan mengikuti data backend DOSI Pay.
            </p>
          </div>
        </div>
      </div>

      {/* =====================================
          BAR AKSI BAWAH
      ===================================== */}

      {!isPaidOff && (
        <div className="spp-bar fixed inset-x-0 bottom-0 z-30">
          <div className="mx-auto flex w-full max-w-[430px] items-center gap-4 border-t border-[#E1E7E2] bg-white px-5 pb-[max(14px,env(safe-area-inset-bottom))] pt-3">
            <div className="min-w-0 flex-1">
              <p className="text-[11.5px] text-[#6F7D74]">Total bayar</p>

              <p className="truncate text-[18px] font-extrabold leading-[24px] tracking-[-0.4px] tabular-nums">
                {rupiah(amount)}
              </p>
            </div>

            <button
              type="button"
              onClick={openConfirm}
              disabled={!ready}
              className="spp-tap spp-focus group flex h-[48px] shrink-0 items-center gap-2 rounded-[14px] bg-[#105D38] px-6 text-[14px] font-semibold text-white hover:bg-[#0C4D2F] disabled:opacity-50"
            >
              Lanjutkan
              <ArrowRight
                size={16}
                strokeWidth={2.2}
                className="transition-transform duration-200 group-hover:translate-x-[3px]"
              />
            </button>
          </div>
        </div>
      )}

      {/* =====================================
          PILIH BANK
      ===================================== */}

      {showBanks && (
        <Sheet
          labelledBy="spp-bank-title"
          zIndex={100}
          onClose={closeBanks}
          closeLabel="Tutup daftar bank"
        >
          <SheetHeader
            id="spp-bank-title"
            title="Pilih bank"
            onClose={closeBanks}
          />

          <div className="mt-4 flex h-[44px] shrink-0 items-center gap-[10px] rounded-[12px] border border-[#E1E7E2] bg-[#F6F8F6] px-3 focus-within:border-[#278353] focus-within:bg-white">
            <Search size={17} className="text-[#8E9A91]" />

            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Cari bank"
              aria-label="Cari nama bank"
              className="min-w-0 flex-1 bg-transparent text-[13.5px] outline-none placeholder:text-[#9AA69D]"
            />
          </div>

          <div className="mt-2 min-h-0 flex-1 overflow-y-auto overscroll-contain">
            {filteredBanks.map((bank) => (
              <button
                key={bank.id}
                type="button"
                onClick={() => {
                  setBankId(bank.id);
                  closeBanks();
                }}
                className="spp-tap flex w-full items-center gap-3 border-b border-[#EEF2EF] py-[10px] text-left"
              >
                <BankLogo
                  bank={bank}
                  className="h-[38px] w-[60px] border border-[#EAEFEB]"
                />

                <span className="min-w-0 flex-1 text-[14px] font-medium">
                  {bank.name}
                </span>

                {bank.id === bankId && (
                  <Check size={18} className="text-[#176B45]" />
                )}
              </button>
            ))}

            {filteredBanks.length === 0 && (
              <p className="py-8 text-center text-[13px] text-[#6F7D74]">
                Bank tidak ditemukan. Coba nama lain.
              </p>
            )}
          </div>
        </Sheet>
      )}

      {/* =====================================
          KONFIRMASI
      ===================================== */}

      {showConfirm && (
        <Sheet
          labelledBy="spp-confirm-title"
          zIndex={110}
          onClose={() => setShowConfirm(false)}
          closeLabel="Tutup konfirmasi"
        >
          <SheetHeader
            id="spp-confirm-title"
            title="Konfirmasi pembayaran"
            onClose={() => setShowConfirm(false)}
          />

          <div className="mt-6 text-center">
            <p className="text-[12px] text-[#6F7D74]">Nominal cicilan</p>

            <p className="spp-money-enter mt-[6px] break-words text-[32px] font-extrabold tracking-[-1.1px] tabular-nums text-[#105D38]">
              {rupiah(amount)}
            </p>
          </div>

          <dl className="mt-6 rounded-[16px] bg-[#F6F8F6] px-4 py-[6px]">
            <div className="flex justify-between gap-4 py-[11px]">
              <dt className="text-[12.5px] text-[#6F7D74]">Santri</dt>
              <dd className="text-[13px] font-semibold">{DEMO_BILL.student}</dd>
            </div>

            <div className="flex justify-between gap-4 border-t border-[#E3E9E4] py-[11px]">
              <dt className="text-[12.5px] text-[#6F7D74]">Bank</dt>
              <dd className="text-[13px] font-semibold">{selectedBank.name}</dd>
            </div>

            <div className="flex justify-between gap-4 border-t border-[#E3E9E4] py-[11px]">
              <dt className="text-[12.5px] text-[#6F7D74]">Sisa tagihan</dt>
              <dd className="text-[13px] font-semibold tabular-nums">
                {rupiah(remaining)}
              </dd>
            </div>

            <div className="flex justify-between gap-4 border-t border-dashed border-[#D5DED7] py-[12px]">
              <dt className="text-[13px] font-semibold">Sisa setelah bayar</dt>
              <dd className="text-[14px] font-bold tabular-nums text-[#105D38]">
                {rupiah(Math.max(0, remaining - amount))}
              </dd>
            </div>
          </dl>

          <p className="mt-3 text-[11.5px] leading-[18px] text-[#6F7D74]">
            Pembayaran ini hanya simulasi. Belum ada transfer bank sungguhan.
          </p>

          <button
            type="button"
            onClick={confirmPayment}
            className="spp-tap spp-focus group mt-5 flex h-[50px] w-full items-center justify-center gap-2 rounded-[14px] bg-[#105D38] text-[14px] font-semibold text-white hover:bg-[#0C4D2F]"
          >
            Bayar {rupiah(amount)}
            <ArrowRight
              size={16}
              strokeWidth={2.2}
              className="transition-transform duration-200 group-hover:translate-x-[3px]"
            />
          </button>
        </Sheet>
      )}

      {/* =====================================
          BERHASIL
      ===================================== */}

      {showSuccess && lastPayment && (
        <Sheet labelledBy="spp-success-title" zIndex={120} centerText>
          <div className="pt-3">
            <div className="spp-success-pop mx-auto flex h-[64px] w-[64px] items-center justify-center rounded-full bg-[#EAF7EE] text-[#1F8754]">
              <Check
                size={32}
                strokeWidth={2.6}
                className="spp-check-enter"
              />
            </div>

            <h2
              id="spp-success-title"
              className="spp-money-enter mt-4 text-[20px] font-extrabold tracking-[-0.5px]"
            >
              Cicilan tercatat
            </h2>

            <p className="mt-[5px] text-[12.5px] text-[#6F7D74]">
              Pembayaran simulasi berhasil disimpan.
            </p>

            <p className="spp-money-enter mt-4 text-[30px] font-extrabold tracking-[-1.1px] tabular-nums text-[#105D38]">
              {rupiah(lastPayment.amount)}
            </p>

            <dl className="mt-5 rounded-[16px] bg-[#F6F8F6] px-4 py-[6px] text-left">
              <div className="flex justify-between gap-4 py-[11px]">
                <dt className="text-[12.5px] text-[#6F7D74]">Bank</dt>
                <dd className="text-[13px] font-semibold">
                  {getBank(lastPayment.bankId).name}
                </dd>
              </div>

              <div className="flex justify-between gap-4 border-t border-[#E3E9E4] py-[11px]">
                <dt className="text-[12.5px] text-[#6F7D74]">Sisa tagihan</dt>
                <dd className="text-[13px] font-semibold tabular-nums">
                  {rupiah(remaining)}
                </dd>
              </div>
            </dl>

            <button
              type="button"
              onClick={() => {
                setShowSuccess(false);
                setLastPayment(null);
              }}
              className="spp-tap spp-focus mt-5 h-[50px] w-full rounded-[14px] bg-[#105D38] text-[14px] font-semibold text-white hover:bg-[#0C4D2F]"
            >
              Selesai
            </button>

            <Link
              href="/wali/notifikasi"
              className="spp-tap spp-focus mt-2 flex h-[44px] w-full items-center justify-center rounded-[14px] text-[13px] font-semibold text-[#105D38] hover:bg-[#F6F8F6]"
            >
              Lihat notifikasi
            </Link>
          </div>
        </Sheet>
      )}

      {/* =====================================
          INFORMASI
      ===================================== */}

      {showInfo && (
        <Sheet
          labelledBy="spp-info-title"
          zIndex={100}
          onClose={() => setShowInfo(false)}
          closeLabel="Tutup informasi"
        >
          <SheetHeader
            id="spp-info-title"
            title="Informasi SPP"
            onClose={() => setShowInfo(false)}
          />

          <div className="mt-5 divide-y divide-[#EEF2EF]">
            <div className="pb-4">
              <p className="text-[13.5px] font-semibold">Cicilan fleksibel</p>
              <p className="mt-[5px] text-[12.5px] leading-[19px] text-[#6F7D74]">
                Wali dapat membayar sebagian tagihan atau melunasi langsung.
              </p>
            </div>

            <div className="py-4">
              <p className="text-[13.5px] font-semibold">Riwayat tersimpan</p>
              <p className="mt-[5px] text-[12.5px] leading-[19px] text-[#6F7D74]">
                Setiap cicilan demo tersimpan di browser ini.
              </p>
            </div>

            <div className="pt-4">
              <p className="text-[13.5px] font-semibold">Mode simulasi</p>
              <p className="mt-[5px] text-[12.5px] leading-[19px] text-[#6F7D74]">
                Pembayaran nyata membutuhkan integrasi backend dan payment
                gateway DOSI Pay.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowInfo(false)}
            className="spp-tap spp-focus mt-5 h-[48px] w-full rounded-[14px] bg-[#105D38] text-[14px] font-semibold text-white hover:bg-[#0C4D2F]"
          >
            Mengerti
          </button>
        </Sheet>
      )}

      {/* =====================================
          ANIMATION STYLES
          Tidak perlu ubah globals.css
      ===================================== */}

      <style jsx global>{`
        /* Masuk bertahap saat halaman dibuka */
        @keyframes sppRise {
          from {
            opacity: 0;
            transform: translate3d(0, 12px, 0);
          }
          to {
            opacity: 1;
            transform: translate3d(0, 0, 0);
          }
        }
        .spp-rise {
          animation: sppRise 520ms cubic-bezier(0.22, 1, 0.36, 1) both;
          animation-delay: calc(var(--i, 0) * 70ms);
        }

        /* Bar bawah naik setelah konten */
        @keyframes sppBar {
          from {
            transform: translate3d(0, 100%, 0);
          }
          to {
            transform: translate3d(0, 0, 0);
          }
        }
        .spp-bar {
          animation: sppBar 520ms cubic-bezier(0.22, 1, 0.36, 1) 220ms both;
        }

        /* Angka dan status yang berubah */
        @keyframes sppMoneyIn {
          from {
            opacity: 0;
            transform: translate3d(0, 6px, 0);
          }
          to {
            opacity: 1;
            transform: translate3d(0, 0, 0);
          }
        }
        .spp-money-enter {
          animation: sppMoneyIn 340ms cubic-bezier(0.22, 1, 0.36, 1) both;
        }

        /* Segmen progres terisi dari kiri */
        .spp-seg {
          transform-origin: left center;
          transition: transform 700ms cubic-bezier(0.22, 1, 0.36, 1);
        }

        /* Sentuhan */
        .spp-tap {
          transition:
            transform 170ms ease,
            background-color 170ms ease,
            border-color 170ms ease,
            box-shadow 170ms ease,
            color 170ms ease;
          -webkit-tap-highlight-color: transparent;
        }
        .spp-tap:active:not(:disabled) {
          transform: scale(0.975);
        }

        .spp-focus:focus-visible {
          outline: 2px solid #4cd080;
          outline-offset: 2px;
        }

        /* Nominal terpilih */
        @keyframes sppSelect {
          0% {
            transform: scale(0.96);
          }
          60% {
            transform: scale(1.03);
          }
          100% {
            transform: scale(1);
          }
        }
        .spp-selected {
          animation: sppSelect 250ms ease-out;
        }

        /* Modal */
        @keyframes sppBackdropIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        .spp-backdrop {
          animation: sppBackdropIn 220ms ease-out both;
        }

        @keyframes sppSheetIn {
          from {
            opacity: 0;
            transform: translate3d(0, 34px, 0);
          }
          to {
            opacity: 1;
            transform: translate3d(0, 0, 0);
          }
        }
        .spp-sheet {
          animation: sppSheetIn 390ms cubic-bezier(0.22, 1, 0.36, 1) both;
        }

        /* Ikon berhasil */
        @keyframes sppSuccessPop {
          0% {
            opacity: 0;
            transform: scale(0.75);
          }
          65% {
            opacity: 1;
            transform: scale(1.055);
          }
          100% {
            opacity: 1;
            transform: scale(1);
          }
        }
        .spp-success-pop {
          animation: sppSuccessPop 480ms cubic-bezier(0.22, 1, 0.36, 1) both;
        }

        @keyframes sppCheckIn {
          from {
            opacity: 0;
            transform: scale(0.65);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        .spp-check-enter {
          animation: sppCheckIn 300ms ease-out 170ms both;
        }

        /* Cicilan baru di riwayat */
        .spp-history-enter {
          animation: sppRise 360ms cubic-bezier(0.22, 1, 0.36, 1) both;
        }

        @media (prefers-reduced-motion: reduce) {
          .spp-rise,
          .spp-bar,
          .spp-money-enter,
          .spp-selected,
          .spp-backdrop,
          .spp-sheet,
          .spp-success-pop,
          .spp-check-enter,
          .spp-history-enter {
            animation: none !important;
          }

          .spp-seg,
          .spp-tap,
          .spp-tap * {
            transition: none !important;
          }
        }
      `}</style>
    </main>
  );
}
