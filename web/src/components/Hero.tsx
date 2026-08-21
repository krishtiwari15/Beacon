"use client";

import { useEffect, useState } from "react";
import { ChevronDown, Menu, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import Animate from "@/components/Animate";
import AuthModal from "@/components/AuthModal";

const BAR_HEIGHTS = [
  23, 40, 53, 40, 33, 14, 7, 17, 75, 65, 88, 75, 65, 47, 33, 88, 4, 7, 9, 14, 95, 65, 79, 37, 7, 40,
  17, 20, 62, 47, 92, 72,
];

const NAV_ITEMS = ["Discover", "AI Eligibility", "Resume Analyzer", "Planner"];

function DashboardPreviewCard({ onOpenAuth }: { onOpenAuth: () => void }) {
  const [count, setCount] = useState<number | null>(null);
  const maxHeight = Math.max(...BAR_HEIGHTS);

  useEffect(() => {
    const supabase = createClient();
    supabase.rpc("opportunity_count").then(({ data, error }) => {
      if (!error && typeof data === "number") setCount(data);
    });
  }, []);

  const axisLabels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  return (
    <Animate delay={900} direction="scale" className="mx-auto w-full max-w-[405px] lg:mx-0">
      <button
        onClick={onOpenAuth}
        className="w-full cursor-pointer rounded-[24px] bg-[rgba(17,16,15,0.35)] p-5 pb-5 text-left backdrop-blur-[20px] transition-transform duration-300 hover:scale-[1.01] sm:rounded-[33px] sm:p-8 sm:pb-6"
      >
        <p className="mb-3 text-[16px] font-[450] leading-[20px] text-white sm:mb-4 sm:text-[20px]">
          Beacon Radar
        </p>

        <p className="mb-2 sm:mb-3">
          <span className="text-[28px] leading-[1] font-[450] text-white sm:text-[46px]">
            {count === null ? "—" : count.toLocaleString()}
          </span>
          <span className="text-[28px] leading-[1] font-[450] text-white/20 sm:text-[46px]"> live</span>
        </p>

        <div className="mb-6 flex items-center gap-[10px] sm:mb-8">
          <span className="rounded-[6px] bg-white/20 px-[6px] py-[7px] text-[12px] leading-[14px] font-[450] text-white sm:text-[14px]">
            🤖 AI-Powered
          </span>
          <span className="text-[12px] leading-[14px] font-[450] text-white/80 opacity-70 sm:text-[14px]">
            Updated daily, scored by AI
          </span>
        </div>

        <div className="relative">
          <div className="flex h-[80px] items-end gap-[1.5px] sm:h-[100px]">
            {BAR_HEIGHTS.map((h, i) => {
              const isWeekend = i % 32 >= 28;
              const heightPercent = (h / maxHeight) * 100;
              return (
                <div
                  key={i}
                  className="animate-bar-grow origin-bottom flex-1 rounded-[0.5px]"
                  style={{
                    height: `${heightPercent}%`,
                    backgroundColor: isWeekend ? "rgba(255,255,255,0.1)" : "white",
                    animationDelay: `${1100 + i * 30}ms`,
                  }}
                />
              );
            })}
          </div>
          <div className="pointer-events-none absolute inset-0">
            {[0, 1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="absolute top-0 bottom-0 w-px bg-white/10"
                style={{ left: `${((i + 1) / 5) * 100}%` }}
              />
            ))}
          </div>
        </div>
        <div className="mt-3 flex justify-between">
          {axisLabels.map((label, i) => (
            <span
              key={label}
              className="text-[9px] leading-[10px] font-[450] text-white/80 sm:text-[10px]"
              style={{ opacity: i >= 5 ? 0.4 : 1 }}
            >
              {label}
            </span>
          ))}
        </div>
      </button>
    </Animate>
  );
}

export default function Hero() {
  const [authOpen, setAuthOpen] = useState(false);

  return (
    <section className="relative h-screen w-full overflow-hidden bg-[#080A19]">
      <div className="relative z-10 flex h-full flex-col">
        <Nav onOpenAuth={() => setAuthOpen(true)} />

        <div className="flex flex-1 items-center py-8">
          <div className="mx-auto flex w-full max-w-[1800px] flex-col gap-10 px-5 sm:px-8 md:px-[82px] lg:flex-row lg:items-center lg:justify-between lg:gap-12">
            <div className="max-w-[593px]">
              <Animate delay={300} direction="up">
                <h1 className="mb-5 text-[36px] leading-[0.95] font-normal text-white sm:mb-8 sm:text-[52px] md:text-[64px] lg:text-[72px]">
                  Track every opportunity before the deadline passes
                </h1>
              </Animate>

              <Animate delay={500} direction="up">
                <p className="mb-7 max-w-[370px] text-[16px] leading-[1.3] font-[450] text-white/80 sm:mb-10 sm:text-[18px] md:text-[20px]">
                  AI-powered eligibility checks, resume scoring, and deadline tracking — all in one
                  place.
                </p>
              </Animate>

              <Animate delay={700} direction="up">
                <div className="flex flex-wrap gap-3 sm:gap-4">
                  <button
                    onClick={() => setAuthOpen(true)}
                    className="h-[46px] cursor-pointer rounded-[12px] bg-[#E9E9E9] px-5 text-[14px] leading-[15.5px] font-[450] text-[#0A0707] transition-opacity hover:opacity-90 sm:h-[51px] sm:px-[27px] sm:text-[15.5px]"
                  >
                    Get started
                  </button>
                  <button
                    onClick={() => setAuthOpen(true)}
                    className="h-[46px] cursor-pointer rounded-[12px] border border-white px-5 text-[14px] leading-[15.5px] font-[450] text-white transition-opacity hover:opacity-80 sm:h-[51px] sm:px-[27px] sm:text-[15.5px]"
                  >
                    Log in
                  </button>
                </div>
              </Animate>
            </div>

            <DashboardPreviewCard onOpenAuth={() => setAuthOpen(true)} />
          </div>
        </div>
      </div>

      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />
    </section>
  );
}

function Nav({ onOpenAuth }: { onOpenAuth: () => void }) {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  return (
    <>
      <nav className="relative z-50 mx-auto flex w-full max-w-[1800px] items-center justify-between px-5 pt-[20px] sm:px-8 sm:pt-[30px] md:px-[82px]">
        <Animate delay={0} direction="down">
          <div className="flex items-center gap-2.5">
            <svg
              width="28"
              height="28"
              viewBox="0 0 256 256"
              fill="none"
              className="sm:h-[32px] sm:w-[32px]"
            >
              <path
                d="M 256 256 L 178 256 C 150.386 256 128 233.614 128 206 L 128 256 L 0 256 L 0 192 C 0 156.654 28.654 128 64 128 C 99.346 128 128 156.654 128 192 L 128 128 L 256 128 Z M 78 0 C 105.614 0 128 22.386 128 50 L 128 0 L 256 0 L 256 64 C 256 99.346 227.346 128 192 128 C 156.654 128 128 99.346 128 64 L 128 128 L 0 128 L 0 0 Z"
                fill="white"
              />
            </svg>
            <span className="text-[22px] leading-none font-[450] tracking-[-0.02em] text-white sm:text-[26px]">
              Beacon
            </span>
          </div>
        </Animate>

        <Animate delay={100} direction="down" className="hidden lg:block">
          <div className="flex h-[52px] items-center gap-[30px] rounded-[11px] bg-[rgba(10,7,7,0.35)] px-6 backdrop-blur-[17px]">
            {NAV_ITEMS.map((item) => (
              <button
                key={item}
                onClick={onOpenAuth}
                className="cursor-pointer text-[14px] leading-[14px] font-[450] text-white/80 transition-colors hover:text-white"
              >
                {item}
              </button>
            ))}
          </div>
        </Animate>

        <Animate delay={200} direction="down" className="hidden lg:block">
          <div className="flex h-[52px] items-center gap-[5px] rounded-[13px] bg-[rgba(0,0,0,0.35)] p-[3px] backdrop-blur-[17px]">
            <button
              onClick={onOpenAuth}
              className="h-[46px] cursor-pointer rounded-[11px] px-6 text-[14px] leading-[14px] font-[450] text-white transition-colors hover:bg-white/5"
            >
              Log in
            </button>
            <button
              onClick={onOpenAuth}
              className="h-[46px] cursor-pointer rounded-[11px] bg-[#E9E9E9] px-6 text-[14px] leading-[14px] font-[450] text-[#0A0707] transition-colors hover:bg-white"
            >
              Get started
            </button>
          </div>
        </Animate>

        <Animate delay={100} direction="down" className="lg:hidden">
          <button
            onClick={() => setIsOpen(!isOpen)}
            aria-label="Toggle menu"
            className="flex h-[44px] w-[44px] cursor-pointer items-center justify-center rounded-[11px] bg-[rgba(10,7,7,0.35)] backdrop-blur-[17px] transition-colors hover:bg-white/10"
          >
            <div className="relative h-5 w-5">
              <Menu
                className={`absolute inset-0 h-5 w-5 text-white transition-all duration-300 ease-out ${
                  isOpen ? "rotate-90 scale-75 opacity-0" : "rotate-0 scale-100 opacity-100"
                }`}
              />
              <X
                className={`absolute inset-0 h-5 w-5 text-white transition-all duration-300 ease-out ${
                  isOpen ? "rotate-0 scale-100 opacity-100" : "-rotate-90 scale-75 opacity-0"
                }`}
              />
            </div>
          </button>
        </Animate>
      </nav>

      <div
        className={`fixed inset-0 z-40 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] lg:hidden ${
          isOpen ? "visible" : "invisible"
        }`}
      >
        <div
          onClick={() => setIsOpen(false)}
          className={`absolute inset-0 bg-[#080A19]/90 backdrop-blur-[24px] transition-opacity duration-500 ${
            isOpen ? "opacity-100" : "opacity-0"
          }`}
        />
        <div
          className={`absolute top-[76px] right-4 left-4 origin-top rounded-[20px] border border-white/[0.06] bg-[rgba(17,16,15,0.6)] p-6 backdrop-blur-[30px] transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] sm:top-[86px] sm:right-6 sm:left-6 sm:p-8 ${
            isOpen ? "translate-y-0 scale-100 opacity-100" : "-translate-y-4 scale-[0.97] opacity-0"
          }`}
        >
          <div className="flex flex-col gap-1">
            {NAV_ITEMS.map((item, i) => (
              <button
                key={item}
                onClick={() => {
                  setIsOpen(false);
                  onOpenAuth();
                }}
                style={{ transitionDelay: isOpen ? `${100 + i * 50}ms` : "0ms" }}
                className={`flex w-full cursor-pointer items-center justify-between rounded-[12px] px-4 py-4 text-left text-[18px] font-[450] text-white/90 transition-all duration-300 hover:bg-white/[0.06] ${
                  isOpen ? "translate-x-0 opacity-100" : "-translate-x-3 opacity-0"
                }`}
              >
                {item}
                {i === 0 && <ChevronDown className="h-4 w-4 opacity-50" />}
              </button>
            ))}
          </div>

          <div className="my-5 h-px bg-white/10" />

          <div
            className={`flex flex-col gap-3 transition-all duration-300 ${
              isOpen ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"
            }`}
            style={{ transitionDelay: isOpen ? "350ms" : "0ms" }}
          >
            <button
              onClick={() => {
                setIsOpen(false);
                onOpenAuth();
              }}
              className="h-[50px] w-full cursor-pointer rounded-[12px] bg-[#E9E9E9] text-[15px] font-[450] text-[#0A0707] transition-colors hover:bg-white"
            >
              Get started
            </button>
            <button
              onClick={() => {
                setIsOpen(false);
                onOpenAuth();
              }}
              className="h-[50px] w-full cursor-pointer rounded-[12px] border border-white/30 text-[15px] font-[450] text-white transition-colors hover:bg-white/5"
            >
              Log in
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
