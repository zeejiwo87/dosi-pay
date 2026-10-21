'use client';

import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { createPortal } from 'react-dom';
import {
  Check, ChevronDown, Download, Plus, Search, ShieldCheck,
  UserRound, Users, X,
} from 'lucide-react';
import { useManajemen } from '../components/ManajemenProvider';
import { exportCSV, uid, type AdminUser } from '../lib/data';

const panel = 'rounded-[20px] border border-[#E6ECE7] bg-white';
const focus = 'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#D5A52D]';
const input = `h-11 w-full rounded-[12px] border border-[#DFE8E1] bg-white px-3.5 text-[13px] text-[#142019] outline-none placeholder:text-[#A0AEA3] focus:border-[#105D38] ${focus}`;
const blank = (): AdminUser => ({ id: '', name: '', username: '', role: 'Wali', active: true, studentId: '' });
type RoleFilter = 'Semua' | AdminUser['role'];

function Initials({ name }: { name: string }) {
  const letters = name.trim().split(/\s+/).slice(0, 2).map(part => part[0] ?? '').join('').toUpperCase();
  return <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[13px] bg-[#ECF7EF] text-[13px] font-extrabold text-[#105D38]">{letters || <UserRound size={19} />}</span>;
}

function StateBadge({ active }: { active: boolean }) {
  return <span className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold ${active ? 'bg-[#ECF7EF] text-[#105D38]' : 'bg-[#F1F3F1] text-[#75847A]'}`}>
    <span className={`h-1.5 w-1.5 rounded-full ${active ? 'bg-[#2E9958]' : 'bg-[#ABB8AE]'}`} />
    {active ? 'Aktif' : 'Nonaktif'}
  </span>;
}

function UserSheet({
  user, students, isEdit, error, onChange, onClose, onSubmit,
}: {
  user: AdminUser;
  students: { id: string; name: string }[];
  isEdit: boolean;
  error: string;
  onChange: (next: AdminUser) => void;
  onClose: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  const closeRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const previous = document.body.style.overflow;
    const previousFocus = document.activeElement as HTMLElement | null;
    document.body.style.overflow = 'hidden';
    closeRef.current?.focus();
    const esc = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose(); };
    document.addEventListener('keydown', esc);
    return () => { document.body.style.overflow = previous; document.removeEventListener('keydown', esc); previousFocus?.focus(); };
  }, [onClose]);

  if (typeof document === 'undefined') return null;
  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center sm:p-5">
      <button type="button" aria-label="Tutup form" onClick={onClose} className="absolute inset-0 bg-[#102719]/50" />
      <section role="dialog" aria-modal="true" aria-labelledby="user-sheet-title" className="dosi-sheet relative flex max-h-[93dvh] w-full flex-col overflow-hidden rounded-t-[24px] bg-white sm:max-w-[490px] sm:rounded-[22px]">
        <header className="flex shrink-0 items-center justify-between border-b border-[#E6ECE7] px-5 py-4 sm:px-6">
          <h2 id="user-sheet-title" className="text-[17px] font-bold tracking-[-.4px] text-[#142019]">{isEdit ? 'Kelola Pengguna' : 'Tambah Pengguna'}</h2>
          <button ref={closeRef} type="button" onClick={onClose} aria-label="Tutup" className={`${focus} flex h-9 w-9 items-center justify-center rounded-[10px] bg-[#F3F7F4] text-[#506157]`}><X size={19}/></button>
        </header>
        <form id="user-form" onSubmit={onSubmit} className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-5 sm:px-6">
          <label className="block text-[12px] font-semibold text-[#506157]">Nama lengkap
            <input required maxLength={80} autoComplete="off" value={user.name} onChange={e => onChange({ ...user, name: e.target.value })} placeholder="Nama pengguna" className={`${input} mt-2`} />
          </label>
          <label className="block text-[12px] font-semibold text-[#506157]">Username
            <input required maxLength={50} autoComplete="off" value={user.username} onChange={e => onChange({ ...user, username: e.target.value })} placeholder="username" className={`${input} mt-2`} />
          </label>
          <label className="block text-[12px] font-semibold text-[#506157]">Peran
            <div className="relative mt-2">
              <select value={user.role} onChange={e => { const role = e.target.value as AdminUser['role']; onChange({ ...user, role, studentId: role === 'Wali' ? user.studentId : '' }); }} className={`${input} appearance-none pr-9`}>
                <option value="Manajemen">Manajemen</option>
                <option value="Kasir">Kasir</option>
                <option value="Wali">Wali</option>
              </select>
              <ChevronDown size={16} className="pointer-events-none absolute right-3 top-3.5 text-[#7C8D81]" />
            </div>
          </label>
          {user.role === 'Wali' && <label className="block text-[12px] font-semibold text-[#506157]">Santri terkait
            <div className="relative mt-2">
              <select value={user.studentId || ''} onChange={e => onChange({ ...user, studentId: e.target.value })} className={`${input} appearance-none pr-9`}>
                <option value="">Belum ditautkan</option>
                {students.map(s => <option key={s.id} value={s.id}>{s.name} · {s.id}</option>)}
              </select>
              <ChevronDown size={16} className="pointer-events-none absolute right-3 top-3.5 text-[#7C8D81]" />
            </div>
          </label>}
          <label className="flex cursor-pointer items-center justify-between gap-4 rounded-[13px] border border-[#E6ECE7] px-4 py-3.5">
            <span className="text-[13px] font-semibold text-[#24382B]">Pengguna aktif</span>
            <input type="checkbox" checked={user.active} onChange={e => onChange({ ...user, active: e.target.checked })} className="h-[18px] w-[18px] accent-[#105D38]" />
          </label>
          {error && <p role="alert" className="rounded-[12px] border border-[#F0DAD6] bg-[#FFF7F5] px-3.5 py-3 text-[12px] font-medium text-[#B44747]">{error}</p>}
        </form>
        <footer className="shrink-0 border-t border-[#E6ECE7] px-5 pb-[calc(16px+env(safe-area-inset-bottom))] pt-4 sm:px-6 sm:pb-5">
          <button type="submit" form="user-form" className={`${focus} flex h-12 w-full items-center justify-center gap-2 rounded-[12px] bg-[#105D38] text-[13px] font-semibold text-white hover:bg-[#0B482B]`}><Check size={17}/>Simpan Pengguna</button>
        </footer>
      </section>
      <style jsx global>{`@keyframes dosiSheetIn { from { opacity: .6; transform: translateY(14px); } to { opacity: 1; transform: translateY(0); } } .dosi-sheet {animation: dosiSheetIn 180ms ease-out both;} @media (prefers-reduced-motion: reduce) {.dosi-sheet {animation:none;}}`}</style>
    </div>, document.body
  );
}

export default function Pengguna() {
  const { admin, kasir, saveUser } = useManajemen();
  const [search, setSearch] = useState('');
  const [role, setRole] = useState<RoleFilter>('Semua');
  const [edit, setEdit] = useState<AdminUser | null>(null);
  const [error, setError] = useState('');
  const isEdit = Boolean(edit?.id);
  const closeEditor = useCallback(() => setEdit(null), []);

  const users = useMemo(() => admin.users.filter(user => {
    const matchesSearch = `${user.name} ${user.username} ${user.role}`.toLowerCase().includes(search.trim().toLowerCase());
    return matchesSearch && (role === 'Semua' || user.role === role);
  }), [admin.users, search, role]);

  function openEditor(user?: AdminUser) {
    setEdit(user ? { ...user } : blank());
    setError('');
  }

  function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!edit) return;
    const item: AdminUser = {
      ...edit,
      id: edit.id || uid('USER'),
      name: edit.name.trim(),
      username: edit.username.trim(),
      studentId: edit.role === 'Wali' ? edit.studentId : '',
    };
    if (!item.name || !item.username) { setError('Nama dan username wajib diisi.'); return; }
    if (admin.users.some(user => user.id !== item.id && user.username.toLowerCase() === item.username.toLowerCase())) {
      setError('Username sudah digunakan.'); return;
    }
    if (saveUser(item)) { setEdit(null); setError(''); }
    else setError('Pengguna tidak dapat disimpan.');
  }

  function download() {
    exportCSV('dosi-pengguna.csv', ['Nama', 'Username', 'Peran', 'NIS', 'Status'],
      users.map(user => [user.name, user.username, user.role, user.studentId || '', user.active ? 'Aktif' : 'Nonaktif']));
  }

  return <div className="w-full min-w-0 text-[#142019]">
    <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
      <div><h1 className="text-[24px] font-extrabold tracking-[-.8px] sm:text-[30px]">Pengguna & Akses</h1><p className="mt-1 text-[12px] text-[#718077] sm:text-[13px]">Kelola akun pengguna</p></div>
      <div className="flex items-center gap-2">
        <button type="button" onClick={download} disabled={!users.length} className={`${focus} inline-flex h-11 items-center gap-2 rounded-[12px] border border-[#E6ECE7] px-3 text-[12px] font-semibold text-[#105D38] hover:bg-[#F7FAF8] disabled:opacity-40`}><Download size={17}/><span>CSV</span></button>
        <button type="button" onClick={() => openEditor()} className={`${focus} inline-flex h-11 items-center gap-2 rounded-[12px] bg-[#105D38] px-3.5 text-[12px] font-semibold text-white hover:bg-[#0B482B] sm:px-4`}><Plus size={17}/>Tambah Pengguna</button>
      </div>
    </header>

    <div className="mb-5 grid grid-cols-3 gap-3">
      {(['Manajemen', 'Kasir', 'Wali'] as const).map(name => <div key={name} className={`${panel} min-w-0 p-3.5 sm:p-5`}>
        <p className="truncate text-[11px] font-medium text-[#718077] sm:text-[12px]">{name}</p>
        <p className="mt-2 text-[23px] font-extrabold tabular-nums text-[#105D38] sm:text-[27px]">{admin.users.filter(user => user.role === name).length}</p>
      </div>)}
    </div>

    <section className={`${panel} min-w-0 overflow-hidden`}>
      <div className="flex flex-col gap-3 border-b border-[#E6ECE7] p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
        <div className="shrink-0"><h2 className="text-[16px] font-bold">Daftar Pengguna</h2><p className="mt-1 text-[11px] text-[#718077]">{users.length} pengguna</p></div>
        <div className="flex min-w-0 flex-col gap-2 sm:flex-1 sm:flex-row sm:justify-end">
          <div className="relative min-w-0 sm:max-w-[320px] sm:flex-1"><Search size={17} className="pointer-events-none absolute left-3.5 top-3.5 text-[#8D9C91]"/><input type="search" value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari pengguna" aria-label="Cari pengguna" className={`${input} pl-10`}/></div>
          <div className="relative sm:w-[145px]"><select aria-label="Filter peran" value={role} onChange={e => setRole(e.target.value as RoleFilter)} className={`${input} appearance-none pr-9`}><option value="Semua">Semua peran</option><option value="Manajemen">Manajemen</option><option value="Kasir">Kasir</option><option value="Wali">Wali</option></select><ChevronDown size={15} className="pointer-events-none absolute right-3 top-3.5 text-[#829187]"/></div>
        </div>
      </div>

      {users.length ? <div className="grid gap-3 p-4 sm:grid-cols-2 sm:p-5 xl:grid-cols-3">
        {users.map(user => <article key={user.id} className="flex min-w-0 flex-col rounded-[15px] border border-[#E6ECE7] bg-white p-4 transition-colors hover:border-[#C9DFCF]">
          <div className="flex items-start gap-3"><Initials name={user.name}/><div className="min-w-0 flex-1"><p className="truncate text-[13px] font-bold text-[#142019]">{user.name}</p><p className="mt-1 truncate text-[11px] text-[#819087]">@{user.username}</p></div><StateBadge active={user.active}/></div>
          <div className="mt-4 flex items-center justify-between gap-3 border-t border-[#EDF1ED] pt-3"><div className="min-w-0"><p className="text-[12px] font-semibold text-[#506157]">{user.role}</p>{user.role === 'Wali' && user.studentId && <p className="mt-0.5 truncate text-[10px] text-[#91A096]">NIS {user.studentId}</p>}</div><button type="button" onClick={() => openEditor(user)} className={`${focus} rounded-[10px] border border-[#DDE9E0] px-3 py-2 text-[11px] font-semibold text-[#105D38] hover:bg-[#ECF7EF]`}>Kelola</button></div>
        </article>)}
      </div> : <div className="flex flex-col items-center px-5 py-14 text-center"><Users size={28} className="text-[#105D38]"/><p className="mt-3 text-[13px] font-semibold">Pengguna tidak ditemukan</p>{(search || role !== 'Semua') && <button type="button" onClick={() => {setSearch('');setRole('Semua');}} className={`${focus} mt-3 text-[12px] font-semibold text-[#105D38]`}>Reset filter</button>}</div>}
      <div className="flex items-start gap-2 border-t border-[#EDF1ED] px-4 py-3 text-[11px] leading-relaxed text-[#819087] sm:px-5"><ShieldCheck size={15} className="mt-0.5 shrink-0"/><span>Peran dan status belum mengatur autentikasi login.</span></div>
    </section>

    {edit && <UserSheet user={edit} students={kasir.students} isEdit={isEdit} error={error} onChange={next => {setEdit(next); setError('');}} onClose={closeEditor} onSubmit={save}/>}
  </div>;
}
