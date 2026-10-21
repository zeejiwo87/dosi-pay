'use client';

import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CircleAlert,
  Fingerprint,
  MessageSquareText,
  Minus,
  Plus,
  Search,
  ShoppingCart,
  Trash2,
  X,
} from 'lucide-react';
import { useKasir } from '../components/KasirProvider';
import {
  KEY,
  type Category,
  type SaleLine,
  type Student,
  parseNominal,
  rp,
  studentBalance,
  studentLimit,
  todaySpent,
} from '../lib/data';

// Khusus simulasi. Identitas santri pada sistem produksi harus berasal
// dari perangkat biometrik serta diverifikasi melalui server.
const DEMO_FINGERPRINT_STUDENT_ID = '20260001';
const QUICK_AMOUNTS = [5_000, 10_000, 15_000, 20_000] as const;
const CATEGORIES = ['Semua', 'Kantin', 'Koperasi', 'Lainnya'] as const;

const panel = 'min-w-0 rounded-[20px] border border-[#E6ECE7] bg-white';
const field =
  'h-11 w-full min-w-0 rounded-[11px] border border-[#E6ECE7] bg-white px-3.5 text-[13px] font-medium text-[#142019] outline-none transition-colors duration-150 placeholder:text-[#A0ABA3] focus:border-[#105D38] focus:ring-2 focus:ring-[#105D38]/10';
const focus =
  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#D5A52D]';
const primary =
  'inline-flex h-11 items-center justify-center gap-2 rounded-[11px] bg-[#105D38] px-4 text-[13px] font-bold text-white transition-[background-color,transform] duration-150 hover:bg-[#0B3D26] active:scale-[.98] disabled:cursor-not-allowed disabled:opacity-40';

type CartItem = {
  key: string;
  itemId?: string;
  name: string;
  price: number;
  qty: number;
  category: Category;
};

type ScanState = 'idle' | 'scanning' | 'checking' | 'success' | 'failed';
type ScanInfo = {
  student: Student;
  balance: number;
  remainingLimit: number;
};

function SectionTitle({ title, suffix }: { title: string; suffix?: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <h2 className="text-[16px] font-bold tracking-[-0.35px] text-[#142019] sm:text-[18px]">
        {title}
      </h2>
      {suffix}
    </div>
  );
}

function ParentNote({ studentId }: { studentId: string }) {
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (studentId !== DEMO_FINGERPRINT_STUDENT_ID) {
      setMessage(null);
      return;
    }
    try {
      const raw: unknown = JSON.parse(localStorage.getItem(KEY.messages) || '[]');
      if (!Array.isArray(raw)) {
        setMessage(null);
        return;
      }
      const valid = raw.filter(
        (item): item is { text: string } =>
          !!item &&
          typeof item === 'object' &&
          'text' in item &&
          typeof item.text === 'string' &&
          item.text.trim().length > 0,
      );
      setMessage(valid.length ? valid[valid.length - 1].text : null);
    } catch {
      setMessage(null);
    }
  }, [studentId]);

  if (!message) return null;
  return (
    <div className="mt-3 flex gap-2.5 rounded-[12px] border border-[#E6ECE7] bg-[#F7FAF8] p-3 text-left">
      <MessageSquareText size={17} className="mt-0.5 shrink-0 text-[#105D38]" />
      <div className="min-w-0">
        <p className="text-[12px] font-bold text-[#105D38]">Pesan wali</p>
        <p className="mt-1 whitespace-pre-wrap break-words text-[12px] leading-relaxed text-[#64776A]">
          {message}
        </p>
      </div>
    </div>
  );
}

export default function TransaksiPage() {
  const router = useRouter();
  const { store, createSale, ready } = useKasir();

  const [productSearch, setProductSearch] = useState('');
  const [category, setCategory] = useState<'Semua' | Category>('Semua');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [manual, setManual] = useState('');
  const [manualName, setManualName] = useState('Belanja langsung');
  const [manualCategory, setManualCategory] = useState<Category>('Kantin');
  const [mobileNominal, setMobileNominal] = useState('');
  const [mobileError, setMobileError] = useState('');
  const [paymentMode, setPaymentMode] = useState<'mobile' | 'desktop'>('desktop');
  const [paymentTotal, setPaymentTotal] = useState(0);
  const [fingerOpen, setFingerOpen] = useState(false);
  const [fingerState, setFingerState] = useState<ScanState>('idle');
  const [scanInfo, setScanInfo] = useState<ScanInfo | null>(null);
  const [scanError, setScanError] = useState('');
  const [error, setError] = useState('');

  const dialogRef = useRef<HTMLDialogElement>(null);
  const scanningRef = useRef(false);
  const scanTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const paymentTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const navigationTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingLinesRef = useRef<SaleLine[]>([]);

  useEffect(() => {
    return () => {
      if (scanTimerRef.current) clearTimeout(scanTimerRef.current);
      if (paymentTimerRef.current) clearTimeout(paymentTimerRef.current);
      if (navigationTimerRef.current) clearTimeout(navigationTimerRef.current);
    };
  }, []);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (fingerOpen && !dialog.open) dialog.showModal();
    if (!fingerOpen && dialog.open) dialog.close();
  }, [fingerOpen]);

  const total = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  const mobileAmount = Number(mobileNominal || 0);
  const mobileAmountValid = Number.isSafeInteger(mobileAmount) && mobileAmount > 0 && mobileAmount <= 1_000_000_000;
  const count = cart.reduce((sum, item) => sum + item.qty, 0);
  const scanBusy = fingerState === 'scanning' || fingerState === 'checking';

  const filtered = useMemo(() => {
    const search = productSearch.trim().toLowerCase();
    return store.products.filter(
      (product) =>
        product.active &&
        product.name.toLowerCase().includes(search) &&
        (category === 'Semua' || product.category === category),
    );
  }, [store.products, productSearch, category]);

  function addProduct(product: (typeof store.products)[number]) {
    setError('');
    const currentQty = cart.find((item) => item.itemId === product.id)?.qty ?? 0;
    if (product.stock !== null && currentQty >= product.stock) {
      setError('Stok produk tidak mencukupi.');
      return;
    }
    setCart((items) => {
      const existing = items.find((item) => item.itemId === product.id);
      if (existing) {
        return items.map((item) =>
          item.itemId === product.id ? { ...item, qty: item.qty + 1 } : item,
        );
      }
      return [
        ...items,
        {
          key: product.id,
          itemId: product.id,
          name: product.name,
          category: product.category,
          price: product.price,
          qty: 1,
        },
      ];
    });
  }

  function changeQty(key: string, by: number) {
    setError('');
    const current = cart.find((item) => item.key === key);
    if (current?.itemId && by > 0) {
      const product = store.products.find((item) => item.id === current.itemId);
      if (product && product.stock !== null && current.qty + by > product.stock) {
        setError('Stok produk tidak mencukupi.');
        return;
      }
    }
    setCart((items) =>
      items.flatMap((item) => {
        if (item.key !== key) return [item];
        const qty = item.qty + by;
        return qty <= 0 ? [] : [{ ...item, qty }];
      }),
    );
  }

  function addManual(value?: number) {
    const amount = value ?? parseNominal(manual);
    if (!Number.isSafeInteger(amount) || amount <= 0 || amount > 1_000_000_000) {
      setError('Masukkan nominal yang valid.');
      return;
    }
    setError('');
    setCart((items) => [
      ...items,
      {
        key: `manual-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        name: manualName.trim() || 'Belanja langsung',
        price: amount,
        qty: 1,
        category: manualCategory,
      },
    ]);
    setManual('');
  }

  function openFingerprint() {
    if (!ready || !cart.length || total <= 0 || !Number.isSafeInteger(total)) {
      setError('Tambahkan produk atau nominal terlebih dahulu.');
      return;
    }
    setPaymentMode('desktop');
    setPaymentTotal(total);
    pendingLinesRef.current = cart.map((item) => ({
      name: item.name,
      category: item.category,
      qty: item.qty,
      price: item.price,
      ...(item.itemId ? { itemId: item.itemId } : {}),
    }));
    setError('');
    setScanError('');
    setScanInfo(null);
    setFingerState('idle');
    setFingerOpen(true);
  }

  function openMobileFingerprint() {
    if (!ready) return;
    if (!mobileAmountValid) {
      setMobileError('Masukkan nominal yang valid.');
      return;
    }

    // Mobile: pembayaran nominal tunggal. Tidak memerlukan keranjang atau produk.
    // Tetap disimpan sebagai SaleLine agar kompatibel dengan provider dan laporan.
    pendingLinesRef.current = [{
      name: 'Belanja langsung',
      category: 'Lainnya',
      price: mobileAmount,
      qty: 1,
    }];
    setPaymentMode('mobile');
    setPaymentTotal(mobileAmount);
    setMobileError('');
    setScanError('');
    setScanInfo(null);
    setFingerState('idle');
    setFingerOpen(true);
  }

  function closeFingerprint() {
    // Setelah tersimpan, jangan izinkan kembali ke nominal untuk membayar ganda.
    if (scanningRef.current || fingerState === 'success') return;
    setFingerOpen(false);
    setScanInfo(null);
    setScanError('');
    setFingerState('idle');
  }

  function finishFingerprint() {
    if (scanningRef.current || fingerState !== 'idle') return;
    scanningRef.current = true;
    setScanError('');
    setFingerState('scanning');

    // Sensor simulasi hanya mengembalikan ID demo, bukan memindai biometrik asli.
    scanTimerRef.current = setTimeout(() => {
      const student = store.students.find(
        (item) => item.id === DEMO_FINGERPRINT_STUDENT_ID,
      );
      if (!student) {
        setScanError('Identitas simulasi tidak terdaftar.');
        setFingerState('failed');
        scanningRef.current = false;
        return;
      }

      const balance = studentBalance(store, student);
      const remainingLimit = Math.max(
        0,
        studentLimit(student) - todaySpent(store, student.id),
      );
      setScanInfo({ student, balance, remainingLimit });
      setFingerState('checking');

      if (paymentTotal > balance) {
        setScanError(`Saldo kurang ${rp(paymentTotal - balance)}.`);
        setFingerState('failed');
        scanningRef.current = false;
        return;
      }
      if (paymentTotal > remainingLimit) {
        setScanError(`Limit harian kurang ${rp(paymentTotal - remainingLimit)}.`);
        setFingerState('failed');
        scanningRef.current = false;
        return;
      }

      paymentTimerRef.current = setTimeout(() => {
        // Provider memvalidasi ulang saldo, limit, dan stok sebelum menyimpan.
        const result = createSale({
          studentId: student.id,
          lines: pendingLinesRef.current,
        });
        scanningRef.current = false;
        if (!result.ok) {
          setScanError(result.error);
          setFingerState('failed');
          return;
        }
        setFingerState('success');
        navigationTimerRef.current = setTimeout(
          () => router.push('/kasir/transaksi/berhasil'),
          paymentMode === 'mobile' ? 420 : 850,
        );
      }, paymentMode === 'mobile' ? 300 : 650);
    }, paymentMode === 'mobile' ? 560 : 1050);
  }

  return (
    <div className="min-w-0 pb-3 text-[#142019]">
      {/* MOBILE: nominal -> sidik jari. Alur POS desktop tetap terpisah. */}
      <form
        onSubmit={(event) => {
          event.preventDefault();
          openMobileFingerprint();
        }}
        className="mx-auto w-full max-w-[540px] lg:hidden"
      >
        <div className="mb-7 flex items-start justify-between gap-3">
          <div>
            <h1 className="text-[27px] font-extrabold leading-tight tracking-[-0.8px] text-[#142019]">
              Pembayaran
            </h1>
            <p className="mt-1.5 text-[13px] text-[#718077]">
              Masukkan total belanja
            </p>
          </div>
          <span className="mt-1 shrink-0 rounded-full border border-[#E6ECE7] px-3 py-1.5 text-[11px] font-bold tabular-nums text-[#105D38]">
            01 / 02
          </span>
        </div>

        <section className="rounded-[20px] border border-[#E6ECE7] bg-white px-5 pb-6 pt-5 sm:px-6 sm:pt-6">
          <label htmlFor="dosi-mobile-nominal" className="block text-[13px] font-semibold text-[#64776A]">
            Nominal pembayaran
          </label>
          <div className="mt-5 flex min-w-0 items-baseline gap-2 border-b-2 border-[#E6ECE7] pb-3 transition-colors duration-150 focus-within:border-[#105D38]">
            <span className="shrink-0 text-[23px] font-bold tracking-[-0.6px] text-[#105D38]">Rp</span>
            <input
              id="dosi-mobile-nominal"
              name="nominal"
              type="text"
              inputMode="numeric"
              enterKeyHint="done"
              autoComplete="off"
              spellCheck={false}
              value={mobileNominal ? Number(mobileNominal).toLocaleString('id-ID') : ''}
              onChange={(event) => {
                const digits = event.target.value.replace(/\D/g, '').replace(/^0+(?=\d)/, '').slice(0, 10);
                setMobileNominal(digits === '0' ? '' : digits);
                setMobileError('');
              }}
              placeholder="0"
              aria-label="Nominal pembayaran dalam rupiah"
              aria-invalid={!!mobileError}
              aria-describedby={mobileError ? 'dosi-mobile-error' : undefined}
              className="min-w-0 w-full flex-1 bg-transparent text-[clamp(30px,8vw,44px)] font-extrabold leading-tight tracking-[-1.3px] tabular-nums text-[#142019] outline-none placeholder:text-[#B9C5BD]"
            />
          </div>
          {mobileError ? (
            <p id="dosi-mobile-error" role="alert" className="mt-3 text-[12px] font-semibold text-[#B45343]">
              {mobileError}
            </p>
          ) : mobileAmount > 1_000_000_000 ? (
            <p role="alert" className="mt-3 text-[12px] font-semibold text-[#B45343]">
              Maksimal Rp1.000.000.000
            </p>
          ) : null}
        </section>

        <div className="mt-5 flex items-center gap-2.5 px-1 text-[12px] font-medium text-[#718077]">
          <Fingerprint size={18} strokeWidth={1.8} className="text-[#105D38]" />
          Selanjutnya, sidik jari
        </div>

        <button
          type="submit"
          disabled={!ready || !mobileAmountValid}
          className={`${primary} ${focus} mt-7 h-[54px] w-full rounded-[14px] text-[15px] disabled:opacity-40`}
        >
          Lanjutkan
          <ArrowRight size={19} className="text-[#E0B341]" />
        </button>
      </form>

      {/* DESKTOP: pertahankan pencarian produk dan keranjang seperti sebelumnya. */}
      <div className="hidden lg:block">
      <header className="mb-6 sm:mb-7">
        <h1 className="text-[25px] font-extrabold leading-tight tracking-[-0.8px] sm:text-[31px]">
          Pembayaran
        </h1>
        <p className="mt-1 text-[13px] text-[#718077] sm:text-[14px]">
          Pilih produk atau masukkan nominal.
        </p>
      </header>

      <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1.55fr)_minmax(340px,.9fr)] xl:gap-5">
        <div className="min-w-0 space-y-4 sm:space-y-5">
          {/* NOMINAL */}
          <section className={`${panel} p-4 sm:p-6`}>
            <SectionTitle title="Nominal cepat" />
            <div className="mt-4 grid grid-cols-4 gap-2 sm:gap-3">
              {QUICK_AMOUNTS.map((amount) => (
                <button
                  key={amount}
                  type="button"
                  onClick={() => addManual(amount)}
                  className={`${focus} h-11 rounded-[11px] border border-[#E6ECE7] bg-white px-1 text-[12px] font-bold text-[#105D38] transition-[background-color,border-color,transform] duration-150 hover:border-[#D5A52D] hover:bg-[#FCF9ED] active:scale-[.97] sm:text-[13px]`}
                >
                  {amount / 1000}rb
                </button>
              ))}
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <label className="block min-w-0">
                <span className="mb-1.5 block text-[12px] font-semibold text-[#53665A]">
                  Nama transaksi
                </span>
                <input
                  value={manualName}
                  maxLength={50}
                  onChange={(event) => setManualName(event.target.value)}
                  className={field}
                  placeholder="Belanja langsung"
                />
              </label>
              <label className="block min-w-0">
                <span className="mb-1.5 block text-[12px] font-semibold text-[#53665A]">
                  Kategori
                </span>
                <select
                  value={manualCategory}
                  onChange={(event) => setManualCategory(event.target.value as Category)}
                  className={field}
                >
                  <option value="Kantin">Kantin</option>
                  <option value="Koperasi">Koperasi</option>
                  <option value="Lainnya">Lainnya</option>
                </select>
              </label>
            </div>

            <div className="mt-3 flex gap-2.5">
              <div className="flex h-11 min-w-0 flex-1 items-center gap-2 rounded-[11px] border border-[#E6ECE7] px-3.5 transition-colors focus-within:border-[#105D38] focus-within:ring-2 focus-within:ring-[#105D38]/10">
                <span className="text-[13px] font-bold text-[#105D38]">Rp</span>
                <input
                  aria-label="Nominal pembayaran"
                  value={manual ? Number(manual).toLocaleString('id-ID') : ''}
                  onChange={(event) =>
                    setManual(event.target.value.replace(/\D/g, '').slice(0, 10))
                  }
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      event.preventDefault();
                      addManual();
                    }
                  }}
                  inputMode="numeric"
                  placeholder="0"
                  className="min-w-0 flex-1 bg-transparent text-[14px] font-semibold outline-none placeholder:text-[#A0ABA3]"
                />
              </div>
              <button
                type="button"
                className={`${primary} ${focus} shrink-0`}
                onClick={() => addManual()}
              >
                <Plus size={17} /> Tambah
              </button>
            </div>
          </section>

          {/* PRODUK */}
          <section className={`${panel} p-4 sm:p-6`}>
            <SectionTitle title="Produk" />
            <div className="mt-4 flex flex-col gap-3 lg:flex-row lg:items-center">
              <label className="relative block min-w-0 flex-1">
                <Search
                  size={17}
                  className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#809185]"
                />
                <span className="sr-only">Cari produk</span>
                <input
                  value={productSearch}
                  onChange={(event) => setProductSearch(event.target.value)}
                  placeholder="Cari produk"
                  className={`${field} pl-10`}
                />
              </label>
              <div
                role="group"
                aria-label="Filter kategori"
                className="flex max-w-full gap-1 overflow-x-auto rounded-[11px] border border-[#E6ECE7] bg-[#F7FAF8] p-1"
              >
                {CATEGORIES.map((option) => (
                  <button
                    key={option}
                    type="button"
                    aria-pressed={category === option}
                    onClick={() => setCategory(option)}
                    className={`${focus} shrink-0 rounded-[8px] px-3 py-2 text-[11px] font-semibold transition-colors duration-150 ${
                      category === option
                        ? 'bg-[#105D38] text-[#F1CC6C]'
                        : 'text-[#718077] hover:bg-white hover:text-[#105D38]'
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>

            {filtered.length ? (
              <div className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-3 2xl:grid-cols-4">
                {filtered.map((product) => (
                  <button
                    key={product.id}
                    type="button"
                    disabled={product.stock === 0}
                    onClick={() => addProduct(product)}
                    className={`${focus} group flex min-h-[122px] flex-col items-start rounded-[14px] border border-[#E6ECE7] bg-white p-3.5 text-left transition-[background-color,border-color,transform] duration-150 hover:border-[#B9D7C3] hover:bg-[#F7FAF8] active:scale-[.98] disabled:cursor-not-allowed disabled:opacity-45`}
                  >
                    <span className="flex w-full items-start justify-between gap-2">
                      <span className="line-clamp-2 min-w-0 text-[12px] font-bold leading-snug text-[#273A2D] sm:text-[13px]">
                        {product.name}
                      </span>
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[9px] bg-[#ECF7EF] text-[#105D38] transition-colors group-hover:bg-[#105D38] group-hover:text-white">
                        <Plus size={16} />
                      </span>
                    </span>
                    <span className="mt-auto pt-3 text-[14px] font-extrabold tracking-[-0.2px] text-[#105D38]">
                      {rp(product.price)}
                    </span>
                    <span className="mt-1 text-[11px] text-[#89978D]">
                      {product.stock === null ? 'Stok tersedia' : `Stok ${product.stock}`}
                    </span>
                  </button>
                ))}
              </div>
            ) : (
              <div className="mt-4 rounded-[13px] border border-dashed border-[#E6ECE7] py-10 text-center text-[13px] text-[#819087]">
                Produk tidak ditemukan.
              </div>
            )}
          </section>
        </div>

        {/* KERANJANG */}
        <aside className={`${panel} min-w-0 p-4 sm:p-6 xl:sticky xl:top-[96px]`}>
          <SectionTitle
            title="Keranjang"
            suffix={
              <span className="rounded-full bg-[#ECF7EF] px-2.5 py-1 text-[11px] font-bold text-[#105D38]">
                {count} item
              </span>
            }
          />

          <div className="mt-3 max-h-[350px] min-h-[112px] overflow-y-auto">
            {cart.length ? (
              <div className="divide-y divide-[#EDF1ED]">
                {cart.map((item) => (
                  <div key={item.key} className="flex items-center gap-3 py-3.5">
                    <div className="min-w-0 flex-1">
                      <p className="line-clamp-2 text-[13px] font-semibold text-[#26372C]">
                        {item.name}
                      </p>
                      <p className="mt-1 text-[11px] text-[#8A988E]">
                        {rp(item.price)} / item
                      </p>
                      <p className="mt-1 text-[13px] font-bold text-[#105D38]">
                        {rp(item.price * item.qty)}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <button
                        type="button"
                        aria-label={`Kurangi ${item.name}`}
                        onClick={() => changeQty(item.key, -1)}
                        className={`${focus} flex h-8 w-8 items-center justify-center rounded-[9px] border border-[#E6ECE7] text-[#506758] transition-colors hover:bg-[#F3F7F4]`}
                      >
                        <Minus size={15} />
                      </button>
                      <span className="w-5 text-center text-[12px] font-bold tabular-nums">
                        {item.qty}
                      </span>
                      <button
                        type="button"
                        aria-label={`Tambah ${item.name}`}
                        onClick={() => changeQty(item.key, 1)}
                        className={`${focus} flex h-8 w-8 items-center justify-center rounded-[9px] border border-[#E6ECE7] text-[#506758] transition-colors hover:bg-[#F3F7F4]`}
                      >
                        <Plus size={15} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex min-h-[145px] flex-col items-center justify-center text-center">
                <ShoppingCart size={27} strokeWidth={1.5} className="text-[#A9BAAE]" />
                <p className="mt-3 text-[13px] font-medium text-[#819087]">
                  Keranjang kosong
                </p>
              </div>
            )}
          </div>

          <div className="mt-3 border-t border-[#E6ECE7] pt-4">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[13px] font-semibold text-[#617165]">Total</span>
              <span className="break-all text-right text-[24px] font-extrabold tracking-[-0.7px] tabular-nums text-[#105D38]">
                {rp(total)}
              </span>
            </div>

            {error && (
              <p
                role="alert"
                className="mt-3 rounded-[11px] border border-[#F0D5D0] bg-[#FFF7F5] px-3 py-2.5 text-[12px] font-medium text-[#B45343]"
              >
                {error}
              </p>
            )}

            <button
              type="button"
              onClick={openFingerprint}
              disabled={!ready || !cart.length}
              className={`${primary} ${focus} mt-4 w-full`}
            >
              <Fingerprint size={19} className="text-[#F1CC6C]" />
              Scan &amp; bayar
            </button>
            {cart.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  setCart([]);
                  setError('');
                }}
                className={`${focus} mt-3 flex w-full items-center justify-center gap-2 py-1.5 text-[12px] font-semibold text-[#829187] transition-colors hover:text-[#B45343]`}
              >
                <Trash2 size={15} /> Kosongkan keranjang
              </button>
            )}
          </div>
        </aside>
      </div>
      </div>

      {/* Di mobile dialog berubah menjadi layar penuh yang masuk dari kanan. */}
      <dialog
        ref={dialogRef}
        aria-labelledby="scan-title"
        onCancel={(event) => {
          if (scanBusy || fingerState === 'success') event.preventDefault();
          else closeFingerprint();
        }}
        onClose={() => {
          if (fingerOpen && !scanningRef.current) closeFingerprint();
        }}
        onClick={(event) => {
          if (event.target === dialogRef.current && !scanBusy) closeFingerprint();
        }}
        className="dosi-payment-dialog m-auto w-[calc(100%-28px)] max-w-[450px] max-h-[calc(100dvh-28px)] overflow-y-auto rounded-[22px] border border-[#E6ECE7] bg-white p-0 text-[#142019] shadow-[0_14px_60px_rgba(15,35,23,.16)] max-lg:fixed max-lg:inset-0 max-lg:m-0 max-lg:flex max-lg:h-[100dvh] max-lg:max-h-[100dvh] max-lg:w-screen max-lg:max-w-none max-lg:flex-col max-lg:rounded-none max-lg:border-0 max-lg:shadow-none"
      >
        <div className="flex shrink-0 items-center justify-between border-b border-[#E6ECE7] px-5 py-4 max-lg:pt-[calc(16px+env(safe-area-inset-top))] sm:px-6">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={closeFingerprint}
              disabled={scanBusy || fingerState === 'success'}
              aria-label="Kembali ke nominal"
              className={`${focus} -ml-2 hidden h-9 w-9 items-center justify-center rounded-[10px] text-[#105D38] disabled:opacity-30 max-lg:flex`}
            >
              <ArrowLeft size={20} />
            </button>
            <h2 id="scan-title" className="text-[17px] font-bold tracking-[-0.35px]">
              <span className="lg:hidden">Sidik jari</span>
              <span className="hidden lg:inline">Scan sidik jari</span>
            </h2>
          </div>
          <span className="rounded-full border border-[#E6ECE7] px-3 py-1.5 text-[11px] font-bold tabular-nums text-[#105D38] lg:hidden">02 / 02</span>
          <button
            type="button"
            onClick={closeFingerprint}
            disabled={scanBusy || fingerState === 'success'}
            aria-label="Tutup pembayaran"
            className={`${focus} flex h-9 w-9 items-center justify-center rounded-[10px] text-[#7A8B7F] transition-colors hover:bg-[#F4F7F4] disabled:opacity-30 max-lg:hidden`}
          >
            <X size={19} />
          </button>
        </div>

        <div className="px-5 pb-5 pt-6 max-lg:min-h-0 max-lg:flex-1 max-lg:overflow-y-auto max-lg:pt-12 sm:px-6" aria-live="polite">
          <div className="flex flex-col items-center text-center">
            <div
              className={`relative flex h-[104px] w-[104px] items-center justify-center overflow-hidden rounded-[25px] border transition-colors duration-200 ${
                fingerState === 'success'
                  ? 'border-[#BFDCC9] bg-[#ECF7EF] text-[#105D38]'
                  : fingerState === 'failed'
                    ? 'border-[#F0D5D0] bg-[#FFF7F5] text-[#B45343]'
                    : 'border-[#DCEAE0] bg-[#F7FAF8] text-[#105D38]'
              }`}
            >
              {fingerState === 'success' ? (
                <Check size={52} strokeWidth={2.3} />
              ) : fingerState === 'failed' ? (
                <CircleAlert size={49} strokeWidth={1.7} />
              ) : (
                <>
                  <Fingerprint size={62} strokeWidth={1.3} />
                  {scanBusy && <span className="dosi-payment-scanline" />}
                </>
              )}
            </div>

            <h3 className="mt-4 text-[16px] font-bold text-[#1B3323]">
              {fingerState === 'idle' && 'Siap memindai'}
              {fingerState === 'scanning' && 'Memindai...'}
              {fingerState === 'checking' && 'Memeriksa pembayaran...'}
              {fingerState === 'success' && 'Pembayaran berhasil'}
              {fingerState === 'failed' && 'Pembayaran gagal'}
            </h3>

            {scanError && fingerState === 'failed' && (
              <p role="alert" className="mt-2 text-[12px] font-medium text-[#B45343]">
                {scanError}
              </p>
            )}
          </div>

          {scanInfo && (
            <div className="mt-5 rounded-[14px] border border-[#E6ECE7] p-4">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#ECF7EF] text-[12px] font-bold text-[#105D38]">
                  {scanInfo.student.initial}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-[13px] font-bold text-[#26372C]">
                    {scanInfo.student.name}
                  </p>
                  <p className="mt-0.5 text-[11px] text-[#839186]">
                    {scanInfo.student.id} · {scanInfo.student.className}
                  </p>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-4 border-t border-[#E6ECE7] pt-3.5">
                <div>
                  <p className="text-[11px] text-[#829187]">Saldo</p>
                  <p className="mt-1 text-[13px] font-bold text-[#105D38]">
                    {rp(scanInfo.balance)}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] text-[#829187]">Sisa limit</p>
                  <p className="mt-1 text-[13px] font-bold text-[#105D38]">
                    {rp(scanInfo.remainingLimit)}
                  </p>
                </div>
              </div>
              {fingerState !== 'failed' && (
                <ParentNote studentId={scanInfo.student.id} />
              )}
            </div>
          )}

          <div className="mt-5 flex items-center justify-between gap-3 border-t border-[#E6ECE7] pt-4">
            <span className="text-[12px] font-medium text-[#829187]">Total</span>
            <span className="text-[23px] font-extrabold tracking-[-0.5px] text-[#105D38]">
              {rp(paymentTotal)}
            </span>
          </div>
          <p className="mt-2 text-center text-[11px] text-[#93A097]">
            Simulasi tanpa sensor asli
          </p>
        </div>

        <div className="shrink-0 border-t border-[#E6ECE7] bg-white px-5 py-4 max-lg:pb-[calc(20px+env(safe-area-inset-bottom))] sm:px-6">
          {fingerState === 'idle' && (
            <button
              type="button"
              className={`${primary} ${focus} w-full`}
              onClick={finishFingerprint}
            >
              <Fingerprint size={18} className="text-[#F1CC6C]" /> Mulai scan
            </button>
          )}
          {scanBusy && (
            <button type="button" disabled className={`${primary} w-full`}>
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
              Memproses...
            </button>
          )}
          {fingerState === 'failed' && (
            <button
              type="button"
              className={`${primary} ${focus} w-full`}
              onClick={closeFingerprint}
            >
              Tutup
            </button>
          )}
          {fingerState === 'success' && (
            <button type="button" disabled className={`${primary} w-full`}>
              <Check size={18} /> Berhasil
            </button>
          )}
        </div>
      </dialog>

      <style jsx global>{`
        .dosi-payment-dialog:not([open]) {
          display: none !important;
        }
        .dosi-payment-dialog::backdrop {
          background-color: rgba(12, 32, 19, 0.48);
        }
        @media (max-width: 1023px) {
          .dosi-payment-dialog[open] {
            animation: dosiMobileScanIn 220ms cubic-bezier(.22, 1, .36, 1) both;
            overscroll-behavior: contain;
          }
          .dosi-payment-dialog::backdrop {
            background: #FFFFFF;
          }
        }
        @keyframes dosiMobileScanIn {
          from { opacity: .85; transform: translate3d(22px, 0, 0); }
          to { opacity: 1; transform: translate3d(0, 0, 0); }
        }
        .dosi-payment-scanline {
          position: absolute;
          left: 15%;
          right: 15%;
          height: 2px;
          top: 15%;
          border-radius: 999px;
          background: #d5a52d;
          animation: dosiPaymentScan 1.05s ease-in-out infinite;
        }
        @keyframes dosiPaymentScan {
          0% { top: 15%; opacity: 0; }
          20% { opacity: 1; }
          80% { opacity: 1; }
          100% { top: 82%; opacity: 0; }
        }
        @media (prefers-reduced-motion: reduce) {
          .dosi-payment-scanline { animation: none; top: 50%; opacity: 1; }
          .dosi-payment-dialog[open] { animation: none !important; }
        }
      `}</style>
    </div>
  );
}
