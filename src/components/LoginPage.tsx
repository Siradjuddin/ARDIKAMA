import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  AlertCircle,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Eye,
  EyeOff,
  Fingerprint,
  Lock,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  User
} from 'lucide-react';

export const LoginPage: React.FC = () => {
  const {
    login,
    loginWithBiometric,
    lockoutRemaining
  } = useAuth();

  const [nipInput, setNipInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Security CAPTCHA challenge
  const [captchaNum1, setCaptchaNum1] = useState(7);
  const [captchaNum2, setCaptchaNum2] = useState(5);
  const [captchaInput, setCaptchaInput] = useState('');
  const [showCaptcha, setShowCaptcha] = useState(false);

  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isBiometricScanning, setIsBiometricScanning] = useState(false);

  // Refresh CAPTCHA challenge
  const refreshCaptcha = () => {
    const n1 = Math.floor(Math.random() * 15) + 3;
    const n2 = Math.floor(Math.random() * 10) + 2;
    setCaptchaNum1(n1);
    setCaptchaNum2(n2);
    setCaptchaInput('');
  };

  useEffect(() => {
    refreshCaptcha();
  }, []);

  const expectedCaptchaResult = (captchaNum1 + captchaNum2).toString();

  const handleStandardLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (lockoutRemaining > 0) {
      setErrorMessage(`Akses terkunci! Tunggu ${lockoutRemaining} detik sebelum mencoba kembali.`);
      return;
    }

    const res = login(
      nipInput,
      passwordInput,
      showCaptcha ? captchaInput : expectedCaptchaResult,
      expectedCaptchaResult
    );

    if (res.success) {
      setSuccessMessage(res.message);
    } else {
      setErrorMessage(res.message);
      setShowCaptcha(true);
      refreshCaptcha();
    }
  };

  const handleBiometricAuth = async () => {
    setIsBiometricScanning(true);
    setErrorMessage('');
    const res = await loginWithBiometric();
    setIsBiometricScanning(false);
    if (!res.success) {
      setErrorMessage(res.message);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#f8f9fa] dark:bg-slate-950 flex flex-col items-center justify-center p-4 font-sans text-slate-800 dark:text-slate-100">
      {/* Privacy Guard Notice Header */}
      <div className="mb-4 flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-200/80 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold shadow-sm">
        <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
        <span>Sistem Pengarsipan Terkunci — Harap Login Terlebih Dahulu</span>
      </div>

      {/* Main Card Container */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-8 sm:p-10 border border-slate-100 dark:border-slate-800 shadow-xl relative">
        {/* Top Circular Emblem Icon */}
        <div className="flex justify-center mb-5">
          <div className="w-16 h-16 rounded-full bg-[#135032] flex items-center justify-center shadow-md">
            <BookOpen className="w-8 h-8 text-[#ebbc2e]" />
          </div>
        </div>

        {/* Heading & Subtitle */}
        <div className="text-center mb-7">
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Arsip Digital Kemenag Mempawah
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1.5 max-w-xs mx-auto leading-relaxed">
            Kantor Kementerian Agama Kabupaten Mempawah. Masuk dengan NIP Pegawai Anda.
          </p>
        </div>

        {/* Lockout Warning Banner */}
        {lockoutRemaining > 0 && (
          <div className="mb-5 p-3.5 rounded-2xl bg-rose-500 text-white shadow-md space-y-1 text-xs animate-pulse">
            <div className="flex items-center gap-1.5 font-extrabold">
              <ShieldAlert className="w-4 h-4 shrink-0" />
              <span>SISTEM TERKUNCI BRUTE-FORCE</span>
            </div>
            <p className="text-[11px]">Percobaan login gagal beruntun. Silakan tunggu:</p>
            <div className="bg-rose-950/80 font-mono text-center py-1 rounded-xl text-base font-extrabold text-amber-300">
              {lockoutRemaining} Detik
            </div>
          </div>
        )}

        {/* Error / Success Notice */}
        {errorMessage && (
          <div className="mb-4 p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/80 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 text-xs flex items-start gap-2 font-bold">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="mb-4 p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs flex items-start gap-2 font-bold">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Main Login Form */}
        <form onSubmit={handleStandardLogin} className="space-y-4">
          {/* Input 1: NIP */}
          <div>
            <label className="text-[11px] font-extrabold uppercase text-slate-700 dark:text-slate-300 tracking-wider block mb-1.5">
              NIP / NOMOR INDUK PEGAWAI
            </label>
            <div className="relative">
              <User className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
              <input
                type="text"
                required
                maxLength={18}
                placeholder="Masukkan NIP Anda"
                value={nipInput}
                onChange={(e) => setNipInput(e.target.value.replace(/\D/g, ''))}
                className="w-full pl-10 pr-3.5 py-3 rounded-xl bg-[#ebf2fa] dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 text-slate-900 dark:text-white font-mono font-bold text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              />
            </div>
          </div>

          {/* Input 2: Kata Sandi */}
          <div>
            <label className="text-[11px] font-extrabold uppercase text-slate-700 dark:text-slate-300 tracking-wider block mb-1.5">
              KATA SANDI LOGIN
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="Masukkan kata sandi"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                className="w-full pl-10 pr-10 py-3 rounded-xl bg-[#ebf2fa] dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 text-slate-900 dark:text-white font-mono font-bold text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-3 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <div className="flex justify-end mt-1">
              <button
                type="button"
                onClick={() => setErrorMessage('Lupa password? Silakan hubungi Admin Arsiparis (Imanuddin / Siradjuddin) untuk meminta reset password ke NIP Anda.')}
                className="text-[10px] font-bold text-blue-600 dark:text-blue-400 hover:underline"
              >
                Lupa Password?
              </button>
            </div>
          </div>

          {/* Optional CAPTCHA if failed attempts */}
          {showCaptcha && (
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-2 text-xs">
              <div className="flex items-center justify-between font-bold text-slate-700 dark:text-slate-300">
                <span>Verifikasi Keamanan CAPTCHA</span>
                <button
                  type="button"
                  onClick={refreshCaptcha}
                  className="text-[10px] text-blue-600 hover:underline flex items-center gap-1"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Acak</span>
                </button>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-3 py-2 bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white font-mono font-bold rounded-lg text-xs">
                  {captchaNum1} + {captchaNum2} =
                </span>
                <input
                  type="text"
                  required
                  placeholder="Jawaban"
                  value={captchaInput}
                  onChange={(e) => setCaptchaInput(e.target.value.trim())}
                  className="flex-1 px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-mono font-bold text-center focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs"
                />
              </div>
            </div>
          )}

          {/* Primary Submit Button */}
          <button
            type="submit"
            disabled={lockoutRemaining > 0}
            className="w-full py-3.5 rounded-xl bg-[#1d61f2] hover:bg-blue-700 text-white font-bold text-sm shadow-md transition-all active:scale-98 disabled:opacity-50 flex items-center justify-center gap-2 mt-2"
          >
            <ArrowRight className="w-4 h-4" />
            <span>Masuk ke Aplikasi</span>
          </button>
        </form>

        {/* Biometric Login Option */}
        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-center">
          <button
            type="button"
            onClick={handleBiometricAuth}
            disabled={isBiometricScanning || lockoutRemaining > 0}
            className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400 font-medium transition-colors"
          >
            <Fingerprint className="w-4 h-4 text-blue-600" />
            <span>{isBiometricScanning ? 'Memindai Sidik Jari...' : 'Masuk dengan Biometrik (Fingerprint / Face ID)'}</span>
          </button>
        </div>
      </div>

      <div className="mt-6 text-[11px] text-slate-400 dark:text-slate-500 font-semibold text-center">
        ARDIKAMA Versi 1.0.0 • Kantor Kementerian Agama Kabupaten Mempawah
      </div>
    </div>
  );
};
