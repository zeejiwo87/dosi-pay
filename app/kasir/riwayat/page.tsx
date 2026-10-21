
'use client';

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import {
  ArrowRight,
  CalendarDays,
  Check,
  ChevronDown,
  Download,
  History,
  Printer,
  ReceiptText,
  Search,
  ShoppingBag,
  X,
} from 'lucide-react';

import { useKasir } from '../components/KasirProvider';
import {
  csvDownload,
  dayKey,
  fmtDate,
  rp,
  KEY,
  type Sale,
} from '../lib/data';

type Period = 'semua' | 'hari-ini' | '7-hari';

const panel =
  'rounded-[20px] border border-[#E6ECE7] bg-white';

const focus =
  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#D5A52D]';

function purchaseName(sale: Sale) {
  if (!sale.lines.length) return 'Transaksi';

  const first = sale.lines[0].name;
  const extra = sale.lines.length - 1;

  return extra ? `${first} +${extra} lainnya` : first;
}

function Status() {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-[#ECF7EF] px-2.5 py-1 text-[11px] font-semibold text-[#105D38]">
      <Check size={12} strokeWidth={2.5} />
      Berhasil
    </span>
  );
}

function SummaryCard({
  label,
  value,
  icon: Icon,
  gold = false,
}: {
  label: string;
  value: string;
  icon: typeof History;
  gold?: boolean;
}) {
  return (
    <article className={`${panel} min-w-0 p-4 sm:p-5`}>
      <div className="flex items-start justify-between gap-2">
        <span
          className={`flex h-10 w-10 items-center justify-center rounded-[12px] ${
            gold
              ? 'bg-[#FAF1D8] text-[#967014]'
              : 'bg-[#ECF7EF] text-[#105D38]'
          }`}
        >
          <Icon size={19} strokeWidth={1.9} />
        </span>
      </div>

      <p className="mt-4 text-[12px] font-medium text-[#718077] sm:text-[13px]">
        {label}
      </p>

      <p className="mt-1 break-words text-[clamp(16px,4vw,27px)] font-extrabold leading-tight tracking-[-0.7px] tabular-nums text-[#142019]">
        {value}
      </p>
    </article>
  );
}

function ReceiptDetail({ sale }: { sale: Sale }) {
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3 rounded-[14px] bg-[#F5F9F6] px-3.5 py-3">
        <div className="min-w-0">
          <p className="text-[11px] text-[#718077]">
            Status pembayaran
          </p>
          <p className="mt-1 text-[12px] font-semibold text-[#142019]">
            {fmtDate(sale.time)}
          </p>
        </div>
        <Status />
      </div>

      <div className="space-y-3.5 text-[13px]">
        <div className="flex justify-between gap-4">
          <span className="shrink-0 text-[#718077]">
            ID transaksi
          </span>
          <span className="break-all text-right font-semibold text-[#142019]">
            {sale.id}
          </span>
        </div>

        <div className="flex justify-between gap-4">
          <span className="text-[#718077]">Santri</span>
          <span className="text-right font-semibold text-[#142019]">
            {sale.studentName}
          </span>
        </div>

        <div className="flex justify-between gap-4">
          <span className="text-[#718077]">NIS</span>
          <span className="text-right font-medium text-[#142019]">
            {sale.studentId}
          </span>
        </div>

        <div className="flex justify-between gap-4">
          <span className="text-[#718077]">Kasir</span>
          <span className="text-right font-medium text-[#142019]">
            {sale.cashier}
          </span>
        </div>

        <div className="flex justify-between gap-4">
          <span className="text-[#718077]">Metode</span>
          <span className="text-right font-medium text-[#142019]">
            Sidik jari (simulasi)
          </span>
        </div>
      </div>

      <div>
        <h3 className="mb-3 text-[13px] font-bold text-[#142019]">
          Rincian belanja
        </h3>

        <div className="divide-y divide-[#EDF1ED] border-y border-[#E6ECE7]">
          {sale.lines.map((line, index) => (
            <div
              key={index}
              className="flex items-start justify-between gap-4 py-3.5"
            >
              <div className="min-w-0">
                <p className="break-words text-[13px] font-semibold text-[#24382B]">
                  {line.name}
                </p>
                <p className="mt-1 text-[11px] text-[#819087]">
                  {line.qty} × {rp(line.price)}
                </p>
              </div>

              <p className="shrink-0 text-[13px] font-semibold tabular-nums text-[#142019]">
                {rp(line.qty * line.price)}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between gap-3">
        <span className="text-[14px] font-semibold text-[#142019]">
          Total pembayaran
        </span>
        <span className="text-[23px] font-extrabold tracking-[-0.7px] tabular-nums text-[#105D38]">
          {rp(sale.total)}
        </span>
      </div>
    </div>
  );
}

function DetailModal({
  sale,
  onClose,
}: {
  sale: Sale;
  onClose: () => void;
}) {
  const router = useRouter();
  const [error, setError] = useState('');
  const closeRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    const previousFocus = document.activeElement as HTMLElement | null;

    document.body.style.overflow = 'hidden';

    const frame = requestAnimationFrame(() => {
      closeRef.current?.focus();
    });

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
        return;
      }

      if (event.key !== 'Tab' || !dialogRef.current) return;

      const elements = Array.from(
        dialogRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), [tabindex="0"]'
        )
      );

      if (!elements.length) return;

      const first = elements[0];
      const last = elements[elements.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (
        !event.shiftKey &&
        document.activeElement === last
      ) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', onKeyDown);

    return () => {
      cancelAnimationFrame(frame);
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', onKeyDown);
      previousFocus?.focus();
    };
  }, [onClose]);

  function openReceipt() {
    try {
      sessionStorage.setItem(
        KEY.lastSale,
        JSON.stringify(sale)
      );

      router.push('/kasir/transaksi/berhasil');
    } catch {
      setError('Struk tidak dapat dibuka.');
    }
  }

  if (typeof document === 'undefined') return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center sm:p-5">
      <button
        type="button"
        aria-label="Tutup detail transaksi"
        onClick={onClose}
        className="dosi-receipt-backdrop absolute inset-0 bg-[#0F2419]/50"
      />

      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="receipt-title"
        className="dosi-receipt-sheet relative flex max-h-[92dvh] w-full flex-col overflow-hidden rounded-t-[24px] border border-[#E6ECE7] bg-white sm:max-w-[480px] sm:rounded-[22px]"
      >
        <div className="flex shrink-0 items-center justify-between border-b border-[#E6ECE7] px-5 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-[12px] bg-[#ECF7EF] text-[#105D38]">
              <ReceiptText size={19} />
            </span>

            <h2
              id="receipt-title"
              className="text-[17px] font-bold tracking-[-0.4px] text-[#142019]"
            >
              Detail Transaksi
            </h2>
          </div>

          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="Tutup"
            className={`${focus} flex h-9 w-9 items-center justify-center rounded-[11px] bg-[#F3F6F3] text-[#506157] hover:bg-[#E8F1EA]`}
          >
            <X size={18} />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-6">
          <ReceiptDetail sale={sale} />
        </div>

        <div className="shrink-0 border-t border-[#E6ECE7] bg-white px-5 pb-[calc(16px+env(safe-area-inset-bottom))] pt-4 sm:px-6 sm:pb-5">
          {error && (
            <p className="mb-3 text-[12px] font-medium text-[#B44747]">
              {error}
            </p>
          )}

          <button
            type="button"
            onClick={openReceipt}
            className={`${focus} flex h-12 w-full items-center justify-center gap-2 rounded-[13px] bg-[#105D38] text-[13px] font-semibold text-white transition-colors duration-150 hover:bg-[#0B482B] active:bg-[#083D25]`}
          >
            <Printer size={18} />
            Buka Struk & Cetak
            <ArrowRight size={16} />
          </button>
        </div>
      </div>

      <style jsx global>{`
        @keyframes dosiReceiptIn {
          from {
            opacity: 0;
            transform: translateY(16px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes dosiBackdropIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        .dosi-receipt-sheet {
          animation: dosiReceiptIn 180ms ease-out both;
        }

        .dosi-receipt-backdrop {
          animation: dosiBackdropIn 160ms ease-out both;
        }

        @media (prefers-reduced-motion: reduce) {
          .dosi-receipt-sheet,
          .dosi-receipt-backdrop {
            animation: none !important;
          }
        }
      `}</style>
    </div>,
    document.body
  );
}

export default function Riwayat() {
  const { store, ready } = useKasir();

  const [search, setSearch] = useState('');
  const [period, setPeriod] = useState<Period>('semua');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    const id = new URLSearchParams(
      window.location.search
    ).get('id');

    if (id) setSelectedId(id);
  }, []);

  const closeDetail = useCallback(() => {
    setSelectedId(null);

    const url = new URL(window.location.href);

    if (url.searchParams.has('id')) {
      url.searchParams.delete('id');

      window.history.replaceState(
        window.history.state,
        '',
        `${url.pathname}${url.search}${url.hash}`
      );
    }
  }, []);

  const detail = store.sales.find(
    (sale) => sale.id === selectedId
  ) ?? null;

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    const today = dayKey();
    const now = Date.now();

    return store.sales.filter((sale) => {
      const searchable = [
        sale.id,
        sale.studentName,
        sale.studentId,
        ...sale.lines.map((line) => line.name),
      ]
        .join(' ')
        .toLowerCase();

      const matchesSearch = searchable.includes(query);

      const matchesDate =
        period === 'semua' ||
        (period === 'hari-ini' &&
          dayKey(sale.time) === today) ||
        (period === '7-hari' &&
          now - new Date(sale.time).getTime() < 7 * 86400000);

      return matchesSearch && matchesDate;
    });
  }, [store.sales, search, period]);

  const total = filtered.reduce(
    (sum, sale) => sum + sale.total,
    0
  );

  function exportCSV() {
    csvDownload(
      'dosi-riwayat-transaksi.csv',
      ['ID', 'Tanggal', 'NIS', 'Santri', 'Total', 'Metode'],
      filtered.map((sale) => [
        sale.id,
        fmtDate(sale.time),
        sale.studentId,
        sale.studentName,
        sale.total,
        'Sidik jari demo',
      ])
    );
  }

  return (
    <div className="w-full min-w-0 text-[#142019]">
      {/* HEADER */}
      <header className="mb-6 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-[24px] font-extrabold leading-tight tracking-[-0.8px] sm:text-[30px]">
            Riwayat Transaksi
          </h1>
          <p className="mt-1 text-[12px] text-[#718077] sm:text-[13px]">
            Catatan pembayaran santri
          </p>
        </div>

        <button
          type="button"
          onClick={exportCSV}
          disabled={!ready || filtered.length === 0}
          className={`${focus} inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-[12px] border border-[#E6ECE7] bg-white px-3 text-[12px] font-semibold text-[#105D38] transition-colors hover:border-[#B6D3C0] hover:bg-[#F7FAF8] disabled:cursor-not-allowed disabled:opacity-40 sm:h-11 sm:px-4 sm:text-[13px]`}
        >
          <Download size={16} />
          <span>Export CSV</span>
        </button>
      </header>

      {/* SUMMARY */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        <SummaryCard
          label="Total transaksi"
          value={ready ? filtered.length.toLocaleString('id-ID') : '—'}
          icon={ReceiptText}
        />

        <SummaryCard
          label="Total pembayaran"
          value={ready ? rp(total) : '—'}
          icon={ShoppingBag}
          gold
        />
      </div>

      {/* TRANSACTION LIST */}
      <section className={`${panel} mt-5 min-w-0 overflow-hidden`}>
        {/* SEARCH & FILTER */}
        <div className="flex flex-col gap-3 border-b border-[#E6ECE7] p-4 sm:flex-row sm:items-center sm:p-5">
          <div className="relative min-w-0 flex-1">
            <Search
              size={18}
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#86968B]"
            />

            <input
              type="search"
              aria-label="Cari transaksi"
              placeholder="Cari santri atau transaksi"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className={`${focus} h-11 w-full rounded-[12px] border border-[#E6ECE7] bg-white pl-11 pr-4 text-[13px] text-[#142019] outline-none placeholder:text-[#9BA79E] focus:border-[#105D38]`}
            />
          </div>

          <div className="relative shrink-0">
            <CalendarDays
              size={16}
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#718077]"
            />

            <select
              aria-label="Filter periode"
              value={period}
              onChange={(event) =>
                setPeriod(event.target.value as Period)
              }
              className={`${focus} h-11 w-full cursor-pointer appearance-none rounded-[12px] border border-[#E6ECE7] bg-white pl-10 pr-10 text-[12px] font-semibold text-[#34473B] outline-none focus:border-[#105D38] sm:w-[185px] sm:text-[13px]`}
            >
              <option value="semua">Semua periode</option>
              <option value="hari-ini">Hari ini</option>
              <option value="7-hari">7 hari terakhir</option>
            </select>

            <ChevronDown
              size={16}
              className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#718077]"
            />
          </div>
        </div>

        {!ready ? (
          <div className="px-4 py-16 text-center text-[13px] text-[#718077]">
            Memuat transaksi...
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center px-5 py-14 text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-[17px] bg-[#ECF7EF] text-[#105D38]">
              <History size={25} strokeWidth={1.7} />
            </span>

            <p className="mt-4 text-[14px] font-bold text-[#142019]">
              Tidak ada transaksi
            </p>

            {(search || period !== 'semua') && (
              <button
                type="button"
                onClick={() => {
                  setSearch('');
                  setPeriod('semua');
                }}
                className={`${focus} mt-3 text-[12px] font-semibold text-[#105D38] hover:underline`}
              >
                Reset filter
              </button>
            )}
          </div>
        ) : (
          <>
            {/* MOBILE: CLICKABLE TRANSACTION LIST */}
            <div className="divide-y divide-[#EDF1ED] lg:hidden">
              {filtered.map((sale) => (
                <button
                  key={sale.id}
                  type="button"
                  onClick={() => setSelectedId(sale.id)}
                  className={`${focus} flex w-full items-center gap-3 px-4 py-4 text-left transition-colors duration-150 hover:bg-[#F7FAF8] active:bg-[#ECF7EF] sm:px-5`}
                >
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[13px] bg-[#ECF7EF] text-[#105D38]">
                    <ShoppingBag size={20} strokeWidth={1.8} />
                  </span>

                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13px] font-bold text-[#142019]">
                      {sale.studentName}
                    </span>

                    <span className="mt-1 block truncate text-[11px] text-[#718077]">
                      {purchaseName(sale)}
                    </span>

                    <span className="mt-1 block truncate text-[10px] text-[#9AA69D]">
                      {fmtDate(sale.time)}
                    </span>
                  </span>

                  <span className="flex shrink-0 items-center gap-1.5">
                    <span className="text-right">
                      <span className="block whitespace-nowrap text-[13px] font-extrabold tabular-nums text-[#105D38]">
                        {rp(sale.total)}
                      </span>
                      <span className="mt-1 block text-right text-[10px] font-medium text-[#348252]">
                        Berhasil
                      </span>
                    </span>

                    <ArrowRight
                      size={15}
                      className="text-[#B1BDB4]"
                    />
                  </span>
                </button>
              ))}
            </div>

            {/* DESKTOP: TABLE */}
            <div className="hidden lg:block">
              <table className="w-full table-fixed border-collapse text-left">
                <thead>
                  <tr className="border-b border-[#E6ECE7] bg-[#FAFCFA] text-[11px] font-semibold text-[#718077]">
                    <th className="w-[19%] px-5 py-3.5 font-semibold">
                      Tanggal
                    </th>
                    <th className="w-[23%] px-3 py-3.5 font-semibold">
                      Santri
                    </th>
                    <th className="w-[23%] px-3 py-3.5 font-semibold">
                      Belanja
                    </th>
                    <th className="w-[15%] px-3 py-3.5 font-semibold">
                      Total
                    </th>
                    <th className="w-[12%] px-3 py-3.5 font-semibold">
                      Status
                    </th>
                    <th className="w-[8%] px-5 py-3.5 text-right font-semibold">
                      Aksi
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-[#EDF1ED]">
                  {filtered.map((sale) => (
                    <tr
                      key={sale.id}
                      className="transition-colors duration-150 hover:bg-[#F8FBF8]"
                    >
                      <td className="px-5 py-4 text-[12px] text-[#718077]">
                        {fmtDate(sale.time)}
                      </td>

                      <td className="px-3 py-4">
                        <p className="truncate text-[13px] font-semibold text-[#142019]">
                          {sale.studentName}
                        </p>
                        <p className="mt-1 truncate text-[11px] text-[#92A096]">
                          {sale.studentId}
                        </p>
                      </td>

                      <td className="truncate px-3 py-4 text-[12px] text-[#647568]">
                        {purchaseName(sale)}
                      </td>

                      <td className="whitespace-nowrap px-3 py-4 text-[13px] font-bold tabular-nums text-[#105D38]">
                        {rp(sale.total)}
                      </td>

                      <td className="px-3 py-4">
                        <Status />
                      </td>

                      <td className="px-5 py-4 text-right">
                        <button
                          type="button"
                          onClick={() => setSelectedId(sale.id)}
                          className={`${focus} rounded-[9px] border border-[#DDE9E0] px-3 py-2 text-[11px] font-semibold text-[#105D38] transition-colors hover:border-[#105D38] hover:bg-[#ECF7EF]`}
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

      {detail && (
        <DetailModal sale={detail} onClose={closeDetail} />
      )}
    </div>
  );
}
