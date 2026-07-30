import React from 'react';

interface LogoProps {
  className?: string;
  showText?: boolean;
}

export const Logo: React.FC<LogoProps> = ({ className = 'w-10 h-10', showText = true }) => {
  return (
    <div className="flex items-center gap-3">
      <div className={`relative flex items-center justify-center shrink-0 ${className}`}>
        {/* Vector SVG matching the uploaded ARDIKA digital archive icon */}
        <svg viewBox="0 0 200 220" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full drop-shadow-md">
          {/* Top Arch / Shield in Kemenag Dark Blue */}
          <path
            d="M70 15 C110 15, 180 30, 180 75 C180 95, 140 100, 70 80 Z"
            fill="url(#blueGrad1)"
          />
          {/* Main Archive Filing Stack Body */}
          <rect x="20" y="50" width="90" height="150" rx="12" fill="#0F387A" />
          
          {/* Document Lines in Stack */}
          <rect x="35" y="70" width="60" height="8" rx="4" fill="#FFFFFF" opacity="0.9" />
          <rect x="35" y="86" width="45" height="8" rx="4" fill="#FFFFFF" opacity="0.9" />
          <rect x="35" y="102" width="60" height="8" rx="4" fill="#FFFFFF" opacity="0.9" />
          <rect x="35" y="118" width="50" height="8" rx="4" fill="#FFFFFF" opacity="0.9" />
          <rect x="35" y="134" width="60" height="8" rx="4" fill="#FFFFFF" opacity="0.9" />

          {/* Front Open Folder / Tray in Vibrant Cyan Blue */}
          <path
            d="M60 130 L160 130 C168 130, 175 137, 175 145 L165 200 C165 208, 158 215, 150 215 L50 215 C42 215, 35 208, 38 200 L45 145 C46 137, 53 130, 60 130 Z"
            fill="url(#blueGrad2)"
          />

          {/* Side Handle / Folder Notch */}
          <path
            d="M135 110 C155 110, 175 120, 175 138 C175 150, 155 155, 135 155 Z"
            fill="#0284C7"
          />

          {/* Gradients */}
          <defs>
            <linearGradient id="blueGrad1" x1="70" y1="15" x2="180" y2="100" gradientUnits="userSpaceOnUse">
              <stop stopColor="#0284C7" />
              <stop offset="1" stopColor="#0369A1" />
            </linearGradient>
            <linearGradient id="blueGrad2" x1="40" y1="130" x2="175" y2="215" gradientUnits="userSpaceOnUse">
              <stop stopColor="#0284C7" />
              <stop offset="1" stopColor="#0C4A6E" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {showText && (
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5">
            <span className="font-extrabold text-xl tracking-wider text-slate-900 dark:text-white font-mono">
              ARDIKAMA
            </span>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
              KEMENAG
            </span>
          </div>
          <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 tracking-tight leading-none">
            Arsip Digital Kemenag Mempawah
          </span>
        </div>
      )}
    </div>
  );
};
