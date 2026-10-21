
'use client';

import { useEffect, useState } from 'react';
import { UsersRound } from 'lucide-react';
import { useKasir } from '../components/KasirProvider';
import {
  card,
  control,
  Empty,
  Modal,
  Notice,
  PageTitle,
  SearchInput,
} from '../components/UI';
import {
  rp,
  studentBalance,
  studentLimit,
  todaySpent,
  type Student,
} from '../lib/data';

export default function Santri() {
  const { store, saveStudent } = useKasir();

  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<Student | null>(null);
  const [limitRaw, setLimitRaw] = useState('');
  const [error, setError] = useState('');

  // Perhitungan yang membutuhkan tanggal hari ini
  // hanya dijalankan setelah komponen dimuat di browser.
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const list = store.students.filter((student) =>
    `${student.name} ${student.id} ${student.className}`
      .toLowerCase()
      .includes(query.toLowerCase())
  );

  function open(student: Student) {
    setSelected(student);
    setLimitRaw(String(studentLimit(student)));
    setError('');
  }

  function save() {
    if (!selected) return;

    const num = Number(limitRaw);

    if (
      !limitRaw.trim() ||
      !Number.isSafeInteger(num) ||
      num <= 0 ||
      num > 100000000
    ) {
      setError('Nominal limit tidak valid.');
      return;
    }

    if (selected.id === '20260001') {
      try {
        localStorage.setItem(
          'dosi_wali_daily_snack_limit_v1',
          JSON.stringify({
            limit: num,
            updatedAt: new Date().toISOString(),
          })
        );
      } catch {
        setError('Gagal menyimpan limit.');
        return;
      }
    }

    saveStudent({
      ...selected,
      dailyLimit: num,
    });

    setSelected(null);
  }

  return (
    <>
      <PageTitle
        title="Data Santri"
        description="Saldo dan batas belanja untuk transaksi kasir"
      />

      <div className={`${card} p-4 sm:p-5`}>
        <div className="mb-4">
          <SearchInput
            value={query}
            onChange={setQuery}
            placeholder="Cari nama, kelas, atau NIS"
          />
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {list.map((student) => {
            const balance = studentBalance(store, student);
            const limit = studentLimit(student);

            // Menghindari new Date() saat prerender.
            const spent = mounted
              ? todaySpent(store, student.id)
              : null;

            return (
              <button
                type="button"
                key={student.id}
                onClick={() => open(student)}
                className="rounded-2xl border border-[#DFEAE2] bg-[#FBFCFB] p-4 text-left transition-colors hover:border-[#A8D3B5] hover:bg-[#F1F8F3]"
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#DFF1E6] text-[13px] font-extrabold text-[#105D38]">
                    {student.initial}
                  </span>

                  <div className="min-w-0">
                    <p className="truncate text-[12px] font-bold text-[#274A33]">
                      {student.name}
                    </p>

                    <p className="mt-1 text-[10px] text-[#98A79C]">
                      {student.id} · {student.className}
                    </p>
                  </div>
                </div>

                <div className="mt-4 border-t border-[#E9F0EB] pt-3">
                  <p className="text-[10px] text-[#92A197]">
                    Saldo tersedia
                  </p>

                  <p className="mt-1 text-[21px] font-extrabold tracking-[-.55px] text-[#105D38]">
                    {rp(balance)}
                  </p>

                  <div className="mt-2 flex justify-between gap-2 text-[10px] text-[#8D9D91]">
                    <span>Limit harian</span>
                    <span className="font-semibold text-[#2E6943]">
                      {rp(limit)}
                    </span>
                  </div>

                  <div className="mt-1 flex justify-between gap-2 text-[10px] text-[#8D9D91]">
                    <span>Terpakai hari ini</span>
                    <span>{spent === null ? '—' : rp(spent)}</span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {!list.length && (
          <Empty
            icon={UsersRound}
            title="Santri tidak ditemukan"
          />
        )}
      </div>

      {selected && (
        <Modal
          title="Saldo & Limit Santri"
          subtitle={`${selected.name} · ${selected.id}`}
          onClose={() => setSelected(null)}
          footer={
            <button
              type="button"
              onClick={save}
              className="h-11 w-full rounded-xl bg-[#105D38] text-[12px] font-bold text-white"
            >
              Simpan limit demo
            </button>
          }
        >
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-[#F0F8F3] p-3">
              <p className="text-[10px] text-[#8BA194]">
                Saldo
              </p>

              <p className="mt-1 text-[16px] font-extrabold text-[#105D38]">
                {rp(studentBalance(store, selected))}
              </p>
            </div>

            <div className="rounded-xl bg-[#F0F8F3] p-3">
              <p className="text-[10px] text-[#8BA194]">
                Terpakai hari ini
              </p>

              <p className="mt-1 text-[16px] font-extrabold text-[#105D38]">
                {mounted
                  ? rp(todaySpent(store, selected.id))
                  : '—'}
              </p>
            </div>
          </div>

          <label className="mt-4 block text-[11px] font-semibold text-[#5C7865]">
            Batas belanja harian (Rp)

            <input
              type="text"
              inputMode="numeric"
              value={limitRaw}
              onChange={(event) =>
                setLimitRaw(
                  event.target.value
                    .replace(/\D/g, '')
                    .slice(0, 10)
                )
              }
              className={`${control} mt-1.5`}
            />
          </label>

          <p className="mt-2 text-[10px] leading-relaxed text-[#90A094]">
            Untuk Ahmad Fauzan, limit ini juga mengikuti
            pengaturan wali pada browser yang sama.
            Sidik jari belum terhubung ke sensor asli.
          </p>

          {error && (
            <div className="mt-3">
              <Notice type="error">{error}</Notice>
            </div>
          )}
        </Modal>
      )}
    </>
  );
}
