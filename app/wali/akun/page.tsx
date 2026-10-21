"use client";

import { useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ChevronRight,
  CircleHelp,
  CreditCard,
  Info,
  LogOut,
  MessageSquareText,
  Plus,
  QrCode,
  ReceiptText,
  ShieldCheck,
  SlidersHorizontal,
  UserRound,
  UsersRound,
  Wallet,
  X,
  Check,
} from "lucide-react";

// ==========================================
// DOSI PAY — AKUN WALI SANTRI
// Redesigned based on new profile reference
// Clean, centered, compact, modern
// ==========================================

const STUDENT = {
  name: "Ahmad Fauzan",
  nis: "20260001",
  initials: "AF",
};

const HISTORY_KEY = "dosi_demo_deposit_history";
const RECEIPT_KEY = "dosi_demo_deposit_receipt";
const LIMIT_STORAGE_KEY = "dosi_wali_daily_snack_limit_v1";

type ModalType =
  | "identity"
  | "profile"
  | "security"
  | "wallet"
  | "help"
  | "logout"
  | null;

type MenuItem = {
  label: string;
  icon: React.ComponentType<{
    size?: number;
    strokeWidth?: number;
    className?: string;
  }>;
  href?: string;
  modal?: Exclude<ModalType, null>;
};

type DemoDeposit = {
  bankId: string;
  depositAmount: number;
  createdAt: string;
};

// ==========================================
// MENU CONFIG
// ==========================================

const ACCOUNT_MENUS: MenuItem[] = [
  {
    label: "Informasi Akun",
    icon: UserRound,
    modal: "profile",
  },
  {
    label: "Informasi Santri",
    icon: UsersRound,
    modal: "identity",
  },
  {
    label: "Privasi & Keamanan",
    icon: ShieldCheck,
    modal: "security",
  },
];

const WALLET_MENUS: MenuItem[] = [
  {
    label: "Dompet Santri",
    icon: Wallet,
    modal: "wallet",
  },
  {
    label: "Riwayat Deposit",
    icon: ReceiptText,
    href: "/wali/riwayat",
  },
  {
    label: "Atur Limit Jajan",
    icon: SlidersHorizontal,
    href: "/wali/aktivitas",
  },
  {
    label: "Cicilan SPP",
    icon: CreditCard,
    href: "/wali/spp",
  },
  {
    label: "Pesan untuk Santri",
    icon: MessageSquareText,
    href: "/wali/pesan",
  },
];

const OTHER_MENUS: MenuItem[] = [
  {
    label: "Pusat Bantuan",
    icon: CircleHelp,
    modal: "help",
  },
  {
    label: "Keluar Akun",
    icon: LogOut,
    modal: "logout",
  },
];

// ==========================================
// HELPERS
// ==========================================

function rupiah(value: number) {
  return `Rp${value.toLocaleString("id-ID")}`;
}

function shortRupiah(value: number) {
  if (value >= 1000000) {
    return `${(value / 1000000).toLocaleString("id-ID", {
      maximumFractionDigits: 1,
    })}jt`;
  }

  if (value >= 1000) {
    return `${Math.round(value / 1000)}rb`;
  }

  return String(value);
}

function normalizeDeposit(value: unknown): DemoDeposit | null {
  if (!value || typeof value !== "object") return null;

  const item = value as Record<string, unknown>;

  if (
    item.isDemo !== true ||
    typeof item.bankId !== "string" ||
    typeof item.depositAmount !== "number" ||
    !Number.isSafeInteger(item.depositAmount) ||
    item.depositAmount < 20000 ||
    item.adminFee !== 5000 ||
    item.totalPayment !== item.depositAmount + 5000 ||
    typeof item.createdAt !== "string" ||
    !Number.isFinite(Date.parse(item.createdAt))
  ) {
    return null;
  }

  return {
    bankId: item.bankId,
    depositAmount: item.depositAmount,
    createdAt: item.createdAt,
  };
}

function readDepositSummary() {
  const deposits: DemoDeposit[] = [];

  try {
    const raw = localStorage.getItem(HISTORY_KEY);

    if (raw) {
      const parsed: unknown = JSON.parse(raw);

      if (Array.isArray(parsed)) {
        for (const item of parsed) {
          const valid = normalizeDeposit(item);
          if (valid) deposits.push(valid);
        }
      }
    }
  } catch {
    //
  }

  try {
    const raw = sessionStorage.getItem(RECEIPT_KEY);

    if (raw) {
      const parsed = JSON.parse(raw);
      const valid = normalizeDeposit(parsed);
      if (valid) deposits.push(valid);
    }
  } catch {
    //
  }

  const unique = new Map<string, DemoDeposit>();

  deposits.forEach((item) => {
    const key = `${item.createdAt}|${item.bankId}|${item.depositAmount}`;
    unique.set(key, item);
  });

  const all = [...unique.values()];

  return {
    count: all.length,
    total: all.reduce((sum, item) => sum + item.depositAmount, 0),
  };
}

function readDailyLimit() {
  try {
    const raw = localStorage.getItem(LIMIT_STORAGE_KEY);
    if (!raw) return 25000;

    const parsed: unknown = JSON.parse(raw);

    if (
      typeof parsed === "object" &&
      parsed !== null &&
      "limit" in parsed &&
      typeof parsed.limit === "number" &&
      Number.isSafeInteger(parsed.limit) &&
      parsed.limit > 0
    ) {
      return parsed.limit;
    }
  } catch {
    //
  }

  return 25000;
}

// ==========================================
// MENU ROW
// ==========================================

function MenuRow({
  item,
  onSelect,
}: {
  item: MenuItem;
  onSelect: (modal: Exclude<ModalType, null>) => void;
}) {
  const Icon = item.icon;

  const content = (
    <>
      <span className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-full bg-[#F3F7F4] text-[#3BBB7D]">
        <Icon size={17} strokeWidth={1.9} />
      </span>

      <span className="min-w-0 flex-1 text-[12px] font-medium text-[#23352A]">
        {item.label}
      </span>

      <ChevronRight
        size={17}
        strokeWidth={1.8}
        className="shrink-0 text-[#B2BDB4]"
      />
    </>
  );

  const className =
    "akun-tap flex min-h-[50px] w-full items-center gap-[12px] border-b border-[#EEF1EE] py-[7px] text-left last:border-b-0";

  if (item.href) {
    return (
      <Link href={item.href} className={className}>
        {content}
      </Link>
    );
  }

  return (
    <button
      type="button"
      onClick={() => item.modal && onSelect(item.modal)}
      className={className}
    >
      {content}
    </button>
  );
}

function MenuSection({
  title,
  items,
  onSelect,
}: {
  title: string;
  items: MenuItem[];
  onSelect: (modal: Exclude<ModalType, null>) => void;
}) {
  return (
    <section className="mt-[20px]">
      <h2 className="mb-[6px] text-[11px] font-semibold text-[#98A39B]">
        {title}
      </h2>

      <div>
        {items.map((item) => (
          <MenuRow
            key={item.label}
            item={item}
            onSelect={onSelect}
          />
        ))}
      </div>
    </section>
  );
}

function DetailRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start justify-between gap-[12px] border-b border-[#EEF1EE] py-[12px] last:border-b-0">
      <span className="shrink-0 text-[11px] text-[#8C9990]">
        {label}
      </span>

      <span className="min-w-0 break-words text-right text-[11px] font-semibold text-[#24382C]">
        {value}
      </span>
    </div>
  );
}

// ==========================================
// MAIN PAGE
// ==========================================

// Modal dan toast dirender langsung di <body>. Template halaman memakai animasi
// opacity yang membuat stacking context sendiri, sehingga tanpa portal elemen
// `fixed` di dalam halaman selalu berada di bawah bottom navbar (z-50).
function BodyPortal({ children }: { children: ReactNode }) {
  if (typeof document === "undefined") return null;

  return createPortal(
    <div className="font-sans text-[#17251D]">{children}</div>,
    document.body
  );
}

export default function WaliAkunPage() {
  const router = useRouter();

  const [modal, setModal] = useState<ModalType>(null);
  const [depositSummary, setDepositSummary] = useState({
    count: 0,
    total: 0,
  });
  const [dailyLimit, setDailyLimit] = useState(25000);
  const [copied, setCopied] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setDepositSummary(readDepositSummary());
    setDailyLimit(readDailyLimit());
    setReady(true);
  }, []);

  useEffect(() => {
    if (!modal) return;

    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setModal(null);
    }

    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [modal]);

  function openModal(value: Exclude<ModalType, null>) {
    setCopied(false);
    setModal(value);
  }

  async function copyNis() {
    try {
      await navigator.clipboard.writeText(STUDENT.nis);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  function logoutDemo() {
    setModal(null);
    router.replace("/pilih-login");
  }

  const modalTitles: Record<Exclude<ModalType, null>, string> = {
    identity: "Informasi Santri",
    profile: "Informasi Akun",
    security: "Privasi & Keamanan",
    wallet: "Dompet Santri",
    help: "Pusat Bantuan",
    logout: "Keluar Akun",
  };

  return (
    <main className="min-h-[100dvh] bg-[#F3F5F3] font-sans text-[#17251D]">
      <div className="mx-auto min-h-[100dvh] w-full max-w-[430px] bg-[#F3F5F3] px-[14px] pb-[max(26px,env(safe-area-inset-bottom))] pt-[max(16px,env(safe-area-inset-top))]">

        {/* =====================================
            PROFILE CARD — NEW CONCEPT
        ===================================== */}

        <section className="akun-card rounded-[28px] bg-white p-[8px] shadow-[0_18px_40px_-32px_rgba(0,0,0,0.22)]">

          {/* COVER */}
          <div className="relative overflow-hidden rounded-[24px] bg-[#EAF0EC] px-[14px] pb-[56px] pt-[14px]">

            {/* simple decorative shapes */}
            <div className="absolute inset-x-0 top-0 h-[96px] bg-[#E7EEEA]" />
            <div className="absolute left-[20px] top-[18px] h-[70px] w-[120px] rounded-full bg-white/35 blur-[0.5px]" />
            <div className="absolute right-[26px] top-[14px] h-[76px] w-[110px] rounded-full bg-white/28 blur-[0.5px]" />
            <div className="absolute inset-x-0 bottom-0 h-[1px] bg-[#E6ECE8]" />

            {/* top action */}
            <div className="relative z-10 flex justify-end">
              <Link
                href="/wali/deposit"
                aria-label="Tambah deposit"
                className="akun-tap flex h-[36px] w-[36px] items-center justify-center rounded-full bg-white text-[#4A5D52] shadow-sm"
              >
                <Plus size={18} strokeWidth={2.1} />
              </Link>
            </div>

            {/* avatar floating */}
            <div className="absolute bottom-[-34px] left-1/2 z-10 -translate-x-1/2">
              <div className="flex h-[84px] w-[84px] items-center justify-center rounded-full bg-white p-[4px] shadow-[0_10px_24px_-14px_rgba(0,0,0,0.26)]">
                <div className="relative flex h-full w-full items-center justify-center rounded-full bg-[#E6F2EA]">
                  <div className="absolute inset-0 rounded-full border-[3px] border-[#79D89F]" />
                  <div className="absolute inset-[5px] rounded-full border-[3px] border-[#B8E6CB]" />
                  <span className="text-[24px] font-bold text-[#176B45]">
                    {STUDENT.initials}
                  </span>
                </div>
              </div>
            </div>

          </div>

          {/* NAME + DESC */}
          <div className="px-[10px] pb-[8px] pt-[48px] text-center">
            <h1 className="text-[28px] font-bold tracking-[-0.9px] text-[#17251D] max-[360px]:text-[25px]">
              Wali Santri
            </h1>

            <p className="mt-[6px] text-[12px] leading-[1.7] text-[#7E8D82]">
              Terhubung dengan santri {STUDENT.name}
              <br />
              NIS {STUDENT.nis}
            </p>
          </div>

          {/* STATS */}
          <div className="mt-[10px] rounded-[18px] border border-[#ECEFEC] bg-[#FAFBFA] px-[8px] py-[10px] shadow-[0_10px_18px_-18px_rgba(0,0,0,0.18)]">
            <div className="grid grid-cols-3 divide-x divide-[#E7ECE8]">
              <div className="px-[8px] text-center">
                <p className="text-[20px] font-bold tracking-[-0.5px] text-[#17251D] max-[360px]:text-[17px]">
                  {ready ? shortRupiah(depositSummary.total) : "-"}
                </p>
                <p className="mt-[3px] text-[11px] text-[#97A299]">
                  Deposit Demo
                </p>
              </div>

              <div className="px-[8px] text-center">
                <p className="text-[20px] font-bold tracking-[-0.5px] text-[#17251D] max-[360px]:text-[17px]">
                  6
                </p>
                <p className="mt-[3px] text-[11px] text-[#97A299]">
                  Fitur Aktif
                </p>
              </div>

              <div className="px-[8px] text-center">
                <p className="text-[20px] font-bold tracking-[-0.5px] text-[#17251D] max-[360px]:text-[17px]">
                  {shortRupiah(dailyLimit)}
                </p>
                <p className="mt-[3px] text-[11px] text-[#97A299]">
                  Limit Harian
                </p>
              </div>
            </div>
          </div>

          {/* QUICK ICONS */}
          <div className="mt-[13px] flex items-center justify-center gap-[26px] pb-[6px]">
            <Link
              href="/wali/deposit"
              aria-label="Deposit"
              className="akun-tap text-[#2D3B33]"
            >
              <Wallet size={19} strokeWidth={1.9} />
            </Link>

            <Link
              href="/wali/riwayat"
              aria-label="Riwayat deposit"
              className="akun-tap text-[#2D3B33]"
            >
              <ReceiptText size={19} strokeWidth={1.9} />
            </Link>

            <button
              type="button"
              aria-label="Informasi santri"
              onClick={() => openModal("identity")}
              className="akun-tap text-[#2D3B33]"
            >
              <QrCode size={19} strokeWidth={1.9} />
            </button>
          </div>

        </section>

        {/* =====================================
            E-WALLET SUMMARY
        ===================================== */}

        <section className="mt-[16px] rounded-[22px] bg-white px-[15px] py-[15px] shadow-[0_18px_40px_-34px_rgba(0,0,0,0.20)]">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold text-[#96A39A]">
                E-Wallet Santri
              </p>
              <p className="mt-[4px] text-[26px] font-bold tracking-[-0.8px] text-[#17251D]">
                Rp0
              </p>
              <p className="mt-[4px] text-[10px] text-[#A0AAA2]">
                Saldo simulasi
              </p>
            </div>

            <span className="rounded-full bg-[#EAF7EE] px-[10px] py-[6px] text-[10px] font-semibold text-[#176B45]">
              DOSI PAY
            </span>
          </div>

          <div className="mt-[13px] flex items-center justify-between rounded-[14px] bg-[#F6F8F6] px-[12px] py-[11px]">
            <div>
              <p className="text-[10px] text-[#94A096]">
                Total Deposit Demo
              </p>
              <p className="mt-[4px] text-[12px] font-semibold text-[#24372B]">
                {ready ? rupiah(depositSummary.total) : "Memuat..."}
              </p>
            </div>

            <button
              type="button"
              onClick={() => openModal("wallet")}
              className="akun-tap text-[#176B45]"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </section>

        {/* =====================================
            MENU LISTS
        ===================================== */}

        <section className="mt-[16px] rounded-[22px] bg-white px-[16px] py-[12px] shadow-[0_18px_40px_-34px_rgba(0,0,0,0.20)]">
          <MenuSection
            title="Akun"
            items={ACCOUNT_MENUS}
            onSelect={openModal}
          />

          <MenuSection
            title="Keuangan Santri"
            items={WALLET_MENUS}
            onSelect={openModal}
          />

          <MenuSection
            title="Lainnya"
            items={OTHER_MENUS}
            onSelect={openModal}
          />
        </section>

        <p className="mt-[18px] text-center text-[10px] text-[#A7B1A9]">
          DOSI Pay • Versi Demo
        </p>
      </div>

      {/* =====================================
          MODAL / BOTTOM SHEET
      ===================================== */}

      {modal && (
        <BodyPortal>
        <div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center sm:p-5">

          <button
            type="button"
            onClick={() => setModal(null)}
            aria-label="Tutup"
            className="akun-backdrop absolute inset-0 bg-black/40"
          />

          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="akun-modal-title"
            className="akun-sheet relative max-h-[88dvh] w-full max-w-[430px] overflow-y-auto overscroll-contain rounded-t-[24px] bg-white px-[18px] pb-[max(24px,env(safe-area-inset-bottom))] pt-[12px] shadow-xl sm:rounded-[22px]"
          >
            <div className="mx-auto h-[4px] w-[36px] rounded-full bg-[#E5EBE6]" />

            <div className="mt-[18px] flex items-center justify-between">
              <h2
                id="akun-modal-title"
                className="text-[17px] font-bold tracking-[-0.4px]"
              >
                {{
                  identity: "Informasi Santri",
                  profile: "Informasi Akun",
                  security: "Privasi & Keamanan",
                  wallet: "Dompet Santri",
                  help: "Pusat Bantuan",
                  logout: "Keluar Akun",
                }[modal]}
              </h2>

              <button
                type="button"
                onClick={() => setModal(null)}
                aria-label="Tutup"
                className="akun-tap flex h-[32px] w-[32px] items-center justify-center rounded-full bg-[#F2F5F2]"
              >
                <X size={17} />
              </button>
            </div>

            {/* PROFILE */}
            {modal === "profile" && (
              <div className="mt-[18px]">
                <div className="flex items-center gap-[11px] rounded-[13px] bg-[#F5F8F5] px-[13px] py-[14px]">
                  <span className="flex h-[40px] w-[40px] items-center justify-center rounded-full bg-[#E4F1E7] text-[#176B45]">
                    <UserRound size={22} />
                  </span>

                  <div>
                    <p className="text-[12px] font-semibold text-[#24382C]">
                      Akun Wali Santri
                    </p>
                    <p className="mt-[4px] text-[10px] text-[#8F9C93]">
                      DOSI Pay Demo
                    </p>
                  </div>
                </div>

                <div className="mt-[12px]">
                  <DetailRow label="Jenis Akun" value="Wali Santri" />
                  <DetailRow label="Santri Terhubung" value={STUDENT.name} />
                  <DetailRow label="NIS" value={STUDENT.nis} />
                  <DetailRow label="Status" value="Akun Demo" />
                </div>
              </div>
            )}

            {/* IDENTITY */}
            {modal === "identity" && (
              <div className="mt-[18px]">
                <div className="rounded-[15px] bg-[#F5F8F5] px-[16px] py-[20px] text-center">
                  <div className="mx-auto flex h-[60px] w-[60px] items-center justify-center rounded-full bg-[#E0F0E5] text-[20px] font-bold text-[#176B45]">
                    {STUDENT.initials}
                  </div>

                  <h3 className="mt-[12px] text-[16px] font-bold text-[#24382C]">
                    {STUDENT.name}
                  </h3>

                  <p className="mt-[4px] text-[11px] text-[#96A29A]">
                    Nomor Induk Santri
                  </p>

                  <p className="mt-[9px] text-[19px] font-bold tracking-[1px] text-[#105D38]">
                    {STUDENT.nis}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={copyNis}
                  className="akun-tap mt-[16px] flex h-[44px] w-full items-center justify-center gap-[8px] rounded-[11px] bg-[#105D38] text-[12px] font-semibold text-white"
                >
                  {copied ? (
                    <>
                      <Check size={16} />
                      NIS Disalin
                    </>
                  ) : (
                    "Salin NIS Santri"
                  )}
                </button>

                <p className="mt-[12px] text-center text-[10px] leading-[1.7] text-[#95A197]">
                  QR identitas santri akan tersedia setelah sistem akun
                  terhubung secara penuh.
                </p>
              </div>
            )}

            {/* SECURITY */}
            {modal === "security" && (
              <div className="mt-[18px] rounded-[13px] bg-[#F5F8F5] px-[13px] py-[15px]">
                <div className="flex items-start gap-[11px]">
                  <ShieldCheck
                    size={21}
                    className="mt-[1px] shrink-0 text-[#247F50]"
                  />

                  <div>
                    <h3 className="text-[12px] font-semibold text-[#24382C]">
                      Keamanan Akun
                    </h3>

                    <p className="mt-[6px] text-[11px] leading-[1.8] text-[#829185]">
                      Pengaturan kata sandi, verifikasi akun, dan manajemen
                      perangkat akan tersedia setelah sistem autentikasi DOSI
                      Pay terhubung.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* WALLET */}
            {modal === "wallet" && (
              <div className="mt-[18px]">
                <div className="rounded-[15px] bg-[#105D38] px-[16px] py-[18px] text-white">
                  <p className="text-[11px] text-white/75">
                    Saldo E-Wallet Demo
                  </p>

                  <p className="mt-[7px] text-[27px] font-bold tracking-[-0.8px]">
                    Rp0
                  </p>

                  <p className="mt-[7px] text-[10px] text-white/75">
                    Saldo belum terhubung ke sistem kasir.
                  </p>
                </div>

                <div className="mt-[12px]">
                  <DetailRow
                    label="Jumlah Deposit Demo"
                    value={ready ? `${depositSummary.count} transaksi` : "Memuat..."}
                  />
                  <DetailRow
                    label="Total Deposit Demo"
                    value={ready ? rupiah(depositSummary.total) : "Memuat..."}
                  />
                  <DetailRow
                    label="Limit Jajan Harian"
                    value={rupiah(dailyLimit)}
                  />
                </div>

                <div className="mt-[13px] flex items-start gap-[8px] rounded-[12px] bg-[#F5F8F5] px-[12px] py-[12px]">
                  <Info
                    size={15}
                    className="mt-[2px] shrink-0 text-[#538B65]"
                  />
                  <p className="text-[10px] leading-[1.7] text-[#819086]">
                    Deposit simulasi belum menambah saldo e-wallet sebenarnya.
                    Nilai deposit demo hanya ditampilkan sebagai ringkasan
                    aktivitas.
                  </p>
                </div>

                <Link
                  href="/wali/deposit"
                  className="akun-tap mt-[16px] flex h-[44px] w-full items-center justify-center rounded-[11px] bg-[#105D38] text-[12px] font-semibold text-white"
                >
                  Deposit Santri
                </Link>
              </div>
            )}

            {/* HELP */}
            {modal === "help" && (
              <div className="mt-[18px] rounded-[13px] bg-[#F5F8F5] px-[13px] py-[15px]">
                <div className="flex items-start gap-[11px]">
                  <CircleHelp
                    size={21}
                    className="mt-[1px] shrink-0 text-[#247F50]"
                  />

                  <div>
                    <h3 className="text-[12px] font-semibold text-[#24382C]">
                      Bantuan DOSI Pay
                    </h3>

                    <p className="mt-[6px] text-[11px] leading-[1.8] text-[#829185]">
                      Untuk pertanyaan seputar deposit, limit jajan, cicilan
                      SPP, atau pesan wali, nantinya wali dapat menghubungi
                      petugas pesantren melalui pusat bantuan resmi.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* LOGOUT */}
            {modal === "logout" && (
              <div className="mt-[19px]">
                <div className="mx-auto flex h-[54px] w-[54px] items-center justify-center rounded-full bg-[#FBEDEA] text-[#C66759]">
                  <LogOut size={25} strokeWidth={1.8} />
                </div>

                <p className="mt-[15px] text-center text-[13px] font-semibold text-[#24382C]">
                  Keluar dari DOSI Pay?
                </p>

                <p className="mt-[7px] text-center text-[11px] leading-[1.7] text-[#8E9C91]">
                  Anda akan kembali ke halaman login.
                </p>

                <button
                  type="button"
                  onClick={logoutDemo}
                  className="akun-tap mt-[18px] flex h-[44px] w-full items-center justify-center rounded-[11px] bg-[#105D38] text-[12px] font-semibold text-white"
                >
                  Ya, Keluar
                </button>

                <button
                  type="button"
                  onClick={() => setModal(null)}
                  className="mt-[7px] h-[40px] w-full text-[11px] font-semibold text-[#728075]"
                >
                  Batal
                </button>
              </div>
            )}
          </section>
        </div>
        </BodyPortal>
      )}

      {/* =====================================
          ANIMATION
      ===================================== */}

      <style jsx global>{`
        @keyframes akunFadeUp {
          from {
            opacity: 0;
            transform: translateY(12px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .akun-card {
          animation: akunFadeUp 480ms cubic-bezier(0.22, 1, 0.36, 1) both;
        }

        .akun-tap {
          transition:
            transform 170ms ease,
            background-color 170ms ease,
            border-color 170ms ease;
        }

        .akun-tap:active {
          transform: scale(0.98);
        }

        @keyframes akunBackdropIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        .akun-backdrop {
          animation: akunBackdropIn 220ms ease-out both;
        }

        @keyframes akunSheetIn {
          from {
            opacity: 0;
            transform: translateY(28px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .akun-sheet {
          animation: akunSheetIn 370ms cubic-bezier(0.22, 1, 0.36, 1) both;
        }

        @media (prefers-reduced-motion: reduce) {
          .akun-card,
          .akun-backdrop,
          .akun-sheet {
            animation: none !important;
          }

          .akun-tap {
            transition: none !important;
          }

          .akun-tap:active {
            transform: none !important;
          }
        }
      `}</style>
    </main>
  );
}