"use client";

import { useEffect, useState } from "react";
import { LogIn, UserPlus, Sparkles, Menu, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import Animate from "@/components/Animate";
import AuthModal from "@/components/AuthModal";
import BoomerangVideoBg from "@/components/BoomerangVideoBg";

const BG_VIDEO =
  "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260511_131941_d136af49-e243-493a-be14-6ff3f24e09e6.mp4";

const NAV_LINKS = [
  { label: "Discover" },
  { label: "AI Tools" },
  { label: "Planner" },
];

function RadarBlock({ onOpenAuth }: { onOpenAuth: () => void }) {
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.rpc("opportunity_count").then(({ data, error }) => {
      if (!error && typeof data === "number") setCount(data);
    });
  }, []);

  return (
    <div className="absolute bottom-6 left-4 right-4 z-10 max-w-sm sm:bottom-8 sm:left-6 sm:right-auto md:bottom-10 md:left-10">
      <div className="mb-3 flex items-center gap-2 text-[var(--cta)] sm:text-white/95">
        <Sparkles className="h-4 w-4" />
        <span className="text-sm font-semibold">
          Beacon Radar{count !== null ? ` · ${count} live` : ""}
        </span>
      </div>
      <p className="mb-6 max-w-xs text-xs leading-relaxed font-medium text-[var(--cta)]/90 sm:text-white/85">
        Beacon scans job boards daily and uses AI to score your fit — so you never waste time on a
        mismatch.
      </p>
      <div className="flex flex-wrap items-center gap-4">
        <button
          onClick={onOpenAuth}
          className="cursor-pointer rounded-full bg-[var(--cta)] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[var(--cta-hover)] sm:bg-white sm:text-[var(--text)] sm:hover:bg-white/90 sm:px-6 sm:py-3"
        >
          Get started
        </button>
        <button
          onClick={onOpenAuth}
          className="cursor-pointer text-sm font-semibold text-[var(--cta)] transition-opacity hover:opacity-80 sm:text-white"
        >
          Know more.
        </button>
      </div>
    </div>
  );
}

export default function Hero() {
  const [authOpen, setAuthOpen] = useState(false);

  return (
    <section className="relative min-h-screen w-full overflow-hidden sm:h-screen">
      <BoomerangVideoBg src={BG_VIDEO} className="absolute inset-0 h-full w-full" />
      <Nav onOpenAuth={() => setAuthOpen(true)} />

      <div className="relative z-10 flex flex-col items-center px-4 pt-24 text-center sm:px-6 sm:pt-28 md:pt-32">
        <Animate delay={200} direction="up">
          <h1
            className="max-w-5xl text-[2rem] leading-[0.95] font-normal text-[var(--heading)] sm:text-4xl md:text-5xl lg:text-[4.75rem] xl:text-[5.25rem]"
            style={{ letterSpacing: "-0.035em" }}
          >
            Track every opportunity{" "}
            <span className="text-[var(--heading-accent)]">
              before the deadline
              <br className="hidden sm:block" /> finds you first
            </span>
          </h1>
        </Animate>
        <Animate delay={400} direction="up">
          <p className="mt-6 max-w-md px-2 text-sm leading-relaxed text-[var(--text-muted)] sm:mt-8 sm:text-base md:text-lg">
            AI-powered eligibility checks, resume scoring, and deadline tracking — all in one
            place.
          </p>
        </Animate>
      </div>

      <RadarBlock onOpenAuth={() => setAuthOpen(true)} />

      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />
    </section>
  );
}

function Nav({ onOpenAuth }: { onOpenAuth: () => void }) {
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  return (
    <>
      <nav className="absolute top-0 right-0 left-0 z-30 flex items-center justify-between px-4 py-4 sm:px-6 sm:py-6 md:px-10">
        <Animate delay={0} direction="down">
          <span className="text-lg font-semibold tracking-tight text-[var(--text)] sm:text-xl md:text-2xl">
            Beacon
          </span>
        </Animate>

        <Animate delay={100} direction="down" className="hidden lg:block">
          <div className="flex items-center gap-1 rounded-full border border-white/60 bg-[var(--surface)] py-1 pr-1 pl-6 shadow-sm backdrop-blur-md">
            {NAV_LINKS.map((link, i) => (
              <button
                key={link.label}
                onClick={onOpenAuth}
                className={`cursor-pointer px-3 py-2 text-sm transition-colors ${
                  i === 0
                    ? "font-semibold text-[var(--text)]"
                    : "font-medium text-[var(--text-muted)] hover:text-[var(--text)]"
                }`}
              >
                {link.label}
              </button>
            ))}
            <button
              onClick={onOpenAuth}
              className="ml-2 cursor-pointer rounded-full bg-[var(--accent)] px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[var(--accent-hover)]"
            >
              Get started
            </button>
          </div>
        </Animate>

        <div className="flex items-center gap-3 text-[var(--text)] sm:gap-6">
          <button
            onClick={onOpenAuth}
            className="hidden cursor-pointer items-center gap-2 text-sm font-medium transition-opacity hover:opacity-80 sm:flex"
          >
            <UserPlus className="h-4 w-4" />
            Sign up
          </button>
          <button
            onClick={onOpenAuth}
            className="hidden cursor-pointer items-center gap-2 text-sm font-medium transition-opacity hover:opacity-80 sm:flex"
          >
            <LogIn className="h-4 w-4" />
            Log in
          </button>
          <button
            onClick={() => setMenuOpen((v) => !v)}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
            className="relative flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border border-white/60 bg-[var(--surface)] text-[var(--text)] backdrop-blur-md transition-all duration-300 hover:bg-white/90 lg:hidden"
          >
            <Menu
              className={`absolute h-5 w-5 transition-all duration-300 ${
                menuOpen ? "rotate-90 scale-50 opacity-0" : "rotate-0 scale-100 opacity-100"
              }`}
            />
            <X
              className={`absolute h-5 w-5 transition-all duration-300 ${
                menuOpen ? "rotate-0 scale-100 opacity-100" : "-rotate-90 scale-50 opacity-0"
              }`}
            />
          </button>
        </div>
      </nav>

      <div
        onClick={() => setMenuOpen(false)}
        className={`fixed inset-0 z-20 transition-opacity duration-300 lg:hidden ${
          menuOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
        }`}
      >
        <div className="absolute inset-0 bg-[var(--text)]/40 backdrop-blur-sm" />
      </div>

      <div
        className={`fixed top-0 right-0 bottom-0 z-20 w-[85%] max-w-sm bg-white/95 shadow-2xl backdrop-blur-xl transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] lg:hidden ${
          menuOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex h-full flex-col px-8 pt-24 pb-8">
          <div className="flex flex-col gap-1">
            {NAV_LINKS.map((link, i) => (
              <button
                key={link.label}
                onClick={() => {
                  setMenuOpen(false);
                  onOpenAuth();
                }}
                style={{ transitionDelay: menuOpen ? `${150 + i * 70}ms` : "0ms" }}
                className={`border-b border-[var(--text)]/10 py-4 text-left text-2xl font-semibold text-[var(--text)] transition-all duration-500 ${
                  menuOpen ? "translate-x-0 opacity-100" : "translate-x-8 opacity-0"
                }`}
              >
                {link.label}
              </button>
            ))}
          </div>

          <div
            style={{ transitionDelay: menuOpen ? "400ms" : "0ms" }}
            className={`mt-8 flex flex-col gap-4 transition-all duration-500 ${
              menuOpen ? "translate-x-0 opacity-100" : "translate-x-8 opacity-0"
            }`}
          >
            <button
              onClick={() => {
                setMenuOpen(false);
                onOpenAuth();
              }}
              className="flex cursor-pointer items-center gap-2 text-sm font-medium text-[var(--text-muted)]"
            >
              <UserPlus className="h-4 w-4" />
              Sign up
            </button>
            <button
              onClick={() => {
                setMenuOpen(false);
                onOpenAuth();
              }}
              className="flex cursor-pointer items-center gap-2 text-sm font-medium text-[var(--text-muted)]"
            >
              <LogIn className="h-4 w-4" />
              Log in
            </button>
            <button
              onClick={() => {
                setMenuOpen(false);
                onOpenAuth();
              }}
              className="mt-2 cursor-pointer rounded-full bg-[var(--accent)] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[var(--accent-hover)]"
            >
              Get started
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
