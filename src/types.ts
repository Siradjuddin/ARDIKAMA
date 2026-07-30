export type Role = 'ADMIN' | 'PEGAWAI';
export type ASNStatus = 'ASN' | 'NON_ASN';

export interface Employee {
  id: string;
  no: number;
  name: string;
  nip: string;
  role: Role;
  statusASN?: ASNStatus;
  jabatan?: string;
  unit?: string;
  phone?: string;
  avatarUrl?: string;
  password?: string;
}

export type DocumentType = 'LKH_LKB' | 'LKH' | 'LKB' | 'SPT' | 'ARSIP_KANTOR' | 'ARSIP_LAIN';
export type FileCategory = 'PDF' | 'WORD' | 'EXCEL' | 'POWERPOINT' | 'FOTO' | 'VIDEO';

export interface ArchiveDocument {
  id: string;
  title: string;
  fileName: string;
  fileSize: string;
  fileType: FileCategory;
  docType: DocumentType;
  uploaderNip: string;
  uploaderName: string;
  uploadDate: string; // ISO date string YYYY-MM-DD
  uploadTime: string; // HH:mm
  driveUrl: string;
  fileUrl?: string;
  metadata: {
    description?: string;
    period?: string;
    year?: number;
    tags?: string[];
  };
  syncedToCloud: boolean;
  approvalStatus?: 'PENDING' | 'APPROVED' | 'REJECTED';
  rejectionReason?: string;
  reviewedBy?: string;
  reviewedAt?: string;
}

export interface ComplianceRecord {
  employeeNip: string;
  employeeName: string;
  date: string; // YYYY-MM-DD
  lkhStatus: 'SUDAH' | 'BELUM';
  lkbStatus: 'SUDAH' | 'BELUM';
  sptStatus: 'SUDAH' | 'BELUM';
  lkhDocId?: string;
  lkbDocId?: string;
  sptDocId?: string;
  lastUpdated: string;
}

export interface PushNotification {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  type: 'INFO' | 'REMINDER' | 'SUCCESS' | 'WARNING';
  read: boolean;
  targetNip?: string;
}

export interface SyncQueueItem {
  id: string;
  action: 'UPLOAD_ARCHIVE' | 'UPDATE_COMPLIANCE';
  payload: any;
  createdAt: string;
}
