import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useSync } from '../context/SyncContext';
import { connectGoogleDrive, getCachedAccessToken } from '../services/driveService';
import {
  AlertTriangle,
  Check,
  Cloud,
  Database,
  ExternalLink,
  Fingerprint,
  HardDrive,
  Key,
  KeyRound,
  Moon,
  RefreshCw,
  RotateCcw,
  ShieldAlert,
  ShieldCheck,
  Sun,
  Trash2,
  UserPlus,
  Users,
  Wifi
} from 'lucide-react';

export const SettingsView: React.FC = () => {
  const { currentUser, isAdmin, biometricEnabled, enableBiometric } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { isOnline, syncNow, pendingSyncQueue, resetSystemData } = useSync();

  const [apiKeyInput, setApiKeyInput] = useState('AIzaSy_GoogleDrive_KemenagMempawah_2026');
  const [folderIdInput, setFolderIdInput] = useState('1a2b3c4d5e6f7g8h9_ardika');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isConnectingDrive, setIsConnectingDrive] = useState(false);
  const [driveConnected, setDriveConnected] = useState(!!getCachedAccessToken());

  // Confirm Reset Modal
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const handleSaveDriveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const [driveError, setDriveError] = useState<string | null>(null);

  const handleConnectDrive = async () => {
    setIsConnectingDrive(true);
    setDriveError(null);
    try {
      const res = await connectGoogleDrive();
      if (res) {
        setDriveConnected(true);
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } catch (err: any) {
      console.error('Drive connection error:', err);
      setDriveError(err?.message || 'Gagal menghubungkan ke Google Drive.');
    } finally {
      setIsConnectingDrive(false);
    }
  };

  const handleExecuteSystemReset = () => {
    resetSystemData();
    setShowResetConfirm(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <HardDrive className="w-5 h-5 text-emerald-600" />
            <span>Pengaturan Sistem & Kendali Administrator</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Konfigurasi penyimpanan cloud Google Drive, mode tampilan, kendali akun pegawai, dan reset hitungan arsip.
          </p>
        </div>

        {/* Theme Quick Switcher in Header */}
        <div className="flex items-center gap-2 p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
          <button
            onClick={() => theme === 'dark' && toggleTheme()}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              theme === 'light'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sun className="w-3.5 h-3.5 text-amber-500" />
            <span>Mode Terang</span>
          </button>
          <button
            onClick={() => theme === 'light' && toggleTheme()}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              theme === 'dark'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Moon className="w-3.5 h-3.5 text-indigo-400" />
            <span>Mode Gelap</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Google Drive Configuration Card */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-xl bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-300">
              <Cloud className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 dark:text-white text-sm">
                Integrasi Google Drive Storage
              </h3>
              <p className="text-[11px] text-slate-500">Kemenag Kabupaten Mempawah Workspace</p>
            </div>
          </div>

          {isAdmin ? (
            <form onSubmit={handleSaveDriveSettings} className="space-y-3 text-xs">
              <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 font-medium flex items-center justify-between">
                <div>
                  <strong>Status Akun Google Drive:</strong>
                  <p className="text-[11px] font-mono mt-0.5">arsipdigitalmempawah@gmail.com ({driveConnected ? 'Terhubung' : 'Standby / Siap'})</p>
                </div>
                <button
                  type="button"
                  onClick={handleConnectDrive}
                  disabled={isConnectingDrive}
                  className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-[11px] shadow-sm flex items-center gap-1 shrink-0"
                >
                  <ExternalLink className="w-3 h-3" />
                  <span>{isConnectingDrive ? 'Proses...' : 'Otentikasi / Pilih Akun GDrive'}</span>
                </button>
              </div>

              {driveError && (
                <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/80 border border-rose-200 dark:border-rose-800 text-rose-900 dark:text-rose-200 text-xs whitespace-pre-line space-y-2">
                  <div className="flex items-center gap-1.5 font-extrabold text-rose-700 dark:text-rose-400">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>Catatan Izin Google Cloud OAuth (403 Access Denied)</span>
                  </div>
                  <p className="leading-relaxed text-[11px] font-sans">
                    {driveError}
                  </p>
                </div>
              )}

              <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800 text-[11px] text-blue-900 dark:text-blue-200 space-y-1">
                <p className="font-bold">💡 Penting untuk Pengunggahan Berkas:</p>
                <p className="leading-relaxed">
                  Jika sebelumnya berkas Anda terunggah ke akun Google pribadi, klik tombol <strong>Otentikasi / Pilih Akun GDrive</strong> di atas. Jendela login Google akan terbuka dengan layar pemilihan akun. Silakan pilih atau login ke <strong>arsipdigitalmempawah@gmail.com</strong>.
                </p>
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Email Akun Google Drive Penyimpanan
                </label>
                <input
                  type="email"
                  readOnly
                  value="arsipdigitalmempawah@gmail.com"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-mono focus:outline-none cursor-not-allowed"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Google Cloud API Key
                </label>
                <input
                  type="text"
                  value={apiKeyInput}
                  onChange={(e) => setApiKeyInput(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono focus:outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Google Drive Root Folder ID (ARDIKAMA)
                </label>
                <input
                  type="text"
                  value={folderIdInput}
                  onChange={(e) => setFolderIdInput(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono focus:outline-none"
                />
              </div>

              <button
                type="submit"
                className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center justify-center gap-2 transition-all active:scale-95"
              >
                {saveSuccess ? <Check className="w-4 h-4" /> : <HardDrive className="w-4 h-4" />}
                <span>{saveSuccess ? 'Tersimpan!' : 'Simpan Konfigurasi Drive'}</span>
              </button>
            </form>
          ) : (
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 space-y-2 text-xs">
              <span className="font-bold text-slate-800 dark:text-slate-200 block">
                Penyimpanan Terhubung: Google Drive Resmi
              </span>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed text-[11px]">
                Pengaturan hak akses dan pemilihan akun Google Drive tersentralisasi pada Administrator. Seluruh laporan LKH/LKB dan SPT yang Anda unggah akan langsung tersimpan dengan rapi di Google Drive utama Kemenag Mempawah (<strong>arsipdigitalmempawah@gmail.com</strong>).
              </p>
            </div>
          )}
        </div>

        {/* Biometric, Theme & System Reset */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-6">
          {/* Theme Settings Card */}
          <div className="space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 rounded-xl bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-300">
                <Sun className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-900 dark:text-white text-sm">
                  Mode Tampilan Aplikasi (Tema)
                </h3>
                <p className="text-[11px] text-slate-500">Pilih antara Mode Terang dan Mode Gelap</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <button
                onClick={() => theme === 'dark' && toggleTheme()}
                className={`p-3 rounded-2xl border flex items-center gap-3 transition-all ${
                  theme === 'light'
                    ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 font-extrabold shadow-sm'
                    : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-600 flex items-center justify-center">
                  <Sun className="w-4 h-4" />
                </div>
                <div className="text-left text-xs">
                  <p className="font-extrabold">Mode Terang</p>
                  <p className="text-[10px] opacity-75">Tampilan Siang</p>
                </div>
              </button>

              <button
                onClick={() => theme === 'light' && toggleTheme()}
                className={`p-3 rounded-2xl border flex items-center gap-3 transition-all ${
                  theme === 'dark'
                    ? 'border-emerald-500 bg-slate-800 text-white font-extrabold shadow-sm'
                    : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <div className="w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
                  <Moon className="w-4 h-4" />
                </div>
                <div className="text-left text-xs">
                  <p className="font-extrabold">Mode Gelap</p>
                  <p className="text-[10px] opacity-75">Tampilan Malam</p>
                </div>
              </button>
            </div>
          </div>

          {/* Biometric */}
          <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 rounded-xl bg-purple-100 dark:bg-purple-950 text-purple-600 dark:text-purple-300">
                <Fingerprint className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-900 dark:text-white text-sm">
                  Keamanan & Otentikasi Biometrik
                </h3>
                <p className="text-[11px] text-slate-500">Fingerprint / Face ID login cepat</p>
              </div>
            </div>

            <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/50">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Otentikasi Biometrik Perangkat
              </span>
              <button
                onClick={() => enableBiometric(!biometricEnabled)}
                className={`w-12 h-6 rounded-full p-1 transition-colors ${
                  biometricEnabled ? 'bg-emerald-600' : 'bg-slate-300 dark:bg-slate-700'
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full bg-white transition-transform ${
                    biometricEnabled ? 'translate-x-6' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* ADMIN ONLY: Reset Data Hitungan Manual */}
          {isAdmin && (
            <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400">
                <ShieldAlert className="w-5 h-5" />
                <h3 className="font-extrabold text-xs uppercase tracking-wider">
                  Kendali Reset Hitungan Laporan (Admin)
                </h3>
              </div>

              <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900/60 space-y-3 text-xs">
                <p className="text-rose-900 dark:text-rose-200 font-medium leading-relaxed">
                  Fitur ini digunakan untuk <strong>mereset total semua hitungan terupload</strong> pegawai dan membersihkan arsip percobaan agar aplikasi siap digunakan secara resmi di kantor Kemenag Mempawah.
                </p>

                <button
                  onClick={() => setShowResetConfirm(true)}
                  className="w-full py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold shadow-md flex items-center justify-center gap-2 transition-all active:scale-95"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Reset Manual Semua Jumlah Terupload (Ke 0)</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Confirmation Modal for Reset System Data */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="text-center space-y-2">
              <h3 className="font-extrabold text-slate-900 dark:text-white text-base">
                Konfirmasi Reset Total Hitungan Arsip
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Apakah Anda yakin ingin mereset seluruh data hitungan terupload pegawai? Semua rekapitulasi LKH/LKB/SPT dan arsip percobaan akan dikembalikan ke angka 0 (BELUM UPLOAD) untuk penggunaan resmi kantor.
              </p>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                onClick={() => setShowResetConfirm(false)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs"
              >
                Batal
              </button>
              <button
                onClick={handleExecuteSystemReset}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs shadow-lg"
              >
                Ya, Reset Sekarang Ke 0
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

