
'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  BarChart3,
  Coins,
  Download,
  Landmark,
  ShoppingBag,
  Wallet,
  type LucideIcon,
} from 'lucide-react';

import { useManajemen } from '../components/ManajemenProvider';
import {
  activity,
  exportCSV,
  rp,
  type Category,
} from '../lib/data';

const card = 'rounded-[20px] border border-[#E6ECE7] bg-white';

const focus =
  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#D5A52D]';

type Period = '7' | '30' | '90' | 'all';

function StatCard({
  label,
  value,
  icon: Icon,
  gold = false,
}: {
  label: string;
  value: string;
  icon: LucideIcon;
  gold?: boolean;
}) {
  return (
    <article className={`${card} min-w-0 p-4 sm:p-5 xl:p-6`}>
      <span
        className={`flex h-10 w-10 items-center justify-center rounded-xl ${
          gold
            ? 'bg-[#FAF1D8] text-[#967014]'
            : 'bg-[#ECF7EF] text-[#105D38]'
        }`}
      >
        <Icon size={19} strokeWidth={1.9} />
      </span>

      <p className="mt-4 text-[12px] text-[#718077] sm:text-[13px]">
        {label}
      </p>

      <p className="mt-1 break-words text-[clamp(16px,2.5vw,27px)] font-extrabold leading-snug tracking-[-.7px] tabular-nums text-[#142019] [overflow-wrap:anywhere]">
        {value}
      </p>
    </article>
  );
}

export default function Laporan() {
  const { kasir, admin, deposits } = useManajemen();

  const [period, setPeriod] = useState<Period>('30');

  // FIX: Waktu diambil dari browser setelah mount.
  // Tidak ada new Date() tanpa argumen saat prerender.
  const [currentTime, setCurrentTime] = useState<number | null>(
    null
  );

  useEffect(() => {
    setCurrentTime(Date.now());
  }, []);

  const report = useMemo(() => {
    const isReady = currentTime !== null;

    let cutoff: Date | null = null;

    if (period !== 'all' && currentTime !== null) {
      cutoff = new Date(currentTime);
      cutoff.setDate(cutoff.getDate() - Number(period));
    }

    const relevant = (time: string) => {
      if (period === 'all') return true;

      if (cutoff === null) return false;

      const eventTime = new Date(time).getTime();

      return (
        Number.isFinite(eventTime) &&
        eventTime >= cutoff.getTime()
      );
    };

    const rows = activity(kasir, deposits, admin).filter(
      (event) => relevant(event.time)
    );

    const amount = (type: string) =>
      rows
        .filter((event) => event.type === type)
        .reduce(
          (sum, event) => sum + event.amount,
          0
        );

    const count = (type: string) =>
      rows.filter((event) => event.type === type).length;

    const sales = kasir.sales.filter(
      (sale) => relevant(sale.time)
    );

    const byCategory = (
      ['Kantin', 'Koperasi', 'Lainnya'] as Category[]
    ).map((category) => ({
      category,
      amount: sales.reduce(
        (sum, sale) =>
          sum +
          sale.lines
            .filter(
              (line) => line.category === category
            )
            .reduce(
              (subtotal, line) =>
                subtotal + line.price * line.qty,
              0
            ),
        0
      ),
    }));

    const top = new Map<
      string,
      { count: number; amount: number }
    >();

    sales.forEach((sale) => {
      sale.lines.forEach((line) => {
        const previous = top.get(line.name) ?? {
          count: 0,
          amount: 0,
        };

        top.set(line.name, {
          count: previous.count + line.qty,
          amount:
            previous.amount + line.qty * line.price,
        });
      });
    });

    return {
      ready: period === 'all' || isReady,
      rows,
      deposit: amount('Deposit'),
      sale: amount('Belanja'),
      spp: amount('SPP'),
      withdrawal: amount('Penarikan'),
      depositCount: count('Deposit'),
      saleCount: count('Belanja'),
      sppCount: count('SPP'),
      byCategory,
      products: [...top.entries()]
        .sort((a, b) => b[1].count - a[1].count)
        .slice(0, 7),
    };
  }, [
    kasir,
    admin,
    deposits,
    period,
    currentTime,
  ]);

  const maxCategory = Math.max(
    1,
    ...report.byCategory.map(
      (item) => item.amount
    )
  );

  function download() {
    if (!report.ready || !report.rows.length) return;

    exportCSV(
      'dosi-laporan.csv',
      [
        'Tipe',
        'Waktu',
        'Nama',
        'Keterangan',
        'Nominal',
      ],
      report.rows.map((event) => [
        event.type,
        event.time,
        event.name,
        event.detail,
        event.amount,
      ])
    );
  }

  return (
    <div className="min-w-0 text-[#142019]">
      <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-[24px] font-extrabold tracking-[-.8px] sm:text-[30px]">
            Laporan Keuangan
          </h1>

          <p className="mt-1 text-[12px] text-[#718077] sm:text-[13px]">
            Rekap transaksi pondok
          </p>
        </div>

        <div className="flex w-full items-center gap-2 sm:w-auto">
          <select
            aria-label="Periode laporan"
            value={period}
            onChange={(event) =>
              setPeriod(event.target.value as Period)
            }
            className={`${focus} h-11 min-w-0 flex-1 rounded-xl border border-[#E6ECE7] bg-white px-3 text-[12px] font-semibold text-[#24382B] outline-none focus:border-[#105D38] sm:w-[145px] sm:flex-none`}
          >
            <option value="7">7 hari</option>
            <option value="30">30 hari</option>
            <option value="90">90 hari</option>
            <option value="all">Semua waktu</option>
          </select>

          <button
            type="button"
            disabled={!report.ready || !report.rows.length}
            onClick={download}
            className={`${focus} flex h-11 shrink-0 items-center gap-2 rounded-xl border border-[#E6ECE7] bg-white px-3.5 text-[12px] font-semibold text-[#105D38] hover:bg-[#F7FAF8] disabled:opacity-40`}
          >
            <Download size={17} />
            Ekspor CSV
          </button>
        </div>
      </header>

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        <StatCard
          label="Deposit"
          value={report.ready ? rp(report.deposit) : '-'}
          icon={Wallet}
        />

        <StatCard
          label="Penjualan"
          value={report.ready ? rp(report.sale) : '-'}
          icon={ShoppingBag}
          gold
        />

        <StatCard
          label="SPP dibayar"
          value={report.ready ? rp(report.spp) : '-'}
          icon={Coins}
        />

        <StatCard
          label="Penarikan"
          value={report.ready ? rp(report.withdrawal) : '-'}
          icon={Landmark}
          gold
        />
      </section>

      <div className="mt-5 grid items-start gap-5 xl:grid-cols-[minmax(0,1.2fr)_minmax(290px,.85fr)]">
        {/* PENJUALAN PER KATEGORI */}
        <section className={`${card} min-w-0 p-4 sm:p-6`}>
          <h2 className="text-[16px] font-bold tracking-[-.4px] text-[#142019] sm:text-[18px]">
            Penjualan per Kategori
          </h2>

          <div className="mt-6 space-y-7">
            {report.byCategory.map(
              ({ category, amount }) => {
                const tone =
                  category === 'Kantin'
                    ? 'bg-[#105D38]'
                    : category === 'Koperasi'
                      ? 'bg-[#D5A52D]'
                      : 'bg-[#9CBBA6]';

                const percent =
                  maxCategory > 0
                    ? (amount / maxCategory) * 100
                    : 0;

                return (
                  <div key={category}>
                    <div className="flex items-center justify-between gap-3 text-[12px]">
                      <span className="font-semibold text-[#526459]">
                        {category}
                      </span>

                      <span className="font-bold tabular-nums text-[#105D38]">
                        {report.ready
                          ? rp(amount)
                          : '-'}
                      </span>
                    </div>

                    <div className="mt-2.5 h-2.5 overflow-hidden rounded-full bg-[#EDF2EE]">
                      <div
                        className={`h-full rounded-full transition-[width] duration-500 ${tone}`}
                        style={{
                          width: `${percent}%`,
                        }}
                      />
                    </div>
                  </div>
                );
              }
            )}
          </div>

          <div className="mt-7 flex items-start gap-2.5 rounded-xl bg-[#F6F9F6] px-3.5 py-3">
            <BarChart3
              size={17}
              className="mt-0.5 shrink-0 text-[#105D38]"
            />

            <p className="text-[11px] leading-relaxed text-[#718077]">
              Berdasarkan item transaksi kasir yang tercatat.
            </p>
          </div>
        </section>

        {/* PRODUK TERLARIS */}
        <section className={`${card} min-w-0 p-4 sm:p-6`}>
          <h2 className="text-[16px] font-bold tracking-[-.4px] text-[#142019] sm:text-[18px]">
            Produk Terlaris
          </h2>

          {!report.ready ? (
            <p className="py-12 text-center text-[13px] text-[#718077]">
              Memuat laporan...
            </p>
          ) : report.products.length ? (
            <div className="mt-4 divide-y divide-[#EDF1ED]">
              {report.products.map(
                ([name, stats], index) => (
                  <div
                    key={name}
                    className="flex items-center gap-3 py-3.5 first:pt-2 last:pb-0"
                  >
                    <span
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-[12px] font-bold ${
                        index < 3
                          ? 'bg-[#FAF1D8] text-[#967014]'
                          : 'bg-[#ECF7EF] text-[#105D38]'
                      }`}
                    >
                      {index + 1}
                    </span>

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[12px] font-semibold text-[#24382B] sm:text-[13px]">
                        {name}
                      </p>

                      <p className="mt-1 text-[11px] text-[#819087]">
                        {stats.count} terjual
                      </p>
                    </div>

                    <p className="shrink-0 text-[12px] font-bold tabular-nums text-[#105D38]">
                      {rp(stats.amount)}
                    </p>
                  </div>
                )
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center py-12 text-center">
              <BarChart3
                size={27}
                className="text-[#105D38]"
              />

              <p className="mt-3 text-[13px] font-semibold text-[#718077]">
                Belum ada penjualan
              </p>
            </div>
          )}
        </section>
      </div>

      {/* JUMLAH TRANSAKSI */}
      <section className={`${card} mt-5 p-4 sm:p-6`}>
        <h2 className="text-[16px] font-bold tracking-[-.4px] text-[#142019] sm:text-[18px]">
          Jumlah Transaksi
        </h2>

        <div className="mt-4 grid grid-cols-3 gap-2 sm:gap-3">
          {[
            {
              label: 'Deposit',
              value: report.depositCount,
            },
            {
              label: 'Belanja',
              value: report.saleCount,
            },
            {
              label: 'SPP',
              value: report.sppCount,
            },
          ].map((item) => (
            <div
              key={item.label}
              className="min-w-0 rounded-[14px] bg-[#F6F9F6] p-3 sm:p-4"
            >
              <p className="text-[11px] font-medium text-[#718077]">
                {item.label}
              </p>

              <p className="mt-2 text-[clamp(19px,4vw,27px)] font-extrabold tabular-nums text-[#105D38]">
                {report.ready
                  ? item.value.toLocaleString('id-ID')
                  : '-'}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
