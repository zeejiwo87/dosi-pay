'use client';

import { useMemo, useState } from 'react';
import {
  Download,
  Fingerprint,
  LockKeyhole,
  Search,
  ShieldAlert,
  ShieldCheck,
  type LucideIcon,
} from 'lucide-react';
import { useManajemen } from '../components/ManajemenProvider';
import { exportCSV, fmt, rp } from '../lib/data';

const panel = 'rounded-[20px] border border-[#E6ECE7] bg-white';
const focus = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#D5A52D]';

type Filter = 'semua' | 'verified' | 'other';

function Metric({ title, value, icon: Icon, gold = false }: {
  title: string;
  value: number;
  icon: LucideIcon;
  gold?: boolean;
}) {
  return (
    <article className={`${panel} min-w-0 p-4 sm:p-5`}>
      <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${gold ? 'bg-[#FAF1D8] text-[#967014]' : 'bg-[#ECF7EF] text-[#105D38]'}`}>
        <Icon size={19} strokeWidth={1.9} />
      </span>
      <p className="mt-4 text-[12px] text-[#718077]">{title}</p>
      <p className="mt-1 text-[clamp(21px,3vw,29px)] font-extrabold tabular-nums tracking-[-.7px] text-[#142019]">
        {value.toLocaleString('id-ID')}
      </p>
    </article>
  );
}

function VerificationStatus({ verified }: { verified: boolean }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold ${verified ? 'bg-[#ECF7EF] text-[#105D38]' : 'bg-[#FAF1D8] text-[#967014]'}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${verified ? 'bg-[#105D38]' : 'bg-[#B58B2D]'}`} />
      {verified ? 'Simulasi lolos' : 'Tidak terkonfirmasi'}
    </span>
  );
}

export default function Biometrik() {
  const { kasir, admin } = useManajemen();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<Filter>('semua');

  const verifiedCount = kasir.sales.filter((sale) => sale.biometric === 'demo-verified').length;
  const otherCount = kasir.sales.length - verifiedCount;

  const records = useMemo(() => {
    const q = search.trim().toLowerCase();
    return kasir.sales.filter((sale) => {
      const verified = sale.biometric === 'demo-verified';
      const matchStatus = filter === 'semua' || (filter === 'verified' ? verified : !verified);
      const matchText = `${sale.id} ${sale.studentName} ${sale.studentId}`.toLowerCase().includes(q);
      return matchStatus && matchText;
    });
  }, [kasir.sales, search, filter]);

  function download() {
    exportCSV(
      'dosi-biometrik.csv',
      ['ID Transaksi', 'Tanggal', 'Santri', 'NIS', 'Nominal', 'Status'],
      records.map((sale) => [
        sale.id, fmt(sale.time), sale.studentName, sale.studentId, sale.total,
        sale.biometric === 'demo-verified' ? 'Simulasi lolos' : 'Tidak terkonfirmasi',
      ])
    );
  }

  return (
    <div className="w-full min-w-0 text-[#142019]">
      <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-[24px] font-extrabold leading-tight tracking-[-.8px] sm:text-[30px]">Verifikasi Biometrik</h1>
          <p className="mt-1 text-[12px] text-[#718077] sm:text-[13px]">Status verifikasi transaksi</p>
        </div>
        <button type="button" onClick={download} disabled={records.length === 0}
          className={`${focus} inline-flex h-11 items-center gap-2 rounded-xl border border-[#E6ECE7] bg-white px-4 text-[12px] font-semibold text-[#105D38] hover:bg-[#F7FAF8] disabled:cursor-not-allowed disabled:opacity-40`}>
          <Download size={16} /> Ekspor CSV
        </button>
      </header>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:gap-4">
        <Metric title="Simulasi lolos" value={verifiedCount} icon={Fingerprint} />
        <Metric title="Status lainnya" value={otherCount} icon={ShieldAlert} gold />
        <div className="col-span-2 md:col-span-1">
          <Metric title="Santri terdaftar" value={kasir.students.length} icon={ShieldCheck} />
        </div>
      </div>

      <div className="mt-5 grid items-start gap-5 xl:grid-cols-[minmax(0,1.55fr)_minmax(270px,.8fr)]">
        <section className={`${panel} min-w-0 overflow-hidden`}>
          <div className="border-b border-[#E6ECE7] p-4 sm:p-5">
            <h2 className="text-[16px] font-bold tracking-[-.3px]">Riwayat Verifikasi</h2>
            <div className="mt-4 flex flex-col gap-2 sm:flex-row">
              <div className="relative min-w-0 flex-1">
                <Search size={17} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#91A096]" />
                <input type="search" aria-label="Cari transaksi" placeholder="Cari santri atau ID transaksi" value={search} onChange={(event) => setSearch(event.target.value)}
                  className={`${focus} h-11 w-full rounded-xl border border-[#E1E9E3] bg-white pl-10 pr-3 text-[13px] outline-none placeholder:text-[#A3AFA5] focus:border-[#105D38]`} />
              </div>
              <select value={filter} onChange={(event) => setFilter(event.target.value as Filter)} aria-label="Filter verifikasi"
                className={`${focus} h-11 w-full rounded-xl border border-[#E1E9E3] bg-white px-3 text-[12px] font-semibold text-[#36543E] outline-none focus:border-[#105D38] sm:w-[165px]`}>
                <option value="semua">Semua status</option>
                <option value="verified">Simulasi lolos</option>
                <option value="other">Status lainnya</option>
              </select>
            </div>
          </div>

          {records.length === 0 ? (
            <div className="flex flex-col items-center px-4 py-14 text-center">
              <Fingerprint size={28} className="text-[#105D38]" />
              <p className="mt-3 text-[13px] font-semibold">Tidak ada transaksi</p>
              {(search || filter !== 'semua') && <button type="button" onClick={() => { setSearch(''); setFilter('semua'); }} className="mt-3 text-[12px] font-semibold text-[#105D38]">Reset filter</button>}
            </div>
          ) : (
            <>
              <div className="divide-y divide-[#EDF1ED] lg:hidden">
                {records.map((sale) => (
                  <div key={sale.id} className="flex min-w-0 items-start gap-3 px-4 py-4 sm:px-5">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#ECF7EF] text-[#105D38]"><Fingerprint size={19} /></span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] font-bold">{sale.studentName}</p>
                      <p className="mt-1 text-[11px] text-[#718077]">{sale.studentId} · {fmt(sale.time)}</p>
                      <div className="mt-2"><VerificationStatus verified={sale.biometric === 'demo-verified'} /></div>
                    </div>
                    <p className="shrink-0 whitespace-nowrap text-[12px] font-bold tabular-nums text-[#105D38]">{rp(sale.total)}</p>
                  </div>
                ))}
              </div>
              <div className="hidden lg:block">
                <table className="w-full table-fixed border-collapse text-left">
                  <thead><tr className="border-b border-[#E6ECE7] bg-[#FAFCFA] text-[11px] text-[#718077]">
                    <th className="w-[24%] px-5 py-3.5 font-semibold">Tanggal</th>
                    <th className="w-[28%] px-3 py-3.5 font-semibold">Santri</th>
                    <th className="w-[22%] px-3 py-3.5 font-semibold">Nominal</th>
                    <th className="w-[26%] px-5 py-3.5 font-semibold">Status</th>
                  </tr></thead>
                  <tbody className="divide-y divide-[#EDF1ED]">
                    {records.map((sale) => (
                      <tr key={sale.id} className="hover:bg-[#FAFCFA]">
                        <td className="px-5 py-4 text-[12px] text-[#718077]">{fmt(sale.time)}</td>
                        <td className="px-3 py-4"><p className="truncate text-[12px] font-bold">{sale.studentName}</p><p className="mt-1 text-[10px] text-[#8B998F]">{sale.studentId}</p></td>
                        <td className="px-3 py-4 text-[13px] font-bold tabular-nums text-[#105D38]">{rp(sale.total)}</td>
                        <td className="px-5 py-4"><VerificationStatus verified={sale.biometric === 'demo-verified'} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </section>

        <div className="space-y-4">
          <section className="rounded-[20px] bg-[#105D38] p-5 text-white sm:p-6">
            <Fingerprint size={28} className="text-[#E0B341]" />
            <h2 className="mt-4 text-[17px] font-bold">Sidik Jari</h2>
            <p className="mt-2 text-[12px] leading-relaxed text-[#D3E9DA]">Verifikasi saat ini masih simulasi. Sensor biometrik belum terhubung.</p>
          </section>
          <section className={`${panel} p-5 sm:p-6`}>
            <h2 className="text-[16px] font-bold">Kebijakan</h2>
            <div className="mt-4 flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#FAF1D8] text-[#967014]"><LockKeyhole size={19} /></span>
              <div>
                <p className="text-[13px] font-semibold">{admin.policy.biometricRequired ? 'Verifikasi diwajibkan' : 'Verifikasi tidak diwajibkan'}</p>
                <p className="mt-1 text-[11px] leading-relaxed text-[#718077]">Pengaturan administrasi; belum menjadi autentikasi sensor nyata.</p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
