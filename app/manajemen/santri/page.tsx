'use client';

import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import { createPortal } from 'react-dom';
import { CheckCircle2, Download, FileDown, GraduationCap, Pencil, Plus, Search, Upload, X } from 'lucide-react';
import { useManajemen } from '../components/ManajemenProvider';
import { balanceOf, effectiveLimit, exportCSV, rp, type Student } from '../lib/data';

const card = 'rounded-[20px] border border-[#E6ECE7] bg-white';
const focus = 'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#D5A52D]';
const field = `mt-2 h-11 w-full rounded-xl border border-[#E1E9E3] bg-white px-3.5 text-[13px] text-[#24382B] outline-none focus:border-[#105D38] disabled:bg-[#F6F8F6] disabled:text-[#849487] ${focus}`;
const emptyStudent = (): Student => ({ id: '', name: '', className: '', initial: '', openingBalance: 0, dailyLimit: 25000 });

type ImportPreview = {
  filename: string;
  students: Student[];
  errors: string[];
};

type ImportMode = 'skip' | 'update';

type ImportResult = {
  created: number;
  updated: number;
  skipped: number;
  failed: number;
};

// CSV dari Excel dapat memakai koma atau titik koma, termasuk sel berisi tanda kutip.
function parseCSV(text: string): string[][] {
  let source = text.replace(/^\uFEFF/, '');
  const separator = source.match(/^sep=([,;])\r?\n/i);
  if (separator) source = source.slice(separator[0].length);

  const heading = source.split(/\r?\n/, 1)[0] ?? '';
  const delimit = separator?.[1] ??
    (heading.split(';').length > heading.split(',').length ? ';' : ',');

  const lines: string[][] = [];
  let cells: string[] = [];
  let cell = '';
  let quoted = false;

  for (let i = 0; i < source.length; i += 1) {
    const char = source[i];
    if (char === '"') {
      if (quoted && source[i + 1] === '"') {
        cell += '"';
        i += 1;
      } else if (quoted || cell.length === 0) {
        quoted = !quoted;
      } else {
        throw new Error('Format tanda kutip CSV tidak valid.');
      }
    } else if (!quoted && char === delimit) {
      cells.push(cell.trim());
      cell = '';
    } else if (!quoted && (char === '\n' || char === '\r')) {
      if (char === '\r' && source[i + 1] === '\n') i += 1;
      cells.push(cell.trim());
      if (cells.some(Boolean)) lines.push(cells);
      cells = [];
      cell = '';
    } else {
      cell += char;
    }
  }

  if (quoted) throw new Error('Ada tanda kutip CSV yang belum ditutup.');
  cells.push(cell.trim());
  if (cells.some(Boolean)) lines.push(cells);
  return lines;
}

function normalizedColumn(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]/g, '');
}

function parseRupiah(value: string): number {
  const cleaned = value.trim().replace(/^rp\s*/i, '').replace(/\s/g, '');
  // Menerima 25000, 25.000, atau 25,000. Tidak menerima angka desimal.
  if (!/^\d+$/.test(cleaned) && !/^\d{1,3}([.,]\d{3})+$/.test(cleaned)) {
    return NaN;
  }
  const result = Number(cleaned.replace(/[.,]/g, ''));
  return Number.isSafeInteger(result) ? result : NaN;
}

function parseStudentImport(text: string, filename: string): ImportPreview {
  const table = parseCSV(text);
  if (!table.length) throw new Error('File CSV kosong.');
  if (table.length > 5001) throw new Error('Maksimal 5.000 santri dalam satu file.');

  const header = table[0].map(normalizedColumn);
  const column = (aliases: string[]) => header.findIndex((h) => aliases.includes(h));
  const indexes = {
    id: column(['nis', 'idsantri']),
    name: column(['nama', 'namasantri', 'namalengkap']),
    className: column(['kelas', 'classname']),
    openingBalance: column(['saldoawal', 'saldoawalrp', 'openingbalance']),
    dailyLimit: column(['limitharian', 'limitharianrp', 'dailylimit', 'limit']),
  };

  if (Object.values(indexes).some((index) => index < 0)) {
    throw new Error('Kolom wajib: NIS, Nama, Kelas, Saldo Awal, Limit Harian. Gunakan template yang tersedia.');
  }

  const students: Student[] = [];
  const errors: string[] = [];
  const found = new Set<string>();

  table.slice(1).forEach((row, index) => {
    const line = index + 2;
    const id = (row[indexes.id] ?? '').trim();
    const name = (row[indexes.name] ?? '').trim();
    const className = (row[indexes.className] ?? '').trim();
    const openingBalance = parseRupiah(row[indexes.openingBalance] ?? '');
    const dailyLimit = parseRupiah(row[indexes.dailyLimit] ?? '');
    let reason = '';

    if (!/^\d{1,16}$/.test(id)) reason = 'NIS harus 1–16 digit.';
    else if (found.has(id)) reason = `NIS ${id} muncul lebih dari sekali.`;
    else if (!name || name.length > 100) reason = 'Nama harus diisi (maks. 100 karakter).';
    else if (!className || className.length > 40) reason = 'Kelas harus diisi (maks. 40 karakter).';
    else if (!Number.isSafeInteger(openingBalance) || openingBalance < 0) reason = 'Saldo Awal tidak valid.';
    else if (!Number.isSafeInteger(dailyLimit) || dailyLimit <= 0) reason = 'Limit Harian harus lebih dari 0.';

    if (reason) {
      errors.push(`Baris ${line}: ${reason}`);
      return;
    }

    found.add(id);
    students.push({
      id,
      name,
      className,
      initial: name.split(/\s+/).slice(0, 2).map((part) => part[0] ?? '').join('').toUpperCase(),
      openingBalance,
      dailyLimit,
    });
  });

  if (!students.length && !errors.length) {
    errors.push('Tidak ada data santri di dalam file.');
  }
  return { filename, students, errors };
}

function ImportDialog({
  preview, existingIds, mode, onModeChange, onClose, onConfirm, importing, progress,
}: {
  preview: ImportPreview;
  existingIds: Set<string>;
  mode: ImportMode;
  onModeChange: (mode: ImportMode) => void;
  onClose: () => void;
  onConfirm: () => void;
  importing: boolean;
  progress: number;
}) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const previous = document.body.style.overflow;
    const previousFocus = document.activeElement as HTMLElement | null;
    document.body.style.overflow = 'hidden';
    closeRef.current?.focus();
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault();
        if (!importing) onClose();
      }
      if (event.key !== 'Tab' || !dialogRef.current) return;
      const buttons = Array.from(dialogRef.current.querySelectorAll<HTMLElement>('button:not([disabled]),input:not([disabled])'));
      if (!buttons.length) return;
      if (event.shiftKey && document.activeElement === buttons[0]) {
        event.preventDefault();
        buttons[buttons.length - 1].focus();
      } else if (!event.shiftKey && document.activeElement === buttons[buttons.length - 1]) {
        event.preventDefault();
        buttons[0].focus();
      }
    }
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = previous;
      document.removeEventListener('keydown', onKeyDown);
      previousFocus?.focus();
    };
  }, [importing, onClose]);

  if (typeof document === 'undefined') return null;

  const foundExisting = preview.students.filter((s) => existingIds.has(s.id)).length;
  const newStudents = preview.students.length - foundExisting;
  const count = mode === 'update' ? preview.students.length : newStudents;
  const canImport = !preview.errors.length && count > 0 && !importing;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center sm:p-5">
      <button type="button" aria-label="Tutup impor" disabled={importing} onClick={onClose} className="absolute inset-0 bg-[#102719]/50" />
      <section ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="student-import-title" className="relative flex max-h-[94dvh] w-full flex-col overflow-hidden rounded-t-[24px] bg-white sm:max-w-[520px] sm:rounded-[22px]">
        <div className="flex shrink-0 items-center justify-between border-b border-[#E6ECE7] px-5 py-4 sm:px-6">
          <h2 id="student-import-title" className="text-[17px] font-bold text-[#142019]">Impor Data Santri</h2>
          <button ref={closeRef} type="button" disabled={importing} aria-label="Tutup" onClick={onClose} className={`${focus} flex h-9 w-9 items-center justify-center rounded-xl bg-[#F3F7F4] text-[#506157] disabled:opacity-40`}><X size={19} /></button>
        </div>
        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-5 sm:px-6">
          <div className="min-w-0 rounded-xl border border-[#E6ECE7] bg-[#F8FAF8] p-4">
            <p className="truncate text-[12px] font-semibold text-[#253B2C]">{preview.filename}</p>
            <div className="mt-3 grid grid-cols-3 gap-2 text-center">
              {[
                { label: 'Valid', value: preview.students.length },
                { label: 'Baru', value: newStudents },
                { label: 'Sudah ada', value: foundExisting },
              ].map((item) => <div key={item.label}><p className="text-[20px] font-extrabold text-[#105D38]">{item.value}</p><p className="text-[10px] text-[#718077]">{item.label}</p></div>)}
            </div>
          </div>

          {preview.errors.length > 0 && (
            <div role="alert" className="rounded-xl border border-[#F0DAD6] bg-[#FFF7F5] p-3.5 text-[12px] text-[#A94E47]">
              <p className="font-bold">{preview.errors.length} baris bermasalah. Perbaiki CSV sebelum impor.</p>
              <ul className="mt-2 list-disc space-y-1 pl-4">{preview.errors.slice(0, 5).map((message, i) => <li key={i}>{message}</li>)}</ul>
              {preview.errors.length > 5 && <p className="mt-2">Dan {preview.errors.length - 5} masalah lainnya.</p>}
            </div>
          )}

          {!preview.errors.length && foundExisting > 0 && (
            <fieldset disabled={importing}>
              <legend className="mb-2 text-[12px] font-bold text-[#253B2C]">Jika NIS sudah terdaftar</legend>
              <div className="space-y-2">
                <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-[#E6ECE7] px-3.5 py-3 text-[12px] text-[#354A3B]">
                  <input type="radio" name="duplicate-import" checked={mode === 'skip'} onChange={() => onModeChange('skip')} className="accent-[#105D38]" /> Lewati data lama
                </label>
                <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-[#E6ECE7] px-3.5 py-3 text-[12px] text-[#354A3B]">
                  <input type="radio" name="duplicate-import" checked={mode === 'update'} onChange={() => onModeChange('update')} className="accent-[#105D38]" /> Perbarui data berdasarkan NIS
                </label>
              </div>
              {mode === 'update' && <p className="mt-2 text-[11px] leading-relaxed text-[#94712C]">Saldo awal dan limit data lama akan berubah. Riwayat transaksi tidak dihapus.</p>}
            </fieldset>
          )}

          {!preview.errors.length && preview.students.length > 0 && (
            <div>
              <p className="mb-2 text-[12px] font-bold text-[#253B2C]">Pratinjau</p>
              <div className="divide-y divide-[#EDF1ED] rounded-xl border border-[#E6ECE7]">
                {preview.students.slice(0, 3).map((student) => (
                  <div key={student.id} className="flex items-center justify-between gap-3 px-3.5 py-3">
                    <div className="min-w-0"><p className="truncate text-[12px] font-semibold text-[#253B2C]">{student.name}</p><p className="mt-1 text-[10px] text-[#819087]">{student.id} · {student.className}</p></div>
                    <span className="text-[10px] font-semibold text-[#105D38]">{existingIds.has(student.id) ? 'Terdaftar' : 'Baru'}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        <div className="shrink-0 border-t border-[#E6ECE7] px-5 pb-[calc(16px+env(safe-area-inset-bottom))] pt-4 sm:px-6 sm:pb-5">
          <button type="button" disabled={!canImport} onClick={onConfirm} className={`${focus} flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#105D38] text-[13px] font-semibold text-white hover:bg-[#0B482B] disabled:cursor-not-allowed disabled:opacity-40`}>
            <Upload size={17} />{importing ? `Mengimpor ${progress}/${count}...` : count ? `Impor ${count} Santri` : 'Tidak ada data baru'}
          </button>
        </div>
      </section>
    </div>,
    document.body
  );
}

function Avatar({ student }: { student: Student }) {
  return <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#ECF7EF] text-[12px] font-extrabold text-[#105D38]">{student.initial || student.name.slice(0, 2).toUpperCase()}</span>;
}

function StudentForm({
  student, originalId, error, onChange, onClose, onSave,
}: {
  student: Student;
  originalId: string;
  error: string;
  onChange: (student: Student) => void;
  onClose: () => void;
  onSave: (event: FormEvent<HTMLFormElement>) => void;
}) {
  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    function escape(event: KeyboardEvent) { if (event.key === 'Escape') onClose(); }
    document.addEventListener('keydown', escape);
    return () => { document.body.style.overflow = previous; document.removeEventListener('keydown', escape); };
  }, [onClose]);

  if (typeof document === 'undefined') return null;
  const updateNumber = (key: 'openingBalance' | 'dailyLimit', value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 12);
    onChange({ ...student, [key]: Number(digits) });
  };

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center sm:p-5">
      <button type="button" onClick={onClose} aria-label="Tutup form" className="absolute inset-0 bg-[#102719]/50" />
      <section role="dialog" aria-modal="true" aria-labelledby="student-editor-title" className="relative flex max-h-[94dvh] w-full flex-col overflow-hidden rounded-t-[24px] bg-white sm:max-w-[520px] sm:rounded-[22px]">
        <div className="flex shrink-0 items-center justify-between border-b border-[#E6ECE7] px-5 py-4 sm:px-6">
          <h2 id="student-editor-title" className="text-[17px] font-bold text-[#142019]">{originalId ? 'Ubah Data Santri' : 'Tambah Santri'}</h2>
          <button type="button" aria-label="Tutup" onClick={onClose} className={`${focus} flex h-9 w-9 items-center justify-center rounded-xl bg-[#F3F7F4] text-[#506157]`}><X size={19} /></button>
        </div>
        <form id="student-editor-form" onSubmit={onSave} className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <label className="block text-[12px] font-semibold text-[#506157]">NIS
              <input required disabled={Boolean(originalId)} value={student.id} onChange={(event) => onChange({ ...student, id: event.target.value.replace(/\D/g, '').slice(0, 16) })} className={field} placeholder="20260007" type="text" inputMode="numeric" />
            </label>
            <label className="block text-[12px] font-semibold text-[#506157]">Kelas
              <input required maxLength={40} value={student.className} onChange={(event) => onChange({ ...student, className: event.target.value })} className={field} placeholder="VIII A" />
            </label>
            <label className="block text-[12px] font-semibold text-[#506157] sm:col-span-2">Nama Lengkap
              <input required maxLength={100} value={student.name} onChange={(event) => onChange({ ...student, name: event.target.value })} className={field} placeholder="Nama santri" />
            </label>
            <label className="block text-[12px] font-semibold text-[#506157]">Saldo Awal (Rp)
              <input required type="text" inputMode="numeric" value={student.openingBalance.toLocaleString('id-ID')} onChange={(event) => updateNumber('openingBalance', event.target.value)} className={field} />
            </label>
            <label className="block text-[12px] font-semibold text-[#506157]">Limit Harian (Rp)
              <input required type="text" inputMode="numeric" value={student.dailyLimit.toLocaleString('id-ID')} onChange={(event) => updateNumber('dailyLimit', event.target.value)} className={field} />
            </label>
          </div>
          {error && <p role="alert" className="mt-4 rounded-xl border border-[#F0DAD6] bg-[#FFF7F5] px-3.5 py-3 text-[12px] font-medium text-[#B44747]">{error}</p>}
        </form>
        <div className="shrink-0 border-t border-[#E6ECE7] px-5 pb-[calc(16px+env(safe-area-inset-bottom))] pt-4 sm:px-6 sm:pb-5">
          <button type="submit" form="student-editor-form" className={`${focus} flex h-12 w-full items-center justify-center rounded-xl bg-[#105D38] text-[13px] font-semibold text-white hover:bg-[#0B482B]`}>Simpan Santri</button>
        </div>
      </section>
    </div>, document.body
  );
}

export default function Santri() {
  const { kasir, deposits, saveStudent } = useManajemen();
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<Student | null>(null);
  const [originalId, setOriginalId] = useState('');
  const [error, setError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [importMode, setImportMode] = useState<ImportMode>('skip');
  const [importing, setImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [importError, setImportError] = useState('');
  const closeImport = useCallback(() => { if (!importing) setPreview(null); }, [importing]);

  const existingIds = useMemo(() => new Set(kasir.students.map((s) => s.id)), [kasir.students]);

  const rows = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    return kasir.students.filter((student) => `${student.name} ${student.id} ${student.className}`.toLowerCase().includes(keyword));
  }, [kasir.students, search]);

  function openEditor(student?: Student) {
    setEditing(student ? { ...student } : emptyStudent());
    setOriginalId(student?.id ?? '');
    setError('');
  }

  function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editing) return;
    const student: Student = {
      ...editing,
      id: editing.id.trim(),
      name: editing.name.trim(),
      className: editing.className.trim(),
      initial: editing.name.trim().split(/\s+/).slice(0, 2).map((part) => part[0] || '').join('').toUpperCase(),
    };
    if (!student.id || !student.name || !student.className ||
      !Number.isSafeInteger(student.openingBalance) || student.openingBalance < 0 ||
      !Number.isSafeInteger(student.dailyLimit) || student.dailyLimit <= 0) {
      setError('Periksa NIS, nama, kelas, saldo, dan limit.');
      return;
    }
    if (student.id !== originalId && kasir.students.some((item) => item.id === student.id)) {
      setError('NIS sudah digunakan.');
      return;
    }
    const ok = saveStudent(student);
    if (ok) setEditing(null);
    else setError('Gagal menyimpan data santri.');
  }

  function download() {
    // Gunakan saldo awal, bukan saldo tersedia, agar CSV bisa diimpor ulang tanpa saldo ganda.
    exportCSV('dosi-santri.csv',
      ['NIS', 'Nama', 'Kelas', 'Saldo Awal', 'Limit Harian', 'Saldo Tersedia'],
      rows.map((student) => [
        student.id, student.name, student.className,
        student.openingBalance, student.dailyLimit,
        balanceOf(kasir, student, deposits),
      ])
    );
  }

  function downloadTemplate() {
    exportCSV('template-impor-santri.csv',
      ['NIS', 'Nama', 'Kelas', 'Saldo Awal', 'Limit Harian'], []);
  }

  async function readImportFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    setImportResult(null);
    setImportError('');
    setImportMode('skip');

    if (!file.name.toLowerCase().endsWith('.csv')) {
      setImportError('Pilih file CSV. File Excel dapat disimpan sebagai CSV UTF-8.');
      return;
    }
    if (file.size > 4 * 1024 * 1024) {
      setImportError('Ukuran file maksimal 4 MB.');
      return;
    }
    try {
      const content = await file.text();
      setPreview(parseStudentImport(content, file.name));
    } catch (cause) {
      setImportError(cause instanceof Error ? cause.message : 'File tidak dapat dibaca.');
    }
  }

  async function confirmImport() {
    if (!preview || importing || preview.errors.length) return;
    const candidates = preview.students.filter((student) =>
      importMode === 'update' || !existingIds.has(student.id));
    if (!candidates.length) return;

    setImporting(true);
    setImportProgress(0);
    let created = 0, updated = 0, failed = 0;
    // Simpan satu per satu lewat provider, tanpa langsung mengubah localStorage.
    for (const student of candidates) {
      try {
        const ok = saveStudent(student);
        if (ok) {
          if (existingIds.has(student.id)) updated += 1;
          else created += 1;
        } else failed += 1;
      } catch {
        failed += 1;
      }
      setImportProgress(created + updated + failed);
      // Beri kesempatan React menyimpan perubahan sebelum entri berikutnya.
      await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
    }
    setImportResult({
      created, updated, failed,
      skipped: preview.students.length - candidates.length,
    });
    setPreview(null);
    setImporting(false);
    setSearch('');
  }

  return (
    <div className="min-w-0 text-[#142019]">
      <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div><h1 className="text-[24px] font-extrabold tracking-[-.8px] sm:text-[30px]">Data Santri</h1><p className="mt-1 text-[12px] text-[#718077] sm:text-[13px]">Profil dan saldo santri</p></div>
        <div className="flex w-full items-center gap-2 sm:w-auto">
          <input ref={fileRef} type="file" accept=".csv,text/csv" onChange={readImportFile} className="sr-only" tabIndex={-1} aria-label="Pilih file CSV santri" />
          <button type="button" onClick={() => fileRef.current?.click()} className={`${focus} inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-xl border border-[#E6ECE7] bg-white px-3 text-[12px] font-semibold text-[#105D38] hover:bg-[#F7FAF8] sm:flex-none`}><Upload size={17} />Impor</button>
          <button type="button" onClick={download} disabled={!rows.length} className={`${focus} inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-xl border border-[#E6ECE7] bg-white px-3 text-[12px] font-semibold text-[#105D38] hover:bg-[#F7FAF8] disabled:opacity-40 sm:flex-none`}><Download size={17} />Ekspor</button>
          <button type="button" onClick={() => openEditor()} className={`${focus} inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-[#105D38] px-3 text-[12px] font-semibold text-white hover:bg-[#0B482B] sm:flex-none sm:px-4`}><Plus size={17} /><span className="sm:hidden">Tambah</span><span className="hidden sm:inline">Tambah Santri</span></button>
        </div>
      </header>

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <button type="button" onClick={downloadTemplate} className={`${focus} inline-flex items-center gap-1.5 text-[12px] font-semibold text-[#105D38] hover:underline`}><FileDown size={16} />Unduh template CSV</button>
      </div>
      {importError && <div role="alert" className="mb-4 flex items-start justify-between gap-3 rounded-xl border border-[#F0DAD6] bg-[#FFF7F5] px-4 py-3 text-[12px] text-[#A94E47]"><span>{importError}</span><button type="button" onClick={() => setImportError('')} aria-label="Tutup kesalahan"><X size={16} /></button></div>}
      {importResult && <div role="status" className="mb-4 flex items-start gap-3 rounded-xl border border-[#D6EADC] bg-[#F1F9F3] px-4 py-3 text-[12px] text-[#105D38]"><CheckCircle2 size={18} className="mt-0.5 shrink-0" /><div className="min-w-0"><p className="font-bold">Impor selesai</p><p className="mt-1">{importResult.created} baru · {importResult.updated} diperbarui · {importResult.skipped} dilewati{importResult.failed > 0 ? ` · ${importResult.failed} gagal` : ''}</p></div><button type="button" onClick={() => setImportResult(null)} className="ml-auto" aria-label="Tutup pesan"><X size={16} /></button></div>}

      <section className={`${card} min-w-0 overflow-hidden`}>
        <div className="flex flex-col gap-3 border-b border-[#E6ECE7] p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
          <div><h2 className="text-[16px] font-bold tracking-[-.3px]">Daftar Santri</h2><p className="mt-1 text-[11px] text-[#718077]">{rows.length} santri</p></div>
          <div className="relative w-full sm:max-w-[330px]"><Search size={18} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#91A096]" /><input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Cari nama, NIS, kelas" aria-label="Cari santri" className={`${focus} h-11 w-full rounded-xl border border-[#E1E9E3] bg-white pl-10 pr-4 text-[13px] outline-none placeholder:text-[#A3AFA5] focus:border-[#105D38]`} /></div>
        </div>

        {!rows.length ? <div className="flex flex-col items-center px-5 py-14 text-center"><GraduationCap size={28} className="text-[#105D38]" /><p className="mt-3 text-[13px] font-semibold">{search ? 'Santri tidak ditemukan' : 'Belum ada santri'}</p>{search && <button type="button" onClick={() => setSearch('')} className="mt-3 text-[12px] font-semibold text-[#105D38]">Reset pencarian</button>}</div> : <>
          {/* Mobile cards: tap to edit */}
          <div className="divide-y divide-[#EDF1ED] lg:hidden">
            {rows.map((student) => (
              <button key={student.id} type="button" onClick={() => openEditor(student)} className={`${focus} flex w-full items-center gap-3 px-4 py-4 text-left hover:bg-[#F7FAF8] active:bg-[#ECF7EF]`}>
                <Avatar student={student} />
                <span className="min-w-0 flex-1"><span className="block truncate text-[13px] font-bold text-[#142019]">{student.name}</span><span className="mt-1 block truncate text-[11px] text-[#718077]">{student.id} · {student.className}</span><span className="mt-1 block text-[10px] text-[#91A096]">Limit {rp(effectiveLimit(student))}</span></span>
                <span className="shrink-0 text-right"><span className="block text-[12px] font-bold tabular-nums text-[#105D38]">{rp(balanceOf(kasir, student, deposits))}</span><span className="mt-1 inline-flex items-center justify-end gap-1 text-[10px] text-[#718077]"><Pencil size={11} />Ubah</span></span>
              </button>
            ))}
          </div>
          {/* Desktop table */}
          <div className="hidden lg:block"><table className="w-full table-fixed border-collapse text-left">
            <thead className="bg-[#FAFCFA] text-[11px] text-[#718077]"><tr><th className="w-[30%] px-5 py-3.5 font-semibold">Santri</th><th className="w-[17%] px-3 py-3.5 font-semibold">Kelas</th><th className="w-[22%] px-3 py-3.5 font-semibold">Saldo</th><th className="w-[21%] px-3 py-3.5 font-semibold">Limit Harian</th><th className="w-[10%] px-5 py-3.5 text-right font-semibold">Aksi</th></tr></thead>
            <tbody className="divide-y divide-[#EDF1ED]">{rows.map((student) => <tr key={student.id} className="hover:bg-[#F8FBF8]"><td className="px-5 py-3.5"><div className="flex min-w-0 items-center gap-3"><Avatar student={student} /><div className="min-w-0"><p className="truncate text-[12px] font-semibold text-[#142019]">{student.name}</p><p className="mt-1 truncate text-[11px] text-[#91A096]">{student.id}</p></div></div></td><td className="truncate px-3 py-3.5 text-[12px] text-[#718077]">{student.className}</td><td className="whitespace-nowrap px-3 py-3.5 text-[12px] font-bold tabular-nums text-[#105D38]">{rp(balanceOf(kasir, student, deposits))}</td><td className="whitespace-nowrap px-3 py-3.5 text-[12px] text-[#526459]">{rp(effectiveLimit(student))}</td><td className="px-5 py-3.5 text-right"><button type="button" onClick={() => openEditor(student)} className={`${focus} rounded-lg border border-[#DDE9E0] px-3 py-2 text-[11px] font-semibold text-[#105D38] hover:bg-[#ECF7EF]`}>Ubah</button></td></tr>)}</tbody>
          </table></div>
        </>}
        <p className="border-t border-[#EDF1ED] px-4 py-3 text-[11px] leading-relaxed text-[#819087] sm:px-5">Saldo dihitung dari saldo awal, deposit, dan belanja yang tercatat.</p>
      </section>

      {editing && <StudentForm student={editing} originalId={originalId} error={error} onChange={(value) => { setEditing(value); setError(''); }} onClose={() => setEditing(null)} onSave={save} />}
      {preview && <ImportDialog preview={preview} existingIds={existingIds} mode={importMode} onModeChange={setImportMode} onClose={closeImport} onConfirm={confirmImport} importing={importing} progress={importProgress} />}
    </div>
  );
}
