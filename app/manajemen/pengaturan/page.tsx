'use client';

import { useEffect, useState, type FormEvent } from 'react';
import {
  CheckCircle2,
  Fingerprint,
  RefreshCw,
  Save,
  ShieldAlert,
  Wallet,
} from 'lucide-react';
import { useManajemen } from '../components/ManajemenProvider';
import { initialAdmin, type Policy } from '../lib/data';

const panel = 'rounded-[20px] border border-[#E6ECE7] bg-white';
const focus = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#D5A52D]';
const field = `${focus} mt-2 h-11 w-full min-w-0 rounded-[12px] border border-[#E1E9E3] bg-white px-3.5 text-[13px] text-[#142019] outline-none focus:border-[#105D38]`;

const DAYS: { value: Policy['withdrawalDay']; label: string }[] = [
  { value: 'any', label: 'Setiap hari' },
  { value: 'monday', label: 'Senin' },
  { value: 'tuesday', label: 'Selasa' },
  { value: 'wednesday', label: 'Rabu' },
  { value: 'thursday', label: 'Kamis' },
  { value: 'friday', label: 'Jumat' },
  { value: 'saturday', label: 'Sabtu' },
  { value: 'sunday', label: 'Minggu' },
];

type Feedback = { type: 'success' | 'error'; text: string } | null;

export default function Pengaturan() {
  const { admin, savePolicy, resetAdmin } = useManajemen();
  const [form, setForm] = useState<Policy>(() => ({ ...admin.policy }));
  const [dirty, setDirty] = useState(false);
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [confirmReset, setConfirmReset] = useState(false);

  // Sinkronkan pengaturan yang dimuat oleh provider, tanpa menghapus input yang sedang diedit.
  useEffect(() => {
    if (!dirty) setForm({ ...admin.policy });
  }, [admin.policy, dirty]);

  function update<K extends keyof Policy>(key: K, value: Policy[K]) {
    setForm((previous) => ({ ...previous, [key]: value }));
    setDirty(true);
    setFeedback(null);
  }

  function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const next: Policy = {
      ...form,
      schoolName: form.schoolName.trim(),
      adminName: form.adminName.trim(),
    };

    if (!next.schoolName || !next.adminName) {
      setFeedback({ type: 'error', text: 'Lengkapi nama pondok dan pengelola.' });
      return;
    }

    if (!Number.isSafeInteger(next.dailyLimit) || next.dailyLimit < 1) {
      setFeedback({ type: 'error', text: 'Masukkan limit harian yang valid.' });
      return;
    }

    try {
      if (!savePolicy(next)) {
        setFeedback({ type: 'error', text: 'Pengaturan gagal disimpan.' });
        return;
      }
      setDirty(false);
      setFeedback({ type: 'success', text: 'Pengaturan berhasil disimpan.' });
    } catch {
      setFeedback({ type: 'error', text: 'Pengaturan gagal disimpan.' });
    }
  }

  function reset() {
    try {
      resetAdmin();
      setForm({ ...initialAdmin().policy });
      setDirty(false);
      setConfirmReset(false);
      setFeedback({ type: 'success', text: 'Data manajemen berhasil direset.' });
    } catch {
      setConfirmReset(false);
      setFeedback({ type: 'error', text: 'Data manajemen gagal direset.' });
    }
  }

  return (
    <div className="w-full min-w-0 text-[#142019]">
      <header className="mb-6">
        <h1 className="text-[24px] font-extrabold leading-tight tracking-[-.8px] sm:text-[30px]">
          Pengaturan Pondok
        </h1>
        <p className="mt-1 text-[12px] text-[#718077] sm:text-[13px]">Profil dan kebijakan</p>
      </header>

      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1.4fr)_minmax(280px,.8fr)]">
        <form onSubmit={save} className="min-w-0 space-y-5">
          {/* PROFIL */}
          <section className={`${panel} p-4 sm:p-6`}>
            <h2 className="text-[16px] font-bold tracking-[-.4px] text-[#142019] sm:text-[18px]">Profil Pondok</h2>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <label className="block text-[12px] font-semibold text-[#526459]">
                Nama lembaga
                <input
                  required
                  maxLength={90}
                  autoComplete="organization"
                  value={form.schoolName}
                  onChange={(event) => update('schoolName', event.target.value)}
                  className={field}
                  placeholder="Nama pondok"
                />
              </label>
              <label className="block text-[12px] font-semibold text-[#526459]">
                Nama pengelola
                <input
                  required
                  maxLength={60}
                  value={form.adminName}
                  onChange={(event) => update('adminName', event.target.value)}
                  className={field}
                  placeholder="Nama pengelola"
                />
              </label>
            </div>
          </section>

          {/* FINANCIAL SETTINGS */}
          <section className={`${panel} p-4 sm:p-6`}>
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-[16px] font-bold tracking-[-.4px] text-[#142019] sm:text-[18px]">Kebijakan Keuangan</h2>
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] bg-[#ECF7EF] text-[#105D38]">
                <Wallet size={19} strokeWidth={1.8} />
              </span>
            </div>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <label className="block text-[12px] font-semibold text-[#526459]">
                Limit harian bawaan (Rp)
                <input
                  required
                  inputMode="numeric"
                  type="text"
                  value={form.dailyLimit.toLocaleString('id-ID')}
                  onChange={(event) => {
                    const digits = event.target.value.replace(/\D/g, '').slice(0, 12);
                    update('dailyLimit', Number(digits));
                  }}
                  className={field}
                />
              </label>

              <label className="block text-[12px] font-semibold text-[#526459]">
                Hari penarikan
                <select
                  value={form.withdrawalDay}
                  onChange={(event) => update('withdrawalDay', event.target.value as Policy['withdrawalDay'])}
                  className={field}
                >
                  {DAYS.map((item) => (
                    <option value={item.value} key={item.value}>{item.label}</option>
                  ))}
                </select>
              </label>
            </div>

            <div className="mt-4 rounded-[13px] bg-[#F6F9F6] px-4 py-3">
              <p className="text-[12px] font-semibold text-[#526459]">Frekuensi penarikan</p>
              <p className="mt-1 text-[12px] text-[#718077]">Maksimal 1 kali per hari (WIB)</p>
            </div>

            <p className="mt-3 text-[11px] leading-relaxed text-[#829087]">
              Pengaturan hari penarikan merupakan kebijakan administrasi. Kasir saat ini hanya membatasi satu penarikan per hari.
            </p>
          </section>

          {/* BIOMETRIC POLICY */}
          <section className={`${panel} p-4 sm:p-6`}>
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-[16px] font-bold tracking-[-.4px] text-[#142019] sm:text-[18px]">Biometrik</h2>
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] bg-[#FAF1D8] text-[#967014]">
                <Fingerprint size={20} strokeWidth={1.8} />
              </span>
            </div>

            <label className="mt-5 flex cursor-pointer items-center justify-between gap-4 rounded-[14px] border border-[#E6ECE7] px-4 py-4">
              <span className="min-w-0">
                <span className="block text-[13px] font-semibold text-[#142019]">Wajibkan sidik jari</span>
                <span className="mt-1 block text-[11px] leading-relaxed text-[#718077]">Kebijakan verifikasi transaksi</span>
              </span>
              <span className="relative inline-flex shrink-0 items-center">
                <input
                  type="checkbox"
                  checked={form.biometricRequired}
                  onChange={(event) => update('biometricRequired', event.target.checked)}
                  className="peer sr-only"
                  aria-label="Wajibkan sidik jari"
                />
                <span className="h-7 w-12 rounded-full bg-[#CDD8D0] transition-colors peer-checked:bg-[#105D38] peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-[#D5A52D]" />
                <span className="pointer-events-none absolute left-1 h-5 w-5 rounded-full bg-white shadow-sm transition-transform peer-checked:translate-x-5" />
              </span>
            </label>
            <p className="mt-3 text-[11px] leading-relaxed text-[#829087]">
              Sensor biometrik dan penerapan kebijakan keamanan belum terintegrasi.
            </p>
          </section>

          {feedback && (
            <div
              role={feedback.type === 'error' ? 'alert' : 'status'}
              className={`flex items-start gap-2.5 rounded-[13px] border px-4 py-3.5 text-[12px] font-medium ${
                feedback.type === 'success'
                  ? 'border-[#D8EBDD] bg-[#F0F9F2] text-[#105D38]'
                  : 'border-[#F0DAD6] bg-[#FFF7F5] text-[#B44747]'
              }`}
            >
              {feedback.type === 'success' ? <CheckCircle2 size={17} className="mt-0.5 shrink-0" /> : <ShieldAlert size={17} className="mt-0.5 shrink-0" />}
              <span>{feedback.text}</span>
            </div>
          )}

          <button
            type="submit"
            className={`${focus} flex h-12 w-full items-center justify-center gap-2 rounded-[13px] bg-[#105D38] px-4 text-[13px] font-semibold text-white transition-colors hover:bg-[#0B482B] active:bg-[#083D25]`}
          >
            <Save size={17} /> Simpan Pengaturan
          </button>
        </form>

        {/* SYSTEM & RESET */}
        <aside className="min-w-0 space-y-5">
          <section className={`${panel} p-5 sm:p-6`}>
            <h2 className="text-[16px] font-bold tracking-[-.4px] text-[#142019]">Penyimpanan Data</h2>
            <p className="mt-3 text-[12px] leading-[1.8] text-[#718077]">
              Data tersimpan di browser ini dan belum tersinkron otomatis antarperangkat.
            </p>
          </section>

          <section className={`${panel} p-5 sm:p-6`}>
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-[16px] font-bold tracking-[-.4px] text-[#142019]">Reset Data</h2>
              <span className="flex h-10 w-10 items-center justify-center rounded-[12px] bg-[#FAF1D8] text-[#967014]">
                <RefreshCw size={19} strokeWidth={1.8} />
              </span>
            </div>
            <p className="mt-3 text-[12px] leading-[1.8] text-[#718077]">
              Mengembalikan data pengguna, pengumuman, SPP, pengaturan, dan audit manajemen ke kondisi awal. Data Kasir dan deposit Wali tidak dihapus.
            </p>

            {!confirmReset ? (
              <button
                type="button"
                onClick={() => setConfirmReset(true)}
                className={`${focus} mt-5 flex h-11 w-full items-center justify-center gap-2 rounded-[12px] border border-[#E5D1CE] bg-white text-[12px] font-semibold text-[#A24743] transition-colors hover:bg-[#FFF7F5]`}
              >
                <RefreshCw size={16} /> Reset Data Manajemen
              </button>
            ) : (
              <div className="mt-5 rounded-[13px] border border-[#F0DAD6] bg-[#FFF7F5] p-4">
                <p className="text-[12px] font-bold text-[#A24743]">Reset data manajemen?</p>
                <p className="mt-1 text-[11px] leading-relaxed text-[#906C68]">Perubahan ini tidak dapat dibatalkan.</p>
                <div className="mt-4 flex gap-2">
                  <button type="button" onClick={() => setConfirmReset(false)} className={`${focus} h-11 flex-1 rounded-[11px] border border-[#E6ECE7] bg-white text-[12px] font-semibold text-[#526459]`}>
                    Batal
                  </button>
                  <button type="button" onClick={reset} className={`${focus} h-11 flex-1 rounded-[11px] bg-[#A24743] text-[12px] font-semibold text-white hover:bg-[#913F3C]`}>
                    Ya, Reset
                  </button>
                </div>
              </div>
            )}
          </section>
        </aside>
      </div>
    </div>
  );
}
