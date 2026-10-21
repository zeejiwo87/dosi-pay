
'use client';

import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  ArrowDownLeft,
  ArrowRight,
  ArrowUpRight,
  CalendarDays,
  Coins,
  Download,
  ReceiptText,
  Search,
  X,
} from 'lucide-react';

import { useManajemen } from '../components/ManajemenProvider';
import {
  activity,
  exportCSV,
  fmt,
  rp,
  type Activity,
} from '../lib/data';

const card = 'rounded-[20px] border border-[#E6ECE7] bg-white';

const focus =
  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#D5A52D]';

const field = `h-11 w-full rounded-xl border border-[#E1E9E3] bg-white px-3 text-[13px] text-[#24382B] outline-none focus:border-[#105D38] ${focus}`;

function ActivityIcon({ type }: { type: string }) {
  const gold = type === 'Deposit' || type === 'SPP';

  const Icon =
    type === 'Deposit'
      ? ArrowDownLeft
      : type === 'Penarikan'
        ? ArrowUpRight
        : type === 'SPP'
          ? Coins
          : ReceiptText;

  return (
    <span
      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
        gold
          ? 'bg-[#FAF1D8] text-[#967014]'
          : 'bg-[#ECF7EF] text-[#105D38]'
      }`}
    >
      <Icon size={19} strokeWidth={1.8} />
    </span>
  );
}

function TypeTag({ type }: { type: string }) {
  const gold = type === 'Deposit' || type === 'SPP';

  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${
        gold
          ? 'bg-[#FAF1D8] text-[#967014]'
          : 'bg-[#ECF7EF] text-[#105D38]'
      }`}
    >
      {type}
    </span>
  );
}

function Detail({
  item,
  close,
}: {
  item: Activity;
  close: () => void;
}) {
  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    function escape(event: KeyboardEvent) {
      if (event.key === 'Escape') close();
    }

    document.addEventListener('keydown', escape);

    return () => {
      document.body.style.overflow = previous;
      document.removeEventListener('keydown', escape);
    };
  }, [close]);

  if (typeof document === 'undefined') return null;

  const fields = [
    ['Jenis', item.type],
    ['ID Transaksi', item.id],
    ['Waktu', fmt(item.time)],
    ['Nama', item.name],
    ['Keterangan', item.detail || '-'],
  ];

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center sm:p-5">
      <button
        type="button"
        aria-label="Tutup detail"
        onClick={close}
        className="absolute inset-0 bg-[#102719]/50"
      />

      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="activity-detail-title"
        className="relative flex max-h-[92dvh] w-full flex-col overflow-hidden rounded-t-[24px] bg-white sm:max-w-[470px] sm:rounded-[22px]"
      >
        <div className="flex items-center justify-between border-b border-[#E6ECE7] px-5 py-4 sm:px-6">
          <h2
            id="activity-detail-title"
            className="text-[17px] font-bold text-[#142019]"
          >
            Detail Transaksi
          </h2>

          <button
            type="button"
            onClick={close}
            aria-label="Tutup"
            className={`${focus} flex h-9 w-9 items-center justify-center rounded-xl bg-[#F3F7F4] text-[#506157]`}
          >
            <X size={19} />
          </button>
        </div>

        <div className="min-h-0 overflow-y-auto px-5 py-5 sm:px-6">
          <div className="flex items-center justify-between gap-3 rounded-2xl bg-[#F7FAF8] p-4">
            <div>
              <p className="text-[11px] text-[#718077]">
                Nominal
              </p>
              <p className="mt-1 text-[25px] font-extrabold tracking-[-.7px] text-[#105D38]">
                {rp(item.amount)}
              </p>
            </div>

            <TypeTag type={item.type} />
          </div>

          <dl className="mt-4 divide-y divide-[#EDF1ED]">
            {fields.map(([label, value]) => (
              <div
                key={label}
                className="flex justify-between gap-4 py-3.5 text-[12px]"
              >
                <dt className="shrink-0 text-[#718077]">
                  {label}
                </dt>

                <dd className="min-w-0 break-words text-right font-semibold text-[#24382B]">
                  {value}
                </dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="border-t border-[#E6ECE7] px-5 pb-[calc(16px+env(safe-area-inset-bottom))] pt-4 sm:px-6 sm:pb-5">
          <button
            type="button"
            onClick={close}
            className={`${focus} h-11 w-full rounded-xl bg-[#105D38] text-[13px] font-semibold text-white hover:bg-[#0B482B]`}
          >
            Tutup
          </button>
        </div>
      </section>
    </div>,
    document.body
  );
}

export default function Transaksi() {
  const { kasir, deposits, admin } = useManajemen();

  const [query, setQuery] = useState('');
  const [type, setType] = useState('Semua');
  const [period, setPeriod] = useState('Semua');
  const [picked, setPicked] = useState<Activity | null>(null);

  // FIX: Waktu sekarang hanya diambil setelah halaman
  // dimuat di browser, bukan ketika prerender.
  const [currentTime, setCurrentTime] = useState<number | null>(
    null
  );

  useEffect(() => {
    setCurrentTime(Date.now());
  }, []);

  const events = useMemo(() => {
    const keyword = query.trim().toLowerCase();

    // Untuk filter tanggal, tunggu sampai waktu browser tersedia.
    if (period !== 'Semua' && currentTime === null) {
      return [];
    }

    let cutoff: Date | null = null;

    if (period !== 'Semua' && currentTime !== null) {
      cutoff = new Date(currentTime);

      cutoff.setDate(
        cutoff.getDate() - (period === '7 hari' ? 7 : 30)
      );
    }

    return activity(kasir, deposits, admin).filter(
      (event) => {
        const matchesType =
          type === 'Semua' || event.type === type;

        const matchesPeriod =
          cutoff === null ||
          new Date(event.time).getTime() >= cutoff.getTime();

        const matchesSearch = `${event.name} ${event.detail} ${event.id}`
          .toLowerCase()
          .includes(keyword);

        return (
          matchesType &&
          matchesPeriod &&
          matchesSearch
        );
      }
    );
  }, [
    kasir,
    deposits,
    admin,
    query,
    type,
    period,
    currentTime,
  ]);

  const total = events.reduce(
    (sum, event) => sum + event.amount,
    0
  );

  function download() {
    if (!events.length) return;

    exportCSV(
      'dosi-transaksi.csv',
      [
        'ID',
        'Jenis',
        'Tanggal',
        'Nama',
        'Detail',
        'Nominal',
      ],
      events.map((event) => [
        event.id,
        event.type,
        fmt(event.time),
        event.name,
        event.detail,
        event.amount,
      ])
    );
  }

  return (
    <div className="min-w-0 text-[#142019]">
      <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-[24px] font-extrabold tracking-[-.8px] sm:text-[30px]">
            Transaksi
          </h1>

          <p className="mt-1 text-[12px] text-[#718077] sm:text-[13px]">
            Riwayat aktivitas keuangan
          </p>
        </div>

        <button
          type="button"
          disabled={
            !events.length ||
            (period !== 'Semua' && currentTime === null)
          }
          onClick={download}
          className={`${focus} inline-flex h-11 items-center gap-2 rounded-xl border border-[#E6ECE7] px-4 text-[12px] font-semibold text-[#105D38] hover:bg-[#F7FAF8] disabled:opacity-40`}
        >
          <Download size={17} />
          Ekspor CSV
        </button>
      </header>

      <section className={`${card} min-w-0 overflow-hidden`}>
        <div className="flex items-center justify-between gap-3 border-b border-[#E6ECE7] px-4 py-4 sm:px-5">
          <div>
            <p className="text-[12px] text-[#718077]">
              Aktivitas
            </p>

            <p className="mt-1 text-[21px] font-extrabold tabular-nums text-[#142019]">
              {events.length.toLocaleString('id-ID')}
            </p>
          </div>

          <div className="min-w-0 text-right">
            <p className="text-[12px] text-[#718077]">
              Total nominal
            </p>

            <p className="mt-1 break-words text-[clamp(17px,4vw,23px)] font-extrabold tabular-nums text-[#105D38]">
              {rp(total)}
            </p>
          </div>
        </div>

        <div className="grid gap-3 border-b border-[#E6ECE7] p-4 sm:grid-cols-[minmax(0,1fr)_150px_140px] sm:p-5">
          <div className="relative">
            <Search
              size={18}
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#91A096]"
            />

            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              type="search"
              aria-label="Cari transaksi"
              placeholder="Cari nama atau ID transaksi"
              className={`${field} pl-10`}
            />
          </div>

          <select
            value={type}
            onChange={(event) => setType(event.target.value)}
            aria-label="Jenis transaksi"
            className={field}
          >
            {[
              'Semua',
              'Deposit',
              'Belanja',
              'SPP',
              'Penarikan',
            ].map((option) => (
              <option key={option}>{option}</option>
            ))}
          </select>

          <div className="relative">
            <CalendarDays
              size={16}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#718077]"
            />

            <select
              value={period}
              onChange={(event) =>
                setPeriod(event.target.value)
              }
              aria-label="Periode"
              className={`${field} pl-9`}
            >
              {['Semua', '7 hari', '30 hari'].map(
                (option) => (
                  <option key={option}>{option}</option>
                )
              )}
            </select>
          </div>
        </div>

        {period !== 'Semua' && currentTime === null ? (
          <div className="px-5 py-14 text-center text-[13px] text-[#718077]">
            Memuat transaksi...
          </div>
        ) : !events.length ? (
          <div className="flex flex-col items-center px-5 py-14 text-center">
            <ReceiptText
              size={27}
              className="text-[#105D38]"
            />

            <p className="mt-3 text-[13px] font-semibold text-[#142019]">
              Tidak ada transaksi
            </p>

            {(query ||
              type !== 'Semua' ||
              period !== 'Semua') && (
              <button
                type="button"
                onClick={() => {
                  setQuery('');
                  setType('Semua');
                  setPeriod('Semua');
                }}
                className="mt-3 text-[12px] font-semibold text-[#105D38]"
              >
                Reset filter
              </button>
            )}
          </div>
        ) : (
          <>
            {/* MOBILE */}
            <div className="divide-y divide-[#EDF1ED] lg:hidden">
              {events.map((event) => (
                <button
                  key={`${event.type}-${event.id}`}
                  type="button"
                  onClick={() => setPicked(event)}
                  className={`${focus} flex w-full items-center gap-3 px-4 py-4 text-left hover:bg-[#F7FAF8] active:bg-[#ECF7EF]`}
                >
                  <ActivityIcon type={event.type} />

                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13px] font-bold text-[#142019]">
                      {event.name}
                    </span>

                    <span className="mt-1 block truncate text-[11px] text-[#718077]">
                      {event.type} · {event.detail || event.id}
                    </span>

                    <span className="mt-1 block text-[10px] text-[#91A096]">
                      {fmt(event.time)}
                    </span>
                  </span>

                  <span className="flex shrink-0 items-center gap-1.5">
                    <span className="max-w-[125px] text-right text-[12px] font-bold tabular-nums text-[#105D38]">
                      {rp(event.amount)}
                    </span>

                    <ArrowRight
                      size={15}
                      className="text-[#A7B4AA]"
                    />
                  </span>
                </button>
              ))}
            </div>

            {/* DESKTOP */}
            <div className="hidden lg:block">
              <table className="w-full table-fixed border-collapse text-left">
                <thead className="bg-[#FAFCFA] text-[11px] text-[#718077]">
                  <tr>
                    <th className="w-[19%] px-5 py-3.5 font-semibold">
                      Waktu
                    </th>
                    <th className="w-[13%] px-2 py-3.5 font-semibold">
                      Jenis
                    </th>
                    <th className="w-[19%] px-2 py-3.5 font-semibold">
                      Nama
                    </th>
                    <th className="w-[23%] px-2 py-3.5 font-semibold">
                      Detail
                    </th>
                    <th className="w-[16%] px-2 py-3.5 font-semibold">
                      Nominal
                    </th>
                    <th className="w-[10%] px-5 py-3.5 text-right font-semibold">
                      Aksi
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-[#EDF1ED]">
                  {events.map((event) => (
                    <tr
                      key={`${event.type}-${event.id}`}
                      className="hover:bg-[#F8FBF8]"
                    >
                      <td className="px-5 py-4 text-[12px] text-[#718077]">
                        {fmt(event.time)}
                      </td>

                      <td className="px-2 py-4">
                        <TypeTag type={event.type} />
                      </td>

                      <td className="truncate px-2 py-4 text-[12px] font-semibold">
                        {event.name}
                      </td>

                      <td className="truncate px-2 py-4 text-[12px] text-[#718077]">
                        {event.detail}
                      </td>

                      <td className="whitespace-nowrap px-2 py-4 text-[12px] font-bold tabular-nums text-[#105D38]">
                        {rp(event.amount)}
                      </td>

                      <td className="px-5 py-4 text-right">
                        <button
                          type="button"
                          onClick={() => setPicked(event)}
                          className={`${focus} rounded-lg border border-[#DDE9E0] px-2.5 py-2 text-[11px] font-semibold text-[#105D38] hover:bg-[#ECF7EF]`}
                        >
                          Lihat
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </section>

      {picked && (
        <Detail
          item={picked}
          close={() => setPicked(null)}
        />
      )}
    </div>
  );
}
