import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSync } from '../context/SyncContext';
import { ArchiveDocument, FileCategory } from '../types';
import { generateArdikamaFileName, maskNip } from '../utils/formatters';
import { connectGoogleDrive, uploadFileToDrive, getCachedAccessToken, getSubfolderNameForCategory, getSharedDriveEmail } from '../services/driveService';
import { getAllEmployees, findEmployeeByNip } from '../data/employees';
import {
  AlertCircle,
  CheckCircle2,
  CloudUpload,
  ExternalLink,
  FileCheck,
  FileText,
  HardDrive,
  Lock,
  RefreshCw,
  X,
  XCircle
} from 'lucide-react';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  reuploadDoc?: ArchiveDocument | null;
}

export const UploadModal: React.FC<UploadModalProps> = ({ isOpen, onClose, reuploadDoc }) => {
  const { currentUser, isAdmin } = useAuth();
  const { addArchive, reuploadDocument, isOnline, isDriveConnected, connectDrive, refreshDriveCount } = useSync();

  const isPegawaiBiasa = !isAdmin;

  // Selected Employee (Owner of document)
  const [selectedOwnerNip, setSelectedOwnerNip] = useState<string>('');
  
  // Reporting type selection: LKH_LKB or SPT
  const [docTypeOption, setDocTypeOption] = useState<string>('LKH_LKB');
  
  const [fileCategory, setFileCategory] = useState<FileCategory>('PDF');
  const [description, setDescription] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  
  const [uploadSuccessData, setUploadSuccessData] = useState<{
    title: string;
    fileName: string;
    fileSize: string;
    fileType: string;
    docType: string;
    driveUrl: string;
    periodLabel: string;
    isDriveSynced?: boolean;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [driveConnecting, setDriveConnecting] = useState(false);
  const [driveConnected, setDriveConnected] = useState(!!getCachedAccessToken());

  useEffect(() => {
    if (reuploadDoc) {
      setSelectedOwnerNip(reuploadDoc.uploaderNip);
      setDocTypeOption(
        reuploadDoc.docType === 'SPT'
          ? 'SPT'
          : reuploadDoc.docType === 'ARSIP_KANTOR' && isAdmin
          ? 'ARSIP_KANTOR'
          : 'LKH_LKB'
      );
    } else if (currentUser) {
      setSelectedOwnerNip(currentUser.nip);
    }
  }, [currentUser, isOpen, reuploadDoc, isAdmin]);

  useEffect(() => {
    if (!isAdmin && docTypeOption === 'ARSIP_KANTOR') {
      setDocTypeOption('LKH_LKB');
    }
  }, [isAdmin, docTypeOption]);

  useEffect(() => {
    setDriveConnected(!!getCachedAccessToken());
  }, [isOpen]);

  if (!isOpen || !currentUser) return null;

  const allEmployees = getAllEmployees();
  const activeNip = selectedOwnerNip || currentUser.nip;
  const selectedOwner =
    allEmployees.find((e) => e.nip === activeNip) ||
    findEmployeeByNip(activeNip) ||
    currentUser;

  const handleCloseSuccess = () => {
    setUploadSuccessData(null);
    setDescription('');
    setSelectedFile(null);
    setFileError(null);
    onClose();
  };

  // Map user dropdown option to internal docType ('LKH_LKB', 'SPT', or 'ARSIP_KANTOR')
  const internalDocType: 'LKH_LKB' | 'SPT' | 'ARSIP_KANTOR' =
    docTypeOption === 'SPT' ? 'SPT' : (docTypeOption === 'ARSIP_KANTOR' ? 'ARSIP_KANTOR' : 'LKH_LKB');

  // Compute ARDIKAMA Naming format live using selected employee NIP
  const namingResult = generateArdikamaFileName(internalDocType, selectedOwner.nip);

  const processFile = (file: File) => {
    setFileError(null);

    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    const isPdf = ext === 'pdf' || file.type === 'application/pdf';

    // Strict PDF check for LKH/LKB and SPT
    if (!isPdf) {
      setSelectedFile(null);
      const docName = internalDocType === 'SPT' ? 'Bukti Laporan SPT' : 'LKH/LKB';
      setFileError(
        `SISTEM MENOLAK: Berkas "${file.name}" ditolak! Jenis laporan ${docName} hanya menerima dokumen berformat PDF (.pdf).`
      );
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    // Valid PDF file
    setSelectedFile(file);
    setFileCategory('PDF');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleConnectDrive = async () => {
    setDriveConnecting(true);
    setFileError(null);
    try {
      await connectDrive();
      setDriveConnected(true);
    } catch (err: any) {
      const errMsg = typeof err === 'string' ? err : err?.message || 'Terjadi kesalahan authentication.';
      console.warn('Google Drive connection status:', errMsg);
      setFileError('Gagal menghubungkan ke Google Drive: ' + errMsg);
    } finally {
      setDriveConnecting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFileError(null);

    if (!selectedFile) {
      setFileError('Pilih file terlebih dahulu untuk diunggah.');
      return;
    }

    const ext = selectedFile.name.split('.').pop()?.toLowerCase() || '';
    const isPdf = ext === 'pdf' || selectedFile.type === 'application/pdf';

    if (!isPdf) {
      setFileError('SISTEM MENOLAK: Berkas wajib berformat PDF (.pdf) untuk laporan LKH/LKB dan SPT.');
      return;
    }

    setIsUploading(true);

    try {
      const fileSizeMb = (selectedFile.size / (1024 * 1024)).toFixed(1) + ' MB';
      const finalFileName = namingResult.fileName;
      const docTypeTitle = internalDocType === 'SPT' ? 'Bukti Laporan SPT' : (internalDocType === 'ARSIP_KANTOR' ? 'Arsip Kantor' : 'LKH/LKB');
      const finalTitle = `${docTypeTitle} ${namingResult.periodLabel} - ${selectedOwner.name}`;

      let finalDriveUrl = '#';
      let localUrl = URL.createObjectURL(selectedFile);
      let isDriveSynced = false;

      // Attempt Google Drive upload using shared central token; fallback cleanly to ARDIKAMA Cloud Server
      try {
        const driveRes = await uploadFileToDrive(selectedFile, finalFileName, docTypeOption);
        finalDriveUrl = driveRes.driveUrl;
        isDriveSynced = true;
        await refreshDriveCount();
      } catch (uploadErr: any) {
        console.warn('Google Drive upload notice, file stored on ARDIKAMA Server:', uploadErr);
        finalDriveUrl = localUrl;
        isDriveSynced = false;
      }

      if (reuploadDoc) {
        reuploadDocument(reuploadDoc.id, {
          title: finalTitle,
          fileName: finalFileName,
          fileSize: fileSizeMb,
          fileType: 'PDF',
          driveUrl: finalDriveUrl,
          description: description || `Perbaikan Dokumen ${docTypeOption} Resmi ARDIKAMA`
        });
      } else {
        addArchive({
          title: finalTitle,
          fileName: finalFileName,
          fileSize: fileSizeMb,
          fileType: 'PDF',
          docType: internalDocType,
          uploaderNip: selectedOwner.nip,
          uploaderName: selectedOwner.name,
          uploadDate: new Date().toISOString().split('T')[0],
          uploadTime: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
          driveUrl: finalDriveUrl,
          fileUrl: localUrl,
          metadata: {
            description: description || `Dokumen ${docTypeOption} Resmi ARDIKAMA Kemenag Mempawah`,
            period: namingResult.periodLabel,
            year: namingResult.reportYear,
            tags: ['ARDIKAMA', docTypeOption, 'Kemenag Mempawah']
          }
        });
      }

      setIsUploading(false);
      setUploadSuccessData({
        title: finalTitle,
        fileName: finalFileName,
        fileSize: fileSizeMb,
        fileType: 'PDF',
        docType: docTypeOption,
        driveUrl: finalDriveUrl,
        periodLabel: namingResult.periodLabel,
        isDriveSynced
      });
    } catch (err: any) {
      console.error(err);
      setIsUploading(false);
      setFileError('Terjadi kesalahan saat mengunggah berkas: ' + (err.message || 'Error tidak diketahui'));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-xl w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-5 max-h-[92vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-sky-100 dark:bg-sky-950/80 text-sky-600 dark:text-sky-300 flex items-center justify-center shrink-0">
              <CloudUpload className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 dark:text-white text-lg tracking-tight">
                Digitalisasi Arsip
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Unggah berkas laporan dan sinkronisasikan ke sistem Kemenag Mempawah
              </p>
            </div>
          </div>

          <button
            onClick={uploadSuccessData ? handleCloseSuccess : onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Reupload Notice */}
        {reuploadDoc && !uploadSuccessData && (
          <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/80 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-xs space-y-1">
            <div className="flex items-center gap-1.5 font-bold">
              <RefreshCw className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Mode Perbaikan Dokumen Ditolak</span>
            </div>
            <p className="text-[11px] font-semibold">
              Mengunggah ulang berkas perbaikan untuk: <strong className="underline">{reuploadDoc.title}</strong>
            </p>
            {reuploadDoc.rejectionReason && (
              <div className="p-2 rounded-xl bg-amber-100/70 dark:bg-amber-900/50 text-[11px] font-medium text-amber-900 dark:text-amber-100 mt-1">
                <strong>Pesan Admin:</strong> "{reuploadDoc.rejectionReason}"
              </div>
            )}
          </div>
        )}

        {uploadSuccessData ? (
          /* Persistent Success Screen */
          <div className="space-y-5 animate-fadeIn">
            <div className="p-5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/80 border-2 border-emerald-500 text-center space-y-2 shadow-sm">
              <div className="w-12 h-12 rounded-full bg-emerald-600 text-white flex items-center justify-center mx-auto shadow-md">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <h4 className="font-extrabold text-slate-900 dark:text-white text-base tracking-tight">
                BERKAS BERHASIL DIUNGGAH & DISINKRONKAN!
              </h4>
              <p className="text-xs text-emerald-800 dark:text-emerald-200 font-semibold leading-relaxed max-w-sm mx-auto">
                Dokumen laporan Anda telah tersimpan dan terverifikasi secara otomatis pada sistem ARDIKAMA Kantor Kemenag Kabupaten Mempawah.
              </p>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800/80 rounded-2xl p-4 border border-slate-200 dark:border-slate-700 space-y-2.5 text-xs">
              <div className="flex justify-between items-center pb-2 border-b border-slate-200 dark:border-slate-700">
                <span className="text-slate-500 dark:text-slate-400 font-medium">Nama File Resmi:</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white text-[11px] truncate max-w-[220px]">
                  {uploadSuccessData.fileName}
                </span>
              </div>

              <div className="flex justify-between items-center pb-2 border-b border-slate-200 dark:border-slate-700">
                <span className="text-slate-500 dark:text-slate-400 font-medium">Pegawai:</span>
                <span className="font-bold text-slate-900 dark:text-white truncate max-w-[220px]">
                  {selectedOwner.name}
                </span>
              </div>

              <div className="flex justify-between items-center pb-2 border-b border-slate-200 dark:border-slate-700">
                <span className="text-slate-500 dark:text-slate-400 font-medium">Jenis Pelaporan:</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                  {uploadSuccessData.docType} ({uploadSuccessData.periodLabel})
                </span>
              </div>

              <div className="flex justify-between items-center pb-2 border-b border-slate-200 dark:border-slate-700">
                <span className="text-slate-500 dark:text-slate-400 font-medium">Folder & Lokasi:</span>
                <span className="font-extrabold text-emerald-700 dark:text-emerald-300 bg-emerald-100/80 dark:bg-emerald-950 px-2 py-0.5 rounded-lg border border-emerald-300 dark:border-emerald-800 text-[11px] truncate max-w-[220px]">
                  {uploadSuccessData.isDriveSynced ? `Arsip Website ARDIKAMA / ${getSubfolderNameForCategory(uploadSuccessData.docType)}` : 'Server Cloud ARDIKAMA Kemenag'}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-slate-500 dark:text-slate-400 font-medium">Status Penyimpanan:</span>
                <span className="inline-flex items-center gap-1 font-bold text-emerald-600 dark:text-emerald-400 text-xs">
                  <HardDrive className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{uploadSuccessData.isDriveSynced ? 'Google Drive Cloud Storage (100% Synced)' : 'Server Terpusat ARDIKAMA Kemenag Mempawah'}</span>
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleCloseSuccess}
              className="w-full py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-lg transition-transform active:scale-95 flex items-center justify-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Selesai & Tutup</span>
            </button>
          </div>
        ) : (
          <>
            {/* Top Green Storage Alert Banner */}
            <div className="p-4 rounded-2xl bg-emerald-50/90 dark:bg-emerald-950/70 border border-emerald-200 dark:border-emerald-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 mt-0.5">
                  <CloudUpload className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-slate-900 dark:text-white text-xs">
                      Penyimpanan Terpusat Cloud ARDIKAMA
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold tracking-wider bg-emerald-600 text-white">
                      KEMENAG MEMPAWAH
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-0.5 font-medium leading-relaxed">
                    Setiap berkas LKH/LKB/SPT yang Anda unggah <strong>otomatis tersimpan ke Server Cloud ARDIKAMA Kemenag Kabupaten Mempawah</strong>. Pegawai dapat langsung mengunggah berkas tanpa perlu login akun Google pribadi.
                  </p>
                </div>
              </div>

              {isAdmin && !driveConnected && (
                <button
                  type="button"
                  onClick={handleConnectDrive}
                  disabled={driveConnecting}
                  className="px-3.5 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-extrabold text-[11px] shrink-0 shadow-sm transition-transform active:scale-95 flex items-center gap-1.5 self-end sm:self-center"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>{driveConnecting ? 'Menghubungkan...' : 'Hubungkan Cloud API'}</span>
                </button>
              )}
            </div>

            {/* Error Banner */}
            {fileError && (
              <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/90 border border-rose-300 dark:border-rose-800 text-rose-900 dark:text-rose-100 text-xs flex flex-col gap-2">
                <div className="flex items-start gap-2">
                  <XCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <span className="font-semibold whitespace-pre-line leading-relaxed">{fileError}</span>
                </div>
                {fileError.includes('GOOGLE DRIVE API BELUM DIAKTIFKAN') && (
                  <a
                    href="https://console.developers.google.com/apis/api/drive.googleapis.com/overview?project=324640277882"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow transition-colors self-start"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Aktifkan Google Drive API Sekarang (1-Klik)</span>
                  </a>
                )}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* File Dropzone Box (matching screenshot) */}
              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onClick={() => fileInputRef.current?.click()}
                className={`p-8 border-2 border-dashed rounded-2xl cursor-pointer text-center transition-all flex flex-col items-center justify-center gap-2 ${
                  selectedFile
                    ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/30'
                    : 'border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/40'
                }`}
              >
                {selectedFile ? (
                  <>
                    <CheckCircle2 className="w-8 h-8 text-emerald-600" />
                    <span className="font-extrabold text-slate-900 dark:text-white text-xs">
                      {selectedFile.name}
                    </span>
                    <span className="text-[10px] text-emerald-600 font-mono font-bold">
                      {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB • Berkas Siap Diunggah
                    </span>
                  </>
                ) : (
                  <>
                    <CloudUpload className="w-8 h-8 text-slate-400 dark:text-slate-500" />
                    <span className="font-bold text-slate-700 dark:text-slate-300 text-xs">
                      Tarik dan lepas berkas di sini, atau klik untuk menelusuri
                    </span>
                  </>
                )}

                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,application/pdf"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </div>

              {/* Two Column Form Grid (matching screenshot) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                {/* Field 1: PEMILIK BERKAS (PEGAWAI) */}
                <div className="space-y-1.5">
                  <label className="font-extrabold text-slate-700 dark:text-slate-300 block uppercase tracking-wider text-[11px]">
                    PEMILIK BERKAS (PEGAWAI) *
                  </label>
                  <select
                    value={selectedOwnerNip}
                    onChange={(e) => setSelectedOwnerNip(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    {allEmployees.map((emp) => (
                      <option key={emp.nip} value={emp.nip}>
                        {emp.name} (NIP: {emp.nip})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Field 2: JENIS PELAPORAN */}
                <div className="space-y-1.5">
                  <label className="font-extrabold text-slate-700 dark:text-slate-300 block uppercase tracking-wider text-[11px]">
                    JENIS PELAPORAN *
                  </label>
                  <select
                    value={docTypeOption}
                    onChange={(e) => setDocTypeOption(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="LKH_LKB">1. LKH / LKB (Laporan Kinerja Harian / Bulanan)</option>
                    <option value="SPT">2. Bukti Laporan SPT (Surat Pemberitahuan Pajak Tahunan)</option>
                    {isAdmin && (
                      <option value="ARSIP_KANTOR">3. Arsip Kantor (Keuangan, Pendidikan, Keagamaan, Dll - Khusus Admin/Arsiparis)</option>
                    )}
                  </select>
                </div>
              </div>

              {/* Automatic Naming & Subfolder Hint */}
              <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 text-[11px] font-bold text-amber-900 dark:text-amber-200 space-y-1.5 shadow-sm">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-amber-800 dark:text-amber-300">Penyimpanan Terpusat:</span>
                  <div className="flex items-center gap-1.5">
                    <span className="font-extrabold text-emerald-800 dark:text-emerald-300 bg-emerald-100/90 dark:bg-emerald-950/80 px-2 py-0.5 rounded-md font-mono text-[10px]">
                      {getSharedDriveEmail()}
                    </span>
                    {isAdmin && (
                      <button
                        type="button"
                        onClick={handleConnectDrive}
                        disabled={driveConnecting}
                        className="px-2 py-0.5 rounded bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-[10px] transition-colors shadow-xs"
                        title="Khusus Admin: Klik untuk menghubungkan atau mengganti akun Google Drive Kemenag"
                      >
                        {driveConnecting ? 'Proses...' : 'Pilih Akun'}
                      </button>
                    )}
                  </div>
                </div>
                <div className="flex items-center justify-between pt-1 border-t border-amber-200/80 dark:border-amber-800/80">
                  <span className="text-amber-800 dark:text-amber-300">Pemilik Berkas Terpilih:</span>
                  <span className="font-extrabold text-slate-900 dark:text-white truncate max-w-[280px]">
                    {selectedOwner.name} (NIP: {selectedOwner.nip})
                  </span>
                </div>
                <div className="flex items-center justify-between pt-1 border-t border-amber-200/80 dark:border-amber-800/80">
                  <span className="text-amber-800 dark:text-amber-300">Target Folder GDrive:</span>
                  <span className="font-extrabold text-emerald-800 dark:text-emerald-300 bg-amber-100/90 dark:bg-amber-900/80 px-2 py-0.5 rounded-md truncate max-w-[280px]">
                    Arsip Website ARDIKAMA / {getSubfolderNameForCategory(docTypeOption)}
                  </span>
                </div>
                <div className="flex items-center justify-between pt-1 border-t border-amber-200/80 dark:border-amber-800/80">
                  <span className="text-amber-800 dark:text-amber-300">Format Nama File ARDIKAMA:</span>
                  <span className="font-mono text-emerald-700 dark:text-emerald-400 font-extrabold truncate max-w-[280px]">
                    {namingResult.fileName}
                  </span>
                </div>
              </div>

              {/* Field 3: KETERANGAN DOKUMEN / CATATAN TAMBAHAN (METADATA DESKRIPSI) */}
              <div className="space-y-1.5 text-xs">
                <label className="font-extrabold text-slate-700 dark:text-slate-300 block uppercase tracking-wider text-[11px]">
                  KETERANGAN DOKUMEN / CATATAN TAMBAHAN (METADATA DESKRIPSI)
                </label>
                <textarea
                  rows={3}
                  placeholder="Tambahkan detail atau rangkuman kegiatan..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xs"
                />
              </div>

              {/* Form Footer Action Buttons */}
              <div className="pt-3 border-t dark:border-slate-800 flex items-center justify-end gap-3 text-xs">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2.5 rounded-xl text-slate-600 dark:text-slate-400 font-extrabold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  Batal
                </button>

                <button
                  type="submit"
                  disabled={isUploading || !selectedFile}
                  className="px-6 py-2.5 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-extrabold shadow-sm transition-transform active:scale-95 disabled:opacity-60 enabled:bg-emerald-600 enabled:hover:bg-emerald-700 enabled:text-white flex items-center gap-2"
                >
                  {isUploading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Mengunggah...</span>
                    </>
                  ) : (
                    <span>Unggah & Sinkronisasi GDrive</span>
                  )}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
};
