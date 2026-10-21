
'use client';

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type FormEvent,
} from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  Clock3,
  History,
  LockKeyhole,
  Wallet,
  X,
} from 'lucide-react';

import { useKasir } from '../components/KasirProvider';
import {
  availableSettlement,
  fmtDate,
  parseNominal,
  rp,
  withdrawnToday,
} from '../lib/data';

const panel =
  'rounded-[20px] border border-[#E6ECE7] bg-white';

const focus =
  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#D5A52D]';

function ConfirmDialog({
  amount,
  note,
  processing,
  onClose,
  onConfirm,
}: {
  amount: number;
  note: string;
  processing: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    const previousFocus =
      document.activeElement as HTMLElement | null;

    document.body.style.overflow = 'hidden';

    const frame = requestAnimationFrame(() => {
      cancelRef.current?.focus();
    });

    function handleKey(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
        return;
      }

      if (event.key !== 'Tab' || !dialogRef.current) return;

      const elements = Array.from(
        dialogRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [tabindex="0"]'
        )
      );

      if (!elements.length) return;

      const first = elements[0];
      const last = elements[elements.length - 1];

      if (
        event.shiftKey &&
        document.activeElement === first
      ) {
        event.preventDefault();
        last.focus();
      } else if (
        !event.shiftKey &&
        document.activeElement === last
      ) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener('keydown', handleKey);

    return () => {
      cancelAnimationFrame(frame);
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', handleKey);
      previousFocus?.focus();
    };
  }, [onClose]);

  if (typeof document === 'undefined') return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center sm:p-5">
      <button
        type="button"
        aria-label="Tutup konfirmasi"
        disabled={processing}
        onClick={onClose}
        className="dosi-withdraw-backdrop absolute inset-0 bg-[#102719]/50"
      />

      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="withdraw-title"
        aria-describedby="withdraw-description"
        className="dosi-withdraw-sheet relative w-full overflow-hidden rounded-t-[24px] border border-[#E6ECE7] bg-white sm:max-w-[460px] sm:rounded-[22px]"
      >
        <div className="flex items-center justify-between border-b border-[#E6ECE7] px-5 py-4 sm:px-6">
          <h2
            id="withdraw-title"
            className="text-[17px] font-bold tracking-[-0.4px] text-[#142019]"
          >
            Konfirmasi Penarikan
          </h2>

          <button
            type="button"
            onClick={onClose}
            disabled={processing}
            aria-label="Tutup"
            className={`${focus} flex h-9 w-9 items-center justify-center rounded-[11px] bg-[#F3F6F3] text-[#647568] disabled:opacity-40`}
          >
            <X size={18} />
          </button>
        </div>

        <div className="px-5 py-6 sm:px-6">
          <div className="rounded-[16px] border border-[#E6ECE7] bg-[#F8FAF8] px-4 py-5 text-center">
            <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-[14px] bg-[#ECF7EF] text-[#105D38]">
              <Wallet size={23} strokeWidth={1.8} />
            </span>

            <p className="mt-4 text-[12px] font-medium text-[#718077]">
              Nominal penarikan
            </p>

            <p className="mt-1 break-words text-[clamp(26px,7vw,36px)] font-extrabold tracking-[-1px] tabular-nums text-[#105D38]">
              {rp(amount)}
            </p>
          </div>

          {note.trim() && (
            <div className="mt-5">
              <p className="text-[11px] font-medium text-[#829087]">
                Catatan
              </p>
              <p className="mt-1 break-words text-[13px] font-semibold leading-relaxed text-[#273D2E]">
                {note.trim()}
              </p>
            </div>
          )}

          <div
            id="withdraw-description"
            className="mt-5 flex items-start gap-2.5 border-t border-[#E6ECE7] pt-4"
          >
            <LockKeyhole
              size={17}
              className="mt-0.5 shrink-0 text-[#967014]"
            />
            <p className="text-[11px] leading-relaxed text-[#718077]">
              Penarikan ini hanya dicatat dalam sistem.
              Tidak ada transfer bank.
            </p>
          </div>
        </div>

        <div className="flex gap-3 border-t border-[#E6ECE7] px-5 pb-[calc(18px+env(safe-area-inset-bottom))] pt-4 sm:px-6 sm:pb-5">
          <button
            ref={cancelRef}
            type="button"
            disabled={processing}
            onClick={onClose}
            className={`${focus} h-12 flex-1 rounded-[12px] border border-[#E6ECE7] bg-white text-[13px] font-semibold text-[#526459] transition-colors hover:bg-[#F5F8F5] disabled:opacity-40`}
          >
            Kembali
          </button>

          <button
            type="button"
            disabled={processing}
            onClick={onConfirm}
            className={`${focus} flex h-12 flex-[1.4] items-center justify-center gap-2 rounded-[12px] bg-[#105D38] px-3 text-[13px] font-semibold text-white transition-colors hover:bg-[#0B482B] disabled:opacity-50`}
          >
            <Check size={17} />
            {processing ? 'Menyimpan...' : 'Konfirmasi'}
          </button>
        </div>
      </div>

      <style jsx global>{`
        @keyframes dosiWithdrawIn {
          from {
            opacity: 0;
            transform: translateY(18px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes dosiWithdrawBackdrop {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        .dosi-withdraw-sheet {
          animation: dosiWithdrawIn 180ms ease-out both;
        }

        .dosi-withdraw-backdrop {
          animation: dosiWithdrawBackdrop 150ms ease-out both;
        }

        @media (prefers-reduced-motion: reduce) {
          .dosi-withdraw-sheet,
          .dosi-withdraw-backdrop {
            animation: none !important;
          }
        }
      `}</style>
    </div>,
    document.body
  );
}

export default function Penarikan() {
  const { store, ready, createWithdrawal } = useKasir();

  const [amountRaw, setAmountRaw] = useState('');
  const [note, setNote] = useState('');
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const [successAmount, setSuccessAmount] =
    useState<number | null>(null);

  const processingRef = useRef(false);

  const available = availableSettlement(store);
  const used = withdrawnToday(store);
  const lastWithdrawal = store.withdrawals[0];

  const amount = parseNominal(amountRaw);

  const valid =
    ready &&
    !used &&
    Number.isSafeInteger(amount) &&
    amount > 0 &&
    amount <= available;

  const disabled = !ready || used || available <= 0;

  const amountExceeded =
    amountRaw.length > 0 && amount > available;

  const formattedAmount = amountRaw
    ? Number(amountRaw).toLocaleString('id-ID')
    : '';

  const closeConfirm = useCallback(() => {
    if (!processingRef.current) {
      setConfirmOpen(false);
    }
  }, []);

  function changeAmount(value: string) {
    const digits = value.replace(/\D/g, '').slice(0, 15);

    setAmountRaw(digits);
    setError('');
    setSuccessAmount(null);
  }

  function setMaximum() {
    if (disabled) return;

    setAmountRaw(String(available));
    setError('');
    setSuccessAmount(null);
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');

    if (!valid) {
      setError(
        used
          ? 'Penarikan hari ini sudah dilakukan.'
          : 'Periksa nominal penarikan.'
      );
      return;
    }

    setConfirmOpen(true);
  }

  function confirm() {
    if (processingRef.current) return;

    processingRef.current = true;
    setProcessing(true);
    setError('');

    try {
      const result = createWithdrawal(amount, note);

      setConfirmOpen(false);

      if (!result.ok) {
        setError(result.error);
        return;
      }

      setSuccessAmount(amount);
      setAmountRaw('');
      setNote('');
    } catch {
      setConfirmOpen(false);
      setError('Penarikan gagal dicatat.');
    } finally {
      processingRef.current = false;
      setProcessing(false);
    }
  }

  return (
    <div className="w-full min-w-0 text-[#142019]">
      {/* HEADER */}
      <header className="mb-6 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-[24px] font-extrabold leading-tight tracking-[-0.8px] sm:text-[30px]">
            Penarikan
          </h1>
          <p className="mt-1 text-[12px] text-[#718077] sm:text-[13px]">
            Dana koperasi
          </p>
        </div>

        <Link
          href="/kasir/saldo"
          className={`${focus} inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-[12px] border border-[#E6ECE7] bg-white px-3 text-[12px] font-semibold text-[#105D38] transition-colors hover:border-[#B9D4C2] hover:bg-[#F7FAF8] sm:h-11 sm:px-4 sm:text-[13px]`}
        >
          <ArrowLeft size={16} />
          Saldo
        </Link>
      </header>

      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1.45fr)_minmax(290px,.85fr)]">
        {/* MAIN */}
        <section className={`${panel} min-w-0 overflow-hidden`}>
          {/* AVAILABLE BALANCE */}
          <div className="bg-[#105D38] px-5 py-6 text-white sm:px-7 sm:py-7">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <p className="text-[12px] font-medium text-[#D4E8DC]">
                  Saldo tersedia
                </p>

                <p className="mt-2 break-words text-[clamp(28px,6vw,39px)] font-extrabold leading-tight tracking-[-1px] tabular-nums">
                  {ready ? rp(available) : '—'}
                </p>
              </div>

              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[14px] bg-white/10 text-[#E0B341]">
                <Wallet size={23} strokeWidth={1.8} />
              </span>
            </div>

            <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-white/20 px-3 py-1.5">
              <span
                className={`h-[7px] w-[7px] rounded-full ${
                  used ? 'bg-[#E0B341]' : 'bg-[#7DDEA3]'
                }`}
              />
              <span className="text-[11px] font-semibold text-white">
                {!ready
                  ? 'Memuat...'
                  : used
                    ? 'Sudah ditarik hari ini'
                    : available > 0
                      ? 'Siap ditarik'
                      : 'Saldo kosong'}
              </span>
            </div>
          </div>

          {/* WITHDRAWAL FORM */}
          <form
            onSubmit={submit}
            className="space-y-5 p-5 sm:p-7"
          >
            {successAmount !== null && (
              <div
                role="status"
                className="flex items-start gap-3 rounded-[13px] border border-[#D8EBDD] bg-[#F0F9F2] px-4 py-3.5"
              >
                <CheckCircle2
                  size={19}
                  className="mt-0.5 shrink-0 text-[#105D38]"
                />

                <div className="min-w-0">
                  <p className="text-[13px] font-bold text-[#105D38]">
                    Penarikan tercatat
                  </p>
                  <p className="mt-1 text-[12px] text-[#506E58]">
                    {rp(successAmount)}
                  </p>
                </div>
              </div>
            )}

            {ready && used && successAmount === null && (
              <div className="flex items-start gap-3 rounded-[13px] border border-[#F0E4C5] bg-[#FCF8EC] px-4 py-3.5">
                <Clock3
                  size={19}
                  className="mt-0.5 shrink-0 text-[#967014]"
                />

                <div className="min-w-0">
                  <p className="text-[13px] font-bold text-[#765919]">
                    Batas harian tercapai
                  </p>
                  <p className="mt-1 text-[12px] text-[#8B773F]">
                    Penarikan berikutnya besok.
                  </p>
                </div>
              </div>
            )}

            <div>
              <div className="mb-3 flex items-center justify-between gap-2">
                <label
                  htmlFor="withdraw-amount"
                  className="text-[13px] font-bold text-[#142019]"
                >
                  Nominal penarikan
                </label>

                <button
                  type="button"
                  onClick={setMaximum}
                  disabled={disabled}
                  className={`${focus} text-[12px] font-bold text-[#105D38] transition-colors hover:text-[#0B482B] disabled:cursor-not-allowed disabled:opacity-30`}
                >
                  Maksimal
                </button>
              </div>

              <div
                className={`flex h-[68px] items-center gap-2 rounded-[15px] border bg-white px-4 transition-colors focus-within:border-[#105D38] sm:h-[76px] ${
                  amountExceeded
                    ? 'border-[#D79B94]'
                    : 'border-[#DDE7DF]'
                } ${disabled ? 'bg-[#F8FAF8]' : ''}`}
              >
                <span className="shrink-0 text-[19px] font-bold text-[#105D38]">
                  Rp
                </span>

                <input
                  id="withdraw-amount"
                  type="text"
                  inputMode="numeric"
                  autoComplete="off"
                  disabled={disabled}
                  placeholder="0"
                  value={formattedAmount}
                  onChange={(event) =>
                    changeAmount(event.target.value)
                  }
                  className="h-full w-full min-w-0 bg-transparent text-[clamp(22px,5vw,30px)] font-extrabold tracking-[-0.8px] tabular-nums text-[#142019] outline-none placeholder:text-[#C3CDC5] disabled:cursor-not-allowed"
                />
              </div>

              {amountExceeded && (
                <p
                  role="alert"
                  className="mt-2 text-[12px] text-[#B44747]"
                >
                  Nominal melebihi saldo tersedia.
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="withdraw-note"
                className="mb-2.5 block text-[13px] font-bold text-[#142019]"
              >
                Catatan{' '}
                <span className="font-normal text-[#91A096]">
                  (opsional)
                </span>
              </label>

              <textarea
                id="withdraw-note"
                rows={2}
                maxLength={140}
                disabled={disabled}
                placeholder="Contoh: Operasional koperasi"
                value={note}
                onChange={(event) => {
                  setNote(event.target.value);
                  setError('');
                }}
                className={`${focus} w-full resize-none rounded-[13px] border border-[#DDE7DF] bg-white px-4 py-3.5 text-[13px] leading-relaxed text-[#142019] outline-none placeholder:text-[#A3AFA5] focus:border-[#105D38] disabled:cursor-not-allowed disabled:bg-[#F8FAF8]`}
              />
            </div>

            {error && (
              <div
                role="alert"
                className="rounded-[12px] border border-[#F0DAD6] bg-[#FFF7F5] px-3.5 py-3 text-[12px] font-medium text-[#B44747]"
              >
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={!valid}
              className={`${focus} flex h-[52px] w-full items-center justify-center gap-2 rounded-[13px] bg-[#105D38] px-4 text-[14px] font-semibold text-white transition-[background-color,transform] duration-150 hover:bg-[#0B482B] active:scale-[0.99] disabled:cursor-not-allowed disabled:bg-[#DCE8DF] disabled:text-[#91A397] disabled:active:scale-100`}
            >
              Lanjutkan
              <ArrowRight size={18} />
            </button>
          </form>
        </section>

        {/* SIDE INFORMATION */}
        <div className="space-y-4">
          <section className={`${panel} p-5 sm:p-6`}>
            <h2 className="text-[16px] font-bold tracking-[-0.4px] text-[#142019]">
              Status Hari Ini
            </h2>

            <div className="mt-5 flex items-start gap-3">
              <span
                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-[13px] ${
                  used
                    ? 'bg-[#FAF1D8] text-[#967014]'
                    : 'bg-[#ECF7EF] text-[#105D38]'
                }`}
              >
                {used ? (
                  <LockKeyhole size={20} strokeWidth={1.8} />
                ) : (
                  <CheckCircle2 size={20} strokeWidth={1.8} />
                )}
              </span>

              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-bold text-[#142019]">
                  {!ready
                    ? 'Memuat...'
                    : used
                      ? 'Sudah tercatat'
                      : 'Belum ada penarikan'}
                </p>

                <p className="mt-1 text-[12px] leading-relaxed text-[#718077]">
                  Maksimal satu penarikan per hari (WIB).
                </p>
              </div>
            </div>
          </section>

          <section className={`${panel} p-5 sm:p-6`}>
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-[16px] font-bold tracking-[-0.4px] text-[#142019]">
                Penarikan Terakhir
              </h2>

              <History
                size={19}
                className="text-[#A4B0A6]"
                aria-hidden="true"
              />
            </div>

            {!ready ? (
              <p className="mt-5 text-[13px] text-[#718077]">
                Memuat...
              </p>
            ) : lastWithdrawal ? (
              <div className="mt-5">
                <p className="break-words text-[25px] font-extrabold tracking-[-0.8px] tabular-nums text-[#105D38]">
                  {rp(lastWithdrawal.amount)}
                </p>

                <p className="mt-2 text-[12px] text-[#718077]">
                  {fmtDate(lastWithdrawal.time)}
                </p>

                {lastWithdrawal.note && (
                  <p className="mt-3 break-words border-t border-[#EDF1ED] pt-3 text-[12px] leading-relaxed text-[#647568]">
                    {lastWithdrawal.note}
                  </p>
                )}
              </div>
            ) : (
              <p className="mt-5 text-[13px] text-[#819087]">
                Belum ada penarikan.
              </p>
            )}
          </section>

          <Link
            href="/kasir/saldo"
            className={`${focus} flex h-12 items-center justify-between rounded-[13px] border border-[#E6ECE7] bg-white px-4 text-[13px] font-semibold text-[#105D38] transition-colors hover:border-[#B8D7C2] hover:bg-[#F7FAF8]`}
          >
            Riwayat penarikan
            <ArrowRight size={17} />
          </Link>
        </div>
      </div>

      {confirmOpen && (
        <ConfirmDialog
          amount={amount}
          note={note}
          processing={processing}
          onClose={closeConfirm}
          onConfirm={confirm}
        />
      )}
    </div>
  );
}
