'use client';

import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import {
  Bell,
  Download,
  Eye,
  Pencil,
  Plus,
  Search,
  Trash2,
  X,
} from 'lucide-react';
import { useManajemen } from '../components/ManajemenProvider';
import { exportCSV, fmt, uid, type Announcement } from '../lib/data';

const panel = 'rounded-[20px] border border-[#E6ECE7] bg-white';
const focus = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#D5A52D]';
const input = `${focus} mt-2 h-11 w-full min-w-0 rounded-xl border border-[#E1E9E3] bg-white px-3.5 text-[13px] text-[#142019] outline-none focus:border-[#105D38]`;
const empty = (): Announcement => ({ id: '', title: '', body: '', category: 'Umum', status: 'Draf', createdAt: '' });

type Modal = { kind: 'edit'; item: Announcement } | { kind: 'preview'; item: Announcement } | { kind: 'delete'; item: Announcement } | null;
type Filter = 'Semua' | 'Draf' | 'Terbit';

function Status({ status }: { status: Announcement['status'] }) {
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-semibold ${status === 'Terbit' ? 'bg-[#ECF7EF] text-[#105D38]' : 'bg-[#FAF1D8] text-[#967014]'}`}>{status}</span>;
}

function Sheet({ title, children, footer, onClose }: {
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  onClose: () => void;
}) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const previous = document.body.style.overflow;
    const active = document.activeElement as HTMLElement | null;
    document.body.style.overflow = 'hidden';
    closeRef.current?.focus();
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') { event.preventDefault(); onClose(); return; }
      if (event.key !== 'Tab' || !dialogRef.current) return;
      const elements = Array.from(dialogRef.current.querySelectorAll<HTMLElement>('button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), a[href]'));
      if (!elements.length) return;
      if (event.shiftKey && document.activeElement === elements[0]) { event.preventDefault(); elements[elements.length - 1].focus(); }
      else if (!event.shiftKey && document.activeElement === elements[elements.length - 1]) { event.preventDefault(); elements[0].focus(); }
    }
    document.addEventListener('keydown', onKey);
    return () => { document.body.style.overflow = previous; document.removeEventListener('keydown', onKey); active?.focus(); };
  }, [onClose]);

  if (typeof document === 'undefined') return null;
  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center sm:p-5">
      <button type="button" onClick={onClose} aria-label="Tutup" className="absolute inset-0 bg-[#102719]/50" />
      <section ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="announcement-sheet-title" className="relative flex max-h-[94dvh] w-full flex-col overflow-hidden rounded-t-[24px] bg-white shadow-xl sm:max-w-[540px] sm:rounded-[22px]">
        <header className="flex shrink-0 items-center justify-between border-b border-[#E6ECE7] px-5 py-4 sm:px-6">
          <h2 id="announcement-sheet-title" className="text-[17px] font-bold text-[#142019]">{title}</h2>
          <button ref={closeRef} type="button" onClick={onClose} aria-label="Tutup" className={`${focus} flex h-9 w-9 items-center justify-center rounded-xl bg-[#F3F7F4] text-[#526459]`}><X size={19} /></button>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-6">{children}</div>
        {footer && <footer className="shrink-0 border-t border-[#E6ECE7] px-5 pb-[calc(16px+env(safe-area-inset-bottom))] pt-4 sm:px-6 sm:pb-5">{footer}</footer>}
      </section>
    </div>, document.body
  );
}

export default function Pengumuman() {
  const { admin, saveAnnouncement, deleteAnnouncement } = useManajemen();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<Filter>('Semua');
  const [modal, setModal] = useState<Modal>(null);
  const [error, setError] = useState('');

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return admin.announcements
      .filter((item) =>
        (filter === 'Semua' || item.status === filter) &&
        `${item.title} ${item.body} ${item.category}`.toLowerCase().includes(q)
      )
      .slice()
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [admin.announcements, search, filter]);

  const publishedCount = admin.announcements.filter((item) => item.status === 'Terbit').length;
  const close = useCallback(() => { setModal(null); setError(''); }, []);

  function openEditor(item?: Announcement) {
    setError('');
    setModal({ kind: 'edit', item: item ? { ...item } : empty() });
  }

  function changeEditor(patch: Partial<Announcement>) {
    setError('');
    setModal((current) => current?.kind === 'edit' ? { ...current, item: { ...current.item, ...patch } } : current);
  }

  function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (modal?.kind !== 'edit') return;
    const item: Announcement = {
      ...modal.item,
      id: modal.item.id || uid('ANN'),
      createdAt: modal.item.createdAt || new Date().toISOString(),
      title: modal.item.title.trim(),
      body: modal.item.body.trim(),
    };
    if (!item.title || !item.body) { setError('Isi judul dan pengumuman.'); return; }
    if (saveAnnouncement(item)) close();
    else setError('Pengumuman gagal disimpan.');
  }

  function remove() {
    if (modal?.kind !== 'delete') return;
    deleteAnnouncement(modal.item.id);
    close();
  }

  function download() {
    exportCSV('dosi-pengumuman.csv', ['Judul', 'Kategori', 'Status', 'Tanggal', 'Isi'],
      rows.map((item) => [item.title, item.category, item.status, fmt(item.createdAt), item.body]));
  }

  return (
    <div className="w-full min-w-0 text-[#142019]">
      <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div><h1 className="text-[24px] font-extrabold leading-tight tracking-[-.8px] sm:text-[30px]">Pengumuman</h1><p className="mt-1 text-[12px] text-[#718077]">Informasi pondok</p></div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={download} disabled={!rows.length} className={`${focus} inline-flex h-11 items-center gap-2 rounded-xl border border-[#E6ECE7] bg-white px-3 text-[12px] font-semibold text-[#105D38] hover:bg-[#F7FAF8] disabled:opacity-40`}><Download size={16} /> CSV</button>
          <button type="button" onClick={() => openEditor()} className={`${focus} inline-flex h-11 items-center gap-2 rounded-xl bg-[#105D38] px-3.5 text-[12px] font-semibold text-white hover:bg-[#0B482B]`}><Plus size={17} /> Buat Pengumuman</button>
        </div>
      </header>

      <section className={`${panel} min-w-0 overflow-hidden`}>
        <div className="border-b border-[#E6ECE7] p-4 sm:p-5">
          <div className="flex items-center justify-between gap-3"><h2 className="text-[16px] font-bold">Daftar Pengumuman</h2><span className="text-[12px] font-medium text-[#718077]">{publishedCount} terbit</span></div>
          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
            <div className="relative min-w-0 flex-1"><Search size={17} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#91A096]" /><input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Cari pengumuman" aria-label="Cari pengumuman" className={`${focus} h-11 w-full rounded-xl border border-[#E1E9E3] bg-white pl-10 pr-4 text-[13px] outline-none placeholder:text-[#A3AFA5] focus:border-[#105D38]`} /></div>
            <select aria-label="Filter status" value={filter} onChange={(event) => setFilter(event.target.value as Filter)} className={`${focus} h-11 w-full rounded-xl border border-[#E1E9E3] bg-white px-3 text-[12px] font-semibold text-[#36543E] outline-none focus:border-[#105D38] sm:w-[142px]`}><option value="Semua">Semua status</option><option>Draf</option><option>Terbit</option></select>
          </div>
        </div>

        {!rows.length ? (
          <div className="flex flex-col items-center px-5 py-14 text-center"><Bell size={28} className="text-[#105D38]" /><p className="mt-3 text-[13px] font-semibold">{search || filter !== 'Semua' ? 'Tidak ada hasil' : 'Belum ada pengumuman'}</p>{(search || filter !== 'Semua') && <button type="button" onClick={() => { setSearch(''); setFilter('Semua'); }} className="mt-3 text-[12px] font-semibold text-[#105D38]">Reset filter</button>}</div>
        ) : (
          <div className="grid gap-3 p-4 sm:p-5 lg:grid-cols-2">
            {rows.map((item) => (
              <article key={item.id} className="flex min-w-0 flex-col rounded-[16px] border border-[#E6ECE7] bg-white p-4 sm:p-5">
                <div className="flex items-center justify-between gap-3"><Status status={item.status} /><span className="shrink-0 text-[10px] text-[#91A096]">{fmt(item.createdAt, false)}</span></div>
                <h3 className="mt-4 break-words text-[14px] font-bold leading-snug text-[#142019]">{item.title}</h3>
                <p className="mt-2 line-clamp-3 min-h-[48px] whitespace-pre-line break-words text-[12px] leading-relaxed text-[#718077]">{item.body}</p>
                <div className="mt-auto flex items-center justify-between gap-2 border-t border-[#EDF1ED] pt-4">
                  <span className="truncate text-[11px] font-semibold text-[#967014]">{item.category}</span>
                  <div className="flex shrink-0 items-center gap-1.5">
                    <button type="button" aria-label={`Lihat ${item.title}`} title="Lihat" onClick={() => setModal({ kind: 'preview', item })} className={`${focus} flex h-9 w-9 items-center justify-center rounded-lg border border-[#E1E9E3] text-[#105D38] hover:bg-[#F7FAF8]`}><Eye size={16} /></button>
                    <button type="button" aria-label={`Ubah ${item.title}`} title="Ubah" onClick={() => openEditor(item)} className={`${focus} flex h-9 w-9 items-center justify-center rounded-lg border border-[#E1E9E3] text-[#105D38] hover:bg-[#F7FAF8]`}><Pencil size={16} /></button>
                    <button type="button" aria-label={`Hapus ${item.title}`} title="Hapus" onClick={() => setModal({ kind: 'delete', item })} className={`${focus} flex h-9 w-9 items-center justify-center rounded-lg border border-[#F0DDDA] text-[#B4544E] hover:bg-[#FFF7F5]`}><Trash2 size={16} /></button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
        <p className="border-t border-[#EDF1ED] px-4 py-3 text-[11px] leading-relaxed text-[#819087] sm:px-5">Status Terbit belum otomatis menampilkan pengumuman di aplikasi Wali.</p>
      </section>

      {modal?.kind === 'edit' && (
        <Sheet title={modal.item.id ? 'Ubah Pengumuman' : 'Buat Pengumuman'} onClose={close} footer={<button type="submit" form="announcement-editor-form" className={`${focus} h-12 w-full rounded-xl bg-[#105D38] text-[13px] font-semibold text-white hover:bg-[#0B482B]`}>Simpan Pengumuman</button>}>
          <form id="announcement-editor-form" onSubmit={save} className="space-y-4">
            <label className="block text-[12px] font-semibold text-[#506157]">Judul<input className={input} required maxLength={120} value={modal.item.title} onChange={(event) => changeEditor({ title: event.target.value })} placeholder="Judul pengumuman" /></label>
            <div className="grid grid-cols-2 gap-3">
              <label className="block text-[12px] font-semibold text-[#506157]">Kategori<select className={input} value={modal.item.category} onChange={(event) => changeEditor({ category: event.target.value as Announcement['category'] })}><option>Umum</option><option>Akademik</option><option>Kegiatan</option><option>Keuangan</option></select></label>
              <label className="block text-[12px] font-semibold text-[#506157]">Status<select className={input} value={modal.item.status} onChange={(event) => changeEditor({ status: event.target.value as Announcement['status'] })}><option>Draf</option><option>Terbit</option></select></label>
            </div>
            <label className="block text-[12px] font-semibold text-[#506157]">Isi Pengumuman<textarea required rows={7} maxLength={3000} value={modal.item.body} onChange={(event) => changeEditor({ body: event.target.value })} placeholder="Tulis pengumuman" className={`${input} h-auto min-h-[150px] resize-y py-3 leading-relaxed`} /></label>
            {error && <p role="alert" className="rounded-xl bg-[#FFF7F5] p-3 text-[12px] text-[#B44747]">{error}</p>}
          </form>
        </Sheet>
      )}

      {modal?.kind === 'preview' && (
        <Sheet title="Pengumuman" onClose={close} footer={<button type="button" onClick={close} className={`${focus} h-12 w-full rounded-xl border border-[#DDE8DF] text-[13px] font-semibold text-[#105D38]`}>Tutup</button>}>
          <Status status={modal.item.status} />
          <h3 className="mt-4 break-words text-[20px] font-extrabold leading-snug text-[#142019]">{modal.item.title}</h3>
          <p className="mt-2 text-[11px] text-[#819087]">{fmt(modal.item.createdAt)} · {modal.item.category}</p>
          <div className="mt-5 whitespace-pre-wrap break-words text-[13px] leading-[1.8] text-[#4B6052]">{modal.item.body}</div>
        </Sheet>
      )}

      {modal?.kind === 'delete' && (
        <Sheet title="Hapus Pengumuman?" onClose={close} footer={<div className="flex gap-2"><button type="button" onClick={close} className={`${focus} h-12 flex-1 rounded-xl border border-[#DDE8DF] text-[13px] font-semibold text-[#526459]`}>Batal</button><button type="button" onClick={remove} className={`${focus} h-12 flex-1 rounded-xl bg-[#AE514B] text-[13px] font-semibold text-white`}>Hapus</button></div>}>
          <p className="text-[13px] leading-relaxed text-[#526459]">Pengumuman <strong>{modal.item.title}</strong> akan dihapus.</p>
        </Sheet>
      )}
    </div>
  );
}
