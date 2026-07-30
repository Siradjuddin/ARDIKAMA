import React from 'react';
import {
  BarChart3,
  Calendar as CalendarIcon,
  CheckSquare,
  CloudUpload,
  FileText,
  FolderArchive,
  HardDrive,
  Home,
  Plus,
  Settings,
  Users,
  ShieldCheck
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export type TabType = 'dashboard' | 'monitoring' | 'archive' | 'special_archives' | 'calendar' | 'analytics' | 'employees' | 'settings';

interface SidebarProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
  onOpenUploadModal: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  mobileOpen,
  setMobileOpen,
  onOpenUploadModal
}) => {
  const { isAdmin, currentUser } = useAuth();

  const navItems = [
    { id: 'dashboard' as TabType, label: 'Dashboard Utama', icon: Home },
    { id: 'monitoring' as TabType, label: 'Monitoring LKH/LKB/SPT', icon: CheckSquare, badge: 'Realtime' },
    { id: 'archive' as TabType, label: 'Riwayat Arsip Laporan', icon: FolderArchive },
    { id: 'special_archives' as TabType, label: 'Arsip Aktif & Inaktif', icon: HardDrive, badge: 'Drive' },
    { id: 'calendar' as TabType, label: 'Kalender Pelaporan', icon: CalendarIcon },
    { id: 'analytics' as TabType, label: 'Analisis & Statistik', icon: BarChart3 },
    { id: 'employees' as TabType, label: 'Daftar Pegawai (356)', icon: Users },
    ...(isAdmin ? [{ id: 'settings' as TabType, label: 'Pengaturan & Kendali', icon: Settings }] : [])
  ];

  const handleSelect = (id: TabType) => {
    setActiveTab(id);
    setMobileOpen(false);
  };

  const navContent = (
    <div className="flex flex-col h-full py-4 px-3 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800">
      {/* Current User Quick Status */}
      {currentUser && (
        <div className="mb-4 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/60">
          <div className="flex items-center gap-2.5">
            {currentUser.avatarUrl ? (
              <img
                src={currentUser.avatarUrl}
                alt={currentUser.name}
                className="w-8 h-8 rounded-full object-cover border border-emerald-500/40"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center text-xs">
                {currentUser.name.charAt(0)}
              </div>
            )}
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">
                {currentUser.name}
              </span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                {currentUser.nip}
              </span>
            </div>
          </div>
          {isAdmin ? (
            <div className="mt-2 text-[10px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950 px-2 py-0.5 rounded flex items-center justify-center gap-1">
              <ShieldCheck className="w-3 h-3" />
              <span>Akses Administrator Full</span>
            </div>
          ) : (
            <div className="mt-2 text-[10px] font-bold text-blue-700 dark:text-blue-300 bg-blue-100 dark:bg-blue-950/80 px-2 py-0.5 rounded flex items-center justify-center gap-1">
              <span>Pegawai Non-Admin (Upload PDF Only)</span>
            </div>
          )}
        </div>
      )}

      {/* Prominent Upload Action Button */}
      <div className="mb-4">
        <button
          onClick={() => {
            onOpenUploadModal();
            setMobileOpen(false);
          }}
          className="w-full py-2.5 px-3.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-extrabold text-xs shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 transition-transform active:scale-95"
        >
          <CloudUpload className="w-4 h-4" />
          <span>Upload Berkas (PDF)</span>
        </button>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 space-y-1 overflow-y-auto pr-1 scroll-hide">
        <div className="px-3 mb-2 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
          Navigasi Sistem
        </div>

        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => handleSelect(item.id)}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                isActive
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400 dark:text-slate-400'}`} />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span
                  className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold uppercase ${
                    isActive
                      ? 'bg-white/20 text-white'
                      : 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer info */}
      <div className="mt-auto pt-3 pb-1 border-t border-slate-200 dark:border-slate-800 px-3 text-[10px] text-slate-400 text-center shrink-0">
        <div className="inline-block px-2.5 py-1 rounded-md bg-emerald-50 dark:bg-slate-800 border border-emerald-200 dark:border-slate-700">
          <p className="font-bold text-emerald-700 dark:text-emerald-400">ARDIKAMA Versi 1.0.0 (2026)</p>
          <p className="mt-0.5 text-[9px] text-slate-500 dark:text-slate-400">Kemenag Kab. Mempawah</p>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:block w-64 shrink-0 h-[calc(100vh-6.25rem)] sticky top-16">
        {navContent}
      </aside>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
            onClick={() => setMobileOpen(false)}
          />
          <div className="relative w-72 max-w-xs bg-white dark:bg-slate-900 h-full shadow-2xl z-10">
            {navContent}
          </div>
        </div>
      )}
    </>
  );
};
