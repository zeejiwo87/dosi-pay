"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { Plus_Jakarta_Sans } from "next/font/google";

import {
  ArrowUpRight,
  Bell,
  BookOpen,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  GraduationCap,
  Gauge,
  History,
  House,
  Eye,
  EyeOff,
  Megaphone,
  MessageCircle,
  Plus,
  Settings,
  ShoppingBag,
  UserRound,
  Wallet,
  type LucideIcon,
} from "lucide-react";

// ==========================================
// DOSI PAY — BERANDA WALI SANTRI
// ==========================================

// Font mengikuti gaya referensi (Wpay). Tidak mau pakai Google Font?
// Hapus import + konstanta `jakarta`, lalu ganti `jakarta.className` dengan "font-sans".
const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

// Saldo awal versi demo, belum terhubung ke backend kasir.
const BALANCE = 275000;
const DEPOSIT_HISTORY_KEY = "dosi_demo_deposit_history";
const LATEST_RECEIPT_KEY = "dosi_demo_deposit_receipt";
const BALANCE_VISIBILITY_KEY = "dosi_wali_balance_visible_v1";

// Ikon duotone: garis + isi tipis (tanpa gradasi), dipakai di semua ikon yang bentuknya tertutup
const DUO = { fill: "currentColor", fillOpacity: 0.16 } as const;

function cssVars(vars: Record<string, string | number>): CSSProperties {
  return vars as unknown as CSSProperties;
}
const rise = (index: number) => cssVars({ "--i": index });

// ==========================================
// DATA
// ==========================================

type MenuItem = {
  label: string;
  icon: LucideIcon;
  href: string;
  duo: boolean;
};

type ServiceItem = MenuItem & { color: string };

// Satu fitur = satu ikon, di semua bagian halaman
const ICON = {
  deposit: { icon: Wallet, duo: true },
  riwayat: { icon: History, duo: false },
  pengeluaran: { icon: ShoppingBag, duo: true },
  limit: { icon: Gauge, duo: true },
  akun: { icon: UserRound, duo: true },
} as const;

// MENU TRANSAKSI

const primary: MenuItem[] = [
  { label: "Deposit", href: "/wali/deposit", ...ICON.deposit },
  { label: "Riwayat", href: "/wali/riwayat", ...ICON.riwayat },
  { label: "Pengeluaran", href: "/wali/pengeluaran", ...ICON.pengeluaran },
];

// MENU LAYANAN

const services: ServiceItem[] = [
  {
    label: "Pengumuman",
    icon: Megaphone,
    href: "/wali/pengumuman",
    color: "#F08A1C",
    duo: true,
  },
  {
    label: "Pesan",
    icon: MessageCircle,
    href: "/wali/pesan",
    color: "#3B6EF5",
    duo: true,
  },
  {
    label: "Deposit",
    href: "/wali/deposit",
    color: "#1FA45C",
    ...ICON.deposit,
  },
  {
    label: "SPP",
    icon: GraduationCap,
    href: "/wali/spp",
    color: "#E0A000",
    duo: true,
  },
  {
    label: "Pengeluaran",
    href: "/wali/pengeluaran",
    color: "#E5484D",
    ...ICON.pengeluaran,
  },
  {
    label: "Riwayat",
    href: "/wali/riwayat",
    color: "#7C5CE0",
    ...ICON.riwayat,
  },
  {
    label: "Atur Limit",
    href: "/wali/aktivitas",
    color: "#0E93A8",
    ...ICON.limit,
  },
  {
    label: "Akun",
    href: "/wali/akun",
    color: "#5F6B7A",
    ...ICON.akun,
  },
];

// BOTTOM NAVIGATION

const navigation: MenuItem[] = [
  { label: "Beranda", icon: House, href: "/wali/beranda", duo: true },
  { label: "Limit", href: "/wali/aktivitas", ...ICON.limit },
  { label: "Notifikasi", icon: Bell, href: "/wali/notifikasi", duo: true },
  { label: "Akun", href: "/wali/akun", ...ICON.akun },
];

// DATA PENGUMUMAN
// Tetap sama dengan file yang dilampirkan.

const announcements = [
  {
    id: 1,
    date: "7 Oktober 2026",
    dateTime: "2026-10-07",
    title: "Jadwal Kunjungan Wali Santri",
    description: "Kunjungan wali dilaksanakan pada 10 Oktober 2026.",
    category: "Informasi Pesantren",
    color: "#063F3C",
    accent: "#52C995",
    icon: CalendarDays,
    isDemo: false,
  },
  {
    id: 2,
    date: "Contoh Slide",
    dateTime: "",
    title: "Informasi Kegiatan Santri",
    description:
      "Contoh pengumuman kegiatan pesantren yang dapat dibaca wali santri.",
    category: "Contoh Pengumuman",
    color: "#235E4D",
    accent: "#A7DCC6",
    icon: BookOpen,
    isDemo: true,
  },
  {
    id: 3,
    date: "Contoh Slide",
    dateTime: "",
    title: "Pemberitahuan Pesantren",
    description: "Contoh informasi terbaru dari manajemen pesantren.",
    category: "Contoh Pengumuman",
    color: "#274B60",
    accent: "#9DC7D9",
    icon: Megaphone,
    isDemo: true,
  },
];

// ==========================================
// SALDO DEMO: AWAL + DEPOSIT TERCATAT
// ==========================================

// Struk yang sama kadang ada di history dan sessionStorage.
// Dihitung hanya sekali; biaya admin tidak menambah saldo.
function readDemoDepositTotal(): number {
  const unique = new Map<string, number>();

  function addReceipt(value: unknown) {
    if (!value || typeof value !== "object") return;
    const item = value as Record<string, unknown>;

    if (
      item.isDemo !== true ||
      typeof item.bankId !== "string" ||
      !item.bankId.trim() ||
      typeof item.depositAmount !== "number" ||
      !Number.isSafeInteger(item.depositAmount) ||
      item.depositAmount < 20_000 ||
      item.adminFee !== 5_000 ||
      item.totalPayment !== item.depositAmount + 5_000 ||
      typeof item.createdAt !== "string" ||
      !Number.isFinite(Date.parse(item.createdAt))
    ) return;

    const key = `${item.createdAt}|${item.bankId}|${item.depositAmount}`;
    unique.set(key, item.depositAmount);
  }

  try {
    const raw = localStorage.getItem(DEPOSIT_HISTORY_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    if (Array.isArray(parsed)) parsed.forEach(addReceipt);
  } catch {
    // Riwayat belum ada atau tidak dapat dibaca.
  }

  try {
    const raw = sessionStorage.getItem(LATEST_RECEIPT_KEY);
    if (raw) addReceipt(JSON.parse(raw));
  } catch {
    // Struk terakhir tidak tersedia.
  }

  let total = 0;
  for (const amount of unique.values()) {
    // Hindari integer overflow untuk input demo yang sangat besar.
    if (!Number.isSafeInteger(total + amount + BALANCE)) break;
    total += amount;
  }
  return total;
}

// ==========================================
// COMPONENT: BENTUK DATAR PADA KARTU
// ==========================================

function FlatShapes({ color }: { color: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 170 120"
      className="br-shapes pointer-events-none absolute bottom-0 right-0 w-[124px]"
    >
      <path
        d="M22 120 L112 68 L152 120 Z"
        fill={color}
        stroke={color}
        strokeWidth="14"
        strokeLinejoin="round"
      />
      <circle className="br-sun" cx="116" cy="50" r="17" fill="#FFAE58" />
    </svg>
  );
}

// ==========================================
// COMPONENT: SERVICE
// ==========================================

function ServiceTile({ item, index }: { item: ServiceItem; index: number }) {
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      className="br-tile br-press br-focus flex min-w-0 flex-col items-center gap-[9px] text-center"
      style={rise(index)}
    >
      <span
        className="br-tile-box flex h-[62px] w-[62px] items-center justify-center rounded-[22px] bg-[#F4F7F9]"
        style={{ color: item.color }}
      >
        <Icon
          size={26}
          strokeWidth={1.8}
          aria-hidden="true"
          className="br-tile-icon"
          {...(item.duo ? DUO : {})}
        />
      </span>
      <span className="max-w-full text-[11px] font-medium leading-[1.35] text-[#2B3A31] max-[360px]:text-[10px]">
        {item.label}
      </span>
    </Link>
  );
}

// ==========================================
// COMPONENT: BOTTOM NAV
// ==========================================

function BottomNavigation() {
  const pathname = usePathname();

  function renderItem(item: MenuItem) {
    const Icon = item.icon;
    const active = pathname === item.href;

    return (
      <Link
        key={item.href}
        href={item.href}
        aria-current={active ? "page" : undefined}
        className="br-press br-focus flex h-full flex-col items-center justify-center gap-[3px]"
      >
        <span
          className={`flex h-[30px] w-[50px] items-center justify-center rounded-full transition-colors duration-300 ${
            active
              ? "br-nav-pill bg-[#E6F8EE] text-[#105D38]"
              : "text-[#8B95A5]"
          }`}
        >
          <Icon
            size={21}
            strokeWidth={active ? 2 : 1.8}
            aria-hidden="true"
            {...(item.duo ? DUO : {})}
          />
        </span>
        <span
          className={`text-[10px] font-semibold transition-colors duration-300 ${
            active ? "text-[#105D38]" : "text-[#8B95A5]"
          }`}
        >
          {item.label}
        </span>
      </Link>
    );
  }

  return (
    <nav
      aria-label="Navigasi utama"
      className="pointer-events-none fixed inset-x-0 bottom-0 z-50"
    >
      <div className="br-nav pointer-events-auto relative mx-auto w-full max-w-[430px] rounded-t-[28px] border-t border-[#E8EDF1] bg-white pb-[env(safe-area-inset-bottom)] shadow-[0_-10px_28px_-14px_rgba(15,27,20,0.16)]">
        <div className="grid h-[66px] grid-cols-5 items-center px-2">
          {navigation.slice(0, 2).map(renderItem)}

          <div aria-hidden="true" />

          {navigation.slice(2).map(renderItem)}
        </div>

        {/* CENTER DEPOSIT BUTTON */}
        <div className="absolute -top-[28px] left-1/2 -ml-[30px] h-[60px] w-[60px]">
          <span
            aria-hidden="true"
            className="br-fab-ring pointer-events-none absolute inset-0 rounded-full border-2 border-[#4CD080]"
          />
          <Link
            href="/wali/deposit"
            aria-label="Tambah deposit"
            className="br-fab br-press br-focus group relative flex h-[60px] w-[60px] items-center justify-center rounded-full border-[6px] border-white bg-[#4CD080] text-[#0B3D26] shadow-[0_10px_22px_-10px_rgba(76,208,128,0.95)] hover:bg-[#43C477]"
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
  );
}

// ==========================================
// MAIN PAGE
// ==========================================

export default function BerandaWaliPage() {
  const carouselRef = useRef<HTMLDivElement>(null);

  const [activeSlide, setActiveSlide] = useState(0);
  const [scrolled, setScrolled] = useState(false);

  const [balance, setBalance] = useState<number | null>(null);
  const [balanceVisible, setBalanceVisible] = useState<boolean | null>(null);

  // Beranda membaca ulang deposit saat dibuka/difokuskan kembali,
  // dan saat localStorage berubah dari tab lain.
  useEffect(() => {
    const refreshBalance = () => {
      setBalance(BALANCE + readDemoDepositTotal());
    };

    refreshBalance();

    try {
      setBalanceVisible(
        localStorage.getItem(BALANCE_VISIBILITY_KEY) !== "hidden"
      );
    } catch {
      setBalanceVisible(true);
    }

    const onStorage = (event: StorageEvent) => {
      if (
        event.key === DEPOSIT_HISTORY_KEY ||
        event.key === BALANCE_VISIBILITY_KEY ||
        event.key === null
      ) {
        refreshBalance();
        if (event.key === BALANCE_VISIBILITY_KEY || event.key === null) {
          try {
            setBalanceVisible(
              localStorage.getItem(BALANCE_VISIBILITY_KEY) !== "hidden"
            );
          } catch {
            setBalanceVisible(true);
          }
        }
      }
    };

    const onVisible = () => {
      if (document.visibilityState === "visible") refreshBalance();
    };

    window.addEventListener("focus", refreshBalance);
    window.addEventListener("pageshow", refreshBalance);
    window.addEventListener("storage", onStorage);
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      window.removeEventListener("focus", refreshBalance);
      window.removeEventListener("pageshow", refreshBalance);
      window.removeEventListener("storage", onStorage);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  function toggleBalanceVisibility() {
    const nextVisible = balanceVisible !== true;
    setBalanceVisible(nextVisible);
    try {
      localStorage.setItem(
        BALANCE_VISIBILITY_KEY,
        nextVisible ? "visible" : "hidden"
      );
    } catch {
      // Ikon mata tetap berfungsi meski storage dibatasi.
    }
  }

  // Garis tipis di bawah header muncul saat halaman digulir
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 4);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // ========================================
  // CAROUSEL FUNCTIONS
  // ========================================

  function goToSlide(index: number) {
    const track = carouselRef.current;

    if (!track) return;

    const cards = track.querySelectorAll<HTMLElement>(
      "[data-announcement-slide]"
    );

    const first = cards[0];
    const target = cards[index];

    if (!first || !target) return;

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    track.scrollTo({
      left: target.offsetLeft - first.offsetLeft,
      behavior: reduceMotion ? "auto" : "smooth",
    });

    setActiveSlide(index);
  }

  function handleCarouselScroll() {
    const track = carouselRef.current;

    if (!track) return;

    const cards = Array.from(
      track.querySelectorAll<HTMLElement>("[data-announcement-slide]")
    );

    if (!cards.length) return;

    const firstOffset = cards[0].offsetLeft;

    let nearest = 0;
    let smallestDistance = Infinity;

    cards.forEach((card, index) => {
      const left = card.offsetLeft - firstOffset;

      const distance = Math.abs(track.scrollLeft - left);

      if (distance < smallestDistance) {
        smallestDistance = distance;
        nearest = index;
      }
    });

    setActiveSlide(nearest);
  }

  function nextSlide() {
    goToSlide(Math.min(activeSlide + 1, announcements.length - 1));
  }

  function previousSlide() {
    goToSlide(Math.max(activeSlide - 1, 0));
  }

  return (
    <main
      className={`${jakarta.className} min-h-[100dvh] w-full bg-[#F1F4F6] text-[#0F1B14] antialiased`}
    >
      <div className="mx-auto min-h-[100dvh] w-full max-w-[430px] bg-white sm:shadow-[0_0_0_1px_#E8EDF1]">
        {/* ==================================
            STICKY HEADER
        ================================== */}

        <header
          className={`sticky top-0 z-40 bg-white px-5 pt-[env(safe-area-inset-top)] transition-shadow duration-300 ${
            scrolled ? "shadow-[0_1px_0_#E8EDF1]" : "shadow-[0_1px_0_transparent]"
          }`}
        >
          <div className="br-header flex h-[68px] items-center justify-between">
            <Link
              href="/wali/beranda"
              aria-label="Beranda DOSI Pay"
              className="br-focus flex h-[48px] items-center"
            >
              <Image
                src="/DOSIPAY.png"
                alt="DOSI Pay"
                width={100}
                height={65}
                priority
                className="h-[43px] w-[79px] object-contain"
              />
            </Link>

            <div className="flex items-center gap-[10px]">
              <Link
                href="/wali/notifikasi"
                aria-label="Notifikasi"
                className="br-press br-focus flex h-[44px] w-[44px] items-center justify-center rounded-[16px] border border-[#E8EDF1] bg-white text-[#0F1B14] hover:bg-[#F4F7F9]"
              >
                <Bell size={20} strokeWidth={1.8} {...DUO} />
              </Link>

              <Link
                href="/wali/akun"
                aria-label="Pengaturan akun"
                className="br-press br-focus group flex h-[44px] w-[44px] items-center justify-center rounded-[16px] border border-[#E8EDF1] bg-white text-[#0F1B14] hover:bg-[#F4F7F9]"
              >
                <Settings
                  size={20}
                  strokeWidth={1.8}
                  className="transition-transform duration-500 group-hover:rotate-90"
                />
              </Link>
            </div>
          </div>
        </header>

        {/* ==================================
            SCROLLABLE CONTENT
        ================================== */}

        <div className="px-5 pb-[calc(116px+env(safe-area-inset-bottom))]">
          {/* SALDO */}

          <section
            aria-label="Saldo santri"
            className="br-rise mt-3 flex flex-wrap items-end justify-between gap-x-3 gap-y-2"
            style={rise(0)}
          >
            <div className="min-w-0">
              <h1 className="text-[21px] font-extrabold leading-[1.25] tracking-[-0.6px] max-[360px]:text-[19px]">
                Halo Ibu Siti,
              </h1>

              <p className="mt-1 text-[12px] text-[#8B95A5]">
                Saldo santri tersedia
              </p>
            </div>

            <div className="ml-auto flex min-w-0 items-center gap-[7px]">
              <strong
                aria-label={
                  balanceVisible === true && balance !== null
                    ? `Saldo santri Rp ${balance.toLocaleString("id-ID")}`
                    : "Saldo disembunyikan"
                }
                className="relative min-w-0 whitespace-nowrap text-right text-[30px] font-extrabold leading-none tracking-[-1.2px] [font-variant-numeric:tabular-nums] max-[360px]:text-[26px]"
              >
                {/* Nominal tetap menempati ruang saat disembunyikan.
                    Dengan begitu, bagian di bawahnya tidak bergeser. */}
                <span
                  aria-hidden="true"
                  className={balanceVisible === true ? "inline-block" : "invisible inline-block"}
                >
                  <span className="mr-1 align-[0.55em] text-[0.5em] font-bold tracking-normal text-[#8B95A5]">
                    Rp
                  </span>
                  <span>{(balance ?? BALANCE).toLocaleString("id-ID")}</span>
                </span>
                {balanceVisible !== true && (
                  <span
                    aria-hidden="true"
                    className="absolute inset-0 flex items-center justify-end text-[24px] tracking-[2px] max-[360px]:text-[21px]"
                  >
                    ••••••
                  </span>
                )}
              </strong>

              <button
                type="button"
                onClick={toggleBalanceVisibility}
                aria-label={balanceVisible === true ? "Sembunyikan saldo" : "Tampilkan saldo"}
                aria-pressed={balanceVisible === true}
                title={balanceVisible === true ? "Sembunyikan saldo" : "Tampilkan saldo"}
                className="br-press br-focus flex h-[32px] w-[32px] shrink-0 items-center justify-center rounded-[10px] text-[#66768A] hover:bg-[#F4F7F9]"
              >
                {balanceVisible === true ? (
                  <Eye size={19} strokeWidth={1.8} aria-hidden="true" />
                ) : (
                  <EyeOff size={19} strokeWidth={1.8} aria-hidden="true" />
                )}
              </button>
            </div>
          </section>

          {/* ==================================
              PRIMARY TRANSACTIONS
          ================================== */}

          <nav
            aria-label="Transaksi santri"
            className="br-rise mt-6 grid grid-cols-3 rounded-[26px] bg-[#4CD080] py-[18px] text-[#0B3D26]"
            style={rise(1)}
          >
            {primary.map((item, index) => {
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`br-press br-focus flex min-h-[64px] flex-col items-center justify-center gap-[8px] ${
                    index !== 0 ? "border-l border-[#0B3D26]/15" : ""
                  }`}
                >
                  <Icon
                    size={27}
                    strokeWidth={1.7}
                    aria-hidden="true"
                    className="br-bar-icon"
                    style={rise(index)}
                    {...(item.duo ? DUO : {})}
                  />

                  <span className="text-[12px] font-bold">{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* ==================================
              SERVICES
          ================================== */}

          <section
            aria-labelledby="services-title"
            className="br-rise mt-8"
            style={rise(2)}
          >
            <h2
              id="services-title"
              className="text-[18px] font-bold tracking-[-0.4px]"
            >
              Layanan
            </h2>

            <div className="mt-4 grid grid-cols-4 gap-x-2 gap-y-5">
              {services.map((item, index) => (
                <ServiceTile
                  key={`${item.href}-${item.label}`}
                  item={item}
                  index={index + 3}
                />
              ))}
            </div>
          </section>

          {/* ==================================
              LATEST ANNOUNCEMENTS
          ================================== */}

          <section
            aria-labelledby="announcements-title"
            className="br-rise mt-9"
            style={rise(4)}
          >
            <div className="flex items-center justify-between gap-2">
              <h2
                id="announcements-title"
                className="text-[18px] font-bold tracking-[-0.4px] max-[360px]:text-[16px]"
              >
                Pengumuman Terbaru
              </h2>

              <Link
                href="/wali/pengumuman"
                className="br-press br-focus flex shrink-0 items-center gap-[2px] text-[12px] font-semibold text-[#178A50]"
              >
                Lihat Semua
                <ChevronRight size={15} strokeWidth={2.3} />
              </Link>
            </div>

            {/* SWIPEABLE CAROUSEL */}

            <div
              ref={carouselRef}
              onScroll={handleCarouselScroll}
              role="region"
              aria-label="Geser untuk melihat pengumuman lainnya"
              className="br-carousel relative mt-4 flex snap-x snap-mandatory gap-3 overflow-x-auto overscroll-x-contain pb-1 pr-[12%] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
              style={{
                WebkitOverflowScrolling: "touch",
              }}
            >
              {announcements.map((item, index) => {
                const PromoIcon = item.icon;
                const active = activeSlide === index;

                return (
                  <Link
                    key={item.id}
                    href="/wali/pengumuman"
                    data-announcement-slide
                    className={`br-card br-focus relative flex min-h-[204px] basis-[88%] shrink-0 snap-start flex-col overflow-hidden rounded-[26px] p-5 text-white ${
                      active ? "is-active" : ""
                    }`}
                    style={{
                      backgroundColor: item.color,
                    }}
                  >
                    {/* CATEGORY + DATE */}

                    <div className="flex items-center gap-3">
                      <span
                        className="flex h-[40px] w-[40px] shrink-0 items-center justify-center rounded-[14px] bg-white/12"
                        style={{ color: item.accent }}
                      >
                        <PromoIcon
                          size={20}
                          strokeWidth={1.9}
                          aria-hidden="true"
                          {...DUO}
                        />
                      </span>

                      <div className="min-w-0">
                        <p className="truncate text-[12px] font-semibold text-white/90">
                          {item.category}
                        </p>

                        {item.dateTime ? (
                          <time
                            dateTime={item.dateTime}
                            className="mt-0.5 block text-[11px] text-white/60"
                          >
                            {item.date}
                          </time>
                        ) : (
                          <span className="mt-0.5 block text-[11px] text-white/60">
                            {item.date}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* CONTENT */}

                    <h3 className="mt-4 max-w-[80%] text-[18px] font-bold leading-[1.3] tracking-[-0.4px]">
                      {item.title}
                    </h3>

                    <p className="mt-1.5 line-clamp-2 max-w-[70%] text-[12px] leading-[1.6] text-white/70">
                      {item.description}
                    </p>

                    {/* READ ACTION */}

                    <span className="mt-auto flex items-center gap-1.5 pt-4 text-[12px] font-semibold">
                      {item.isDemo ? "Lihat contoh" : "Baca pengumuman"}

                      <ArrowUpRight
                        size={15}
                        strokeWidth={2.2}
                        className="br-card-arrow"
                      />
                    </span>

                    <FlatShapes color={item.accent} />
                  </Link>
                );
              })}
            </div>

            {/* CAROUSEL CONTROLS */}

            <div className="mt-3.5 flex items-center justify-between">
              <div className="flex items-center gap-[6px]">
                {announcements.map((item, index) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => goToSlide(index)}
                    aria-label={`Lihat pengumuman ${index + 1}`}
                    aria-current={activeSlide === index ? "true" : undefined}
                    className={`br-focus h-[6px] rounded-full transition-all duration-500 [transition-timing-function:cubic-bezier(.34,1.56,.64,1)] ${
                      activeSlide === index
                        ? "w-[22px] bg-[#4CD080]"
                        : "w-[6px] bg-[#DDE4EA]"
                    }`}
                  />
                ))}
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={previousSlide}
                  disabled={activeSlide === 0}
                  aria-label="Pengumuman sebelumnya"
                  className="br-press br-focus flex h-[34px] w-[34px] items-center justify-center rounded-full border border-[#E1E8ED] text-[#0F1B14] hover:bg-[#F4F7F9] disabled:cursor-default disabled:opacity-35"
                >
                  <ChevronLeft size={17} strokeWidth={2.1} />
                </button>

                <button
                  type="button"
                  onClick={nextSlide}
                  disabled={activeSlide === announcements.length - 1}
                  aria-label="Pengumuman berikutnya"
                  className="br-press br-focus flex h-[34px] w-[34px] items-center justify-center rounded-full border border-[#E1E8ED] text-[#0F1B14] hover:bg-[#F4F7F9] disabled:cursor-default disabled:opacity-35"
                >
                  <ChevronRight size={17} strokeWidth={2.1} />
                </button>
              </div>
            </div>
          </section>
        </div>
      </div>

      <BottomNavigation />

      {/* ==================================
          ANIMATIONS
      ================================== */}

      <style jsx global>{`
        /* ---------- MUNCUL BERURUTAN ---------- */
        @keyframes brRise {
          from { opacity: 0; transform: translate3d(0, 18px, 0); }
          to { opacity: 1; transform: translate3d(0, 0, 0); }
        }
        .br-rise {
          animation: brRise 640ms cubic-bezier(.22, 1, .36, 1) calc(var(--i, 0) * 80ms + 60ms) backwards;
        }

        @keyframes brHeader {
          from { opacity: 0; transform: translate3d(0, -8px, 0); }
          to { opacity: 1; transform: translate3d(0, 0, 0); }
        }
        .br-header { animation: brHeader 520ms cubic-bezier(.22, 1, .36, 1) backwards; }

        /* Ikon pada bar mint: muncul memantul bergantian */
        @keyframes brPop {
          from { opacity: 0; transform: translate3d(0, 8px, 0) scale(.6); }
          to { opacity: 1; transform: translate3d(0, 0, 0) scale(1); }
        }
        .br-bar-icon {
          animation: brPop 560ms cubic-bezier(.34, 1.56, .64, 1) calc(var(--i, 0) * 90ms + 320ms) backwards;
        }

        /* Tile layanan: muncul dengan pantulan kecil */
        @keyframes brTile {
          from { opacity: 0; transform: translate3d(0, 12px, 0) scale(.82); }
          to { opacity: 1; transform: translate3d(0, 0, 0) scale(1); }
        }
        .br-tile {
          animation: brTile 560ms cubic-bezier(.34, 1.4, .64, 1) calc(var(--i, 0) * 45ms + 200ms) backwards;
        }

        /* ---------- INTERAKSI ---------- */
        .br-press {
          -webkit-tap-highlight-color: transparent;
          transition: transform 380ms cubic-bezier(.34, 1.56, .64, 1),
            background-color 200ms ease, border-color 200ms ease,
            color 200ms ease, opacity 200ms ease;
        }
        .br-press:active:not(:disabled) {
          transform: scale(.95);
          transition-duration: 90ms;
        }
        .br-focus:focus-visible {
          outline: 2px solid #4cd080;
          outline-offset: 3px;
        }

        .br-tile-box {
          transition: transform 420ms cubic-bezier(.34, 1.56, .64, 1), background-color 220ms ease;
        }
        .br-tile-icon { transition: transform 420ms cubic-bezier(.34, 1.56, .64, 1); }
        @media (hover: hover) {
          .br-tile:hover .br-tile-box { background-color: #eaf0f4; transform: translateY(-3px); }
          .br-tile:hover .br-tile-icon { transform: scale(1.12) rotate(-4deg); }
        }

        /* ---------- KARTU PENGUMUMAN ---------- */
        .br-carousel { scroll-behavior: smooth; }
        .br-card {
          transform-origin: left center;
          transform: scale(.96);
          opacity: .78;
          transition: transform 560ms cubic-bezier(.22, 1, .36, 1), opacity 400ms ease;
        }
        .br-card.is-active { transform: scale(1); opacity: 1; }
        .br-card-arrow { transition: transform 300ms cubic-bezier(.34, 1.56, .64, 1); }
        @media (hover: hover) {
          .br-card:hover .br-card-arrow { transform: translate3d(2px, -2px, 0); }
        }

        @keyframes brShapes {
          from { opacity: 0; transform: translate3d(0, 34px, 0); }
          to { opacity: 1; transform: translate3d(0, 0, 0); }
        }
        @keyframes brSun {
          0% { opacity: 0; transform: scale(0) translate3d(0, 14px, 0); }
          100% { opacity: 1; transform: scale(1) translate3d(0, 0, 0); }
        }
        .br-shapes { animation: brShapes 760ms cubic-bezier(.22, 1, .36, 1) 420ms backwards; }
        .br-sun {
          transform-box: fill-box;
          transform-origin: center;
          animation: brSun 620ms cubic-bezier(.34, 1.56, .64, 1) 860ms backwards;
        }

        /* ---------- NAVIGASI BAWAH ---------- */
        @keyframes brNav {
          from { transform: translate3d(0, 100%, 0); }
          to { transform: translate3d(0, 0, 0); }
        }
        .br-nav { animation: brNav 600ms cubic-bezier(.22, 1, .36, 1) 160ms backwards; }

        @keyframes brFab {
          0% { opacity: 0; transform: scale(.3) translate3d(0, 16px, 0); }
          100% { opacity: 1; transform: scale(1) translate3d(0, 0, 0); }
        }
        .br-fab { animation: brFab 640ms cubic-bezier(.34, 1.56, .64, 1) 560ms backwards; }

        /* Riak satu kali di belakang tombol deposit */
        @keyframes brFabRing {
          0% { opacity: .7; transform: scale(1); }
          100% { opacity: 0; transform: scale(1.7); }
        }
        .br-fab-ring {
          opacity: 0;
          animation: brFabRing 1200ms cubic-bezier(.2, .7, .3, 1) 1100ms 1 forwards;
        }

        @keyframes brPill {
          from { opacity: 0; transform: scaleX(.4); }
          to { opacity: 1; transform: scaleX(1); }
        }
        .br-nav-pill { animation: brPill 520ms cubic-bezier(.34, 1.56, .64, 1) 520ms backwards; }

        /* ---------- ACCESSIBILITY: kurangi gerakan ---------- */
        @media (prefers-reduced-motion: reduce) {
          .br-rise, .br-header, .br-bar-icon, .br-tile, .br-shapes, .br-sun,
          .br-nav, .br-fab, .br-nav-pill { animation: none !important; }
          .br-fab-ring { display: none !important; }
          .br-press, .br-tile-box, .br-tile-icon, .br-card, .br-card-arrow {
            transition: none !important;
          }
          .br-carousel { scroll-behavior: auto !important; }
          .br-press:active { transform: none !important; }
          .br-card { transform: none !important; opacity: 1 !important; }
        }
      `}</style>
    </main>
  );
}
