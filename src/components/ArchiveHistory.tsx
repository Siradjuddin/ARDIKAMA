import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSync } from '../context/SyncContext';
import { ArchiveDocument, FileCategory } from '../types';
import { maskNip } from '../utils/formatters';
import { RejectReasonModal } from './RejectReasonModal';
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Download,
  ExternalLink,
  Eye,
  FileCode,
  FileSpreadsheet,
  FileText,
  FolderArchive,
  Image as ImageIcon,
  Plus,
  RefreshCw,
  Search,
  Tag,
  Video,
  XCircle
} from 'lucide-react';

interface ArchiveHistoryProps {
  onOpenUploadModal: (reuploadDoc?: ArchiveDocument | null) => void;
}

export const ArchiveHistory: React.FC<ArchiveHistoryProps> = ({ onOpenUploadModal }) => {
  const { archives, approveDocument, rejectDocument } = useSync();
  const { currentUser, isAdmin } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState<FileCategory | 'SEMUA'>('SEMUA');
  const [searchQuery, setSearchQuery] = useState('');
  const [previewDoc, setPreviewDoc] = useState<ArchiveDocument | null>(null);
  const [rejectingDoc, setRejectingDoc] = useState<ArchiveDocument | null>(null);

  const categories: { key: FileCategory | 'SEMUA'; label: string; icon: any }[] = [
    { key: 'SEMUA', label: 'Semua Format', icon: FolderArchive },
    { key: 'PDF', label: 'Dokumen PDF', icon: FileText },
    { key: 'WORD', label: 'Word (DOCX)', icon: FileText },
    { key: 'EXCEL', label: 'Excel (XLSX)', icon: FileSpreadsheet },
    { key: 'POWERPOINT', label: 'PowerPoint (PPTX)', icon: FileCode },
    { key: 'FOTO', label: 'Foto / Gambar', icon: ImageIcon },
    { key: 'VIDEO', label: 'Video MP4', icon: Video }
  ];

  const filteredArchives = archives.filter((doc) => {
    // Privacy filter: Non-admin users ONLY see THEIR OWN uploaded documents
    if (!isAdmin) {
      const isOwner = currentUser && (
        doc.uploaderNip === currentUser.nip ||
        doc.uploaderName.toLowerCase().trim() === currentUser.name.toLowerCase().trim()
      );
      if (!isOwner) {
        return false;
      }
    }

    const matchesCategory = selectedCategory === 'SEMUA' || doc.fileType === selectedCategory;
    const matchesSearch =
      doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.uploaderName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.uploaderNip.includes(searchQuery) ||
      doc.fileName.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesCategory && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">
            Riwayat Arsip Digital Kemenag Mempawah
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Repositori penyimpanan dokumen terpusat terintegrasi dengan Google Drive Storage API.
          </p>
        </div>

        <button
          onClick={() => onOpenUploadModal()}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition-transform active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Unggah Berkas Baru</span>
        </button>
      </div>

      {/* Category Pills + Search */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
          {categories.map((cat) => {
            const Icon = cat.icon;
            const isActive = selectedCategory === cat.key;
            return (
              <button
                key={cat.key}
                onClick={() => setSelectedCategory(cat.key)}
                className={`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap flex items-center gap-2 transition-all ${
                  isActive
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>

        {/* Search Input */}
        <div className="relative min-w-[280px]">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Cari Judul, NIP, atau Pengunggah..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
      </div>

      {/* Archive Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredArchives.length === 0 ? (
          <div className="col-span-full py-12 text-center text-slate-400 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
            Tidak ada dokumen yang ditemukan sesuai filter.
          </div>
        ) : (
          filteredArchives.map((doc) => (
            <div
              key={doc.id}
              className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-md transition-all flex flex-col justify-between gap-4"
            >
              <div className="space-y-3">
                {/* Header Tag + Category & Approval Status */}
                <div className="flex items-center justify-between gap-1 flex-wrap">
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`px-2.5 py-1 rounded-md font-mono text-[10px] font-extrabold text-white ${
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
                      {doc.fileType} • {doc.fileSize}
                    </span>

                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        doc.syncedToCloud
                          ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                          : 'bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300'
                      }`}
                    >
                      {doc.syncedToCloud ? 'Synced Drive' : 'Pending Local'}
                    </span>
                  </div>

                  {/* Approval Status Badge */}
                  {doc.approvalStatus === 'APPROVED' ? (
                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/90 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-[10px] font-extrabold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      <span>Disetujui</span>
                    </span>
                  ) : doc.approvalStatus === 'REJECTED' ? (
                    <span className="px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950/90 border border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-200 text-[10px] font-extrabold flex items-center gap-1">
                      <XCircle className="w-3 h-3 text-rose-600" />
                      <span>Ditolak Admin</span>
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/90 border border-amber-300 dark:border-amber-800 text-amber-800 dark:text-amber-200 text-[10px] font-extrabold flex items-center gap-1">
                      <Clock className="w-3 h-3 text-amber-600" />
                      <span>Menunggu</span>
                    </span>
                  )}
                </div>

                {/* Title */}
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white line-clamp-2">
                    {doc.title}
                  </h3>
                  <p className="text-[11px] text-slate-500 font-mono mt-0.5 truncate">
                    {doc.fileName}
                  </p>
                </div>

                {/* Metadata Info */}
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/50 space-y-1 text-[11px]">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Pengunggah:</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200 truncate max-w-[150px]">
                      {doc.uploaderName}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">NIP Metadata:</span>
                    <span className="font-mono text-slate-700 dark:text-slate-300 font-bold">
                      {maskNip(doc.uploaderNip, isAdmin)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Waktu:</span>
                    <span className="text-slate-600 dark:text-slate-400">
                      {doc.uploadDate} {doc.uploadTime}
                    </span>
                  </div>
                </div>

                {/* Rejection Message & Re-upload Menu */}
                {doc.approvalStatus === 'REJECTED' && (
                  <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/70 border-2 border-rose-200 dark:border-rose-800 space-y-2 text-xs">
                    <div className="flex items-center justify-between text-rose-900 dark:text-rose-100 font-extrabold text-[11px]">
                      <span className="flex items-center gap-1.5">
                        <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                        Pesan Penolakan Admin:
                      </span>
                      {doc.reviewedBy && (
                        <span className="text-[10px] text-rose-700 dark:text-rose-300 font-normal">
                          Oleh {doc.reviewedBy}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-rose-950 dark:text-rose-100 font-semibold bg-white/80 dark:bg-slate-900/80 p-2.5 rounded-xl border border-rose-200/80 dark:border-rose-900 leading-relaxed">
                      "{doc.rejectionReason || 'Berkas Laporan tidak sesuai ketentuan.'}"
                    </p>
                    
                    {/* Re-upload menu button */}
                    <button
                      onClick={() => onOpenUploadModal(doc)}
                      className="w-full mt-1 py-2.5 px-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs shadow-md flex items-center justify-center gap-2 transition-transform active:scale-95"
                    >
                      <RefreshCw className="w-4 h-4" />
                      <span>Unggah Ulang Perbaikan Berkas</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Card Footer Actions */}
              <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                {/* Admin Approval Controls */}
                {isAdmin && (
                  <div className="flex items-center gap-2 p-1.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
                    <span className="text-[10px] font-extrabold text-slate-500 uppercase px-1">Aksi Verifikasi:</span>
                    <button
                      onClick={() => approveDocument(doc.id, currentUser?.name || 'Admin')}
                      disabled={doc.approvalStatus === 'APPROVED'}
                      className="flex-1 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-extrabold flex items-center justify-center gap-1 transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Setujui</span>
                    </button>

                    <button
                      onClick={() => setRejectingDoc(doc)}
                      disabled={doc.approvalStatus === 'REJECTED'}
                      className="flex-1 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-extrabold flex items-center justify-center gap-1 transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      <span>Tolak</span>
                    </button>
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPreviewDoc(doc)}
                    className="flex-1 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Detail</span>
                  </button>

                  <a
                    href={doc.driveUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow-sm"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Buka Drive</span>
                  </a>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Detail Metadata Dialog */}
      {previewDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3 dark:border-slate-800">
              <h3 className="font-extrabold text-slate-900 dark:text-white text-base">
                Detail Metadata Google Drive
              </h3>
              <button
                onClick={() => setPreviewDoc(null)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <span className="text-slate-400 font-bold uppercase tracking-wider block">Judul Dokumen</span>
                <span className="text-sm font-bold text-slate-900 dark:text-white">{previewDoc.title}</span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-slate-400 block">Format:</span>
                  <span className="font-bold font-mono text-emerald-600">{previewDoc.fileType}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Ukuran File:</span>
                  <span className="font-bold font-mono">{previewDoc.fileSize}</span>
                </div>
              </div>

              <div>
                <span className="text-slate-400 block">Metadata Pengunggah (NIP & Nama):</span>
                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 font-mono font-bold text-slate-800 dark:text-slate-200 mt-1">
                  {previewDoc.uploaderName} (NIP: {maskNip(previewDoc.uploaderNip, isAdmin)})
                </div>
              </div>

              <div>
                <span className="text-slate-400 block">Deskripsi:</span>
                <p className="text-slate-700 dark:text-slate-300 mt-0.5">
                  {previewDoc.metadata.description || 'Laporan resmi arsip Kemenag Mempawah.'}
                </p>
              </div>

              <div>
                <span className="text-slate-400 block">Google Drive Link:</span>
                <a
                  href={previewDoc.driveUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-blue-600 dark:text-blue-400 font-mono underline break-all block mt-0.5"
                >
                  {previewDoc.driveUrl}
                </a>
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={() => setPreviewDoc(null)}
                className="w-full py-2.5 rounded-xl bg-slate-900 dark:bg-slate-800 text-white text-xs font-bold"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Admin Rejection Modal */}
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
