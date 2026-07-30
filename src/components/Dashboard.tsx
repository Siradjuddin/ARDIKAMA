import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSync } from '../context/SyncContext';
import { getAllEmployees } from '../data/employees';
import { maskNip } from '../utils/formatters';
import { TabType } from './Sidebar';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { ArchiveDocument } from '../types';
import { RejectReasonModal } from './RejectReasonModal';
import {
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Clock,
  Download,
  ExternalLink,
  FileCheck,
  FileCode,
  FileSpreadsheet,
  FileText,
  FolderArchive,
  Image as ImageIcon,
  Plus,
  RefreshCw,
  Search,
  Send,
  Users,
  Video,
  XCircle
} from 'lucide-react';

interface DashboardProps {
  onNavigateTab: (tab: TabType) => void;
  onOpenUploadModal: (reuploadDoc?: ArchiveDocument | null) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onNavigateTab, onOpenUploadModal }) => {
  const { currentUser, isAdmin } = useAuth();
  const {
    complianceRecords,
    archives,
    approveDocument,
    rejectDocument,
    selectedDate,
    setSelectedDate,
    sendWhatsAppReminder,
    isOnline,
    syncNow,
    driveFileCount,
    isDriveConnected,
    connectDrive
  } = useSync();

  const [searchQuery, setSearchQuery] = useState('');
  const [rejectingDoc, setRejectingDoc] = useState<ArchiveDocument | null>(null);

  // Calculations
  const allEmployees = getAllEmployees();
  const totalEmployees = allEmployees.length;

  // Compute approved documents for active month (resets on 1st of every month)
  const activeMonth = selectedDate.substring(0, 7); // e.g. "2026-07"
  const approvedDocsThisMonth = archives.filter(
    (a) => a.approvalStatus === 'APPROVED' && (a.uploadDate ? a.uploadDate.startsWith(activeMonth) : true)
  );
  const approvedNips = new Set(approvedDocsThisMonth.map((a) => a.uploaderNip));
  const uploadedCount = approvedDocsThisMonth.length;
  const pendingCount = Math.max(0, totalEmployees - approvedNips.size);
  const compliancePercentage = totalEmployees > 0 ? Math.round((approvedNips.size / totalEmployees) * 100) : 0;

  // Category statistics
  const categoryCounts = {
    PDF: archives.filter((a) => a.fileType === 'PDF').length,
    WORD: archives.filter((a) => a.fileType === 'WORD').length,
    EXCEL: archives.filter((a) => a.fileType === 'EXCEL').length,
    POWERPOINT: archives.filter((a) => a.fileType === 'POWERPOINT').length,
    FOTO: archives.filter((a) => a.fileType === 'FOTO').length,
    VIDEO: archives.filter((a) => a.fileType === 'VIDEO').length
  };

  const pieData = [
    { name: 'PDF', value: categoryCounts.PDF, color: '#EF4444' },
    { name: 'Word', value: categoryCounts.WORD, color: '#3B82F6' },
    { name: 'Excel', value: categoryCounts.EXCEL, color: '#10B981' },
    { name: 'PowerPoint', value: categoryCounts.POWERPOINT, color: '#F59E0B' },
    { name: 'Foto', value: categoryCounts.FOTO, color: '#8B5CF6' },
    { name: 'Video', value: categoryCounts.VIDEO, color: '#EC4899' }
  ].filter((d) => d.value > 0);

  // Daily trend mock data
  const trendData = [
    { day: 'Sen', LKH: 310, LKB: 290 },
    { day: 'Sel', LKH: 330, LKB: 300 },
    { day: 'Rab', LKH: 325, LKB: 310 },
    { day: 'Kam', LKH: uploadedCount, LKB: 280 },
    { day: 'Jum', LKH: 300, LKB: 270 }
  ];

  // Pending staff list for quick action
  const pendingStaffList = allEmployees.filter((emp) => {
    const record = complianceRecords.find((r) => r.employeeNip === emp.nip);
    return !record || record.lkhStatus === 'BELUM';
  }).filter((emp) =>
    (emp?.name || '').toLowerCase().includes((searchQuery || '').toLowerCase()) ||
    (emp?.nip || '').includes(searchQuery || '')
  );

  // Filter archives: Admin sees all. Non-admin users ONLY see their OWN uploads (strict privacy)
  const visibleArchives = archives.filter((doc) => {
    if (isAdmin) return true;
    const uploaderNip = doc?.uploaderNip || '';
    const uploaderName = (doc?.uploaderName || '').toLowerCase().trim();
    const currentNip = currentUser?.nip || '';
    const currentName = (currentUser?.name || '').toLowerCase().trim();

    const isOwner = Boolean(
      currentUser && (
        (uploaderNip && currentNip && uploaderNip === currentNip) ||
        (uploaderName && currentName && uploaderName === currentName)
      )
    );
    return isOwner;
  });

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-800 via-teal-800 to-cyan-900 text-white p-6 sm:p-8 shadow-xl">
        <div className="relative z-10 max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-xs font-semibold tracking-wide text-emerald-200 border border-white/10">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            Sistem Digitalisasi Arsip & Kedisiplinan Pelaporan Real-Time
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Selamat Datang di ARDIKAMA Kemenag Mempawah
          </h1>
          <p className="text-sm text-emerald-100/90 leading-relaxed">
            Sistem terpadu pengarsipan LKH/LKB, SPT Pajak, dan dokumen digital terhubung langsung dengan Google Drive API Kemenag Kabupaten Mempawah.
          </p>

          {/* Date Picker & Quick Actions */}
          <div className="pt-2 flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/20 text-xs font-semibold">
              <span>Tanggal Monitoring:</span>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="bg-transparent text-white font-mono focus:outline-none cursor-pointer"
              />
            </div>

            <button
              onClick={() => onOpenUploadModal()}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white text-emerald-900 font-bold text-xs shadow-lg hover:bg-emerald-50 active:scale-95 transition-all"
            >
              <Plus className="w-4 h-4 text-emerald-700" />
              <span>Unggah Dokumen Baru</span>
            </button>
          </div>
        </div>

        {/* Decorative Background Circles */}
        <div className="absolute -right-10 -bottom-10 w-72 h-72 rounded-full bg-emerald-500/10 blur-2xl pointer-events-none" />
        <div className="absolute right-32 -top-10 w-48 h-48 rounded-full bg-cyan-400/10 blur-xl pointer-events-none" />
      </div>

      {/* Top Statistic Card (Only for Admin: Arsip Tersimpan) */}
      {isAdmin && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Arsip Tersimpan
              </span>
              <div className="p-2.5 rounded-xl bg-purple-50 dark:bg-purple-950/80 text-purple-600 dark:text-purple-400">
                <FolderArchive className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-slate-900 dark:text-white font-mono">
                {isDriveConnected && driveFileCount !== null ? driveFileCount : archives.length}
              </span>
              <span className="text-xs font-semibold text-slate-500">Berkas</span>
            </div>
            <div className="mt-2 text-[11px]">
              {isDriveConnected ? (
                <span className="text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Real-Time GDrive (arsipdigitalmempawah@gmail.com)
                </span>
              ) : (
                <div className="flex items-center justify-between w-full">
                  <span className="text-amber-600 dark:text-amber-400 font-medium">
                    Google Drive Belum Terhubung
                  </span>
                  <button
                    onClick={async () => {
                      try {
                        await connectDrive();
                      } catch (e: any) {
                        alert(e?.message || e);
                      }
                    }}
                    className="text-[10px] font-bold underline text-emerald-600 hover:text-emerald-700 ml-2"
                  >
                    Hubungkan
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Analytics Charts & Status Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Daily Trend & Category Distribution */}
        <div className="lg:col-span-2 space-y-6">
          {/* Daily Upload Trend Chart */}
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                  Tren Pelaporan Kedisiplinan LKH & LKB
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Grafik rekapitulasi jumlah pegawai yang mengunggah laporan per hari kerja.
                </p>
              </div>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={trendData}>
                  <XAxis dataKey="day" stroke="#94A3B8" fontSize={12} />
                  <YAxis stroke="#94A3B8" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0F172A',
                      borderColor: '#334155',
                      borderRadius: '12px',
                      color: '#FFF'
                    }}
                  />
                  <Bar dataKey="LKH" fill="#10B981" radius={[6, 6, 0, 0]} name="LKH (Harian)" />
                  <Bar dataKey="LKB" fill="#3B82F6" radius={[6, 6, 0, 0]} name="LKB (Bulanan)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* File Category Breakdown */}
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white mb-1">
              Kategori Format Berkas Tersimpan
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Distribusi format file digital yang telah diarsip di Google Drive.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 items-center gap-6">
              <div className="h-52 w-full flex justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="space-y-2">
                {pieData.map((item) => (
                  <div key={item.name} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="font-semibold text-slate-700 dark:text-slate-300">{item.name}</span>
                    </div>
                    <span className="font-mono font-bold text-slate-900 dark:text-white">
                      {item.value} Berkas
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right Col: Quick WA Reminder Box */}
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                  Pengingat Kedisiplinan WA
                </h3>
                <p className="text-xs text-slate-500">Daftar Pegawai Belum Upload Hari Ini</p>
              </div>
              <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300">
                {pendingCount} Orang
              </span>
            </div>

            {/* Search Box */}
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Cari NIP atau Nama..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* List */}
            <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
              {pendingStaffList.slice(0, 8).map((emp) => (
                <div
                  key={emp.nip}
                  className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/50 flex items-center justify-between gap-2"
                >
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                      {emp.no}. {emp.name}
                    </p>
                    <p className="text-[10px] text-slate-500 font-mono">
                      NIP: {maskNip(emp.nip, isAdmin)}
                    </p>
                  </div>

                  <button
                    onClick={() => sendWhatsAppReminder(emp.name, emp.nip, emp.phone)}
                    className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold flex items-center gap-1 shrink-0 active:scale-95 transition-transform"
                    title="Kirim pesan WhatsApp pengingat"
                  >
                    <Send className="w-3 h-3" />
                    <span>WA</span>
                  </button>
                </div>
              ))}

              {pendingStaffList.length > 8 && (
                <button
                  onClick={() => onNavigateTab('monitoring')}
                  className="w-full py-2 text-center text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline"
                >
                  Lihat Semua ({pendingStaffList.length - 8} pegawai lainnya) →
                </button>
              )}
            </div>
          </div>

          {/* Quick Drive Status Widget */}
          <div className="p-6 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 text-white shadow-lg space-y-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                <FolderArchive className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold">Google Drive Storage Active</h4>
                <p className="text-xs text-slate-300">Google Workspace Kemenag Mempawah</p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700 text-xs space-y-1 font-mono">
              <div className="flex justify-between">
                <span className="text-slate-400">Folder ID:</span>
                <span className="text-emerald-400 truncate max-w-[140px]">1a2b3c4d5e6f7g8h9_ardika</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Status Sync:</span>
                <span className="text-emerald-400 font-bold">TERHUBUNG (API v3)</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Upload Activity Feed */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
              Riwayat Berkas Terbaru Diunggah
            </h3>
            <p className="text-xs text-slate-500">Aktivitas penerimaan dokumen di server Google Drive</p>
          </div>
          <button
            onClick={() => onNavigateTab('archive')}
            className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
          >
            <span>Buka Riwayat Lengkap</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {visibleArchives.slice(0, 5).map((doc) => (
            <div key={doc.id} className="py-3.5 space-y-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`p-2.5 rounded-xl text-white font-bold text-xs shrink-0 ${
                      doc.fileType === 'PDF'
                        ? 'bg-rose-500'
                        : doc.fileType === 'WORD'
                        ? 'bg-blue-600'
                        : doc.fileType === 'EXCEL'
                        ? 'bg-emerald-600'
                        : doc.fileType === 'POWERPOINT'
                        ? 'bg-amber-500'
                        : doc.fileType === 'FOTO'
                        ? 'bg-purple-600'
                        : 'bg-pink-600'
                    }`}
                  >
                    {doc.fileType}
                  </div>

                  <div className="min-w-0 space-y-0.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                        {doc.title}
                      </h4>
                      {/* Approval Status Badge */}
                      {doc.approvalStatus === 'APPROVED' ? (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-200 text-[10px] font-extrabold flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>Disetujui</span>
                        </span>
                      ) : doc.approvalStatus === 'REJECTED' ? (
                        <span className="px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-200 text-[10px] font-extrabold flex items-center gap-1">
                          <XCircle className="w-3 h-3 text-rose-600" />
                          <span>Ditolak Admin</span>
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-200 text-[10px] font-extrabold flex items-center gap-1">
                          <Clock className="w-3 h-3 text-amber-600" />
                          <span>Menunggu</span>
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                      <span>Oleh: {doc.uploaderName}</span>
                      <span>•</span>
                      <span>NIP: {maskNip(doc.uploaderNip, isAdmin)}</span>
                      <span>•</span>
                      <span>
                        {doc.uploadDate} {doc.uploadTime}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {isAdmin && (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => approveDocument(doc.id, currentUser?.name || 'Admin')}
                        disabled={doc.approvalStatus === 'APPROVED'}
                        className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-extrabold flex items-center gap-1 disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Setujui</span>
                      </button>
                      <button
                        onClick={() => setRejectingDoc(doc)}
                        disabled={doc.approvalStatus === 'REJECTED'}
                        className="px-2.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-[10px] font-extrabold flex items-center gap-1 disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        <XCircle className="w-3 h-3" />
                        <span>Tolak</span>
                      </button>
                    </div>
                  )}

                  <a
                    href={doc.driveUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold flex items-center gap-1.5"
                  >
                    <span>Google Drive</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>

              {/* Rejection Notice Banner & Re-upload button */}
              {doc.approvalStatus === 'REJECTED' && (
                <div className="mt-2 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/80 border border-rose-200 dark:border-rose-800 text-xs space-y-1.5">
                  <div className="flex items-center justify-between text-rose-900 dark:text-rose-100 font-extrabold text-[11px]">
                    <span className="flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                      Laporan Ditolak oleh Admin
                    </span>
                    {doc.reviewedBy && <span className="text-[10px]">Oleh {doc.reviewedBy}</span>}
                  </div>
                  <p className="text-[11px] text-rose-950 dark:text-rose-100 font-medium">
                    Pesan Admin: "{doc.rejectionReason || 'Silakan unggah ulang perbaikan berkas yang benar.'}"
                  </p>
                  <button
                    onClick={() => onOpenUploadModal(doc)}
                    className="py-1.5 px-3 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-[11px] shadow flex items-center gap-1.5 transition-transform active:scale-95"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Unggah Ulang Perbaikan File</span>
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Admin Rejection Reason Modal */}
      <RejectReasonModal
        doc={rejectingDoc}
        isOpen={!!rejectingDoc}
        onClose={() => setRejectingDoc(null)}
        onConfirmReject={(docId, reason) => {
          rejectDocument(docId, reason, currentUser?.name || 'Admin');
        }}
      />
    </div>
  );
};
