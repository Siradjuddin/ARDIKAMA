import React, { useState } from 'react';
import { getAllEmployees } from '../data/employees';
import { useAuth } from '../context/AuthContext';
import { maskNip, getASNStatus } from '../utils/formatters';
import { Employee } from '../types';
import {
  CheckCircle2,
  Filter,
  KeyRound,
  PlusCircle,
  RotateCcw,
  Search,
  Send,
  ShieldCheck,
  Trash2,
  User,
  UserCheck,
  UserPlus,
  Users,
  X
} from 'lucide-react';

export const EmployeeList: React.FC = () => {
  const { isAdmin, addEmployee, deleteEmployee, resetEmployeePassword } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'SEMUA' | 'ADMIN' | 'PEGAWAI'>('SEMUA');
  const [asnFilter, setAsnFilter] = useState<'SEMUA' | 'ASN' | 'NON_ASN'>('SEMUA');

  // Modals & Feedback
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [targetEmployee, setTargetEmployee] = useState<Employee | null>(null);

  // New Employee Form state
  const [newName, setNewName] = useState('');
  const [newNip, setNewNip] = useState('');
  const [newRole, setNewRole] = useState<'PEGAWAI' | 'ADMIN'>('PEGAWAI');
  const [newStatusASN, setNewStatusASN] = useState<'ASN' | 'NON_ASN'>('ASN');
  const [newJabatan, setNewJabatan] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newPassword, setNewPassword] = useState('');

  // Reset Password Form state
  const [customResetPass, setCustomResetPass] = useState('');

  // Toast feedback
  const [toastMsg, setToastMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const allEmployees = getAllEmployees();

  // Statistics calculation
  const totalEmployeesCount = allEmployees.length;
  const asnCount = allEmployees.filter((e) => getASNStatus(e) === 'ASN').length;
  const nonAsnCount = allEmployees.filter((e) => getASNStatus(e) === 'NON_ASN').length;

  const filteredEmployees = allEmployees.filter((emp) => {
    const matchesRole =
      roleFilter === 'SEMUA' ||
      (roleFilter === 'ADMIN' && (emp.role === 'ADMIN' || ['198904092019031008', '199205082023211022'].includes(emp.nip))) ||
      (roleFilter === 'PEGAWAI' && emp.role !== 'ADMIN');

    const empASNStatus = getASNStatus(emp);
    const matchesASN = asnFilter === 'SEMUA' || empASNStatus === asnFilter;

    const matchesSearch =
      emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.nip.includes(searchQuery);

    return matchesRole && matchesASN && matchesSearch;
  });

  const handleCreateEmployeeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newNip.trim()) {
      setToastMsg({ type: 'error', text: 'Nama dan NIP Pegawai wajib diisi!' });
      return;
    }

    const res = addEmployee({
      name: newName,
      nip: newNip,
      role: newRole,
      statusASN: newStatusASN,
      jabatan: newJabatan || 'Pegawai Kemenag Mempawah',
      phone: newPhone,
      password: newPassword
    });

    if (res.success) {
      setToastMsg({ type: 'success', text: res.message });
      setAddModalOpen(false);
      setNewName('');
      setNewNip('');
      setNewJabatan('');
      setNewPhone('');
      setNewPassword('');
    } else {
      setToastMsg({ type: 'error', text: res.message });
    }
  };

  const handleOpenResetModal = (emp: Employee) => {
    setTargetEmployee(emp);
    setCustomResetPass(emp.nip); // default reset password is NIP
    setResetModalOpen(true);
  };

  const handleResetPasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetEmployee) return;

    const res = resetEmployeePassword(targetEmployee.nip, customResetPass);
    if (res.success) {
      setToastMsg({ type: 'success', text: res.message });
      setResetModalOpen(false);
      setTargetEmployee(null);
    } else {
      setToastMsg({ type: 'error', text: res.message });
    }
  };

  const handleDeleteEmployee = (nip: string, name: string) => {
    if (confirm(`Apakah Anda yakin ingin MENGHAPUS akun pegawai "${name}" (NIP: ${nip})?`)) {
      const res = deleteEmployee(nip);
      if (res.success) {
        setToastMsg({ type: 'success', text: res.message });
      } else {
        setToastMsg({ type: 'error', text: res.message });
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Banner */}
      {toastMsg && (
        <div
          className={`p-4 rounded-2xl border text-xs font-extrabold flex items-center justify-between shadow-md animate-fadeIn ${
            toastMsg.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950 border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
              : 'bg-rose-50 dark:bg-rose-950 border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-200'
          }`}
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <span>{toastMsg.text}</span>
          </div>
          <button onClick={() => setToastMsg(null)} className="p-1 hover:opacity-75">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header & Stats Cards */}
      <div className="space-y-4">
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-emerald-600" />
              <span>Database Pegawai Kemenag Mempawah ({totalEmployeesCount})</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Daftar lengkap Aparatur Sipil Negara (PNS / PPPK / Non-ASN) terdaftar di sistem ARDIKAMA.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Admin Add Employee Action */}
            {isAdmin && (
              <button
                onClick={() => setAddModalOpen(true)}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-md transition-transform active:scale-95 flex items-center gap-2"
              >
                <UserPlus className="w-4 h-4" />
                <span>Tambah Akun Pegawai</span>
              </button>
            )}
          </div>
        </div>

        {/* Summary Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div
            onClick={() => setAsnFilter('SEMUA')}
            className={`p-4 rounded-2xl border transition-all cursor-pointer ${
              asnFilter === 'SEMUA'
                ? 'bg-slate-900 text-white border-slate-900 dark:bg-emerald-950 dark:border-emerald-700 dark:text-white shadow-md'
                : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 text-slate-800 dark:text-slate-200 hover:border-slate-300'
            }`}
          >
            <p className="text-[11px] font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider">Total Pegawai</p>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-2xl font-black">{totalEmployeesCount}</span>
              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-slate-100/20 text-emerald-400">100%</span>
            </div>
            <p className="text-[10px] text-slate-400 dark:text-slate-400 mt-0.5">Semua Personel Terdata</p>
          </div>

          <div
            onClick={() => setAsnFilter('ASN')}
            className={`p-4 rounded-2xl border transition-all cursor-pointer ${
              asnFilter === 'ASN'
                ? 'bg-emerald-600 text-white border-emerald-600 shadow-md dark:bg-emerald-950 dark:border-emerald-700'
                : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 text-slate-800 dark:text-slate-200 hover:border-emerald-300'
            }`}
          >
            <p className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Aparatur Sipil Negara (ASN)</p>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-2xl font-black text-emerald-950 dark:text-white">{asnCount}</span>
              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300">
                {Math.round((asnCount / totalEmployeesCount) * 100)}%
              </span>
            </div>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Pegawai ASN Terdaftar</p>
          </div>

          <div
            onClick={() => setAsnFilter('NON_ASN')}
            className={`p-4 rounded-2xl border transition-all cursor-pointer ${
              asnFilter === 'NON_ASN'
                ? 'bg-slate-700 text-white border-slate-700 shadow-md dark:bg-slate-800'
                : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 text-slate-800 dark:text-slate-200 hover:border-slate-300'
            }`}
          >
            <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Non-ASN</p>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-2xl font-black text-slate-900 dark:text-white">{nonAsnCount}</span>
              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                {Math.round((nonAsnCount / totalEmployeesCount) * 100)}%
              </span>
            </div>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Honorer / Pegawai Kontrak</p>
          </div>
        </div>
      </div>

      {/* Filter Controls & Search */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* ASN Status Filter Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
            <span className="text-xs font-bold text-slate-500 flex items-center gap-1 shrink-0">
              <Filter className="w-3.5 h-3.5 text-emerald-600" />
              Status:
            </span>
            <div className="flex rounded-xl bg-slate-100 dark:bg-slate-800 p-1 text-xs font-bold shrink-0">
              <button
                onClick={() => setAsnFilter('SEMUA')}
                className={`px-3 py-1.5 rounded-lg transition-colors ${
                  asnFilter === 'SEMUA' ? 'bg-white dark:bg-slate-900 shadow-sm text-slate-900 dark:text-white' : 'text-slate-500'
                }`}
              >
                Semua Status
              </button>
              <button
                onClick={() => setAsnFilter('ASN')}
                className={`px-3 py-1.5 rounded-lg transition-colors ${
                  asnFilter === 'ASN' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-500'
                }`}
              >
                ASN ({asnCount})
              </button>
              {nonAsnCount > 0 && (
                <button
                  onClick={() => setAsnFilter('NON_ASN')}
                  className={`px-3 py-1.5 rounded-lg transition-colors ${
                    asnFilter === 'NON_ASN' ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-500'
                  }`}
                >
                  Non-ASN ({nonAsnCount})
                </button>
              )}
            </div>
          </div>

          {/* Role Filter Tabs */}
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs font-bold text-slate-500 hidden md:inline">Hak Akses:</span>
            <div className="flex rounded-xl bg-slate-100 dark:bg-slate-800 p-1 text-xs font-bold">
              <button
                onClick={() => setRoleFilter('SEMUA')}
                className={`px-3 py-1.5 rounded-lg transition-colors ${
                  roleFilter === 'SEMUA' ? 'bg-white dark:bg-slate-900 shadow-sm text-slate-900 dark:text-white' : 'text-slate-500'
                }`}
              >
                Semua Role
              </button>
              <button
                onClick={() => setRoleFilter('ADMIN')}
                className={`px-3 py-1.5 rounded-lg transition-colors ${
                  roleFilter === 'ADMIN' ? 'bg-white dark:bg-slate-900 shadow-sm text-slate-900 dark:text-white' : 'text-slate-500'
                }`}
              >
                Admin
              </button>
              <button
                onClick={() => setRoleFilter('PEGAWAI')}
                className={`px-3 py-1.5 rounded-lg transition-colors ${
                  roleFilter === 'PEGAWAI' ? 'bg-white dark:bg-slate-900 shadow-sm text-slate-900 dark:text-white' : 'text-slate-500'
                }`}
              >
                Pegawai
              </button>
            </div>
          </div>
        </div>

        {/* Search Input */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Cari nama pegawai atau NIP (contoh: 198904092019031008)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white dark:focus:bg-slate-900 transition-colors"
          />
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-slate-500 uppercase font-bold tracking-wider">
              <tr>
                <th className="py-3.5 px-4 w-12 text-center">No</th>
                <th className="py-3.5 px-4">Nama Pegawai</th>
                <th className="py-3.5 px-4 font-mono">NIP (Username)</th>
                <th className="py-3.5 px-4 text-center">Status ASN</th>
                <th className="py-3.5 px-4">Jabatan / Satker</th>
                <th className="py-3.5 px-4 text-center">Hak Akses</th>
                <th className="py-3.5 px-4 text-right">Aksi & Kontak</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredEmployees.map((emp) => {
                const isAdminUser = emp.role === 'ADMIN' || ['198904092019031008', '199205082023211022'].includes(emp.nip);
                const statusASN = getASNStatus(emp);

                return (
                  <tr key={emp.nip} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50">
                    <td className="py-3 px-4 font-mono font-bold text-slate-400 text-center">
                      {emp.no}
                    </td>

                    <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                      <div className="flex items-center gap-2">
                        {emp.avatarUrl ? (
                          <img src={emp.avatarUrl} alt={emp.name} className="w-6 h-6 rounded-full object-cover shrink-0" />
                        ) : null}
                        <span className="line-clamp-1">{emp.name}</span>
                      </div>
                    </td>

                    <td className="py-3 px-4 font-mono text-slate-600 dark:text-slate-400 font-bold whitespace-nowrap">
                      {maskNip(emp.nip, isAdmin)}
                    </td>

                    <td className="py-3 px-4 text-center">
                      {statusASN === 'ASN' ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                          ASN
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                          Non-ASN
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-slate-600 dark:text-slate-400">
                      {emp.jabatan || 'Pegawai Kemenag Mempawah'}
                    </td>

                    <td className="py-3 px-4 text-center">
                      {isAdminUser ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[10px] font-extrabold bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-200 border border-amber-300 dark:border-amber-800">
                          <ShieldCheck className="w-3 h-3" />
                          <span>ADMIN</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                          <span>PEGAWAI</span>
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {isAdmin && (
                          <>
                            <button
                              onClick={() => handleOpenResetModal(emp)}
                              className="px-2.5 py-1.5 rounded-lg bg-amber-100 hover:bg-amber-200 dark:bg-amber-950 dark:hover:bg-amber-900 text-amber-800 dark:text-amber-200 text-[11px] font-bold inline-flex items-center gap-1 transition-colors"
                              title="Reset Password Akun Pegawai"
                            >
                              <KeyRound className="w-3 h-3" />
                              <span>Reset Pass</span>
                            </button>

                            {emp.nip !== '198904092019031008' && emp.nip !== '199205082023211022' && (
                              <button
                                onClick={() => handleDeleteEmployee(emp.nip, emp.name)}
                                className="px-2 py-1.5 rounded-lg bg-rose-100 hover:bg-rose-200 dark:bg-rose-950 dark:hover:bg-rose-900 text-rose-800 dark:text-rose-200 text-[11px] font-bold inline-flex items-center gap-1 transition-colors"
                                title="Hapus Akun Pegawai"
                              >
                                <Trash2 className="w-3 h-3" />
                                <span>Hapus</span>
                              </button>
                            )}
                          </>
                        )}

                        <a
                          href={`https://wa.me/?text=Halo%20${encodeURIComponent(emp.name)}%20(NIP:%20${emp.nip})`}
                          target="_blank"
                          rel="noreferrer"
                          className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold inline-flex items-center gap-1"
                        >
                          <Send className="w-3 h-3" />
                          <span>WA</span>
                        </a>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal 1: Tambah Akun Pegawai Baru */}
      {addModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b pb-3 dark:border-slate-800">
              <div className="flex items-center gap-2 text-emerald-600">
                <UserPlus className="w-5 h-5" />
                <h3 className="font-extrabold text-slate-900 dark:text-white text-base">
                  Tambah Akun Pegawai Baru
                </h3>
              </div>
              <button onClick={() => setAddModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateEmployeeSubmit} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Nama Lengkap & Gelar *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: AHMAD FAUZI S.Ag., M.Pd"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  NIP Pegawai (Digunakan sebagai Username) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="18 Digit NIP (contoh: 198501012010011001)"
                  value={newNip}
                  onChange={(e) => setNewNip(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Status Kepegawaian *
                  </label>
                  <select
                    value={newStatusASN}
                    onChange={(e) => setNewStatusASN(e.target.value as 'ASN' | 'NON_ASN')}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="ASN">ASN (Aparatur Sipil Negara)</option>
                    <option value="NON_ASN">Non-ASN / Honorer</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Hak Akses Sistem
                  </label>
                  <select
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value as 'PEGAWAI' | 'ADMIN')}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="PEGAWAI">PEGAWAI</option>
                    <option value="ADMIN">ADMINISTRATOR</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Jabatan / Satker
                </label>
                <input
                  type="text"
                  placeholder="Jabatan"
                  value={newJabatan}
                  onChange={(e) => setNewJabatan(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Password Awal (Opsional - Default adalah NIP)
                </label>
                <input
                  type="text"
                  placeholder="Password khusus (kosongkan jika default NIP)"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl border text-slate-600 font-bold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold shadow-md"
                >
                  Simpan Akun
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Reset Password Pegawai */}
      {resetModalOpen && targetEmployee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b pb-3 dark:border-slate-800">
              <div className="flex items-center gap-2 text-amber-600">
                <RotateCcw className="w-5 h-5" />
                <h3 className="font-extrabold text-slate-900 dark:text-white text-base">
                  Reset Password Akun Pegawai
                </h3>
              </div>
              <button onClick={() => setResetModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/70 border border-amber-200 dark:border-amber-800 text-xs text-amber-900 dark:text-amber-200 space-y-1">
              <p>Anda akan mereset password untuk akun pegawai:</p>
              <p className="font-extrabold text-sm text-slate-900 dark:text-white">{targetEmployee.name}</p>
              <p className="font-mono text-[11px] text-slate-600 dark:text-slate-400">NIP: {targetEmployee.nip}</p>
            </div>

            <form onSubmit={handleResetPasswordSubmit} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Password Baru Pegawai
                </label>
                <input
                  type="text"
                  required
                  value={customResetPass}
                  onChange={(e) => setCustomResetPass(e.target.value)}
                  placeholder="Password Baru"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono font-bold focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Default diisi dengan NIP pegawai ({targetEmployee.nip}).
                </span>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setResetModalOpen(false)}
                  className="px-4 py-2 rounded-xl border text-slate-600 font-bold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-extrabold shadow-md"
                >
                  Reset Password Now
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
