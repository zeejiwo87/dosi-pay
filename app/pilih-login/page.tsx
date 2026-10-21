"use client";

import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from "react";

import { useRouter } from "next/navigation";

import Image from "next/image";

import { Building2, Check, ChevronDown, Eye, EyeOff, ShoppingBag, UsersRound } from "lucide-react";

type Role = "wali" | "kasir" | "manajemen";

const demoAccounts = {

  wali: {

    identity: "Ahmad Fauzan",

    secret: "20260001",

  },

  kasir: {

    identity: "kasir_demo",

    secret: "KasirDemo123!",

  },

  manajemen: {

    identity: "admin_demo",

    secret: "AdminDemo123!",

  },

};

const ROLE_OPTIONS = [

  { value: "wali", label: "Wali Santri", icon: UsersRound },

  { value: "kasir", label: "Kasir Koperasi", icon: ShoppingBag },

  { value: "manajemen", label: "Manajemen Pesantren", icon: Building2 },

] as const;

function RoleDropdown({

  value,

  onChange,

  disabled,

}: {

  value: Role;

  onChange: (value: Role) => void;

  disabled: boolean;

}) {

  const [open, setOpen] = useState(false);

  const [highlighted, setHighlighted] = useState(0);

  const rootRef = useRef<HTMLDivElement>(null);

  const triggerRef = useRef<HTMLButtonElement>(null);

  const listRef = useRef<HTMLDivElement>(null);

  const selectedIndex = ROLE_OPTIONS.findIndex((option) => option.value === value);

  const selected = ROLE_OPTIONS[selectedIndex];

  const SelectedIcon = selected.icon;

  useEffect(() => {

    if (!open) return;

    const frame = requestAnimationFrame(() => listRef.current?.focus());

    const closeOnOutsideClick = (event: PointerEvent) => {

      if (event.target instanceof Node && !rootRef.current?.contains(event.target)) {

        setOpen(false);

      }

    };

    document.addEventListener("pointerdown", closeOnOutsideClick);

    return () => {

      cancelAnimationFrame(frame);

      document.removeEventListener("pointerdown", closeOnOutsideClick);

    };

  }, [open]);

  const choose = (nextValue: Role) => {

    onChange(nextValue);

    setOpen(false);

    triggerRef.current?.focus();

  };

  const toggle = () => {

    if (disabled) return;

    if (open) setOpen(false);

    else {

      setHighlighted(selectedIndex);

      setOpen(true);

    }

  };

  const handleTriggerKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {

    if (event.key === "ArrowDown" || event.key === "ArrowUp") {

      event.preventDefault();

      setHighlighted(event.key === "ArrowDown" ? selectedIndex : Math.max(0, selectedIndex - 1));

      setOpen(true);

    }

  };

  const handleListKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {

    switch (event.key) {

      case "ArrowDown":

        event.preventDefault();

        setHighlighted((index) => (index + 1) % ROLE_OPTIONS.length);

        break;

      case "ArrowUp":

        event.preventDefault();

        setHighlighted((index) => (index - 1 + ROLE_OPTIONS.length) % ROLE_OPTIONS.length);

        break;

      case "Home":

        event.preventDefault();

        setHighlighted(0);

        break;

      case "End":

        event.preventDefault();

        setHighlighted(ROLE_OPTIONS.length - 1);

        break;

      case "Enter":

      case " ":

        event.preventDefault();

        choose(ROLE_OPTIONS[highlighted].value);

        break;

      case "Escape":

        event.preventDefault();

        setOpen(false);

        triggerRef.current?.focus();

        break;

      case "Tab":

        setOpen(false);

        break;

    }

  };

  return (

    <div ref={rootRef} className="relative">

      <button

        ref={triggerRef}

        id="login-role"

        type="button"

        disabled={disabled}

        aria-haspopup="listbox"

        aria-expanded={open}

        aria-controls="login-role-options"

        onClick={toggle}

        onKeyDown={handleTriggerKeyDown}

        className={`flex h-[52px] w-full items-center gap-3 rounded-[14px] border bg-white px-3.5 text-left transition-[border-color,box-shadow] duration-150 focus:outline-none focus:ring-2 focus:ring-[#105D38]/10 disabled:cursor-not-allowed disabled:opacity-60 ${

          open ? "border-[#105D38] ring-2 ring-[#105D38]/10" : "border-[#DEE7E1] hover:border-[#B9D3C2] focus:border-[#105D38]"

        }`}

      >

        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] bg-[#ECF7EF] text-[#105D38]">

          <SelectedIcon size={17} strokeWidth={1.85} />

        </span>

        <span className="min-w-0 flex-1 truncate text-[15px] font-semibold text-[#263B2F]">

          {selected.label}

        </span>

        <ChevronDown

          size={18}

          strokeWidth={1.8}

          aria-hidden="true"

          className={`shrink-0 text-[#7E9184] transition-transform duration-200 ${open ? "rotate-180" : ""}`}

        />

      </button>

      {open && (

        <div

          ref={listRef}

          id="login-role-options"

          role="listbox"

          aria-label="Login sebagai"

          aria-activedescendant={`login-role-option-${highlighted}`}

          tabIndex={-1}

          onKeyDown={handleListKeyDown}

          className="absolute inset-x-0 top-[calc(100%+8px)] z-50 max-h-[250px] overflow-y-auto rounded-[16px] border border-[#E2EAE4] bg-white p-1.5 shadow-[0_16px_40px_-16px_rgba(12,61,38,0.3)] outline-none"

        >

          {ROLE_OPTIONS.map((option, index) => {

            const Icon = option.icon;

            const active = index === highlighted;

            const chosen = option.value === value;

            return (

              <button

                key={option.value}

                id={`login-role-option-${index}`}

                type="button"

                role="option"

                aria-selected={chosen}

                tabIndex={-1}

                onMouseEnter={() => setHighlighted(index)}

                onClick={() => choose(option.value)}

                className={`flex min-h-[48px] w-full items-center gap-3 rounded-[11px] px-3 text-left transition-colors duration-100 ${

                  active || chosen

                    ? "bg-[#EDF7F0] text-[#105D38]"

                    : "text-[#405649] hover:bg-[#F6F9F6]"

                }`}

              >

                <Icon size={18} strokeWidth={1.8} aria-hidden="true" className="shrink-0" />

                <span className="min-w-0 flex-1 text-[14px] font-semibold">{option.label}</span>

                {chosen && <Check size={17} strokeWidth={2.3} aria-hidden="true" className="shrink-0 text-[#105D38]" />}

              </button>

            );

          })}

        </div>

      )}

    </div>

  );

}

export default function PilihLoginPage() {

  const router = useRouter();

  const [role, setRole] = useState<Role>("wali");

  const [identity, setIdentity] = useState("");

  const [secret, setSecret] = useState("");

  const [showPassword, setShowPassword] = useState(false);

  const [error, setError] = useState("");

  const [success, setSuccess] = useState(false);

  const [loading, setLoading] = useState(false);

  const isWali = role === "wali";

  // Ganti jenis pengguna

  const changeRole = (value: Role) => {

    setRole(value);

    setIdentity("");

    setSecret("");

    setShowPassword(false);

    setError("");

    setSuccess(false);

  };

  // Proses login

  const handleLogin = (e: FormEvent<HTMLFormElement>) => {

    e.preventDefault();

    if (loading) return;

    setError("");

    setSuccess(false);

    // Validasi input kosong

    if (!identity.trim() || !secret.trim()) {

      setError("Mohon lengkapi semua kolom.");

      return;

    }

    // Validasi akun demo

    const account = demoAccounts[role];

    const valid =

      identity.trim().toLowerCase() ===

        account.identity.toLowerCase() &&

      secret === account.secret;

    if (!valid) {

      setError(

        isWali

          ? "Nama santri atau NIS tidak sesuai."

          : "Username atau password tidak sesuai."

      );

      return;

    }

    // Login berhasil

    setLoading(true);

    setSuccess(true);

    if (role === "wali") {

      // Arahkan ke Beranda Wali Santri

      router.replace("/wali/beranda");

      return;

    }

    // Arahkan role kasir ke dashboard kasir demo.

    if (role === "kasir") {

      router.replace("/kasir");

      return;

    }

    // Arahkan manajemen ke dashboard pondok demo.

    router.replace("/manajemen");

  };

  return (

    <main className="dosi-login-fade flex min-h-screen min-h-[100dvh] w-full flex-col bg-white text-[#1F2933] md:flex-row md:items-stretch">

      {/* =====================================

          HERO IMAGE — FULL WIDTH

      ===================================== */}

      <section

        className="relative h-[36dvh] min-h-[240px] max-h-[440px] w-full shrink-0 overflow-hidden bg-[#E9F1EC] sm:h-[40dvh] md:sticky md:top-0 md:h-[100dvh] md:min-h-[100dvh] md:max-h-none md:w-1/2 lg:w-[54%]"

        style={{ position: "relative" }}

      >

        <Image

          src="/herologin.png"

          alt="Ilustrasi login DOSI Pay"

          width={1600}

          height={720}

          priority

          sizes="(min-width: 1024px) 54vw, (min-width: 768px) 50vw, 100vw"

          className="absolute inset-0 h-full w-full object-cover object-center"

          style={{ position: "absolute" }}

        />

      </section>

      {/* =====================================

          LOGIN CONTENT

      ===================================== */}

      <section className="flex w-full min-w-0 flex-1 flex-col items-center bg-white px-6 pb-10 pt-8 sm:px-8 sm:pt-10 md:w-1/2 md:justify-center md:px-7 md:py-10 lg:w-[46%] lg:px-10 xl:px-16">

        <div className="flex w-full max-w-[400px] flex-col">

          {/* HEADER */}

          <header className="text-center">

            <h1 className="text-[32px] font-bold leading-tight tracking-[-1.2px] text-[#205B3D]">

              Login

            </h1>

            <p className="mt-2 text-[13px] font-normal text-[#8B9790]">

              Selamat datang di DOSI Pay

            </p>

          </header>

          {/* =====================================

              FORM LOGIN

          ===================================== */}

          <form

            onSubmit={handleLogin}

            noValidate

            className="mt-9 flex flex-col gap-4"

          >

            {/* PILIH ROLE */}

            <div>

              <label

                htmlFor="login-role"

                className="mb-2 block text-[13px] font-medium text-[#56675D]"

              >

                Login sebagai

              </label>

              <RoleDropdown value={role} onChange={changeRole} disabled={loading} />

            </div>

            {/* NAMA SANTRI / USERNAME */}

            <div>

              <label

                htmlFor="login-identity"

                className="sr-only"

              >

                {isWali ? "Nama Santri" : "Username"}

              </label>

              <input

                id="login-identity"

                type="text"

                autoComplete={isWali ? "off" : "username"}

                spellCheck={false}

                required

                disabled={loading}

                value={identity}

                onChange={(e) => {

                  setIdentity(e.target.value);

                  setError("");

                  setSuccess(false);

                }}

                placeholder={

                  isWali

                    ? "Nama lengkap santri"

                    : "Username"

                }

                className="h-[52px] w-full rounded-[14px] border border-[#DEE7E1] bg-white px-4 text-[16px] text-[#263B2F] outline-none transition-colors placeholder:text-[#9CAAA0] focus:border-[#236C47] focus:ring-2 focus:ring-[#236C47]/10"

              />

            </div>

            {/* NIS / PASSWORD */}

            <div className="relative">

              <label

                htmlFor="login-secret"

                className="sr-only"

              >

                {isWali

                  ? "NIS (Nomor Induk Santri)"

                  : "Password"}

              </label>

              <input

                id="login-secret"

                type={

                  isWali

                    ? "text"

                    : showPassword

                      ? "text"

                      : "password"

                }

                inputMode={isWali ? "numeric" : undefined}

                autoComplete={

                  isWali ? "off" : "current-password"

                }

                required

                disabled={loading}

                value={secret}

                onChange={(e) => {

                  setSecret(e.target.value);

                  setError("");

                  setSuccess(false);

                }}

                placeholder={

                  isWali

                    ? "NIS (Nomor Induk Santri)"

                    : "Password"

                }

                className="h-[52px] w-full rounded-[14px] border border-[#DEE7E1] bg-white px-4 pr-12 text-[16px] text-[#263B2F] outline-none transition-colors placeholder:text-[#9CAAA0] focus:border-[#236C47] focus:ring-2 focus:ring-[#236C47]/10"

              />

              {!isWali && (

                <button

                  type="button"

                  onClick={() =>

                    setShowPassword((prev) => !prev)

                  }

                  aria-label={

                    showPassword

                      ? "Sembunyikan password"

                      : "Tampilkan password"

                  }

                  className="absolute right-4 top-1/2 -translate-y-1/2 rounded p-1 text-[#8B9990] transition-colors hover:text-[#236C47] focus-visible:outline-2 focus-visible:outline-[#236C47]"

                >

                  {showPassword ? (

                    <EyeOff size={19} strokeWidth={1.7} />

                  ) : (

                    <Eye size={19} strokeWidth={1.7} />

                  )}

                </button>

              )}

            </div>

            {/* ERROR */}

            {error && (

              <p

                role="alert"

                className="text-[12px] leading-5 text-red-500"

              >

                {error}

              </p>

            )}

            {/* SUCCESS */}

            {success && role !== "wali" && (

              <p

                role="status"

                className="text-[12px] leading-5 text-[#236C47]"

              >

                Login demo berhasil.

                Dashboard akan tersedia pada tahap berikutnya.

              </p>

            )}

            {/* TOMBOL LOGIN */}

            <button

              type="submit"

              disabled={loading}

              className="mt-2 flex h-[52px] w-full items-center justify-center gap-2 rounded-[14px] bg-[#205B3D] text-[14px] font-semibold text-white transition-colors duration-200 hover:bg-[#17492F] active:bg-[#123B26] disabled:cursor-not-allowed disabled:opacity-75 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#205B3D]"

            >

              {loading ? (

                <>

                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />

                  Memproses...

                </>

              ) : (

                "Masuk"

              )}

            </button>

          </form>

          {/* FOOTER */}

          <footer className="mt-14 pb-2 text-center">

            <p className="text-[11px] text-[#A6B1A9]">

              © 2026 DOSI Pay

            </p>

          </footer>

        </div>

      </section>

      {/* Fade-in singkat setelah splash. */}
      <style jsx global>{`
        @keyframes dosiLoginFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        .dosi-login-fade {
          animation: dosiLoginFadeIn 320ms ease-out both;
        }

        @media (prefers-reduced-motion: reduce) {
          .dosi-login-fade { animation: none; }
        }
      `}</style>
    </main>

  );

}
