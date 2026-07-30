import { initializeApp, getApps } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, onAuthStateChanged, User } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc, onSnapshot } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

// Reuse existing Firebase app or initialize
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
export const auth = getAuth(app);
export const db = getFirestore(app);

const provider = new GoogleAuthProvider();
provider.addScope('https://www.googleapis.com/auth/drive.file');
// Force Google to show account selection prompt so user can pick arsipdigitalmempawah@gmail.com
provider.setCustomParameters({ prompt: 'select_account' });

// Retrieve cached token from localStorage if available
let cachedAccessToken: string | null = localStorage.getItem('ardika_gdrive_token') || localStorage.getItem('ardika_shared_gdrive_token');
let isSigningIn = false;

// Realtime listener for shared Google Drive credentials across all users/browsers
try {
  onSnapshot(
    doc(db, 'settings', 'gdrive'),
    (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        if (data?.accessToken && !data?.expired) {
          cachedAccessToken = data.accessToken;
          localStorage.setItem('ardika_shared_gdrive_token', data.accessToken);
          if (data.driveEmail) {
            localStorage.setItem('ardika_shared_gdrive_email', data.driveEmail);
          }
        } else {
          cachedAccessToken = null;
          localStorage.removeItem('ardika_gdrive_token');
          localStorage.removeItem('ardika_shared_gdrive_token');
        }
      }
    },
    (err) => {
      console.warn('Firestore GDrive listener notice:', err);
    }
  );
} catch (err) {
  console.warn('Firestore GDrive listener notice:', err);
}

export const disconnectGoogleDrive = async (): Promise<void> => {
  folderCacheMap.clear();
  cachedAccessToken = null;
  localStorage.removeItem('ardika_gdrive_token');
  localStorage.removeItem('ardika_shared_gdrive_token');
  try {
    await auth.signOut();
  } catch (e) {
    console.warn('Signout Google Drive notice:', e);
  }
};

// Initialize Google Auth state listener
export const initGoogleDriveAuth = (
  onSuccess?: (user: User, token: string) => void,
  onFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user) => {
    if (user && cachedAccessToken) {
      if (onSuccess) onSuccess(user, cachedAccessToken);
    } else {
      if (onFailure) onFailure();
    }
  });
};

export const connectGoogleDrive = async (): Promise<{ user: User; accessToken: string }> => {
  try {
    isSigningIn = true;
    folderCacheMap.clear();
    cachedAccessToken = null;
    localStorage.removeItem('ardika_gdrive_token');
    
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Gagal memperoleh Token Akses dari Google Auth.');
    }
    
    cachedAccessToken = credential.accessToken;
    const driveEmail = result.user?.email || 'arsipdigitalmempawah@gmail.com';
    localStorage.setItem('ardika_gdrive_token', cachedAccessToken);
    localStorage.setItem('ardika_shared_gdrive_token', cachedAccessToken);
    localStorage.setItem('ardika_shared_gdrive_email', driveEmail);

    // Broadcast active Google Drive Token to Firestore so ALL standard employees share Admin's Drive target!
    try {
      await setDoc(doc(db, 'settings', 'gdrive'), {
        accessToken: cachedAccessToken,
        driveEmail: driveEmail,
        updatedAt: new Date().toISOString()
      });
    } catch (fsErr) {
      console.warn('Could not persist GDrive token to Firestore:', fsErr);
    }

    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    const rawError = typeof error === 'string' ? error : (error?.message || error?.code || 'Login Google Drive dibatalkan.');
    console.warn('Google Drive sign-in notice:', rawError);

    const currentHost = typeof window !== 'undefined' ? window.location.hostname : 'domain aplikasi';

    if (rawError.includes('unauthorized-domain') || rawError.includes('auth/unauthorized-domain')) {
      throw new Error(
        `DOMAIN FIREBASE BELUM DIIZINKAN (auth/unauthorized-domain):\n` +
        `Domain "${currentHost}" belum didaftarkan di Authorized Domains Firebase Console.\n\n` +
        `Langkah Penanganan:\n` +
        `1. Buka https://console.firebase.google.com -> Proyek "arsip-kemenag-web".\n` +
        `2. Pilih Authentication -> Settings -> Authorized domains.\n` +
        `3. Klik "Add domain" dan tambahkan: ${currentHost}\n\n` +
        `Catatan: Pengunggahan berkas tetap berjalan normal via Server Cloud ARDIKAMA Kemenag.`
      );
    }

    if (rawError.includes('access_denied') || rawError.includes('403') || rawError.includes('auth/access-denied')) {
      throw new Error(
        `AKSES DIBLOKIR GOOGLE (Error 403: Access Denied):\n` +
        `Aplikasi Google Cloud ini belum dipublikasikan atau email belum terdaftar sebagai Penguji (Test User).\n\n` +
        `Langkah Penanganan:\n` +
        `1. Buka Google Cloud Console -> OAuth consent screen.\n` +
        `2. Tambahkan email (arsipdigitalmempawah@gmail.com / siradjuddin92@gmail.com) ke daftar Test Users.\n` +
        `3. Atau klik "Publish App" agar aplikasi dapat diakses publik tanpa hambatan.`
      );
    }

    if (rawError.includes('popup-closed')) {
      throw new Error(
        `Jendela Otentikasi Ditutup Otomatis (popup-closed):\n` +
        `Hal ini biasanya terjadi karena domain "${currentHost}" belum didaftarkan pada Authorized Domains di Firebase Console (arsip-kemenag-web).\n\n` +
        `Silakan daftarkan domain "${currentHost}" di Firebase Console -> Authentication -> Settings -> Authorized domains.`
      );
    }

    if (rawError.includes('operation-not-allowed')) {
      throw new Error(
        `GOOGLE SIGN-IN BELUM DIAKTIFKAN:\n` +
        `Buka Firebase Console -> Authentication -> Sign-in method, aktifkan penyedia Google (Google Provider).`
      );
    }

    throw new Error(rawError);
  } finally {
    isSigningIn = false;
  }
};

export const getSharedDriveEmail = (): string => {
  return localStorage.getItem('ardika_shared_gdrive_email') || 'arsipdigitalmempawah@gmail.com';
};

export const getCachedAccessToken = (): string | null => {
  if (!cachedAccessToken) {
    cachedAccessToken = localStorage.getItem('ardika_gdrive_token') || localStorage.getItem('ardika_shared_gdrive_token');
  }
  return cachedAccessToken;
};

export const getCachedAccessTokenAsync = async (): Promise<string | null> => {
  try {
    const snap = await getDoc(doc(db, 'settings', 'gdrive'));
    if (snap.exists()) {
      const data = snap.data();
      if (data?.accessToken && !data?.expired) {
        cachedAccessToken = data.accessToken;
        localStorage.setItem('ardika_shared_gdrive_token', data.accessToken);
        if (data.driveEmail) {
          localStorage.setItem('ardika_shared_gdrive_email', data.driveEmail);
        }
        return cachedAccessToken;
      } else {
        cachedAccessToken = null;
        localStorage.removeItem('ardika_gdrive_token');
        localStorage.removeItem('ardika_shared_gdrive_token');
        return null;
      }
    }
  } catch (e) {
    console.warn('Firestore token check notice:', e);
  }

  let token = getCachedAccessToken();
  if (token) return token;

  return null;
};

export const isDriveConnected = (): boolean => {
  return !!getCachedAccessToken();
};

export interface DriveUploadResult {
  fileId: string;
  driveUrl: string;
  fileName: string;
  folderName?: string;
}

// In-memory folder ID cache
const folderCacheMap = new Map<string, string>();

/**
 * Get or create a folder in Google Drive.
 */
export const getOrCreateDriveFolder = async (
  folderName: string,
  parentId: string | null,
  accessToken: string
): Promise<string> => {
  const cacheKey = `${parentId || 'root'}::${folderName}`;
  if (folderCacheMap.has(cacheKey)) {
    return folderCacheMap.get(cacheKey)!;
  }

  // Search existing non-trashed folder
  const safeName = folderName.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
  let query = `name = '${safeName}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`;
  if (parentId) {
    query += ` and '${parentId}' in parents`;
  } else {
    query += ` and 'root' in parents`;
  }

  try {
    const searchUrl = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&fields=files(id,name)`;
    const searchRes = await fetch(searchUrl, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (searchRes.status === 401) {
      throw { status: 401, message: 'UNAUTHENTICATED' };
    }

    if (searchRes.ok) {
      const searchData = await searchRes.json();
      if (searchData.files && searchData.files.length > 0) {
        const existingId = searchData.files[0].id;
        folderCacheMap.set(cacheKey, existingId);
        return existingId;
      }
    }
  } catch (err: any) {
    if (err?.status === 401) throw err;
    console.warn(`Pencarian folder Google Drive notice ("${folderName}"):`, err);
  }

  // Folder doesn't exist yet, create it
  const createBody: { name: string; mimeType: string; parents?: string[] } = {
    name: folderName,
    mimeType: 'application/vnd.google-apps.folder',
  };
  if (parentId) {
    createBody.parents = [parentId];
  }

  const createRes = await fetch('https://www.googleapis.com/drive/v3/files?fields=id', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(createBody),
  });

  if (!createRes.ok) {
    const errText = await createRes.text().catch(() => '');
    console.warn(`Gagal membuat folder Google Drive "${folderName}":`, errText);
    throw {
      status: createRes.status,
      message: `Gagal membuat folder "${folderName}" di Google Drive: ${errText || createRes.statusText}`
    };
  }

  const createData = await createRes.json();
  const newFolderId = createData.id;
  folderCacheMap.set(cacheKey, newFolderId);
  return newFolderId;
};

/**
 * Determine subfolder name based on document type or category.
 * 1. LKH/LKB -> "1. LKH/LKB"
 * 2. SPT Pajak -> "2. SPT Pajak"
 * 3. Arsip Kantor (Keuangan, Pendidikan, Keagamaan, Dll) -> "3. Arsip Kantor"
 */
export const getSubfolderNameForCategory = (docTypeOrCategory?: string): string => {
  if (!docTypeOrCategory) return '3. Arsip Kantor';
  const val = docTypeOrCategory.toUpperCase();
  if (val.includes('LKH') || val.includes('LKB')) {
    return '1. LKH/LKB';
  }
  if (val.includes('SPT')) {
    return '2. SPT Pajak';
  }
  return '3. Arsip Kantor';
};

/**
 * Resolve target subfolder ID under parent "Arsip Website ARDIKAMA".
 */
export const getTargetDriveFolderId = async (
  docTypeOrCategory: string | undefined,
  accessToken: string
): Promise<{ targetFolderId: string; subfolderName: string }> => {
  const PARENT_FOLDER_NAME = 'Arsip Website ARDIKAMA';
  const subfolderName = getSubfolderNameForCategory(docTypeOrCategory);

  // 1. Parent folder: "Arsip Website ARDIKAMA" in root
  const parentFolderId = await getOrCreateDriveFolder(PARENT_FOLDER_NAME, null, accessToken);

  // 2. Subfolder inside "Arsip Website ARDIKAMA"
  const subfolderId = await getOrCreateDriveFolder(subfolderName, parentFolderId, accessToken);

  return { targetFolderId: subfolderId, subfolderName };
};

export const uploadFileToDrive = async (
  file: File,
  customFileName?: string,
  docTypeOrCategory?: string
): Promise<DriveUploadResult> => {
  let token = await getCachedAccessTokenAsync();

  if (!token) {
    throw new Error('TOKEN_EMPTY: Sesi Google Drive Kemenag belum dihubungkan oleh Admin.');
  }

  const targetName = customFileName || file.name;

  const performUpload = async (accessToken: string) => {
    // Resolve "Arsip Website ARDIKAMA" parent & appropriate subfolder
    const { targetFolderId, subfolderName } = await getTargetDriveFolderId(docTypeOrCategory, accessToken);

    const metadata = {
      name: targetName,
      mimeType: file.type || 'application/pdf',
      parents: [targetFolderId],
    };

    const form = new FormData();
    form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
    form.append('file', file);

    const response = await fetch(
      'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink,webContentLink,parents',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        body: form,
      }
    );

    if (!response.ok) {
      const errBody = await response.text().catch(() => '');
      let parsedErr = '';
      try {
        const jsonErr = JSON.parse(errBody);
        parsedErr = jsonErr?.error?.message || response.statusText;
      } catch {
        parsedErr = errBody || response.statusText;
      }
      throw { status: response.status, message: parsedErr };
    }

    const data = await response.json();
    return { ...data, subfolderName };
  };

  try {
    const data = await performUpload(token);
    const driveUrl = data.webViewLink || `https://drive.google.com/file/d/${data.id}/view`;
    return {
      fileId: data.id,
      driveUrl,
      fileName: data.name,
      folderName: `Arsip Website ARDIKAMA / ${data.subfolderName}`,
    };
  } catch (err: any) {
    const is401 =
      err?.status === 401 ||
      (typeof err?.message === 'string' &&
        (err.message.includes('401') || err.message.includes('UNAUTHENTICATED') || err.message.includes('Invalid Credentials')));

    if (is401) {
      // Access token expired - clear stale token without showing popup to standard employees
      folderCacheMap.clear();
      cachedAccessToken = null;
      localStorage.removeItem('ardika_gdrive_token');
      localStorage.removeItem('ardika_shared_gdrive_token');

      try {
        await setDoc(doc(db, 'settings', 'gdrive'), {
          accessToken: '',
          driveEmail: getSharedDriveEmail(),
          updatedAt: new Date().toISOString(),
          expired: true
        });
      } catch (e) {
        console.warn('Firestore token clear notice:', e);
      }

      throw new Error('TOKEN_EXPIRED: Token Google Drive Kemenag sudah kedaluwarsa. Berkas disimpan di Server ARDIKAMA Kemenag.');
    }
    if (typeof err?.message === 'string') {
      const msg = err.message;
      if (msg.includes('SERVICE_DISABLED') || msg.includes('Google Drive API has not been used') || msg.includes('accessNotConfigured')) {
        throw new Error(
          `GOOGLE DRIVE API BELUM DIAKTIFKAN DI GOOGLE CLOUD CONSOLE:\n\n` +
          `Layanan "Google Drive API" belum diaktifkan untuk Proyek Google Cloud (Project ID: 324640277882).\n\n` +
          `Langkah Penyelesaian (Hanya 1-Klik):\n` +
          `1. Buka link Google Cloud Console berikut:\n` +
          `   https://console.developers.google.com/apis/api/drive.googleapis.com/overview?project=324640277882\n` +
          `2. Klik tombol "ENABLE" (Aktifkan).\n` +
          `3. Tunggu 1-2 menit, lalu coba unggah kembali berkas Anda.`
        );
      }
    }
    throw new Error(`Gagal menyimpan file ke Google Drive: ${err?.message || 'Akses ditolak atau koneksi terputus.'}`);
  }
};

/**
 * Fetch total real-time count of files inside Google Drive parent folder "Arsip Website ARDIKAMA"
 */
export const fetchArdikamaDriveCount = async (): Promise<number | null> => {
  const token = getCachedAccessToken();
  if (!token) return null;

  try {
    const parentName = 'Arsip Website ARDIKAMA';
    const safeParentName = parentName.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
    const parentQuery = `name = '${safeParentName}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`;
    const parentRes = await fetch(
      `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(parentQuery)}&fields=files(id)`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    if (!parentRes.ok) return null;
    const parentData = await parentRes.json();
    if (!parentData.files || parentData.files.length === 0) {
      return 0;
    }

    const parentFolderId = parentData.files[0].id;

    // Fetch subfolder IDs inside parent folder
    const subfolderQuery = `'${parentFolderId}' in parents and mimeType = 'application/vnd.google-apps.folder' and trashed = false`;
    const subfolderRes = await fetch(
      `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(subfolderQuery)}&fields=files(id)`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    const folderIds = [parentFolderId];
    if (subfolderRes.ok) {
      const subData = await subfolderRes.json();
      if (subData.files) {
        folderIds.push(...subData.files.map((f: any) => f.id));
      }
    }

    // Query non-folder files whose parent is any of folderIds
    const parentsClause = folderIds.map((id) => `'${id}' in parents`).join(' or ');
    const fileQuery = `mimeType != 'application/vnd.google-apps.folder' and trashed = false and (${parentsClause})`;

    const filesRes = await fetch(
      `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(fileQuery)}&fields=files(id)`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    if (!filesRes.ok) return null;
    const filesData = await filesRes.json();
    return filesData.files ? filesData.files.length : 0;
  } catch (err) {
    console.warn('Gagal membaca jumlah file di Google Drive:', err);
    return null;
  }
};
