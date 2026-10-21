
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import {
  ArrowLeft,
  Bell,
  Bookmark,
  CalendarDays,
  ChevronRight,
  ImageOff,
  Share2,
  Tag,
  Users,
} from "lucide-react";

// ==========================================
// DOSI PAY — PENGUMUMAN WALI SANTRI
// Compact • Sticky Header • Smooth Animation
// ==========================================

type Announcement = {
  id: string;
  title: string;
  date: string;
  category: string;
  summary: string;
  content: string[];
  photo: string;
  photoCredit: string;
  photoSource: string;
  isDemo?: boolean;
};

// DATA PENGUMUMAN ASLI — TIDAK DIUBAH

const ANNOUNCEMENTS: Announcement[] = [
  {
    id: "kunjungan-wali",
    title: "Jadwal Kunjungan Wali Santri",
    date: "2026-10-07",
    category: "Kegiatan",
    summary:
      "Kunjungan wali dilaksanakan pada 10 Oktober 2026.",
    content: [
      "Kunjungan wali dilaksanakan pada 10 Oktober 2026.",
    ],
    photo:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/e/ec/Masjid_Santri_PPI04CJR.jpg/960px-Masjid_Santri_PPI04CJR.jpg",
    photoCredit: "Nineteenboy",
    photoSource:
      "https://commons.wikimedia.org/wiki/File:Masjid_Santri_PPI04CJR.jpg",
  },
  {
    id: "agenda-belajar",
    title: "Agenda Pembelajaran Santri",
    date: "2026-10-03",
    category: "Akademik",
    summary:
      "Informasi kegiatan belajar dan agenda santri.",
    content: [
      "Ini merupakan contoh pengumuman kegiatan belajar santri di DOSI Pay.",
      "Jadwal dan informasi akademik resmi nantinya diterbitkan oleh pihak pesantren.",
    ],
    photo:
      "https://thumb.wikimedia.org/wikipedia/commons/thumb/9/9b/Pendidikan_Santri_Indonesia.jpg/960px-Pendidikan_Santri_Indonesia.jpg",
    photoCredit: "Focusfeel",
    photoSource:
      "https://commons.wikimedia.org/wiki/File:Pendidikan_Santri_Indonesia.jpg",
    isDemo: true,
  },
  {
    id: "informasi-santri",
    title: "Informasi Kegiatan Santri",
    date: "2026-10-01",
    category: "Umum",
    summary:
      "Kabar kegiatan santri di lingkungan pesantren.",
    content: [
      "Ini merupakan contoh pengumuman kegiatan santri.",
      "Informasi resmi akan disampaikan melalui sistem DOSI Pay setelah terhubung dengan manajemen pesantren.",
    ],
    photo:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/8/81/Santri_Murajaah_Alquran_01.jpg/960px-Santri_Murajaah_Alquran_01.jpg",
    photoCredit: "Muhamad Izzul Fiqih",
    photoSource:
      "https://commons.wikimedia.org/wiki/File:Santri_Murajaah_Alquran_01.jpg",
    isDemo: true,
  },
];

const SAVED_KEY = "dosi_saved_announcements";

// ==========================================
// FORMAT DATE
// ==========================================

function formatDate(date: string) {
  const value = new Date(`${date}T12:00:00`);

  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(value);
}

// ==========================================
// PHOTO COMPONENT
// ==========================================

function AnnouncementPhoto({
  announcement,
  className = "",
  priority = false,
}: {
  announcement: Announcement;
  className?: string;
  priority?: boolean;
}) {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [announcement.photo]);

  return (
    <div
      className={`relative overflow-hidden bg-[#175B3D] ${className}`}
    >
      {!failed ? (
        // Menggunakan img untuk mempertahankan URL
        // foto asli tanpa konfigurasi remotePatterns.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={announcement.photo}
          alt={`Ilustrasi ${announcement.category.toLowerCase()} pesantren`}
          loading={priority ? "eager" : "lazy"}
          decoding="async"
          onError={() => setFailed(true)}
          className="announcement-image absolute inset-0 h-full w-full object-cover"
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center text-white/70">
          <ImageOff
            size={25}
            strokeWidth={1.5}
          />
        </div>
      )}
    </div>
  );
}

// ==========================================
// PAGE
// ==========================================

export default function PengumumanWaliPage() {
  const [selected, setSelected] =
    useState<Announcement | null>(null);

  const [savedIds, setSavedIds] =
    useState<string[]>([]);

  const [storageReady, setStorageReady] =
    useState(false);

  const [showSavedOnly, setShowSavedOnly] =
    useState(false);

  const [copySuccess, setCopySuccess] =
    useState(false);

  // ========================================
  // URL DETAIL + BROWSER BACK
  // ========================================

  useEffect(() => {
    function syncFromUrl() {
      const params = new URLSearchParams(
        window.location.search
      );

      const id = params.get("id");

      setSelected(
        ANNOUNCEMENTS.find(
          (item) => item.id === id
        ) ?? null
      );
    }

    syncFromUrl();

    window.addEventListener(
      "popstate",
      syncFromUrl
    );

    return () => {
      window.removeEventListener(
        "popstate",
        syncFromUrl
      );
    };
  }, []);

  // ========================================
  // LOAD BOOKMARKS
  // ========================================

  useEffect(() => {
    try {
      const saved = localStorage.getItem(
        SAVED_KEY
      );

      if (saved) {
        const parsed: unknown =
          JSON.parse(saved);

        if (Array.isArray(parsed)) {
          setSavedIds(
            parsed.filter(
              (value): value is string =>
                typeof value === "string"
            )
          );
        }
      }
    } catch {
      // Halaman tetap bisa digunakan.
    }

    setStorageReady(true);
  }, []);

  // ========================================
  // SAVE BOOKMARKS
  // ========================================

  useEffect(() => {
    if (!storageReady) return;

    try {
      localStorage.setItem(
        SAVED_KEY,
        JSON.stringify(savedIds)
      );
    } catch {
      // Penyimpanan browser mungkin dibatasi.
    }
  }, [savedIds, storageReady]);

  // ========================================
  // SCROLL REVEAL
  // ========================================

  useEffect(() => {
    const elements =
      document.querySelectorAll<HTMLElement>(
        "[data-announcement-reveal]"
      );

    if (
      typeof IntersectionObserver === "undefined" ||
      window.matchMedia(
        "(prefers-reduced-motion: reduce)"
      ).matches
    ) {
      elements.forEach((element) => {
        element.classList.add(
          "announcement-visible"
        );
      });

      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;

          entry.target.classList.add(
            "announcement-visible"
          );

          observer.unobserve(entry.target);
        });
      },
      {
        threshold: 0.08,
        rootMargin: "0px 0px -12px 0px",
      }
    );

    elements.forEach((element) => {
      observer.observe(element);
    });

    return () => observer.disconnect();
  }, [selected, showSavedOnly]);

  // ========================================
  // ACTIONS
  // ========================================

  function openAnnouncement(
    item: Announcement
  ) {
    window.history.pushState(
      null,
      "",
      `/wali/pengumuman?id=${encodeURIComponent(
        item.id
      )}`
    );

    setSelected(item);
    setCopySuccess(false);

    window.scrollTo({
      top: 0,
      behavior: "auto",
    });
  }

  function closeAnnouncement() {
    window.history.replaceState(
      null,
      "",
      "/wali/pengumuman"
    );

    setSelected(null);
    setCopySuccess(false);

    window.scrollTo({
      top: 0,
      behavior: "auto",
    });
  }

  function toggleSave(id: string) {
    setSavedIds((previous) =>
      previous.includes(id)
        ? previous.filter(
            (item) => item !== id
          )
        : [...previous, id]
    );
  }

  async function shareAnnouncement(
    item: Announcement
  ) {
    const url =
      `${window.location.origin}/wali/pengumuman?id=` +
      encodeURIComponent(item.id);

    if (navigator.share) {
      try {
        await navigator.share({
          title: item.title,
          url,
        });

        return;
      } catch {
        return;
      }
    }

    try {
      await navigator.clipboard.writeText(
        url
      );

      setCopySuccess(true);
    } catch {
      setCopySuccess(false);
    }
  }

  const displayedAnnouncements =
    showSavedOnly
      ? ANNOUNCEMENTS.filter((item) =>
          savedIds.includes(item.id)
        )
      : ANNOUNCEMENTS;

  const isSelectedSaved = selected
    ? savedIds.includes(selected.id)
    : false;

  // ========================================
  // RENDER
  // ========================================

  return (
    <main className="min-h-[100dvh] bg-[#F2F5F2] font-sans text-[#17251D]">

      <div className="mx-auto min-h-[100dvh] w-full max-w-[430px] bg-white">

        {/* ==================================
            STICKY HEADER
        ================================== */}

        <header className="sticky top-0 z-40 border-b border-[#EAF0EB] bg-white px-[15px] pt-[env(safe-area-inset-top)] shadow-[0_3px_12px_rgba(0,0,0,0.03)]">

          <div className="flex h-[53px] items-center justify-between gap-[8px]">

            {/* BACK */}

            {selected ? (
              <button
                type="button"
                onClick={closeAnnouncement}
                aria-label="Kembali ke pengumuman"
                className="announcement-tap flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-[10px] border border-[#E5ECE6] text-[#27372D]"
              >
                <ArrowLeft
                  size={18}
                  strokeWidth={1.8}
                />
              </button>
            ) : (
              <Link
                href="/wali/beranda"
                aria-label="Kembali ke beranda"
                className="announcement-tap flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-[10px] border border-[#E5ECE6] text-[#27372D]"
              >
                <ArrowLeft
                  size={18}
                  strokeWidth={1.8}
                />
              </Link>
            )}

            {/* TITLE */}

            <h1 className="min-w-0 truncate text-[15px] font-bold tracking-[-0.3px]">
              {selected
                ? "Detail Pengumuman"
                : "Pengumuman"}
            </h1>

            {/* ACTIONS */}

            {selected ? (
              <div className="flex items-center gap-[7px]">

                <button
                  type="button"
                  onClick={() =>
                    shareAnnouncement(selected)
                  }
                  aria-label="Bagikan pengumuman"
                  className="announcement-tap flex h-[34px] w-[34px] items-center justify-center rounded-[10px] border border-[#E5ECE6] text-[#27372D]"
                >
                  <Share2
                    size={17}
                    strokeWidth={1.8}
                  />
                </button>

                <button
                  type="button"
                  onClick={() =>
                    toggleSave(selected.id)
                  }
                  aria-label={
                    isSelectedSaved
                      ? "Hapus bookmark"
                      : "Simpan pengumuman"
                  }
                  aria-pressed={isSelectedSaved}
                  className={`announcement-tap flex h-[34px] w-[34px] items-center justify-center rounded-[10px] border ${
                    isSelectedSaved
                      ? "border-[#CFE9D6] bg-[#EAF7EE] text-[#105D38]"
                      : "border-[#E5ECE6] text-[#27372D]"
                  }`}
                >
                  <Bookmark
                    key={`${selected.id}-${isSelectedSaved}`}
                    size={17}
                    strokeWidth={1.8}
                    fill={
                      isSelectedSaved
                        ? "currentColor"
                        : "none"
                    }
                    className="announcement-bookmark-pop"
                  />
                </button>

              </div>
            ) : (
              <button
                type="button"
                onClick={() =>
                  setShowSavedOnly((value) => !value)
                }
                aria-label={
                  showSavedOnly
                    ? "Tampilkan semua pengumuman"
                    : "Tampilkan pengumuman tersimpan"
                }
                aria-pressed={showSavedOnly}
                className={`announcement-tap flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-[10px] border ${
                  showSavedOnly
                    ? "border-[#CFE9D6] bg-[#EAF7EE] text-[#105D38]"
                    : "border-[#E5ECE6] text-[#27372D]"
                }`}
              >
                <Bookmark
                  size={17}
                  fill={
                    showSavedOnly
                      ? "currentColor"
                      : "none"
                  }
                  strokeWidth={1.8}
                />
              </button>
            )}

          </div>

        </header>

        {/* ==================================
            DETAIL VIEW
        ================================== */}

        {selected ? (
          <div
            key={selected.id}
            className="announcement-detail-enter"
          >

            {/* PHOTO HERO */}

            <section className="relative h-[215px] overflow-hidden bg-[#175B3D] max-[360px]:h-[192px]">

              <AnnouncementPhoto
                announcement={selected}
                priority
                className="absolute inset-0 h-full w-full"
              />

              <div className="absolute inset-0 bg-black/35" />

              <div className="absolute bottom-[35px] left-[17px] right-[17px] text-white">

                <span className="inline-flex rounded-full bg-white/20 px-[9px] py-[4px] text-[9px] font-semibold">
                  {selected.category}
                </span>

                <h2 className="mt-[9px] max-w-[345px] text-[20px] font-bold leading-[1.25] tracking-[-0.5px] max-[360px]:text-[18px]">
                  {selected.title}
                </h2>

                <p className="mt-[7px] text-[10px] text-white/85">
                  {formatDate(selected.date)}
                </p>

              </div>

            </section>

            {/* WHITE DETAIL SHEET */}

            <section className="announcement-sheet-enter relative -mt-[20px] min-h-[280px] rounded-t-[21px] bg-white px-[17px] pb-[calc(105px+env(safe-area-inset-bottom))] pt-[12px]">

              <div
                aria-hidden="true"
                className="mx-auto h-[4px] w-[33px] rounded-full bg-[#E5ECE6]"
              />

              {/* META */}

              <div className="mt-[19px] grid grid-cols-3 divide-x divide-[#E7EEE9] rounded-[13px] bg-[#F5F8F5] px-[4px] py-[13px]">

                <div className="flex min-w-0 flex-col items-center gap-[6px] px-[5px] text-center">

                  <CalendarDays
                    size={17}
                    className="text-[#105D38]"
                  />

                  <span className="text-[9px] font-medium text-[#57685D]">
                    {formatDate(selected.date)}
                  </span>

                </div>

                <div className="flex min-w-0 flex-col items-center gap-[6px] px-[5px] text-center">

                  <Tag
                    size={17}
                    className="text-[#105D38]"
                  />

                  <span className="text-[9px] font-medium text-[#57685D]">
                    {selected.category}
                  </span>

                </div>

                <div className="flex min-w-0 flex-col items-center gap-[6px] px-[5px] text-center">

                  <Users
                    size={17}
                    className="text-[#105D38]"
                  />

                  <span className="text-[9px] font-medium text-[#57685D]">
                    Wali Santri
                  </span>

                </div>

              </div>

              {/* CONTENT */}

              <article
                data-announcement-reveal
                className="mt-[19px] border-t border-[#EDF1ED] pt-[16px]"
              >

                {selected.content.map(
                  (paragraph, index) => (
                    <p
                      key={index}
                      className="mb-[11px] text-[11px] leading-[1.85] text-[#617165]"
                    >
                      {paragraph}
                    </p>
                  )
                )}

                {selected.isDemo && (
                  <span className="mt-[3px] inline-flex rounded-full bg-[#F1F4F1] px-[9px] py-[5px] text-[9px] font-medium text-[#708076]">
                    Contoh pengumuman
                  </span>
                )}

              </article>

              {/* PHOTO CREDIT */}

              <p className="mt-[22px] text-[9px] leading-[1.65] text-[#A0AAA1]">

                Foto ilustrasi:{" "}

                <a
                  href={selected.photoSource}
                  target="_blank"
                  rel="noreferrer"
                  className="underline underline-offset-2"
                >
                  {selected.photoCredit} / Wikimedia Commons
                </a>

                {" "}— CC BY-SA 4.0

              </p>

              {copySuccess && (
                <p
                  role="status"
                  className="announcement-toast mt-[12px] rounded-[9px] bg-[#EAF7EE] px-[11px] py-[9px] text-[10px] font-medium text-[#176B45]"
                >
                  Tautan pengumuman berhasil disalin.
                </p>
              )}

            </section>

          </div>
        ) : (

          /* ==================================
              LIST VIEW
          ================================== */

          <div className="pb-[calc(105px+env(safe-area-inset-bottom))]">

            {/* PAGE INTRO */}

            <section className="announcement-intro px-[16px] pt-[19px]">

              <div className="flex items-start justify-between gap-2">

                <div>

                  <h2 className="text-[20px] font-bold tracking-[-0.6px]">
                    Kabar Pesantren
                  </h2>

                  <p className="mt-[5px] text-[11px] text-[#8B9B90]">
                    Informasi untuk wali santri
                  </p>

                </div>

                <span className="rounded-full bg-[#EAF7EE] px-[9px] py-[5px] text-[9px] font-semibold text-[#176B45]">
                  {ANNOUNCEMENTS.length} Kabar
                </span>

              </div>

            </section>

            {/* FEATURED CAROUSEL */}

            <section className="mt-[21px]">

              <div className="flex items-center justify-between px-[16px]">

                <h2 className="text-[13px] font-bold">
                  Terbaru
                </h2>

                <span className="text-[10px] text-[#9BA79D]">
                  Geser untuk lainnya
                </span>

              </div>

              <div
                aria-label="Pengumuman terbaru, geser untuk melihat lainnya"
                className="announcement-track mt-[11px] flex snap-x snap-mandatory gap-[9px] overflow-x-auto px-[16px] pb-[4px] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                style={{
                  WebkitOverflowScrolling: "touch",
                }}
              >

                {ANNOUNCEMENTS.map(
                  (item, index) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() =>
                        openAnnouncement(item)
                      }
                      className="announcement-card announcement-tap group relative h-[176px] w-[148px] shrink-0 snap-start overflow-hidden rounded-[14px] bg-[#175B3D] text-left max-[360px]:h-[166px] max-[360px]:w-[139px]"
                      style={{
                        animationDelay: `${index * 75}ms`,
                      }}
                    >

                      <AnnouncementPhoto
                        announcement={item}
                        className="absolute inset-0 h-full w-full"
                      />

                      <div className="absolute inset-0 bg-black/35" />

                      <div className="relative flex h-full flex-col justify-between p-[11px] text-white">

                        <div className="flex items-start justify-between gap-[5px]">

                          <span className="rounded-full bg-white/90 px-[7px] py-[4px] text-[8px] font-semibold text-[#105D38]">
                            {item.category}
                          </span>

                          {item.isDemo && (
                            <span className="rounded-full bg-black/30 px-[6px] py-[4px] text-[8px]">
                              Demo
                            </span>
                          )}

                        </div>

                        <div>

                          <h3 className="line-clamp-3 text-[12px] font-bold leading-[1.4] tracking-[-0.15px]">
                            {item.title}
                          </h3>

                          <p className="mt-[6px] text-[9px] text-white/85">
                            {formatDate(item.date)}
                          </p>

                        </div>

                      </div>

                    </button>
                  )
                )}

              </div>

            </section>

            {/* ANNOUNCEMENT LIST */}

            <section className="mt-[22px] px-[16px]">

              <div className="flex items-center justify-between gap-2">

                <h2 className="text-[13px] font-bold">
                  {showSavedOnly
                    ? "Pengumuman Tersimpan"
                    : "Semua Pengumuman"}
                </h2>

                {showSavedOnly && (
                  <button
                    type="button"
                    onClick={() =>
                      setShowSavedOnly(false)
                    }
                    className="text-[10px] font-semibold text-[#168451]"
                  >
                    Lihat Semua
                  </button>
                )}

              </div>

              {displayedAnnouncements.length === 0 ? (
                <div className="mt-[13px] rounded-[13px] bg-[#F5F8F5] px-[14px] py-[22px] text-center">

                  <Bookmark
                    size={22}
                    className="mx-auto text-[#87A28F]"
                  />

                  <p className="mt-[9px] text-[11px] font-semibold">
                    Belum ada yang tersimpan
                  </p>

                  <p className="mt-[4px] text-[10px] text-[#95A39A]">
                    Buka pengumuman lalu tekan ikon bookmark.
                  </p>

                </div>
              ) : (
                <div className="mt-[11px] space-y-[8px]">

                  {displayedAnnouncements.map(
                    (item, index) => (
                      <button
                        key={item.id}
                        type="button"
                        data-announcement-reveal
                        onClick={() =>
                          openAnnouncement(item)
                        }
                        className="announcement-list-item announcement-tap flex w-full items-center gap-[10px] rounded-[12px] bg-[#F6F8F7] p-[8px] text-left"
                        style={{
                          transitionDelay: `${Math.min(
                            index * 40,
                            180
                          )}ms`,
                        }}
                      >

                        <AnnouncementPhoto
                          announcement={item}
                          className="h-[58px] w-[62px] shrink-0 rounded-[9px]"
                        />

                        <div className="min-w-0 flex-1">

                          <p className="line-clamp-2 text-[11px] font-semibold leading-[1.45] text-[#1C2921]">
                            {item.title}
                          </p>

                          <p className="mt-[4px] line-clamp-1 text-[9px] text-[#89978C]">
                            {item.summary}
                          </p>

                          <p className="mt-[4px] text-[9px] text-[#9EA9A0]">
                            {formatDate(item.date)}
                            {item.isDemo
                              ? " • Demo"
                              : ""}
                          </p>

                        </div>

                        <ChevronRight
                          size={16}
                          strokeWidth={1.8}
                          className="shrink-0 text-[#9AADA0]"
                        />

                      </button>
                    )
                  )}

                </div>
              )}

            </section>

          </div>
        )}

      </div>

      {/* ==================================
          ANIMATIONS
      ================================== */}

      <style jsx global>{`

        /* ----------------------------------
           PAGE INTRO
        ---------------------------------- */

        @keyframes announcementFadeUp {
          from {
            opacity: 0;
            transform: translateY(12px);
          }

          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .announcement-intro {
          animation: announcementFadeUp 450ms
            cubic-bezier(0.22, 1, 0.36, 1) both;
        }

        /* ----------------------------------
           STAGGERED CARDS
        ---------------------------------- */

        .announcement-card {
          animation: announcementFadeUp 540ms
            cubic-bezier(0.22, 1, 0.36, 1) both;
        }

        /* ----------------------------------
           IMAGE ZOOM
        ---------------------------------- */

        .announcement-image {
          animation: announcementImageReveal
            720ms ease-out both;

          transition: transform 500ms
            cubic-bezier(0.22, 1, 0.36, 1);
        }

        @keyframes announcementImageReveal {
          from {
            opacity: 0.55;
            transform: scale(1.045);
          }

          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        .announcement-card:hover
        .announcement-image {
          transform: scale(1.055);
        }

        /* ----------------------------------
           SMOOTH CAROUSEL
        ---------------------------------- */

        .announcement-track {
          scroll-behavior: smooth;
          scroll-snap-type: x mandatory;
          overscroll-behavior-x: contain;
        }

        /* ----------------------------------
           DETAIL TRANSITION
        ---------------------------------- */

        .announcement-detail-enter {
          animation: announcementFadeUp 420ms
            cubic-bezier(0.22, 1, 0.36, 1) both;
        }

        .announcement-sheet-enter {
          animation: announcementFadeUp 500ms
            cubic-bezier(0.22, 1, 0.36, 1)
            70ms both;
        }

        /* ----------------------------------
           SCROLL REVEAL
        ---------------------------------- */

        .announcement-list-item {
          transition:
            opacity 460ms
              cubic-bezier(0.22, 1, 0.36, 1),
            transform 460ms
              cubic-bezier(0.22, 1, 0.36, 1),
            background-color 170ms ease;
        }

        .announcement-list-item:not(
          .announcement-visible
        ) {
          opacity: 0;
          transform: translateY(11px);
        }

        .announcement-list-item.announcement-visible {
          opacity: 1;
          transform: translateY(0);
        }

        /* ----------------------------------
           BOOKMARK POP
        ---------------------------------- */

        @keyframes announcementBookmarkPop {
          0% {
            transform: scale(0.8);
          }

          65% {
            transform: scale(1.18);
          }

          100% {
            transform: scale(1);
          }
        }

        .announcement-bookmark-pop {
          animation: announcementBookmarkPop
            280ms ease-out both;
        }

        /* ----------------------------------
           BUTTON MICRO-INTERACTIONS
        ---------------------------------- */

        .announcement-tap {
          transition:
            transform 170ms ease,
            background-color 170ms ease,
            border-color 170ms ease;
          -webkit-tap-highlight-color: transparent;
        }

        .announcement-tap:active {
          transform: scale(0.97);
        }

        /* ----------------------------------
           COPY SUCCESS
        ---------------------------------- */

        .announcement-toast {
          animation: announcementFadeUp
            260ms ease-out both;
        }

        /* ----------------------------------
           ACCESSIBILITY
        ---------------------------------- */

        @media (prefers-reduced-motion: reduce) {
          .announcement-intro,
          .announcement-card,
          .announcement-image,
          .announcement-detail-enter,
          .announcement-sheet-enter,
          .announcement-bookmark-pop,
          .announcement-toast {
            animation: none !important;
          }

          .announcement-track {
            scroll-behavior: auto !important;
          }

          .announcement-list-item {
            opacity: 1 !important;
            transform: none !important;
          }

          .announcement-tap,
          .announcement-image,
          .announcement-list-item {
            transition: none !important;
          }
        }

      `}</style>

    </main>
  );
}
