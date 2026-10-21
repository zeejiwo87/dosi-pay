'use client';

import { useCallback, useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import {
  ArrowRight,
  Check,
  ChevronRight,
  Coins,
  Download,
  Plus,
  ReceiptText,
  Wallet,
  X,
  type LucideIcon,
} from 'lucide-react';
import { useManajemen } from '../components/ManajemenProvider';
import { billPaid, exportCSV, rp, uid, type Bill } from '../lib/data';

const panel = 'rounded-[20px] border border-[#E6ECE7] bg-white';
const focus = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#D5A52D]';
const input = `${focus} mt-2 h-11 w-full min-w-0 rounded-xl border border-[#E1E9E3] bg-white px-3.5 text-[13px] text-[#142019] outline-none focus:border-[#105D38]`;

type Modal = { mode: 'new' } | { mode: 'pay'; id: string } | null;

function Metric({ label, value, icon: Icon, gold = false }: {
  label: string;
  value: string;
  icon: LucideIcon;
  gold?: boolean;
}) {
  return (
    <article className={`${panel} min-w-0 p-4 sm:p-5`}>
      <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${gold ? 'bg-[#FAF1D8] text-[#967014]' : 'bg-[#ECF7EF] text-[#105D38]'}`}><Icon size={19} /></span>
      <p className="mt-4 text-[12px] text-[#718077]">{label}</p>
      <p className="mt-1 break-words text-[clamp(17px,2.5vw,27px)] font-extrabold tracking-[-.7px] tabular-nums text-[#142019] [overflow-wrap:anywhere]">{value}</p>
    </article>
  );
}

function BillStatus({ paid, total }: { paid: number; total: number }) {
  const finished = paid >= total;
  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-semibold ${finished ? 'bg-[#ECF7EF] text-[#105D38]' : 'bg-[#FAF1D8] text-[#967014]'}`}>
      {finished ? 'Lunas' : paid > 0 ? 'Cicilan' : 'Belum dibayar'}
    </span>
  );
}

function Sheet({ title, subtitle, children, footer, onClose }: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer: ReactNode;
  onClose: () => void;
}) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const boxRef = useRef<HTMLElement>(null);
  useEffect(() => {
    const previous = document.body.style.overflow;
    const active = document.activeElement as HTMLElement | null;
    document.body.style.overflow = 'hidden';
    closeRef.current?.focus();
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') { event.preventDefault(); onClose(); return; }
      if (event.key !== 'Tab' || !boxRef.current) return;
      const items = Array.from(boxRef.current.querySelectorAll<HTMLElement>('button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), a[href]'));
      if (!items.length) return;
      if (event.shiftKey && document.activeElement === items[0]) { event.preventDefault(); items[items.length - 1].focus(); }
      else if (!event.shiftKey && document.activeElement === items[items.length - 1]) { event.preventDefault(); items[0].focus(); }
    }
    document.addEventListener('keydown', onKey);
    return () => { document.body.style.overflow = previous; document.removeEventListener('keydown', onKey); active?.focus(); };
  }, [onClose]);

  if (typeof document === 'undefined') return null;
  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center sm:p-5">
      <button type="button" aria-label="Tutup" onClick={onClose} className="absolute inset-0 bg-[#102719]/50" />
      <section ref={boxRef} role="dialog" aria-modal="true" aria-labelledby="spp-sheet-title" className="relative flex max-h-[94dvh] w-full flex-col overflow-hidden rounded-t-[24px] bg-white shadow-xl sm:max-w-[520px] sm:rounded-[22px]">
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-[#E6ECE7] px-5 py-4 sm:px-6">
          <div className="min-w-0"><h2 id="spp-sheet-title" className="text-[17px] font-bold text-[#142019]">{title}</h2>{subtitle && <p className="mt-1 text-[12px] text-[#718077]">{subtitle}</p>}</div>
          <button ref={closeRef} type="button" aria-label="Tutup" onClick={onClose} className={`${focus} flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#F3F7F4] text-[#526459]`}><X size={19} /></button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-6">{children}</div>
        <div className="shrink-0 border-t border-[#E6ECE7] px-5 pb-[calc(16px+env(safe-area-inset-bottom))] pt-4 sm:px-6 sm:pb-5">{footer}</div>
      </section>
    </div>, document.body
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return <label className="block text-[12px] font-semibold text-[#506157]">{label}{children}</label>;
}

export default function SPP() {
  const { admin, kasir, saveBill, payBill } = useManajemen();
  const [modal, setModal] = useState<Modal>(null);
  const [studentId, setStudentId] = useState('');
  const [period, setPeriod] = useState('SPP 2026/2027');
  const [amount, setAmount] = useState('1200000');
  const [due, setDue] = useState('2027-06-30');
  const [payAmount, setPayAmount] = useState('');
  const [note, setNote] = useState('');
  const [error, setError] = useState('');

  const total = admin.bills.reduce((sum, bill) => sum + bill.amount, 0);
  const paid = admin.bills.reduce((sum, bill) => sum + billPaid(bill), 0);
  const remaining = Math.max(0, total - paid);
  const picked = modal?.mode === 'pay' ? admin.bills.find((bill) => bill.id === modal.id) : undefined;
  const studentNames = new Map(kasir.students.map((student) => [student.id, student.name]));

  const closeModal = useCallback(() => { setModal(null); setError(''); }, []);

  function openNew() {
    setStudentId('');
    setPeriod('SPP 2026/2027');
    setAmount('1200000');
    setDue('2027-06-30');
    setError('');
    setModal({ mode: 'new' });
  }

  function openPay(id: string) {
    setPayAmount(''); setNote(''); setError(''); setModal({ mode: 'pay', id });
  }

  function create(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nominal = Number(amount);
    if (!kasir.students.some((student) => student.id === studentId) || !Number.isSafeInteger(nominal) || nominal <= 0 || !period.trim() || !/^\d{4}-\d{2}-\d{2}$/.test(due)) {
      setError('Periksa santri, periode, nominal, dan jatuh tempo.');
      return;
    }
    const bill: Bill = { id: uid('BILL'), studentId, period: period.trim(), amount: nominal, dueDate: due, payments: [] };
    if (saveBill(bill)) closeModal();
    else setError('Tagihan gagal disimpan.');
  }

  function savePayment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!picked) return;
    const nominal = Number(payAmount);
    const outstanding = Math.max(0, picked.amount - billPaid(picked));
    if (!Number.isSafeInteger(nominal) || nominal <= 0 || nominal > outstanding) {
      setError('Nominal harus lebih dari Rp0 dan tidak melebihi sisa tagihan.');
      return;
    }
    const result = payBill(picked.id, nominal, note.trim());
    if (!result.ok) { setError(result.error || 'Cicilan gagal disimpan.'); return; }
    closeModal();
  }

  function exportData() {
    exportCSV('dosi-spp.csv', ['Santri', 'NIS', 'Periode', 'Tagihan', 'Terbayar', 'Sisa'],
      admin.bills.map((bill) => [
        studentNames.get(bill.studentId) || bill.studentId,
        bill.studentId, bill.period, bill.amount, billPaid(bill), Math.max(0, bill.amount - billPaid(bill)),
      ]));
  }

  return (
    <div className="w-full min-w-0 text-[#142019]">
      <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div><h1 className="text-[24px] font-extrabold tracking-[-.8px] sm:text-[30px]">SPP & Cicilan</h1><p className="mt-1 text-[12px] text-[#718077]">Tagihan dan pembayaran santri</p></div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={exportData} disabled={!admin.bills.length} className={`${focus} inline-flex h-11 items-center gap-2 rounded-xl border border-[#E6ECE7] bg-white px-3 text-[12px] font-semibold text-[#105D38] hover:bg-[#F7FAF8] disabled:opacity-40`}><Download size={17} /> CSV</button>
          <button type="button" onClick={openNew} className={`${focus} inline-flex h-11 items-center gap-2 rounded-xl bg-[#105D38] px-3.5 text-[12px] font-semibold text-white hover:bg-[#0B482B]`}><Plus size={17} /> Buat Tagihan</button>
        </div>
      </header>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:gap-4">
        <Metric label="Total tagihan" value={rp(total)} icon={ReceiptText} />
        <Metric label="Sudah dibayar" value={rp(paid)} icon={Coins} gold />
        <div className="col-span-2 md:col-span-1"><Metric label="Sisa tagihan" value={rp(remaining)} icon={Wallet} /></div>
      </div>

      <section className={`${panel} mt-5 min-w-0 overflow-hidden`}>
        <div className="flex items-center justify-between border-b border-[#E6ECE7] px-4 py-4 sm:px-5"><h2 className="text-[16px] font-bold">Daftar Tagihan</h2><span className="text-[12px] font-semibold text-[#718077]">{admin.bills.length} tagihan</span></div>
        {admin.bills.length === 0 ? (
          <div className="flex flex-col items-center px-5 py-14 text-center"><Coins size={28} className="text-[#105D38]" /><p className="mt-3 text-[13px] font-semibold">Belum ada tagihan</p></div>
        ) : (
          <>
            <div className="divide-y divide-[#EDF1ED] lg:hidden">
              {admin.bills.map((bill) => {
                const settled = billPaid(bill);
                const outstanding = Math.max(0, bill.amount - settled);
                return (
                  <article key={bill.id} className="px-4 py-4 sm:px-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0"><p className="truncate text-[13px] font-bold">{studentNames.get(bill.studentId) || bill.studentId}</p><p className="mt-1 text-[11px] text-[#718077]">{bill.period} · {bill.studentId}</p></div>
                      <BillStatus paid={settled} total={bill.amount} />
                    </div>
                    <div className="mt-4 flex items-end justify-between gap-2">
                      <div><p className="text-[11px] text-[#718077]">Sisa tagihan</p><p className="mt-1 text-[17px] font-extrabold tabular-nums text-[#105D38]">{rp(outstanding)}</p></div>
                      <div className="text-right"><p className="text-[11px] text-[#718077]">Total {rp(bill.amount)}</p><p className="mt-1 text-[10px] text-[#91A096]">Tempo {bill.dueDate}</p></div>
                    </div>
                    {outstanding > 0 && <button type="button" onClick={() => openPay(bill.id)} className={`${focus} mt-4 flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-[#D9E9DE] bg-[#F6FAF7] text-[12px] font-semibold text-[#105D38] hover:bg-[#ECF7EF]`}>Catat Cicilan <ChevronRight size={16} /></button>}
                  </article>
                );
              })}
            </div>
            <div className="hidden lg:block">
              <table className="w-full table-fixed border-collapse text-left">
                <thead><tr className="border-b border-[#E6ECE7] bg-[#FAFCFA] text-[11px] text-[#718077]">
                  <th className="w-[24%] px-5 py-3.5 font-semibold">Santri</th><th className="w-[17%] px-3 py-3.5 font-semibold">Periode / Tempo</th><th className="w-[15%] px-3 py-3.5 font-semibold">Tagihan</th><th className="w-[15%] px-3 py-3.5 font-semibold">Terbayar</th><th className="w-[13%] px-3 py-3.5 font-semibold">Status</th><th className="w-[16%] px-5 py-3.5 text-right font-semibold">Aksi</th>
                </tr></thead>
                <tbody className="divide-y divide-[#EDF1ED]">
                  {admin.bills.map((bill) => { const settled = billPaid(bill); return (
                    <tr key={bill.id} className="hover:bg-[#FAFCFA]">
                      <td className="px-5 py-4"><p className="truncate text-[12px] font-bold">{studentNames.get(bill.studentId) || bill.studentId}</p><p className="mt-1 text-[10px] text-[#91A096]">{bill.studentId}</p></td>
                      <td className="px-3 py-4"><p className="truncate text-[12px]">{bill.period}</p><p className="mt-1 text-[10px] text-[#91A096]">{bill.dueDate}</p></td>
                      <td className="px-3 py-4 text-[12px] tabular-nums">{rp(bill.amount)}</td>
                      <td className="px-3 py-4 text-[12px] font-bold tabular-nums text-[#105D38]">{rp(settled)}</td>
                      <td className="px-3 py-4"><BillStatus paid={settled} total={bill.amount} /></td>
                      <td className="px-5 py-4 text-right">{settled < bill.amount ? <button type="button" onClick={() => openPay(bill.id)} className={`${focus} rounded-lg border border-[#DDE9E0] px-3 py-2 text-[11px] font-semibold text-[#105D38] hover:bg-[#ECF7EF]`}>Catat cicilan</button> : <Check size={18} className="ml-auto text-[#105D38]" />}</td>
                    </tr>
                  ); })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </section>

      {modal?.mode === 'new' && (
        <Sheet title="Buat Tagihan SPP" onClose={closeModal} footer={<button type="submit" form="spp-new-form" className={`${focus} flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#105D38] text-[13px] font-semibold text-white hover:bg-[#0B482B]`}>Simpan Tagihan <ArrowRight size={17} /></button>}>
          <form id="spp-new-form" onSubmit={create} className="space-y-4">
            <Field label="Santri"><select className={input} required value={studentId} onChange={(event) => { setStudentId(event.target.value); setError(''); }}><option value="">Pilih santri</option>{kasir.students.map((student) => <option key={student.id} value={student.id}>{student.name} · {student.id}</option>)}</select></Field>
            <Field label="Periode"><input className={input} required maxLength={70} value={period} onChange={(event) => { setPeriod(event.target.value); setError(''); }} /></Field>
            <Field label="Total tagihan (Rp)"><input type="text" inputMode="numeric" className={input} value={amount ? Number(amount).toLocaleString('id-ID') : ''} onChange={(event) => { setAmount(event.target.value.replace(/\D/g, '').slice(0, 12)); setError(''); }} placeholder="0" /></Field>
            <Field label="Jatuh tempo"><input type="date" className={input} required value={due} onChange={(event) => { setDue(event.target.value); setError(''); }} /></Field>
            {error && <p role="alert" className="rounded-xl bg-[#FFF7F5] p-3 text-[12px] text-[#B44747]">{error}</p>}
          </form>
        </Sheet>
      )}

      {modal?.mode === 'pay' && picked && (
        <Sheet title="Catat Cicilan" subtitle={studentNames.get(picked.studentId) || picked.studentId} onClose={closeModal} footer={<button type="submit" form="spp-payment-form" className={`${focus} flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#105D38] text-[13px] font-semibold text-white hover:bg-[#0B482B]`}>Simpan Cicilan <ArrowRight size={17} /></button>}>
          <form id="spp-payment-form" onSubmit={savePayment} className="space-y-4">
            <div className="rounded-xl bg-[#F5F9F6] p-4"><p className="text-[12px] text-[#718077]">Sisa tagihan</p><p className="mt-1 text-[24px] font-extrabold tracking-[-.7px] tabular-nums text-[#105D38]">{rp(Math.max(0, picked.amount - billPaid(picked)))}</p></div>
            <Field label="Nominal cicilan (Rp)"><input type="text" inputMode="numeric" required className={input} value={payAmount ? Number(payAmount).toLocaleString('id-ID') : ''} onChange={(event) => { setPayAmount(event.target.value.replace(/\D/g, '').slice(0, 12)); setError(''); }} placeholder="0" /></Field>
            <Field label="Catatan (opsional)"><input className={input} maxLength={120} value={note} onChange={(event) => setNote(event.target.value)} placeholder="Catatan pembayaran" /></Field>
            {error && <p role="alert" className="rounded-xl bg-[#FFF7F5] p-3 text-[12px] text-[#B44747]">{error}</p>}
            <p className="text-[11px] leading-relaxed text-[#819087]">Pencatatan cicilan bukan konfirmasi transfer bank.</p>
          </form>
        </Sheet>
      )}
    </div>
  );
}
