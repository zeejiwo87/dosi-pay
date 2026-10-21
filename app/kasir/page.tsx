'use client';

import Link from 'next/link';
import { Plus_Jakarta_Sans } from 'next/font/google';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import {
  ArrowRight,
  ArrowUpRight,
  CalendarDays,
  ChartNoAxesCombined,
  ChevronRight,
  Fingerprint,
  History,
  Landmark,
  Package,
  ReceiptText,
  ShoppingBag,
  ShoppingCart,
  UsersRound,
  Wallet,
  type LucideIcon,
} from 'lucide-react';
import { useKasir } from './components/KasirProvider';
import { availableSettlement, dayKey, fmtTime, rp, totalSales } from './lib/data';

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  display: 'swap',
});

const colors = {
  green: '#105D38',
  dark: '#0B3D26',
  gold: '#D5A52D',
  pale: '#ECF7EF',
  border: '#E6ECE7',
  muted: '#718077',
};

const panel = 'rounded-[20px] border border-[#E6ECE7] bg-white';
const focus = 'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#105D38]';

function PanelHead({ title, action }: { title: string; action?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <h2 className="text-[16px] font-bold tracking-[-0.4px] text-[#142019] sm:text-[18px]">
        {title}
      </h2>
      {action}
    </div>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
  accent = 'green',
  detail,
}: {
  label: string;
  value: ReactNode;
  icon: LucideIcon;
  accent?: 'green' | 'gold' | 'soft';
  detail: string;
}) {
  const iconClass = {
    green: 'bg-[#105D38] text-white',
    gold: 'bg-[#F9EDC8] text-[#956B00]',
    soft: 'bg-[#ECF7EF] text-[#105D38]',
  }[accent];

  return (
    <article className={`${panel} min-w-0 p-4 sm:p-5 xl:p-6`}>
      <div className="flex items-start justify-between gap-2">
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] ${iconClass}`}>
          <Icon size={19} strokeWidth={2} aria-hidden="true" />
        </div>
        <span className="pt-1 text-[11px] font-medium text-[#88948C] sm:text-[12px]">{detail}</span>
      </div>
      <p className="mt-5 text-[12px] font-medium text-[#718077] sm:text-[13px]">{label}</p>
      <p className="mt-1 break-words text-[clamp(15px,3.6vw,29px)] font-extrabold leading-[1.35] tracking-[-0.8px] tabular-nums text-[#142019] sm:text-[27px]">
        {value}
      </p>
    </article>
  );
}

function compact(value: number) {
  if (value >= 1_000_000_000) return `${+(value / 1_000_000_000).toFixed(1)} M`;
  if (value >= 1_000_000) return `${+(value / 1_000_000).toFixed(1)} jt`;
  if (value >= 1_000) return `${+(value / 1_000).toFixed(0)} rb`;
  return String(Math.round(value));
}

function niceMaximum(value: number) {
  if (value <= 0) return 1;
  const magnitude = Math.pow(10, Math.floor(Math.log10(value)));
  return Math.ceil(value / magnitude) * magnitude;
}

type DayPoint = { key: string; label: string; value: number };

function smoothLine(points: { x: number; y: number }[]) {
  if (!points.length) return '';
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;
  let path = `M ${points[0].x} ${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const before = points[Math.max(0, i - 1)];
    const start = points[i];
    const end = points[i + 1];
    const after = points[Math.min(points.length - 1, i + 2)];
    const clamp = (y: number) => Math.min(Math.max(y, Math.min(start.y, end.y)), Math.max(start.y, end.y));
    const c1x = start.x + (end.x - before.x) / 6;
    const c1y = clamp(start.y + (end.y - before.y) / 6);
    const c2x = end.x - (after.x - start.x) / 6;
    const c2y = clamp(end.y - (after.y - start.y) / 6);
    path += ` C ${c1x} ${c1y}, ${c2x} ${c2y}, ${end.x} ${end.y}`;
  }
  return path;
}

function SalesChart({ data, ready }: { data: DayPoint[]; ready: boolean }) {
  const container = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(760);
  const [selected, setSelected] = useState<number | null>(null);

  useEffect(() => {
    const element = container.current;
    if (!element) return;
    const observer = new ResizeObserver((entries) => {
      const next = Math.round(entries[0]?.contentRect.width ?? 760);
      if (next > 0) setWidth(next);
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const mobile = width < 520;
  const left = mobile ? 43 : 65;
  const right = 14;
  const top = 28;
  const bottom = 191;
  const height = 236;
  const graphWidth = Math.max(1, width - left - right);
  const maximum = niceMaximum(Math.max(0, ...data.map((d) => d.value)));
  const hasData = ready && data.some((d) => d.value > 0);
  const points = data.map((d, i) => ({
    x: left + (data.length === 1 ? graphWidth / 2 : (i / (data.length - 1)) * graphWidth),
    y: bottom - (d.value / maximum) * (bottom - top),
  }));
  const line = smoothLine(points);
  const area = points.length
    ? `${line} L ${points[points.length - 1].x} ${bottom} L ${points[0].x} ${bottom} Z`
    : '';
  const visibleLabels = data.length <= 7
    ? (mobile ? [0, 3, 6] : data.map((_, i) => i))
    : (mobile ? [0, 14, 29] : [0, 6, 12, 18, 24, 29]);
  const activeIndex = selected !== null && selected < points.length
    ? selected
    : (hasData ? data.length - 1 : null);
  const active = activeIndex === null ? null : points[activeIndex];
  const bubbleWidth = 140;
  const bubbleX = active ? Math.max(left, Math.min(active.x - bubbleWidth / 2, width - bubbleWidth - 6)) : 0;
  const bubbleY = active ? (active.y < 65 ? active.y + 14 : active.y - 49) : 0;
  const ticks = mobile ? [0, 0.5, 1] : [0, 0.25, 0.5, 0.75, 1];

  return (
    <div ref={container} className="relative mt-5 w-full" onMouseLeave={() => setSelected(null)}>
      <svg
        role="img"
        aria-label="Grafik nilai penjualan per hari. Arahkan atau pilih titik untuk melihat nominal."
        className="block w-full"
        viewBox={`0 0 ${width} ${height}`}
        height={height}
      >
        {ticks.map((fraction) => {
          const y = bottom - fraction * (bottom - top);
          return (
            <g key={fraction}>
              <line x1={left} x2={width - right} y1={y} y2={y} stroke={colors.border} strokeDasharray={fraction === 0 ? undefined : '4 5'} />
              <text x={left - 11} y={y + 4} fontSize="11" fill={colors.muted} textAnchor="end">
                {compact(maximum * fraction)}
              </text>
            </g>
          );
        })}

        {hasData && (
          <>
            <path d={area} fill={colors.pale} />
            <path d={line} fill="none" stroke={colors.green} strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" />
            {points.map((point, i) => (
              <g key={data[i].key}>
                {(selected === i || (selected === null && i === points.length - 1)) && (
                  <circle cx={point.x} cy={point.y} r="5.5" fill={colors.gold} stroke="white" strokeWidth="2.5" />
                )}
                <circle
                  cx={point.x}
                  cy={point.y}
                  r={mobile ? 14 : 12}
                  fill="transparent"
                  tabIndex={0}
                  role="button"
                  aria-label={`${data[i].label}: ${rp(data[i].value)}`}
                  onMouseEnter={() => setSelected(i)}
                  onFocus={() => setSelected(i)}
                  onBlur={() => setSelected(null)}
                  onClick={() => setSelected(i)}
                  className="cursor-pointer outline-none"
                />
              </g>
            ))}
          </>
        )}

        {visibleLabels.filter((i) => i < data.length).map((i) => (
          <text key={data[i].key} x={points[i].x} y={bottom + 27} textAnchor="middle" fontSize="11" fill={colors.muted}>
            {data[i].label}
          </text>
        ))}

        {hasData && active && activeIndex !== null && (
          <g pointerEvents="none">
            <rect x={bubbleX} y={bubbleY} width={bubbleWidth} height="34" rx="9" fill={colors.dark} />
            <text x={bubbleX + bubbleWidth / 2} y={bubbleY + 21} textAnchor="middle" fontSize="12" fontWeight="700" fill="#FFFFFF">
              {rp(data[activeIndex].value)}
            </text>
          </g>
        )}
      </svg>
      {ready && !hasData && (
        <div className="pointer-events-none absolute inset-x-0 top-[70px] text-center text-[13px] text-[#718077]">
          Belum ada penjualan pada periode ini
        </div>
      )}
      {!ready && (
        <div className="pointer-events-none absolute inset-x-0 top-[70px] text-center text-[13px] text-[#718077]">Memuat data...</div>
      )}
    </div>
  );
}

const shortcuts = [
  { href: '/kasir/transaksi', name: 'Pembayaran', icon: Fingerprint },
  { href: '/kasir/produk', name: 'Menu & produk', icon: Package },
  { href: '/kasir/santri', name: 'Data santri', icon: UsersRound },
  { href: '/kasir/penarikan', name: 'Penarikan', icon: Wallet },
];

export default function BerandaKasir() {
  const { store, ready } = useKasir();
  const [period, setPeriod] = useState<7 | 30>(7);

  const currentDay = dayKey();
  const salesToday = store.sales.filter((sale) => dayKey(sale.time) === currentDay);
  const todayTotal = salesToday.reduce((sum, sale) => sum + sale.total, 0);
  const settlement = availableSettlement(store);
  const allSales = totalSales(store);
  const latest = store.sales.slice(0, 5);

  const amounts = new Map<string, number>();
  for (const sale of store.sales) {
    const key = dayKey(sale.time);
    amounts.set(key, (amounts.get(key) ?? 0) + sale.total);
  }

  const daily: DayPoint[] = Array.from({ length: period }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (period - 1 - i));
    const key = dayKey(date);
    return {
      key,
      label: new Intl.DateTimeFormat('id-ID', {
        day: 'numeric',
        month: 'short',
        timeZone: 'Asia/Jakarta',
      }).format(date),
      value: amounts.get(key) ?? 0,
    };
  });
  const periodTotal = daily.reduce((sum, day) => sum + day.value, 0);

  return (
    <main className={`${jakarta.className} mx-auto w-full max-w-[1480px] bg-white px-4 pb-8 pt-5 text-[#142019] antialiased sm:px-6 sm:pt-7 xl:px-8`}>
      <header className="mb-6 flex flex-col justify-between gap-4 sm:mb-7 sm:flex-row sm:items-center">
        <div>
          <div className="mb-2 inline-flex items-center gap-2 text-[12px] font-semibold text-[#105D38]">
            <span className="h-2 w-2 rounded-full bg-[#D5A52D]" aria-hidden="true" />
            KASIR
          </div>
          <h1 className="text-[25px] font-extrabold leading-tight tracking-[-0.9px] sm:text-[31px]">Ringkasan Kasir</h1>
          <p className="mt-1 text-[13px] text-[#718077] sm:text-[14px]"></p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <Link
            href="/kasir/laporan"
            className={`${focus} inline-flex h-11 items-center gap-2 rounded-[12px] border border-[#E6ECE7] bg-white px-4 text-[13px] font-semibold text-[#34473B] transition-colors hover:bg-[#F5F8F5]`}
          >
            <ChartNoAxesCombined size={17} /> Laporan
          </Link>
          <Link
            href="/kasir/transaksi"
            className={`${focus} inline-flex h-11 items-center gap-2 rounded-[12px] bg-[#105D38] px-4 text-[13px] font-semibold text-white transition-colors hover:bg-[#0B3D26]`}
          >
            <ShoppingCart size={17} /> Transaksi baru <ArrowRight size={16} />
          </Link>
        </div>
      </header>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        <StatCard label="Penjualan hari ini" detail="Hari ini" icon={Wallet} accent="green" value={ready ? rp(todayTotal) : '—'} />
        <StatCard label="Transaksi hari ini" detail="Hari ini" icon={ReceiptText} accent="soft" value={ready ? salesToday.length.toLocaleString('id-ID') : '—'} />
        <StatCard label="Saldo koperasi" detail="Tersedia" icon={Landmark} accent="gold" value={ready ? rp(settlement) : '—'} />
        <StatCard label="Total penjualan" detail="Keseluruhan" icon={ShoppingBag} accent="soft" value={ready ? rp(allSales) : '—'} />
      </div>

      <section className={`${panel} mt-5 p-4 sm:p-6`}>
        <PanelHead
          title="Grafik penjualan"
          action={
            <label className="relative inline-flex items-center gap-2 rounded-[11px] border border-[#E6ECE7] bg-white px-3 py-2 text-[#506157]">
              <CalendarDays size={16} aria-hidden="true" />
              <select
                aria-label="Periode grafik penjualan"
                className={`${focus} cursor-pointer appearance-none bg-transparent pr-4 text-[12px] font-semibold outline-none sm:text-[13px]`}
                value={period}
                onChange={(e) => setPeriod(Number(e.target.value) as 7 | 30)}
              >
                <option value={7}>7 hari terakhir</option>
                <option value={30}>30 hari terakhir</option>
              </select>
              <ChevronRight size={15} className="pointer-events-none absolute right-2 rotate-90" />
            </label>
          }
        />
        <div className="mt-3 flex flex-wrap items-baseline gap-2">
          <p className="text-[23px] font-extrabold tracking-[-0.7px] tabular-nums sm:text-[27px]">
            {ready ? rp(periodTotal) : '—'}
          </p>
          <span className="text-[12px] text-[#718077]">Total {period} hari</span>
        </div>
        <SalesChart data={daily} ready={ready} />
      </section>

      <div className="mt-5 grid items-start gap-5 xl:grid-cols-[minmax(0,1.65fr)_minmax(300px,1fr)]">
        <section className={`${panel} min-w-0 p-4 sm:p-6`}>
          <PanelHead
            title="Transaksi terakhir"
            action={
              <Link href="/kasir/riwayat" className={`${focus} inline-flex items-center gap-1 text-[12px] font-bold text-[#105D38] hover:underline sm:text-[13px]`}>
                Lihat semua <ChevronRight size={16} />
              </Link>
            }
          />
          {!ready ? (
            <p className="py-12 text-center text-[13px] text-[#718077]">Memuat transaksi...</p>
          ) : !latest.length ? (
            <div className="flex flex-col items-center py-12 text-center">
              <History className="text-[#105D38]" size={28} />
              <p className="mt-3 text-[13px] font-semibold">Belum ada transaksi</p>
            </div>
          ) : (
            <>
              <div className="mt-4 hidden overflow-x-auto md:block">
                <table className="w-full min-w-[590px] border-collapse text-left text-[13px]">
                  <thead className="border-y border-[#E6ECE7] text-[#718077]">
                    <tr>
                      <th className="py-3 font-medium">Santri</th>
                      <th className="px-3 py-3 font-medium">Produk</th>
                      <th className="px-3 py-3 font-medium">Waktu</th>
                      <th className="py-3 text-right font-medium">Nominal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#EDF1ED]">
                    {latest.map((sale) => (
                      <tr key={sale.id} className="transition-colors hover:bg-[#FAFCFA]">
                        <td className="max-w-[170px] py-4 font-semibold">
                          <Link href={`/kasir/riwayat?id=${encodeURIComponent(sale.id)}`} className={`${focus} hover:text-[#105D38]`}>
                            {sale.studentName}
                          </Link>
                        </td>
                        <td className="max-w-[190px] truncate px-3 py-4 text-[#718077]">{sale.lines.map((line) => line.name).join(', ')}</td>
                        <td className="whitespace-nowrap px-3 py-4 text-[#718077]">{fmtTime(sale.time)}</td>
                        <td className="whitespace-nowrap py-4 text-right font-bold tabular-nums text-[#105D38]">{rp(sale.total)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="mt-3 divide-y divide-[#EDF1ED] md:hidden">
                {latest.map((sale) => (
                  <Link
                    key={sale.id}
                    href={`/kasir/riwayat?id=${encodeURIComponent(sale.id)}`}
                    className={`${focus} flex items-center gap-3 py-3.5`}
                  >
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[11px] bg-[#ECF7EF] text-[#105D38]">
                      <ShoppingCart size={18} aria-hidden="true" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13px] font-bold">{sale.studentName}</span>
                      <span className="mt-0.5 block truncate text-[11px] text-[#718077]">{fmtTime(sale.time)} · {sale.lines.map((line) => line.name).join(', ')}</span>
                    </span>
                    <span className="shrink-0 text-right text-[12px] font-bold tabular-nums text-[#105D38]">{rp(sale.total)}</span>
                  </Link>
                ))}
              </div>
            </>
          )}
        </section>

        <section className={`${panel} p-4 sm:p-6`}>
          <PanelHead title="Akses cepat" />
          <div className="mt-4 grid grid-cols-2 gap-3">
            {shortcuts.map(({ href, name, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className={`${focus} group relative flex min-h-[120px] flex-col justify-between rounded-[15px] border border-[#E6ECE7] bg-white p-4 transition-colors hover:border-[#A7CBB5] hover:bg-[#F7FAF7]`}
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-[11px] bg-[#ECF7EF] text-[#105D38]">
                  <Icon size={19} strokeWidth={1.9} aria-hidden="true" />
                </span>
                <span className="flex items-end justify-between gap-2">
                  <span className="text-[12px] font-bold leading-tight sm:text-[13px]">{name}</span>
                  <ArrowUpRight size={15} className="shrink-0 text-[#A9B7AC] transition-colors group-hover:text-[#105D38]" aria-hidden="true" />
                </span>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
