
'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import {
  ArrowDownLeft,
  ArrowRight,
  ArrowUpRight,
  BadgeCheck,
  Coins,
  GraduationCap,
  Landmark,
  ReceiptText,
  Wallet,
  type LucideIcon,
} from 'lucide-react';

import { useManajemen } from './components/ManajemenProvider';

import {
  activity,
  availableSettlement,
  balanceOf,
  billPaid,
  dayKey,
  fmt,
  rp,
  salesSum,
} from './lib/data';

const panel =
  'rounded-[20px] border border-[#E6ECE7] bg-white';

const focus =
  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#D5A52D]';

type ChartPoint = {
  key: string;
  label: string;
  sales: number;
  topup: number;
};

function MetricCard({
  label,
  value,
  detail,
  icon: Icon,
  tone = 'green',
}: {
  label: string;
  value: string;
  detail?: string;
  icon: LucideIcon;
  tone?: 'green' | 'gold';
}) {
  return (
    <article className={`${panel} min-w-0 p-4 sm:p-5 xl:p-6`}>
      <span
        className={`flex h-10 w-10 items-center justify-center rounded-[12px] ${
          tone === 'gold'
            ? 'bg-[#FAF1D8] text-[#967014]'
            : 'bg-[#ECF7EF] text-[#105D38]'
        }`}
      >
        <Icon size={19} strokeWidth={1.9} aria-hidden="true" />
      </span>

      <p className="mt-5 text-[12px] font-medium text-[#718077] sm:text-[13px]">
        {label}
      </p>

      <p className="mt-1 break-words text-[clamp(16px,2.5vw,27px)] font-extrabold leading-[1.35] tracking-[-0.7px] tabular-nums text-[#142019] [overflow-wrap:anywhere]">
        {value}
      </p>

      {detail && (
        <p className="mt-2 text-[11px] text-[#8B998F]">
          {detail}
        </p>
      )}
    </article>
  );
}

function SectionHeader({
  title,
  action,
}: {
  title: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <h2 className="text-[16px] font-bold tracking-[-0.4px] text-[#142019] sm:text-[18px]">
        {title}
      </h2>
      {action}
    </div>
  );
}

function CompactNumber(value: number) {
  if (value >= 1_000_000_000) {
    return `${+(value / 1_000_000_000).toFixed(1)} M`;
  }
  if (value >= 1_000_000) {
    return `${+(value / 1_000_000).toFixed(1)} jt`;
  }
  if (value >= 1_000) {
    return `${+(value / 1_000).toFixed(0)} rb`;
  }
  return String(Math.round(value));
}

function SalesChart({
  data,
  loading,
}: {
  data: ChartPoint[];
  loading: boolean;
}) {
  const maxValue = Math.max(
    1,
    ...data.map((point) =>
      Math.max(point.sales, point.topup)
    )
  );

  const hasData = data.some(
    (point) => point.sales > 0 || point.topup > 0
  );

  function barHeight(value: number) {
    return `${value > 0
      ? Math.max(3, (value / maxValue) * 100)
      : 0}%`;
  }

  return (
    <div className="mt-6">
      <div className="flex flex-wrap items-center gap-4 text-[11px] font-medium text-[#647568]">
        <span className="inline-flex items-center gap-2">
          <span className="h-[9px] w-[9px] rounded-[3px] bg-[#105D38]" />
          Belanja
        </span>

        <span className="inline-flex items-center gap-2">
          <span className="h-[9px] w-[9px] rounded-[3px] bg-[#D5A52D]" />
          Deposit
        </span>
      </div>

      <div className="mt-6 flex gap-3">
        {/* Y AXIS */}
        <div className="flex h-[182px] w-[44px] shrink-0 flex-col justify-between pb-[2px] text-right text-[10px] tabular-nums text-[#91A096]">
          <span>{CompactNumber(maxValue)}</span>
          <span>{CompactNumber(maxValue / 2)}</span>
          <span>0</span>
        </div>

        {/* GRAPH */}
        <div className="min-w-0 flex-1">
          <div className="relative h-[182px]">
            <div className="pointer-events-none absolute inset-0 flex flex-col justify-between">
              <div className="border-t border-dashed border-[#E6ECE7]" />
              <div className="border-t border-dashed border-[#E6ECE7]" />
              <div className="border-t border-[#E6ECE7]" />
            </div>

            {!loading && hasData && (
              <div className="relative grid h-full grid-cols-7 gap-1 sm:gap-3">
                {data.map((point) => (
                  <div
                    key={point.key}
                    tabIndex={0}
                    aria-label={`${point.label}: Belanja ${rp(point.sales)}, Deposit ${rp(point.topup)}`}
                    title={`Belanja: ${rp(point.sales)} | Deposit: ${rp(point.topup)}`}
                    className={`${focus} group relative flex min-w-0 items-end justify-center gap-[3px] rounded-[5px] sm:gap-[5px]`}
                  >
                    <div
                      className="w-[36%] max-w-[24px] rounded-t-[5px] bg-[#105D38] transition-colors duration-150 group-hover:bg-[#167448]"
                      style={{
                        height: barHeight(point.sales),
                      }}
                    />

                    <div
                      className="w-[36%] max-w-[24px] rounded-t-[5px] bg-[#D5A52D] transition-colors duration-150 group-hover:bg-[#E7B944]"
                      style={{
                        height: barHeight(point.topup),
                      }}
                    />

                    <div className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-2 hidden w-[164px] -translate-x-1/2 rounded-[10px] bg-[#0B3D26] p-3 text-[11px] text-white shadow-lg group-hover:block group-focus:block">
                      <p className="mb-2 font-bold">
                        {point.label}
                      </p>

                      <div className="flex justify-between gap-2">
                        <span>Belanja</span>
                        <span>{rp(point.sales)}</span>
                      </div>

                      <div className="mt-1 flex justify-between gap-2">
                        <span>Deposit</span>
                        <span>{rp(point.topup)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {loading && (
              <div className="absolute inset-0 flex items-center justify-center text-[12px] text-[#91A096]">
                Memuat...
              </div>
            )}

            {!loading && !hasData && (
              <div className="absolute inset-0 flex items-center justify-center text-[12px] text-[#91A096]">
                Belum ada transaksi
              </div>
            )}
          </div>

          {/* X AXIS */}
          <div className="mt-3 grid grid-cols-7 gap-1 sm:gap-3">
            {data.map((point) => (
              <span
                key={point.key}
                className="truncate text-center text-[10px] font-medium text-[#819087]"
              >
                {point.label}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

const shortcuts = [
  {
    href: '/manajemen/santri',
    label: 'Data Santri',
    icon: GraduationCap,
  },
  {
    href: '/manajemen/pengumuman',
    label: 'Pengumuman',
    icon: BadgeCheck,
  },
  {
    href: '/manajemen/spp',
    label: 'SPP & Cicilan',
    icon: Coins,
  },
  {
    href: '/manajemen/penarikan',
    label: 'Penarikan',
    icon: Landmark,
  },
];

export default function Dashboard() {
  const { kasir, admin, deposits } = useManajemen();
  const [today, setToday] = useState<Date | null>(null);

  useEffect(() => {
    setToday(new Date());
  }, []);

  const totalDeposit = deposits.reduce(
    (sum, item) => sum + item.depositAmount,
    0
  );

  const sales = salesSum(kasir);

  const outstanding = admin.bills.reduce(
    (sum, bill) =>
      sum + Math.max(0, bill.amount - billPaid(bill)),
    0
  );

  const wallet = kasir.students.reduce(
    (sum, student) =>
      sum + balanceOf(kasir, student, deposits),
    0
  );

  const settlement = availableSettlement(kasir);

  const rows = activity(
    kasir,
    deposits,
    admin
  ).slice(0, 6);

  const chart: ChartPoint[] = today
    ? Array.from({ length: 7 }, (_, index) => {
        const date = new Date(today.getTime());

        date.setDate(
          date.getDate() - (6 - index)
        );

        const key = dayKey(date);

        const label = new Intl.DateTimeFormat(
          'id-ID',
          {
            timeZone: 'Asia/Jakarta',
            weekday: 'short',
          }
        ).format(date);

        const salesAmount = kasir.sales
          .filter(
            (sale) => dayKey(sale.time) === key
          )
          .reduce(
            (sum, sale) => sum + sale.total,
            0
          );

        const topupAmount = deposits
          .filter(
            (item) => dayKey(item.createdAt) === key
          )
          .reduce(
            (sum, item) => sum + item.depositAmount,
            0
          );

        return {
          key,
          label,
          sales: salesAmount,
          topup: topupAmount,
        };
      })
    : [];

  return (
    <div className="w-full min-w-0 text-[#142019]">
      {/* HEADER */}
      <header className="mb-6">
        <h1 className="text-[24px] font-extrabold leading-tight tracking-[-0.8px] sm:text-[30px]">
          Ringkasan Pondok
        </h1>

        <p className="mt-1 text-[12px] text-[#718077] sm:text-[13px]">
          Keuangan dan operasional
        </p>
      </header>

      {/* FINANCIAL KPI */}
      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        <MetricCard
          label="Saldo santri"
          value={rp(wallet)}
          icon={Wallet}
        />

        <MetricCard
          label="Deposit wali"
          value={rp(totalDeposit)}
          detail={`${deposits.length} deposit`}
          icon={ArrowDownLeft}
          tone="gold"
        />

        <MetricCard
          label="Penjualan koperasi"
          value={rp(sales)}
          detail={`${kasir.sales.length} transaksi`}
          icon={ReceiptText}
        />

        <MetricCard
          label="Sisa tagihan SPP"
          value={rp(outstanding)}
          detail={`${admin.bills.length} tagihan`}
          icon={Coins}
          tone="gold"
        />
      </section>

      {/* CONTENT */}
      <div className="mt-5 grid items-start gap-5 xl:grid-cols-[minmax(0,1.6fr)_minmax(300px,.85fr)]">
        {/* LEFT */}
        <div className="min-w-0 space-y-5">
          {/* SALES CHART */}
          <section className={`${panel} min-w-0 p-4 sm:p-6`}>
            <SectionHeader title="Aktivitas 7 Hari" />

            <SalesChart
              data={chart}
              loading={!today}
            />
          </section>

          {/* RECENT ACTIVITY */}
          <section className={`${panel} min-w-0 overflow-hidden`}>
            <div className="border-b border-[#E6ECE7] px-4 py-4 sm:px-6 sm:py-5">
              <SectionHeader
                title="Aktivitas Terbaru"
                action={
                  <Link
                    href="/manajemen/transaksi"
                    className={`${focus} inline-flex items-center gap-1 text-[12px] font-semibold text-[#105D38] hover:underline`}
                  >
                    Lihat semua
                    <ArrowRight size={16} />
                  </Link>
                }
              />
            </div>

            {rows.length > 0 ? (
              <div className="divide-y divide-[#EDF1ED] px-4 sm:px-6">
                {rows.map((item) => {
                  const isGold =
                    item.type === 'Deposit' ||
                    item.type === 'SPP';

                  const Icon =
                    item.type === 'Deposit'
                      ? ArrowDownLeft
                      : item.type === 'Penarikan'
                        ? ArrowUpRight
                        : item.type === 'SPP'
                          ? Coins
                          : ReceiptText;

                  return (
                    <div
                      key={`${item.type}-${item.id}`}
                      className="flex items-center gap-3 py-4"
                    >
                      <span
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] ${
                          isGold
                            ? 'bg-[#FAF1D8] text-[#967014]'
                            : 'bg-[#ECF7EF] text-[#105D38]'
                        }`}
                      >
                        <Icon
                          size={19}
                          strokeWidth={1.8}
                        />
                      </span>

                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[12px] font-semibold text-[#142019] sm:text-[13px]">
                          {item.type} · {item.name}
                        </p>

                        <p className="mt-1 truncate text-[11px] text-[#819087]">
                          {fmt(item.time)}
                        </p>
                      </div>

                      <p className="shrink-0 whitespace-nowrap text-right text-[12px] font-bold tabular-nums text-[#105D38] sm:text-[13px]">
                        {rp(item.amount)}
                      </p>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center px-5 py-12 text-center">
                <span className="flex h-12 w-12 items-center justify-center rounded-[14px] bg-[#ECF7EF] text-[#105D38]">
                  <ReceiptText size={23} strokeWidth={1.8} />
                </span>

                <p className="mt-3 text-[13px] font-semibold text-[#718077]">
                  Belum ada aktivitas
                </p>
              </div>
            )}
          </section>
        </div>

        {/* RIGHT */}
        <div className="min-w-0 space-y-5">
          {/* COOPERATIVE */}
          <section className="overflow-hidden rounded-[20px] bg-[#105D38] p-5 text-white sm:p-6">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <p className="text-[12px] font-medium text-[#D3E9DA]">
                  Saldo Koperasi
                </p>

                <p className="mt-2 break-words text-[clamp(26px,3vw,35px)] font-extrabold leading-tight tracking-[-1px] tabular-nums [overflow-wrap:anywhere]">
                  {rp(settlement)}
                </p>
              </div>

              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[13px] bg-white/10 text-[#E0B341]">
                <Landmark
                  size={22}
                  strokeWidth={1.8}
                />
              </span>
            </div>

            <div className="mt-6 space-y-3 border-t border-white/20 pt-5">
              <div className="flex items-center justify-between gap-3 text-[12px]">
                <span className="text-[#D3E9DA]">
                  Santri terdaftar
                </span>
                <span className="font-semibold tabular-nums">
                  {kasir.students.length}
                </span>
              </div>

              <div className="flex items-center justify-between gap-3 text-[12px]">
                <span className="text-[#D3E9DA]">
                  Penarikan tercatat
                </span>
                <span className="font-semibold tabular-nums">
                  {kasir.withdrawals.length}
                </span>
              </div>
            </div>

            <Link
              href="/manajemen/penarikan"
              className={`${focus} mt-6 flex h-11 items-center justify-center gap-2 rounded-[12px] bg-[#E0B341] px-4 text-[12px] font-bold text-[#105D38] transition-colors hover:bg-[#EDC354]`}
            >
              Lihat Penarikan
              <ArrowRight size={17} />
            </Link>
          </section>

          {/* SHORTCUTS */}
          <section className={`${panel} p-4 sm:p-6`}>
            <SectionHeader title="Akses Cepat" />

            <div className="mt-4 grid grid-cols-2 gap-3">
              {shortcuts.map((item) => {
                const Icon = item.icon;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`${focus} group flex min-h-[120px] min-w-0 flex-col justify-between rounded-[15px] border border-[#E6ECE7] bg-white p-4 transition-[border-color,background-color,transform] duration-150 hover:border-[#B8D7C2] hover:bg-[#F7FAF8] active:scale-[0.98]`}
                  >
                    <span className="flex h-10 w-10 items-center justify-center rounded-[11px] bg-[#ECF7EF] text-[#105D38]">
                      <Icon
                        size={19}
                        strokeWidth={1.9}
                        aria-hidden="true"
                      />
                    </span>

                    <div className="flex items-end justify-between gap-2">
                      <p className="text-[12px] font-bold leading-snug text-[#142019] sm:text-[13px]">
                        {item.label}
                      </p>

                      <ArrowRight
                        size={16}
                        className="shrink-0 text-[#9CAC9F] transition-colors group-hover:text-[#105D38]"
                      />
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
