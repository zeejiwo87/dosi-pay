
'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { Plus_Jakarta_Sans } from 'next/font/google';
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type MouseEvent,
  type ReactNode,
} from 'react';
import {
  ArrowLeftRight,
  Bell,
  ChartNoAxesCombined,
  ClipboardList,
  Coins,
  FileClock,
  Fingerprint,
  GraduationCap,
  House,
  Landmark,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageSquareText,
  Package,
  RefreshCw,
  Settings2,
  Users,
  Wallet,
  X,
  type LucideIcon,
} from 'lucide-react';

import { useManajemen } from './ManajemenProvider';

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  display: 'swap',
});

type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
};

type NavSection = {
  name: string;
  entries: NavItem[];
};

type BubbleRect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

const SECTIONS: NavSection[] = [
  {
    name: 'RINGKASAN',
    entries: [
      {
        href: '/manajemen',
        label: 'Dashboard',
        icon: LayoutDashboard,
      },
      {
        href: '/manajemen/keuangan',
        label: 'Keuangan',
        icon: Wallet,
      },
      {
        href: '/manajemen/transaksi',
        label: 'Transaksi',
        icon: ArrowLeftRight,
      },
      {
        href: '/manajemen/laporan',
        label: 'Laporan',
        icon: ChartNoAxesCombined,
      },
    ],
  },
  {
    name: 'OPERASIONAL',
    entries: [
      {
        href: '/manajemen/santri',
        label: 'Data Santri',
        icon: GraduationCap,
      },
      {
        href: '/manajemen/pengguna',
        label: 'Pengguna & Akses',
        icon: Users,
      },
      {
        href: '/manajemen/koperasi',
        label: 'Koperasi & Produk',
        icon: Package,
      },
      {
        href: '/manajemen/penarikan',
        label: 'Penarikan',
        icon: Landmark,
      },
      {
        href: '/manajemen/biometrik',
        label: 'Biometrik',
        icon: Fingerprint,
      },
      {
        href: '/manajemen/spp',
        label: 'SPP & Cicilan',
        icon: Coins,
      },
    ],
  },
  {
    name: 'KOMUNIKASI & SISTEM',
    entries: [
      {
        href: '/manajemen/pengumuman',
        label: 'Pengumuman',
        icon: Bell,
      },
      {
        href: '/manajemen/pesan',
        label: 'Pesan Wali',
        icon: MessageSquareText,
      },
      {
        href: '/manajemen/audit',
        label: 'Audit Aktivitas',
        icon: FileClock,
      },
      {
        href: '/manajemen/pengaturan',
        label: 'Pengaturan',
        icon: Settings2,
      },
    ],
  },
];

const BOTTOM_NAV: NavItem[] = [
  {
    href: '/manajemen',
    label: 'Beranda',
    icon: House,
  },
  {
    href: '/manajemen/santri',
    label: 'Santri',
    icon: GraduationCap,
  },
  {
    href: '/manajemen/keuangan',
    label: 'Keuangan',
    icon: Wallet,
  },
  {
    href: '/manajemen/pengumuman',
    label: 'Info',
    icon: Bell,
  },
  {
    href: '#menu',
    label: 'Menu',
    icon: Menu,
  },
];

function isActive(href: string, pathname: string) {
  if (href === '/manajemen') {
    return pathname === '/manajemen';
  }

  if (href === '#menu') {
    return false;
  }

  return (
    pathname === href ||
    pathname.startsWith(`${href}/`)
  );
}

function Brand({
  small = false,
  onClick,
}: {
  small?: boolean;
  onClick?: () => void;
}) {
  return (
    <Link
      href="/manajemen"
      onClick={onClick}
      aria-label="DOSI PAY - Dashboard"
      className="inline-flex min-w-0 items-center gap-2.5 rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-[#D5A52D]"
    >
      <Image
        src="/DOSIPAY.png"
        alt=""
        width={48}
        height={48}
        priority
        className={`shrink-0 object-contain ${
          small
            ? 'h-[38px] w-[38px]'
            : 'h-[46px] w-[46px]'
        }`}
      />

      <span
        className={`whitespace-nowrap font-extrabold leading-none text-[#105D38] ${
          small
            ? 'text-[17px] tracking-[-0.6px]'
            : 'text-[20px] tracking-[-0.8px]'
        }`}
      >
        DOSI <span className="text-[#D5A52D]">PAY</span>
      </span>
    </Link>
  );
}

function LogoutLink({
  onClick,
}: {
  onClick?: () => void;
}) {
  return (
    <Link
      href="/pilih-login"
      onClick={onClick}
      className="flex h-10 items-center gap-3 rounded-[12px] px-3 text-[12.5px] font-semibold text-[#77877C] transition-colors duration-150 hover:bg-[#F3F7F4] hover:text-[#105D38] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#D5A52D]"
    >
      <LogOut size={18} strokeWidth={1.9} />
      Logout
    </Link>
  );
}

function AnimatedNav({
  pathname,
  sections,
  items,
  bottom = false,
  menuOpen = false,
  onNavigate,
  onMenu,
}: {
  pathname: string;
  sections?: NavSection[];
  items?: NavItem[];
  bottom?: boolean;
  menuOpen?: boolean;
  onNavigate?: () => void;
  onMenu?: () => void;
}) {
  const navRef = useRef<HTMLElement>(null);
  const [pendingHref, setPendingHref] = useState<string | null>(null);
  const [bubble, setBubble] = useState<BubbleRect | null>(null);

  const allItems = items ?? sections?.flatMap(
    (section) => section.entries
  ) ?? [];

  const routeHref =
    allItems.find((item) =>
      isActive(item.href, pathname)
    )?.href ?? (bottom ? '#menu' : null);

  const activeHref =
    bottom && menuOpen
      ? '#menu'
      : pendingHref ?? routeHref;

  const positionTo = useCallback(
    (element: HTMLElement | null) => {
      const nav = navRef.current;

      if (!nav || !element) {
        setBubble(null);
        return;
      }

      const parent = nav.getBoundingClientRect();
      const target = element.getBoundingClientRect();

      const next = {
        x: target.left - parent.left,
        y: target.top - parent.top,
        width: target.width,
        height: target.height,
      };

      setBubble((previous) =>
        previous &&
        Math.abs(previous.x - next.x) < 0.5 &&
        Math.abs(previous.y - next.y) < 0.5 &&
        Math.abs(previous.width - next.width) < 0.5 &&
        Math.abs(previous.height - next.height) < 0.5
          ? previous
          : next
      );
    },
    []
  );

  const alignToActive = useCallback(() => {
    const nav = navRef.current;

    if (!nav || !activeHref) {
      setBubble(null);
      return;
    }

    const target = Array.from(
      nav.querySelectorAll<HTMLElement>('[data-nav-href]')
    ).find(
      (element) => element.dataset.navHref === activeHref
    );

    positionTo(target ?? null);
  }, [activeHref, positionTo]);

  useEffect(() => {
    setPendingHref(null);
  }, [pathname]);

  useLayoutEffect(() => {
    alignToActive();
  }, [alignToActive]);

  useEffect(() => {
    const element = navRef.current;
    if (!element) return;

    const observer =
      typeof ResizeObserver !== 'undefined'
        ? new ResizeObserver(alignToActive)
        : null;

    observer?.observe(element);
    window.addEventListener('resize', alignToActive);

    return () => {
      observer?.disconnect();
      window.removeEventListener('resize', alignToActive);
    };
  }, [alignToActive]);

  function handleNavigate(
    event: MouseEvent<HTMLAnchorElement>,
    href: string
  ) {
    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    ) {
      return;
    }

    // Bubble langsung bergerak ketika menu diklik.
    setPendingHref(href);
    positionTo(event.currentTarget);
    onNavigate?.();
  }

  function renderItem(item: NavItem) {
    const Icon = item.icon;
    const active = activeHref === item.href;

    const className = bottom
      ? `relative z-10 flex h-[58px] min-w-0 flex-col items-center justify-center gap-1 rounded-[12px] px-1 transition-colors duration-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#D5A52D] ${
          active
            ? `text-[#E0B341] ${
                !bubble ? 'bg-[#105D38]' : ''
              }`
            : 'text-[#819086] hover:text-[#105D38]'
        }`
      : `mg-side-link relative z-10 flex min-w-0 items-center gap-3 rounded-[12px] px-3 text-[12.5px] font-semibold transition-colors duration-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#D5A52D] ${
          active
            ? `text-[#E0B341] ${
                !bubble ? 'bg-[#105D38]' : ''
              }`
            : 'text-[#65776B] hover:bg-[#F3F7F4] hover:text-[#105D38]'
        }`;

    const content = (
      <>
        <Icon
          size={bottom ? 19 : 18}
          strokeWidth={active ? 2.25 : 1.9}
          className="shrink-0"
          aria-hidden="true"
        />

        <span
          className={
            bottom
              ? 'max-w-full truncate text-[9px] font-semibold'
              : 'min-w-0 flex-1 truncate'
          }
        >
          {item.label}
        </span>

        {!bottom && active && (
          <span
            className="ml-auto h-[6px] w-[6px] shrink-0 rounded-full bg-[#E0B341]"
            aria-hidden="true"
          />
        )}
      </>
    );

    if (item.href === '#menu') {
      return (
        <button
          key={item.href}
          type="button"
          data-nav-href={item.href}
          aria-label="Buka menu lainnya"
          aria-expanded={menuOpen}
          onClick={(event) => {
            setPendingHref('#menu');
            positionTo(event.currentTarget);
            onMenu?.();
          }}
          className={className}
        >
          {content}
        </button>
      );
    }

    return (
      <Link
        key={item.href}
        href={item.href}
        data-nav-href={item.href}
        aria-current={
          isActive(item.href, pathname)
            ? 'page'
            : undefined
        }
        onClick={(event) =>
          handleNavigate(event, item.href)
        }
        className={className}
      >
        {content}
      </Link>
    );
  }

  return (
    <nav
      ref={navRef}
      aria-label={
        bottom
          ? 'Navigasi cepat manajemen'
          : 'Navigasi manajemen'
      }
      className={
        bottom
          ? 'relative isolate grid h-[62px] grid-cols-5 gap-1'
          : 'relative isolate'
      }
    >
      {bubble && (
        <span
          aria-hidden="true"
          className="mg-nav-bubble pointer-events-none absolute left-0 top-0 z-0 overflow-hidden rounded-[12px] bg-[#105D38]"
          style={{
            width: bubble.width,
            height: bubble.height,
            transform: `translate3d(${bubble.x}px, ${bubble.y}px, 0)`,
          }}
        >
          <span
            key={activeHref ?? 'none'}
            className="mg-liquid-pulse block h-full w-full rounded-[12px] bg-[#105D38]"
          />
        </span>
      )}

      {sections ? (
        sections.map((section) => (
          <div
            key={section.name}
            className="mg-nav-group"
          >
            <p className="mg-group-label flex h-[20px] items-center px-3 text-[9px] font-bold tracking-[0.11em] text-[#94A398]">
              {section.name}
            </p>

            <div className="mg-nav-list flex flex-col gap-[2px]">
              {section.entries.map(renderItem)}
            </div>
          </div>
        ))
      ) : (
        items?.map(renderItem)
      )}
    </nav>
  );
}

export function ManajemenShell({
  children,
}: {
  children: ReactNode;
}) {
  const pathname = usePathname();
  const { refresh } = useManajemen();

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [date, setDate] = useState('');

  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    setDrawerOpen(false);
  }, [pathname]);

  useEffect(() => {
    setDate(
      new Intl.DateTimeFormat('id-ID', {
        timeZone: 'Asia/Jakarta',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }).format(new Date())
    );
  }, []);

  useEffect(() => {
    if (!drawerOpen) return;

    const previousOverflow = document.body.style.overflow;
    const previousFocus =
      document.activeElement as HTMLElement | null;

    document.body.style.overflow = 'hidden';
    closeRef.current?.focus();

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setDrawerOpen(false);
      }
    };

    window.addEventListener('keydown', handleEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleEscape);
      previousFocus?.focus();
    };
  }, [drawerOpen]);

  const currentPage =
    SECTIONS.flatMap((section) => section.entries)
      .find((item) =>
        isActive(item.href, pathname)
      )?.label ?? 'Manajemen';

  return (
    <div
      className={`${jakarta.className} min-h-[100dvh] bg-white text-[#142019] antialiased`}
    >
      <div className="mx-auto flex min-h-[100dvh] max-w-[1800px]">

        {/* DESKTOP SIDEBAR */}
        <aside className="mg-desktop-sidebar sticky top-0 hidden h-[100dvh] w-[244px] shrink-0 flex-col overflow-hidden border-r border-[#E6ECE7] bg-white px-4 pb-4 pt-5 lg:flex xl:w-[254px]">
          <div className="shrink-0 px-2">
            <Brand />
          </div>

          <div className="mg-desktop-menu min-h-0 flex-1 overflow-hidden pt-5">
            <AnimatedNav
              pathname={pathname}
              sections={SECTIONS}
            />
          </div>

          <div className="shrink-0 border-t border-[#E6ECE7] pt-2.5">
            <LogoutLink />
          </div>
        </aside>

        {/* CONTENT */}
        <div className="flex min-h-[100dvh] min-w-0 flex-1 flex-col">

          {/* HEADER */}
          <header className="sticky top-0 z-40 border-b border-[#E6ECE7] bg-white pt-[env(safe-area-inset-top)]">
            <div className="mx-auto flex h-[60px] max-w-[1480px] items-center justify-between gap-3 px-4 sm:px-6 lg:h-[66px] lg:px-8">

              {/* MOBILE BRAND */}
              <div className="flex min-w-0 items-center gap-3 lg:hidden">
                <button
                  type="button"
                  onClick={() => setDrawerOpen(true)}
                  aria-label="Buka menu"
                  aria-expanded={drawerOpen}
                  aria-controls="manajemen-mobile-drawer"
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[11px] border border-[#E6ECE7] text-[#105D38] transition-colors hover:bg-[#F3F7F4]"
                >
                  <Menu size={20} />
                </button>

                <Brand small />
              </div>

              {/* DESKTOP HEADER */}
              <div className="hidden min-w-0 items-center gap-3 lg:flex">
                <span className="text-[13px] font-semibold text-[#34473B]">
                  {currentPage}
                </span>

                <span className="h-1 w-1 rounded-full bg-[#D5A52D]" />

                <span className="text-[12px] text-[#829187]">
                  {date}
                </span>
              </div>

              {/* REFRESH */}
              <button
                type="button"
                onClick={refresh}
                aria-label="Perbarui data"
                title="Perbarui data"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] border border-[#E6ECE7] bg-white text-[#105D38] transition-[background-color,transform] duration-150 hover:bg-[#ECF7EF] active:rotate-45 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#D5A52D]"
              >
                <RefreshCw
                  size={18}
                  strokeWidth={1.8}
                />
              </button>
            </div>
          </header>

          {/* PAGE */}
          <main className="mg-content mx-auto w-full max-w-[1480px] min-w-0 flex-1 px-4 pb-[calc(95px+env(safe-area-inset-bottom))] pt-5 sm:px-6 sm:pt-7 lg:px-8 lg:pb-10 lg:pt-8">
            <div
              key={pathname}
              className="mg-page"
            >
              {children}
            </div>
          </main>
        </div>
      </div>

      {/* MOBILE BOTTOM NAVIGATION */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-[#E6ECE7] bg-white px-2 pb-[env(safe-area-inset-bottom)] pt-1.5 lg:hidden">
        <div className="mx-auto max-w-[600px]">
          <AnimatedNav
            pathname={pathname}
            items={BOTTOM_NAV}
            bottom
            menuOpen={drawerOpen}
            onMenu={() => setDrawerOpen(true)}
          />
        </div>
      </div>

      {/* MOBILE DRAWER */}
      {drawerOpen && (
        <div
          id="manajemen-mobile-drawer"
          className="fixed inset-0 z-[90] lg:hidden"
        >
          <button
            type="button"
            aria-label="Tutup menu"
            onClick={() => setDrawerOpen(false)}
            className="mg-scrim absolute inset-0 bg-[#10271A]/50"
          />

          <aside
            role="dialog"
            aria-modal="true"
            aria-label="Menu manajemen"
            className="mg-drawer absolute inset-y-0 left-0 flex w-[min(320px,88vw)] flex-col bg-white px-4 pb-[env(safe-area-inset-bottom)]"
          >
            <div className="flex h-[70px] shrink-0 items-center justify-between gap-2 border-b border-[#E6ECE7]">
              <Brand
                small
                onClick={() => setDrawerOpen(false)}
              />

              <button
                ref={closeRef}
                type="button"
                onClick={() => setDrawerOpen(false)}
                aria-label="Tutup menu"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-[#F3F7F4] text-[#105D38]"
              >
                <X size={19} />
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto py-4">
              <AnimatedNav
                pathname={pathname}
                sections={SECTIONS}
                onNavigate={() => setDrawerOpen(false)}
              />
            </div>

            <div className="shrink-0 border-t border-[#E6ECE7] py-3">
              <LogoutLink
                onClick={() => setDrawerOpen(false)}
              />
            </div>
          </aside>
        </div>
      )}

      {/* ANIMATIONS & RESPONSIVE */}
      <style jsx global>{`
        .mg-nav-bubble {
          transition:
            transform 180ms cubic-bezier(.2, .9, .25, 1.06),
            width 180ms ease-out,
            height 180ms ease-out;
          will-change: transform;
        }

        @keyframes mgLiquid {
          0% {
            transform: scaleX(.96) scaleY(1.04);
            border-radius: 15px 10px;
          }
          55% {
            transform: scaleX(1.025) scaleY(.98);
            border-radius: 10px 15px;
          }
          100% {
            transform: scale(1);
            border-radius: 12px;
          }
        }

        .mg-liquid-pulse {
          animation: mgLiquid 180ms ease-out both;
        }

        @keyframes mgPageIn {
          from {
            opacity: .65;
            transform: translateY(5px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .mg-page {
          animation: mgPageIn 160ms ease-out both;
        }

        @keyframes mgDrawerIn {
          from {
            transform: translateX(-100%);
          }
          to {
            transform: translateX(0);
          }
        }

        @keyframes mgFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        .mg-drawer {
          animation: mgDrawerIn 210ms ease-out both;
        }

        .mg-scrim {
          animation: mgFadeIn 150ms ease-out both;
        }

        /* Desktop sidebar */
        @media (min-width: 1024px) {
          .mg-side-link {
            height: 36px;
          }

          .mg-nav-group + .mg-nav-group {
            margin-top: 12px;
          }
        }

        /* Laptop dengan layar lebih pendek */
        @media (min-width: 1024px) and (max-height: 760px) {
          .mg-desktop-sidebar {
            padding-top: 14px;
            padding-bottom: 12px;
          }

          .mg-desktop-menu {
            padding-top: 14px;
          }

          .mg-side-link {
            height: 31px;
          }

          .mg-group-label {
            height: 18px;
          }

          .mg-nav-group + .mg-nav-group {
            margin-top: 9px;
          }
        }

        @media (min-width: 1024px) and (max-height: 650px) {
          .mg-desktop-menu {
            padding-top: 8px;
          }

          .mg-side-link {
            height: 28px;
          }

          .mg-group-label {
            height: 16px;
          }

          .mg-nav-group + .mg-nav-group {
            margin-top: 6px;
          }
        }

        @media (min-width: 1024px) and (max-height: 550px) {
          .mg-group-label {
            display: none;
          }

          .mg-side-link {
            height: 26px;
          }
        }

        @media (min-width: 1024px) and (max-height: 500px) {
          .mg-desktop-sidebar {
            padding-top: 8px;
            padding-bottom: 8px;
          }

          .mg-desktop-sidebar img {
            width: 34px;
            height: 34px;
          }

          .mg-desktop-menu {
            padding-top: 4px;
          }

          .mg-side-link {
            height: 23px;
          }
        }

        /* Akses navigasi pada viewport sangat pendek */
        @media (min-width: 1024px) and (max-height: 450px) {
          .mg-desktop-menu {
            overflow-y: auto;
          }
        }

        /* Mobile drawer */
        @media (max-width: 1023px) {
          .mg-drawer .mg-nav-group + .mg-nav-group {
            margin-top: 18px;
          }

          .mg-drawer .mg-side-link {
            height: 42px;
          }

          .mg-drawer .mg-group-label {
            margin-bottom: 5px;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .mg-nav-bubble {
            transition: none !important;
          }

          .mg-liquid-pulse,
          .mg-page,
          .mg-drawer,
          .mg-scrim {
            animation: none !important;
          }
        }
      `}</style>
    </div>
  );
}
