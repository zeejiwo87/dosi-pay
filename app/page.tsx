"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";

// ==========================================
// DOSI PAY — SPLASH SCREEN
// Seluruh gaya ada di file ini (tidak bergantung pada globals.css)
// ==========================================

const NEXT_ROUTE = "/pilih-login";

// Durasi (ms)
const LEAVE_AT = 2900; // mulai memudar keluar
const NAVIGATE_AT = 3350; // pindah halaman
const LEAVE_AT_REDUCED = 1200;
const NAVIGATE_AT_REDUCED = 1300;

const CSS = `
.dsp-root{
  position:relative;
  display:flex;
  align-items:center;
  justify-content:center;
  width:100%;
  min-height:100vh;
  min-height:100dvh;
  padding:32px 24px 88px;
  overflow:hidden;
  background:#FAFBFA;
  color:#1D2923;
}

/* ---------- LATAR ---------- */
.dsp-bg{position:absolute;inset:0;pointer-events:none}

.dsp-grid{
  position:absolute;
  inset:0;
  background-image:radial-gradient(rgba(32,91,61,.16) 1px,transparent 1.2px);
  background-size:24px 24px;
  -webkit-mask-image:radial-gradient(ellipse 62% 46% at 50% 44%,#000 0%,transparent 100%);
  mask-image:radial-gradient(ellipse 62% 46% at 50% 44%,#000 0%,transparent 100%);
  animation:dsp-fade 1.6s ease-out .1s both;
}

.dsp-glow{
  position:absolute;
  left:50%;
  top:44%;
  width:520px;
  height:520px;
  max-width:140vw;
  margin:-260px 0 0 -260px;
  border-radius:50%;
  background:radial-gradient(circle,rgba(32,91,61,.09) 0%,rgba(255,201,60,.05) 38%,transparent 68%);
  animation:dsp-glow 1.8s cubic-bezier(.2,.8,.2,1) both;
}

/* ---------- KONTEN ---------- */
.dsp-content{
  position:relative;
  z-index:1;
  display:flex;
  flex-direction:column;
  align-items:center;
  width:100%;
  max-width:380px;
  text-align:center;
  transition:opacity .45s ease,transform .45s cubic-bezier(.4,0,.2,1);
}

.is-leaving .dsp-content{
  opacity:0;
  transform:translateY(-10px) scale(1.02);
}

.dsp-footer{
  transition:opacity .35s ease;
}
.is-leaving .dsp-footer{opacity:0 !important}

/* ---------- LOGO ---------- */
.dsp-stage{
  position:relative;
  display:flex;
  align-items:center;
  justify-content:center;
  width:clamp(150px,46vw,190px);
  aspect-ratio:1/1;
}

.dsp-ring{
  position:absolute;
  inset:0;
  border-radius:50%;
  border:1px solid rgba(32,91,61,.22);
  opacity:0;
  animation:dsp-ring 1.9s cubic-bezier(.2,.7,.2,1) both;
}
.dsp-ring-1{animation-delay:.45s}
.dsp-ring-2{animation-delay:.75s;border-color:rgba(255,201,60,.55)}

.dsp-logo{
  position:relative;
  width:100%;
  height:100%;
  animation:dsp-logo 1.1s cubic-bezier(.22,1,.36,1) .1s both;
}

/* ---------- TAGLINE ---------- */
.dsp-tagline{
  margin:30px 0 0;
  font-size:16px;
  font-weight:600;
  line-height:1.45;
  letter-spacing:-.2px;
  color:#1D2923;
}

.dsp-line{
  display:block;
  overflow:hidden;
  padding-bottom:4px;
}

.dsp-line > span{
  display:inline-block;
  animation:dsp-line .8s cubic-bezier(.22,1,.36,1) both;
}
.dsp-line:nth-child(1) > span{animation-delay:.85s}
.dsp-line:nth-child(2) > span{animation-delay:1s}

.dsp-mark{position:relative;z-index:0}
.dsp-mark::after{
  content:"";
  position:absolute;
  left:-3px;
  right:-3px;
  bottom:2px;
  height:.46em;
  z-index:-1;
  border-radius:3px;
  background:#FFC93C;
  opacity:.6;
  transform:scaleX(0);
  transform-origin:left center;
  animation:dsp-mark .75s cubic-bezier(.65,0,.35,1) 1.55s forwards;
}

/* ---------- LOADING ---------- */
.dsp-loading{
  display:flex;
  flex-direction:column;
  align-items:center;
  margin-top:34px;
  animation:dsp-up .7s ease-out 1.25s both;
}

.dsp-track{
  width:168px;
  height:4px;
  border-radius:999px;
  background:#E3EAE5;
}

.dsp-fill{
  position:relative;
  width:0;
  height:100%;
  border-radius:999px;
  background:#205B3D;
  animation:dsp-fill 1.6s cubic-bezier(.65,0,.35,1) 1.3s forwards;
}

.dsp-fill i{
  position:absolute;
  right:-3px;
  top:50%;
  width:9px;
  height:9px;
  margin-top:-4.5px;
  border-radius:50%;
  background:#FFC93C;
  box-shadow:0 0 0 3px #FAFBFA;
  animation:dsp-dot .3s ease-out 1.3s both;
}

.dsp-status{
  margin-top:16px;
  font-size:12px;
  font-weight:500;
  letter-spacing:.1px;
  color:#8C998F;
}

/* ---------- FOOTER ---------- */
.dsp-footer{
  position:absolute;
  left:0;
  right:0;
  bottom:max(28px,env(safe-area-inset-bottom));
  text-align:center;
  font-size:11px;
  letter-spacing:.2px;
  color:#A0ABA3;
  animation:dsp-fade .8s ease-out 1.4s both;
}

/* ---------- KEYFRAMES ---------- */
@keyframes dsp-fade{from{opacity:0}to{opacity:1}}

@keyframes dsp-up{
  from{opacity:0;transform:translateY(8px)}
  to{opacity:1;transform:translateY(0)}
}

@keyframes dsp-glow{
  from{opacity:0;transform:scale(.7)}
  to{opacity:1;transform:scale(1)}
}

@keyframes dsp-logo{
  0%{opacity:0;transform:translateY(14px) scale(.9);filter:blur(10px)}
  60%{opacity:1;filter:blur(0)}
  100%{opacity:1;transform:translateY(0) scale(1);filter:blur(0)}
}

@keyframes dsp-ring{
  0%{opacity:0;transform:scale(.72)}
  25%{opacity:1}
  100%{opacity:0;transform:scale(1.9)}
}

@keyframes dsp-line{
  from{transform:translateY(110%)}
  to{transform:translateY(0)}
}

@keyframes dsp-mark{
  from{transform:scaleX(0)}
  to{transform:scaleX(1)}
}

@keyframes dsp-fill{
  from{width:0}
  to{width:100%}
}

@keyframes dsp-dot{
  from{opacity:0;transform:scale(.3)}
  to{opacity:1;transform:scale(1)}
}

/* ---------- RESPONSIVE ---------- */
@media (max-height:560px){
  .dsp-root{padding-top:16px;padding-bottom:64px}
  .dsp-stage{width:130px}
  .dsp-tagline{margin-top:20px}
  .dsp-loading{margin-top:20px}
  .dsp-footer{bottom:12px}
}

/* ---------- AKSESIBILITAS ---------- */
@media (prefers-reduced-motion:reduce){
  .dsp-root *,.dsp-root *::before,.dsp-root *::after{
    animation:none !important;
    transition-duration:.01ms !important;
  }
  .dsp-ring{display:none}
  .dsp-fill{width:100%}
  .dsp-mark::after{transform:scaleX(1)}
}
`;

export default function Home() {
  const router = useRouter();
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    router.prefetch(NEXT_ROUTE);

    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    const leaveTimer = window.setTimeout(
      () => setLeaving(true),
      reduced ? LEAVE_AT_REDUCED : LEAVE_AT
    );

    const navigateTimer = window.setTimeout(
      () => router.replace(NEXT_ROUTE),
      reduced ? NAVIGATE_AT_REDUCED : NAVIGATE_AT
    );

    return () => {
      window.clearTimeout(leaveTimer);
      window.clearTimeout(navigateTimer);
    };
  }, [router]);

  return (
    <main className={`dsp-root font-sans ${leaving ? "is-leaving" : ""}`}>
      <style>{CSS}</style>

      <div className="dsp-bg" aria-hidden="true">
        <div className="dsp-grid" />
        <div className="dsp-glow" />
      </div>

      <div className="dsp-content">
        <div className="dsp-stage">
          <span className="dsp-ring dsp-ring-1" aria-hidden="true" />
          <span className="dsp-ring dsp-ring-2" aria-hidden="true" />

          <div className="dsp-logo">
            <Image
              src="/DOSIPAY.png"
              alt="DOSI Pay"
              fill
              priority
              sizes="(max-width: 640px) 46vw, 190px"
              className="object-contain"
            />
          </div>
        </div>

        <h1 className="dsp-tagline">
          <span className="dsp-line">
            <span>Keuangan pesantren,</span>
          </span>
          <span className="dsp-line">
            <span className="dsp-mark">lebih mudah.</span>
          </span>
        </h1>

        <div className="dsp-loading">
          <div
            className="dsp-track"
            role="progressbar"
            aria-label="Memuat aplikasi"
          >
            <div className="dsp-fill">
              <i />
            </div>
          </div>

          <p className="dsp-status">Menyiapkan aplikasi...</p>
        </div>
      </div>

      <footer className="dsp-footer">© 2026 DOSI Pay</footer>
    </main>
  );
}
