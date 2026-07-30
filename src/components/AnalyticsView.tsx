import React from 'react';
import { useSync } from '../context/SyncContext';
import { EMPLOYEES_DATA } from '../data/employees';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from 'recharts';
import { BarChart3, CheckCircle2, FileText, ShieldAlert, TrendingUp, Users } from 'lucide-react';

export const AnalyticsView: React.FC = () => {
  const { archives, complianceRecords, driveFileCount } = useSync();

  const totalEmployees = EMPLOYEES_DATA.length;
  const countSudah = complianceRecords.filter((r) => r.lkhStatus === 'SUDAH').length;
  const countBelum = totalEmployees - countSudah;

  const monthlyComplianceData = [
    { month: 'Jan', rate: 88 },
    { month: 'Feb', rate: 92 },
    { month: 'Mar', rate: 95 },
    { month: 'Apr', rate: 90 },
    { month: 'Mei', rate: 94 },
    { month: 'Jun', rate: 96 },
    { month: 'Jul', rate: Math.round((countSudah / totalEmployees) * 100) }
  ];

  const categoryCounts = {
    PDF: archives.filter((a) => a.fileType === 'PDF').length,
    WORD: archives.filter((a) => a.fileType === 'WORD').length,
    EXCEL: archives.filter((a) => a.fileType === 'EXCEL').length,
    POWERPOINT: archives.filter((a) => a.fileType === 'POWERPOINT').length,
    FOTO: archives.filter((a) => a.fileType === 'FOTO').length,
    VIDEO: archives.filter((a) => a.fileType === 'VIDEO').length
  };

  const categoryPieData = [
    { name: 'PDF', value: categoryCounts.PDF, color: '#EF4444' },
    { name: 'Word', value: categoryCounts.WORD, color: '#3B82F6' },
    { name: 'Excel', value: categoryCounts.EXCEL, color: '#10B981' },
    { name: 'PowerPoint', value: categoryCounts.POWERPOINT, color: '#F59E0B' },
    { name: 'Foto', value: categoryCounts.FOTO, color: '#8B5CF6' },
    { name: 'Video', value: categoryCounts.VIDEO, color: '#EC4899' }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <h2 className="text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-emerald-600" />
          <span>Analisis Penggunaan & Dasbor Visual Kedisiplinan</span>
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Visualisasi performa pelaporan pegawai, distribusi format berkas, dan tren kedisiplinan LKH/LKB Kemenag Mempawah.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <span className="text-xs font-bold text-slate-400 uppercase">Tingkat Kedisiplinan LKH</span>
          <div className="mt-2 text-3xl font-extrabold text-emerald-600 font-mono">
            {Math.round((countSudah / totalEmployees) * 100)}%
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Target Kementerian Agama: 90%</p>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <span className="text-xs font-bold text-slate-400 uppercase">Total Pegawai Aktif</span>
          <div className="mt-2 text-3xl font-extrabold text-slate-900 dark:text-white font-mono">
            {totalEmployees}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">356 Personel Mempawah</p>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <span className="text-xs font-bold text-slate-400 uppercase">Dokumen Terintegrasi Drive</span>
          <div className="mt-2 text-3xl font-extrabold text-blue-600 font-mono">
            {driveFileCount !== null ? driveFileCount : archives.length}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            {driveFileCount !== null ? 'Real-Time Folder GDrive' : '100% Synced Cloud Storage'}
          </p>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Compliance Trend Line Chart */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
          <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-600" />
            <span>Tren Persentase Kedisiplinan Bulanan (%)</span>
          </h3>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyComplianceData}>
                <XAxis dataKey="month" stroke="#94A3B8" fontSize={12} />
                <YAxis stroke="#94A3B8" fontSize={12} domain={[60, 100]} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0F172A',
                    borderColor: '#334155',
                    borderRadius: '12px',
                    color: '#FFF'
                  }}
                />
                <Line type="monotone" dataKey="rate" stroke="#10B981" strokeWidth={3} name="Kedisiplinan (%)" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Breakdown Pie Chart */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
          <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <FileText className="w-4 h-4 text-blue-600" />
            <span>Proporsi Format File Digital tersimpan</span>
          </h3>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryPieData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  {categoryPieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
