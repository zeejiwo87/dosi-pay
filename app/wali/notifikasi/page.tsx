"use client";

import Link from "next/link";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
} from "react";
import { Plus_Jakarta_Sans } from "next/font/google";

import {
  Bell,
  CheckCheck,
  ChevronRight,
  Gauge,
  GraduationCap,
  Megaphone,
  ShoppingBag,
  Wallet,
  type LucideIcon,
} from "lucide-react";

// ==========================================
// DOSI PAY — NOTIFIKASI WALI SANTRI
// ==========================================

// Font mengikuti beranda. Tidak mau pakai Google Font?
// Hapus import + konstanta `jakarta`, lalu ganti `jakarta.className` dengan "font-sans".
const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

// Ikon duotone: garis + isi tipis, sama seperti beranda
const DUO = { fill: "currentColor", fillOpacity: 0.16 } as const;

function cssVars(vars: Record<string, string | number>): CSSProperties {
  return vars as unknown as CSSProperties;
}
const rise = (index: number) => cssVars({ "--i": Math.min(index, 9) });

// ==========================================
// KONSTANTA
// ==========================================

const STUDENT = "Ahmad Fauzan";
const SPP_TOTAL = 1_200_000;

// Kunci localStorage yang sama dengan halaman Deposit dan SPP,
// jadi deposit atau cicilan yang baru dibuat otomatis muncul di sini.
const SPP_KEY = "dosi_demo_spp_spp-demo-001";
const DEPOSIT_KEY = "dosi_demo_deposit_history";
const READ_KEY = "dosi_wali_notif_read_v1";

const BANK_NAMES: Record<string, string> = {
  bri: "BRI",
  bca: "BCA",
  mandiri: "Mandiri",
  bni: "BNI",
  bsi: "BSI",
  cimb: "CIMB Niaga",
  permata: "PermataBank",
  btn: "BTN",
  danamon: "Danamon",
  ocbc: "OCBC",
  maybank: "Maybank",
  mega: "Bank Mega",
  bjb: "Bank BJB",
  jago: "Bank Jago",
  seabank: "SeaBank",
};

// ==========================================
// TIPE & META
// ==========================================

type Kind = "deposit" | "belanja" | "limit" | "spp" | "pengumuman";
type Filter = "semua" | "belum" | "transaksi" | "tagihan" | "info";

type Notif = {
  id: string;
  kind: Kind;
  title: string;
  body: string;
  at: number;
  amount?: { value: number; plus: boolean };
  details: [string, string][];
  action: { label: string; href: string };
  defaultRead?: boolean;
};

const KIND_META: Record<
  Kind,
  { icon: LucideIcon; tint: string; ink: string }
> = {
  deposit: { icon: Wallet, tint: "#E7F6ED", ink: "#0E7A45" },
  belanja: { icon: ShoppingBag, tint: "#EDF1F5", ink: "#3F4D5E" },
  limit: { icon: Gauge, tint: "#FFF2DD", ink: "#A8650A" },
  spp: { icon: GraduationCap, tint: "#E6EFF5", ink: "#274B60" },
  pengumuman: { icon: Megaphone, tint: "#E4EFEC", ink: "#063F3C" },
};

const TABS: { id: Filter; label: string }[] = [
  { id: "semua", label: "Semua" },
  { id: "belum", label: "Belum dibaca" },
  { id: "transaksi", label: "Transaksi" },
  { id: "tagihan", label: "Tagihan" },
  { id: "info", label: "Info" },
];

// ==========================================
// HELPER
// ==========================================

const TZ = "Asia/Jakarta";

const dayKeyFmt = new Intl.DateTimeFormat("en-CA", {
  timeZone: TZ,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});
const clockFmt = new Intl.DateTimeFormat("id-ID", {
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
  timeZone: TZ,
});
const dateFmt = new Intl.DateTimeFormat("id-ID", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: TZ,
});
const dayNameFmt = new Intl.DateTimeFormat("id-ID", {
  weekday: "long",
  day: "numeric",
  month: "long",
  timeZone: TZ,
});

function rupiah(value: number) {
  return `Rp${value.toLocaleString("id-ID")}`;
}

function dayIndex(ms: number) {
  const [y, m, d] = dayKeyFmt.format(ms).split("-").map(Number);
  return Math.floor(Date.UTC(y, m - 1, d) / 86_400_000);
}

function fullDate(ms: number) {
  return `${dateFmt.format(ms)}, ${clockFmt.format(ms)} WIB`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function readList(key: string): unknown[] {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function loadRead(): Set<string> {
  return new Set(
    readList(READ_KEY).filter((id): id is string => typeof id === "string")
  );
}

// ==========================================
// DATA
// ==========================================

const MIN = 60_000;
const HOUR = 3_600_000;
const DAY = 86_400_000;

// Notifikasi contoh. Waktunya dihitung dari sekarang supaya
// pengelompokan hari tetap masuk akal. Ganti dengan data backend nanti.
function buildDemo(now: number, sppPaid: number): Notif[] {
  const list: Notif[] = [
    {
      id: "demo-limit-80",
      kind: "limit",
      title: "Limit jajan hampir habis",
      body: `${STUDENT} sudah memakai Rp20.000 dari limit harian Rp25.000.`,
      at: now - 41 * MIN,
      details: [
        ["Terpakai hari ini", "Rp20.000"],
        ["Limit harian", "Rp25.000"],
        ["Sisa limit", "Rp5.000"],
      ],
      action: { label: "Atur limit", href: "/wali/aktivitas" },
    },
    {
      id: "demo-kantin-jajan",
      kind: "belanja",
      title: "Belanja di Kantin",
      body: `${STUDENT} membayar Rp8.000 untuk jajan dan minuman.`,
      at: now - 44 * MIN,
      amount: { value: 8000, plus: false },
      details: [
        ["Tempat", "Kantin"],
        ["Keperluan", "Jajan & Minuman"],
      ],
      action: { label: "Lihat pengeluaran", href: "/wali/pengeluaran" },
    },
    {
      id: "demo-kantin-makan",
      kind: "belanja",
      title: "Belanja di Kantin",
      body: `${STUDENT} membayar Rp12.000 untuk makan.`,
      at: now - 4.5 * HOUR,
      amount: { value: 12000, plus: false },
      details: [
        ["Tempat", "Kantin"],
        ["Keperluan", "Makan di Kantin"],
      ],
      action: { label: "Lihat pengeluaran", href: "/wali/pengeluaran" },
      defaultRead: true,
    },
    {
      id: "demo-koperasi-atk",
      kind: "belanja",
      title: "Belanja di Koperasi",
      body: `${STUDENT} membayar Rp15.000 untuk alat tulis.`,
      at: now - 29 * HOUR,
      amount: { value: 15000, plus: false },
      details: [
        ["Tempat", "Koperasi"],
        ["Keperluan", "Alat Tulis"],
      ],
      action: { label: "Lihat pengeluaran", href: "/wali/pengeluaran" },
      defaultRead: true,
    },
    {
      id: "demo-deposit-bri",
      kind: "deposit",
      title: "Deposit berhasil",
      body: `Rp100.000 dari BRI sudah masuk ke saldo ${STUDENT}.`,
      at: now - (2 * DAY + 3 * HOUR),
      amount: { value: 100000, plus: true },
      details: [
        ["Metode", "BRI"],
        ["Nominal deposit", "Rp100.000"],
        ["Biaya admin", "Rp5.000"],
        ["Total dibayar", "Rp105.000"],
      ],
      action: { label: "Lihat riwayat", href: "/wali/riwayat" },
      defaultRead: true,
    },
    {
      id: "demo-limit-update",
      kind: "limit",
      title: "Limit harian diperbarui",
      body: `Limit jajan ${STUDENT} sekarang Rp25.000 per hari.`,
      at: now - 4 * DAY,
      details: [
        ["Limit harian", "Rp25.000"],
        ["Diubah oleh", "Anda"],
      ],
      action: { label: "Atur limit", href: "/wali/aktivitas" },
      defaultRead: true,
    },
    {
      id: "demo-pengumuman-kunjungan",
      kind: "pengumuman",
      title: "Pengumuman baru",
      body: "Jadwal Kunjungan Wali Santri: kunjungan wali dilaksanakan pada 10 Oktober 2026.",
      at: now - 6 * DAY,
      details: [["Kategori", "Informasi Pesantren"]],
      action: { label: "Baca pengumuman", href: "/wali/pengumuman" },
      defaultRead: true,
    },
  ];

  const remaining = SPP_TOTAL - sppPaid;

  if (remaining > 0) {
    list.push({
      id: "demo-spp-reminder",
      kind: "spp",
      title: "SPP belum lunas",
      body: `Sisa tagihan SPP 2026/2027 ${rupiah(remaining)}. Anda bisa mencicil dengan nominal berapa pun.`,
      at: now - 26 * HOUR,
      details: [
        ["Total tagihan", rupiah(SPP_TOTAL)],
        ["Sudah dibayar", rupiah(sppPaid)],
        ["Sisa tagihan", rupiah(remaining)],
      ],
      action: { label: "Bayar cicilan", href: "/wali/spp" },
    });
  }

  return list;
}

// Notifikasi dari aktivitas nyata di browser ini (deposit dan cicilan SPP).
function buildDynamic(): { items: Notif[]; sppPaid: number } {
  const items: Notif[] = [];

  // --- Cicilan SPP ---
  const payments = readList(SPP_KEY)
    .filter(isRecord)
    .filter(
      (p) =>
        typeof p.id === "string" &&
        typeof p.amount === "number" &&
        Number.isSafeInteger(p.amount) &&
        p.amount > 0 &&
        typeof p.bankId === "string" &&
        typeof p.createdAt === "string" &&
        Number.isFinite(Date.parse(p.createdAt))
    )
    .sort(
      (a, b) =>
        Date.parse(a.createdAt as string) - Date.parse(b.createdAt as string)
    );

  let paid = 0;

  for (const p of payments) {
    const amount = p.amount as number;
    if (paid + amount > SPP_TOTAL) continue;

    paid += amount;

    const left = SPP_TOTAL - paid;
    const bank = BANK_NAMES[p.bankId as string] ?? "bank";

    items.push({
      id: `spp-${p.id as string}`,
      kind: "spp",
      title: left === 0 ? "SPP lunas" : "Cicilan SPP tercatat",
      body:
        left === 0
          ? `Tagihan SPP 2026/2027 ${STUDENT} sudah lunas.`
          : `Cicilan ${rupiah(amount)} lewat ${bank} sudah dicatat. Sisa tagihan ${rupiah(left)}.`,
      at: Date.parse(p.createdAt as string),
      amount: { value: amount, plus: false },
      details: [
        ["Bank", bank],
        ["Nominal cicilan", rupiah(amount)],
        ["Sisa tagihan", rupiah(left)],
      ],
      action: {
        label: left === 0 ? "Lihat tagihan" : "Lihat cicilan",
        href: "/wali/spp",
      },
    });
  }

  // --- Deposit ---
  const seen = new Set<string>();

  for (const d of readList(DEPOSIT_KEY).filter(isRecord).slice(0, 30)) {
    const value = d.depositAmount;
    const created = d.createdAt;

    if (typeof value !== "number" || !(value > 0)) continue;
    if (typeof created !== "string" || seen.has(created)) continue;

    const at = Date.parse(created);
    if (!Number.isFinite(at)) continue;

    seen.add(created);

    const bank = typeof d.bankName === "string" ? d.bankName : "bank";
    const details: [string, string][] = [
      ["Metode", bank],
      ["Nominal deposit", rupiah(value)],
    ];

    if (typeof d.adminFee === "number") {
      details.push(["Biaya admin", rupiah(d.adminFee)]);
    }
    if (typeof d.totalPayment === "number") {
      details.push(["Total dibayar", rupiah(d.totalPayment)]);
    }

    items.push({
      id: `deposit-${created}`,
      kind: "deposit",
      title: "Deposit berhasil",
      body: `${rupiah(value)} dari ${bank} sudah masuk ke saldo ${STUDENT}.`,
      at,
      amount: { value, plus: true },
      details,
      action: { label: "Lihat riwayat", href: "/wali/riwayat" },
    });
  }

  return { items, sppPaid: paid };
}

// ==========================================
// BARIS NOTIFIKASI
// ==========================================

function NotificationRow({
  n,
  unread,
  open,
  index,
  onToggle,
}: {
  n: Notif;
  unread: boolean;
  open: boolean;
  index: number;
  onToggle: () => void;
}) {
  const meta = KIND_META[n.kind];
  const Icon = meta.icon;
  const panelId = `nt-detail-${n.id}`;
  const rows: [string, string][] = [...n.details, ["Waktu", fullDate(n.at)]];

  return (
    <li
      className={`nt-rise relative transition-colors duration-700 ${
        unread ? "bg-[#F4FBF7]" : "bg-white"
      }`}
      style={rise(index)}
    >
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={onToggle}
        className="nt-press nt-focus flex w-full items-start gap-3 px-5 py-4 text-left"
      >
        <span
          className="flex h-[44px] w-[44px] shrink-0 items-center justify-center rounded-[14px]"
          style={{ background: meta.tint, color: meta.ink }}
        >
          <Icon size={21} strokeWidth={1.8} aria-hidden="true" {...DUO} />
        </span>

        <span className="min-w-0 flex-1">
          <span
            className={`block text-[14px] leading-[19px] tracking-[-0.15px] ${
              unread ? "font-bold" : "font-semibold"
            }`}
          >
            {unread && <span className="sr-only">Belum dibaca. </span>}
            {n.title}
          </span>
          <span className="mt-[3px] block text-[12.5px] leading-[18px] text-[#5B6775]">
            {n.body}
          </span>
        </span>

        <span className="flex shrink-0 flex-col items-end">
          <span className="flex items-center gap-[6px]">
            <span
              aria-hidden="true"
              className="nt-dot h-[7px] w-[7px] rounded-full bg-[#4CD080]"
              style={{ transform: unread ? "scale(1)" : "scale(0)" }}
            />
            <span className="text-[11.5px] font-medium tabular-nums text-[#6B7785]">
              {clockFmt.format(n.at)}
            </span>
          </span>

          {n.amount && (
            <span
              className={`mt-[6px] text-[13px] font-bold tabular-nums ${
                n.amount.plus ? "text-[#0E7A45]" : "text-[#0F1B14]"
              }`}
            >
              {n.amount.plus ? "+" : "−"}
              {rupiah(n.amount.value)}
            </span>
          )}
        </span>
      </button>

      <div id={panelId} className="nt-detail" data-open={open}>
        <div className="nt-detail-inner">
          <div className="pb-4 pl-[76px] pr-5">
            <dl className="rounded-[14px] bg-[#F6F8F9] px-[14px] py-[3px]">
              {rows.map(([label, value], i) => (
                <div
                  key={label}
                  className={`flex items-baseline justify-between gap-4 py-[9px] ${
                    i > 0 ? "border-t border-[#E8EDF1]" : ""
                  }`}
                >
                  <dt className="text-[12px] text-[#6B7785]">{label}</dt>
                  <dd className="text-right text-[12.5px] font-semibold">
                    {value}
                  </dd>
                </div>
              ))}
            </dl>

            <Link
              href={n.action.href}
              className="nt-tap nt-focus mt-3 inline-flex h-[40px] items-center gap-[2px] rounded-[12px] bg-[#105D38] pl-4 pr-3 text-[12.5px] font-semibold text-white hover:bg-[#0C4D2F]"
            >
              {n.action.label}
              <ChevronRight size={16} strokeWidth={2.2} aria-hidden="true" />
            </Link>
          </div>
        </div>
      </div>

      <span
        aria-hidden="true"
        className="nt-sep absolute bottom-0 left-[76px] right-0 h-px bg-[#EEF2F5]"
      />
    </li>
  );
}

// ==========================================
// HALAMAN
// ==========================================

export default function NotifikasiWaliPage() {
  const [now, setNow] = useState<number | null>(null);
  const [dynamicItems, setDynamicItems] = useState<Notif[]>([]);
  const [sppPaid, setSppPaid] = useState(0);
  const [readIds, setReadIds] = useState<Set<string>>(new Set());

  const [filter, setFilter] = useState<Filter>("semua");
  // Daftar "belum dibaca" dibekukan saat tab dibuka,
  // supaya baris tidak hilang begitu selesai dibaca.
  const [frozen, setFrozen] = useState<Set<string> | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);

  const [scrolled, setScrolled] = useState(false);
  const [indicator, setIndicator] = useState<{
    x: number;
    w: number;
    show: boolean;
  }>({ x: 0, w: 0, show: false });

  const tabRefs = useRef<Partial<Record<Filter, HTMLButtonElement | null>>>({});
  const tabListRef = useRef<HTMLDivElement>(null);

  // ---------- Muat data ----------
  useEffect(() => {
    const dynamic = buildDynamic();
    setDynamicItems(dynamic.items);
    setSppPaid(dynamic.sppPaid);
    setReadIds(loadRead());
    setNow(Date.now());
  }, []);

  useEffect(() => {
    if (now === null) return;
    try {
      localStorage.setItem(
        READ_KEY,
        JSON.stringify([...readIds].slice(-300))
      );
    } catch {
      // Penyimpanan penuh atau diblokir: status baca hanya berlaku di sesi ini.
    }
  }, [readIds, now]);

  // Garis tipis di bawah header muncul saat halaman digulir
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 4);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // ---------- Turunan data ----------
  const items = useMemo(
    () =>
      now === null
        ? []
        : [...buildDemo(now, sppPaid), ...dynamicItems].sort(
            (a, b) => b.at - a.at
          ),
    [now, sppPaid, dynamicItems]
  );

  const isRead = useCallback(
    (n: Notif) => n.defaultRead === true || readIds.has(n.id),
    [readIds]
  );

  const unreadCount = items.filter((n) => !isRead(n)).length;

  const visible = useMemo(() => {
    return items.filter((n) => {
      switch (filter) {
        case "belum":
          return frozen ? frozen.has(n.id) : !isRead(n);
        case "transaksi":
          return n.kind === "deposit" || n.kind === "belanja";
        case "tagihan":
          return n.kind === "spp";
        case "info":
          return n.kind === "limit" || n.kind === "pengumuman";
        default:
          return true;
      }
    });
  }, [items, filter, frozen, isRead]);

  const groups = useMemo(() => {
    if (now === null) return [];

    const today = dayIndex(now);
    const map = new Map<number, { label: string; items: Notif[] }>();

    for (const n of visible) {
      const idx = dayIndex(n.at);
      let group = map.get(idx);

      if (!group) {
        const diff = today - idx;
        group = {
          label:
            diff <= 0
              ? "Hari ini"
              : diff === 1
                ? "Kemarin"
                : dayNameFmt.format(n.at),
          items: [],
        };
        map.set(idx, group);
      }

      group.items.push(n);
    }

    return [...map.values()];
  }, [visible, now]);

  // ---------- Indikator tab ----------
  const measure = useCallback(() => {
    const el = tabRefs.current[filter];
    if (!el) return;
    setIndicator({ x: el.offsetLeft, w: el.offsetWidth, show: true });
  }, [filter]);

  useEffect(() => {
    measure();

    const list = tabListRef.current;
    if (!list || typeof ResizeObserver === "undefined") return undefined;

    const observer = new ResizeObserver(measure);
    observer.observe(list);
    Object.values(tabRefs.current).forEach((el) => {
      if (el) observer.observe(el);
    });

    if (document.fonts?.ready) {
      document.fonts.ready.then(measure).catch(() => undefined);
    }

    return () => observer.disconnect();
  }, [measure, unreadCount > 0]);

  // ---------- Aksi ----------
  function markRead(ids: string[]) {
    setReadIds((prev) => {
      const next = new Set(prev);
      ids.forEach((id) => next.add(id));
      return next;
    });
  }

  function markAllRead() {
    markRead(items.map((n) => n.id));
  }

  function changeFilter(next: Filter) {
    if (next === filter) return;

    setOpenId(null);
    setFrozen(
      next === "belum"
        ? new Set(items.filter((n) => !isRead(n)).map((n) => n.id))
        : null
    );
    setFilter(next);

    const reduce = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    tabRefs.current[next]?.scrollIntoView({
      inline: "center",
      block: "nearest",
      behavior: reduce ? "auto" : "smooth",
    });
  }

  function toggle(n: Notif) {
    const opening = openId !== n.id;
    setOpenId(opening ? n.id : null);
    if (opening && !isRead(n)) markRead([n.id]);
  }

  function onTabKey(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;

    event.preventDefault();

    const current = TABS.findIndex((tab) => tab.id === filter);
    const step = event.key === "ArrowRight" ? 1 : -1;
    const next = TABS[(current + step + TABS.length) % TABS.length];

    changeFilter(next.id);
    tabRefs.current[next.id]?.focus();
  }

  // ---------- Tampilan ----------
  let rowCounter = 0;
  const EmptyIcon = filter === "belum" ? CheckCheck : Bell;

  return (
    <main
      className={`${jakarta.className} min-h-[100dvh] w-full bg-[#F1F4F6] text-[#0F1B14] antialiased`}
    >
      <div className="mx-auto min-h-[100dvh] w-full max-w-[430px] bg-white sm:shadow-[0_0_0_1px_#E8EDF1]">
        {/* ==================================
            STICKY HEADER
        ================================== */}

        <header
          className={`sticky top-0 z-40 bg-white pt-[env(safe-area-inset-top)] transition-shadow duration-300 ${
            scrolled
              ? "shadow-[0_10px_16px_-14px_rgba(15,27,20,0.22)]"
              : "shadow-none"
          }`}
        >
          <div className="flex h-[68px] items-center justify-between px-5">
            <div className="flex items-center gap-[10px]">
              <h1 className="text-[21px] font-extrabold leading-none tracking-[-0.6px]">
                Notifikasi
              </h1>

              {unreadCount > 0 && (
                <span
                  key={unreadCount}
                  className="nt-pop rounded-full bg-[#E7F6ED] px-[9px] py-[4px] text-[11.5px] font-bold leading-none text-[#0E7A45]"
                >
                  {unreadCount} baru
                </span>
              )}
            </div>

            <button
              type="button"
              onClick={markAllRead}
              disabled={unreadCount === 0}
              aria-label="Tandai semua sudah dibaca"
              title="Tandai semua sudah dibaca"
              className="nt-tap nt-focus flex h-[44px] w-[44px] items-center justify-center rounded-[16px] border border-[#E8EDF1] bg-white text-[#0F1B14] hover:bg-[#F4F7F9] disabled:cursor-not-allowed disabled:text-[#B4BCC7] disabled:hover:bg-white"
            >
              <CheckCheck size={20} strokeWidth={1.8} aria-hidden="true" />
            </button>
          </div>

          <div className="border-b border-[#E8EDF1]">
            <div
              ref={tabListRef}
              role="tablist"
              aria-label="Filter notifikasi"
              onKeyDown={onTabKey}
              className="relative flex gap-6 overflow-x-auto px-5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            >
              {TABS.map((tab) => {
                const selected = tab.id === filter;

                return (
                  <button
                    key={tab.id}
                    ref={(el) => {
                      tabRefs.current[tab.id] = el;
                    }}
                    type="button"
                    role="tab"
                    aria-selected={selected}
                    aria-controls="nt-panel"
                    tabIndex={selected ? 0 : -1}
                    onClick={() => changeFilter(tab.id)}
                    className={`nt-tab nt-focus flex h-[46px] shrink-0 items-center gap-[6px] whitespace-nowrap text-[13px] font-semibold ${
                      selected ? "text-[#0F1B14]" : "text-[#6B7785]"
                    }`}
                  >
                    {tab.label}

                    {tab.id === "belum" && unreadCount > 0 && (
                      <span className="rounded-full bg-[#105D38] px-[6px] py-[2px] text-[10.5px] font-bold leading-none text-white">
                        {unreadCount}
                      </span>
                    )}
                  </button>
                );
              })}

              {indicator.show && (
                <span
                  aria-hidden="true"
                  className="nt-indicator pointer-events-none absolute bottom-0 left-0 h-[3px] rounded-t-full bg-[#105D38]"
                  style={{
                    width: indicator.w,
                    transform: `translate3d(${indicator.x}px, 0, 0)`,
                  }}
                />
              )}
            </div>
          </div>
        </header>

        {/* ==================================
            DAFTAR
        ================================== */}

        <div id="nt-panel" role="tabpanel" className="pb-8">
          {now === null ? (
            <div aria-hidden="true" className="px-5 pt-6">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="flex animate-pulse gap-3 py-4">
                  <span className="h-[44px] w-[44px] shrink-0 rounded-[14px] bg-[#EEF2F5]" />
                  <span className="flex-1">
                    <span className="block h-[12px] w-[55%] rounded-full bg-[#EEF2F5]" />
                    <span className="mt-[10px] block h-[10px] w-[85%] rounded-full bg-[#F3F6F8]" />
                  </span>
                </div>
              ))}
            </div>
          ) : visible.length === 0 ? (
            <div className="nt-pop flex flex-col items-center px-8 pt-[72px] text-center">
              <span className="flex h-[56px] w-[56px] items-center justify-center rounded-[18px] bg-[#EAF3ED] text-[#105D38]">
                {filter === "belum" ? (
                  <EmptyIcon size={26} strokeWidth={1.7} aria-hidden="true" />
                ) : (
                  <EmptyIcon
                    size={26}
                    strokeWidth={1.7}
                    aria-hidden="true"
                    {...DUO}
                  />
                )}
              </span>

              <h2 className="mt-4 text-[15px] font-bold">
                {filter === "belum"
                  ? "Semua sudah dibaca"
                  : "Belum ada notifikasi"}
              </h2>

              <p className="mt-1 max-w-[260px] text-[12.5px] leading-[19px] text-[#5B6775]">
                {filter === "belum"
                  ? "Notifikasi baru akan muncul di sini."
                  : "Belum ada notifikasi di kategori ini."}
              </p>
            </div>
          ) : (
            <div key={filter}>
              {groups.map((group) => (
                <section key={group.label} aria-label={group.label}>
                  <h2 className="px-5 pb-2 pt-5 text-[12.5px] font-semibold text-[#6B7785]">
                    {group.label}
                  </h2>

                  <ul className="nt-list">
                    {group.items.map((n) => (
                      <NotificationRow
                        key={n.id}
                        n={n}
                        unread={!isRead(n)}
                        open={openId === n.id}
                        index={rowCounter++}
                        onToggle={() => toggle(n)}
                      />
                    ))}
                  </ul>
                </section>
              ))}
            </div>
          )}

          {now !== null && visible.length > 0 && (
            <p className="mx-auto mt-8 max-w-[300px] px-5 text-center text-[11.5px] leading-[18px] text-[#6B7785]">
              Sebagian notifikasi masih contoh. Pesan asli akan mengikuti
              data backend DOSI Pay.
            </p>
          )}
        </div>
      </div>

      <style jsx global>{`
        /* Baris masuk bertahap, hanya saat daftar dibuka atau filter berganti */
        @keyframes ntRise {
          from {
            opacity: 0;
            transform: translate3d(0, 8px, 0);
          }
          to {
            opacity: 1;
            transform: translate3d(0, 0, 0);
          }
        }
        .nt-rise {
          animation: ntRise 420ms cubic-bezier(0.22, 1, 0.36, 1) both;
          animation-delay: calc(var(--i, 0) * 38ms + 40ms);
        }

        /* Detail terbuka mengikuti tinggi isinya */
        .nt-detail {
          display: grid;
          grid-template-rows: 0fr;
          transition: grid-template-rows 360ms cubic-bezier(0.22, 1, 0.36, 1);
        }
        .nt-detail[data-open="true"] {
          grid-template-rows: 1fr;
        }
        .nt-detail-inner {
          min-height: 0;
          overflow: hidden;
        }
        /* Detail yang tertutup tidak ikut urutan tab */
        .nt-detail[data-open="false"] .nt-detail-inner {
          visibility: hidden;
          transition: visibility 0s linear 360ms;
        }

        .nt-dot {
          transition: transform 320ms cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        .nt-indicator {
          transition:
            transform 380ms cubic-bezier(0.22, 1, 0.36, 1),
            width 380ms cubic-bezier(0.22, 1, 0.36, 1);
        }

        .nt-tab {
          transition: color 200ms ease;
        }

        /* Jumlah baru dan keadaan kosong */
        @keyframes ntPop {
          from {
            opacity: 0;
            transform: scale(0.85);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        .nt-pop {
          animation: ntPop 320ms cubic-bezier(0.22, 1, 0.36, 1) both;
        }

        /* Sentuhan */
        .nt-press {
          -webkit-tap-highlight-color: transparent;
          transition: background-color 160ms ease;
        }
        .nt-press:active {
          background-color: rgba(15, 27, 20, 0.045);
        }
        @media (hover: hover) {
          .nt-press:hover {
            background-color: rgba(15, 27, 20, 0.025);
          }
        }

        .nt-tap {
          -webkit-tap-highlight-color: transparent;
          transition:
            transform 170ms ease,
            background-color 170ms ease,
            color 170ms ease;
        }
        .nt-tap:active:not(:disabled) {
          transform: scale(0.96);
        }

        .nt-focus:focus-visible {
          outline: 2px solid #4cd080;
          outline-offset: -2px;
          border-radius: 12px;
        }

        .nt-list > li:last-child > .nt-sep {
          display: none;
        }

        @media (prefers-reduced-motion: reduce) {
          .nt-rise,
          .nt-pop {
            animation: none !important;
          }

          .nt-detail,
          .nt-detail-inner,
          .nt-dot,
          .nt-indicator,
          .nt-tab,
          .nt-press,
          .nt-tap {
            transition: none !important;
          }
        }
      `}</style>
    </main>
  );
}
