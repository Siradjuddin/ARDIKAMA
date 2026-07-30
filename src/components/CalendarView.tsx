import React, { useState } from 'react';
import { useSync } from '../context/SyncContext';
import { EMPLOYEES_DATA } from '../data/employees';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  FileCheck,
  Search,
  UserCheck
} from 'lucide-react';

export const CalendarView: React.FC = () => {
  const { archives, selectedDate, setSelectedDate } = useSync();

  const [currentYear, setCurrentYear] = useState(2026);
  const [currentMonth, setCurrentMonth] = useState(6); // 0-indexed: 6 = July
  const [filterQuery, setFilterQuery] = useState('');

  const monthNames = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];

  // Helper for days in month
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay();

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((prev) => prev - 1);
    } else {
      setCurrentMonth((prev) => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((prev) => prev + 1);
    } else {
      setCurrentMonth((prev) => prev + 1);
    }
  };

  // Get archives uploaded on selectedDate
  const archivesForSelectedDate = archives.filter(
    (doc) => doc.uploadDate === selectedDate
  ).filter((doc) =>
    doc.uploaderName.toLowerCase().includes(filterQuery.toLowerCase()) ||
    doc.uploaderNip.includes(filterQuery) ||
    doc.title.toLowerCase().includes(filterQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Calendar Header Banner */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 text-emerald-600" />
            <span>Kalender Integration & Riwayat Laporan</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Pantau riwayat unggah LKH, LKB, dan SPT harian secara intuitif melalui tampilan kalender interaktif.
          </p>
        </div>

        {/* Month Navigator */}
        <div className="flex items-center gap-3">
          <button
            onClick={handlePrevMonth}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="font-extrabold text-sm font-mono min-w-[130px] text-center">
            {monthNames[currentMonth]} {currentYear}
          </span>
          <button
            onClick={handleNextMonth}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Grid Layout: Left Calendar Grid, Right Day Detail Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Monthly Calendar Grid */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
          {/* Day Headers */}
          <div className="grid grid-cols-7 gap-1 text-center font-bold text-xs text-slate-400 uppercase tracking-wider pb-2 border-b border-slate-100 dark:border-slate-800">
            <span>Ming</span>
            <span>Sen</span>
            <span>Sel</span>
            <span>Rab</span>
            <span>Kam</span>
            <span>Jum</span>
            <span>Sab</span>
          </div>

          {/* Days Cells */}
          <div className="grid grid-cols-7 gap-1.5">
            {/* Blank padding cells */}
            {Array.from({ length: firstDayIndex }).map((_, i) => (
              <div key={`blank-${i}`} className="h-20 rounded-xl bg-slate-50/50 dark:bg-slate-800/20" />
            ))}

            {/* Days in Month */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const dayNum = i + 1;
              const formattedDay = dayNum < 10 ? `0${dayNum}` : `${dayNum}`;
              const formattedMonth = currentMonth + 1 < 10 ? `0${currentMonth + 1}` : `${currentMonth + 1}`;
              const dateStr = `${currentYear}-${formattedMonth}-${formattedDay}`;

              const isSelected = dateStr === selectedDate;
              const archivesOnDay = archives.filter((a) => a.uploadDate === dateStr);

              return (
                <button
                  key={dateStr}
                  onClick={() => setSelectedDate(dateStr)}
                  className={`h-20 p-2 rounded-xl border text-left flex flex-col justify-between transition-all ${
                    isSelected
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-md ring-2 ring-emerald-500/30'
                      : 'bg-white dark:bg-slate-800/60 border-slate-200 dark:border-slate-800 hover:border-emerald-500'
                  }`}
                >
                  <span className={`text-xs font-bold font-mono ${isSelected ? 'text-white' : 'text-slate-800 dark:text-slate-200'}`}>
                    {dayNum}
                  </span>

                  {archivesOnDay.length > 0 && (
                    <div className="mt-auto">
                      <span
                        className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded-full inline-block truncate ${
                          isSelected
                            ? 'bg-white text-emerald-900'
                            : 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                        }`}
                      >
                        {archivesOnDay.length} Berkas
                      </span>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Col: Timeline History for Selected Date */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                Riwayat Unggah Tanggal:
              </h3>
              <p className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">
                {selectedDate}
              </p>
            </div>
            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono">
              {archivesForSelectedDate.length} File
            </span>
          </div>

          {/* Search Filter by Name or NIP */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Filter nama pegawai / NIP..."
              value={filterQuery}
              onChange={(e) => setFilterQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none"
            />
          </div>

          {/* Feed List */}
          <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
            {archivesForSelectedDate.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                Belum ada berkas arsip tercatat pada tanggal {selectedDate}.
              </div>
            ) : (
              archivesForSelectedDate.map((doc) => (
                <div
                  key={doc.id}
                  className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/50 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-mono">
                        {doc.docType}
                      </span>
                      {doc.approvalStatus === 'APPROVED' ? (
                        <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-emerald-500 text-white">
                          Disetujui
                        </span>
                      ) : doc.approvalStatus === 'REJECTED' ? (
                        <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-rose-500 text-white">
                          Ditolak
                        </span>
                      ) : (
                        <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-amber-500 text-white">
                          Menunggu ACC
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {doc.uploadTime} WIB
                    </span>
                  </div>

                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                      {doc.title}
                    </h4>
                    <p className="text-[11px] font-bold text-slate-700 dark:text-slate-300 mt-1">
                      {doc.uploaderName}
                    </p>
                    <p className="text-[10px] text-slate-400 font-mono">
                      NIP: {doc.uploaderNip}
                    </p>
                  </div>

                  <a
                    href={doc.driveUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline block pt-1"
                  >
                    Buka Google Drive →
                  </a>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
