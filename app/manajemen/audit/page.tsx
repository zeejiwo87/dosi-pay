'use client';

import { useMemo, useState } from 'react';
import { Download, FileClock, Search, ShieldCheck } from 'lucide-react';
import { useManajemen } from '../components/ManajemenProvider';
import { exportCSV, fmt } from '../lib/data';

const panel = 'rounded-[20px] border border-[#E6ECE7] bg-white';
const focus = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#D5A52D]';

export default function Audit() {
  const { admin } = useManajemen();
  const [query, setQuery] = useState('');

  const rows = useMemo(() => {
    const text = query.trim().toLowerCase();
    return admin.audits.filter((record) =>
      `${record.action} ${record.detail} ${record.actor}`.toLowerCase().includes(text)
    );
  }, [admin.audits, query]);

  function download() {
    exportCSV(
      'dosi-audit.csv',
      ['Tanggal', 'Aktivitas', 'Keterangan', 'Operator'],
      rows.map((record) => [
        fmt(record.time),
        record.action,
        record.detail,
        record.actor,
      ])
    );
  }

  return (
    <div className="w-full min-w-0 text-[#142019]">
      <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-[24px] font-extrabold leading-tight tracking-[-.8px] sm:text-[30px]">
            Audit Aktivitas
          </h1>
          <p className="mt-1 text-[12px] text-[#718077] sm:text-[13px]">
            Riwayat perubahan manajemen
          </p>
        </div>
        <button
          type="button"
          onClick={download}
          disabled={rows.length === 0}
          className={`${focus} inline-flex h-11 shrink-0 items-center gap-2 rounded-[12px] border border-[#E6ECE7] bg-white px-4 text-[12px] font-semibold text-[#105D38] transition-colors hover:border-[#B8D7C2] hover:bg-[#F7FAF8] disabled:cursor-not-allowed disabled:opacity-40`}
        >
          <Download size={17} /> Ekspor CSV
        </button>
      </header>

      <section className={`${panel} min-w-0 overflow-hidden`}>
        <div className="flex flex-col gap-3 border-b border-[#E6ECE7] p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
          <div className="min-w-0">
            <h2 className="text-[16px] font-bold tracking-[-.3px]">Riwayat Aktivitas</h2>
            <p className="mt-1 text-[11px] text-[#718077]">{rows.length} aktivitas</p>
          </div>
          <div className="relative w-full sm:max-w-[350px]">
            <Search size={17} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#91A096]" />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Cari aktivitas atau pelaksana"
              aria-label="Cari aktivitas audit"
              className={`${focus} h-11 w-full rounded-xl border border-[#E1E9E3] bg-white pl-10 pr-4 text-[13px] text-[#142019] outline-none placeholder:text-[#A3AFA5] focus:border-[#105D38]`}
            />
          </div>
        </div>

        {rows.length === 0 ? (
          <div className="flex flex-col items-center px-5 py-14 text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-[16px] bg-[#ECF7EF] text-[#105D38]">
              <FileClock size={25} strokeWidth={1.8} />
            </span>
            <p className="mt-4 text-[13px] font-bold text-[#142019]">
              {query.trim() ? 'Aktivitas tidak ditemukan' : 'Belum ada aktivitas'}
            </p>
            {query.trim() && (
              <button type="button" onClick={() => setQuery('')} className={`${focus} mt-3 text-[12px] font-semibold text-[#105D38] hover:underline`}>
                Reset pencarian
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Mobile: setiap aktivitas dapat dibaca tanpa scroll horizontal. */}
            <div className="divide-y divide-[#EDF1ED] lg:hidden">
              {rows.map((record) => (
                <article key={record.id} className="flex min-w-0 gap-3 px-4 py-4 sm:px-5">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] bg-[#ECF7EF] text-[#105D38]">
                    <FileClock size={19} strokeWidth={1.8} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-1">
                      <p className="break-words text-[13px] font-bold text-[#142019]">{record.action}</p>
                      <time className="text-[10px] text-[#91A096]">{fmt(record.time)}</time>
                    </div>
                    <p className="mt-1.5 whitespace-pre-wrap break-words text-[12px] leading-relaxed text-[#65766B]">
                      {record.detail}
                    </p>
                    <p className="mt-2 text-[11px] font-semibold text-[#105D38]">{record.actor}</p>
                  </div>
                </article>
              ))}
            </div>

            {/* Desktop: table mengikuti sistem desain Kasir. */}
            <div className="hidden lg:block">
              <table className="w-full table-fixed border-collapse text-left">
                <thead className="bg-[#FAFCFA] text-[11px] text-[#718077]">
                  <tr className="border-b border-[#E6ECE7]">
                    <th className="w-[22%] px-5 py-3.5 font-semibold">Tanggal</th>
                    <th className="w-[22%] px-3 py-3.5 font-semibold">Aktivitas</th>
                    <th className="w-[38%] px-3 py-3.5 font-semibold">Keterangan</th>
                    <th className="w-[18%] px-5 py-3.5 font-semibold">Pelaksana</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EDF1ED]">
                  {rows.map((record) => (
                    <tr key={record.id} className="align-top transition-colors hover:bg-[#F8FBF8]">
                      <td className="px-5 py-4 text-[12px] text-[#718077]">{fmt(record.time)}</td>
                      <td className="break-words px-3 py-4 text-[12px] font-bold text-[#105D38]">{record.action}</td>
                      <td className="whitespace-pre-wrap break-words px-3 py-4 text-[12px] leading-relaxed text-[#65766B]">{record.detail}</td>
                      <td className="break-words px-5 py-4 text-[12px] font-semibold text-[#34473B]">{record.actor}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        <div className="flex items-start gap-2.5 border-t border-[#EDF1ED] bg-[#FAFCFA] px-4 py-3.5 sm:px-5">
          <ShieldCheck size={15} className="mt-0.5 shrink-0 text-[#8A7545]" aria-hidden="true" />
          <p className="text-[11px] leading-relaxed text-[#718077]">
            Log tersimpan di browser dan dapat diubah atau dihapus. Belum dapat digunakan untuk audit resmi.
          </p>
        </div>
      </section>
    </div>
  );
}
