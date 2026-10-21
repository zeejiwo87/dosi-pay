'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Download,
  MessageSquareText,
  RefreshCw,
  Search,
} from 'lucide-react';
import { useManajemen } from '../components/ManajemenProvider';
import { KEYS, exportCSV, fmt, rawJson } from '../lib/data';

const panel = 'rounded-[20px] border border-[#E6ECE7] bg-white';
const focus = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#D5A52D]';

type Message = {
  id: string;
  depositKey?: string;
  text: string;
  createdAt: string;
};

function readMessages(): Message[] {
  try {
    const stored: unknown = rawJson(KEYS.messages);
    if (!Array.isArray(stored)) return [];
    return stored.filter((item: unknown): item is Message => {
      if (typeof item !== 'object' || item === null) return false;
      const record = item as Record<string, unknown>;
      return (
        typeof record.id === 'string' &&
        typeof record.text === 'string' &&
        typeof record.createdAt === 'string'
      );
    });
  } catch {
    return [];
  }
}

export default function Pesan() {
  const { kasir } = useManajemen();
  const [search, setSearch] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [loaded, setLoaded] = useState(false);

  const refresh = useCallback(() => {
    setMessages(readMessages());
    setLoaded(true);
  }, []);

  useEffect(() => {
    refresh();
    window.addEventListener('storage', refresh);
    window.addEventListener('focus', refresh);
    return () => {
      window.removeEventListener('storage', refresh);
      window.removeEventListener('focus', refresh);
    };
  }, [refresh]);

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return messages
      .filter((message) => message.text.toLowerCase().includes(q))
      .slice()
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [messages, search]);

  // Struktur data pesan yang tersedia saat ini ditautkan ke akun santri ini.
  const student = kasir.students.find((item) => item.id === '20260001');
  const studentLabel = student?.name || 'NIS 20260001';

  function download() {
    exportCSV(
      'dosi-pesan-wali.csv',
      ['Tanggal', 'Santri', 'Pesan'],
      rows.map((message) => [fmt(message.createdAt), studentLabel, message.text])
    );
  }

  return (
    <div className="w-full min-w-0 text-[#142019]">
      <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-[24px] font-extrabold leading-tight tracking-[-.8px] sm:text-[30px]">Pesan Wali</h1>
          <p className="mt-1 text-[12px] text-[#718077] sm:text-[13px]">Pesan untuk kasir</p>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={refresh} aria-label="Perbarui pesan" title="Perbarui pesan"
            className={`${focus} flex h-11 w-11 items-center justify-center rounded-xl border border-[#E6ECE7] bg-white text-[#105D38] hover:bg-[#F7FAF8]`}>
            <RefreshCw size={17} />
          </button>
          <button type="button" onClick={download} disabled={rows.length === 0}
            className={`${focus} inline-flex h-11 items-center gap-2 rounded-xl border border-[#E6ECE7] bg-white px-3.5 text-[12px] font-semibold text-[#105D38] hover:bg-[#F7FAF8] disabled:cursor-not-allowed disabled:opacity-40`}>
            <Download size={17} /> Ekspor CSV
          </button>
        </div>
      </header>

      <section className={`${panel} min-w-0 overflow-hidden`}>
        <div className="flex flex-col gap-3 border-b border-[#E6ECE7] p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
          <div>
            <h2 className="text-[16px] font-bold">Daftar Pesan</h2>
            <p className="mt-1 text-[11px] text-[#718077]">{loaded ? `${rows.length} pesan` : 'Memuat...'}</p>
          </div>
          <div className="relative w-full sm:max-w-[350px]">
            <Search size={17} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#91A096]" />
            <input type="search" aria-label="Cari pesan" placeholder="Cari isi pesan" value={search} onChange={(event) => setSearch(event.target.value)}
              className={`${focus} h-11 w-full rounded-xl border border-[#E1E9E3] bg-white pl-10 pr-4 text-[13px] outline-none placeholder:text-[#A3AFA5] focus:border-[#105D38]`} />
          </div>
        </div>

        {!loaded ? (
          <div className="p-12 text-center text-[12px] text-[#718077]">Memuat pesan...</div>
        ) : !rows.length ? (
          <div className="flex flex-col items-center px-5 py-14 text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-[16px] bg-[#ECF7EF] text-[#105D38]"><MessageSquareText size={25} /></span>
            <p className="mt-4 text-[13px] font-bold">{search ? 'Pesan tidak ditemukan' : 'Belum ada pesan'}</p>
            {search && <button type="button" onClick={() => setSearch('')} className="mt-3 text-[12px] font-semibold text-[#105D38]">Reset pencarian</button>}
          </div>
        ) : (
          <div className="divide-y divide-[#EDF1ED]">
            {rows.map((message) => (
              <article key={message.id} className="flex min-w-0 gap-3 px-4 py-4 sm:px-5 sm:py-5">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#ECF7EF] text-[#105D38]"><MessageSquareText size={18} /></span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center justify-between gap-1.5">
                    <p className="text-[12px] font-bold text-[#142019] sm:text-[13px]">{studentLabel}</p>
                    <p className="text-[10px] text-[#91A096]">{fmt(message.createdAt)}</p>
                  </div>
                  <p className="mt-2 whitespace-pre-wrap break-words text-[12px] leading-[1.8] text-[#526459] sm:text-[13px]">{message.text}</p>
                </div>
              </article>
            ))}
          </div>
        )}
        <p className="border-t border-[#EDF1ED] px-4 py-3 text-[11px] leading-relaxed text-[#819087] sm:px-5">Pesan tersimpan di browser ini. Status sudah dibacakan belum tersedia.</p>
      </section>
    </div>
  );
}
