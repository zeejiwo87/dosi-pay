
'use client';

import Link from 'next/link';
import { useEffect, useState, type ReactNode } from 'react';
import {
  ArrowRight,
  ChartNoAxesColumn,
  CheckCircle2,
  ClipboardList,
  Download,
  History,
  TrendingUp,
  Wallet,
  type LucideIcon,
} from 'lucide-react';

import { useKasir } from '../components/KasirProvider';
import {
  availableSettlement,
  csvDownload,
  dayKey,
  fmtDate,
  rp,
  totalSales,
  withdrawn,
  withdrawnToday,
} from '../lib/data';

const panel =
  'rounded-[20px] border border-[#E6ECE7] bg-white';

const focus =
  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#D5A52D]';

type StatProps = {
  label: string;
  value: string;
  icon: LucideIcon;
  accent?: 'green' | 'gold';
};

function StatCard({
  label,
  value,
  icon: Icon,
  accent = 'green',
}: StatProps) {
  return (
    <article className={`${panel} min-w-0 p-4 sm:p-5 xl:p-6`}>
      <span
        className={`flex h-10 w-10 items-center justify-center rounded-[12px] ${
          accent === 'gold'
            ? 'bg-[#FAF1D8] text-[#967014]'
            : 'bg-[#ECF7EF] text-[#105D38]'
        }`}
      >
        <Icon size={19} strokeWidth={1.9} aria-hidden="true" />
      </span>

      <p className="mt-4 text-[12px] font-medium text-[#718077] sm:text-[13px]">
        {label}
      </p>

      <p className="mt-1 break-words text-[clamp(17px,2.1vw,26px)] font-extrabold leading-[1.35] tracking-[-0.7px] tabular-nums text-[#142019]">
        {value}
      </p>
    </article>
  );
}

function SectionTitle({
  title,
  action,
}: {
  title: string;
  action?: ReactNode;
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

function InfoRow({
  label,
  value,
  strong = false,
}: {
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <span className="text-[12px] text-[#718077] sm:text-[13px]">
        {label}
      </span>

      <span
        className={`text-right text-[13px] font-semibold tabular-nums sm:text-[14px] ${
          strong ? 'text-[#105D38]' : 'text-[#142019]'
        }`}
      >
        {value}
      </span>
    </div>
  );
}

export default function Saldo() {
  const { store, ready } = useKasir();

  // Waktu sekarang hanya dibaca setelah komponen mount.
  const [todayKey, setTodayKey] = useState<string | null>(null);

  useEffect(() => {
    setTodayKey(dayKey(new Date()));
  }, []);

  const today =
    todayKey === null
      ? []
      : store.sales.filter(
          (sale) => dayKey(sale.time) === todayKey
        );

  const todayAmount = today.reduce(
    (sum, sale) => sum + sale.total,
    0
  );

  const balance = availableSettlement(store);
  const total = totalSales(store);
  const withdrawnAmount = withdrawn(store);

  // Hindari pemanggilan withdrawnToday saat prerender.
  const alreadyWithdrawn =
    todayKey !== null && withdrawnToday(store);

  const withdrawalStatus =
    !ready || todayKey === null
      ? 'Memuat...'
      : alreadyWithdrawn
        ? 'Sudah ditarik'
        : balance > 0
          ? 'Tersedia'
          : 'Belum tersedia';

  const withdrawalDescription = alreadyWithdrawn
    ? 'Penarikan berikutnya besok'
    : balance > 0
      ? 'Dana siap dicatat untuk penarikan'
      : 'Belum ada saldo yang dapat ditarik';

  function exportWithdrawals() {
    if (!ready || !store.withdrawals.length) return;

    csvDownload(
      'dosi-penarikan.csv',
      ['ID', 'Tanggal', 'Nominal', 'Catatan'],
      store.withdrawals.map((item) => [
        item.id,
        fmtDate(item.time),
        item.amount,
        item.note,
      ])
    );
  }

  return (
    <div className="w-full min-w-0 text-[#142019]">
      {/* HEADER */}
      <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-[24px] font-extrabold leading-tight tracking-[-0.8px] sm:text-[30px]">
            Saldo & Kliring
          </h1>

          <p className="mt-1 text-[12px] text-[#718077] sm:text-[13px]">
            Ringkasan dana koperasi
          </p>
        </div>

        <Link
          href="/kasir/penarikan"
          className={`${focus} inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-[12px] bg-[#105D38] px-4 text-[12px] font-semibold text-white transition-colors duration-150 hover:bg-[#0B482B] active:bg-[#083D25] sm:text-[13px]`}
        >
          Penarikan
          <ArrowRight size={17} />
        </Link>
      </header>

      {/* SUMMARY */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        <StatCard
          label="Saldo tersedia"
          value={ready ? rp(balance) : '—'}
          icon={Wallet}
        />

        <StatCard
          label="Penjualan hari ini"
          value={ready && todayKey !== null ? rp(todayAmount) : '—'}
          icon={TrendingUp}
        />

        <StatCard
          label="Total penjualan"
          value={ready ? rp(total) : '—'}
          icon={ChartNoAxesColumn}
          accent="gold"
        />

        <StatCard
          label="Sudah ditarik"
          value={ready ? rp(withdrawnAmount) : '—'}
          icon={ClipboardList}
          accent="gold"
        />
      </div>

      {/* REKONSILIASI DAN STATUS PENARIKAN */}
      <div className="mt-5 grid items-stretch gap-4 xl:grid-cols-2 xl:gap-5">
        {/* REKONSILIASI */}
        <section className={`${panel} min-w-0 p-4 sm:p-6`}>
          <SectionTitle title="Rekonsiliasi Hari Ini" />

          <div className="mt-4 divide-y divide-[#EDF1ED]">
            <InfoRow
              label="Jumlah transaksi"
              value={
                ready && todayKey !== null
                  ? today.length.toLocaleString('id-ID')
                  : '—'
              }
            />

            <InfoRow
              label="Nilai transaksi"
              value={
                ready && todayKey !== null
                  ? rp(todayAmount)
                  : '—'
              }
              strong
            />
          </div>

          <div className="mt-4 flex items-start gap-2.5 rounded-[12px] bg-[#F6F9F6] px-3.5 py-3">
            <CheckCircle2
              size={16}
              className="mt-0.5 shrink-0 text-[#105D38]"
              aria-hidden="true"
            />

            <p className="text-[11px] leading-relaxed text-[#718077] sm:text-[12px]">
              Data pencatatan simulasi, belum terhubung ke bank.
            </p>
          </div>
        </section>

        {/* STATUS PENARIKAN */}
        <section className={`${panel} flex min-w-0 flex-col p-4 sm:p-6`}>
          <SectionTitle title="Status Penarikan" />

          <div className="mt-5 flex flex-1 items-start gap-3">
            <span
              className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-[14px] ${
                alreadyWithdrawn
                  ? 'bg-[#FAF1D8] text-[#967014]'
                  : 'bg-[#ECF7EF] text-[#105D38]'
              }`}
            >
              {alreadyWithdrawn ? (
                <CheckCircle2 size={23} strokeWidth={1.9} />
              ) : (
                <Wallet size={23} strokeWidth={1.9} />
              )}
            </span>

            <div className="min-w-0 flex-1 pt-0.5">
              <p className="text-[14px] font-bold text-[#142019] sm:text-[15px]">
                {withdrawalStatus}
              </p>

              {ready && todayKey !== null && (
                <p className="mt-1 text-[12px] leading-relaxed text-[#718077]">
                  {withdrawalDescription}
                </p>
              )}

              <p className="mt-2 text-[11px] text-[#92A096]">
                Maksimal 1 penarikan per hari (WIB)
              </p>
            </div>
          </div>

          <Link
            href="/kasir/penarikan"
            className={`${focus} mt-5 inline-flex h-11 w-full items-center justify-between rounded-[12px] border border-[#E1EAE3] bg-white px-4 text-[12px] font-semibold text-[#105D38] transition-colors hover:border-[#B8D7C2] hover:bg-[#F7FAF8] sm:text-[13px]`}
          >
            Lihat penarikan
            <ArrowRight size={17} />
          </Link>
        </section>
      </div>

      {/* RIWAYAT PENARIKAN */}
      <section className={`${panel} mt-5 min-w-0 overflow-hidden`}>
        <div className="flex items-center justify-between gap-3 border-b border-[#E6ECE7] px-4 py-4 sm:px-6 sm:py-5">
          <SectionTitle title="Riwayat Penarikan" />

          <button
            type="button"
            onClick={exportWithdrawals}
            disabled={!ready || !store.withdrawals.length}
            className={`${focus} inline-flex h-9 shrink-0 items-center justify-center gap-2 rounded-[10px] border border-[#E6ECE7] bg-white px-3 text-[12px] font-semibold text-[#105D38] transition-colors hover:border-[#B8D7C2] hover:bg-[#F7FAF8] disabled:cursor-not-allowed disabled:opacity-40`}
          >
            <Download size={16} />
            CSV
          </button>
        </div>

        {!ready ? (
          <div className="px-4 py-14 text-center text-[13px] text-[#718077]">
            Memuat data...
          </div>
        ) : store.withdrawals.length === 0 ? (
          <div className="flex flex-col items-center px-5 py-14 text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-[17px] bg-[#ECF7EF] text-[#105D38]">
              <History size={25} strokeWidth={1.8} />
            </span>

            <p className="mt-4 text-[14px] font-bold text-[#142019]">
              Belum ada penarikan
            </p>
          </div>
        ) : (
          <>
            {/* MOBILE LIST */}
            <div className="divide-y divide-[#EDF1ED] md:hidden">
              {store.withdrawals.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-3 px-4 py-4"
                >
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[13px] bg-[#ECF7EF] text-[#105D38]">
                    <Wallet size={20} strokeWidth={1.8} />
                  </span>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-semibold text-[#142019]">
                      {item.note || 'Penarikan koperasi'}
                    </p>

                    <p className="mt-1 truncate text-[11px] text-[#718077]">
                      {fmtDate(item.time)}
                    </p>

                    <p className="mt-1 truncate text-[10px] text-[#9AA69D]">
                      {item.id}
                    </p>
                  </div>

                  <div className="shrink-0 text-right">
                    <p className="text-[13px] font-bold tabular-nums text-[#105D38]">
                      {rp(item.amount)}
                    </p>

                    <p className="mt-1 text-[10px] font-medium text-[#819087]">
                      Tercatat
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* DESKTOP TABLE */}
            <div className="hidden md:block">
              <table className="w-full table-fixed border-collapse text-left">
                <thead>
                  <tr className="border-b border-[#E6ECE7] bg-[#FAFCFA] text-[11px] text-[#718077]">
                    <th className="w-[24%] px-6 py-3.5 font-semibold">
                      Tanggal
                    </th>

                    <th className="w-[23%] px-3 py-3.5 font-semibold">
                      ID Penarikan
                    </th>

                    <th className="w-[28%] px-3 py-3.5 font-semibold">
                      Catatan
                    </th>

                    <th className="w-[25%] px-6 py-3.5 text-right font-semibold">
                      Nominal
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-[#EDF1ED]">
                  {store.withdrawals.map((item) => (
                    <tr
                      key={item.id}
                      className="transition-colors duration-150 hover:bg-[#F8FBF8]"
                    >
                      <td className="px-6 py-4 text-[12px] text-[#718077]">
                        {fmtDate(item.time)}
                      </td>

                      <td className="truncate px-3 py-4 text-[12px] font-semibold text-[#142019]">
                        {item.id}
                      </td>

                      <td className="truncate px-3 py-4 text-[12px] text-[#718077]">
                        {item.note || 'Penarikan koperasi'}
                      </td>

                      <td className="whitespace-nowrap px-6 py-4 text-right text-[13px] font-bold tabular-nums text-[#105D38]">
                        {rp(item.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </section>
    </div>
  );
}
