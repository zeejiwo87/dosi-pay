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
import { useRouter } from "next/navigation";
import { Plus_Jakarta_Sans } from "next/font/google";
import {
  ArrowLeft,
  ArrowLeftRight,
  ArrowRight,
  Barcode,
  Check,
  ChevronDown,
  ChevronRight,
  CreditCard,
  Globe,
  Info,
  Lock,
  Receipt,
  Search,
  ShieldCheck,
  Smartphone,
  Store,
  Wallet,
  X,
  Zap,
  type LucideIcon,
} from "lucide-react";

// DOSI Pay · Isi Saldo
// Satu halaman: pemilihan metode → detail bank / gerai → konfirmasi demo.
// Angka VA/barcode asli memerlukan integrasi payment gateway.

// Font mengikuti gaya referensi (Wpay). Tidak mau pakai Google Font?
// Hapus import + konstanta `jakarta`, lalu ganti `jakarta.className` dengan "font-sans".
const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

const MIN_AMOUNT = 20_000;
// Rp200.000 adalah pilihan cepat tertinggi, bukan batas maksimal deposit.
const ADMIN_FEE = 5_000;
const AMOUNTS = [20_000, 50_000, 100_000, 200_000];
const HISTORY_KEY = "dosi_demo_deposit_history";
const RECEIPT_KEY = "dosi_demo_deposit_receipt";

const BANKS = [
  { id: "bri", name: "BRI", logo: "/banks/bri.svg", kind: "bank" },
  { id: "bca", name: "BCA", logo: "/banks/bca.svg", kind: "bank" },
  { id: "mandiri", name: "Mandiri", logo: "/banks/mandiri.svg", kind: "bank" },
  { id: "bni", name: "BNI", logo: "/banks/bni.svg", kind: "bank" },
  { id: "bsi", name: "BSI", logo: "/banks/bsi.svg", kind: "bank" },
  { id: "cimb", name: "CIMB Niaga", logo: "/banks/cimb-niaga.svg", kind: "bank" },
  { id: "permata", name: "PermataBank", logo: "/banks/permata.svg", kind: "bank" },
  { id: "btn", name: "BTN", logo: "/banks/btn.svg", kind: "bank" },
  { id: "danamon", name: "Danamon", logo: "/banks/danamon.svg", kind: "bank" },
  { id: "ocbc", name: "OCBC", logo: "/banks/ocbc-nisp.svg", kind: "bank" },
  { id: "maybank", name: "Maybank", logo: "/banks/maybank.svg", kind: "bank" },
  { id: "mega", name: "Bank Mega", logo: "/banks/mega.svg", kind: "bank" },
  { id: "bjb", name: "Bank BJB", logo: "/banks/bank-bjb.svg", kind: "bank" },
  { id: "jago", name: "Bank Jago", logo: "/banks/jago.svg", kind: "bank" },
  { id: "seabank", name: "SeaBank", logo: "/banks/seabank.svg", kind: "bank" },
] as const;

const STORES = [
  { id: "indomaret", name: "Indomaret", logo: "/merchants/indomaret.svg", kind: "cash" },
  { id: "alfamart", name: "Alfamart", logo: "/merchants/alfamart.svg", kind: "cash" },
] as const;

type BankMethod = (typeof BANKS)[number];
type StoreMethod = (typeof STORES)[number];
type PaymentMethod = BankMethod | StoreMethod;
type Instruction = "mobile" | "internet" | "atm" | "cash";
type ViewMotion = "initial" | "forward" | "back";

type DepositReceipt = {
  bankId: string;
  bankName: string;
  bankLogo: string;
  depositAmount: number;
  adminFee: number;
  totalPayment: number;
  createdAt: string;
  isDemo: true;
};

const money = (n: number) => `Rp${n.toLocaleString("id-ID")}`;
const amountLabel = (n: number) => `${n / 1000}K`;

function methodById(id: string | null): PaymentMethod | null {
  return [...BANKS, ...STORES].find((item) => item.id === id) ?? null;
}

// Metode populer di grid utama: BCA, BRI, Mandiri, BNI, CIMB, BSI, Permata
const POPULAR_BANKS: BankMethod[] = [
  BANKS[1],
  BANKS[0],
  BANKS[2],
  BANKS[3],
  BANKS[5],
  BANKS[4],
  BANKS[6],
];

// Ikon duotone: isi tipis di dalam garis, tanpa gradasi
const DUO = { fill: "currentColor", fillOpacity: 0.16 } as const;

const TONES = {
  green: { tile: "bg-[#E6F8EE] text-[#178A50]" },
  blue: { tile: "bg-[#E8F0FE] text-[#2F6BFF]" },
  orange: { tile: "bg-[#FFF1E0] text-[#E8821A]" },
} as const;

const INSTRUCTION_META: Record<
  Instruction,
  { Icon: LucideIcon; tone: keyof typeof TONES; duo: boolean }
> = {
  mobile: { Icon: Smartphone, tone: "blue", duo: true },
  internet: { Icon: Globe, tone: "orange", duo: false },
  atm: { Icon: CreditCard, tone: "green", duo: true },
  cash: { Icon: Store, tone: "green", duo: false },
};

// Helper untuk CSS custom property di inline style
function cssVars(vars: Record<string, string | number>): CSSProperties {
  return vars as unknown as CSSProperties;
}
const rise = (index: number) => cssVars({ "--i": index });

// ==========================================
// HOOKS
// ==========================================

// Angka berubah dengan tween halus (total, nominal)
function useTween(target: number, duration = 450) {
  const [display, setDisplay] = useState(target);
  const current = useRef(target);

  useEffect(() => {
    const from = current.current;
    if (from === target) return undefined;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      current.current = target;
      setDisplay(target);
      return undefined;
    }

    let raf = 0;
    const start = performance.now();

    const tick = (now: number) => {
      const progress = Math.min(Math.max((now - start) / duration, 0), 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const value = Math.round(from + (target - from) * eased);
      current.current = value;
      setDisplay(value);
      if (progress < 1) raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);

  return display;
}

// Menahan elemen tetap ter-render selama animasi keluar
function usePresence(open: boolean, duration = 300) {
  const [delayed, setDelayed] = useState(open);

  useEffect(() => {
    if (open) {
      setDelayed(true);
      return undefined;
    }
    const timer = window.setTimeout(() => setDelayed(false), duration);
    return () => window.clearTimeout(timer);
  }, [open, duration]);

  return { mounted: open || delayed, closing: !open && delayed };
}

// ==========================================
// KOMPONEN KECIL
// ==========================================
function BrandLogo({
  method,
  className = "",
}: {
  method: PaymentMethod;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);

  useEffect(() => setFailed(false), [method.logo]);

  return (
    <span
      className={`flex shrink-0 items-center justify-center overflow-hidden bg-white ${className}`}
    >
      {failed ? (
        <span className="px-1 text-center text-[10px] font-extrabold text-[#105D38]">
          {method.name}
        </span>
      ) : (
        <Image
          src={method.logo}
          alt={`Logo ${method.name}`}
          width={120}
          height={70}
          unoptimized
          onError={() => setFailed(true)}
          className="dp-logo h-full w-full object-contain p-[6px]"
        />
      )}
    </span>
  );
}

function MethodTile({
  method,
  onChoose,
  index,
}: {
  method: PaymentMethod;
  onChoose: (method: PaymentMethod) => void;
  index: number;
}) {
  return (
    <button
      type="button"
      onClick={() => onChoose(method)}
      aria-label={`Pilih ${method.name}`}
      className="dp-tile dp-press flex min-w-0 flex-col items-center gap-[9px] text-center"
      style={rise(index)}
    >
      <span className="dp-tile-box flex aspect-square w-full items-center justify-center rounded-[22px] bg-[#F4F7F9] p-[8px]">
        <BrandLogo method={method} className="h-full w-full rounded-[15px]" />
      </span>
      <span className="w-full truncate text-[11px] font-medium text-[#0F1B14]">
        {method.name}
      </span>
    </button>
  );
}

function MoreTile({
  onClick,
  index,
}: {
  onClick: () => void;
  index: number;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Lihat semua bank"
      className="dp-tile dp-press flex min-w-0 flex-col items-center gap-[9px] text-center"
      style={rise(index)}
    >
      <span className="dp-tile-box flex aspect-square w-full items-center justify-center rounded-[22px] bg-[#F4F7F9]">
        <span className="grid grid-cols-2 gap-[6px]">
          {[0, 1, 2, 3].map((dot) => (
            <span key={dot} className="h-[9px] w-[9px] rounded-full bg-[#4CD080]" />
          ))}
        </span>
      </span>
      <span className="w-full truncate text-[11px] font-medium text-[#0F1B14]">
        Lainnya
      </span>
    </button>
  );
}

// Bentuk datar ala kartu promo referensi (tanpa gradasi)
function FlatShapes({ className = "" }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 170 120"
      className={`dp-shapes pointer-events-none absolute bottom-0 right-0 ${className}`}
    >
      <path
        d="M22 120 L112 68 L152 120 Z"
        fill="#4CD080"
        stroke="#4CD080"
        strokeWidth="14"
        strokeLinejoin="round"
      />
      <circle className="dp-sun" cx="116" cy="50" r="17" fill="#FFAE58" />
    </svg>
  );
}

function SectionTitle({
  children,
  action,
}: {
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      <h2 className="text-[17px] font-bold tracking-[-0.3px]">{children}</h2>
      {action}
    </div>
  );
}

function Accordion({
  id,
  title,
  Icon,
  tone,
  duo,
  open,
  onClick,
  steps,
}: {
  id: string;
  title: string;
  Icon: LucideIcon;
  tone: keyof typeof TONES;
  duo: boolean;
  open: boolean;
  onClick: () => void;
  steps: string[];
}) {
  return (
    <div className="border-b border-[#EDF1F4] last:border-b-0">
      <button
        type="button"
        className="dp-press flex min-h-[64px] w-full items-center gap-3 px-4 text-left hover:bg-[#FAFBFC]"
        onClick={onClick}
        aria-expanded={open}
        aria-controls={id}
      >
        <span
          className={`flex h-[40px] w-[40px] shrink-0 items-center justify-center rounded-[14px] ${TONES[tone].tile}`}
        >
          <Icon size={20} strokeWidth={1.9} {...(duo ? DUO : {})} />
        </span>
        <span className="min-w-0 flex-1 text-[13px] font-semibold">{title}</span>
        <span
          className={`flex h-[28px] w-[28px] shrink-0 items-center justify-center rounded-full transition-colors duration-300 ${
            open ? "bg-[#E6F8EE] text-[#178A50]" : "bg-[#F4F7F9] text-[#8B95A5]"
          }`}
        >
          <ChevronDown
            size={16}
            strokeWidth={2.2}
            className={`transition-transform duration-300 ${open ? "rotate-180" : ""}`}
          />
        </span>
      </button>

      <div id={id} className={`dp-accordion ${open ? "is-open" : ""}`}>
        <div className="min-h-0 overflow-hidden">
          <ol className="px-4 pb-4 pl-[22px] pt-1">
            {steps.map((step, index) => (
              <li
                key={index}
                className="dp-step relative pb-[14px] pl-[34px] last:pb-0"
                style={rise(index)}
              >
                <span className="absolute left-0 top-0 z-10 flex h-[22px] w-[22px] items-center justify-center rounded-full bg-[#4CD080] text-[10px] font-bold text-[#0B3D26]">
                  {index + 1}
                </span>
                {index < steps.length - 1 && (
                  <span className="absolute bottom-[-2px] left-[10.5px] top-[24px] w-px bg-[#DDE5EB]" />
                )}
                <p className="pt-[2px] text-[12px] leading-[1.65] text-[#6B7686]">
                  {step}
                </p>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// HALAMAN UTAMA
// ==========================================
export default function DepositWaliPage() {
  const router = useRouter();
  const [selected, setSelected] = useState<PaymentMethod | null>(null);
  const [amountRaw, setAmountRaw] = useState("100000");
  const [search, setSearch] = useState("");
  const [allBanksOpen, setAllBanksOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [openInstruction, setOpenInstruction] = useState<Instruction | null>("mobile");
  const [error, setError] = useState("");
  const [processing, setProcessing] = useState(false);
  const [shake, setShake] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [motion, setMotion] = useState<ViewMotion>("initial");
  const processingRef = useRef(false);
  const internalNavRef = useRef(false);
  const firstSyncRef = useRef(true);

  const banksSheet = usePresence(allBanksOpen, 300);
  const confirmSheet = usePresence(confirmOpen, 300);

  const amount = Number(amountRaw || "0");
  const validAmount =
    Number.isSafeInteger(amount) &&
    amount >= MIN_AMOUNT &&
    Number.isSafeInteger(amount + ADMIN_FEE);
  const total = validAmount ? amount + ADMIN_FEE : 0;
  const totalShown = useTween(total);
  const isCash = selected?.kind === "cash";
  const modalOpen = banksSheet.mounted || confirmSheet.mounted;

  const filteredBanks = useMemo(
    () => BANKS.filter((b) => b.name.toLowerCase().includes(search.trim().toLowerCase())),
    [search]
  );
  const filteredStores = useMemo(
    () => STORES.filter((s) => s.name.toLowerCase().includes(search.trim().toLowerCase())),
    [search]
  );

  useEffect(() => {
    const sync = () => {
      const params = new URLSearchParams(window.location.search);
      const nextMethod = methodById(params.get("method"));
      setSelected(nextMethod);
      if (!nextMethod) internalNavRef.current = false;
      if (!firstSyncRef.current) setMotion(nextMethod ? "forward" : "back");
      firstSyncRef.current = false;
      setError("");
    };
    sync();
    window.addEventListener("popstate", sync);
    return () => window.removeEventListener("popstate", sync);
  }, []);

  // Garis tipis di bawah header muncul saat halaman digulir
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 4);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!modalOpen) return undefined;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const escape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !processingRef.current) {
        setAllBanksOpen(false);
        setConfirmOpen(false);
      }
    };
    window.addEventListener("keydown", escape);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", escape);
    };
  }, [modalOpen]);

  function chooseMethod(method: PaymentMethod) {
    if (processingRef.current) return;
    setMotion("forward");
    setSelected(method);
    setAllBanksOpen(false);
    setSearch("");
    setError("");
    setOpenInstruction(method.kind === "cash" ? "cash" : "mobile");
    internalNavRef.current = true;
    window.history.pushState({ depositMethod: method.id }, "", `/wali/deposit?method=${method.id}`);
    window.scrollTo({ top: 0, behavior: "instant" });
  }

  function goBack() {
    if (selected) {
      setMotion("back");
      if (internalNavRef.current) {
        internalNavRef.current = false;
        window.history.back();
      } else {
        window.history.replaceState(null, "", "/wali/deposit");
        setSelected(null);
      }
      setError("");
      window.scrollTo({ top: 0, behavior: "instant" });
    } else {
      router.push("/wali/beranda");
    }
  }

  function changeAmount(text: string) {
    setAmountRaw(text.replace(/\D/g, "").slice(0, 15));
    setError("");
  }

  function beginConfirm() {
    if (!validAmount) {
      setError("Minimal deposit Rp20.000.");
      setShake(true);
      document.getElementById("deposit-amount")?.focus();
      return;
    }
    if (!selected) return;
    setConfirmOpen(true);
    setError("");
  }

  function confirmDemo() {
    if (!selected || !validAmount || processingRef.current) return;
    processingRef.current = true;
    setProcessing(true);

    const receipt: DepositReceipt = {
      bankId: selected.id,
      bankName: selected.name,
      bankLogo: selected.logo,
      depositAmount: amount,
      adminFee: ADMIN_FEE,
      totalPayment: amount + ADMIN_FEE,
      createdAt: new Date().toISOString(),
      isDemo: true,
    };

    try {
      const raw = localStorage.getItem(HISTORY_KEY);
      const parsed: unknown = raw ? JSON.parse(raw) : [];
      if (!Array.isArray(parsed)) throw new Error("Riwayat tidak valid");

      // Satu konfirmasi menghasilkan satu deposit; cegah klik ganda.
      const updated = [receipt, ...parsed];
      localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
      sessionStorage.setItem(RECEIPT_KEY, JSON.stringify(receipt));
      router.push("/wali/deposit/berhasil");
    } catch {
      processingRef.current = false;
      setProcessing(false);
      setConfirmOpen(false);
      setError("Gagal menyimpan deposit demo. Silakan coba lagi.");
    }
  }

  function bankSteps(mode: Exclude<Instruction, "cash">) {
    if (mode === "mobile") {
      return [
        `Buka aplikasi mobile banking ${selected?.name ?? "bank"}.`,
        "Pilih transfer atau pembayaran virtual account.",
        "Gunakan nomor pembayaran yang diterbitkan DOSI Pay saat layanan aktif.",
        "Periksa nominal beserta biaya admin sebelum mengonfirmasi.",
      ];
    }
    if (mode === "internet") {
      return [
        `Masuk ke situs internet banking ${selected?.name ?? "bank"} yang resmi.`,
        "Pilih transfer atau pembayaran virtual account.",
        "Masukkan nomor pembayaran resmi dan periksa total tagihan.",
      ];
    }
    return [
      "Masukkan kartu dan PIN di ATM bank terkait.",
      "Pilih menu transfer atau pembayaran virtual account.",
      "Masukkan nomor pembayaran resmi, lalu cek nominal.",
    ];
  }

  const viewClass =
    motion === "forward"
      ? "dp-view-forward"
      : motion === "back"
        ? "dp-view-back"
        : "dp-view-initial";

  const headerTitle = selected ? selected.name : "Isi Saldo";

  const infoCells: { Icon: LucideIcon; value: string; label: string; duo: boolean }[] = [
    { Icon: Wallet, value: money(MIN_AMOUNT), label: "Minimal", duo: true },
    { Icon: Receipt, value: money(ADMIN_FEE), label: "Biaya admin", duo: false },
    {
      Icon: Zap,
      value: `${amountLabel(AMOUNTS[0])}–${amountLabel(AMOUNTS[AMOUNTS.length - 1])}`,
      label: "Pilihan cepat",
      duo: true,
    },
  ];

  return (
    <main
      className={`${jakarta.className} min-h-[100dvh] bg-[#F1F4F6] text-[#0F1B14] antialiased`}
    >
      <div className="relative mx-auto min-h-[100dvh] w-full max-w-[430px] bg-white sm:shadow-[0_0_0_1px_#E8EDF1]">
        {/* HEADER */}
        <header
          className={`sticky top-0 z-40 bg-white px-5 pt-[env(safe-area-inset-top)] transition-shadow duration-300 ${
            scrolled ? "shadow-[0_1px_0_#E8EDF1]" : "shadow-[0_1px_0_transparent]"
          }`}
        >
          <div className="flex h-[68px] items-center justify-between">
            <button
              type="button"
              onClick={goBack}
              aria-label={selected ? "Kembali ke metode pembayaran" : "Kembali ke beranda"}
              className="dp-press flex h-[44px] w-[44px] items-center justify-center rounded-[16px] border border-[#E8EDF1] bg-white text-[#0F1B14] hover:bg-[#F4F7F9]"
            >
              <ArrowLeft size={19} strokeWidth={2} />
            </button>
            <h1
              key={headerTitle}
              className="dp-title max-w-[220px] truncate text-[16px] font-bold tracking-[-0.2px]"
            >
              {headerTitle}
            </h1>
            <span className="h-[44px] w-[44px]" aria-hidden="true" />
          </div>
        </header>

        {!selected ? (
          <div key="select-method" className={viewClass}>
            <div className="space-y-7 px-5 pb-[calc(32px+env(safe-area-inset-bottom))] pt-1">
              {/* GREETING */}
              <div className="dp-rise" style={rise(0)}>
                <h2 className="text-[26px] font-extrabold leading-[1.2] tracking-[-0.8px]">
                  Isi saldo santri
                </h2>
                <p className="mt-1.5 text-[13px] leading-[1.6] text-[#8B95A5]">
                  Pilih bank atau gerai untuk mengisi DOSI Pay.
                </p>
              </div>

              {/* INFO BAR */}
              <div
                className="dp-rise grid grid-cols-3 rounded-[24px] bg-[#4CD080] py-[18px] text-[#0B3D26]"
                style={rise(1)}
              >
                {infoCells.map(({ Icon, value, label, duo }, index) => (
                  <div
                    key={label}
                    className={`flex flex-col items-center gap-[6px] px-2 text-center ${
                      index > 0 ? "border-l border-[#0B3D26]/15" : ""
                    }`}
                  >
                    <Icon size={26} strokeWidth={1.7} {...(duo ? DUO : {})} />
                    <span className="text-[13px] font-extrabold tracking-[-0.2px]">
                      {value}
                    </span>
                    <span className="text-[10px] font-medium opacity-75">{label}</span>
                  </div>
                ))}
              </div>

              {/* SEARCH */}
              <div className="dp-rise" style={rise(2)}>
                <label className="sr-only" htmlFor="deposit-search">
                  Cari metode pembayaran
                </label>
                <div className="flex h-[50px] items-center gap-3 rounded-[18px] bg-[#F4F7F9] px-4 ring-2 ring-transparent transition-[box-shadow,background-color] duration-200 focus-within:bg-white focus-within:ring-[#4CD080]">
                  <Search size={19} strokeWidth={2} className="shrink-0 text-[#8B95A5]" />
                  <input
                    id="deposit-search"
                    type="search"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Cari bank atau gerai"
                    className="dp-search min-w-0 flex-1 bg-transparent text-[13px] font-medium text-[#0F1B14] outline-none placeholder:text-[#A3ACB9]"
                  />
                  {search && (
                    <button
                      type="button"
                      aria-label="Hapus pencarian"
                      onClick={() => setSearch("")}
                      className="dp-press flex h-[24px] w-[24px] items-center justify-center rounded-full bg-[#DDE4EA] text-[#566170]"
                    >
                      <X size={13} strokeWidth={2.4} />
                    </button>
                  )}
                </div>
              </div>

              {search.trim() ? (
                <section className="dp-rise" style={rise(3)}>
                  <SectionTitle>Hasil pencarian</SectionTitle>
                  {filteredBanks.length + filteredStores.length ? (
                    <div className="mt-4 grid grid-cols-4 gap-x-3 gap-y-5">
                      {[...filteredBanks, ...filteredStores].map((item, index) => (
                        <MethodTile
                          key={item.id}
                          method={item}
                          onChoose={chooseMethod}
                          index={index}
                        />
                      ))}
                    </div>
                  ) : (
                    <p className="py-10 text-center text-[12px] text-[#8B95A5]">
                      Metode tidak ditemukan.
                    </p>
                  )}
                </section>
              ) : (
                <>
                  <section className="dp-rise" style={rise(3)}>
                    <SectionTitle
                      action={
                        <button
                          type="button"
                          onClick={() => setAllBanksOpen(true)}
                          className="dp-press flex items-center gap-[2px] text-[12px] font-semibold text-[#178A50]"
                        >
                          Lihat semua
                          <ChevronRight size={15} strokeWidth={2.3} />
                        </button>
                      }
                    >
                      Transfer bank
                    </SectionTitle>
                    <div className="mt-4 grid grid-cols-4 gap-x-3 gap-y-5">
                      {POPULAR_BANKS.map((bank, index) => (
                        <MethodTile
                          key={bank.id}
                          method={bank}
                          onChoose={chooseMethod}
                          index={index + 3}
                        />
                      ))}
                      <MoreTile
                        onClick={() => setAllBanksOpen(true)}
                        index={POPULAR_BANKS.length + 3}
                      />
                    </div>
                  </section>

                  <section className="dp-rise" style={rise(4)}>
                    <SectionTitle>
                      Uang tunai
                    </SectionTitle>
                    <div className="mt-4 grid grid-cols-4 gap-x-3 gap-y-5">
                      {STORES.map((store, index) => (
                        <MethodTile
                          key={store.id}
                          method={store}
                          onChoose={chooseMethod}
                          index={index + 11}
                        />
                      ))}
                    </div>
                  </section>

                  {/* NOTE: kartu gelap ala kartu promo referensi */}
                  <div
                    className="dp-rise relative overflow-hidden rounded-[26px] bg-[#105D38] px-5 py-5 text-white"
                    style={rise(5)}
                  >
                    <span className="flex h-[36px] w-[36px] items-center justify-center rounded-[12px] bg-white/12 text-[#4CD080]">
                      <ShieldCheck size={19} strokeWidth={1.9} />
                    </span>
                    <p className="mt-3 text-[16px] font-bold tracking-[-0.3px]">
                      Mode simulasi
                    </p>
                    <p className="mt-1 max-w-[58%] text-[11px] leading-[1.65] text-white/70">
                      Metode pembayaran masih simulasi. Belum menerima pembayaran nyata.
                    </p>
                    <FlatShapes className="w-[150px]" />
                  </div>
                </>
              )}
            </div>
          </div>
        ) : (
          <div key={selected.id} className={viewClass}>
            <div className="space-y-7 px-5 pb-[calc(124px+env(safe-area-inset-bottom))] pt-1">
              {/* METODE TERPILIH */}
              <section className="dp-rise flex items-center gap-3" style={rise(0)}>
                <span className="flex h-[60px] w-[60px] shrink-0 items-center justify-center rounded-[20px] bg-[#F4F7F9] p-[7px]">
                  <BrandLogo method={selected} className="h-full w-full rounded-[14px]" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[17px] font-bold tracking-[-0.3px]">
                    {selected.name}
                  </p>
                  <p className="mt-0.5 text-[12px] text-[#8B95A5]">
                    {isCash ? "Bayar tunai di gerai" : "Transfer virtual account"}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={goBack}
                  className="dp-press flex h-[38px] items-center gap-1.5 rounded-full border border-[#E1E8ED] px-3.5 text-[12px] font-semibold text-[#178A50] hover:bg-[#F4FBF7]"
                >
                  <ArrowLeftRight size={14} strokeWidth={2.2} />
                  Ganti
                </button>
              </section>

              {/* NOMINAL */}
              <section className="dp-rise" style={rise(1)}>
                <SectionTitle
                  action={<span className="text-[11px] text-[#8B95A5]">Pilihan cepat</span>}
                >
                  Nominal top up
                </SectionTitle>

                <div className="mt-4 grid grid-cols-4 gap-2">
                  {AMOUNTS.map((value) => {
                    const active = amount === value;
                    return (
                      <button
                        type="button"
                        key={value}
                        onClick={() => changeAmount(String(value))}
                        aria-pressed={active}
                        className={`dp-press relative h-[46px] rounded-[16px] text-[13px] font-bold ${
                          active
                            ? "bg-[#4CD080] text-[#0B3D26]"
                            : "bg-[#F4F7F9] text-[#4B5563] hover:bg-[#EAF0F4]"
                        }`}
                      >
                        {amountLabel(value)}
                        <span
                          aria-hidden="true"
                          className={`dp-chip-check absolute -right-[5px] -top-[5px] flex h-[18px] w-[18px] items-center justify-center rounded-full bg-[#105D38] text-white ${
                            active ? "is-active" : ""
                          }`}
                        >
                          <Check size={11} strokeWidth={3.4} />
                        </span>
                      </button>
                    );
                  })}
                </div>

                <label htmlFor="deposit-amount" className="sr-only">
                  Nominal lainnya
                </label>
                <div
                  onAnimationEnd={() => setShake(false)}
                  className={`mt-3 flex h-[66px] items-center rounded-[20px] border-2 px-4 transition-[border-color,background-color] duration-200 ${
                    error
                      ? "border-[#F1A9A0] bg-white"
                      : "border-transparent bg-[#F4F7F9] focus-within:border-[#4CD080] focus-within:bg-white"
                  } ${shake ? "dp-shake" : ""}`}
                >
                  <span className="mr-2.5 text-[16px] font-bold text-[#8B95A5]">Rp</span>
                  <input
                    id="deposit-amount"
                    type="text"
                    inputMode="numeric"
                    autoComplete="off"
                    value={amountRaw ? Number(amountRaw).toLocaleString("id-ID") : ""}
                    onChange={(e) => changeAmount(e.target.value)}
                    placeholder="0"
                    className="min-w-0 flex-1 bg-transparent text-[26px] font-extrabold tracking-[-0.8px] outline-none placeholder:text-[#C3CAD4] [font-variant-numeric:tabular-nums]"
                  />
                  {amountRaw && (
                    <button
                      type="button"
                      aria-label="Hapus nominal"
                      onClick={() => {
                        changeAmount("");
                        document.getElementById("deposit-amount")?.focus();
                      }}
                      className="dp-press flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-full bg-[#DDE4EA] text-[#566170]"
                    >
                      <X size={14} strokeWidth={2.4} />
                    </button>
                  )}
                </div>

                {error ? (
                  <p role="alert" className="dp-error mt-2.5 text-[12px] font-medium text-[#D14B3C]">
                    {error}
                  </p>
                ) : (
                  <p className="mt-2.5 text-[12px] text-[#8B95A5]">
                    Minimal {money(MIN_AMOUNT)}, nominal lain bebas.
                  </p>
                )}
              </section>

              {/* KODE PEMBAYARAN */}
              {isCash ? (
                <section className="dp-rise space-y-3" style={rise(2)}>
                  <div className="relative overflow-hidden rounded-[26px] bg-[#105D38] px-5 py-5 text-white">
                    <p className="text-[12px] text-white/70">
                      Total dibayar di {selected.name}
                    </p>
                    <p className="mt-1.5 text-[32px] font-extrabold leading-[1.1] tracking-[-1px] [font-variant-numeric:tabular-nums]">
                      {validAmount ? money(totalShown) : "—"}
                    </p>
                    <p className="mt-2 max-w-[62%] text-[11px] leading-[1.6] text-white/70">
                      Top up {money(amount)} + admin {money(ADMIN_FEE)}
                    </p>
                    <FlatShapes className="w-[140px]" />
                  </div>

                  <div className="rounded-[26px] border-2 border-dashed border-[#D5DEE6] px-4 py-5 text-center">
                    <h2 className="text-[14px] font-bold">Kode pembayaran</h2>
                    <div className="relative mx-auto mt-3 flex h-[82px] w-[240px] max-w-full items-center justify-center overflow-hidden rounded-[16px] bg-[#F4F7F9]">
                      <Barcode size={92} strokeWidth={1.3} className="text-[#C3CBD4]" />
                      <span className="absolute inset-0 flex items-center justify-center">
                        <span className="-rotate-[8deg] rounded-[8px] border-2 border-[#FFAE58] bg-white px-3 py-1 text-[13px] font-extrabold tracking-[3px] text-[#E8821A]">
                          DEMO
                        </span>
                      </span>
                    </div>
                    <p className="mt-3 text-[12px] font-semibold text-[#4B5563]">
                      Kode kasir belum tersedia
                    </p>
                    <p className="mt-1 text-[11px] text-[#8B95A5]">
                      Aktif setelah integrasi pembayaran resmi
                    </p>
                  </div>
                </section>
              ) : (
                <section className="dp-rise rounded-[26px] bg-[#F4F7F9] p-4" style={rise(2)}>
                  <div className="flex items-center gap-3">
                    <span className="flex h-[42px] w-[42px] items-center justify-center rounded-[14px] bg-white text-[#105D38]">
                      <Lock size={19} strokeWidth={1.9} />
                    </span>
                    <div>
                      <h2 className="text-[14px] font-bold">Nomor akun virtual</h2>
                      <p className="mt-0.5 text-[11px] text-[#8B95A5]">
                        Diterbitkan setelah layanan pembayaran aktif
                      </p>
                    </div>
                  </div>
                  <div
                    role="img"
                    aria-label="Nomor virtual account belum diterbitkan"
                    className="mt-4 flex h-[58px] items-center justify-center gap-5 rounded-[18px] bg-white"
                  >
                    {[0, 1, 2].map((group) => (
                      <span key={group} className="flex gap-[6px]">
                        {[0, 1, 2, 3].map((dot) => (
                          <span
                            key={dot}
                            className="dp-dot h-[8px] w-[8px] rounded-full bg-[#105D38]"
                            style={rise(group * 4 + dot)}
                          />
                        ))}
                      </span>
                    ))}
                  </div>
                  <p className="mt-3.5 flex items-center justify-center gap-1.5 text-[11px] text-[#8B95A5]">
                    <Info size={13} /> Nomor VA belum diterbitkan — mode demo
                  </p>
                </section>
              )}

              {/* CARA BAYAR */}
              <section className="dp-rise" style={rise(3)}>
                <SectionTitle>
                  {isCash ? `Cara bayar di ${selected.name}` : "Cara pembayaran"}
                </SectionTitle>
                <div className="mt-4 overflow-hidden rounded-[24px] border border-[#E8EDF1] bg-white">
                  {isCash ? (
                    <Accordion
                      id="cash-instructions"
                      title={`Bayar di kasir ${selected.name}`}
                      Icon={INSTRUCTION_META.cash.Icon}
                      tone={INSTRUCTION_META.cash.tone}
                      duo={INSTRUCTION_META.cash.duo}
                      open={openInstruction === "cash"}
                      onClick={() =>
                        setOpenInstruction(openInstruction === "cash" ? null : "cash")
                      }
                      steps={[
                        `Pilih nominal deposit dan metode ${selected.name}.`,
                        "Saat layanan aktif, tunjukkan kode pembayaran resmi kepada kasir.",
                        `Bayar sebesar ${validAmount ? money(total) : "total yang tercantum"}, termasuk biaya admin.`,
                        "Simpan struk kasir sampai saldo dikonfirmasi masuk.",
                      ]}
                    />
                  ) : (
                    (["mobile", "internet", "atm"] as const).map((mode) => (
                      <Accordion
                        key={mode}
                        id={`bank-instructions-${mode}`}
                        title={
                          mode === "mobile"
                            ? `Mobile Banking ${selected.name}`
                            : mode === "internet"
                              ? "Internet Banking"
                              : `ATM ${selected.name}`
                        }
                        Icon={INSTRUCTION_META[mode].Icon}
                        tone={INSTRUCTION_META[mode].tone}
                        duo={INSTRUCTION_META[mode].duo}
                        open={openInstruction === mode}
                        onClick={() =>
                          setOpenInstruction(openInstruction === mode ? null : mode)
                        }
                        steps={bankSteps(mode)}
                      />
                    ))
                  )}
                </div>
              </section>

              {/* RINCIAN */}
              <section className="dp-rise" style={rise(4)}>
                <SectionTitle>Rincian pembayaran</SectionTitle>
                <div className="mt-4 space-y-3 rounded-[24px] border border-[#E8EDF1] p-4">
                  <div className="flex items-center justify-between text-[13px] text-[#6B7686]">
                    <span>Isi saldo</span>
                    <span className="font-semibold text-[#0F1B14] [font-variant-numeric:tabular-nums]">
                      {money(amount)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[13px] text-[#6B7686]">
                    <span>Biaya admin</span>
                    <span className="font-semibold text-[#0F1B14] [font-variant-numeric:tabular-nums]">
                      {money(ADMIN_FEE)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between border-t-2 border-dashed border-[#E8EDF1] pt-3.5">
                    <span className="text-[14px] font-bold">Total</span>
                    <strong className="text-[18px] font-extrabold tracking-[-0.4px] text-[#105D38] [font-variant-numeric:tabular-nums]">
                      {validAmount ? money(totalShown) : "—"}
                    </strong>
                  </div>
                </div>
              </section>

              <p
                className="dp-rise flex items-start gap-2 px-1 text-[11px] leading-[1.6] text-[#8B95A5]"
                style={rise(5)}
              >
                <Info size={14} className="mt-[1px] shrink-0" />
                Pembayaran masih simulasi. Belum ada transfer dana, VA aktif, atau kode bayar yang diterbitkan.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* FOOTER AKSI (di luar wrapper animasi agar tetap menempel di bawah layar) */}
      {selected && (
        <footer className="dp-footer fixed inset-x-0 bottom-0 z-30 pointer-events-none">
          <div className="pointer-events-auto mx-auto flex max-w-[430px] items-center gap-4 border-t border-[#E8EDF1] bg-white px-5 pb-[max(14px,env(safe-area-inset-bottom))] pt-3.5">
            <div className="min-w-0">
              <span className="text-[11px] text-[#8B95A5]">Total</span>
              <p className="truncate text-[19px] font-extrabold tracking-[-0.5px] [font-variant-numeric:tabular-nums]">
                {validAmount ? money(totalShown) : "—"}
              </p>
            </div>
            <button
              type="button"
              onClick={beginConfirm}
              disabled={!validAmount}
              className="dp-press group flex h-[54px] flex-1 items-center justify-center gap-2 rounded-[18px] bg-[#4CD080] text-[14px] font-bold text-[#0B3D26] hover:bg-[#43C477] disabled:cursor-not-allowed disabled:opacity-40"
            >
              Lanjutkan
              <ArrowRight
                size={18}
                strokeWidth={2.4}
                className="transition-transform duration-300 group-hover:translate-x-1"
              />
            </button>
          </div>
        </footer>
      )}

      {/* SHEET SEMUA BANK */}
      {banksSheet.mounted && (
        <div
          className={`fixed inset-0 z-[90] flex items-end justify-center sm:items-center sm:p-5 ${
            banksSheet.closing ? "pointer-events-none" : ""
          }`}
        >
          <button
            type="button"
            onClick={() => setAllBanksOpen(false)}
            aria-label="Tutup daftar bank"
            className={`dp-overlay absolute inset-0 bg-[#0B1410]/45 ${
              banksSheet.closing ? "is-closing" : ""
            }`}
          />
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="all-banks-title"
            className={`dp-sheet relative flex max-h-[85dvh] w-full max-w-[430px] flex-col overflow-hidden rounded-t-[28px] bg-white px-5 pb-[max(16px,env(safe-area-inset-bottom))] pt-3 sm:rounded-[28px] ${
              banksSheet.closing ? "is-closing" : ""
            }`}
          >
            <div className="mx-auto h-[5px] w-[40px] rounded-full bg-[#DDE4EA]" />
            <div className="mt-4 flex items-center justify-between">
              <div>
                <h2 id="all-banks-title" className="text-[18px] font-bold tracking-[-0.4px]">
                  Transfer bank
                </h2>
                <p className="mt-0.5 text-[12px] text-[#8B95A5]">{BANKS.length} bank tersedia</p>
              </div>
              <button
                type="button"
                aria-label="Tutup"
                onClick={() => setAllBanksOpen(false)}
                className="dp-press flex h-[38px] w-[38px] items-center justify-center rounded-full bg-[#F4F7F9]"
              >
                <X size={18} strokeWidth={2.2} />
              </button>
            </div>

            <div className="mt-4 flex h-[48px] items-center gap-3 rounded-[16px] bg-[#F4F7F9] px-4 ring-2 ring-transparent transition-[box-shadow,background-color] duration-200 focus-within:bg-white focus-within:ring-[#4CD080]">
              <Search size={18} strokeWidth={2} className="text-[#8B95A5]" />
              <input
                autoFocus
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari bank"
                className="dp-search min-w-0 flex-1 bg-transparent text-[13px] font-medium outline-none placeholder:text-[#A3ACB9]"
              />
            </div>

            <div className="mt-3 min-h-0 flex-1 overflow-y-auto overscroll-contain pb-1">
              {filteredBanks.map((bank) => (
                <button
                  type="button"
                  key={bank.id}
                  onClick={() => chooseMethod(bank)}
                  className="dp-press flex w-full items-center gap-3.5 rounded-[18px] px-2 py-2.5 text-left hover:bg-[#F4F7F9]"
                >
                  <span className="flex h-[48px] w-[48px] shrink-0 items-center justify-center rounded-[16px] bg-[#F4F7F9] p-[6px]">
                    <BrandLogo method={bank} className="h-full w-full rounded-[11px]" />
                  </span>
                  <span className="flex-1 text-[14px] font-semibold">{bank.name}</span>
                  <ChevronRight size={17} strokeWidth={2.2} className="text-[#A3ACB9]" />
                </button>
              ))}
              {filteredBanks.length === 0 && (
                <p className="py-8 text-center text-[12px] text-[#8B95A5]">Bank tidak ditemukan.</p>
              )}
            </div>
          </section>
        </div>
      )}

      {/* SHEET KONFIRMASI */}
      {confirmSheet.mounted && selected && (
        <div
          className={`fixed inset-0 z-[100] flex items-end justify-center sm:items-center sm:p-5 ${
            confirmSheet.closing ? "pointer-events-none" : ""
          }`}
        >
          <button
            type="button"
            disabled={processing}
            aria-label="Tutup konfirmasi"
            onClick={() => setConfirmOpen(false)}
            className={`dp-overlay absolute inset-0 bg-[#0B1410]/45 ${
              confirmSheet.closing ? "is-closing" : ""
            }`}
          />
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="confirm-deposit-title"
            className={`dp-sheet relative w-full max-w-[430px] rounded-t-[28px] bg-white px-5 pb-[max(20px,env(safe-area-inset-bottom))] pt-3 sm:rounded-[28px] ${
              confirmSheet.closing ? "is-closing" : ""
            }`}
          >
            <div className="mx-auto h-[5px] w-[40px] rounded-full bg-[#DDE4EA]" />
            <div className="mt-4 flex items-center justify-between">
              <h2 id="confirm-deposit-title" className="text-[18px] font-bold tracking-[-0.4px]">
                Konfirmasi deposit demo
              </h2>
              <button
                type="button"
                disabled={processing}
                onClick={() => setConfirmOpen(false)}
                aria-label="Tutup"
                className="dp-press flex h-[38px] w-[38px] items-center justify-center rounded-full bg-[#F4F7F9]"
              >
                <X size={18} strokeWidth={2.2} />
              </button>
            </div>

            <div className="mt-4 flex items-center gap-3 rounded-[20px] bg-[#F4F7F9] p-3">
              <span className="flex h-[46px] w-[46px] items-center justify-center rounded-[15px] bg-white p-[6px]">
                <BrandLogo method={selected} className="h-full w-full rounded-[10px]" />
              </span>
              <div>
                <p className="text-[14px] font-bold">{selected.name}</p>
                <p className="mt-0.5 text-[11px] text-[#8B95A5]">
                  {isCash ? "Bayar tunai di gerai" : "Transfer virtual account"}
                </p>
              </div>
            </div>

            <div className="mt-3 space-y-3 rounded-[20px] border border-[#E8EDF1] p-4">
              <div className="flex justify-between text-[13px] text-[#6B7686]">
                <span>Isi saldo</span>
                <span className="font-semibold text-[#0F1B14]">{money(amount)}</span>
              </div>
              <div className="flex justify-between text-[13px] text-[#6B7686]">
                <span>Biaya admin</span>
                <span className="font-semibold text-[#0F1B14]">{money(ADMIN_FEE)}</span>
              </div>
              <div className="flex items-center justify-between border-t-2 border-dashed border-[#E8EDF1] pt-3">
                <span className="text-[14px] font-bold">Total</span>
                <span className="text-[18px] font-extrabold tracking-[-0.4px] text-[#105D38]">
                  {money(total)}
                </span>
              </div>
            </div>

            <p className="mt-3.5 flex gap-2 text-[11px] leading-[1.6] text-[#8B95A5]">
              <Info size={14} className="mt-[1px] shrink-0" />
              Melanjutkan akan mencatat deposit simulasi, bukan melakukan pembayaran nyata.
            </p>

            <button
              type="button"
              disabled={processing}
              onClick={confirmDemo}
              className="dp-press mt-4 flex h-[54px] w-full items-center justify-center gap-2 rounded-[18px] bg-[#4CD080] text-[14px] font-bold text-[#0B3D26] hover:bg-[#43C477] disabled:opacity-60"
            >
              {processing ? (
                <>
                  <span className="h-[16px] w-[16px] animate-spin rounded-full border-2 border-[#0B3D26]/30 border-t-[#0B3D26]" />
                  Menyimpan...
                </>
              ) : (
                <>
                  <Check size={18} strokeWidth={2.6} />
                  Konfirmasi simulasi
                </>
              )}
            </button>
          </section>
        </div>
      )}

      <style jsx global>{`
        /* ---------- TRANSISI ANTAR HALAMAN ---------- */
        @keyframes dpInRight {
          from { opacity: 0; transform: translate3d(32px, 0, 0); }
          to { opacity: 1; transform: translate3d(0, 0, 0); }
        }
        @keyframes dpInLeft {
          from { opacity: 0; transform: translate3d(-32px, 0, 0); }
          to { opacity: 1; transform: translate3d(0, 0, 0); }
        }
        @keyframes dpInUp {
          from { opacity: 0; transform: translate3d(0, 12px, 0); }
          to { opacity: 1; transform: translate3d(0, 0, 0); }
        }
        .dp-view-forward { animation: dpInRight 480ms cubic-bezier(.22, 1, .36, 1) backwards; }
        .dp-view-back { animation: dpInLeft 480ms cubic-bezier(.22, 1, .36, 1) backwards; }
        .dp-view-initial { animation: dpInUp 400ms cubic-bezier(.22, 1, .36, 1) backwards; }

        /* ---------- MUNCUL BERURUTAN ---------- */
        @keyframes dpRise {
          from { opacity: 0; transform: translate3d(0, 18px, 0); }
          to { opacity: 1; transform: translate3d(0, 0, 0); }
        }
        .dp-rise {
          animation: dpRise 620ms cubic-bezier(.22, 1, .36, 1) calc(var(--i, 0) * 70ms + 60ms) backwards;
        }

        /* Tile metode: muncul dengan pantulan kecil */
        @keyframes dpPop {
          from { opacity: 0; transform: translate3d(0, 10px, 0) scale(.84); }
          to { opacity: 1; transform: translate3d(0, 0, 0) scale(1); }
        }
        .dp-tile {
          animation: dpPop 560ms cubic-bezier(.34, 1.4, .64, 1) calc(var(--i, 0) * 40ms + 220ms) backwards;
        }

        .dp-title { animation: dpInUp 360ms cubic-bezier(.22, 1, .36, 1) both; }

        /* ---------- INTERAKSI ---------- */
        .dp-press {
          -webkit-tap-highlight-color: transparent;
          transition: transform 380ms cubic-bezier(.34, 1.56, .64, 1),
            background-color 200ms ease, border-color 200ms ease,
            color 200ms ease, opacity 200ms ease;
        }
        .dp-press:active:not(:disabled) {
          transform: scale(.95);
          transition-duration: 90ms;
        }

        .dp-tile-box {
          transition: transform 420ms cubic-bezier(.34, 1.56, .64, 1), background-color 220ms ease;
        }
        .dp-logo { transition: transform 420ms cubic-bezier(.34, 1.56, .64, 1); }
        @media (hover: hover) {
          .dp-tile:hover .dp-tile-box { background-color: #E6F8EE; transform: translateY(-3px); }
          .dp-tile:hover .dp-logo { transform: scale(1.07); }
        }

        .dp-search::-webkit-search-cancel-button { display: none; }

        /* Centang kecil pada nominal terpilih */
        .dp-chip-check {
          transform: scale(0);
          opacity: 0;
          transition: transform 420ms cubic-bezier(.34, 1.56, .64, 1), opacity 160ms ease;
        }
        .dp-chip-check.is-active { transform: scale(1); opacity: 1; }

        /* Input salah: bergetar sekali */
        @keyframes dpShake {
          0%, 100% { transform: translate3d(0, 0, 0); }
          20% { transform: translate3d(-7px, 0, 0); }
          40% { transform: translate3d(6px, 0, 0); }
          60% { transform: translate3d(-4px, 0, 0); }
          80% { transform: translate3d(3px, 0, 0); }
        }
        .dp-shake { animation: dpShake 420ms cubic-bezier(.36, .07, .19, .97); }
        .dp-error { animation: dpInUp 300ms cubic-bezier(.22, 1, .36, 1) both; }

        /* ---------- ACCORDION ---------- */
        .dp-accordion {
          display: grid;
          grid-template-rows: 0fr;
          opacity: 0;
          transition: grid-template-rows 360ms cubic-bezier(.22, 1, .36, 1), opacity 240ms ease;
        }
        .dp-accordion.is-open { grid-template-rows: 1fr; opacity: 1; }
        .dp-step { opacity: 0; transform: translate3d(0, 6px, 0); }
        .dp-accordion.is-open .dp-step {
          animation: dpInUp 420ms cubic-bezier(.22, 1, .36, 1) calc(var(--i, 0) * 60ms + 120ms) both;
        }

        /* ---------- PLACEHOLDER VA ---------- */
        @keyframes dpDot {
          0%, 100% { opacity: .22; transform: scale(.85); }
          50% { opacity: 1; transform: scale(1); }
        }
        .dp-dot { animation: dpDot 1800ms ease-in-out calc(var(--i, 0) * 110ms) infinite; }

        /* ---------- BENTUK DATAR PADA KARTU GELAP ---------- */
        @keyframes dpShapes {
          from { opacity: 0; transform: translate3d(0, 34px, 0); }
          to { opacity: 1; transform: translate3d(0, 0, 0); }
        }
        @keyframes dpSun {
          0% { opacity: 0; transform: scale(0) translate3d(0, 14px, 0); }
          100% { opacity: 1; transform: scale(1) translate3d(0, 0, 0); }
        }
        .dp-shapes { animation: dpShapes 760ms cubic-bezier(.22, 1, .36, 1) 360ms backwards; }
        .dp-sun {
          transform-box: fill-box;
          transform-origin: center;
          animation: dpSun 620ms cubic-bezier(.34, 1.56, .64, 1) 800ms backwards;
        }

        /* ---------- FOOTER ---------- */
        @keyframes dpFooter {
          from { transform: translate3d(0, 100%, 0); }
          to { transform: translate3d(0, 0, 0); }
        }
        .dp-footer { animation: dpFooter 560ms cubic-bezier(.22, 1, .36, 1) 140ms backwards; }

        /* ---------- SHEET & OVERLAY ---------- */
        @keyframes dpFadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes dpFadeOut { from { opacity: 1; } to { opacity: 0; } }
        @keyframes dpSheetIn {
          from { transform: translate3d(0, 100%, 0); }
          to { transform: translate3d(0, 0, 0); }
        }
        @keyframes dpSheetOut {
          from { transform: translate3d(0, 0, 0); }
          to { transform: translate3d(0, 100%, 0); }
        }
        .dp-overlay { animation: dpFadeIn 280ms ease-out both; }
        .dp-overlay.is-closing { animation: dpFadeOut 280ms ease-in both; }
        .dp-sheet { animation: dpSheetIn 480ms cubic-bezier(.32, .72, 0, 1) both; }
        .dp-sheet.is-closing { animation: dpSheetOut 300ms cubic-bezier(.4, 0, 1, 1) both; }

        /* ---------- ACCESSIBILITY: kurangi gerakan ---------- */
        @media (prefers-reduced-motion: reduce) {
          .dp-view-forward, .dp-view-back, .dp-view-initial, .dp-rise, .dp-tile,
          .dp-title, .dp-shake, .dp-error, .dp-shapes, .dp-sun, .dp-footer,
          .dp-overlay, .dp-sheet, .dp-dot { animation: none !important; }
          .dp-press, .dp-tile-box, .dp-logo, .dp-accordion, .dp-chip-check {
            transition: none !important;
          }
          .dp-press:active { transform: none !important; }
          .dp-step { opacity: 1 !important; transform: none !important; animation: none !important; }
          .dp-dot { opacity: 1; }
        }
      `}</style>
    </main>
  );
}
