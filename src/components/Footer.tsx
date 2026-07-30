import React from 'react';
import { ShieldCheck } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="fixed bottom-0 left-0 right-0 z-40 w-full bg-[#135032] dark:bg-slate-900 border-t border-[#ebbc2e]/30 text-white shadow-lg select-none">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-9 flex items-center justify-between gap-4 text-xs">
        {/* Left Badge: Version */}
        <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-black/20 text-[#ebbc2e] font-mono text-[11px] font-extrabold shrink-0 border border-[#ebbc2e]/20">
          <ShieldCheck className="w-3.5 h-3.5 text-[#ebbc2e]" />
          <span>Versi 1.0.0</span>
        </div>

        {/* Center: Running Marquee Text */}
        <div className="flex-1 overflow-hidden relative h-full flex items-center">
          <div className="animate-marquee font-medium text-slate-100 text-[11px] sm:text-xs tracking-wide">
            🌟 <span className="font-bold text-[#ebbc2e]">ARDIKAMA MEMPAWAH</span> — Selamat Datang di Sistem Kearsipan terintegrasi • Kantor Kementerian Agama Kabupaten Mempawah • LKH, LKB, dan SPT Terintegrasi Cloud Drive 🌟
          </div>
        </div>

        {/* Right Label */}
        <div className="hidden md:flex items-center gap-2 text-[10px] text-slate-200/80 shrink-0 font-medium">
          <span>Kemenag Mempawah © 2026</span>
        </div>
      </div>
    </footer>
  );
};
