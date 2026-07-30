import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSync } from '../context/SyncContext';
import { getAllEmployees } from '../data/employees';
import { maskNip } from '../utils/formatters';
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Download,
  Filter,
  Printer,
  RefreshCw,
  Search,
  Send,
  Upload,
  UserCheck,
  UserX,
  XCircle
} from 'lucide-react';

interface ComplianceMonitoringProps {
  onOpenUploadForStaff?: (nip: string, name: string) => void;
}

export const ComplianceMonitoring: React.FC<ComplianceMonitoringProps> = ({
  onOpenUploadForStaff
}) => {
  const { isAdmin, currentUser } = useAuth();
  const {
    complianceRecords,
    archives,
    selectedDate,
    setSelectedDate,
    updateCompliance,
    sendWhatsAppReminder
  } = useSync();

  const [statusFilter, setStatusFilter] = useState<'SEMUA' | 'SUDAH' | 'BELUM'>('SEMUA');
  const [docFilter, setDocFilter] = useState<'lkh_lkb' | 'spt'>('lkh_lkb');
  const [searchQuery, setSearchQuery] = useState('');

  const allEmployees = getAllEmployees();

  // Map employee list with compliance record & real-time approved archives
  const activeMonth = selectedDate.substring(0, 7);
  const activeYear = selectedDate.substring(0, 4);

  const fullList = allEmployees.map((emp) => {
    const rec = complianceRecords.find((r) => (r.employeeNip || '').trim() === (emp.nip || '').trim());

    // Check real-time approved docs in archives
    const hasApprovedDoc = archives.some((a) => {
      const matchOwner = (a.uploaderNip || '').trim() === (emp.nip || '').trim();
      if (!matchOwner || a.approvalStatus !== 'APPROVED') return false;

      const uDate = a.uploadDate || '';
      const docTypeUpper = (a.docType || '').toUpperCase();
      if (docFilter === 'lkh_lkb') {
        const isLkhLkb = docTypeUpper === 'LKH' || docTypeUpper === 'LKB' || docTypeUpper === 'LKH_LKB';
        const matchMonth = !uDate || uDate.startsWith(activeMonth) || uDate.includes(activeMonth);
        return isLkhLkb && matchMonth;
      } else {
        const isSpt = docTypeUpper === 'SPT';
        const matchYear = !uDate || uDate.startsWith(activeYear) || uDate.includes(activeYear);
        return isSpt && matchYear;
      }
    });

    const recStatus = rec
      ? docFilter === 'lkh_lkb'
        ? (rec.lkhStatus === 'SUDAH' || rec.lkbStatus === 'SUDAH' ? 'SUDAH' : 'BELUM')
        : rec.sptStatus
      : 'BELUM';

    const status = hasApprovedDoc ? 'SUDAH' : recStatus;

    const isPending = archives.some((a) => {
      const matchOwner = (a.uploaderNip || '').trim() === (emp.nip || '').trim();
      if (!matchOwner || a.approvalStatus !== 'PENDING') return false;

      const uDate = a.uploadDate || '';
      const docTypeUpper = (a.docType || '').toUpperCase();
      if (docFilter === 'lkh_lkb') {
        const isLkhLkb = docTypeUpper === 'LKH' || docTypeUpper === 'LKB' || docTypeUpper === 'LKH_LKB';
        const matchMonth = !uDate || uDate.startsWith(activeMonth) || uDate.includes(activeMonth);
        return isLkhLkb && matchMonth;
      } else {
        const isSpt = docTypeUpper === 'SPT';
        const matchYear = !uDate || uDate.startsWith(activeYear) || uDate.includes(activeYear);
        return isSpt && matchYear;
      }
    });

    return {
      ...emp,
      status,
      isPending,
      lastUpdated: rec?.lastUpdated || '-'
    };
  });

  // Filtered list based on status, doc type and search query
  const filteredList = fullList.filter((emp) => {
    const matchesStatus =
      statusFilter === 'SEMUA' ||
      (statusFilter === 'SUDAH' && emp.status === 'SUDAH') ||
      (statusFilter === 'BELUM' && emp.status === 'BELUM');

    const matchesSearch =
      (emp?.name || '').toLowerCase().includes((searchQuery || '').toLowerCase()) ||
      (emp?.nip || '').includes(searchQuery || '');

    return matchesStatus && matchesSearch;
  });

  const total = allEmployees.length;
  const countSudah = fullList.filter((e) => e.status === 'SUDAH').length;
  const countBelum = total - countSudah;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Summary */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">
                Monitoring Kedisiplinan Pelaporan Pegawai
              </h2>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                REALTIME
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Rekapitulasi status pengunggahan LKH, LKB, dan SPT Pajak untuk 356 Pegawai Kemenag Kabupaten Mempawah.
            </p>
          </div>

          {/* Date Picker & Print */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-xs font-semibold">
              <span className="text-slate-500">Tanggal:</span>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="bg-transparent text-slate-900 dark:text-white font-mono focus:outline-none"
              />
            </div>

            <button
              onClick={handlePrint}
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold flex items-center gap-1.5"
              title="Cetak Rekap"
            >
              <Printer className="w-4 h-4" />
              <span className="hidden sm:inline">Cetak</span>
            </button>
          </div>
        </div>

        {/* 3 Status Summary Tabs */}
        <div className="grid grid-cols-3 gap-3 pt-2">
          <button
            onClick={() => setStatusFilter('SEMUA')}
            className={`p-3.5 rounded-xl border text-left transition-all ${
              statusFilter === 'SEMUA'
                ? 'bg-blue-50/80 dark:bg-blue-950/60 border-blue-500 text-blue-900 dark:text-blue-100 ring-2 ring-blue-500/20'
                : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
            }`}
          >
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Semua Pegawai</div>
            <div className="mt-1 text-2xl font-extrabold font-mono">{total}</div>
          </button>

          <button
            onClick={() => setStatusFilter('SUDAH')}
            className={`p-3.5 rounded-xl border text-left transition-all ${
              statusFilter === 'SUDAH'
                ? 'bg-emerald-50/80 dark:bg-emerald-950/60 border-emerald-500 text-emerald-900 dark:text-emerald-100 ring-2 ring-emerald-500/20'
                : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
            }`}
          >
            <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Sudah Upload</span>
            </div>
            <div className="mt-1 text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 font-mono">
              {countSudah}
            </div>
          </button>

          <button
            onClick={() => setStatusFilter('BELUM')}
            className={`p-3.5 rounded-xl border text-left transition-all ${
              statusFilter === 'BELUM'
                ? 'bg-rose-50/80 dark:bg-rose-950/60 border-rose-500 text-rose-900 dark:text-rose-100 ring-2 ring-rose-500/20'
                : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
            }`}
          >
            <div className="text-[11px] font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400 flex items-center gap-1">
              <XCircle className="w-3.5 h-3.5" />
              <span>Belum Upload</span>
            </div>
            <div className="mt-1 text-2xl font-extrabold text-rose-600 dark:text-rose-400 font-mono">
              {countBelum}
            </div>
          </button>
        </div>
      </div>

      {/* Control Bar: Document Type Tabs + Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Document Type Selector */}
        <div className="flex rounded-xl bg-slate-100 dark:bg-slate-800 p-1 text-xs font-bold">
          <button
            onClick={() => setDocFilter('lkh_lkb')}
            className={`flex-1 sm:flex-initial px-4 py-2 rounded-lg transition-colors ${
              docFilter === 'lkh_lkb'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            1. LKH / LKB (Harian & Bulanan)
          </button>
          <button
            onClick={() => setDocFilter('spt')}
            className={`flex-1 sm:flex-initial px-4 py-2 rounded-lg transition-colors ${
              docFilter === 'spt'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            2. Bukti Laporan SPT
          </button>
        </div>

        {/* Search */}
        <div className="relative min-w-[260px]">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Cari NIP atau Nama Pegawai..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
      </div>

      {/* Main Monitoring Table */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-slate-500 uppercase tracking-wider font-bold">
              <tr>
                <th className="py-3.5 px-4 w-12 text-center">No</th>
                <th className="py-3.5 px-4">Nama Pegawai & Jabatan</th>
                <th className="py-3.5 px-4 font-mono">NIP</th>
                <th className="py-3.5 px-4 text-center">
                  Status Laporan ({docFilter === 'lkh_lkb' ? 'LKH / LKB' : 'SPT Pajak'})
                </th>
                <th className="py-3.5 px-4 text-right">Aksi Pengingat / Upload</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredList.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400">
                    Tidak ada pegawai yang sesuai dengan filter pencarian.
                  </td>
                </tr>
              ) : (
                filteredList.map((emp) => {
                  const isUploaded = emp.status === 'SUDAH';
                  return (
                    <tr
                      key={emp.nip}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors"
                    >
                      <td className="py-3 px-4 font-mono font-bold text-slate-400 text-center">
                        {emp.no}
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900 dark:text-white">{emp.name}</div>
                        <div className="text-[10px] text-slate-400">{emp.jabatan}</div>
                      </td>

                      <td className="py-3 px-4 font-mono text-slate-600 dark:text-slate-400 font-semibold">
                        {maskNip(emp.nip, isAdmin)}
                      </td>

                      <td className="py-3 px-4 text-center">
                        {isUploaded ? (
                          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Disetujui Admin</span>
                          </span>
                        ) : emp.isPending ? (
                          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-200 border border-amber-300 dark:border-amber-800 animate-pulse">
                            <Clock className="w-3.5 h-3.5 text-amber-600" />
                            <span>Menunggu Verifikasi Admin</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-800">
                            <XCircle className="w-3.5 h-3.5" />
                            <span>Belum Disetujui / Belum Lapor</span>
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-right space-x-2">
                        {!isUploaded && (
                          <button
                            onClick={() => sendWhatsAppReminder(emp.name, emp.nip, emp.phone)}
                            className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold inline-flex items-center gap-1 transition-transform active:scale-95"
                            title="Kirim pesan peringatan via WhatsApp"
                          >
                            <Send className="w-3 h-3" />
                            <span>Kirim WA</span>
                          </button>
                        )}

                        {isAdmin && (
                          <button
                            onClick={() => {
                              const targetStatus = isUploaded ? 'BELUM' : 'SUDAH';
                              if (docFilter === 'lkh_lkb') {
                                updateCompliance(emp.nip, 'lkh', targetStatus);
                                updateCompliance(emp.nip, 'lkb', targetStatus);
                              } else {
                                updateCompliance(emp.nip, 'spt', targetStatus);
                              }
                            }}
                            className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold border transition-colors ${
                              isUploaded
                                ? 'border-slate-200 text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-400'
                                : 'border-blue-300 bg-blue-50 text-blue-700 dark:bg-blue-950 dark:border-blue-800 dark:text-blue-300'
                            }`}
                            title="Tandai Ubah Status Manually"
                          >
                            <span>{isUploaded ? 'Set Belum' : 'Tandai Selesai'}</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
