
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
  ChartNoAxesColumn,
  ClipboardList,
  History,
  House,
  LogOut,
  Menu,
  MessageSquareText,
  Package,
  Settings2,
  ShoppingCart,
  UsersRound,
  Wallet,
  X,
} from 'lucide-react';

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  display: 'swap',
});

const NAV = [
  { href: '/kasir', label: 'Beranda', icon: House },
  { href: '/kasir/transaksi', label: 'Transaksi', icon: ShoppingCart },
  { href: '/kasir/produk', label: 'Produk', icon: Package },
  { href: '/kasir/riwayat', label: 'Riwayat', icon: History },
  { href: '/kasir/santri', label: 'Santri', icon: UsersRound },
  { href: '/kasir/saldo', label: 'Saldo & kliring', icon: Wallet },
  { href: '/kasir/penarikan', label: 'Penarikan', icon: ClipboardList },
  { href: '/kasir/laporan', label: 'Laporan', icon: ChartNoAxesColumn },
  { href: '/kasir/pesan', label: 'Pesan wali', icon: MessageSquareText },
  { href: '/kasir/pengaturan', label: 'Pengaturan', icon: Settings2 },
] as const;

const BOTTOM_NAV = [NAV[0], NAV[1], NAV[2], NAV[3], NAV[5]];

type NavItem = (typeof NAV)[number];

type BubbleRect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

function itemActive(href: string, pathname: string) {
  return href === '/kasir'
    ? pathname === '/kasir'
    : pathname === href || pathname.startsWith(`${href}/`);
}

function matchedHref(
  items: readonly NavItem[],
  pathname: string
) {
  return (
    items.find((item) => itemActive(item.href, pathname))
      ?.href ?? null
  );
}

/* LOGO + DOSI PAY */

function Brand({
  onClick,
  small = false,
}: {
  onClick?: () => void;
  small?: boolean;
}) {
  return (
    <Link
      href="/kasir"
      onClick={onClick}
      aria-label="DOSI PAY - Beranda"
      className="inline-flex min-w-0 items-center gap-2.5 rounded-lg focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#D5A52D]"
    >
      <Image
        src="/DOSIPAY.png"
        alt=""
        width={48}
        height={48}
        priority
        className={`shrink-0 object-contain ${
          small ? 'h-[38px] w-[38px]' : 'h-[46px] w-[46px]'
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

/* ANIMATED NAVIGATION */

function AnimatedNav({
  items,
  pathname,
  bottom = false,
  onNavigate,
}: {
  items: readonly NavItem[];
  pathname: string;
  bottom?: boolean;
  onNavigate?: () => void;
}) {
  const navRef = useRef<HTMLElement>(null);
  const [pendingHref, setPendingHref] = useState<string | null>(null);
  const [bubble, setBubble] = useState<BubbleRect | null>(null);

  const activeHref = pendingHref ?? matchedHref(items, pathname);

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

    const element = Array.from(
      nav.querySelectorAll<HTMLElement>('[data-nav-href]')
    ).find((node) => node.dataset.navHref === activeHref);

    positionTo(element ?? null);
  }, [activeHref, positionTo]);

  useEffect(() => {
    setPendingHref(null);
  }, [pathname]);

  useLayoutEffect(() => {
    alignToActive();
  }, [alignToActive]);

  useEffect(() => {
    const node = navRef.current;
    if (!node) return;

    const resize =
      typeof ResizeObserver !== 'undefined'
        ? new ResizeObserver(alignToActive)
        : null;

    resize?.observe(node);
    window.addEventListener('resize', alignToActive);

    return () => {
      resize?.disconnect();
      window.removeEventListener('resize', alignToActive);
    };
  }, [alignToActive]);

  const navigate = (
    event: MouseEvent<HTMLAnchorElement>,
    href: string
  ) => {
    if (
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    ) {
      return;
    }

    setPendingHref(href);
    positionTo(event.currentTarget);
    onNavigate?.();
  };

  return (
    <nav
      ref={navRef}
      aria-label={bottom ? 'Navigasi cepat' : 'Navigasi kasir'}
      className={
        bottom
          ? 'relative isolate grid h-[62px] grid-cols-5 gap-1'
          : 'dosi-side-list relative isolate flex flex-col gap-1'
      }
    >
      {bubble && (
        <span
          aria-hidden="true"
          className="dosi-nav-bubble pointer-events-none absolute left-0 top-0 z-0 overflow-hidden rounded-[12px] bg-[#105D38]"
          style={{
            width: bubble.width,
            height: bubble.height,
            transform: `translate3d(${bubble.x}px, ${bubble.y}px, 0)`,
          }}
        >
          <span
            key={activeHref ?? 'none'}
            className="dosi-liquid-pulse block h-full w-full rounded-[12px] bg-[#105D38]"
          />
        </span>
      )}

      {items.map((item) => {
        const Icon = item.icon;
        const active = activeHref === item.href;

        return (
          <Link
            key={item.href}
            href={item.href}
            data-nav-href={item.href}
            aria-current={active ? 'page' : undefined}
            onClick={(event) => navigate(event, item.href)}
            className={
              bottom
                ? `relative z-10 flex h-[58px] min-w-0 flex-col items-center justify-center gap-1 rounded-[12px] px-1 transition-colors duration-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#D5A52D] ${
                    active
                      ? `text-[#E0B341] ${
                          !bubble ? 'bg-[#105D38]' : ''
                        }`
                      : 'text-[#819086] hover:text-[#105D38]'
                  }`
                : `dosi-side-link relative z-10 flex h-[40px] min-w-0 items-center gap-3 rounded-[12px] px-3 text-[12.5px] font-semibold transition-colors duration-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#D5A52D] ${
                    active
                      ? `text-[#E0B341] ${
                          !bubble ? 'bg-[#105D38]' : ''
                        }`
                      : 'text-[#65776B] hover:bg-[#F3F7F4] hover:text-[#105D38]'
                  }`
            }
          >
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
                  : 'truncate'
              }
            >
              {bottom && item.label === 'Saldo & kliring'
                ? 'Saldo'
                : item.label}
            </span>

            {!bottom && active && (
              <span
                className="ml-auto h-1.5 w-1.5 shrink-0 rounded-full bg-[#E0B341]"
                aria-hidden="true"
              />
            )}
          </Link>
        );
      })}
    </nav>
  );
}

/* KASIR SHELL */

export function KasirShell({
  children,
}: {
  children: ReactNode;
}) {
  const pathname = usePathname();

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [date, setDate] = useState('');

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

    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const onEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setDrawerOpen(false);
      }
    };

    window.addEventListener('keydown', onEscape);

    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener('keydown', onEscape);
    };
  }, [drawerOpen]);

  const isHome = pathname === '/kasir';

  return (
    <div
      className={`${jakarta.className} flex min-h-[100dvh] bg-white text-[#142019] antialiased`}
    >
      {/* DESKTOP SIDEBAR */}
      <aside className="dosi-sidebar sticky top-0 hidden h-[100dvh] w-[236px] shrink-0 flex-col overflow-hidden border-r border-[#E6ECE7] bg-white px-4 pb-5 pt-5 lg:flex xl:w-[248px]">
        <div className="px-2">
          <Brand />
        </div>

        <div className="mt-7">
          <AnimatedNav items={NAV} pathname={pathname} />
        </div>

        <div className="mt-auto border-t border-[#E6ECE7] pt-3">
          <Link
            href="/pilih-login"
            className="flex h-10 items-center gap-3 rounded-[12px] px-3 text-[12.5px] font-semibold text-[#77877C] transition-colors hover:bg-[#F3F7F4] hover:text-[#105D38] focus-visible:outline-2 focus-visible:outline-[#D5A52D]"
          >
            <LogOut size={18} strokeWidth={1.9} />
            Logout
          </Link>
        </div>
      </aside>

      {/* MAIN AREA */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* TOP HEADER */}
        <header className="sticky top-0 z-40 border-b border-[#E6ECE7] bg-white pt-[env(safe-area-inset-top)]">
          <div className="mx-auto flex h-[60px] max-w-[1480px] items-center justify-between gap-3 px-4 sm:px-6 lg:h-[66px] lg:px-8">
            <div className="flex min-w-0 items-center gap-3 lg:hidden">
              <button
                type="button"
                onClick={() => setDrawerOpen(true)}
                aria-label="Buka menu"
                aria-expanded={drawerOpen}
                aria-controls="dosi-mobile-drawer"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[11px] border border-[#E6ECE7] text-[#105D38]"
              >
                <Menu size={20} />
              </button>

              <Brand small />
            </div>

            <span className="hidden text-[12px] font-medium text-[#829187] lg:block">
              {date}
            </span>

            <Link
              href="/kasir/pengaturan"
              aria-label="Pengaturan"
              className="flex h-10 w-10 items-center justify-center rounded-[12px] border border-[#E6ECE7] text-[#105D38] transition-colors hover:bg-[#ECF7EF]"
            >
              <Settings2 size={19} strokeWidth={1.8} />
            </Link>
          </div>
        </header>

        {/* PAGE CONTENT */}
        <main
          className={
            isHome
              ? 'min-w-0 flex-1 bg-white pb-[calc(85px+env(safe-area-inset-bottom))] lg:pb-0'
              : 'min-w-0 flex-1 bg-white px-4 pb-[calc(95px+env(safe-area-inset-bottom))] pt-5 sm:px-6 lg:px-8 lg:pb-10 lg:pt-7'
          }
        >
          <div
            key={pathname}
            className="dosi-page mx-auto w-full max-w-[1480px]"
          >
            {children}
          </div>
        </main>
      </div>

      {/* MOBILE BOTTOM NAVIGATION */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-[#E6ECE7] bg-white px-2 pb-[env(safe-area-inset-bottom)] pt-1.5 lg:hidden">
        <AnimatedNav
          items={BOTTOM_NAV}
          pathname={pathname}
          bottom
        />
      </div>

      {/* MOBILE DRAWER */}
      {drawerOpen && (
        <div
          id="dosi-mobile-drawer"
          className="fixed inset-0 z-[90] lg:hidden"
        >
          <button
            type="button"
            onClick={() => setDrawerOpen(false)}
            aria-label="Tutup menu"
            className="dosi-scrim absolute inset-0 bg-[#10271A]/50"
          />

          <aside
            role="dialog"
            aria-modal="true"
            aria-label="Menu kasir"
            className="dosi-drawer absolute inset-y-0 left-0 flex w-[min(304px,87vw)] flex-col bg-white px-4 pb-[env(safe-area-inset-bottom)]"
          >
            <div className="flex h-[70px] shrink-0 items-center justify-between gap-2 border-b border-[#E6ECE7]">
              <Brand
                onClick={() => setDrawerOpen(false)}
                small
              />

              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                aria-label="Tutup menu"
                className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-[#F3F7F4] text-[#105D38]"
              >
                <X size={19} />
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto py-4">
              <AnimatedNav
                items={NAV}
                pathname={pathname}
                onNavigate={() => setDrawerOpen(false)}
              />
            </div>

            <div className="border-t border-[#E6ECE7] py-3">
              <Link
                href="/pilih-login"
                onClick={() => setDrawerOpen(false)}
                className="flex h-10 items-center gap-3 rounded-xl px-3 text-[12.5px] font-semibold text-[#77877C] hover:bg-[#F3F7F4]"
              >
                <LogOut size={18} />
                Logout
              </Link>
            </div>
          </aside>
        </div>
      )}

      {/* ANIMATIONS */}
      <style jsx global>{`
        .dosi-nav-bubble {
          transition:
            transform 190ms cubic-bezier(.2, .9, .25, 1.08),
            width 190ms ease-out,
            height 190ms ease-out;
          will-change: transform;
        }

        @keyframes dosiLiquid {
          0% {
            transform: scaleX(.96) scaleY(1.035);
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

        .dosi-liquid-pulse {
          animation: dosiLiquid 190ms ease-out both;
        }

        @keyframes dosiPageIn {
          from {
            opacity: .65;
            transform: translateY(5px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .dosi-page {
          animation: dosiPageIn 160ms ease-out both;
        }

        @keyframes dosiDrawerIn {
          from {
            transform: translateX(-100%);
          }
          to {
            transform: translateX(0);
          }
        }

        @keyframes dosiFadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        .dosi-drawer {
          animation: dosiDrawerIn 210ms ease-out both;
        }

        .dosi-scrim {
          animation: dosiFadeIn 150ms ease-out both;
        }

        @media (min-width: 1024px) and (max-height: 680px) {
          .dosi-sidebar {
            padding-top: 14px;
            padding-bottom: 12px;
          }

          .dosi-sidebar > div:nth-child(2) {
            margin-top: 15px;
          }

          .dosi-side-list {
            gap: 3px;
          }

          .dosi-side-link {
            height: 36px;
          }
        }

        @media (min-width: 1024px) and (max-height: 540px) {
          .dosi-sidebar > div:nth-child(2) {
            margin-top: 8px;
          }

          .dosi-side-link {
            height: 31px;
          }

          .dosi-side-list {
            gap: 2px;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .dosi-nav-bubble {
            transition: none !important;
          }

          .dosi-liquid-pulse,
          .dosi-page,
          .dosi-drawer,
          .dosi-scrim {
            animation: none !important;
          }
        }
      `}</style>
    </div>
  );
}
