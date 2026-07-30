import React, { useState } from 'react';
import { ArchiveDocument } from '../types';
import { maskNip } from '../utils/formatters';
import { useAuth } from '../context/AuthContext';
import { AlertCircle, FileText, Send, X } from 'lucide-react';

interface RejectReasonModalProps {
  doc: ArchiveDocument | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirmReject: (docId: string, reason: string) => void;
}

export const RejectReasonModal: React.FC<RejectReasonModalProps> = ({
  doc,
  isOpen,
  onClose,
  onConfirmReject
}) => {
  const { isAdmin } = useAuth();
  const [reasonInput, setReasonInput] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen || !doc) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reasonInput.trim()) {
      setErrorMsg('Wajib memberikan pesan alasan penolakan untuk pegawai!');
      return;
    }
    onConfirmReject(doc.id, reasonInput.trim());
    setReasonInput('');
    setErrorMsg('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 sm:p-7 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 border-b pb-3.5 dark:border-slate-800">
          <div className="p-3 rounded-2xl bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-400">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">
              Tolak Dokumen Laporan
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Kirimkan catatan alasan penolakan kepada pegawai.
            </p>
          </div>
        </div>

        {/* Target Document Summary */}
        <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-1.5 text-xs">
          <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold">
            <FileText className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="truncate">{doc.title}</span>
          </div>
          <div className="flex justify-between text-[11px] text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-200/60 dark:border-slate-700/60">
            <span>Pengunggah: <strong>{doc.uploaderName}</strong></span>
            <span>NIP: <strong className="font-mono">{maskNip(doc.uploaderNip, isAdmin)}</strong></span>
          </div>
        </div>

        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/80 border border-rose-200 text-rose-800 dark:text-rose-200 text-xs font-bold">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[11px] font-extrabold uppercase text-slate-700 dark:text-slate-300 tracking-wider mb-1.5">
              PESAN ALASAN PENOLAKAN (CATATAN REVISI FOR PEGAWAI)
            </label>
            <textarea
              required
              rows={4}
              placeholder="Contoh: Dokumen tidak sesuai format PDF, atau halaman LKH 2 belum ditandatangani. Silakan unggah ulang berkas perbaikan..."
              value={reasonInput}
              onChange={(e) => setReasonInput(e.target.value)}
              className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-rose-500"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs shadow-md transition-all active:scale-95 flex items-center gap-1.5"
            >
              <Send className="w-4 h-4" />
              <span>Kirim Penolakan & Minta Unggah Ulang</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
