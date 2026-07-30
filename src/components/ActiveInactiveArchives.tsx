import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSync } from '../context/SyncContext';
import {
  BookOpen,
  Building2,
  Cloud,
  DollarSign,
  ExternalLink,
  FolderArchive,
  FolderCheck,
  FolderMinus,
  GraduationCap,
  HardDrive,
  HeartHandshake,
  Key,
  KeyRound,
  Layers,
  Lock,
  Plus,
  Search,
  ShieldCheck,
  Trash2,
  Unlock,
  Upload,
  X,
  Info
} from 'lucide-react';

export type SpecialCategory =
  | 'Keuangan'
  | 'Pendidikan (PAI, Madrasah, PD Pontren, Kristen, Katolik, Buddha)'
  | 'Pendidikan (PAI, Madrasah, PD Pontren)'
  | 'Keagamaan'
  | 'BMN'
  | 'Dokumentasi'
  | 'Kristen'
  | 'Katolik'
  | 'Buddha';

export type SpecialArchiveType = 'AKTIF' | 'INAKTIF';

export interface SpecialArchiveItem {
  id: string;
  title: string;
  codeNumber: string;
  category: SpecialCategory;
  archiveType: SpecialArchiveType;
  year: number;
  driveUrl: string;
  fileSize: string;
  fileCount: number;
  unit: string;
  description: string;
  uploadedBy: string;
  uploadedAt: string;
}

const INITIAL_SPECIAL_ARCHIVES: SpecialArchiveItem[] = [
  {
    id: 'sp-1',
    title: 'Keuangan',
    codeNumber: 'KU.01.02/2026',
    category: 'Keuangan',
    archiveType: 'AKTIF',
    year: 2026,
    driveUrl: 'https://drive.google.com/drive/u/0/folders/1a2b3c4d5e6f7g8h9_keuangan',
    fileSize: '14.2 MB',
    fileCount: 18,
    unit: 'Subbag TU / Perencanaan & Keuangan',
    description: 'Folder Arsip Digital Keuangan, DIPA, Realisasi Anggaran & LPJ Satker Kemenag Mempawah.',
    uploadedBy: 'SIRADJUDDIN S.Pd (Admin)',
    uploadedAt: '2026-07-24'
  },
  {
    id: 'sp-2',
    title: 'Pendidikan (PAI, Madrasah, PD Pontren, Kristen, Katolik, Buddha)',
    codeNumber: 'PEND.02.01/2026',
    category: 'Pendidikan (PAI, Madrasah, PD Pontren, Kristen, Katolik, Buddha)',
    archiveType: 'AKTIF',
    year: 2026,
    driveUrl: 'https://drive.google.com/drive/u/0/folders/1a2b3c4d5e6f7g8h9_pendidikan',
    fileSize: '28.5 MB',
    fileCount: 34,
    unit: 'Seksi Pend. Agama Islam, Penmad, Pontren & Agama Kristen/Katolik/Buddha',
    description: 'Folder Arsip Digital Seksi PAI, Pendidikan Madrasah, Tunjangan Guru, Pondok Pesantren, serta Pendidikan Agama Kristen, Katolik & Buddha.',
    uploadedBy: 'SIRADJUDDIN S.Pd (Admin)',
    uploadedAt: '2026-07-20'
  },
  {
    id: 'sp-3',
    title: 'Keagamaan',
    codeNumber: 'KAG.03.01/2026',
    category: 'Keagamaan',
    archiveType: 'AKTIF',
    year: 2026,
    driveUrl: 'https://drive.google.com/drive/u/0/folders/1a2b3c4d5e6f7g8h9_keagamaan',
    fileSize: '19.8 MB',
    fileCount: 22,
    unit: 'Seksi Bimas Islam & PHU',
    description: 'Folder Arsip Digital Seksi Bimas Islam, Ormas Keagamaan, Rumah Ibadah & Penyelenggara Haji.',
    uploadedBy: 'IMANUDDIN S.S.T.Ars (Admin)',
    uploadedAt: '2026-07-15'
  },
  {
    id: 'sp-4',
    title: 'BMN',
    codeNumber: 'BMN.04.01/2026',
    category: 'BMN',
    archiveType: 'AKTIF',
    year: 2026,
    driveUrl: 'https://drive.google.com/drive/u/0/folders/1a2b3c4d5e6f7g8h9_bmn',
    fileSize: '12.4 MB',
    fileCount: 15,
    unit: 'Pengelola BMN Subbag TU',
    description: 'Folder Arsip Digital Barang Milik Negara (BMN), Aset Tanah, Bangunan & Inventaris Kantor.',
    uploadedBy: 'SIRADJUDDIN S.Pd (Admin)',
    uploadedAt: '2026-07-10'
  },
  {
    id: 'sp-5',
    title: 'Dokumentasi',
    codeNumber: 'DOK.05.01/2026',
    category: 'Dokumentasi',
    archiveType: 'AKTIF',
    year: 2026,
    driveUrl: 'https://drive.google.com/drive/u/0/folders/1a2b3c4d5e6f7g8h9_dokumentasi',
    fileSize: '45.0 MB',
    fileCount: 50,
    unit: 'Humas & Protokoler',
    description: 'Folder Arsip Digital Dokumentasi Liputan Acara, Foto Pelantikan & Galeri Kearsipan Kantor.',
    uploadedBy: 'IMANUDDIN S.S.T.Ars (Admin)',
    uploadedAt: '2026-07-05'
  }
];

export const ActiveInactiveArchives: React.FC = () => {
  const { currentUser, isAdmin } = useAuth();
  const { sendPushNotification } = useSync();

  // Active or Inactive archive subtab
  const [currentSubTab, setCurrentSubTab] = useState<SpecialArchiveType>('AKTIF');

  // Categories filter
  const [selectedCategory, setSelectedCategory] = useState<string>('Semua');
  const [searchQuery, setSearchQuery] = useState('');

  // Storage for items
  const [archiveItems, setArchiveItems] = useState<SpecialArchiveItem[]>(() => {
    const saved = localStorage.getItem('ardika_special_archives_v2');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return parsed.map((item: any) => {
          if (
            item.category === 'Pendidikan (PAI, Madrasah, PD Pontren)' ||
            item.title === 'Pendidikan (PAI, Madrasah, PD Pontren)'
          ) {
            return {
              ...item,
              title: 'Pendidikan (PAI, Madrasah, PD Pontren, Kristen, Katolik, Buddha)',
              category: 'Pendidikan (PAI, Madrasah, PD Pontren, Kristen, Katolik, Buddha)',
              unit: 'Seksi Pend. Agama Islam, Penmad, Pontren & Agama Kristen/Katolik/Buddha',
              description: 'Folder Arsip Digital Seksi PAI, Pendidikan Madrasah, Tunjangan Guru, Pondok Pesantren, serta Pendidikan Agama Kristen, Katolik & Buddha.'
            };
          }
          return item;
        });
      } catch (e) {
        return INITIAL_SPECIAL_ARCHIVES;
      }
    }
    return INITIAL_SPECIAL_ARCHIVES;
  });

  // Access code for non-admin access
  const [adminCode, setAdminCode] = useState<string>(() => {
    return localStorage.getItem('ardika_arsiparis_passcode') || 'ARSIP2026';
  });

  // Session state if regular employee has unlocked access via admin code
  const [isCodeUnlocked, setIsCodeUnlocked] = useState<boolean>(() => {
    return sessionStorage.getItem('ardika_code_unlocked') === 'true';
  });

  // Code verification modal state
  const [accessModalOpen, setAccessModalOpen] = useState(false);
  const [targetItemToOpen, setTargetItemToOpen] = useState<SpecialArchiveItem | null>(null);
  const [enteredCode, setEnteredCode] = useState('');
  const [codeError, setCodeError] = useState('');

  // Admin Code Management Modal
  const [adminCodeModalOpen, setAdminCodeModalOpen] = useState(false);
  const [newAdminCodeInput, setNewAdminCodeInput] = useState(adminCode);

  // Modal State for adding new active/inactive archive (Admin Only)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [titleInput, setTitleInput] = useState('');
  const [codeNumberInput, setCodeNumberInput] = useState('');
  const [categoryInput, setCategoryInput] = useState<SpecialCategory>('Keuangan');
  const [archiveTypeInput, setArchiveTypeInput] = useState<SpecialArchiveType>('AKTIF');
  const [yearInput, setYearInput] = useState<number>(new Date().getFullYear());
  const [driveUrlInput, setDriveUrlInput] = useState('');
  const [fileSizeInput, setFileSizeInput] = useState('15.0 MB');
  const [fileCountInput, setFileCountInput] = useState<number>(12);
  const [unitInput, setUnitInput] = useState('Subbag TU Kemenag Mempawah');
  const [descriptionInput, setDescriptionInput] = useState('');

  // Persist items
  useEffect(() => {
    localStorage.setItem('ardika_special_archives_v2', JSON.stringify(archiveItems));
  }, [archiveItems]);

  // Persist admin passcode
  useEffect(() => {
    localStorage.setItem('ardika_arsiparis_passcode', adminCode);
  }, [adminCode]);

  // Handle open Cloud Arsiparis
  const handleOpenCloudArsiparis = (item: SpecialArchiveItem) => {
    // If admin or already unlocked code in session, open directly
    if (isAdmin || isCodeUnlocked) {
      window.open(item.driveUrl, '_blank', 'noopener,noreferrer');
      return;
    }

    // Otherwise prompt regular employee for Admin Access Code
    setTargetItemToOpen(item);
    setEnteredCode('');
    setCodeError('');
    setAccessModalOpen(true);
  };

  const handleVerifyCodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (enteredCode.trim().toUpperCase() === adminCode.trim().toUpperCase()) {
      setIsCodeUnlocked(true);
      sessionStorage.setItem('ardika_code_unlocked', 'true');
      setAccessModalOpen(false);
      
      sendPushNotification(
        'Kode Akses Berhasil',
        'Izin kode dari admin terverifikasi! Mengakses Cloud Arsiparis.',
        'SUCCESS'
      );

      if (targetItemToOpen) {
        window.open(targetItemToOpen.driveUrl, '_blank', 'noopener,noreferrer');
      }
    } else {
      setCodeError('Kode Izin Akses Salah. Silakan minta kode izin terbaru dari Admin/Arsiparis.');
    }
  };

  const handleUpdateAdminCode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAdminCodeInput.trim()) return;
    setAdminCode(newAdminCodeInput.trim().toUpperCase());
    setAdminCodeModalOpen(false);
    sendPushNotification(
      'Kode Izin Akses Diperbarui',
      `Kode Izin Akses Pegawai baru: ${newAdminCodeInput.trim().toUpperCase()}`,
      'SUCCESS'
    );
  };

  const handleAddArchive = (e: React.FormEvent) => {
    e.preventDefault();
    if (!titleInput.trim()) return;

    const newItem: SpecialArchiveItem = {
      id: `sp-${Date.now()}`,
      title: titleInput.trim(),
      codeNumber: codeNumberInput.trim() || `ARC.${Date.now().toString().slice(-4)}/2026`,
      category: categoryInput,
      archiveType: archiveTypeInput,
      year: yearInput,
      driveUrl: driveUrlInput.trim() || 'https://drive.google.com/drive/my-drive',
      fileSize: fileSizeInput || '10.0 MB',
      fileCount: fileCountInput || 1,
      unit: unitInput.trim() || 'Kantor Kemenag Kab. Mempawah',
      description: descriptionInput.trim() || 'Folder Kearsipan Digital Resmi Kemenag Mempawah',
      uploadedBy: currentUser ? `${currentUser.name} (Admin)` : 'Administrator',
      uploadedAt: new Date().toISOString().split('T')[0]
    };

    setArchiveItems((prev) => [newItem, ...prev]);
    setIsAddModalOpen(false);

    // Reset inputs
    setTitleInput('');
    setCodeNumberInput('');
    setDriveUrlInput('');
    setDescriptionInput('');

    sendPushNotification(
      'Folder Arsip Ditambahkan',
      `Berhasil menambahkan "${newItem.title}" di Cloud Arsiparis.`,
      'SUCCESS'
    );
  };

  const handleDeleteItem = (id: string, title: string) => {
    if (confirm(`Apakah Anda yakin ingin menghapus folder/arsip "${title}"?`)) {
      setArchiveItems((prev) => prev.filter((item) => item.id !== id));
      sendPushNotification('Arsip Dihapus', `Folder "${title}" telah dihapus.`, 'WARNING');
    }
  };

  const categoriesList: { label: string; val: string; icon: any }[] = [
    { label: 'Semua Kategori', val: 'Semua', icon: Layers },
    { label: 'Keuangan', val: 'Keuangan', icon: DollarSign },
    { label: 'Pendidikan', val: 'Pendidikan (PAI, Madrasah, PD Pontren, Kristen, Katolik, Buddha)', icon: GraduationCap },
    { label: 'Keagamaan', val: 'Keagamaan', icon: HeartHandshake },
    { label: 'BMN', val: 'BMN', icon: Building2 },
    { label: 'Dokumentasi', val: 'Dokumentasi', icon: BookOpen },
    { label: 'Kristen', val: 'Kristen', icon: GraduationCap },
    { label: 'Katolik', val: 'Katolik', icon: GraduationCap },
    { label: 'Buddha', val: 'Buddha', icon: GraduationCap }
  ];

  // Filter items
  const filteredItems = archiveItems
    .filter((item) => item.archiveType === currentSubTab)
    .filter((item) => selectedCategory === 'Semua' || item.category === selectedCategory)
    .filter((item) =>
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.codeNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase())
    );

  const activeCount = archiveItems.filter((i) => i.archiveType === 'AKTIF').length;
  const inactiveCount = archiveItems.filter((i) => i.archiveType === 'INAKTIF').length;

  return (
    <div className="space-y-6">
      {/* Top Banner Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 text-white p-6 sm:p-8 shadow-xl">
        <div className="relative z-10 max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-xs font-semibold text-emerald-300 border border-white/10">
            <HardDrive className="w-3.5 h-3.5 text-emerald-400" />
            <span>Manajemen Klasifikasi Cloud Arsiparis Kemenag</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Arsip Aktif & Arsip Inaktif
          </h1>
          <p className="text-xs sm:text-sm text-emerald-100/90 leading-relaxed">
            Penyimpanan dan klasifikasi kearsipan digital tersinkronisasi folder Google Drive meliputi Keuangan, Pendidikan (PAI, Madrasah, PD Pontren, Kristen, Katolik, Buddha), Keagamaan, BMN, dan Dokumentasi.
          </p>

          {/* Action Bar */}
          <div className="pt-3 flex flex-wrap items-center gap-3">
            {isAdmin ? (
              <>
                <button
                  onClick={() => setIsAddModalOpen(true)}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold text-xs shadow-lg transition-transform active:scale-95"
                >
                  <Upload className="w-4 h-4" />
                  <span>Unggah File / Folder Arsip (Khusus Admin)</span>
                </button>

                <button
                  onClick={() => {
                    setNewAdminCodeInput(adminCode);
                    setAdminCodeModalOpen(true);
                  }}
                  className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/20 font-bold text-xs backdrop-blur-md transition-all"
                  title="Atur Kode Izin Akses untuk Pegawai Biasa"
                >
                  <KeyRound className="w-4 h-4 text-emerald-300" />
                  <span>
                    Kode Izin Akses Pegawai: <strong className="font-mono text-emerald-300 ml-1">{adminCode}</strong>
                  </span>
                </button>
              </>
            ) : (
              <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900/80 border border-slate-700/80 text-xs text-slate-300">
                <Info className="w-4 h-4 text-amber-400 shrink-0" />
                <span>
                  Menu unggah khusus akun <strong>Admin</strong>. Pegawai biasa dapat membuka arsip dengan <strong>Kode Izin dari Admin</strong>.
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main SubTabs (Aktif vs Inaktif) */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={() => setCurrentSubTab('AKTIF')}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-extrabold transition-all ${
              currentSubTab === 'AKTIF'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <FolderCheck className="w-4 h-4" />
            <span>Arsip Aktif</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] bg-white/20 text-white font-mono">
              {activeCount}
            </span>
          </button>

          <button
            onClick={() => setCurrentSubTab('INAKTIF')}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-extrabold transition-all ${
              currentSubTab === 'INAKTIF'
                ? 'bg-amber-600 text-white shadow-md shadow-amber-600/20'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <FolderArchive className="w-4 h-4" />
            <span>Arsip Inaktif (Retensi)</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] bg-white/20 text-white font-mono">
              {inactiveCount}
            </span>
          </button>
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari nama folder, kode, deskripsi..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
      </div>

      {/* Categories Pill Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {categoriesList.map((cat) => {
          const Icon = cat.icon;
          const isActive = selectedCategory === cat.val;
          return (
            <button
              key={cat.val}
              onClick={() => setSelectedCategory(cat.val)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold shrink-0 transition-all ${
                isActive
                  ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-sm'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{cat.label}</span>
            </button>
          );
        })}
      </div>

      {/* Archive Folder Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredItems.length === 0 ? (
          <div className="col-span-full p-12 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
            <FolderMinus className="w-10 h-10 text-slate-400 mx-auto" />
            <h4 className="font-extrabold text-slate-800 dark:text-slate-200 text-sm">
              Belum Ada Folder Arsip
            </h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              {selectedCategory !== 'Semua'
                ? `Tidak ditemukan berkas untuk kategori "${selectedCategory}".`
                : 'Belum ada folder yang diklasifikasikan.'}
            </p>
          </div>
        ) : (
          filteredItems.map((item) => (
            <div
              key={item.id}
              className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4 group"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <span className="px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 font-extrabold text-[10px] tracking-wide uppercase">
                    {item.category}
                  </span>
                  <span className="font-mono text-[10px] text-slate-400 font-bold bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                    TA {item.year}
                  </span>
                </div>

                <div>
                  <h3 className="font-extrabold text-slate-900 dark:text-white text-base leading-snug group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                    {item.title}
                  </h3>
                  <p className="font-mono text-[11px] text-slate-500 dark:text-slate-400 mt-1 font-semibold">
                    Kode Klasifikasi: {item.codeNumber}
                  </p>
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  {item.description}
                </p>

                {/* Drive Size & File Count Metrics */}
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 text-xs space-y-2 font-medium">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 dark:text-slate-400">Ukuran Folder:</span>
                    <span className="font-mono font-extrabold text-emerald-600 dark:text-emerald-400">
                      {item.fileSize}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 dark:text-slate-400">Jumlah File di Drive:</span>
                    <span className="font-mono font-extrabold text-slate-800 dark:text-slate-200">
                      {item.fileCount} Berkas
                    </span>
                  </div>
                  <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 dark:border-slate-700/60 text-[11px]">
                    <span className="text-slate-400">Unit Pengelola:</span>
                    <span className="font-bold text-slate-700 dark:text-slate-300 truncate max-w-[180px]">
                      {item.unit}
                    </span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                <button
                  onClick={() => handleOpenCloudArsiparis(item)}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-sm transition-all active:scale-98"
                >
                  <Cloud className="w-4 h-4 text-emerald-200" />
                  <span>Buka di Cloud Arsiparis</span>
                  <ExternalLink className="w-3.5 h-3.5 opacity-80" />
                </button>

                {isAdmin && (
                  <button
                    onClick={() => handleDeleteItem(item.id, item.title)}
                    className="p-2.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/60 rounded-xl transition-colors"
                    title="Hapus Folder"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal Prompt Access Code for Regular Employees */}
      {accessModalOpen && targetItemToOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
                  <Lock className="w-5 h-5" />
                </div>
                <h3 className="font-extrabold text-slate-900 dark:text-white text-base">
                  Izin Kode Akses Admin
                </h3>
              </div>
              <button
                onClick={() => setAccessModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                Untuk membuka folder <strong>"{targetItemToOpen.title}"</strong> di Cloud Arsiparis, silakan masukkan Kode Izin Akses dari Admin.
              </p>

              <form onSubmit={handleVerifyCodeSubmit} className="space-y-4 pt-2">
                <div>
                  <label className="font-extrabold text-slate-700 dark:text-slate-300 block mb-1 uppercase tracking-wider text-[10px]">
                    Masukkan Kode Akses Admin *
                  </label>
                  <div className="relative">
                    <Key className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      autoFocus
                      placeholder="Contoh: ARSIP2026"
                      value={enteredCode}
                      onChange={(e) => {
                        setEnteredCode(e.target.value);
                        setCodeError('');
                      }}
                      className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 font-mono font-bold text-slate-900 dark:text-white uppercase tracking-wider focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  {codeError && (
                    <p className="text-rose-600 dark:text-rose-400 text-[11px] font-bold mt-1.5">
                      {codeError}
                    </p>
                  )}
                </div>

                <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800/80 text-[11px] text-slate-500 leading-normal flex items-start gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span>
                    Minta kode izin akses langsung kepada Admin / Arsiparis Kemenag Mempawah apabila Anda belum memilikinya.
                  </span>
                </div>

                <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setAccessModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-400 font-bold"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold shadow-md transition-all"
                  >
                    Verifikasi Kode & Buka
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal Edit Admin Code (Admin Only) */}
      {adminCodeModalOpen && isAdmin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold">
                  <KeyRound className="w-5 h-5" />
                </div>
                <h3 className="font-extrabold text-slate-900 dark:text-white text-base">
                  Pengaturan Kode Izin Akses Admin
                </h3>
              </div>
              <button
                onClick={() => setAdminCodeModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateAdminCode} className="space-y-4 text-xs">
              <div>
                <label className="font-extrabold text-slate-700 dark:text-slate-300 block mb-1 uppercase tracking-wider text-[10px]">
                  Kode Izin Akses Pegawai Baru *
                </label>
                <input
                  type="text"
                  required
                  value={newAdminCodeInput}
                  onChange={(e) => setNewAdminCodeInput(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 font-mono font-extrabold text-slate-900 dark:text-white uppercase tracking-wider focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Pegawai biasa wajib memasukkan kode ini saat ingin mengakses Cloud Arsiparis.
                </p>
              </div>

              <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setAdminCodeModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-400 font-bold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold shadow-md transition-all"
                >
                  Simpan Kode Baru
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Add New Special Archive (Admin Only) */}
      {isAddModalOpen && isAdmin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold">
                  <Plus className="w-5 h-5" />
                </div>
                <h3 className="font-extrabold text-slate-900 dark:text-white text-base">
                  Unggah File / Folder Arsip (Khusus Admin)
                </h3>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddArchive} className="space-y-4 text-xs">
              <div>
                <label className="font-extrabold text-slate-700 dark:text-slate-300 block mb-1 uppercase tracking-wider text-[10px]">
                  Judul Folder / Berkas Arsip *
                </label>
                <input
                  type="text"
                  required
                  placeholder="misal: Keuangan / Pendidikan (PAI, Madrasah, PD Pontren)"
                  value={titleInput}
                  onChange={(e) => setTitleInput(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-extrabold text-slate-700 dark:text-slate-300 block mb-1 uppercase tracking-wider text-[10px]">
                    Status Arsip *
                  </label>
                  <select
                    value={archiveTypeInput}
                    onChange={(e) => setArchiveTypeInput(e.target.value as SpecialArchiveType)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 font-bold text-slate-900 dark:text-white"
                  >
                    <option value="AKTIF">Arsip Aktif</option>
                    <option value="INAKTIF">Arsip Inaktif (Retensi)</option>
                  </select>
                </div>

                <div>
                  <label className="font-extrabold text-slate-700 dark:text-slate-300 block mb-1 uppercase tracking-wider text-[10px]">
                    Kategori Bidang *
                  </label>
                  <select
                    value={categoryInput}
                    onChange={(e) => setCategoryInput(e.target.value as SpecialCategory)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 font-bold text-slate-900 dark:text-white"
                  >
                    <option value="Keuangan">Keuangan</option>
                    <option value="Pendidikan (PAI, Madrasah, PD Pontren, Kristen, Katolik, Buddha)">Pendidikan (PAI, Madrasah, PD Pontren, Kristen, Katolik, Buddha)</option>
                    <option value="Keagamaan">Keagamaan</option>
                    <option value="BMN">BMN</option>
                    <option value="Dokumentasi">Dokumentasi</option>
                    <option value="Kristen">Kristen</option>
                    <option value="Katolik">Katolik</option>
                    <option value="Buddha">Buddha</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-extrabold text-slate-700 dark:text-slate-300 block mb-1 uppercase tracking-wider text-[10px]">
                    Nomor / Kode Klasifikasi
                  </label>
                  <input
                    type="text"
                    placeholder="KU.01.02/2026"
                    value={codeNumberInput}
                    onChange={(e) => setCodeNumberInput(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 font-mono text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="font-extrabold text-slate-700 dark:text-slate-300 block mb-1 uppercase tracking-wider text-[10px]">
                    Tahun Anggaran / Terbit
                  </label>
                  <input
                    type="number"
                    value={yearInput}
                    onChange={(e) => setYearInput(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 font-mono text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-extrabold text-slate-700 dark:text-slate-300 block mb-1 uppercase tracking-wider text-[10px]">
                    Ukuran Folder / Size *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="misal: 14.2 MB"
                    value={fileSizeInput}
                    onChange={(e) => setFileSizeInput(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 font-mono text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="font-extrabold text-slate-700 dark:text-slate-300 block mb-1 uppercase tracking-wider text-[10px]">
                    Jumlah File di Drive *
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={fileCountInput}
                    onChange={(e) => setFileCountInput(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 font-mono text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="font-extrabold text-slate-700 dark:text-slate-300 block mb-1 uppercase tracking-wider text-[10px]">
                  Tautan Cloud Drive / Folder URL *
                </label>
                <input
                  type="url"
                  required
                  placeholder="https://drive.google.com/drive/u/0/folders/..."
                  value={driveUrlInput}
                  onChange={(e) => setDriveUrlInput(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 font-mono text-slate-900 dark:text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="font-extrabold text-slate-700 dark:text-slate-300 block mb-1 uppercase tracking-wider text-[10px]">
                  Unit Pengelola / Seksi
                </label>
                <input
                  type="text"
                  placeholder="Subbag TU / Seksi Penmad / Bimas Islam"
                  value={unitInput}
                  onChange={(e) => setUnitInput(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="font-extrabold text-slate-700 dark:text-slate-300 block mb-1 uppercase tracking-wider text-[10px]">
                  Keterangan / Deskripsi Ringkas
                </label>
                <textarea
                  rows={2}
                  placeholder="Rangkuman isi dokumen arsip..."
                  value={descriptionInput}
                  onChange={(e) => setDescriptionInput(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-400 font-bold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold shadow-md transition-all"
                >
                  Simpan ke Cloud Arsiparis
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
