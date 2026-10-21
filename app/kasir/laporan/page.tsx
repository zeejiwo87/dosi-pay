
'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  ChartNoAxesColumn,
  Download,
  ReceiptText,
  ShoppingCart,
  TrendingUp,
  Wallet,
} from 'lucide-react';

import { useKasir } from '../components/KasirProvider';
import {
  card,
  Empty,
  PageTitle,
  SectionHeading,
  Stat,
  control,
} from '../components/UI';

import {
  csvDownload,
  dayKey,
  fmtDate,
  rp,
  type Category,
} from '../lib/data';

export default function Laporan() {
  const { store } = useKasir();

  const [period, setPeriod] = useState('7');

  // Waktu saat ini tidak boleh dibaca selama prerender.
  // Nilainya baru diambil setelah komponen mount.
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    setNow(Date.now());
  }, []);

  const days = period === 'today' ? 1 : Number(period);

  const todayKey = useMemo(() => {
    if (now === null) return null;
    return dayKey(now);
  }, [now]);

  const sales = useMemo(() => {
    // Jangan membaca waktu sekarang saat prerender.
    if (now === null || todayKey === null) {
      return [];
    }

    return store.sales.filter((sale) => {
      if (period === 'today') {
        return dayKey(sale.time) === todayKey;
      }

      const saleTime = new Date(sale.time).getTime();

      return (
        Number.isFinite(saleTime) &&
        saleTime <= now &&
        now - saleTime < days * 86400000
      );
    });
  }, [store.sales, period, days, now, todayKey]);

  const sum = sales.reduce(
    (total, sale) => total + sale.total,
    0
  );

  const avg = sales.length
    ? Math.round(sum / sales.length)
    : 0;

  const categories: Category[] = [
    'Kantin',
    'Koperasi',
    'Lainnya',
  ];

  const byCategory = categories.map((category) => ({
    name: category,
    value: sales
      .flatMap((sale) => sale.lines)
      .filter((line) => line.category === category)
      .reduce(
        (total, line) => total + line.price * line.qty,
        0
      ),
  }));

  // Data grafik dihitung dari waktu yang sudah
  // diperoleh di browser, bukan dari new Date()
  // tanpa argumen saat prerender.
  const dates = useMemo(() => {
    if (now === null) return [];

    return Array.from({ length: days }, (_, index) => {
      const date = new Date(now);

      date.setDate(
        date.getDate() - (days - 1 - index)
      );

      return {
        day: dayKey(date),
        label: new Intl.DateTimeFormat('id-ID', {
          day: 'numeric',
          month: 'short',
          timeZone: 'Asia/Jakarta',
        }).format(date),
      };
    });
  }, [days, now]);

  const chart = dates.map((date) => ({
    ...date,
    value: sales
      .filter((sale) => dayKey(sale.time) === date.day)
      .reduce(
        (total, sale) => total + sale.total,
        0
      ),
  }));

  const max = Math.max(
    1,
    ...chart.map((date) => date.value)
  );

  const products = new Map<
    string,
    { qty: number; sum: number }
  >();

  sales
    .flatMap((sale) => sale.lines)
    .forEach((line) => {
      const product = products.get(line.name) || {
        qty: 0,
        sum: 0,
      };

      products.set(line.name, {
        qty: product.qty + line.qty,
        sum: product.sum + line.price * line.qty,
      });
    });

  const best = [...products.entries()]
    .sort((a, b) => b[1].qty - a[1].qty)
    .slice(0, 6);

  function exportCSV() {
    if (now === null) return;

    csvDownload(
      'dosi-laporan.csv',
      [
        'ID',
        'Tanggal',
        'Santri',
        'NIS',
        'Nominal',
        'Kategori',
      ],
      sales.map((sale) => [
        sale.id,
        fmtDate(sale.time),
        sale.studentName,
        sale.studentId,
        sale.total,
        sale.lines
          .map((line) => line.category)
          .join('|'),
      ])
    );
  }

  return (
    <>
      <PageTitle
        title="Laporan Penjualan"
        description="Rekap transaksi kasir dan kategori belanja"
        action={
          <div className="flex gap-2">
            <select
              value={period}
              onChange={(event) =>
                setPeriod(event.target.value)
              }
              className={`${control} w-[120px]`}
              aria-label="Periode laporan"
            >
              <option value="today">Hari ini</option>
              <option value="7">7 hari</option>
              <option value="30">30 hari</option>
            </select>

            <button
              type="button"
              onClick={exportCSV}
              disabled={now === null}
              className="flex h-11 items-center gap-2 rounded-xl border border-[#DCE8DF] bg-white px-3 text-[12px] font-bold text-[#276C42] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Download size={17} />
              CSV
            </button>
          </div>
        }
      />

      {/* RINGKASAN PENJUALAN */}
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <Stat
          label="Total penjualan"
          value={now === null ? '—' : rp(sum)}
          icon={Wallet}
        />

        <Stat
          label="Transaksi"
          value={
            now === null
              ? '—'
              : String(sales.length)
          }
          icon={ReceiptText}
          tone="mint"
        />

        <Stat
          label="Rata-rata transaksi"
          value={now === null ? '—' : rp(avg)}
          icon={TrendingUp}
          tone="orange"
        />

        <Stat
          label="Santri bertransaksi"
          value={
            now === null
              ? '—'
              : String(
                  new Set(
                    sales.map((sale) => sale.studentId)
                  ).size
                )
          }
          icon={ShoppingCart}
          tone="gray"
        />
      </div>

      {/* GRAFIK DAN KATEGORI */}
      <div className="mt-5 grid gap-4 lg:grid-cols-[minmax(0,1.5fr)_minmax(280px,.8fr)]">
        <section className={`${card} p-4 sm:p-5`}>
          <SectionHeading title="Grafik penjualan" />

          <div className="mt-5 flex h-[180px] items-end gap-[3px] sm:gap-[8px]">
            {chart.map((date, index) => (
              <div
                key={date.day}
                title={`${date.label}: ${rp(date.value)}`}
                className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-[8px]"
              >
                <div className="flex h-[145px] w-full max-w-[38px] items-end overflow-hidden rounded-t-[5px] bg-[#F0F5F1]">
                  <div
                    className="w-full rounded-t-[5px] bg-[#4CD080] transition-[height] duration-500"
                    style={{
                      height: `${
                        date.value > 0
                          ? Math.max(
                              5,
                              (date.value / max) * 100
                            )
                          : 0
                      }%`,
                    }}
                  />
                </div>

                {(days <= 7 || index % 5 === 0) && (
                  <span className="whitespace-nowrap text-[9px] text-[#93A198]">
                    {date.label}
                  </span>
                )}
              </div>
            ))}
          </div>

          <p className="mt-4 text-[10px] text-[#92A198]">
            Grafik mengikuti transaksi demo yang tercatat.
          </p>
        </section>

        <section className={`${card} p-4 sm:p-5`}>
          <SectionHeading title="Kategori penjualan" />

          <div className="mt-4 space-y-5">
            {byCategory.map((category, index) => (
              <div key={category.name}>
                <div className="flex justify-between gap-3 text-[11px]">
                  <span className="font-semibold text-[#657C6A]">
                    {category.name}
                  </span>

                  <span className="font-bold text-[#215636]">
                    {rp(category.value)}
                  </span>
                </div>

                <div className="mt-2 h-[8px] overflow-hidden rounded-full bg-[#EDF3EF]">
                  <div
                    className={`h-full rounded-full transition-[width] duration-500 ${
                      index === 0
                        ? 'bg-[#105D38]'
                        : index === 1
                          ? 'bg-[#4CD080]'
                          : 'bg-[#C9A36C]'
                    }`}
                    style={{
                      width: `${
                        sum
                          ? (category.value / sum) * 100
                          : 0
                      }%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* PRODUK PALING SERING DIBELI */}
      <section className={`${card} mt-4 p-4 sm:p-5`}>
        <SectionHeading title="Menu paling sering dibeli" />

        {best.length ? (
          <div className="divide-y divide-[#EDF2ED]">
            {best.map(([name, product], index) => (
              <div
                key={name}
                className="flex items-center justify-between gap-3 py-3"
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] bg-[#EAF5ED] text-[11px] font-bold text-[#105D38]">
                    {index + 1}
                  </span>

                  <span className="text-[12px] font-semibold text-[#31533C]">
                    {name}
                  </span>
                </div>

                <div className="text-right">
                  <p className="text-[12px] font-bold text-[#105D38]">
                    {rp(product.sum)}
                  </p>

                  <p className="text-[10px] text-[#94A198]">
                    {product.qty} item
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <Empty
            icon={ChartNoAxesColumn}
            title="Belum ada data penjualan"
            detail="Laporan otomatis terisi setelah transaksi pertama."
          />
        )}
      </section>
    </>
  );
}
