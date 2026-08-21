"use client";

import { useEffect } from "react";
import { X } from "lucide-react";
import AuthForm from "@/components/AuthForm";

export default function AuthModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center px-4 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] ${
        open ? "visible" : "invisible"
      }`}
    >
      <div
        onClick={onClose}
        className={`absolute inset-0 bg-[#080A19]/90 backdrop-blur-[24px] transition-opacity duration-500 ${
          open ? "opacity-100" : "opacity-0"
        }`}
      />
      <div
        className={`relative w-full max-w-sm rounded-[20px] border border-white/[0.08] bg-[rgba(17,16,15,0.6)] p-6 backdrop-blur-[30px] transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] sm:p-8 ${
          open ? "translate-y-0 scale-100 opacity-100" : "-translate-y-4 scale-[0.97] opacity-0"
        }`}
      >
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute top-4 right-4 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full text-white/60 transition-colors duration-200 hover:bg-white/10 hover:text-white"
        >
          <X className="h-4 w-4" />
        </button>
        <h2 className="text-xl font-[450] text-white">Welcome to Beacon</h2>
        <p className="mt-1 text-sm text-white/60">Track opportunities, never miss a deadline.</p>
        <div className="mt-5">
          <AuthForm />
        </div>
      </div>
    </div>
  );
}
