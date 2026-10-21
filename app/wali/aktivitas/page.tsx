
"use client";

import {
  useEffect,
  useMemo,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";

import Link from "next/link";

import {
  ArrowLeft,
  Check,
  ChartNoAxesColumn,
  Coffee,
  Info,
  Pencil,
  Share2,
  ShoppingBag,
  Wallet,
  X,
} from "lucide-react";

// ==========================================
// DOSI PAY — LIMIT JAJAN SANTRI
// ==========================================

const LIMIT_STORAGE_KEY =
  "dosi_wali_daily_snack_limit_v1";

const DEFAULT_LIMIT = 25000;

// DATA CONTOH PENGELUARAN
// Urutan: 6 hari lalu sampai hari ini.
//
// Hari ini Rp20.000, mengikuti contoh
// transaksi kantin pada halaman Pengeluaran.
//
// Setelah backend kasir tersedia, ganti
// data ini dengan transaksi santri asli.

const DEMO_DAILY_SPENDING = [
  17000,
  10000,
  20000,
  18000,
  13000,
  15000,
  20000,
];

const QUICK_LIMITS = [
  10000,
  20000,
  25000,
  50000,
  100000,
];

const STUDENT = {
  name: "Ahmad Fauzan",
  initials: "AF",
  nis: "20260001",
};

// ==========================================
// HELPERS
// ==========================================

function rupiah(value: number) {
  return `Rp${value.toLocaleString("id-ID")}`;
}

function shortRupiah(value: number) {
  if (value >= 1000000) {
    return `${(value / 1000000).toLocaleString(
      "id-ID",
      { maximumFractionDigits: 1 }
    )}jt`;
  }

  if (value >= 1000) {
    return `${Math.round(value / 1000)}rb`;
  }

  return String(value);
}

function formatDay(date: Date) {
  return new Intl.DateTimeFormat("id-ID", {
    weekday: "short",
  }).format(date);
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

// ==========================================
// CIRCLE ARC HELPERS
// ==========================================

function polarPoint(
  cx: number,
  cy: number,
  radius: number,
  angle: number
) {
  const radians = (angle * Math.PI) / 180;

  return {
    x: cx + radius * Math.cos(radians),
    y: cy + radius * Math.sin(radians),
  };
}

function createArc(
  cx: number,
  cy: number,
  radius: number,
  startAngle: number,
  endAngle: number
) {
  const start = polarPoint(
    cx,
    cy,
    radius,
    startAngle
  );

  const end = polarPoint(
    cx,
    cy,
    radius,
    endAngle
  );

  const largeArc =
    endAngle - startAngle > 180 ? 1 : 0;

  return [
    `M ${start.x} ${start.y}`,
    `A ${radius} ${radius} 0 ${largeArc} 1 ${end.x} ${end.y}`,
  ].join(" ");
}

// ==========================================
// READ SAVED LIMIT
// ==========================================

function readSavedLimit() {
  try {
    const raw = localStorage.getItem(
      LIMIT_STORAGE_KEY
    );

    if (!raw) return DEFAULT_LIMIT;

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
    // Gunakan limit default.
  }

  return DEFAULT_LIMIT;
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

export default function LimitJajanPage() {
  const [limit, setLimit] =
    useState(DEFAULT_LIMIT);

  const [limitInput, setLimitInput] =
    useState(String(DEFAULT_LIMIT));

  const [ready, setReady] = useState(false);
  const [animateRing, setAnimateRing] =
    useState(false);

  const [now, setNow] =
    useState<Date | null>(null);

  const [showEdit, setShowEdit] =
    useState(false);

  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const [selectedDay, setSelectedDay] =
    useState(6);

  // ========================================
  // INITIALIZATION
  // ========================================

  useEffect(() => {
    const savedLimit = readSavedLimit();

    setLimit(savedLimit);
    setLimitInput(String(savedLimit));
    setNow(new Date());
    setReady(true);

    const frame = requestAnimationFrame(() => {
      setAnimateRing(true);
    });

    return () => cancelAnimationFrame(frame);
  }, []);

  // Automatically hide notification.
  useEffect(() => {
    if (!notice) return;

    const timer = window.setTimeout(() => {
      setNotice("");
    }, 3000);

    return () => window.clearTimeout(timer);
  }, [notice]);

  // Modal keyboard and scroll behavior.
  useEffect(() => {
    if (!showEdit) return;

    const previousOverflow =
      document.body.style.overflow;

    document.body.style.overflow = "hidden";

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setShowEdit(false);
        setError("");
      }
    }

    window.addEventListener(
      "keydown",
      handleEscape
    );

    return () => {
      document.body.style.overflow =
        previousOverflow;

      window.removeEventListener(
        "keydown",
        handleEscape
      );
    };
  }, [showEdit]);

  // ========================================
  // DAILY SPENDING
  // ========================================

  const days = useMemo(() => {
    if (!now) return [];

    const today = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate()
    );

    return DEMO_DAILY_SPENDING.map(
      (amount, index) => {
        const date = new Date(today);

        date.setDate(
          today.getDate() - (6 - index)
        );

        return {
          id: index,
          date,
          label: formatDay(date),
          amount,
        };
      }
    );
  }, [now]);

  const todaySpent =
    DEMO_DAILY_SPENDING[
      DEMO_DAILY_SPENDING.length - 1
    ];

  const remaining = Math.max(
    0,
    limit - todaySpent
  );

  const percentage =
    limit > 0
      ? Math.round(
          (todaySpent / limit) * 100
        )
      : 0;

  const ringPercentage = Math.min(
    100,
    percentage
  );

  const overLimit = todaySpent > limit;
  const limitReached = todaySpent >= limit;

  const weeklyTotal =
    DEMO_DAILY_SPENDING.reduce(
      (sum, value) => sum + value,
      0
    );

  // ========================================
  // RING DRAWING
  // ========================================

  const ringPath = createArc(
    160,
    160,
    124,
    140,
    400
  );

  const ticks = Array.from(
    { length: 36 },
    (_, index) => {
      const angle =
        140 + (index / 35) * 260;

      return {
        inner: polarPoint(
          160,
          160,
          101,
          angle
        ),
        outer: polarPoint(
          160,
          160,
          106,
          angle
        ),
      };
    }
  );

  // ========================================
  // CHART CALCULATION
  // ========================================

  const chartMax = Math.ceil(
    Math.max(
      limit,
      ...DEMO_DAILY_SPENDING,
      10000
    ) / 10000
  ) * 10000;

  const chartPoints = days.map(
    (day, index) => ({
      x: 47 + index * 43,
      y:
        155 -
        (day.amount / chartMax) * 132,
      amount: day.amount,
    })
  );

  const linePath = chartPoints
    .map((point, index) => {
      if (index === 0) {
        return `M ${point.x} ${point.y}`;
      }

      const previous =
        chartPoints[index - 1];

      const middleX =
        (previous.x + point.x) / 2;

      return (
        ` C ${middleX} ${previous.y}` +
        ` ${middleX} ${point.y}` +
        ` ${point.x} ${point.y}`
      );
    })
    .join("");

  const areaPath =
    chartPoints.length > 0
      ? `${linePath} L 305 155 L 47 155 Z`
      : "";

  const chosenPoint =
    chartPoints[selectedDay];

  const chosenDay =
    days[selectedDay];

  // ========================================
  // LIMIT ACTIONS
  // ========================================

  function openEdit() {
    setLimitInput(String(limit));
    setError("");
    setShowEdit(true);
  }

  function saveLimit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    const value = Number(limitInput);

    if (
      !Number.isSafeInteger(value) ||
      value <= 0
    ) {
      setError(
        "Masukkan limit harian yang valid."
      );
      return;
    }

    try {
      localStorage.setItem(
        LIMIT_STORAGE_KEY,
        JSON.stringify({
          limit: value,
          updatedAt:
            new Date().toISOString(),
        })
      );

      setLimit(value);
      setShowEdit(false);
      setError("");
      setNotice("Limit harian disimpan.");
    } catch {
      setError(
        "Limit gagal disimpan. Periksa penyimpanan browser."
      );
    }
  }

  async function shareLimit() {
    const text =
      `Limit Jajan DOSI Pay (Demo)\n` +
      `Santri: ${STUDENT.name}\n` +
      `Limit harian: ${rupiah(limit)}\n` +
      `Pengeluaran demo hari ini: ${rupiah(
        todaySpent
      )}`;

    try {
      if (navigator.share) {
        await navigator.share({
          title: "Limit Jajan DOSI Pay",
          text,
        });
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(
          text
        );

        setNotice("Ringkasan disalin.");
      } else {
        setNotice(
          "Fitur berbagi tidak tersedia."
        );
      }
    } catch {
      // Pengguna membatalkan proses berbagi.
    }
  }

  return (
    <main className="min-h-[100dvh] bg-[#F3F5F3] font-sans text-[#17251D]">

      <div className="mx-auto min-h-[100dvh] w-full max-w-[430px] bg-white">

        {/* =====================================
            TOP NAVIGATION
        ===================================== */}

        <header className="limit-enter px-[18px] pt-[max(20px,env(safe-area-inset-top))]">

          <div className="flex h-[42px] items-center justify-between">

            <Link
              href="/wali/beranda"
              aria-label="Kembali ke beranda"
              className="limit-tap flex h-[38px] w-[38px] items-center justify-center rounded-[12px] border border-[#E7ECE8]"
            >
              <ArrowLeft
                size={19}
                strokeWidth={1.8}
              />
            </Link>

            <h1 className="text-[17px] font-bold tracking-[-0.5px]">
              Limit Jajan
            </h1>

            <div
              title={STUDENT.name}
              className="flex h-[38px] w-[38px] items-center justify-center rounded-full bg-[#EAF6EE] text-[12px] font-bold text-[#176B45]"
            >
              {STUDENT.initials}
            </div>

          </div>

        </header>

        {/* =====================================
            CIRCULAR LIMIT METER
        ===================================== */}

        <section className="limit-enter mt-[18px] px-[15px]">

          <div className="flex items-center justify-between px-[7px]">

            <div>

              <h2 className="text-[16px] font-bold tracking-[-0.4px]">
                Jajan Hari Ini
              </h2>

              <p className="mt-[4px] text-[10px] text-[#99A59B]">
                {now
                  ? formatDate(now)
                  : "Memuat..."}
                {" • "}Simulasi
              </p>

            </div>

            <span
              className={`rounded-full px-[10px] py-[6px] text-[10px] font-semibold ${
                overLimit
                  ? "bg-[#FFF0E7] text-[#B56F3C]"
                  : limitReached ||
                      percentage >= 80
                    ? "bg-[#FFF5E9] text-[#B18337]"
                    : "bg-[#EAF7EE] text-[#288252]"
              }`}
            >
              {overLimit
                ? "Melebihi Limit"
                : limitReached
                  ? "Limit Tercapai"
                  : percentage >= 80
                    ? "Mendekati Limit"
                    : "Terkendali"}
            </span>

          </div>

          {/* GAUGE */}
          <div className="relative mx-auto mt-[9px] aspect-square w-full max-w-[328px]">

            {/* LEFT EDIT BUTTON */}
            <button
              type="button"
              onClick={openEdit}
              aria-label="Ubah limit jajan"
              className="limit-tap absolute left-[5px] top-[61px] z-10 flex h-[37px] w-[37px] items-center justify-center rounded-full border border-[#EDF0ED] bg-white text-[#21362A] shadow-sm"
            >
              <Pencil
                size={17}
                strokeWidth={1.8}
              />
            </button>

            {/* RIGHT SHARE BUTTON */}
            <button
              type="button"
              onClick={shareLimit}
              aria-label="Bagikan ringkasan limit"
              className="limit-tap absolute right-[5px] top-[61px] z-10 flex h-[37px] w-[37px] items-center justify-center rounded-full border border-[#EDF0ED] bg-white text-[#21362A] shadow-sm"
            >
              <Share2
                size={17}
                strokeWidth={1.8}
              />
            </button>

            {/* RING SVG */}
            <svg
              viewBox="0 0 320 320"
              aria-hidden="true"
              className="absolute inset-0 h-full w-full overflow-visible"
            >

              {/* BACKGROUND TRACK */}
              <path
                d={ringPath}
                fill="none"
                stroke="#E7ECE8"
                strokeWidth="20"
                strokeLinecap="round"
              />

              {/* INNER TICKS */}
              {ticks.map((tick, index) => (
                <line
                  key={index}
                  x1={tick.inner.x}
                  y1={tick.inner.y}
                  x2={tick.outer.x}
                  y2={tick.outer.y}
                  stroke="#E1E7E2"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              ))}

              {/* ANIMATED PROGRESS */}
              <path
                d={ringPath}
                fill="none"
                stroke={
                  overLimit
                    ? "#E9A459"
                    : "#4CD080"
                }
                strokeWidth="20"
                strokeLinecap="round"
                pathLength={100}
                strokeDasharray="100 100"
                strokeDashoffset={
                  animateRing && ready
                    ? 100 - ringPercentage
                    : 100
                }
                style={{
                  transition:
                    "stroke-dashoffset 900ms cubic-bezier(0.22,1,0.36,1), stroke 250ms ease",
                }}
              />

            </svg>

            {/* CENTER INFORMATION */}
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center pb-[5px]">

              <ShoppingBag
                size={34}
                strokeWidth={1.9}
                className="text-[#105D38]"
              />

              <p className="mt-[18px] text-[31px] font-extrabold leading-none tracking-[-1px] text-[#17251D] max-[360px]:text-[28px]">
                {rupiah(todaySpent)}
              </p>

              <p className="mt-[7px] text-[12px] text-[#929E95]">
                terpakai hari ini
              </p>

              <p className="mt-[22px] text-[13px] font-semibold text-[#24372A]">
                Limit: {rupiah(limit)}
              </p>

            </div>

          </div>

          {/* =====================================
              THREE METRICS
          ===================================== */}

          <div className="-mt-[1px] grid grid-cols-3 gap-[8px] px-[8px]">

            <div className="flex flex-col items-center text-center">

              <span className="flex h-[35px] w-[35px] items-center justify-center rounded-full bg-[#EAF6EE] text-[#105D38]">
                <ShoppingBag size={18} />
              </span>

              <strong className="mt-[8px] text-[12px] text-[#17251D]">
                {shortRupiah(todaySpent)}
              </strong>

              <span className="mt-[3px] text-[10px] text-[#99A49C]">
                Terpakai
              </span>

            </div>

            <div className="flex flex-col items-center text-center">

              <span className="flex h-[35px] w-[35px] items-center justify-center rounded-full bg-[#EAF8F0] text-[#36AA70]">
                <Wallet size={18} />
              </span>

              <strong className="mt-[8px] text-[12px] text-[#17251D]">
                {shortRupiah(remaining)}
              </strong>

              <span className="mt-[3px] text-[10px] text-[#99A49C]">
                Sisa Limit
              </span>

            </div>

            <div className="flex flex-col items-center text-center">

              <span className="flex h-[35px] w-[35px] items-center justify-center rounded-full bg-[#FFF3E7] text-[#E9A459]">
                <ChartNoAxesColumn size={18} />
              </span>

              <strong className="mt-[8px] text-[12px] text-[#17251D]">
                {percentage}%
              </strong>

              <span className="mt-[3px] text-[10px] text-[#99A49C]">
                Pemakaian
              </span>

            </div>

          </div>

        </section>

        {/* =====================================
            EXPENSE CHART CARD
        ===================================== */}

        <section className="limit-enter mt-[28px] px-[15px] pb-[max(30px,env(safe-area-inset-bottom))]">

          <div className="rounded-[23px] border border-[#E8EEEA] bg-white px-[14px] pb-[17px] pt-[17px] shadow-[0_10px_32px_-24px_rgba(0,0,0,0.15)]">

            <div className="flex items-start justify-between gap-2">

              <div>

                <h2 className="text-[15px] font-bold tracking-[-0.4px]">
                  Pengeluaran Harian
                </h2>

                <p className="mt-[4px] text-[10px] text-[#98A49A]">
                  7 hari terakhir
                </p>

              </div>

              <span className="rounded-full bg-[#F1F5F2] px-[9px] py-[5px] text-[9px] font-medium text-[#738679]">
                Data Demo
              </span>

            </div>

            {/* SELECTED DAY VALUE */}
            <div className="mt-[17px] flex items-end justify-between gap-3">

              <div>

                <p className="text-[10px] text-[#99A49C]">
                  {chosenDay
                    ? formatDate(chosenDay.date)
                    : "Memuat..."}
                </p>

                <p className="mt-[4px] text-[20px] font-bold tracking-[-0.7px] text-[#105D38]">
                  {rupiah(
                    chosenDay?.amount ?? 0
                  )}
                </p>

              </div>

              <span className="pb-[3px] text-[10px] text-[#8FA095]">
                Total 7 hari:{" "}
                <strong className="text-[#273C2C]">
                  {shortRupiah(weeklyTotal)}
                </strong>
              </span>

            </div>

            {/* INTERACTIVE AREA CHART */}
            <div className="mt-[13px]">

              <svg
                viewBox="0 0 330 190"
                className="block w-full"
                role="group"
                aria-label="Grafik pengeluaran tujuh hari terakhir. Pilih titik untuk melihat nominal."
              >

                {/* GRID & Y LABEL */}
                {[0, 1, 2, 3].map((index) => {
                  const y = 20 + index * 45;
                  const value =
                    chartMax -
                    (chartMax / 3) * index;

                  return (
                    <g key={index}>

                      <line
                        x1="46"
                        x2="313"
                        y1={y}
                        y2={y}
                        stroke="#E6ECE7"
                        strokeDasharray="4 5"
                      />

                      <text
                        x="1"
                        y={y + 3}
                        fontSize="10"
                        fill="#A0ABA2"
                      >
                        {shortRupiah(
                          Math.round(value)
                        )}
                      </text>

                    </g>
                  );
                })}

                {/* SOFT SOLID AREA FILL */}
                <path
                  d={areaPath}
                  fill="#E2F3E8"
                />

                {/* SMOOTH LINE */}
                <path
                  d={linePath}
                  fill="none"
                  stroke="#43BD7C"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                {/* POINTS */}
                {chartPoints.map(
                  (point, index) => (
                    <g key={index}>

                      <circle
                        cx={point.x}
                        cy={point.y}
                        r={
                          selectedDay === index
                            ? 6
                            : 4
                        }
                        fill="#FFFFFF"
                        stroke="#43BD7C"
                        strokeWidth={
                          selectedDay === index
                            ? 3
                            : 2
                        }
                      />

                      {/* HIT TARGET */}
                      <circle
                        cx={point.x}
                        cy={point.y}
                        r="14"
                        fill="transparent"
                        className="cursor-pointer"
                        role="button"
                        tabIndex={0}
                        aria-label={`${days[index]?.label}: ${rupiah(
                          point.amount
                        )}`}
                        onClick={() =>
                          setSelectedDay(index)
                        }
                        onKeyDown={(event) => {
                          if (
                            event.key === "Enter" ||
                            event.key === " "
                          ) {
                            event.preventDefault();
                            setSelectedDay(index);
                          }
                        }}
                      />

                    </g>
                  )
                )}

                {/* SELECTED VALUE TOOLTIP */}
                {chosenPoint && (
                  <g
                    pointerEvents="none"
                    transform={`translate(
                      ${Math.max(
                        83,
                        Math.min(
                          270,
                          chosenPoint.x
                        )
                      )},
                      ${Math.max(
                        28,
                        chosenPoint.y - 18
                      )}
                    )`}
                  >

                    <rect
                      x="-49"
                      y="-29"
                      width="98"
                      height="26"
                      rx="7"
                      fill="#17251D"
                    />

                    <text
                      x="0"
                      y="-12"
                      textAnchor="middle"
                      fontSize="11"
                      fontWeight="600"
                      fill="#FFFFFF"
                    >
                      {rupiah(
                        chosenPoint.amount
                      )}
                    </text>

                  </g>
                )}

                {/* DAY LABELS */}
                {days.map((day, index) => (
                  <text
                    key={day.id}
                    x={47 + index * 43}
                    y="181"
                    textAnchor="middle"
                    fontSize="10"
                    fill={
                      selectedDay === index
                        ? "#105D38"
                        : "#99A49C"
                    }
                    fontWeight={
                      selectedDay === index
                        ? "700"
                        : "400"
                    }
                  >
                    {day.label}
                  </text>
                ))}

              </svg>

            </div>

            {/* WEEKLY SUMMARY */}
            <div className="mt-[11px] flex items-center justify-between border-t border-[#EEF1EE] pt-[12px]">

              <span className="text-[10px] text-[#91A095]">
                Rata-rata per hari
              </span>

              <strong className="text-[12px] text-[#17251D]">
                {rupiah(
                  Math.round(weeklyTotal / 7)
                )}
              </strong>

            </div>

          </div>

          {/* IMPORTANT DEMO NOTE */}
          <div className="mt-[16px] flex items-start gap-[9px] rounded-[12px] bg-[#F4F7F4] px-[12px] py-[12px]">

            <Info
              size={15}
              className="mt-[2px] shrink-0 text-[#558B66]"
            />

            <p className="text-[10px] leading-[1.7] text-[#829186]">
              Pengeluaran masih menggunakan data demo.
              Limit yang diatur tersimpan di browser,
              tetapi belum membatasi transaksi kasir
              secara nyata.
            </p>

          </div>

        </section>

      </div>

      {/* =====================================
          EDIT LIMIT BOTTOM SHEET
      ===================================== */}

      {showEdit && (
        <BodyPortal>
        <div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center sm:p-5">

          <button
            type="button"
            aria-label="Tutup pengaturan limit"
            onClick={() => {
              setShowEdit(false);
              setError("");
            }}
            className="limit-backdrop absolute inset-0 bg-black/40"
          />

          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="edit-limit-title"
            className="limit-sheet relative max-h-[90dvh] w-full max-w-[430px] overflow-y-auto rounded-t-[24px] bg-white px-[19px] pb-[max(22px,env(safe-area-inset-bottom))] pt-[12px] shadow-xl sm:rounded-[22px]"
          >

            {/* HANDLE */}
            <div className="mx-auto h-[4px] w-[37px] rounded-full bg-[#E5EBE6]" />

            {/* HEADER */}
            <div className="mt-[18px] flex items-center justify-between">

              <h2
                id="edit-limit-title"
                className="text-[17px] font-bold tracking-[-0.4px]"
              >
                Atur Limit Harian
              </h2>

              <button
                type="button"
                aria-label="Tutup"
                onClick={() => {
                  setShowEdit(false);
                  setError("");
                }}
                className="limit-tap flex h-[32px] w-[32px] items-center justify-center rounded-full bg-[#F1F4F1]"
              >
                <X size={17} />
              </button>

            </div>

            <p className="mt-[6px] text-[11px] text-[#92A096]">
              {STUDENT.name} • NIS {STUDENT.nis}
            </p>

            <form
              onSubmit={saveLimit}
              className="mt-[20px]"
            >

              <label
                htmlFor="daily-limit-input"
                className="text-[11px] font-semibold text-[#526658]"
              >
                Batas pengeluaran per hari
              </label>

              <div
                className={`mt-[8px] flex h-[51px] items-center rounded-[12px] border px-[13px] focus-within:border-[#278353] ${
                  error
                    ? "border-red-400"
                    : "border-[#E2EAE3]"
                }`}
              >

                <span className="mr-[9px] text-[13px] font-semibold text-[#105D38]">
                  Rp
                </span>

                <input
                  id="daily-limit-input"
                  type="text"
                  inputMode="numeric"
                  autoComplete="off"
                  autoFocus
                  value={
                    limitInput
                      ? Number(
                          limitInput
                        ).toLocaleString(
                          "id-ID"
                        )
                      : ""
                  }
                  onChange={(event) => {
                    setLimitInput(
                      event.target.value
                        .replace(/\D/g, "")
                        .slice(0, 9)
                    );

                    setError("");
                  }}
                  placeholder="Masukkan nominal"
                  aria-invalid={Boolean(error)}
                  className="min-w-0 flex-1 bg-transparent text-[19px] font-bold tracking-[-0.5px] outline-none placeholder:text-[12px] placeholder:font-normal placeholder:text-[#A9B5AB]"
                />

              </div>

              {/* QUICK LIMITS */}
              <div className="mt-[14px] grid grid-cols-5 gap-[6px]">

                {QUICK_LIMITS.map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => {
                      setLimitInput(
                        String(value)
                      );

                      setError("");
                    }}
                    aria-pressed={
                      Number(limitInput) ===
                      value
                    }
                    className={`limit-tap h-[35px] rounded-[9px] border text-[10px] font-semibold ${
                      Number(limitInput) ===
                      value
                        ? "border-[#105D38] bg-[#EAF7EE] text-[#105D38]"
                        : "border-[#E4EAE5] text-[#718075]"
                    }`}
                  >
                    {value / 1000}K
                  </button>
                ))}

              </div>

              {/* PREVIEW */}
              <div className="mt-[18px] rounded-[12px] bg-[#F6F8F6] px-[13px] py-[13px]">

                <div className="flex justify-between gap-3">

                  <span className="text-[11px] text-[#8C9A90]">
                    Pengeluaran hari ini
                  </span>

                  <span className="text-[11px] font-semibold">
                    {rupiah(todaySpent)}
                  </span>

                </div>

                <div className="mt-[10px] flex justify-between gap-3">

                  <span className="text-[11px] text-[#8C9A90]">
                    Sisa dengan limit baru
                  </span>

                  <span className="text-[11px] font-semibold text-[#105D38]">
                    {rupiah(
                      Math.max(
                        0,
                        Number(limitInput || 0) -
                          todaySpent
                      )
                    )}
                  </span>

                </div>

              </div>

              {error && (
                <p
                  role="alert"
                  className="mt-[10px] text-[11px] text-red-500"
                >
                  {error}
                </p>
              )}

              <button
                type="submit"
                className="limit-tap mt-[18px] flex h-[46px] w-full items-center justify-center gap-[8px] rounded-[12px] bg-[#105D38] text-[12px] font-semibold text-white"
              >
                <Check size={17} />
                Simpan Limit
              </button>

            </form>

          </section>

        </div>
        </BodyPortal>
      )}

      {/* =====================================
          SUCCESS TOAST
      ===================================== */}

      {notice && (
        <BodyPortal>
        <div
          role="status"
          className="limit-toast fixed bottom-[calc(112px+env(safe-area-inset-bottom))] left-1/2 z-[150] w-max max-w-[calc(100vw-36px)] -translate-x-1/2 rounded-full bg-[#17251D] px-[18px] py-[11px] text-center text-[11px] font-medium text-white shadow-lg"
        >
          {notice}
        </div>
        </BodyPortal>
      )}

      {/* =====================================
          ANIMATIONS
      ===================================== */}

      <style jsx global>{`

        @keyframes limitFadeUp {
          from {
            opacity: 0;
            transform: translateY(12px);
          }

          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .limit-enter {
          animation: limitFadeUp 520ms
            cubic-bezier(0.22, 1, 0.36, 1) both;
        }

        @keyframes limitSheetIn {
          from {
            opacity: 0;
            transform: translateY(32px);
          }

          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .limit-sheet {
          animation: limitSheetIn 360ms
            cubic-bezier(0.22, 1, 0.36, 1) both;
        }

        @keyframes limitBackdropIn {
          from {
            opacity: 0;
          }

          to {
            opacity: 1;
          }
        }

        .limit-backdrop {
          animation: limitBackdropIn 220ms ease-out both;
        }

        @keyframes limitToastIn {
          from {
            opacity: 0;
            transform:
              translate(-50%, 10px);
          }

          to {
            opacity: 1;
            transform:
              translate(-50%, 0);
          }
        }

        .limit-toast {
          animation: limitToastIn 260ms ease-out both;
        }

        .limit-tap {
          transition:
            transform 160ms ease,
            background-color 160ms ease,
            border-color 160ms ease;
        }

        .limit-tap:active {
          transform: scale(0.96);
        }

        @media (prefers-reduced-motion: reduce) {
          .limit-enter,
          .limit-sheet,
          .limit-backdrop,
          .limit-toast {
            animation: none !important;
          }

          .limit-tap {
            transition: none !important;
          }

          .limit-tap:active {
            transform: none !important;
          }
        }

      `}</style>

    </main>
  );
}
