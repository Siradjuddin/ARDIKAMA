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

  // Ensure clean start state (0 uploaded, all pending) for live testing
  if (!localStorage.getItem('ardika_v3_zero_reset')) {
    localStorage.removeItem('ardika_archives');
    localStorage.removeItem('ardika_compliance');
    localStorage.setItem('ardika_v3_zero_reset', 'true');
  }

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
            // Sort safely by id descending
            remoteArchives.sort((a, b) => {
              const idA = String(a?.id || '');
              const idB = String(b?.id || '');
              return idB.localeCompare(idA);
            });
            setArchives(remoteArchives);
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
        const empDocsInMonth = approvedDocs.filter(
          (a) => a.uploaderNip === emp.nip && (a.uploadDate ? a.uploadDate.startsWith(activeMonth) : false)
        );
        const empSptInYear = approvedDocs.filter(
          (a) => a.uploaderNip === emp.nip && a.docType === 'SPT' && (a.uploadDate ? a.uploadDate.startsWith(activeYear) : false)
        );

        const hasLkh = empDocsInMonth.some((a) => a.docType === 'LKH' || a.docType === 'LKH_LKB');
        const hasLkb = empDocsInMonth.some((a) => a.docType === 'LKB' || a.docType === 'LKH_LKB');
        const hasSpt = empSptInYear.length > 0 || empDocsInMonth.some((a) => a.docType === 'SPT');

        const existingRec = prev.find((r) => r.employeeNip === emp.nip);

        return {
          employeeNip: emp.nip,
          employeeName: emp.name,
          date: selectedDate,
          lkhStatus: hasLkh ? 'SUDAH' : 'BELUM',
          lkbStatus: hasLkb ? 'SUDAH' : 'BELUM',
          sptStatus: hasSpt ? 'SUDAH' : 'BELUM',
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

  // Persist state to local storage
  useEffect(() => {
    localStorage.setItem('ardika_archives', JSON.stringify(archives));
  }, [archives]);

  useEffect(() => {
    localStorage.setItem('ardika_compliance', JSON.stringify(complianceRecords));
  }, [complianceRecords]);

  useEffect(() => {
    localStorage.setItem('ardika_sync_queue', JSON.stringify(pendingSyncQueue));
  }, [pendingSyncQueue]);

  useEffect(() => {
    localStorage.setItem('ardika_notifications', JSON.stringify(notifications));
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

    // Write doc to Firestore Cloud DB so all users see it
    try {
      setDoc(doc(db, 'archives', newDocId), newDoc);
    } catch (e) {
      console.warn('Firestore addArchive notice:', e);
    }

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
    let targetDoc: ArchiveDocument | undefined;
    setArchives((prev) =>
      prev.map((doc) => {
        if (doc.id === docId) {
          targetDoc = doc;
          return {
            ...doc,
            approvalStatus: 'APPROVED',
            rejectionReason: undefined,
            reviewedBy: reviewerName,
            reviewedAt: new Date().toISOString()
          };
        }
        return doc;
      })
    );

    if (targetDoc) {
      try {
        setDoc(doc(db, 'archives', docId), targetDoc);
      } catch (e) {
        console.warn('Firestore approveDocument write notice:', e);
      }

      if (['LKH', 'LKB', 'SPT'].includes(targetDoc.docType)) {
        const typeKey = targetDoc.docType.toLowerCase() as 'lkh' | 'lkb' | 'spt';
        updateCompliance(targetDoc.uploaderNip, typeKey, 'SUDAH');
      }

      sendPushNotification(
        'Laporan Disetujui Admin',
        `Dokumen "${targetDoc.title}" telah diverifikasi dan DISETUJUI oleh ${reviewerName}.`,
        'SUCCESS',
        targetDoc.uploaderNip
      );
    }
  };

  // Tolak dokumen (Reject with reason)
  const rejectDocument = (docId: string, reason: string, reviewerName: string) => {
    let targetDoc: ArchiveDocument | undefined;

    setArchives((prev) =>
      prev.map((doc) => {
        if (doc.id === docId) {
          targetDoc = doc;
          return {
            ...doc,
            approvalStatus: 'REJECTED',
            rejectionReason: reason,
            reviewedBy: reviewerName,
            reviewedAt: new Date().toISOString()
          };
        }
        return doc;
      })
    );

    if (targetDoc) {
      try {
        setDoc(doc(db, 'archives', docId), targetDoc);
      } catch (e) {
        console.warn('Firestore rejectDocument write notice:', e);
      }

      if (['LKH', 'LKB', 'SPT'].includes(targetDoc.docType)) {
        const typeKey = targetDoc.docType.toLowerCase() as 'lkh' | 'lkb' | 'spt';
        updateCompliance(targetDoc.uploaderNip, typeKey, 'BELUM');
      }

      sendPushNotification(
        'Laporan Ditolak Admin',
        `Dokumen "${targetDoc.title}" DITOLAK oleh Admin. Alasan: "${reason}". Silakan unggah ulang perbaikan.`,
        'WARNING',
        targetDoc.uploaderNip
      );
    }
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
    let targetDoc: ArchiveDocument | undefined;

    setArchives((prev) =>
      prev.map((doc) => {
        if (doc.id === docId) {
          const updated: ArchiveDocument = {
            ...doc,
            title: updatedData.title || doc.title,
            fileName: updatedData.fileName || doc.fileName,
            fileSize: updatedData.fileSize || doc.fileSize,
            fileType: updatedData.fileType || doc.fileType,
            driveUrl: updatedData.driveUrl || doc.driveUrl || doc.driveUrl,
            uploadDate: new Date().toISOString().split('T')[0],
            uploadTime: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
            approvalStatus: 'PENDING',
            rejectionReason: undefined,
            reviewedBy: undefined,
            reviewedAt: undefined,
            metadata: {
              ...doc.metadata,
              description: updatedData.description || doc.metadata.description
            }
          };
          targetDoc = updated;
          return updated;
        }
        return doc;
      })
    );

    if (targetDoc) {
      try {
        setDoc(doc(db, 'archives', docId), targetDoc);
      } catch (e) {
        console.warn('Firestore reuploadDocument write notice:', e);
      }

      if (['LKH', 'LKB', 'SPT'].includes(targetDoc.docType)) {
        const typeKey = targetDoc.docType.toLowerCase() as 'lkh' | 'lkb' | 'spt';
        updateCompliance(targetDoc.uploaderNip, typeKey, 'SUDAH');
      }

      sendPushNotification(
        'Perbaikan Berkas Diunggah',
        `Perbaikan dokumen "${targetDoc.title}" berhasil diunggah ulang dan sedang menunggu verifikasi Admin.`,
        'SUCCESS'
      );
    }
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
