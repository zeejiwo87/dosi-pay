"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import Link from "next/link";

import {

  ArrowLeft,

  ArrowDownLeft,

  ArrowUpRight,

  CalendarDays,

  Check,

  ChevronDown,

  ChevronRight,

  Coffee,

  Info,

  MoreHorizontal,

  Settings2,

  ShoppingBag,

  Store,

  UtensilsCrossed,

  X,

  type LucideIcon,

} from "lucide-react";

// ==========================================

// DOSI PAY — PENGELUARAN SANTRI

// ==========================================

const HISTORY_KEY = "dosi_demo_deposit_history";

const RECEIPT_KEY = "dosi_demo_deposit_receipt";

const COLORS = {

  darkGreen: "#105D38",

  green: "#4CD080",

  orange: "#FFAE58",

};

type Period = "today" | "week" | "month";

type Category = "Kantin" | "Koperasi" | "Lainnya";

type Expense = {

  id: string;

  title: string;

  category: Category;

  amount: number;

  date: Date;

};

type Deposit = {

  amount: number;

  date: Date;

};

const CATEGORY_INFO: Record<

  Category,

  {

    color: string;

    background: string;

    icon: LucideIcon;

  }

> = {

  Kantin: {

    color: "#105D38",

    background: "#E8F4EC",

    icon: UtensilsCrossed,

  },

  Koperasi: {

    color: "#37B875",

    background: "#EAF8EF",

    icon: Store,

  },

  Lainnya: {

    color: "#E29A40",

    background: "#FFF3E4",

    icon: MoreHorizontal,

  },

};

// ==========================================

// FORMATTERS

// ==========================================

function rupiah(value: number) {

  return `Rp${value.toLocaleString("id-ID")}`;

}

function compactRupiah(value: number) {

  if (value === 0) return "0";

  if (value >= 1000000) {

    return `${(value / 1000000)

      .toLocaleString("id-ID", {

        maximumFractionDigits: 1,

      })}jt`;

  }

  if (value >= 1000) {

    return `${Math.round(value / 1000)}rb`;

  }

  return String(value);

}

function shortDate(date: Date) {

  return new Intl.DateTimeFormat("id-ID", {

    day: "numeric",

    month: "short",

  }).format(date);

}

function transactionDate(date: Date) {

  return new Intl.DateTimeFormat("id-ID", {

    day: "numeric",

    month: "short",

    hour: "2-digit",

    minute: "2-digit",

    hour12: false,

  }).format(date);

}

// ==========================================

// DATE PERIOD HELPERS

// ==========================================

function getPeriodRange(period: Period, now: Date) {

  const start = new Date(

    now.getFullYear(),

    now.getMonth(),

    now.getDate()

  );

  if (period === "today") {

    const end = new Date(start);

    end.setDate(end.getDate() + 1);

    return {

      start,

      end,

      label: new Intl.DateTimeFormat("id-ID", {

        day: "numeric",

        month: "long",

        year: "numeric",

      }).format(start),

    };

  }

  if (period === "week") {

    const weekday = (start.getDay() + 6) % 7;

    start.setDate(start.getDate() - weekday);

    const end = new Date(start);

    end.setDate(end.getDate() + 7);

    const lastDay = new Date(end);

    lastDay.setDate(lastDay.getDate() - 1);

    return {

      start,

      end,

      label: `${shortDate(start)} – ${shortDate(

        lastDay

      )} ${lastDay.getFullYear()}`,

    };

  }

  const monthStart = new Date(

    now.getFullYear(),

    now.getMonth(),

    1

  );

  const nextMonth = new Date(

    now.getFullYear(),

    now.getMonth() + 1,

    1

  );

  return {

    start: monthStart,

    end: nextMonth,

    label: new Intl.DateTimeFormat("id-ID", {

      month: "long",

      year: "numeric",

    }).format(monthStart),

  };

}

function isWithinRange(

  date: Date,

  start: Date,

  end: Date

) {

  return date >= start && date < end;

}

// ==========================================

// CONTOH PENGELUARAN SANTRI

// ==========================================

// Data ini hanya untuk DEMO.

// Nantinya diganti dengan transaksi asli

// dari database DOSI Pay.

const EXPENSE_TEMPLATES: {

  title: string;

  category: Category;

  amount: number;

  daysAgo: number;

  hour: number;

}[] = [

  {

    title: "Makan di Kantin",

    category: "Kantin",

    amount: 12000,

    daysAgo: 0,

    hour: 9,

  },

  {

    title: "Jajan & Minuman",

    category: "Kantin",

    amount: 8000,

    daysAgo: 0,

    hour: 13,

  },

  {

    title: "Alat Tulis",

    category: "Koperasi",

    amount: 15000,

    daysAgo: 1,

    hour: 10,

  },

  {

    title: "Makan di Kantin",

    category: "Kantin",

    amount: 13000,

    daysAgo: 2,

    hour: 12,

  },

  {

    title: "Sabun & Perlengkapan",

    category: "Koperasi",

    amount: 18000,

    daysAgo: 3,

    hour: 15,

  },

  {

    title: "Laundry Santri",

    category: "Lainnya",

    amount: 20000,

    daysAgo: 4,

    hour: 14,

  },

  {

    title: "Jajan Kantin",

    category: "Kantin",

    amount: 10000,

    daysAgo: 5,

    hour: 10,

  },

  {

    title: "Buku Tulis",

    category: "Koperasi",

    amount: 17000,

    daysAgo: 6,

    hour: 9,

  },

  {

    title: "Makan di Kantin",

    category: "Kantin",

    amount: 14000,

    daysAgo: 8,

    hour: 12,

  },

  {

    title: "Minuman Kantin",

    category: "Kantin",

    amount: 7000,

    daysAgo: 10,

    hour: 16,

  },

  {

    title: "Perlengkapan Mandi",

    category: "Koperasi",

    amount: 22000,

    daysAgo: 12,

    hour: 11,

  },

  {

    title: "Laundry Santri",

    category: "Lainnya",

    amount: 20000,

    daysAgo: 15,

    hour: 14,

  },

  {

    title: "Jajan Kantin",

    category: "Kantin",

    amount: 12000,

    daysAgo: 17,

    hour: 10,

  },

  {

    title: "Alat Tulis",

    category: "Koperasi",

    amount: 16000,

    daysAgo: 19,

    hour: 13,

  },

  {

    title: "Makan di Kantin",

    category: "Kantin",

    amount: 15000,

    daysAgo: 22,

    hour: 12,

  },

  {

    title: "Kebutuhan Harian",

    category: "Lainnya",

    amount: 25000,

    daysAgo: 26,

    hour: 11,

  },

  {

    title: "Belanja Koperasi",

    category: "Koperasi",

    amount: 19000,

    daysAgo: 28,

    hour: 10,

  },

];

function createDemoExpenses(now: Date): Expense[] {

  const todayStart = new Date(

    now.getFullYear(),

    now.getMonth(),

    now.getDate()

  );

  return EXPENSE_TEMPLATES.map((item, index) => {

    const date = new Date(todayStart);

    date.setDate(date.getDate() - item.daysAgo);

    date.setHours(item.hour, 15, 0, 0);

    // Contoh transaksi hari ini tidak boleh

    // memiliki waktu lebih baru daripada saat ini.

    if (date.getTime() > now.getTime()) {

      date.setTime(now.getTime() - 60000 * (index + 1));

    }

    return {

      id: `demo-expense-${index}`,

      title: item.title,

      category: item.category,

      amount: item.amount,

      date,

    };

  }).sort(

    (a, b) => b.date.getTime() - a.date.getTime()

  );

}

// ==========================================

// MEMBACA RIWAYAT DEPOSIT DEMO

// ==========================================

function readDemoDeposits(): Deposit[] {

  const deposits: Deposit[] = [];

  function addRecord(value: unknown) {

    if (

      typeof value !== "object" ||

      value === null

    ) {

      return;

    }

    const item = value as Record<string, unknown>;

    if (

      item.isDemo !== true ||

      typeof item.depositAmount !== "number" ||

      !Number.isFinite(item.depositAmount) ||

      item.depositAmount < 20000 ||

      typeof item.createdAt !== "string"

    ) {

      return;

    }

    const date = new Date(item.createdAt);

    if (Number.isNaN(date.getTime())) {

      return;

    }

    deposits.push({

      amount: item.depositAmount,

      date,

    });

  }

  try {

    const historyRaw = localStorage.getItem(

      HISTORY_KEY

    );

    if (historyRaw) {

      const parsed: unknown = JSON.parse(historyRaw);

      if (Array.isArray(parsed)) {

        parsed.forEach(addRecord);

      }

    }

  } catch {

    // Tetap gunakan data lainnya.

  }

  try {

    const latestRaw = sessionStorage.getItem(

      RECEIPT_KEY

    );

    if (latestRaw) {

      const latest: unknown = JSON.parse(latestRaw);

      // Hindari menghitung deposit terakhir

      // dua kali jika sudah ada di localStorage.

      if (

        typeof latest === "object" &&

        latest !== null &&

        "createdAt" in latest &&

        "depositAmount" in latest

      ) {

        const item = latest as Record<string, unknown>;

        const existing = (() => {

          try {

            const raw = localStorage.getItem(

              HISTORY_KEY

            );

            const list: unknown = raw

              ? JSON.parse(raw)

              : [];

            return (

              Array.isArray(list) &&

              list.some(

                (entry) =>

                  typeof entry === "object" &&

                  entry !== null &&

                  entry.createdAt === item.createdAt &&

                  entry.depositAmount ===

                    item.depositAmount

              )

            );

          } catch {

            return false;

          }

        })();

        if (!existing) {

          addRecord(latest);

        }

      }

    }

  } catch {

    // Biarkan halaman tetap tampil.

  }

  return deposits;

}

// ==========================================

// CHART HELPERS

// ==========================================

type ChartBucket = {

  label: string;

  income: number;

  expense: number;

};

function makeBuckets(

  period: Period,

  start: Date,

  expenses: Expense[],

  deposits: Deposit[]

): ChartBucket[] {

  let labels: string[];

  if (period === "today") {

    labels = ["00–06", "06–12", "12–18", "18–24"];

  } else if (period === "week") {

    labels = [

      "Sen",

      "Sel",

      "Rab",

      "Kam",

      "Jum",

      "Sab",

      "Min",

    ];

  } else {

    labels = ["Minggu 1", "Minggu 2", "Minggu 3", "Minggu 4"];

  }

  const buckets = labels.map((label) => ({

    label,

    income: 0,

    expense: 0,

  }));

  function bucketIndex(date: Date) {

    if (period === "today") {

      return Math.min(

        3,

        Math.floor(date.getHours() / 6)

      );

    }

    if (period === "week") {

      return (date.getDay() + 6) % 7;

    }

    return Math.min(

      3,

      Math.floor((date.getDate() - 1) / 7)

    );

  }

  expenses.forEach((item) => {

    const index = bucketIndex(item.date);

    buckets[index].expense += item.amount;

  });

  deposits.forEach((item) => {

    const index = bucketIndex(item.date);

    buckets[index].income += item.amount;

  });

  return buckets;

}

function getChartMax(buckets: ChartBucket[]) {

  const highest = Math.max(

    0,

    ...buckets.map((item) =>

      Math.max(item.income, item.expense)

    )

  );

  if (highest === 0) return 30000;

  const roughStep = highest / 3;

  const magnitude = Math.pow(

    10,

    Math.floor(Math.log10(roughStep))

  );

  const normalized = roughStep / magnitude;

  const stepMultiplier =

    [1, 2, 5, 10].find(

      (value) => value >= normalized

    ) ?? 10;

  return 3 * stepMultiplier * magnitude;

}

// ==========================================
// MOTION UTILITIES — NO ANIMATION LIBRARY
// ==========================================

/** Reveal only when the element enters the viewport.
 * Changing the filter token resets the reveal safely. */
function useRevealOnChange<T extends HTMLElement>(token: string) {
  const ref = useRef<T | null>(null);
  const [state, setState] = useState({ token: "", visible: false });

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    setState({ token, visible: false });

    if (typeof IntersectionObserver === "undefined") {
      setState({ token, visible: true });
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setState({ token, visible: true });
          observer.disconnect();
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -20px 0px" }
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [token]);

  return [ref, state.token === token && state.visible] as const;
}

type AnimatedNumberProps = {
  value: number;
  period: Period;
  variant?: "rupiah" | "compact" | "percent";
};

/** Counts from zero without re-rendering the entire dashboard. */
function AnimatedNumber({
  value,
  period,
  variant = "rupiah",
}: AnimatedNumberProps) {
  const [ref, revealed] = useRevealOnChange<HTMLSpanElement>(period);
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (!revealed) {
      setDisplay(0);
      return;
    }

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setDisplay(value);
      return;
    }

    const duration = 950;
    let frame = 0;
    let startedAt: number | null = null;
    setDisplay(0);

    const step = (timestamp: number) => {
      if (startedAt === null) startedAt = timestamp;
      const t = Math.min(1, (timestamp - startedAt) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(Math.round(value * eased));

      if (t < 1) frame = requestAnimationFrame(step);
    };

    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [value, period, revealed]);

  const text =
    variant === "compact"
      ? compactRupiah(display)
      : variant === "percent"
        ? `${display}%`
        : rupiah(display);

  return (
    <span ref={ref} className="tabular-nums">
      {text}
    </span>
  );
}

// ==========================================

// PAGE

// ==========================================

export default function PengeluaranWaliPage() {

  const [period, setPeriod] =

    useState<Period>("month");

  const [barChartRef, barReady] = useRevealOnChange<HTMLDivElement>(period);
  const [donutChartRef, donutReady] = useRevealOnChange<HTMLDivElement>(period);

  const [now, setNow] =

    useState<Date | null>(null);

  const [expenses, setExpenses] =

    useState<Expense[]>([]);

  const [deposits, setDeposits] =

    useState<Deposit[]>([]);

  const [showAll, setShowAll] =

    useState(false);

  const [showInfo, setShowInfo] =

    useState(false);

  useEffect(() => {

    const current = new Date();

    setNow(current);

    setExpenses(createDemoExpenses(current));

    setDeposits(readDemoDeposits());

  }, []);

  const range = useMemo(() => {

    if (!now) return null;

    return getPeriodRange(period, now);

  }, [period, now]);

  const filteredExpenses = useMemo(() => {

    if (!range) return [];

    return expenses.filter((item) =>

      isWithinRange(

        item.date,

        range.start,

        range.end

      )

    );

  }, [expenses, range]);

  const filteredDeposits = useMemo(() => {

    if (!range) return [];

    return deposits.filter((item) =>

      isWithinRange(

        item.date,

        range.start,

        range.end

      )

    );

  }, [deposits, range]);

  const totalExpense = filteredExpenses.reduce(

    (sum, item) => sum + item.amount,

    0

  );

  const totalIncome = filteredDeposits.reduce(

    (sum, item) => sum + item.amount,

    0

  );

  const buckets = useMemo(() => {

    if (!range) return [];

    return makeBuckets(

      period,

      range.start,

      filteredExpenses,

      filteredDeposits

    );

  }, [

    period,

    range,

    filteredExpenses,

    filteredDeposits,

  ]);

  const chartMax = getChartMax(buckets);

  const categoryTotals = {

    Kantin: filteredExpenses

      .filter((item) => item.category === "Kantin")

      .reduce((sum, item) => sum + item.amount, 0),

    Koperasi: filteredExpenses

      .filter((item) => item.category === "Koperasi")

      .reduce((sum, item) => sum + item.amount, 0),

    Lainnya: filteredExpenses

      .filter((item) => item.category === "Lainnya")

      .reduce((sum, item) => sum + item.amount, 0),

  };

  const kantinPercent = totalExpense

    ? (categoryTotals.Kantin / totalExpense) * 100

    : 0;

  const koperasiPercent = totalExpense

    ? (categoryTotals.Koperasi / totalExpense) * 100

    : 0;

  const lainnyaPercent = totalExpense
    ? (categoryTotals.Lainnya / totalExpense) * 100
    : 0;

  const donutSegments = [
    { percent: kantinPercent, color: COLORS.darkGreen },
    { percent: koperasiPercent, color: COLORS.green },
    { percent: lainnyaPercent, color: COLORS.orange },
  ];

  const visibleExpenses = showAll

    ? filteredExpenses

    : filteredExpenses.slice(0, 5);

  function changePeriod(value: Period) {

    setPeriod(value);

    setShowAll(false);

  }

  return (

    <main className="min-h-screen min-h-[100dvh] bg-[#F3F5F3] font-sans text-[#111827]">

      <div className="mx-auto min-h-[100dvh] w-full max-w-[430px] bg-white">

{/* =====================================

    STICKY HEADER

===================================== */}

<header className="sticky top-0 z-40 border-b border-[#EDF1ED] bg-white px-[16px] pb-[9px] pt-[max(10px,env(safe-area-inset-top))] shadow-[0_2px_12px_rgba(0,0,0,0.035)]">

  <div className="flex h-[40px] items-center justify-between">

    {/* KEMBALI */}

    <Link

      href="/wali/beranda"

      aria-label="Kembali ke beranda"

      className="flex h-[35px] w-[35px] items-center justify-center rounded-[10px] border border-[#E5EBE6] text-[#17251D] transition-colors active:bg-[#F2F6F3]"

    >

      <ArrowLeft size={18} strokeWidth={1.8} />

    </Link>

    {/* JUDUL */}

    <h1 className="text-[15px] font-bold tracking-[-0.4px] text-[#17251D]">

      Pengeluaran Santri

    </h1>

    {/* INFORMASI */}

    <button

      type="button"

      onClick={() => setShowInfo(true)}

      aria-label="Informasi statistik"

      className="flex h-[35px] w-[35px] items-center justify-center rounded-[10px] border border-[#E5EBE6] text-[#17251D] transition-colors active:bg-[#F2F6F3]"

    >

      <Settings2 size={18} strokeWidth={1.8} />

    </button>

  </div>

</header>

        {/* =====================================

            FINANCIAL SUMMARY

        ===================================== */}

        <section

          className="mx-[18px] mt-[25px] grid grid-cols-2 divide-x divide-[#E9EDE9] rounded-[16px] border border-[#E9EDE9] bg-white px-[10px] py-[18px]"

          aria-label="Ringkasan keuangan"

        >

          {/* PEMASUKAN */}

          <div className="flex min-w-0 items-center gap-[9px] pr-[7px]">

            <span className="flex h-[37px] w-[37px] shrink-0 items-center justify-center rounded-full bg-[#4CD080] text-white">

              <ArrowDownLeft

                size={20}

                strokeWidth={2.3}

              />

            </span>

            <div className="min-w-0">

              <p className="break-words text-[14px] font-bold tracking-[-0.4px] text-[#111827] max-[360px]:text-[12px]">

                <AnimatedNumber value={totalIncome} period={period} />

              </p>

              <p className="mt-[3px] text-[10px] text-[#A0A8A1]">

                Deposit

              </p>

            </div>

          </div>

          {/* PENGELUARAN */}

          <div className="flex min-w-0 items-center gap-[9px] pl-[10px]">

            <span className="flex h-[37px] w-[37px] shrink-0 items-center justify-center rounded-full bg-[#FFAE58] text-white">

              <ArrowUpRight

                size={20}

                strokeWidth={2.3}

              />

            </span>

            <div className="min-w-0">

              <p className="break-words text-[14px] font-bold tracking-[-0.4px] text-[#111827] max-[360px]:text-[12px]">

                <AnimatedNumber value={totalExpense} period={period} />

              </p>

              <p className="mt-[3px] text-[10px] text-[#A0A8A1]">

                Pengeluaran

              </p>

            </div>

          </div>

        </section>

        {/* =====================================

            STATISTIK OVERVIEW

        ===================================== */}

        <section

          className="mt-[29px] px-[18px]"

          aria-labelledby="overview-title"

        >

          <div className="flex items-start justify-between gap-3">

            <div className="min-w-0 flex-1">

              <h2

                id="overview-title"

                className="text-[19px] font-bold tracking-[-0.6px] text-[#111827]"

              >

                Statistik Keuangan

              </h2>

              <p className="mt-[5px] text-[11px] leading-5 text-[#959DAD]">

                {range?.label ?? "Memuat periode..."}

              </p>

            </div>

            {/* PERIOD SELECT */}

            <div className="relative shrink-0">

              <label

                htmlFor="expense-period"

                className="sr-only"

              >

                Pilih periode statistik

              </label>

              <select

                id="expense-period"

                value={period}

                onChange={(event) =>

                  changePeriod(

                    event.target.value as Period

                  )

                }

                className="h-[34px] appearance-none rounded-full border-0 bg-[#F2F3F2] pl-[12px] pr-[31px] text-[11px] font-semibold text-[#1E2922] outline-none focus:ring-2 focus:ring-[#4CD080]"

              >

                <option value="today">

                  Hari Ini

                </option>

                <option value="week">

                  Minggu Ini

                </option>

                <option value="month">

                  Bulan Ini

                </option>

              </select>

              <ChevronDown

                size={14}

                strokeWidth={1.8}

                className="pointer-events-none absolute right-[10px] top-1/2 -translate-y-1/2 text-[#8F9A92]"

              />

            </div>

          </div>

          {/* =====================================

              BAR CHART

          ===================================== */}

          <div

            ref={barChartRef}
            className="mt-[23px]"

            role="img"

            aria-label={`Grafik deposit dan pengeluaran untuk ${

              period === "today"

                ? "hari ini"

                : period === "week"

                  ? "minggu ini"

                  : "bulan ini"

            }`}

          >

            {/* CHART PLOT */}

            <div className="flex gap-[9px]">

              {/* Y AXIS */}

              <div className="relative h-[168px] w-[37px] shrink-0">

                {[3, 2, 1, 0].map((level) => (

                  <span

                    key={level}

                    className="absolute right-0 -translate-y-1/2 whitespace-nowrap text-[10px] text-[#9CA5B2]"

                    style={{

                      top: `${

                        ((3 - level) / 3) * 100

                      }%`,

                    }}

                  >

                    {compactRupiah(

                      (chartMax / 3) * level

                    )}

                  </span>

                ))}

              </div>

              {/* BAR PLOT */}

              <div className="relative h-[168px] min-w-0 flex-1">

                {/* HORIZONTAL GRID */}

                {[0, 1, 2, 3].map((level) => (

                  <div

                    key={level}

                    className="pointer-events-none absolute left-0 right-0 border-t border-dashed border-[#DFE4E0]"

                    style={{

                      top: `${(level / 3) * 100}%`,

                    }}

                  />

                ))}

                {/* BARS */}

                <div className="absolute inset-0 flex items-end justify-around gap-[4px] px-[2px]">

                  {buckets.map((bucket, index) => {

                    const incomeHeight =

                      chartMax > 0

                        ? (bucket.income / chartMax) *

                          100

                        : 0;

                    const expenseHeight =

                      chartMax > 0

                        ? (bucket.expense / chartMax) *

                          100

                        : 0;

                    return (

                      <div

                        key={index}

                        className="flex h-full min-w-0 flex-1 items-end justify-center gap-[3px]"

                        title={`${bucket.label}: Deposit ${rupiah(

                          bucket.income

                        )}, Pengeluaran ${rupiah(

                          bucket.expense

                        )}`}

                      >

                        {/* DEPOSIT */}

                        <div

                          key={`${period}-${index}-deposit`}
                          className={`dosi-rise-bar w-full max-w-[15px] rounded-t-[5px] bg-[#4CD080] ${barReady && bucket.income > 0 ? "dosi-rise-bar-ready" : ""}`}

                          style={{
                            animationDelay: `${100 + index * 85}ms`,

                            height:

                              bucket.income > 0

                                ? `${Math.max(

                                    incomeHeight,

                                    2

                                  )}%`

                                : "0%",

                          }}

                        />

                        {/* EXPENSE */}

                        <div

                          key={`${period}-${index}-expense`}
                          className={`dosi-rise-bar w-full max-w-[15px] rounded-t-[5px] bg-[#FFAE58] ${barReady && bucket.expense > 0 ? "dosi-rise-bar-ready" : ""}`}

                          style={{
                            animationDelay: `${185 + index * 85}ms`,

                            height:

                              bucket.expense > 0

                                ? `${Math.max(

                                    expenseHeight,

                                    2

                                  )}%`

                                : "0%",

                          }}

                        />

                      </div>

                    );

                  })}

                </div>

              </div>

            </div>

            {/* X AXIS */}

            <div className="ml-[46px] mt-[8px] flex items-start justify-around gap-[4px]">

              {buckets.map((bucket, index) => (

                <span

                  key={index}

                  className="min-w-0 flex-1 text-center text-[9px] leading-[1.4] text-[#939CAB]"

                >

                  {bucket.label}

                </span>

              ))}

            </div>

            {/* LEGEND */}

            <div className="mt-[17px] flex items-center justify-center gap-[22px]">

              <span className="inline-flex items-center gap-[6px] text-[10px] text-[#7D8980]">

                <span className="h-[8px] w-[8px] rounded-[3px] bg-[#4CD080]" />

                Deposit

              </span>

              <span className="inline-flex items-center gap-[6px] text-[10px] text-[#7D8980]">

                <span className="h-[8px] w-[8px] rounded-[3px] bg-[#FFAE58]" />

                Pengeluaran

              </span>

            </div>

          </div>

        </section>

        {/* =====================================

            CATEGORY CHART

        ===================================== */}

        <section

          className="mt-[33px] px-[18px]"

          aria-labelledby="category-title"

        >

          <div className="flex items-start justify-between gap-3">

            <div>

              <h2

                id="category-title"

                className="text-[19px] font-bold tracking-[-0.6px] text-[#111827]"

              >

                Kategori Pengeluaran

              </h2>

              <p className="mt-[5px] text-[11px] text-[#959DAD]">

                Berdasarkan periode terpilih

              </p>

            </div>

            <strong className="shrink-0 pt-[25px] text-[15px] font-bold text-[#121827]">

              <AnimatedNumber value={totalExpense} period={period} />

            </strong>

          </div>

          {/* DONUT CHART — SVG sweep, NO gradient */}
          <div ref={donutChartRef} className="mt-[19px] flex justify-center">
            <div
              role="img"
              aria-label={`Kategori Kantin ${rupiah(categoryTotals.Kantin)}, Koperasi ${rupiah(categoryTotals.Koperasi)}, Lainnya ${rupiah(categoryTotals.Lainnya)}`}
              className="relative flex h-[188px] w-[188px] items-center justify-center"
            >
              <svg
                key={`${period}-${totalExpense}`}
                viewBox="0 0 200 200"
                aria-hidden="true"
                className="absolute inset-0 h-full w-full -rotate-90"
              >
                {/* Ring track */}
                <circle
                  cx="100" cy="100" r="85"
                  fill="none"
                  stroke="#E8ECE9"
                  strokeWidth="25"
                />
                <defs>
                  <mask id="dosi-donut-sweep-mask">
                    <circle
                      cx="100" cy="100" r="85"
                      pathLength={100}
                      fill="none"
                      stroke="white"
                      strokeWidth="28"
                      strokeDasharray="100 100"
                      className={donutReady ? "dosi-donut-sweep" : "dosi-donut-hidden"}
                    />
                  </mask>
                </defs>
                <g mask="url(#dosi-donut-sweep-mask)">
                  {totalExpense > 0 && donutSegments.map((segment, index) => {
                    const offset = donutSegments
                      .slice(0, index)
                      .reduce((sum, entry) => sum + entry.percent, 0);

                    return segment.percent > 0 ? (
                      <circle
                        key={index}
                        cx="100" cy="100" r="85"
                        pathLength={100}
                        fill="none"
                        stroke={segment.color}
                        strokeWidth="25"
                        strokeDasharray={`${segment.percent} ${100 - segment.percent}`}
                        strokeDashoffset={-offset}
                      />
                    ) : null;
                  })}
                </g>
              </svg>
              {/* Centre stays white; the ring draws clockwise behind it. */}
              <div className="absolute inset-[23px] flex flex-col items-center justify-center rounded-full bg-white">
                <Coffee
                  size={32}
                  strokeWidth={1.8}
                  className="text-[#105D38]"
                />
                <span className="mt-[6px] text-[10px] font-medium text-[#9AA59D]">
                  Total Belanja
                </span>
                <strong className="mt-[3px] text-[12px] font-bold text-[#183F29]">
                  <AnimatedNumber value={totalExpense} period={period} variant="compact" />
                </strong>
              </div>
            </div>
          </div>

          {/* CATEGORY LEGEND */}

          <div className="mt-[20px] grid grid-cols-3 gap-[7px]">

            {(

              [

                "Kantin",

                "Koperasi",

                "Lainnya",

              ] as Category[]

            ).map((category) => {

              const info = CATEGORY_INFO[category];

              const percent =

                totalExpense > 0

                  ? Math.round(

                      (categoryTotals[category] /

                        totalExpense) *

                        100

                    )

                  : 0;

              return (

                <div

                  key={category}

                  className="flex min-w-0 flex-col items-center gap-[5px] text-center"

                >

                  <span className="flex items-center gap-[5px] text-[10px] text-[#657168]">

                    <span

                      className="h-[7px] w-[7px] shrink-0 rounded-full"

                      style={{

                        backgroundColor: info.color,

                      }}

                    />

                    {category}

                  </span>

                  <span className="text-[12px] font-bold text-[#17251D]">

                    <AnimatedNumber value={percent} period={period} variant="percent" />

                  </span>

                </div>

              );

            })}

          </div>

        </section>

        {/* =====================================

            RECENT EXPENSES

        ===================================== */}

        <section

          className="mt-[35px] px-[18px] pb-[max(35px,env(safe-area-inset-bottom))]"

          aria-labelledby="recent-title"

        >

          <div className="flex items-start justify-between gap-3">

            <div>

              <h2

                id="recent-title"

                className="text-[19px] font-bold tracking-[-0.6px] text-[#111827]"

              >

                Pengeluaran Terbaru

              </h2>

              <p className="mt-[5px] text-[11px] text-[#959DAD]">

                Contoh transaksi santri

              </p>

            </div>

            <span className="rounded-full bg-[#F2F4F2] px-[10px] py-[5px] text-[10px] font-medium text-[#718076]">

              Demo

            </span>

          </div>

          {filteredExpenses.length === 0 ? (

            <div className="mt-[20px] rounded-[13px] bg-[#F7F9F7] px-4 py-7 text-center">

              <ShoppingBag

                size={27}

                strokeWidth={1.5}

                className="mx-auto text-[#A1B6A7]"

              />

              <p className="mt-3 text-[12px] font-semibold text-[#263B2B]">

                Belum ada pengeluaran

              </p>

              <p className="mt-1 text-[10px] leading-5 text-[#9BA69E]">

                Tidak ada transaksi contoh pada periode ini.

              </p>

            </div>

          ) : (

            <div className="mt-[15px] divide-y divide-[#F0F2F0]">

              {visibleExpenses.map((item) => {

                const info =

                  CATEGORY_INFO[item.category];

                const Icon = info.icon;

                return (

                  <div

                    key={item.id}

                    className="flex items-center gap-[11px] py-[12px]"

                  >

                    {/* CATEGORY ICON */}

                    <div

                      className="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-[12px]"

                      style={{

                        backgroundColor:

                          info.background,

                        color: info.color,

                      }}

                    >

                      <Icon

                        size={20}

                        strokeWidth={1.8}

                      />

                    </div>

                    {/* TRANSACTION INFO */}

                    <div className="min-w-0 flex-1">

                      <p className="truncate text-[12px] font-semibold text-[#18241C]">

                        {item.title}

                      </p>

                      <p className="mt-[4px] truncate text-[10px] text-[#9AA3B0]">

                        {transactionDate(item.date)}

                        {" • "}

                        {item.category}

                      </p>

                    </div>

                    {/* AMOUNT */}

                    <strong className="shrink-0 text-[12px] font-bold text-[#151D17]">

                      -{rupiah(item.amount)}

                    </strong>

                  </div>

                );

              })}

            </div>

          )}

          {filteredExpenses.length > 5 && (

            <button

              type="button"

              onClick={() =>

                setShowAll((previous) => !previous)

              }

              className="mt-[14px] flex w-full items-center justify-center gap-[5px] rounded-[11px] border border-[#E5EBE6] py-[11px] text-[11px] font-semibold text-[#105D38]"

            >

              {showAll

                ? "Tampilkan Lebih Sedikit"

                : "Lihat Semua Pengeluaran"}

              <ChevronRight

                size={15}

                className={

                  showAll ? "-rotate-90" : "rotate-90"

                }

              />

            </button>

          )}

          {/* DEMO NOTE */}

          <div className="mt-[21px] flex items-start gap-[9px] rounded-[11px] bg-[#F5F8F5] p-[12px]">

            <Info

              size={15}

              strokeWidth={1.8}

              className="mt-[1px] shrink-0 text-[#4C8B62]"

            />

            <p className="text-[10px] leading-[1.7] text-[#829086]">

              Statistik pengeluaran masih menggunakan

              contoh data. Nilai deposit berasal dari

              riwayat simulasi DOSI Pay pada browser ini.

              Belum ada transaksi keuangan nyata.

            </p>

          </div>

        </section>

      </div>

      {/* =====================================

          INFO / SETTINGS MODAL

      ===================================== */}

      {showInfo && (

        <div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center sm:p-5">

          <button

            type="button"

            aria-label="Tutup informasi statistik"

            onClick={() => setShowInfo(false)}

            className="dosi-modal-backdrop absolute inset-0 bg-black/40"

          />

          <section

            role="dialog"

            aria-modal="true"

            aria-labelledby="statistic-info-title"

            className="dosi-modal-sheet relative w-full max-w-[430px] rounded-t-[23px] bg-white px-5 pb-[max(24px,env(safe-area-inset-bottom))] pt-5 shadow-xl sm:rounded-[21px]"

          >

            <div className="flex items-center justify-between">

              <h2

                id="statistic-info-title"

                className="text-[17px] font-bold text-[#16241B]"

              >

                Informasi Statistik

              </h2>

              <button

                type="button"

                onClick={() => setShowInfo(false)}

                aria-label="Tutup"

                className="flex h-[32px] w-[32px] items-center justify-center rounded-full bg-[#F1F4F1]"

              >

                <X size={17} />

              </button>

            </div>

            <div className="mt-5 space-y-4">

              <div className="flex items-start gap-3">

                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[11px] bg-[#EAF8EF] text-[#19814B]">

                  <ArrowDownLeft size={19} />

                </div>

                <div>

                  <p className="text-[12px] font-semibold">

                    Deposit

                  </p>

                  <p className="mt-1 text-[11px] leading-[1.7] text-[#89968C]">

                    Dibaca dari riwayat deposit demo

                    yang tersimpan di browser.

                  </p>

                </div>

              </div>

              <div className="flex items-start gap-3">

                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[11px] bg-[#FFF4E7] text-[#DB943D]">

                  <ArrowUpRight size={19} />

                </div>

                <div>

                  <p className="text-[12px] font-semibold">

                    Pengeluaran

                  </p>

                  <p className="mt-1 text-[11px] leading-[1.7] text-[#89968C]">

                    Menggunakan data contoh Kantin,

                    Koperasi, dan Lainnya sampai modul

                    transaksi santri selesai.

                  </p>

                </div>

              </div>

              <div className="flex items-start gap-3">

                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[11px] bg-[#EEF4F0] text-[#447B5B]">

                  <CalendarDays size={19} />

                </div>

                <div>

                  <p className="text-[12px] font-semibold">

                    Filter Periode

                  </p>

                  <p className="mt-1 text-[11px] leading-[1.7] text-[#89968C]">

                    Pilih Hari Ini, Minggu Ini, atau

                    Bulan Ini untuk memperbarui seluruh

                    ringkasan dan grafik.

                  </p>

                </div>

              </div>

            </div>

            <button

              type="button"

              onClick={() => setShowInfo(false)}

              className="mt-6 h-[45px] w-full rounded-[12px] bg-[#105D38] text-[12px] font-semibold text-white"

            >

              Mengerti

            </button>

          </section>

        </div>

      )}

      {/* ======================================
          SMOOTH FINANCE MOTION
      ====================================== */}
      <style jsx global>{`
        @keyframes dosiBarRise {
          from { transform: scaleY(0); opacity: 0; }
          to { transform: scaleY(1); opacity: 1; }
        }
        .dosi-rise-bar {
          transform-origin: center bottom;
          transform: scaleY(0);
          opacity: 0;
          will-change: transform;
        }
        .dosi-rise-bar-ready {
          animation: dosiBarRise 850ms cubic-bezier(0.18, 1, 0.32, 1) both;
        }

        @keyframes dosiDonutSweep {
          from { stroke-dashoffset: 100; }
          to { stroke-dashoffset: 0; }
        }
        .dosi-donut-hidden { stroke-dashoffset: 100; }
        .dosi-donut-sweep {
          animation: dosiDonutSweep 1050ms cubic-bezier(0.18, 1, 0.32, 1) both;
        }

        @keyframes dosiModalFade {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .dosi-modal-backdrop {
          animation: dosiModalFade 180ms ease-out both;
        }
        @keyframes dosiModalUp {
          from { opacity: 0; transform: translateY(24px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .dosi-modal-sheet {
          animation: dosiModalUp 330ms cubic-bezier(0.22, 1, 0.36, 1) both;
        }

        @media (prefers-reduced-motion: reduce) {
          .dosi-rise-bar, .dosi-rise-bar-ready {
            animation: none !important;
            transform: scaleY(1) !important;
            opacity: 1 !important;
            will-change: auto;
          }
          .dosi-donut-hidden, .dosi-donut-sweep {
            animation: none !important;
            stroke-dashoffset: 0 !important;
          }
          .dosi-modal-backdrop, .dosi-modal-sheet {
            animation: none !important;
          }
        }
      `}</style>

    </main>

  );

}
