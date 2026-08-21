"use client";

import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import Animate from "@/components/Animate";
import AuthModal from "@/components/AuthModal";
import DualVideoBg from "@/components/DualVideoBg";

const BG_VIDEO = "https://strvid.nyc3.cdn.digitaloceanspaces.com/motionsite/nature_peace.mp4";

const NAV_LINKS = ["Discover", "AI Tools", "Resume Analyzer", "Planner", "About"];

export default function Hero() {
  const [authOpen, setAuthOpen] = useState(false);
  const [videoOpen, setVideoOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.rpc("opportunity_count").then(({ data, error }) => {
      if (!error && typeof data === "number") setCount(data);
    });
  }, []);

  useEffect(() => {
    document.body.style.overflow = menuOpen || videoOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen, videoOpen]);

  return (
    <section className="relative flex h-screen w-full flex-col overflow-hidden bg-stone-100">
      <DualVideoBg src={BG_VIDEO} className="absolute inset-0 h-full w-full" />
      <div className="absolute inset-0 bg-gradient-to-b from-white/50 via-white/20 to-transparent" />

      {/* Nav */}
      <nav className="relative z-20 mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-6 lg:px-12">
        <Animate delay={0} direction="down">
          <div className="flex items-center gap-2.5">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--accent)] text-white shadow-md">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="3" fill="currentColor" />
                <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5" opacity="0.5" />
              </svg>
            </span>
            <span className="font-serif text-2xl font-semibold tracking-wide text-[var(--heading)] lg:text-3xl">
              Beacon
            </span>
          </div>
        </Animate>

        <Animate delay={100} direction="down" className="hidden md:block">
          <div className="flex items-center space-x-8 text-sm font-medium tracking-wide">
            {NAV_LINKS.map((link, i) => (
              <button
                key={link}
                onClick={() => setAuthOpen(true)}
                className={`cursor-pointer pb-1 transition-colors ${
                  i === 0
                    ? "border-b-2 border-[var(--accent)] text-[var(--heading)]"
                    : "text-[var(--text-muted)] hover:text-[var(--heading)]"
                }`}
              >
                {link}
              </button>
            ))}
          </div>
        </Animate>

        <Animate delay={200} direction="down" className="flex items-center gap-3">
          <button
            onClick={() => setAuthOpen(true)}
            className="hidden cursor-pointer items-center justify-center rounded-full border border-[var(--accent)]/30 bg-white/50 px-6 py-2.5 text-xs font-semibold tracking-wider text-[var(--heading)] uppercase shadow-sm backdrop-blur-md transition-all duration-300 hover:bg-[var(--accent)] hover:text-white sm:inline-flex"
          >
            Get started
          </button>
          <button
            onClick={() => setMenuOpen(true)}
            aria-label="Open menu"
            className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border border-[var(--accent)]/20 bg-white/50 text-[var(--heading)] backdrop-blur-md md:hidden"
          >
            <Menu className="h-5 w-5" />
          </button>
        </Animate>
      </nav>

      {/* Mobile drawer */}
      <div
        className={`fixed inset-0 z-30 transition-opacity duration-300 md:hidden ${
          menuOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
        }`}
      >
        <div onClick={() => setMenuOpen(false)} className="absolute inset-0 bg-[var(--heading)]/40 backdrop-blur-sm" />
        <div
          className={`absolute top-0 right-0 bottom-0 w-[85%] max-w-sm bg-white/95 shadow-2xl backdrop-blur-xl transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
            menuOpen ? "translate-x-0" : "translate-x-full"
          }`}
        >
          <div className="flex h-full flex-col px-8 pt-8 pb-8">
            <button
              onClick={() => setMenuOpen(false)}
              aria-label="Close menu"
              className="ml-auto flex h-9 w-9 cursor-pointer items-center justify-center rounded-full text-[var(--heading)] hover:bg-black/5"
            >
              <X className="h-5 w-5" />
            </button>
            <div className="mt-8 flex flex-col gap-1">
              {NAV_LINKS.map((link, i) => (
                <button
                  key={link}
                  onClick={() => {
                    setMenuOpen(false);
                    setAuthOpen(true);
                  }}
                  style={{ transitionDelay: menuOpen ? `${150 + i * 70}ms` : "0ms" }}
                  className={`border-b border-[var(--accent)]/10 py-4 text-left font-serif text-2xl font-medium text-[var(--heading)] transition-all duration-500 ${
                    menuOpen ? "translate-x-0 opacity-100" : "translate-x-8 opacity-0"
                  }`}
                >
                  {link}
                </button>
              ))}
            </div>
            <button
              onClick={() => {
                setMenuOpen(false);
                setAuthOpen(true);
              }}
              className="mt-8 cursor-pointer rounded-full bg-[var(--accent)] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[var(--accent-hover)]"
            >
              Get started
            </button>
          </div>
        </div>
      </div>

      {/* Hero content */}
      <div className="relative z-20 mx-auto flex w-full max-w-7xl flex-1 flex-col items-center justify-center px-6 py-12 text-center lg:px-12">
        <div className="mx-auto flex max-w-3xl flex-col items-center space-y-6">
          <Animate delay={200} direction="up" className="flex items-center justify-center gap-3">
            <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-[var(--accent-soft)]" />
            <span className="text-xs font-bold tracking-[0.3em] text-[var(--text-muted)] uppercase sm:text-sm">
              Discover. Apply. Succeed.
            </span>
          </Animate>

          <Animate delay={350} direction="up">
            <h1 className="text-center font-serif text-5xl leading-[1.05] font-medium tracking-tight text-[var(--heading)] sm:text-6xl md:text-7xl lg:text-8xl">
              Where opportunity
              <br />
              <span className="font-normal italic">finds you first</span>
            </h1>
          </Animate>

          <Animate delay={500} direction="up" className="flex flex-col items-center pt-2">
            <div className="mx-auto mb-6 h-[1.5px] w-16 bg-[var(--accent)]/30" />
            <p className="max-w-xl text-center text-base leading-relaxed font-medium text-[var(--text-muted)] sm:text-lg">
              The place where students discover internships, scholarships, and jobs — scored by AI
              and tracked automatically, so nothing slips past a deadline.
              {count !== null && ` Already tracking ${count.toLocaleString()} live opportunities.`}
            </p>
          </Animate>

          <Animate delay={650} direction="up" className="flex flex-wrap items-center justify-center gap-4 pt-4 sm:gap-6">
            <button
              onClick={() => setAuthOpen(true)}
              className="group inline-flex cursor-pointer items-center gap-3 rounded-full border border-[var(--accent-hover)]/50 bg-[var(--accent)] px-7 py-3.5 text-sm font-medium text-white shadow-xl transition-all duration-300 hover:bg-[var(--accent-hover)]"
            >
              Explore opportunities
              <svg
                className="h-4 w-4 text-emerald-300 transition-transform duration-300 group-hover:translate-x-1.5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <button
              onClick={() => setVideoOpen(true)}
              className="inline-flex cursor-pointer items-center gap-3 rounded-full border border-[var(--accent)]/20 bg-white/70 px-6 py-3.5 text-sm font-medium text-[var(--heading)] shadow-md backdrop-blur-md transition-all duration-300 hover:-translate-y-0.5 hover:bg-white"
            >
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--accent)] text-white">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </span>
              Watch video
            </button>
          </Animate>
        </div>
      </div>

      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />

      {/* Fullscreen video modal */}
      <div
        className={`fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 p-4 backdrop-blur-xl transition-opacity duration-300 sm:p-8 ${
          videoOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={() => setVideoOpen(false)}
      >
        <div className="relative w-full max-w-4xl" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => setVideoOpen(false)}
            aria-label="Close video"
            className="absolute -top-10 right-0 cursor-pointer text-white/80 hover:text-white"
          >
            <X className="h-6 w-6" />
          </button>
          {videoOpen && (
            // eslint-disable-next-line jsx-a11y/media-has-caption
            <video src={BG_VIDEO} className="w-full rounded-xl" controls autoPlay />
          )}
        </div>
      </div>
    </section>
  );
}
