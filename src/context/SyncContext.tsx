import React, { createContext, useContext, useEffect, useState } from 'react';
import { collection, doc, setDoc, deleteDoc, onSnapshot } from 'firebase/firestore';
import { ArchiveDocument, ComplianceRecord, FileCategory, PushNotification, SyncQueueItem } from '../types';
import { INITIAL_ARCHIVES, generateInitialComplianceRecords } from '../data/mockArchives';
import { fetchArdikamaDriveCount, isDriveConnected, connectGoogleDrive, disconnectGoogleDrive, db } from '../services/driveService';
import { getAllEmployees } from '../data/employees';

interface SyncContextType {
  isOnline: boolean;
  archives: ArchiveDocument[];
  complianceRecords: ComplianceRecord[];
  pendingSyncQueue: SyncQueueItem[];
  notifications: PushNotification[];
  selectedDate: string; // YYYY-MM-DD
  setSelectedDate: (date: string) => void;
  driveFileCount: number | null;
  refreshDriveCount: () => Promise<void>;
  isDriveConnected: boolean;
  connectDrive: () => Promise<boolean>;
  disconnectDrive: () => Promise<void>;
  addArchive: (doc: Omit<ArchiveDocument, 'id' | 'syncedToCloud'>) => void;
  approveDocument: (docId: string, reviewerName: string) => void;
  rejectDocument: (docId: string, reason: string, reviewerName: string) => void;
  reuploadDocument: (
    docId: string,
    updatedData: {
      title: string;
      fileName: string;
      fileSize: string;
      driveUrl?: string;
      fileType?: FileCategory;
      description?: string;
    }
  ) => void;
  updateCompliance: (nip: string, type: 'lkh' | 'lkb' | 'spt', status: 'SUDAH' | 'BELUM') => void;
  syncNow: () => void;
  sendPushNotification: (title: string, message: string, type?: PushNotification['type'], targetNip?: string) => void;
  markNotificationRead: (id: string) => void;
  clearNotifications: () => void;
  sendWhatsAppReminder: (employeeName: string, employeeNip: string, phone?: string) => void;
  resetSystemData: () => void;
  fcmModalOpen: boolean;
  setFcmModalOpen: (open: boolean) => void;
}

const SyncContext = createContext<SyncContextType | undefined>(undefined);

export const SyncProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    return new Date().toISOString().split('T')[0];
  });

  const [archives, setArchives] = useState<ArchiveDocument[]>(() => {
    const saved = localStorage.getItem('ardika_archives');
    return saved ? JSON.parse(saved) : INITIAL_ARCHIVES;
  });

  const [complianceRecords, setComplianceRecords] = useState<ComplianceRecord[]>(() => {
    const saved = localStorage.getItem('ardika_compliance');
    return saved ? JSON.parse(saved) : generateInitialComplianceRecords(selectedDate);
  });

  const [pendingSyncQueue, setPendingSyncQueue] = useState<SyncQueueItem[]>(() => {
    const saved = localStorage.getItem('ardika_sync_queue');
    return saved ? JSON.parse(saved) : [];
  });

  const [notifications, setNotifications] = useState<PushNotification[]>(() => {
    const saved = localStorage.getItem('ardika_notifications');
    return saved ? JSON.parse(saved) : [
      {
        id: 'notif-1',
        title: 'Sistem ARDIKA Online',
        message: 'Selamat datang di Aplikasi Arsip Digital & Monitoring Pelaporan Kemenag Mempawah.',
        timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
        type: 'INFO',
        read: false
      },
      {
        id: 'notif-2',
        title: 'Pengingat LKH Harian',
        message: 'Mohon seluruh pegawai mengunggah LKH hari ini sebelum pukul 16.00 WIB.',
        timestamp: '08:00',
        type: 'REMINDER',
        read: false
      }
    ];
  });

  const [fcmModalOpen, setFcmModalOpen] = useState<boolean>(false);
  const [driveFileCount, setDriveFileCount] = useState<number | null>(null);
  const [isDriveConnectedState, setIsDriveConnectedState] = useState<boolean>(() => isDriveConnected());

  const refreshDriveCount = async () => {
    const count = await fetchArdikamaDriveCount();
    if (count !== null) {
      setDriveFileCount(count);
      setIsDriveConnectedState(true);
    } else {
      setIsDriveConnectedState(isDriveConnected());
    }
  };

  const connectDrive = async () => {
    try {
      const res = await connectGoogleDrive();
      if (res) {
        setIsDriveConnectedState(true);
        await refreshDriveCount();
        return true;
      }
      return false;
    } catch (e) {
      setIsDriveConnectedState(isDriveConnected());
      throw e;
    }
  };

  const disconnectDrive = async () => {
    await disconnectGoogleDrive();
    setIsDriveConnectedState(false);
    setDriveFileCount(null);
  };

  useEffect(() => {
    refreshDriveCount();
  }, [archives, isOnline]);

  // Helper to sanitize documents before Firestore write to ensure payload size is small (< 100KB) and no undefined properties exist
  const sanitizeDocForFirestore = (docObj: ArchiveDocument): Record<string, any> => {
    const clean: Record<string, any> = {};
    for (const key of Object.keys(docObj)) {
      const val = (docObj as any)[key];
      if (val !== undefined) {
        if (val && typeof val === 'object' && !Array.isArray(val)) {
          const subClean: Record<string, any> = {};
          for (const subKey of Object.keys(val)) {
            if ((val as any)[subKey] !== undefined) {
              subClean[subKey] = (val as any)[subKey];
            }
          }
          clean[key] = subClean;
        } else {
          clean[key] = val;
        }
      }
    }
    if (typeof clean.fileUrl === 'string' && clean.fileUrl.length > 100000) {
      clean.fileUrl = '';
    }
    if (typeof clean.driveUrl === 'string' && clean.driveUrl.length > 100000) {
      clean.driveUrl = 'https://drive.google.com/drive/my-drive';
    }
    return clean;
  };

  // Realtime Firestore synchronization for archives across all devices/users
  useEffect(() => {
    try {
      const unsubscribe = onSnapshot(
        collection(db, 'archives'),
        (snapshot) => {
          if (!snapshot.empty) {
            const remoteArchives: ArchiveDocument[] = [];
            snapshot.forEach((d) => {
              const data = d.data() as ArchiveDocument;
              if (data && (data.title || data.fileName) && (data.uploaderName || data.uploaderNip)) {
                remoteArchives.push({
                  ...data,
                  id: data.id || d.id
                });
              }
            });
            // Merge remote archives safely with local archives so local pending additions are not lost
            setArchives((prev) => {
              const map = new Map<string, ArchiveDocument>();
              prev.forEach((doc) => map.set(String(doc.id), doc));
              remoteArchives.forEach((doc) => map.set(String(doc.id), doc));
              const merged = Array.from(map.values());
              merged.sort((a, b) => String(b?.id || '').localeCompare(String(a?.id || '')));
              return merged;
            });
          }
        },
        (err) => {
          console.warn('Firestore archives snapshot listener notice:', err);
        }
      );
      return () => unsubscribe();
    } catch (err) {
      console.warn('Firestore archives snapshot listener warning:', err);
    }
  }, []);

  // Auto sync compliance records with approved documents in active month
  useEffect(() => {
    const activeMonth = selectedDate.substring(0, 7); // "YYYY-MM"
    const activeYear = selectedDate.substring(0, 4);  // "YYYY"

    const approvedDocs = archives.filter((a) => a.approvalStatus === 'APPROVED');
    const allEmps = getAllEmployees();

    setComplianceRecords((prev) => {
      return allEmps.map((emp) => {
        const empNipNorm = (emp.nip || '').trim();

        const empDocsInMonth = approvedDocs.filter((a) => {
          const uNipNorm = (a.uploaderNip || '').trim();
          if (uNipNorm !== empNipNorm) return false;
          if (!a.uploadDate) return true;
          return a.uploadDate.startsWith(activeMonth) || a.uploadDate.includes(activeMonth);
        });

        const empSptInYear = approvedDocs.filter((a) => {
          const uNipNorm = (a.uploaderNip || '').trim();
          const dTypeNorm = (a.docType || '').toUpperCase();
          if (uNipNorm !== empNipNorm || dTypeNorm !== 'SPT') return false;
          if (!a.uploadDate) return true;
          return a.uploadDate.startsWith(activeYear) || a.uploadDate.includes(activeYear);
        });

        const hasLkh = empDocsInMonth.some((a) => {
          const t = (a.docType || '').toUpperCase();
          return t === 'LKH' || t === 'LKH_LKB';
        });
        const hasLkb = empDocsInMonth.some((a) => {
          const t = (a.docType || '').toUpperCase();
          return t === 'LKB' || t === 'LKH_LKB';
        });
        const hasSpt = empSptInYear.length > 0 || empDocsInMonth.some((a) => (a.docType || '').toUpperCase() === 'SPT');

        const existingRec = prev.find((r) => (r.employeeNip || '').trim() === empNipNorm);

        return {
          employeeNip: emp.nip,
          employeeName: emp.name,
          date: selectedDate,
          lkhStatus: hasLkh ? 'SUDAH' : (existingRec?.lkhStatus === 'SUDAH' ? 'SUDAH' : 'BELUM'),
          lkbStatus: hasLkb ? 'SUDAH' : (existingRec?.lkbStatus === 'SUDAH' ? 'SUDAH' : 'BELUM'),
          sptStatus: hasSpt ? 'SUDAH' : (existingRec?.sptStatus === 'SUDAH' ? 'SUDAH' : 'BELUM'),
          lastUpdated: existingRec?.lastUpdated || new Date().toISOString()
        };
      });
    });
  }, [archives, selectedDate]);

  // Monitor network status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      sendPushNotification('Koneksi Terhubung', 'Sistem kembali online. Memulai sinkronisasi otomatis ke Google Drive...', 'SUCCESS');
      // Auto trigger sync
      setTimeout(() => {
        syncNow();
      }, 1000);
    };

    const handleOffline = () => {
      setIsOnline(false);
      sendPushNotification('Mode Offline Aktif', 'Koneksi internet terputus. Data baru akan disimpan secara lokal dan disinkronkan saat online.', 'WARNING');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [pendingSyncQueue]);

  // Persist state to local storage safely without quota crashes
  useEffect(() => {
    try {
      const safeArchives = archives.map((a) => {
        if ((a.fileUrl && a.fileUrl.length > 200000) || (a.driveUrl && a.driveUrl.length > 200000)) {
          return {
            ...a,
            fileUrl: a.fileUrl && a.fileUrl.length > 200000 ? '' : a.fileUrl,
            driveUrl: a.driveUrl && a.driveUrl.length > 200000 ? 'https://drive.google.com/drive/my-drive' : a.driveUrl
          };
        }
        return a;
      });
      localStorage.setItem('ardika_archives', JSON.stringify(safeArchives));
    } catch (e) {
      console.warn('LocalStorage save archives notice:', e);
    }
  }, [archives]);

  useEffect(() => {
    try {
      localStorage.setItem('ardika_compliance', JSON.stringify(complianceRecords));
    } catch (e) {
      console.warn('LocalStorage save compliance notice:', e);
    }
  }, [complianceRecords]);

  useEffect(() => {
    try {
      localStorage.setItem('ardika_sync_queue', JSON.stringify(pendingSyncQueue));
    } catch (e) {
      console.warn('LocalStorage save queue notice:', e);
    }
  }, [pendingSyncQueue]);

  useEffect(() => {
    try {
      localStorage.setItem('ardika_notifications', JSON.stringify(notifications));
    } catch (e) {
      console.warn('LocalStorage save notifications notice:', e);
    }
  }, [notifications]);

  // Push notification helper
  const sendPushNotification = (title: string, message: string, type: PushNotification['type'] = 'INFO', targetNip?: string) => {
    const newNotif: PushNotification = {
      id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      title,
      message,
      timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
      type,
      read: false,
      targetNip
    };
    setNotifications((prev) => [newNotif, ...prev]);
  };

  const markNotificationRead = (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  };

  const clearNotifications = () => {
    setNotifications([]);
  };

  // Upload document to Google Drive storage / local cache
  const addArchive = (docData: Omit<ArchiveDocument, 'id' | 'syncedToCloud'>) => {
    const newDocId = `doc-${Date.now()}`;
    const synced = isOnline;

    const newDoc: ArchiveDocument = {
      ...docData,
      id: newDocId,
      syncedToCloud: synced,
      approvalStatus: docData.approvalStatus || 'PENDING'
    };

    setArchives((prev) => [newDoc, ...prev]);

    // Write doc to Firestore Cloud DB safely with sanitized payload
    setDoc(doc(db, 'archives', newDocId), sanitizeDocForFirestore(newDoc)).catch((e) => {
      console.warn('Firestore addArchive setDoc warning:', e);
    });

    if (!synced) {
      const queueItem: SyncQueueItem = {
        id: `q-${Date.now()}`,
        action: 'UPLOAD_ARCHIVE',
        payload: newDoc,
        createdAt: new Date().toISOString()
      };
      setPendingSyncQueue((prev) => [...prev, queueItem]);
      sendPushNotification(
        'Arsip Disimpan Lokal (Offline)',
        `File "${docData.title}" disimpan secara lokal dan akan diunggah ke Google Drive setelah online.`,
        'WARNING'
      );
    } else {
      sendPushNotification(
        'Berhasil Unggah ke Cloud ARDIKAMA',
        `File "${docData.title}" berhasil diunggah dengan metadata NIP: ${docData.uploaderNip}.`,
        'SUCCESS'
      );
    }
  };

  // Update compliance status for employee
  const updateCompliance = (nip: string, type: 'lkh' | 'lkb' | 'spt', status: 'SUDAH' | 'BELUM') => {
    setComplianceRecords((prev) =>
      prev.map((rec) => {
        if (rec.employeeNip === nip) {
          const updated = { ...rec };
          if (type === 'lkh') updated.lkhStatus = status;
          if (type === 'lkb') updated.lkbStatus = status;
          if (type === 'spt') updated.sptStatus = status;
          updated.lastUpdated = new Date().toISOString();
          return updated;
        }
        return rec;
      })
    );

    if (!isOnline) {
      setPendingSyncQueue((prev) => [
        ...prev,
        {
          id: `q-${Date.now()}`,
          action: 'UPDATE_COMPLIANCE',
          payload: { nip, type, status, date: selectedDate },
          createdAt: new Date().toISOString()
        }
      ]);
    }
  };

  // Setujui dokumen (Approve)
  const approveDocument = (docId: string, reviewerName: string) => {
    const existing = archives.find((d) => String(d.id) === String(docId));
    const nowIso = new Date().toISOString();

    const targetDoc: ArchiveDocument = existing
      ? {
          ...existing,
          approvalStatus: 'APPROVED',
          rejectionReason: undefined,
          reviewedBy: reviewerName,
          reviewedAt: nowIso
        }
      : {
          id: docId,
          title: 'Dokumen Laporan',
          fileName: 'dokumen.pdf',
          fileSize: '1.0 MB',
          fileType: 'PDF',
          docType: 'LKH_LKB',
          uploaderNip: '',
          uploaderName: '',
          uploadDate: new Date().toISOString().split('T')[0],
          uploadTime: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
          driveUrl: '',
          approvalStatus: 'APPROVED',
          reviewedBy: reviewerName,
          reviewedAt: nowIso,
          syncedToCloud: true,
          metadata: {
            description: 'Dokumen Laporan Resmi ARDIKAMA',
            period: 'Bulan Ini',
            year: 2026,
            tags: ['ARDIKAMA', 'LKH_LKB']
          }
        };

    setArchives((prev) =>
      prev.map((docItem) => (String(docItem.id) === String(docId) ? targetDoc : docItem))
    );

    setDoc(doc(db, 'archives', docId), sanitizeDocForFirestore(targetDoc)).catch((e) => {
      console.warn('Firestore approveDocument write notice:', e);
    });

    const docTypeUpper = (targetDoc.docType || '').toUpperCase();
    if (['LKH', 'LKB', 'LKH_LKB', 'SPT'].includes(docTypeUpper)) {
      if (docTypeUpper === 'LKH_LKB') {
        updateCompliance(targetDoc.uploaderNip, 'lkh', 'SUDAH');
        updateCompliance(targetDoc.uploaderNip, 'lkb', 'SUDAH');
      } else if (docTypeUpper === 'LKH') {
        updateCompliance(targetDoc.uploaderNip, 'lkh', 'SUDAH');
      } else if (docTypeUpper === 'LKB') {
        updateCompliance(targetDoc.uploaderNip, 'lkb', 'SUDAH');
      } else if (docTypeUpper === 'SPT') {
        updateCompliance(targetDoc.uploaderNip, 'spt', 'SUDAH');
      }
    }

    sendPushNotification(
      'Laporan Disetujui Admin',
      `Dokumen "${targetDoc.title}" telah diverifikasi dan DISETUJUI oleh ${reviewerName}.`,
      'SUCCESS',
      targetDoc.uploaderNip
    );
  };

  // Tolak dokumen (Reject with reason)
  const rejectDocument = (docId: string, reason: string, reviewerName: string) => {
    const existing = archives.find((d) => String(d.id) === String(docId));
    if (!existing) return;
    const nowIso = new Date().toISOString();

    const targetDoc: ArchiveDocument = {
      ...existing,
      approvalStatus: 'REJECTED',
      rejectionReason: reason,
      reviewedBy: reviewerName,
      reviewedAt: nowIso
    };

    setArchives((prev) =>
      prev.map((docItem) => (String(docItem.id) === String(docId) ? targetDoc : docItem))
    );

    setDoc(doc(db, 'archives', docId), sanitizeDocForFirestore(targetDoc)).catch((e) => {
      console.warn('Firestore rejectDocument write notice:', e);
    });

    const docTypeUpper = (targetDoc.docType || '').toUpperCase();
    if (['LKH', 'LKB', 'LKH_LKB', 'SPT'].includes(docTypeUpper)) {
      if (docTypeUpper === 'LKH_LKB') {
        updateCompliance(targetDoc.uploaderNip, 'lkh', 'BELUM');
        updateCompliance(targetDoc.uploaderNip, 'lkb', 'BELUM');
      } else if (docTypeUpper === 'LKH') {
        updateCompliance(targetDoc.uploaderNip, 'lkh', 'BELUM');
      } else if (docTypeUpper === 'LKB') {
        updateCompliance(targetDoc.uploaderNip, 'lkb', 'BELUM');
      } else if (docTypeUpper === 'SPT') {
        updateCompliance(targetDoc.uploaderNip, 'spt', 'BELUM');
      }
    }

    sendPushNotification(
      'Laporan Ditolak Admin',
      `Dokumen "${targetDoc.title}" DITOLAK oleh Admin. Alasan: "${reason}". Silakan unggah ulang perbaikan.`,
      'WARNING',
      targetDoc.uploaderNip
    );
  };

  // Unggah ulang dokumen perbaikan (Re-upload)
  const reuploadDocument = (
    docId: string,
    updatedData: {
      title: string;
      fileName: string;
      fileSize: string;
      driveUrl?: string;
      fileType?: FileCategory;
      description?: string;
    }
  ) => {
    const existing = archives.find((d) => String(d.id) === String(docId));
    if (!existing) return;

    const targetDoc: ArchiveDocument = {
      ...existing,
      title: updatedData.title || existing.title,
      fileName: updatedData.fileName || existing.fileName,
      fileSize: updatedData.fileSize || existing.fileSize,
      fileType: updatedData.fileType || existing.fileType,
      driveUrl: updatedData.driveUrl || existing.driveUrl,
      uploadDate: new Date().toISOString().split('T')[0],
      uploadTime: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
      approvalStatus: 'PENDING',
      rejectionReason: undefined,
      reviewedBy: undefined,
      reviewedAt: undefined,
      metadata: {
        ...existing.metadata,
        description: updatedData.description || existing.metadata?.description
      }
    };

    setArchives((prev) =>
      prev.map((docItem) => (String(docItem.id) === String(docId) ? targetDoc : docItem))
    );

    setDoc(doc(db, 'archives', docId), sanitizeDocForFirestore(targetDoc)).catch((e) => {
      console.warn('Firestore reuploadDocument write notice:', e);
    });

    sendPushNotification(
      'Perbaikan Dokumen Diunggah',
      `Perbaikan dokumen "${targetDoc.title}" berhasil diunggah. Menunggu verifikasi admin.`,
      'INFO',
      targetDoc.uploaderNip
    );
  };

  // Perform manual or automatic cloud sync
  const syncNow = () => {
    if (!isOnline) {
      sendPushNotification('Gagal Sinkronisasi', 'Tidak ada koneksi internet. Periksa kembali sambungan Anda.', 'WARNING');
      return;
    }

    if (pendingSyncQueue.length === 0) {
      sendPushNotification('Sinkronisasi Selesai', 'Seluruh arsip dan status kedisiplinan sudah tersinkronisasi penuh dengan Google Drive Cloud.', 'SUCCESS');
      return;
    }

    // Mark archives as synced
    setArchives((prev) =>
      prev.map((doc) => ({
        ...doc,
        syncedToCloud: true
      }))
    );

    const count = pendingSyncQueue.length;
    setPendingSyncQueue([]);
    sendPushNotification(
      'Sinkronisasi Otomatis Sukses',
      `Berhasil mensinkronkan ${count} item antrean lokal ke Google Drive API Kemenag Mempawah.`,
      'SUCCESS'
    );
  };

  // WhatsApp reminder generator
  const sendWhatsAppReminder = (employeeName: string, employeeNip: string, phone?: string) => {
    const formattedPhone = phone && phone.length > 5 ? phone.replace(/\D/g, '') : '';
    const text = `*PEMBERITAHUAN ARDIKA (Kemenag Mempawah)*%0A%0AAssalamu'alaikum Yth. Bapak/Ibu *${employeeName}* (NIP: ${employeeNip}),%0A%0AKami menginfokan bahwa laporan LKH/LKB Anda untuk tanggal *${selectedDate}* *BELUM TERCATAT* di sistem ARDIKA.%0A%0AMohon segera melakukan unggah dokumen melalui aplikasi ARDIKA.%0A%0A_Terima Kasih._%0ASistem ARDIKA - Kemenag Kabupaten Mempawah`;

    const waUrl = formattedPhone
      ? `https://wa.me/${formattedPhone}?text=${text}`
      : `https://wa.me/?text=${text}`;

    window.open(waUrl, '_blank');
    sendPushNotification('Peringatan WhatsApp Terkirim', `Notifikasi pengingat dikirim ke ${employeeName}`, 'INFO');
  };

  // Reset all system data (Admin only control)
  const resetSystemData = () => {
    setArchives([]);
    const freshCompliance = generateInitialComplianceRecords(selectedDate);
    setComplianceRecords(freshCompliance);
    setPendingSyncQueue([]);
    localStorage.removeItem('ardika_archives');
    localStorage.setItem('ardika_compliance', JSON.stringify(freshCompliance));
    localStorage.removeItem('ardika_sync_queue');
    sendPushNotification(
      'Reset Data Berhasil',
      'Seluruh jumlah hitungan terupload dan arsip laporan telah di-reset ke 0 oleh Admin.',
      'WARNING'
    );
  };

  return (
    <SyncContext.Provider
      value={{
        isOnline,
        archives,
        complianceRecords,
        pendingSyncQueue,
        notifications,
        selectedDate,
        setSelectedDate,
        driveFileCount,
        refreshDriveCount,
        isDriveConnected: isDriveConnectedState,
        connectDrive,
        disconnectDrive,
        addArchive,
        approveDocument,
        rejectDocument,
        reuploadDocument,
        updateCompliance,
        syncNow,
        sendPushNotification,
        markNotificationRead,
        clearNotifications,
        sendWhatsAppReminder,
        resetSystemData,
        fcmModalOpen,
        setFcmModalOpen
      }}
    >
      {children}
    </SyncContext.Provider>
  );
};

export const useSync = () => {
  const context = useContext(SyncContext);
  if (!context) {
    throw new Error('useSync must be used within a SyncProvider');
  }
  return context;
};
