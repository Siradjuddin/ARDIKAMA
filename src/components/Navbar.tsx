import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useSync } from '../context/SyncContext';
import { maskNip } from '../utils/formatters';
import { Logo } from './Logo';
import {
  Bell,
  Cloud,
  CloudOff,
  Fingerprint,
  FolderCheck,
  LogOut,
  Moon,
  RefreshCw,
  ShieldCheck,
  Sun,
  User,
  Wifi,
  WifiOff
} from 'lucide-react';

interface NavbarProps {
  onOpenNotifications: () => void;
  onOpenLoginModal: () => void;
  onOpenProfileModal: () => void;
  onToggleMobileSidebar: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenNotifications,
  onOpenLoginModal,
  onOpenProfileModal,
  onToggleMobileSidebar
}) => {
  const { currentUser, isAdmin, logout, biometricEnabled, enableBiometric } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { isOnline, pendingSyncQueue, syncNow, notifications, setFcmModalOpen, isDriveConnected, connectDrive } = useSync();
  const [connectingDrive, setConnectingDrive] = React.useState(false);

  const handleQuickConnectDrive = async () => {
    setConnectingDrive(true);
    try {
      await connectDrive();
    } catch (e: any) {
      alert('Gagal menghubungkan Google Drive: ' + (e?.message || e));
    } finally {
      setConnectingDrive(false);
    }
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <header className="sticky top-0 z-30 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Left: Mobile Menu Trigger + Logo */}
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleMobileSidebar}
            className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 lg:hidden focus:outline-none"
            aria-label="Toggle Menu"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <Logo />
        </div>

        {/* Right: Actions (Status, Sync, Theme, Notifications, Auth) */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Online / Drive Status Badge (Shows real Drive connection status) */}
          {isAdmin ? (
            isDriveConnected ? (
              <div
                className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800"
                title="Google Drive arsipdigitalmempawah@gmail.com Terhubung (Aktif)"
              >
                <FolderCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>Drive Connected</span>
              </div>
            ) : (
              <button
                onClick={handleQuickConnectDrive}
                disabled={connectingDrive}
                className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800 transition-colors"
                title="Klik untuk menghubungkan Google Drive arsipdigitalmempawah@gmail.com"
              >
                <CloudOff className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                <span>{connectingDrive ? 'Hubungkan...' : 'Hubungkan Drive'}</span>
              </button>
            )
          ) : (
            <div
              className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold transition-colors border ${
                isOnline
                  ? 'bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'
                  : 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800'
              }`}
            >
              <Wifi className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Sistem Online</span>
            </div>
          )}

          {/* Sync Button with Queue Badge */}
          {pendingSyncQueue.length > 0 && (
            <button
              onClick={syncNow}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium shadow-sm transition-transform active:scale-95"
              title="Sinkronkan data lokal ke cloud"
            >
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              <span>Sync ({pendingSyncQueue.length})</span>
            </button>
          )}

          {/* Biometric Toggle Quick Button */}
          <button
            onClick={() => enableBiometric(!biometricEnabled)}
            className={`p-2 rounded-lg border transition-colors ${
              biometricEnabled
                ? 'bg-blue-50 border-blue-200 text-blue-600 dark:bg-blue-950/80 dark:border-blue-800 dark:text-blue-300'
                : 'bg-slate-50 border-slate-200 text-slate-500 dark:bg-slate-800/80 dark:border-slate-700 dark:text-slate-400'
            }`}
            title={biometricEnabled ? 'Biometrik Aktif (Sidik Jari / Wajah)' : 'Aktifkan Biometrik'}
          >
            <Fingerprint className="w-4 h-4" />
          </button>

          {/* FCM Broadcast Trigger */}
          <button
            onClick={() => setFcmModalOpen(true)}
            className="hidden md:flex items-center gap-1 p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium"
            title="Kirim Notifikasi Push FCM Real-time"
          >
            <Cloud className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>FCM Push</span>
          </button>

          {/* Dark Mode Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="Toggle Dark Mode"
            title={theme === 'dark' ? 'Mode Terang' : 'Mode Gelap'}
          >
            {theme === 'dark' ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5" />}
          </button>

          {/* Notification Bell */}
          <button
            onClick={onOpenNotifications}
            className="relative p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Notifikasi Sistem"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center animate-bounce">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {/* User Profile / Login */}
          {currentUser ? (
            <div className="flex items-center gap-2 pl-2 border-l border-slate-200 dark:border-slate-800">
              <button
                onClick={onOpenProfileModal}
                className="hidden sm:flex flex-col text-right hover:opacity-80 transition-opacity"
                title="Edit Profil & Password"
              >
                <div className="flex items-center justify-end gap-1">
                  <span className="text-xs font-bold text-slate-900 dark:text-white truncate max-w-[140px]">
                    {currentUser.name}
                  </span>
                  {isAdmin && (
                    <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-extrabold bg-blue-100 dark:bg-blue-900/80 text-blue-700 dark:text-blue-300 border border-blue-300 dark:border-blue-700">
                      ADMIN
                    </span>
                  )}
                </div>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                  NIP: {maskNip(currentUser.nip, isAdmin)}
                </span>
              </button>

              <div className="relative group">
                <button
                  onClick={onOpenProfileModal}
                  className="w-9 h-9 rounded-full bg-emerald-600 dark:bg-emerald-700 text-white flex items-center justify-center font-bold text-sm shadow-sm ring-2 ring-emerald-500/20 hover:opacity-90 overflow-hidden"
                  title="Edit Profil & Password Akun"
                >
                  {currentUser.avatarUrl ? (
                    <img
                      src={currentUser.avatarUrl}
                      alt={currentUser.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    currentUser.name.charAt(0)
                  )}
                </button>
              </div>

              <button
                onClick={logout}
                className="p-2 text-rose-600 hover:text-rose-700 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg transition-colors"
                title="Keluar"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenLoginModal}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm transition-colors"
            >
              <User className="w-4 h-4" />
              <span>Masuk NIP</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
