"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
} from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CircleCheck,
  Info,
  MessageSquareText,
  Send,
  Wallet,
} from "lucide-react";

/* =========================================
   DOSI PAY — PESAN WALI SANTRI
   Neo / Finance / Compact
========================================= */

const DEPOSIT_HISTORY_KEY = "dosi_demo_deposit_history";
const LATEST_RECEIPT_KEY = "dosi_demo_deposit_receipt";
const MESSAGE_STORAGE_KEY = "dosi_wali_santri_messages_demo_v1";

const MAX_MESSAGE_LENGTH = 250;

const DEMO_SANTRI = {
  name: "Ahmad Fauzan",
  initials: "AF",
  nis: "20260001",
};

type DepositRecord = {
  key: string;
  amount: number;
  createdAt: string;
};

type SantriMessage = {
  id: string;
  depositKey: string;
  text: string;
  createdAt: string;
};

type SendState = "idle" | "sending" | "success";

/* =========================================
   HELPERS
========================================= */

function formatDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "-";

  return (
    new Intl.DateTimeFormat("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
      timeZone: "Asia/Jakarta",
    }).format(date) + " WIB"
  );
}

function createDepositKey(
  bankId: string,
  amount: number,
  createdAt: string
) {
  return `${createdAt}|${bankId}|${amount}`;
}

function normalizeDeposit(value: unknown): DepositRecord | null {
  if (!value || typeof value !== "object") return null;

  const item = value as Record<string, unknown>;

  if (
    item.isDemo !== true ||
    typeof item.bankId !== "string" ||
    typeof item.depositAmount !== "number" ||
    !Number.isFinite(item.depositAmount) ||
    item.depositAmount < 20000 ||
    item.adminFee !== 5000 ||
    item.totalPayment !== item.depositAmount + 5000 ||
    typeof item.createdAt !== "string" ||
    !Number.isFinite(Date.parse(item.createdAt))
  ) {
    return null;
  }

  return {
    key: createDepositKey(
      item.bankId,
      item.depositAmount,
      item.createdAt
    ),
    amount: item.depositAmount,
    createdAt: item.createdAt,
  };
}

function readDeposits(): DepositRecord[] {
  const results: DepositRecord[] = [];

  try {
    const raw = localStorage.getItem(DEPOSIT_HISTORY_KEY);

    if (raw) {
      const parsed: unknown = JSON.parse(raw);

      if (Array.isArray(parsed)) {
        parsed.forEach((item) => {
          const deposit = normalizeDeposit(item);
          if (deposit) results.push(deposit);
        });
      }
    }
  } catch {
    // fallback ke latest receipt
  }

  try {
    const raw = sessionStorage.getItem(LATEST_RECEIPT_KEY);

    if (raw) {
      const parsed: unknown = JSON.parse(raw);
      const deposit = normalizeDeposit(parsed);

      if (deposit) results.push(deposit);
    }
  } catch {
    // ignore
  }

  const unique = new Map<string, DepositRecord>();

  results.forEach((item) => {
    unique.set(item.key, item);
  });

  return [...unique.values()].sort(
    (a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt)
  );
}

function readMessages(): SantriMessage[] {
  try {
    const raw = localStorage.getItem(MESSAGE_STORAGE_KEY);

    if (!raw) return [];

    const parsed: unknown = JSON.parse(raw);

    if (!Array.isArray(parsed)) return [];

    return parsed
      .filter((value): value is SantriMessage => {
        if (!value || typeof value !== "object") return false;

        const item = value as Record<string, unknown>;

        return (
          typeof item.id === "string" &&
          typeof item.depositKey === "string" &&
          typeof item.text === "string" &&
          item.text.trim().length > 0 &&
          item.text.length <= MAX_MESSAGE_LENGTH &&
          typeof item.createdAt === "string" &&
          Number.isFinite(Date.parse(item.createdAt))
        );
      })
      .slice(-100);
  } catch {
    return [];
  }
}

/* =========================================
   PAGE
========================================= */

export default function PesanWaliPage() {
  const [deposits, setDeposits] = useState<DepositRecord[]>([]);
  const [messages, setMessages] = useState<SantriMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  const [sendState, setSendState] = useState<SendState>("idle");
  const [newMessageId, setNewMessageId] = useState<string | null>(null);

  const sendingRef = useRef(false);
  const sendTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const successTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    function refreshData() {
      setDeposits(readDeposits());
      setMessages(readMessages());
      setReady(true);
    }

    refreshData();

    window.addEventListener("focus", refreshData);

    function handleStorage(event: StorageEvent) {
      if (
        event.key === DEPOSIT_HISTORY_KEY ||
        event.key === MESSAGE_STORAGE_KEY ||
        event.key === null
      ) {
        refreshData();
      }
    }

    window.addEventListener("storage", handleStorage);

    return () => {
      window.removeEventListener("focus", refreshData);
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  useEffect(() => {
    return () => {
      if (sendTimerRef.current) clearTimeout(sendTimerRef.current);
      if (successTimerRef.current) clearTimeout(successTimerRef.current);
    };
  }, []);

  const availableDeposits = useMemo(() => {
    const usedKeys = new Set(messages.map((item) => item.depositKey));
    return deposits.filter((item) => !usedKeys.has(item.key));
  }, [deposits, messages]);

  const totalQuota = deposits.length;
  const remainingQuota = availableDeposits.length;
  const usedQuota = totalQuota - remainingQuota;

  const quotaProgress =
    totalQuota > 0 ? (remainingQuota / totalQuota) * 100 : 0;

  const sortedMessages = useMemo(
    () =>
      [...messages].sort(
        (a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt)
      ),
    [messages]
  );

  function sendMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (sendingRef.current) return;

    const text = draft.trim();

    setError("");

    if (!ready || remainingQuota <= 0) {
      setError("Deposit dulu untuk mendapatkan kuota pesan.");
      return;
    }

    if (!text) {
      setError("Tulis pesan terlebih dahulu.");
      return;
    }

    if (text.length > MAX_MESSAGE_LENGTH) {
      setError("Pesan maksimal 250 karakter.");
      return;
    }

    sendingRef.current = true;
    setSendState("sending");

    sendTimerRef.current = setTimeout(() => {
      const latestDeposits = readDeposits();
      const latestMessages = readMessages();

      const usedKeys = new Set(
        latestMessages.map((item) => item.depositKey)
      );

      const quota = latestDeposits.find(
        (item) => !usedKeys.has(item.key)
      );

      if (!quota) {
        setDeposits(latestDeposits);
        setMessages(latestMessages);
        setError("Kuota pesan habis. Silakan deposit kembali.");
        setSendState("idle");
        sendingRef.current = false;
        return;
      }

      const newMessage: SantriMessage = {
        id: `msg-${Date.now()}-${Math.random()
          .toString(36)
          .slice(2, 8)}`,
        depositKey: quota.key,
        text,
        createdAt: new Date().toISOString(),
      };

      const updatedMessages = [...latestMessages, newMessage];

      try {
        localStorage.setItem(
          MESSAGE_STORAGE_KEY,
          JSON.stringify(updatedMessages)
        );

        setDeposits(latestDeposits);
        setMessages(updatedMessages);
        setDraft("");
        setNewMessageId(newMessage.id);
        setSendState("success");

        successTimerRef.current = setTimeout(() => {
          setSendState("idle");
          setNewMessageId(null);
        }, 1800);
      } catch {
        setError("Pesan gagal disimpan. Coba lagi.");
        setSendState("idle");
      } finally {
        sendingRef.current = false;
      }
    }, 420);
  }

  const canWrite = ready && remainingQuota > 0;
  const isSending = sendState === "sending";

  return (
    <main className="min-h-[100dvh] bg-[#F2F5F2] font-sans text-[#17251D]">
      <div className="mx-auto min-h-[100dvh] w-full max-w-[430px] bg-[#FCFDFC]">

        {/* =====================================
            STICKY HEADER
        ===================================== */}

        <header className="sticky top-0 z-40 border-b border-[#E6ECE7] bg-[#FCFDFC]/95 px-[16px] pt-[env(safe-area-inset-top)] backdrop-blur-md shadow-[0_2px_10px_rgba(0,0,0,0.03)]">
          <div className="flex h-[54px] items-center justify-between">
            <Link
              href="/wali/beranda"
              aria-label="Kembali ke beranda"
              className="pesan-press flex h-[35px] w-[35px] items-center justify-center rounded-[11px] border border-[#DEE7E1] bg-white text-[#21352A] shadow-[2px_2px_0_#E8EEE9]"
            >
              <ArrowLeft size={18} strokeWidth={1.8} />
            </Link>

            <div className="text-center">
              <p className="text-[9px] font-semibold tracking-[0.18em] text-[#7D8C81]">
                DOSI PAY
              </p>
              <h1 className="mt-[2px] text-[14px] font-bold tracking-[-0.25px] text-[#17251D]">
                Pesan Santri
              </h1>
            </div>

            <div className="flex h-[35px] min-w-[35px] items-center justify-center rounded-[11px] border border-[#DEE7E1] bg-white px-[8px] text-[9px] font-bold text-[#105D38] shadow-[2px_2px_0_#E8EEE9]">
              {ready ? remainingQuota : "—"}
            </div>
          </div>
        </header>

        <div className="px-[16px] pb-[max(28px,env(safe-area-inset-bottom))]">

          {/* =====================================
              HERO / TOP PANEL
          ===================================== */}

          <section className="pesan-enter-1 mt-[15px] grid gap-[12px]">
            <div className="rounded-[20px] border border-[#183428] bg-[#163B2B] px-[15px] py-[15px] text-white shadow-[4px_4px_0_#D8E6DB]">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#BFE1CA]">
                    Send message
                  </p>

                  <h2 className="mt-[8px] text-[34px] font-black uppercase leading-[0.92] tracking-[-0.06em] text-white max-[360px]:text-[29px]">
                    Kirim
                    <br />
                    Pesan
                    <br />
                    Santri
                  </h2>
                </div>

                <div className="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-full border border-white/20 bg-white/10 text-[#7BE3A6]">
                  <MessageSquareText size={20} strokeWidth={1.8} />
                </div>
              </div>

              <div className="mt-[16px] grid grid-cols-[1fr_auto] gap-[10px] rounded-[15px] border border-white/10 bg-white/6 px-[12px] py-[11px] backdrop-blur-sm">
                <div className="min-w-0">
                  <p className="text-[9px] uppercase tracking-[0.12em] text-[#B7D5C1]">
                    Santri
                  </p>
                  <p className="mt-[4px] truncate text-[13px] font-semibold text-white">
                    {DEMO_SANTRI.name}
                  </p>
                  <p className="mt-[2px] text-[9px] text-[#B7D5C1]">
                    NIS {DEMO_SANTRI.nis}
                  </p>
                </div>

                <div className="flex h-[40px] w-[40px] items-center justify-center rounded-full border border-[#2B6248] bg-[#215239] text-[12px] font-bold text-[#DDF6E6]">
                  {DEMO_SANTRI.initials}
                </div>
              </div>
            </div>

            {/* QUOTA PANEL */}
            <div className="rounded-[18px] border border-[#DEE6E0] bg-white px-[14px] py-[13px] shadow-[3px_3px_0_#E5ECE6]">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[10px] font-semibold text-[#6B7B6E]">
                    Kuota pesan
                  </p>
                  <p className="mt-[3px] text-[11px] font-bold text-[#1B2C21]">
                    1 deposit = 1 pesan
                  </p>
                </div>

                <div className="text-right">
                  <p className="text-[24px] font-black leading-none tracking-[-0.04em] text-[#105D38] tabular-nums">
                    {ready ? remainingQuota : "—"}
                  </p>
                  <p className="mt-[3px] text-[9px] text-[#97A49A]">
                    tersedia
                  </p>
                </div>
              </div>

              <div className="mt-[12px] h-[6px] overflow-hidden rounded-full bg-[#E8F0EA]">
                <div
                  className="pesan-progress h-full rounded-full bg-[#2D8A58]"
                  style={{
                    width: ready ? `${quotaProgress}%` : "0%",
                  }}
                />
              </div>

              <div className="mt-[9px] flex items-center justify-between text-[9px] text-[#8C9990]">
                <span>Total {ready ? totalQuota : "—"}</span>
                <span>Terpakai {ready ? usedQuota : "—"}</span>
              </div>
            </div>
          </section>

          {/* =====================================
              FORM
          ===================================== */}

          <section className="pesan-enter-2 mt-[16px] rounded-[20px] border border-[#DEE7E1] bg-white p-[14px] shadow-[4px_4px_0_#E7EEE8]">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#7C8B80]">
                  Compose
                </p>
                <h3 className="mt-[3px] text-[16px] font-bold tracking-[-0.03em] text-[#17251D]">
                  Tulis Pesan
                </h3>
              </div>

              <div className="rounded-[11px] border border-[#E4ECE6] bg-[#F7F9F7] px-[8px] py-[6px] text-[9px] font-semibold text-[#839286]">
                {draft.length}/{MAX_MESSAGE_LENGTH}
              </div>
            </div>

            <form onSubmit={sendMessage} className="mt-[12px]">

              {/* RECIPIENT MINI CARD */}
              <div className="rounded-[14px] border border-[#E5ECE6] bg-[#F7F9F7] px-[11px] py-[10px]">
                <div className="flex items-center gap-[10px]">
                  <div className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-full bg-[#DDF1E3] text-[11px] font-bold text-[#105D38]">
                    {DEMO_SANTRI.initials}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[11px] font-semibold text-[#203228]">
                      {DEMO_SANTRI.name}
                    </p>
                    <p className="mt-[2px] text-[9px] text-[#8F9C92]">
                      Penerima pesan
                    </p>
                  </div>

                  <CircleCheck
                    size={18}
                    strokeWidth={1.8}
                    className="text-[#2A8A57]"
                  />
                </div>
              </div>

              {/* TEXT AREA */}
              <div className="mt-[11px]">
                <label
                  htmlFor="wali-message"
                  className="mb-[7px] block text-[10px] font-semibold text-[#66756B]"
                >
                  Isi pesan
                </label>

                <textarea
                  id="wali-message"
                  value={draft}
                  maxLength={MAX_MESSAGE_LENGTH}
                  rows={5}
                  disabled={!canWrite || isSending}
                  onChange={(event) => {
                    setDraft(event.target.value);
                    setError("");
                    if (sendState === "success") {
                      setSendState("idle");
                    }
                  }}
                  placeholder={
                    canWrite
                      ? "Tulis pesan untuk anak Anda..."
                      : "Deposit terlebih dahulu untuk menulis pesan."
                  }
                  className="pesan-textarea block min-h-[132px] w-full resize-none rounded-[16px] border border-[#E2E9E3] bg-[#FBFCFB] px-[13px] py-[12px] text-[12px] leading-[1.8] text-[#24362A] outline-none placeholder:text-[#A4B0A6] disabled:cursor-not-allowed disabled:bg-[#F4F7F4] disabled:text-[#9EAAA0]"
                />

                <div className="mt-[7px] flex items-center justify-between gap-3">
                  <span className="text-[9px] text-[#95A297]">
                    Dibacakan oleh kasir
                  </span>

                  <span
                    className={`text-[9px] font-semibold ${
                      draft.length >= 230
                        ? "text-[#C17D31]"
                        : "text-[#95A297]"
                    }`}
                  >
                    Maks. 250
                  </span>
                </div>

                {error && (
                  <p
                    role="alert"
                    className="pesan-error mt-[10px] rounded-[11px] border border-[#FFD9D1] bg-[#FFF4F2] px-[10px] py-[8px] text-[10px] font-medium text-[#C15F4C]"
                  >
                    {error}
                  </p>
                )}
              </div>

              {/* ACTIONS */}
              {canWrite ? (
                <button
                  type="submit"
                  disabled={!draft.trim() || isSending}
                  className={`pesan-submit pesan-press mt-[13px] flex h-[46px] w-full items-center justify-center gap-[9px] rounded-[16px] border text-[12px] font-bold tracking-[0.01em] shadow-[3px_3px_0_#DCE8DE] transition-colors ${
                    sendState === "success"
                      ? "border-[#CFE7D6] bg-[#E9F7ED] text-[#105D38]"
                      : "border-[#163428] bg-[#1F5E3F] text-white hover:bg-[#174B32]"
                  } disabled:cursor-not-allowed disabled:border-[#D9E4DB] disabled:bg-[#C8D7CC] disabled:text-white disabled:shadow-none`}
                >
                  {sendState === "sending" ? (
                    <>
                      <Send
                        size={16}
                        strokeWidth={1.9}
                        className="pesan-plane"
                      />
                      Menyimpan...
                    </>
                  ) : sendState === "success" ? (
                    <>
                      <Check
                        size={17}
                        strokeWidth={2.4}
                        className="pesan-check"
                      />
                      Pesan Tersimpan
                    </>
                  ) : (
                    <>
                      <Send size={16} strokeWidth={1.8} />
                      Kirim Pesan
                    </>
                  )}
                </button>
              ) : (
                <Link
                  href="/wali/deposit"
                  className="pesan-press mt-[13px] flex h-[46px] w-full items-center justify-center gap-[8px] rounded-[16px] border border-[#163428] bg-[#1F5E3F] text-[12px] font-bold text-white shadow-[3px_3px_0_#DCE8DE]"
                >
                  <Wallet size={16} strokeWidth={1.8} />
                  Deposit Dulu
                  <ArrowRight size={15} />
                </Link>
              )}
            </form>
          </section>

          {/* =====================================
              HISTORY
          ===================================== */}

          <section className="pesan-enter-3 mt-[18px]">
            <div className="flex items-center justify-between">
              <h3 className="text-[15px] font-bold tracking-[-0.03em] text-[#17251D]">
                Riwayat Pesan
              </h3>

              <span className="rounded-[10px] border border-[#E0E9E2] bg-white px-[8px] py-[5px] text-[9px] font-semibold text-[#7A897E] shadow-[2px_2px_0_#E8EEE9]">
                {messages.length} pesan
              </span>
            </div>

            {sortedMessages.length === 0 ? (
              <div className="mt-[11px] rounded-[18px] border border-dashed border-[#D7E2D9] bg-white px-[16px] py-[24px] text-center shadow-[3px_3px_0_#E8EEE9]">
                <MessageSquareText
                  size={22}
                  strokeWidth={1.6}
                  className="mx-auto text-[#9CB0A0]"
                />
                <p className="mt-[8px] text-[11px] font-semibold text-[#617166]">
                  Belum ada pesan
                </p>
                <p className="mt-[4px] text-[10px] text-[#9BA89E]">
                  Pesan tersimpan akan muncul di sini.
                </p>
              </div>
            ) : (
              <div className="mt-[11px] space-y-[10px]">
                {sortedMessages.map((message, index) => {
                  const isNew = newMessageId === message.id;

                  return (
                    <article
                      key={message.id}
                      className={`rounded-[16px] border border-[#E0E9E2] bg-white px-[13px] py-[12px] shadow-[3px_3px_0_#E8EEE9] ${
                        isNew
                          ? "pesan-history-new"
                          : "pesan-history-enter"
                      }`}
                      style={{
                        animationDelay: isNew
                          ? "0ms"
                          : `${Math.min(index * 45, 220)}ms`,
                      }}
                    >
                      <div className="flex items-center justify-between gap-[8px]">
                        <time
                          dateTime={message.createdAt}
                          className="text-[9px] text-[#93A096]"
                        >
                          {formatDate(message.createdAt)}
                        </time>

                        <span className="inline-flex items-center gap-[4px] rounded-full bg-[#EAF7EE] px-[7px] py-[4px] text-[9px] font-semibold text-[#2A8855]">
                          <Check size={11} strokeWidth={2.1} />
                          Demo
                        </span>
                      </div>

                      <p className="mt-[9px] whitespace-pre-wrap break-words text-[11px] leading-[1.8] text-[#26382D]">
                        {message.text}
                      </p>
                    </article>
                  );
                })}
              </div>
            )}

            <div className="mt-[14px] flex items-start gap-[8px] rounded-[14px] border border-[#E2EAE4] bg-white px-[11px] py-[10px] shadow-[2px_2px_0_#E8EEE9]">
              <Info
                size={14}
                strokeWidth={1.8}
                className="mt-[2px] shrink-0 text-[#5B8B6A]"
              />
              <p className="text-[10px] leading-[1.65] text-[#839184]">
                Pesan tersimpan di browser untuk demo.
                Pengiriman ke kasir belum aktif.
              </p>
            </div>
          </section>

        </div>
      </div>

      {/* =====================================
          MOTION
      ===================================== */}
      <style jsx global>{`
        @keyframes pesanEnter {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .pesan-enter-1 {
          animation: pesanEnter 420ms cubic-bezier(0.22, 1, 0.36, 1) both;
        }

        .pesan-enter-2 {
          animation: pesanEnter 470ms cubic-bezier(0.22, 1, 0.36, 1) 70ms both;
        }

        .pesan-enter-3 {
          animation: pesanEnter 520ms cubic-bezier(0.22, 1, 0.36, 1) 130ms both;
        }

        .pesan-progress {
          transition: width 900ms cubic-bezier(0.22, 1, 0.36, 1);
        }

        .pesan-textarea {
          transition:
            border-color 180ms ease,
            box-shadow 180ms ease,
            background-color 180ms ease,
            transform 180ms ease;
        }

        .pesan-textarea:focus {
          border-color: #2d8a58;
          background-color: #ffffff;
          box-shadow: 0 0 0 3px rgba(45, 138, 88, 0.08);
        }

        .pesan-press {
          -webkit-tap-highlight-color: transparent;
          transition:
            transform 170ms ease,
            box-shadow 170ms ease,
            background-color 170ms ease;
        }

        .pesan-press:active:not(:disabled) {
          transform: scale(0.975);
        }

        @keyframes pesanPlane {
          0% {
            transform: translate(0, 0) rotate(0deg);
            opacity: 1;
          }
          55% {
            transform: translate(5px, -4px) rotate(-10deg);
            opacity: 0.88;
          }
          100% {
            transform: translate(11px, -9px) rotate(-10deg);
            opacity: 0;
          }
        }

        .pesan-plane {
          animation: pesanPlane 500ms ease-in-out infinite;
        }

        @keyframes pesanCheckPop {
          0% {
            opacity: 0;
            transform: scale(0.55) rotate(-18deg);
          }
          70% {
            opacity: 1;
            transform: scale(1.18) rotate(2deg);
          }
          100% {
            opacity: 1;
            transform: scale(1) rotate(0deg);
          }
        }

        .pesan-check {
          animation: pesanCheckPop 380ms cubic-bezier(0.22, 1, 0.36, 1) both;
        }

        @keyframes pesanHistoryIn {
          from {
            opacity: 0;
            transform: translateY(9px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .pesan-history-enter {
          animation: pesanHistoryIn 340ms ease both;
        }

        @keyframes pesanHistoryNew {
          from {
            opacity: 0;
            transform: translateY(-10px) scale(0.98);
            background: #ecf8f0;
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
            background: #ffffff;
          }
        }

        .pesan-history-new {
          animation: pesanHistoryNew 620ms cubic-bezier(0.22, 1, 0.36, 1) both;
        }

        @keyframes pesanErrorIn {
          from {
            opacity: 0;
            transform: translateY(4px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .pesan-error {
          animation: pesanErrorIn 240ms ease both;
        }

        @media (prefers-reduced-motion: reduce) {
          .pesan-enter-1,
          .pesan-enter-2,
          .pesan-enter-3,
          .pesan-plane,
          .pesan-check,
          .pesan-history-enter,
          .pesan-history-new,
          .pesan-error {
            animation: none !important;
          }

          .pesan-progress,
          .pesan-textarea,
          .pesan-press {
            transition: none !important;
          }

          .pesan-press:active {
            transform: none !important;
          }
        }
      `}</style>
    </main>
  );
}