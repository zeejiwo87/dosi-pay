
'use client';

import Link from 'next/link';
import {
  ArrowDownLeft,
  ArrowRight,
  ArrowUpRight,
  Coins,
  Download,
  Landmark,
  Wallet,
  type LucideIcon,
} from 'lucide-react';

import { useManajemen } from '../components/ManajemenProvider';

import {
  availableSettlement,
  balanceOf,
  billPaid,
  exportCSV,
  rp,
  salesSum,
  withdrawSum,
} from '../lib/data';

const panel =
  'rounded-[20px] border border-[#E6ECE7] bg-white';

const focus =
  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#D5A52D]';

type StatProps = {
  label: string;
  value: string;
  detail?: string;
  icon: LucideIcon;
  tone?: 'green' | 'gold';
};

function StatCard({
  label,
  value,
  detail,
  icon: Icon,
  tone = 'green',
}: StatProps) {
  return (
    <article className={`${panel} min-w-0 p-4 sm:p-5 xl:p-6`}>
      <div className="flex items-start justify-between gap-2">
        <span
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] ${
            tone === 'gold'
              ? 'bg-[#FAF1D8] text-[#967014]'
              : 'bg-[#ECF7EF] text-[#105D38]'
          }`}
        >
          <Icon size={19} strokeWidth={1.9} aria-hidden="true" />
        </span>
      </div>

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

function SectionTitle({
  title,
}: {
  title: string;
}) {
  return (
    <h2 className="text-[16px] font-bold tracking-[-0.4px] text-[#142019] sm:text-[18px]">
      {title}
    </h2>
  );
}

export default function Keuangan() {
  const { kasir, admin, deposits } = useManajemen();

  const totalDeposit = deposits.reduce(
    (sum, item) => sum + item.depositAmount,
    0
  );

  const totalFees = deposits.length * 5000;
  const sales = salesSum(kasir);
  const cashOut = withdrawSum(kasir);
  const settlement = availableSettlement(kasir);

  const sppPaid = admin.bills.reduce(
    (sum, bill) => sum + billPaid(bill),
    0
  );

  const balance = kasir.students.reduce(
    (sum, student) =>
      sum + balanceOf(kasir, student, deposits),
    0
  );

  const totals = [
    {
      name: 'Deposit masuk',
      value: totalDeposit,
      tag: 'Dana santri',
    },
    {
      name: 'Transaksi belanja',
      value: sales,
      tag: 'Penjualan koperasi',
    },
    {
      name: 'Penarikan koperasi',
      value: cashOut,
      tag: 'Penarikan tercatat',
    },
    {
      name: 'Cicilan SPP',
      value: sppPaid,
      tag: 'Pembayaran SPP',
    },
    {
      name: 'Biaya admin nominal',
      value: totalFees,
      tag: 'Belum terverifikasi',
    },
  ];

  function downloadReport() {
    exportCSV(
      'dosi-rekap-keuangan.csv',
      ['Pos', 'Nominal', 'Keterangan'],
      totals.map((item) => [
        item.name,
        item.value,
        item.tag,
      ])
    );
  }

  return (
    <div className="w-full min-w-0 text-[#142019]">
      {/* HEADER */}
      <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-[24px] font-extrabold leading-tight tracking-[-0.8px] sm:text-[30px]">
            Keuangan Pondok
          </h1>

          <p className="mt-1 text-[12px] text-[#718077] sm:text-[13px]">
            Arus dana dan saldo
          </p>
        </div>

        <button
          type="button"
          onClick={downloadReport}
          className={`${focus} inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-[12px] border border-[#E6ECE7] bg-white px-4 text-[12px] font-semibold text-[#105D38] transition-colors duration-150 hover:border-[#B8D7C2] hover:bg-[#F7FAF8] sm:text-[13px]`}
        >
          <Download size={17} />
          Ekspor CSV
        </button>
      </header>

      {/* FINANCIAL KPIS */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        <StatCard
          label="Saldo santri"
          value={rp(balance)}
          icon={Wallet}
        />

        <StatCard
          label="Deposit tercatat"
          value={rp(totalDeposit)}
          detail={`${deposits.length} deposit`}
          icon={ArrowDownLeft}
          tone="gold"
        />

        <StatCard
          label="Penjualan koperasi"
          value={rp(sales)}
          detail={`${kasir.sales.length} transaksi`}
          icon={ArrowUpRight}
        />

        <StatCard
          label="Tersedia ditarik"
          value={rp(settlement)}
          icon={Landmark}
          tone="gold"
        />
      </div>

      <div className="mt-5 grid items-start gap-5 xl:grid-cols-[minmax(0,1.45fr)_minmax(300px,.85fr)]">
        {/* BOOKKEEPING */}
        <section className={`${panel} min-w-0 p-4 sm:p-6`}>
          <SectionTitle title="Ringkasan Pembukuan" />

          <div className="mt-4 divide-y divide-[#EDF1ED]">
            {totals.map((item) => (
              <div
                key={item.name}
                className="flex items-center justify-between gap-4 py-4 first:pt-2"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-[12px] font-semibold text-[#24382B] sm:text-[13px]">
                    {item.name}
                  </p>

                  <p className="mt-1 text-[11px] text-[#819087]">
                    {item.tag}
                  </p>
                </div>

                <p className="shrink-0 whitespace-nowrap text-right text-[13px] font-bold tabular-nums text-[#105D38] sm:text-[14px]">
                  {rp(item.value)}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-3 rounded-[12px] bg-[#F6F9F6] px-3.5 py-3">
            <p className="text-[11px] leading-relaxed text-[#718077]">
              Biaya admin merupakan nominal simulasi,
              bukan penerimaan bank yang terverifikasi.
            </p>
          </div>
        </section>

        {/* RIGHT COLUMN */}
        <div className="min-w-0 space-y-5">
          {/* COOPERATIVE BALANCE */}
          <section className="overflow-hidden rounded-[20px] bg-[#105D38] p-5 text-white sm:p-6">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[12px] font-medium text-[#D3E9DA]">
                  Kliring Koperasi
                </p>

                <p className="mt-2 break-words text-[clamp(26px,3vw,35px)] font-extrabold leading-tight tracking-[-1px] tabular-nums [overflow-wrap:anywhere]">
                  {rp(settlement)}
                </p>
              </div>

              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[13px] bg-white/10 text-[#E0B341]">
                <Landmark size={21} strokeWidth={1.8} />
              </span>
            </div>

            <div className="mt-6 space-y-3 border-t border-white/20 pt-5">
              <div className="flex items-center justify-between gap-4 text-[12px]">
                <span className="text-[#D3E9DA]">
                  Penjualan
                </span>
                <span className="font-semibold tabular-nums">
                  {rp(sales)}
                </span>
              </div>

              <div className="flex items-center justify-between gap-4 text-[12px]">
                <span className="text-[#D3E9DA]">
                  Penarikan
                </span>
                <span className="font-semibold tabular-nums">
                  {rp(cashOut)}
                </span>
              </div>
            </div>

            <Link
              href="/manajemen/penarikan"
              className={`${focus} mt-6 flex h-11 items-center justify-center gap-2 rounded-[12px] bg-[#E0B341] px-4 text-[12px] font-bold text-[#105D38] transition-colors duration-150 hover:bg-[#EDC354] sm:text-[13px]`}
            >
              Pantau Penarikan
              <ArrowRight size={17} />
            </Link>
          </section>

          {/* SPP */}
          <section className={`${panel} p-5 sm:p-6`}>
            <div className="flex items-center justify-between gap-3">
              <SectionTitle title="SPP Pondok" />

              <span className="flex h-10 w-10 items-center justify-center rounded-[12px] bg-[#FAF1D8] text-[#967014]">
                <Coins size={19} strokeWidth={1.9} />
              </span>
            </div>

            <p className="mt-5 text-[12px] text-[#718077]">
              Pembayaran tercatat
            </p>

            <p className="mt-1 break-words text-[clamp(23px,3vw,30px)] font-extrabold tracking-[-0.8px] tabular-nums text-[#142019] [overflow-wrap:anywhere]">
              {rp(sppPaid)}
            </p>

            <Link
              href="/manajemen/spp"
              className={`${focus} mt-5 flex h-11 items-center justify-between rounded-[12px] border border-[#E6ECE7] px-4 text-[12px] font-semibold text-[#105D38] transition-colors hover:border-[#B8D7C2] hover:bg-[#F7FAF8]`}
            >
              Lihat Tagihan
              <ArrowRight size={17} />
            </Link>
          </section>
        </div>
      </div>
    </div>
  );
}
