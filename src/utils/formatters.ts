// Helper utilities for NIP masking & Automatic File Naming according to ARDIKAMA Rules

export const INDONESIAN_MONTHS = [
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember'
];

/**
 * Mask NIP for non-admin users to protect privacy.
 * Admin sees full NIP (e.g., 198904092019031008).
 * Regular employee sees masked NIP (e.g., 1989••••••1008).
 */
export function maskNip(nip: string, isAdmin: boolean): string {
  if (isAdmin || !nip) return nip;
  if (nip.length < 10) return '••••••••••••';
  const first = nip.substring(0, 4);
  const last = nip.substring(nip.length - 4);
  return `${first}••••••••${last}`;
}

/**
 * Generate official ARDIKAMA file name based on document type and date calculations.
 * - LKH/LKB: LKH_LKB_[NIP]_[Bulan -1]_[Tahun].pdf (Report month goes back 1 month)
 *   e.g. July 2026 -> June 2026 -> LKH_LKB_198904092019031008_Juni_2026.pdf
 * - SPT: SPT_[NIP]_[Tahun -1].pdf (Report year goes back 1 year)
 *   e.g. 2026 -> 2025 -> SPT_198904092019031008_2025.pdf
 */
export function generateArdikamaFileName(
  docType: 'LKH_LKB' | 'SPT' | 'ARSIP_KANTOR' | string,
  nip: string,
  currentDate: Date = new Date()
): { fileName: string; periodLabel: string; reportYear: number } {
  const currentMonthIdx = currentDate.getMonth(); // 0-indexed (0 = Jan, 6 = Jul)
  const currentYear = currentDate.getFullYear();

  if (docType === 'SPT') {
    const reportYear = currentYear - 1;
    const fileName = `SPT_${nip}_${reportYear}.pdf`;
    return {
      fileName,
      periodLabel: `Tahun ${reportYear}`,
      reportYear
    };
  }

  if (docType === 'ARSIP_KANTOR' || docType === 'ARSIP_LAIN') {
    let reportMonthIdx = currentMonthIdx - 1;
    let reportYear = currentYear;
    if (reportMonthIdx < 0) {
      reportMonthIdx = 11;
      reportYear = currentYear - 1;
    }
    const reportMonthName = INDONESIAN_MONTHS[reportMonthIdx];
    const fileName = `ARSIP_KANTOR_${nip}_${reportMonthName}_${reportYear}.pdf`;
    return {
      fileName,
      periodLabel: `Bulan ${reportMonthName} ${reportYear}`,
      reportYear
    };
  }

  // Default to LKH_LKB
  let reportMonthIdx = currentMonthIdx - 1;
  let reportYear = currentYear;

  if (reportMonthIdx < 0) {
    reportMonthIdx = 11; // December
    reportYear = currentYear - 1;
  }

  const reportMonthName = INDONESIAN_MONTHS[reportMonthIdx];
  const fileName = `LKH_LKB_${nip}_${reportMonthName}_${reportYear}.pdf`;

  return {
    fileName,
    periodLabel: `Bulan ${reportMonthName} ${reportYear}`,
    reportYear
  };
}

/**
 * Detect ASN status (ASN or NON_ASN) based on employee record or NIP structure.
 * NIP standard 18 digits = ASN
 */
export function getASNStatus(emp: { nip?: string; statusASN?: 'ASN' | 'NON_ASN' }): 'ASN' | 'NON_ASN' {
  if (emp.statusASN) return emp.statusASN;
  if (!emp.nip || emp.nip.length < 18) return 'NON_ASN';
  return 'ASN';
}

/**
 * Safely open a document URL.
 * Handles both Google Drive URLs (https://drive.google.com/...) and Base64 data URLs (data:application/pdf;base64,...).
 * Converts Base64 data URLs into Blob URLs so modern browsers can render or view the PDF without blocking.
 */
export function openDocumentLink(url: string, fileName?: string): void {
  if (!url || url.trim() === '') {
    alert('Link dokumen tidak tersedia. Pastikan Google Drive terhubung atau unggah ulang dokumen ini.');
    return;
  }

  if (url.startsWith('data:')) {
    try {
      const parts = url.split(',');
      const mime = parts[0].match(/:(.*?);/)?.[1] || 'application/pdf';
      const bstr = atob(parts[1]);
      let n = bstr.length;
      const u8arr = new Uint8Array(n);
      while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
      }
      const blob = new Blob([u8arr], { type: mime });
      const blobUrl = URL.createObjectURL(blob);
      const newWin = window.open(blobUrl, '_blank');
      if (!newWin) {
        const a = document.createElement('a');
        a.href = blobUrl;
        a.download = fileName || 'Dokumen_ARDIKAMA.pdf';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }
    } catch (e) {
      console.error('Gagal membaca data URL berkas:', e);
      window.open(url, '_blank');
    }
  } else {
    window.open(url, '_blank', 'noopener,noreferrer');
  }
}
