'use client';

import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  ArrowRight, Check, CheckCircle2, Clock3, Download,
  Landmark, ReceiptText, Wallet, X, type LucideIcon,
} from 'lucide-react';
import { useManajemen } from '../components/ManajemenProvider';
import { availableSettlement, dayKey, exportCSV, fmt, rp, salesSum, withdrawSum } from '../lib/data';

const panel = 'rounded-[20px] border border-[#E6ECE7] bg-white';
const focus = 'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#D5A52D]';

function Metric({ label, value, icon: Icon, gold = false }: { label: string; value: string; icon: LucideIcon; gold?: boolean }) {
  return <article className={`${panel} min-w-0 p-4 sm:p-5`}>
    <span className={`flex h-10 w-10 items-center justify-center rounded-[12px] ${gold ? 'bg-[#FAF1D8] text-[#967014]' : 'bg-[#ECF7EF] text-[#105D38]'}`}><Icon size={19} strokeWidth={1.9}/></span>
    <p className="mt-4 text-[12px] font-medium text-[#718077] sm:text-[13px]">{label}</p>
    <p className="mt-1 break-words text-[clamp(16px,2.5vw,26px)] font-extrabold leading-[1.35] tracking-[-.7px] tabular-nums text-[#142019] [overflow-wrap:anywhere]">{value}</p>
  </article>;
}

function ReconcileBadge({ done }: { done: boolean }) {
  return <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold ${done ? 'bg-[#ECF7EF] text-[#105D38]' : 'bg-[#FAF1D8] text-[#886919]'}`}>
    {done ? <Check size={12} strokeWidth={2.5}/> : <Clock3 size={12}/>} {done ? 'Sudah cocok' : 'Belum cocok'}
  </span>;
}

function ReconcileSheet({
  amount, id, onClose, onConfirm, error,
}: {
  amount: number;
  id: string;
  onClose: () => void;
  onConfirm: () => void;
  error: string;
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
      <button type="button" aria-label="Tutup konfirmasi" onClick={onClose} className="absolute inset-0 bg-[#102719]/50"/>
      <section role="dialog" aria-modal="true" aria-labelledby="reconcile-title" className="dosi-reconcile-sheet relative w-full overflow-hidden rounded-t-[24px] bg-white sm:max-w-[440px] sm:rounded-[22px]">
        <header className="flex items-center justify-between border-b border-[#E6ECE7] px-5 py-4 sm:px-6"><h2 id="reconcile-title" className="text-[17px] font-bold text-[#142019]">Tandai Penarikan Cocok?</h2><button ref={closeRef} type="button" onClick={onClose} aria-label="Tutup" className={`${focus} flex h-9 w-9 items-center justify-center rounded-[10px] bg-[#F3F7F4] text-[#506157]`}><X size={19}/></button></header>
        <div className="px-5 py-5 sm:px-6"><div className="rounded-[15px] bg-[#F5F9F6] p-4"><p className="text-[11px] text-[#718077]">Nominal penarikan</p><p className="mt-1 text-[27px] font-extrabold tracking-[-.7px] text-[#105D38]">{rp(amount)}</p><p className="mt-2 break-all text-[11px] text-[#819087]">{id}</p></div><p className="mt-4 text-[12px] leading-relaxed text-[#718077]">Status ini untuk pemeriksaan internal, bukan bukti transfer bank.</p>{error && <p role="alert" className="mt-3 rounded-[10px] bg-[#FFF7F5] px-3 py-2 text-[12px] text-[#B44747]">{error}</p>}</div>
        <footer className="flex gap-3 border-t border-[#E6ECE7] px-5 pb-[calc(16px+env(safe-area-inset-bottom))] pt-4 sm:px-6 sm:pb-5"><button type="button" onClick={onClose} className={`${focus} h-12 flex-1 rounded-[12px] border border-[#E6ECE7] text-[13px] font-semibold text-[#526459] hover:bg-[#F7FAF8]`}>Batal</button><button type="button" onClick={onConfirm} className={`${focus} flex h-12 flex-[1.3] items-center justify-center gap-2 rounded-[12px] bg-[#105D38] text-[13px] font-semibold text-white hover:bg-[#0B482B]`}><Check size={17}/>Tandai Cocok</button></footer>
      </section>
      <style jsx global>{`@keyframes dosiReconcileIn { from {opacity:.6;transform:translateY(14px)} to {opacity:1;transform:translateY(0)} } .dosi-reconcile-sheet {animation:dosiReconcileIn 180ms ease-out both} @media (prefers-reduced-motion:reduce) {.dosi-reconcile-sheet {animation:none}}`}</style>
    </div>, document.body
  );
}

export default function Penarikan() {
  const { kasir, admin, reconcile } = useManajemen();
  const [todayKey, setTodayKey] = useState('');
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const closeConfirm = useCallback(() => { setConfirmId(null); setError(''); }, []);
  useEffect(() => { setTodayKey(dayKey()); }, []);

  const reconciled = admin.reconciledWithdrawalIds;
  const countToday = todayKey ? kasir.withdrawals.filter(w => dayKey(w.time) === todayKey).length : 0;
  const available = availableSettlement(kasir);
  const sales = salesSum(kasir);
  const withdrawn = withdrawSum(kasir);
  const pendingCount = kasir.withdrawals.filter(w => !reconciled.includes(w.id)).length;
  const selected = kasir.withdrawals.find(w => w.id === confirmId) ?? null;

  function download() {
    exportCSV('dosi-penarikan.csv', ['ID', 'Tanggal', 'Kasir', 'Nominal', 'Catatan', 'Rekonsiliasi'],
      kasir.withdrawals.map(w => [w.id, fmt(w.time), w.cashier, w.amount, w.note, reconciled.includes(w.id) ? 'Sudah' : 'Belum']));
  }

  function markReconciled() {
    if (!selected || reconciled.includes(selected.id)) { closeConfirm(); return; }
    try { reconcile(selected.id); closeConfirm(); }
    catch { setError('Gagal memperbarui status penarikan.'); }
  }

  const policy = admin.policy.withdrawalDay === 'any' ? 'Setiap hari' : String(admin.policy.withdrawalDay);

  return <div className="w-full min-w-0 text-[#142019]">
    <header className="mb-6 flex flex-wrap items-center justify-between gap-3"><div><h1 className="text-[24px] font-extrabold tracking-[-.8px] sm:text-[30px]">Penarikan & Kliring</h1><p className="mt-1 text-[12px] text-[#718077] sm:text-[13px]">Pemeriksaan penarikan koperasi</p></div><button type="button" onClick={download} disabled={!kasir.withdrawals.length} className={`${focus} inline-flex h-11 items-center gap-2 rounded-[12px] border border-[#E6ECE7] px-4 text-[12px] font-semibold text-[#105D38] hover:bg-[#F7FAF8] disabled:opacity-40`}><Download size={17}/>Ekspor CSV</button></header>

    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
      <Metric label="Saldo kliring" value={rp(available)} icon={Wallet}/>
      <Metric label="Penjualan tercatat" value={rp(sales)} icon={Landmark} gold/>
      <Metric label="Sudah ditarik" value={rp(withdrawn)} icon={CheckCircle2}/>
      <Metric label="Penarikan hari ini" value={todayKey ? `${countToday} / 1` : '—'} icon={Clock3} gold/>
    </div>

    <div className="mt-5 grid items-start gap-5 xl:grid-cols-[minmax(0,1.6fr)_minmax(270px,.75fr)]">
      <section className={`${panel} min-w-0 overflow-hidden`}>
        <header className="flex items-center justify-between gap-3 border-b border-[#E6ECE7] px-4 py-4 sm:px-5"><div><h2 className="text-[16px] font-bold">Riwayat Penarikan</h2><p className="mt-1 text-[11px] text-[#718077]">{kasir.withdrawals.length} catatan</p></div>{pendingCount > 0 && <span className="rounded-full bg-[#FAF1D8] px-2.5 py-1.5 text-[11px] font-semibold text-[#886919]">{pendingCount} belum cocok</span>}</header>
        {!kasir.withdrawals.length ? <div className="flex flex-col items-center px-5 py-14 text-center"><Landmark size={28} className="text-[#105D38]"/><p className="mt-3 text-[13px] font-semibold">Belum ada penarikan</p></div> : <>
          <div className="divide-y divide-[#EDF1ED] lg:hidden">{kasir.withdrawals.map(w => {
            const done = reconciled.includes(w.id);
            return <article key={w.id} className="px-4 py-4 sm:px-5"><div className="flex items-start gap-3"><span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[13px] bg-[#ECF7EF] text-[#105D38]"><ReceiptText size={20}/></span><div className="min-w-0 flex-1"><p className="truncate text-[13px] font-semibold text-[#142019]">{w.cashier || 'Kasir'}</p><p className="mt-1 text-[11px] text-[#819087]">{fmt(w.time)}</p><p className="mt-1 truncate text-[10px] text-[#A0AEA3]">{w.id}</p></div><span className="shrink-0 whitespace-nowrap text-right text-[13px] font-bold tabular-nums text-[#105D38]">{rp(w.amount)}</span></div><div className="mt-3 flex items-center justify-between gap-3 pl-[56px]"><ReconcileBadge done={done}/>{!done && <button type="button" onClick={() => {setConfirmId(w.id);setError('');}} className={`${focus} rounded-[10px] border border-[#DDE9E0] px-3 py-2 text-[11px] font-semibold text-[#105D38] hover:bg-[#ECF7EF]`}>Tandai cocok</button>}</div></article>;
          })}</div>
          <div className="hidden lg:block"><table className="w-full table-fixed border-collapse text-left"><thead><tr className="border-b border-[#E6ECE7] bg-[#FAFCFA] text-[11px] text-[#718077]"><th className="w-[23%] px-5 py-3.5 font-semibold">Waktu</th><th className="w-[21%] px-3 py-3.5 font-semibold">Kasir</th><th className="w-[22%] px-3 py-3.5 font-semibold">Nominal</th><th className="w-[19%] px-3 py-3.5 font-semibold">Status</th><th className="w-[15%] px-5 py-3.5 text-right font-semibold">Aksi</th></tr></thead><tbody className="divide-y divide-[#EDF1ED]">{kasir.withdrawals.map(w => { const done = reconciled.includes(w.id); return <tr key={w.id} className="hover:bg-[#F8FBF8]"><td className="px-5 py-4 text-[12px] text-[#718077]">{fmt(w.time)}</td><td className="truncate px-3 py-4 text-[12px] font-semibold text-[#142019]">{w.cashier}</td><td className="whitespace-nowrap px-3 py-4 text-[13px] font-bold tabular-nums text-[#105D38]">{rp(w.amount)}</td><td className="px-3 py-4"><ReconcileBadge done={done}/></td><td className="px-5 py-4 text-right">{done ? <Check size={18} className="ml-auto text-[#21834A]"/> : <button type="button" onClick={() => {setConfirmId(w.id);setError('');}} className={`${focus} whitespace-nowrap rounded-[9px] border border-[#DDE9E0] px-3 py-2 text-[11px] font-semibold text-[#105D38] hover:bg-[#ECF7EF]`}>Tandai cocok</button>}</td></tr>; })}</tbody></table></div>
        </>}
      </section>

      <section className={`${panel} p-5 sm:p-6`}><h2 className="text-[16px] font-bold text-[#142019]">Kebijakan Penarikan</h2><div className="mt-5 space-y-4"><div className="flex items-start gap-3"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] bg-[#ECF7EF] text-[#105D38]"><Clock3 size={19}/></span><div><p className="text-[13px] font-semibold text-[#142019]">1 kali per hari</p><p className="mt-1 text-[11px] text-[#718077]">Berdasarkan tanggal WIB</p></div></div><div className="flex items-start gap-3"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] bg-[#FAF1D8] text-[#967014]"><Landmark size={19}/></span><div><p className="text-[13px] font-semibold text-[#142019]">Hari penarikan</p><p className="mt-1 text-[11px] text-[#718077]">{policy}</p></div></div></div>
        <Link href="/manajemen/pengaturan" className={`${focus} mt-6 flex h-11 items-center justify-between rounded-[12px] border border-[#E6ECE7] px-4 text-[12px] font-semibold text-[#105D38] hover:bg-[#F7FAF8]`}>Pengaturan <ArrowRight size={17}/></Link>
        <p className="mt-4 text-[11px] leading-relaxed text-[#829187]">Rekonsiliasi hanya catatan internal. Kebijakan hari belum otomatis membatasi penarikan kasir.</p>
      </section>
    </div>
    {selected && <ReconcileSheet amount={selected.amount} id={selected.id} onClose={closeConfirm} onConfirm={markReconciled} error={error}/>}
  </div>;
}
