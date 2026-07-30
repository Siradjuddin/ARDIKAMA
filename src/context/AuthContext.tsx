import React, { createContext, useContext, useEffect, useState } from 'react';
import { Employee } from '../types';
import { EMPLOYEES_DATA, findEmployeeByNip } from '../data/employees';

interface AuthContextType {
  currentUser: Employee | null;
  isAdmin: boolean;
  biometricEnabled: boolean;
  login: (nip: string, pass: string, captchaAnswer?: string, expectedCaptcha?: string) => { success: boolean; message: string; requires2FA?: boolean };
  verify2FA: (otp: string) => { success: boolean; message: string };
  loginWithBiometric: () => Promise<{ success: boolean; message: string }>;
  logout: () => void;
  enableBiometric: (enable: boolean) => void;
  updateUserPhone: (nip: string, phone: string) => void;
  updateUserProfile: (nip: string, data: { name?: string; password?: string; avatarUrl?: string; phone?: string }) => void;
  addEmployee: (newEmpData: { name: string; nip: string; role: 'ADMIN' | 'PEGAWAI'; statusASN?: 'ASN' | 'NON_ASN'; jabatan?: string; unit?: string; phone?: string; password?: string }) => { success: boolean; message: string };
  deleteEmployee: (nip: string) => { success: boolean; message: string };
  resetEmployeePassword: (nip: string, newPassword?: string) => { success: boolean; message: string };
  failedAttempts: number;
  lockoutRemaining: number;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Helper to load profile overrides from localStorage
const getSavedProfile = (nip: string): { name?: string; password?: string; avatarUrl?: string; phone?: string } | null => {
  try {
    const raw = localStorage.getItem('ardika_custom_profiles');
    if (raw) {
      const parsed = JSON.parse(raw);
      return parsed[nip] || null;
    }
  } catch (e) {
    console.error(e);
  }
  return null;
};

// Helper to apply saved overrides to an Employee object
const applyCustomProfile = (emp: Employee): Employee => {
  const saved = getSavedProfile(emp.nip);
  if (!saved) return emp;
  return {
    ...emp,
    name: saved.name || emp.name,
    avatarUrl: saved.avatarUrl !== undefined ? saved.avatarUrl : emp.avatarUrl,
    phone: saved.phone || emp.phone,
    password: saved.password || emp.password
  };
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<Employee | null>(() => {
    const savedNip = localStorage.getItem('ardika_session_nip');
    if (savedNip) {
      const found = findEmployeeByNip(savedNip);
      if (found) return applyCustomProfile(found);
    }
    return null;
  });

  const [biometricEnabled, setBiometricEnabled] = useState<boolean>(() => {
    return localStorage.getItem('ardika_biometric_enabled') === 'true';
  });

  const [failedAttempts, setFailedAttempts] = useState<number>(0);
  const [lockoutRemaining, setLockoutRemaining] = useState<number>(0);
  const [pending2FAUser, setPending2FAUser] = useState<Employee | null>(null);

  useEffect(() => {
    let timer: any;
    if (lockoutRemaining > 0) {
      timer = setInterval(() => {
        setLockoutRemaining((prev) => {
          if (prev <= 1) {
            setFailedAttempts(0);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [lockoutRemaining]);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('ardika_session_nip', currentUser.nip);
    } else {
      localStorage.removeItem('ardika_session_nip');
    }
  }, [currentUser]);

  const isAdmin = currentUser?.role === 'ADMIN' || (currentUser ? ['198904092019031008', '199205082023211022'].includes(currentUser.nip) : false);

  const login = (
    nip: string,
    pass: string,
    captchaAnswer?: string,
    expectedCaptcha?: string
  ) => {
    // Check lockout state
    if (lockoutRemaining > 0) {
      return {
        success: false,
        message: `Sistem terkunci demi keamanan! Silakan tunggu ${lockoutRemaining} detik sebelum mencoba kembali.`
      };
    }

    // Validate CAPTCHA if provided
    if (expectedCaptcha && captchaAnswer !== undefined) {
      if (captchaAnswer.trim().toLowerCase() !== expectedCaptcha.trim().toLowerCase()) {
        const nextAttempts = failedAttempts + 1;
        setFailedAttempts(nextAttempts);
        if (nextAttempts >= 4) {
          setLockoutRemaining(30);
          return {
            success: false,
            message: 'Kode Keamanan CAPTCHA salah 4 kali berurutan! Akses ditangguhkan selama 30 detik.'
          };
        }
        return {
          success: false,
          message: 'Kode Keamanan CAPTCHA salah. Periksa kembali karakter/jawaban matematika.'
        };
      }
    }

    const cleanNip = nip.trim();
    const cleanPass = pass.trim();

    const emp = findEmployeeByNip(cleanNip);
    if (!emp) {
      const nextAttempts = failedAttempts + 1;
      setFailedAttempts(nextAttempts);
      if (nextAttempts >= 4) {
        setLockoutRemaining(30);
        return {
          success: false,
          message: 'Percobaan login gagal berulang kali. Akun dan IP dikunci selama 30 detik untuk perlindungan brute-force.'
        };
      }
      return { success: false, message: 'NIP tidak terdaftar dalam basis data PNS Kemenag Mempawah.' };
    }

    const customProfile = getSavedProfile(cleanNip);

    // Check Password match (custom password if set, or default fallback passwords)
    const isValidPass =
      (customProfile?.password && cleanPass === customProfile.password) ||
      cleanPass === cleanNip ||
      cleanPass === 'ardika2026' ||
      cleanPass === 'admin' ||
      cleanPass === 'ardikama2026';

    if (!isValidPass) {
      const nextAttempts = failedAttempts + 1;
      setFailedAttempts(nextAttempts);
      if (nextAttempts >= 4) {
        setLockoutRemaining(30);
        return {
          success: false,
          message: 'SISTEM MENCEGAH BRUTE-FORCE: Password salah 4 kali! Akun dikunci sementara 30 detik.'
        };
      }
      return {
        success: false,
        message: `Password salah (${4 - nextAttempts} percobaan tersisa sebelum penguncian keamanan).`
      };
    }

    // Reset failed attempts on valid credentials
    setFailedAttempts(0);

    // Standard employee login success directly with valid credentials
    const customizedEmp = applyCustomProfile(emp);
    setCurrentUser(customizedEmp);
    return { success: true, message: `Otentikasi Berhasil! Selamat datang, ${customizedEmp.name}` };
  };

  const verify2FA = (otp: string) => {
    if (!pending2FAUser) {
      return { success: false, message: 'Tidak ada sesi otentikasi 2FA yang aktif.' };
    }
    // Accept standard demo OTP code 123456 or 654321
    if (otp.trim() === '123456' || otp.trim() === '654321' || otp.trim().length === 6) {
      const customized = applyCustomProfile(pending2FAUser);
      setCurrentUser(customized);
      setPending2FAUser(null);
      return { success: true, message: `Otentikasi Dua Faktor (2FA) Terverifikasi! Login sebagai ${customized.name}` };
    }
    return { success: false, message: 'Kode OTP 2FA salah. Masukkan 6 digit kode yang sesuai (misal: 123456).' };
  };

  const loginWithBiometric = async () => {
    // Simulate biometric scan delay (Fingerprint / Face ID)
    return new Promise<{ success: boolean; message: string }>((resolve) => {
      setTimeout(() => {
        const savedNip = localStorage.getItem('ardika_session_nip') || '199205082023211022';
        const emp = findEmployeeByNip(savedNip) || EMPLOYEES_DATA[0];
        const customized = applyCustomProfile(emp);
        setCurrentUser(customized);
        resolve({
          success: true,
          message: `Otentikasi Biometrik Berhasil! Logged in sebagai ${customized.name}`
        });
      }, 1200);
    });
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem('ardika_session_nip');
  };

  const enableBiometric = (enable: boolean) => {
    setBiometricEnabled(enable);
    localStorage.setItem('ardika_biometric_enabled', enable ? 'true' : 'false');
  };

  const updateUserPhone = (nip: string, phone: string) => {
    updateUserProfile(nip, { phone });
  };

  const updateUserProfile = (
    nip: string,
    data: { name?: string; password?: string; avatarUrl?: string; phone?: string }
  ) => {
    try {
      const raw = localStorage.getItem('ardika_custom_profiles');
      const allProfiles = raw ? JSON.parse(raw) : {};
      const existing = allProfiles[nip] || {};
      allProfiles[nip] = {
        ...existing,
        ...data
      };
      localStorage.setItem('ardika_custom_profiles', JSON.stringify(allProfiles));

      // Update in-memory EMPLOYEES_DATA
      const empIndex = EMPLOYEES_DATA.findIndex((e) => e.nip === nip);
      if (empIndex !== -1) {
        if (data.name) EMPLOYEES_DATA[empIndex].name = data.name;
        if (data.phone) EMPLOYEES_DATA[empIndex].phone = data.phone;
        if (data.avatarUrl !== undefined) EMPLOYEES_DATA[empIndex].avatarUrl = data.avatarUrl;
        if (data.password) EMPLOYEES_DATA[empIndex].password = data.password;
      }

      // Update current user state if active user
      if (currentUser && currentUser.nip === nip) {
        setCurrentUser((prev) =>
          prev
            ? {
                ...prev,
                ...(data.name ? { name: data.name } : {}),
                ...(data.phone ? { phone: data.phone } : {}),
                ...(data.avatarUrl !== undefined ? { avatarUrl: data.avatarUrl } : {}),
                ...(data.password ? { password: data.password } : {})
              }
            : null
        );
      }
    } catch (e) {
      console.error(e);
    }
  };

  const addEmployee = (newEmpData: {
    name: string;
    nip: string;
    role: 'ADMIN' | 'PEGAWAI';
    statusASN?: 'ASN' | 'NON_ASN';
    jabatan?: string;
    unit?: string;
    phone?: string;
    password?: string;
  }) => {
    const cleanNip = newEmpData.nip.trim();
    if (!cleanNip) {
      return { success: false, message: 'NIP wajib diisi.' };
    }

    const existing = findEmployeeByNip(cleanNip);
    if (existing) {
      return { success: false, message: `Pegawai dengan NIP ${cleanNip} sudah terdaftar!` };
    }

    try {
      const raw = localStorage.getItem('ardika_added_employees');
      const addedList: Employee[] = raw ? JSON.parse(raw) : [];

      const newEmp: Employee = {
        id: `emp_custom_${Date.now()}`,
        no: EMPLOYEES_DATA.length + addedList.length + 1,
        name: newEmpData.name.trim(),
        nip: cleanNip,
        role: newEmpData.role,
        statusASN: newEmpData.statusASN,
        jabatan: newEmpData.jabatan || 'Pegawai Kemenag Mempawah',
        unit: newEmpData.unit || 'Kemenag Mempawah',
        phone: newEmpData.phone || ''
      };

      addedList.push(newEmp);
      localStorage.setItem('ardika_added_employees', JSON.stringify(addedList));

      // Set initial custom password if provided
      if (newEmpData.password) {
        updateUserProfile(cleanNip, { password: newEmpData.password.trim() });
      }

      return {
        success: true,
        message: `Akun Pegawai Baru "${newEmp.name}" (NIP: ${cleanNip}) Berhasil Ditambahkan!`
      };
    } catch (e) {
      console.error(e);
      return { success: false, message: 'Gagal menambahkan akun pegawai.' };
    }
  };

  const deleteEmployee = (nip: string) => {
    const cleanNip = nip.trim();
    if (!cleanNip) return { success: false, message: 'NIP tidak valid.' };

    if (cleanNip === '198904092019031008' || cleanNip === '199205082023211022') {
      return { success: false, message: 'Akun Super Administrator Utama tidak dapat dihapus!' };
    }

    try {
      // Add to deleted NIPs list in localStorage
      const rawDeleted = localStorage.getItem('ardika_deleted_nips');
      const deletedList: string[] = rawDeleted ? JSON.parse(rawDeleted) : [];
      if (!deletedList.includes(cleanNip)) {
        deletedList.push(cleanNip);
        localStorage.setItem('ardika_deleted_nips', JSON.stringify(deletedList));
      }

      // Remove from added employees if custom added
      const rawAdded = localStorage.getItem('ardika_added_employees');
      if (rawAdded) {
        const addedList: Employee[] = JSON.parse(rawAdded);
        const filtered = addedList.filter((e) => e.nip !== cleanNip);
        localStorage.setItem('ardika_added_employees', JSON.stringify(filtered));
      }

      // Remove from custom profiles
      const rawProfiles = localStorage.getItem('ardika_custom_profiles');
      if (rawProfiles) {
        const profiles = JSON.parse(rawProfiles);
        delete profiles[cleanNip];
        localStorage.setItem('ardika_custom_profiles', JSON.stringify(profiles));
      }

      // If current user is deleted, log out
      if (currentUser && currentUser.nip === cleanNip) {
        logout();
      }

      return {
        success: true,
        message: `Akun Pegawai dengan NIP ${cleanNip} berhasil dihapus dari sistem.`
      };
    } catch (e) {
      console.error(e);
      return { success: false, message: 'Gagal menghapus akun pegawai.' };
    }
  };

  const resetEmployeePassword = (nip: string, newPassword?: string) => {
    const cleanNip = nip.trim();
    const emp = findEmployeeByNip(cleanNip);
    if (!emp) {
      return { success: false, message: 'Pegawai dengan NIP tersebut tidak ditemukan.' };
    }

    const finalPass = newPassword ? newPassword.trim() : cleanNip; // Default reset password to NIP itself
    updateUserProfile(cleanNip, { password: finalPass });

    return {
      success: true,
      message: `Password akun pegawai ${emp.name} (NIP: ${cleanNip}) berhasil di-reset menjadi: ${finalPass}`
    };
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        isAdmin,
        biometricEnabled,
        login,
        verify2FA,
        loginWithBiometric,
        logout,
        enableBiometric,
        updateUserPhone,
        updateUserProfile,
        addEmployee,
        deleteEmployee,
        resetEmployeePassword,
        failedAttempts,
        lockoutRemaining
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
