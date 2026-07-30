import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSync } from '../context/SyncContext';
import {
  Bell,
  CheckCheck,
  Cloud,
  Info,
  Radio,
  Send,
  Trash2,
  Volume2,
  X
} from 'lucide-react';

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationDrawer: React.FC<NotificationDrawerProps> = ({ isOpen, onClose }) => {
  const { currentUser, isAdmin } = useAuth();
  const {
    notifications,
    markNotificationRead,
    clearNotifications,
    fcmModalOpen,
    setFcmModalOpen,
    sendPushNotification
  } = useSync();

  const [fcmTitle, setFcmTitle] = useState('');
  const [fcmMessage, setFcmMessage] = useState('');

  if (!isOpen && !fcmModalOpen) return null;

  const visibleNotifications = notifications.filter((notif) => {
    if (!notif.targetNip || notif.targetNip === 'BROADCAST' || notif.targetNip === 'ALL') {
      return true;
    }
    if (isAdmin) return true;
    return currentUser && notif.targetNip === currentUser.nip;
  });

  const handleSendFcmBroadcast = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fcmTitle || !fcmMessage) return;

    sendPushNotification(`[FCM Broadcast] ${fcmTitle}`, fcmMessage, 'REMINDER');
    setFcmTitle('');
    setFcmMessage('');
    setFcmModalOpen(false);
  };

  return (
    <>
      {/* Drawer */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/50 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 w-full max-w-sm h-full shadow-2xl flex flex-col p-5 border-l border-slate-200 dark:border-slate-800 space-y-4">
            {/* Drawer Header */}
            <div className="flex items-center justify-between border-b pb-3 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Bell className="w-5 h-5 text-emerald-600" />
                <h3 className="font-extrabold text-slate-900 dark:text-white text-base">
                  Pusat Notifikasi ARDIKA
                </h3>
              </div>

              <button
                onClick={onClose}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Clear All Actions */}
            <div className="flex items-center justify-between text-xs font-bold text-slate-500">
              <span>{visibleNotifications.length} Pesan Masuk</span>
              <button
                onClick={clearNotifications}
                className="text-rose-600 hover:underline flex items-center gap-1"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Hapus Semua</span>
              </button>
            </div>

            {/* Notification List */}
            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
              {visibleNotifications.length === 0 ? (
                <div className="py-12 text-center text-xs text-slate-400">
                  Belum ada notifikasi baru.
                </div>
              ) : (
                visibleNotifications.map((notif) => (
                  <div
                    key={notif.id}
                    onClick={() => markNotificationRead(notif.id)}
                    className={`p-3.5 rounded-2xl border text-xs cursor-pointer transition-all ${
                      notif.read
                        ? 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                        : 'bg-emerald-50/80 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-800 text-slate-900 dark:text-white ring-1 ring-emerald-500/20'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-extrabold text-slate-900 dark:text-white">
                        {notif.title}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">{notif.timestamp}</span>
                    </div>
                    <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                      {notif.message}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Firebase Cloud Messaging (FCM) Broadcast Simulator Dialog */}
      {fcmModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Cloud className="w-5 h-5 text-emerald-600" />
                <h3 className="font-extrabold text-slate-900 dark:text-white text-base">
                  Kirim Firebase Push Notification (FCM)
                </h3>
              </div>
              <button
                onClick={() => setFcmModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Simulasi pengiriman push notification instan melalui Firebase Cloud Messaging ke seluruh perangkat pegawai (Android & Web).
            </p>

            <form onSubmit={handleSendFcmBroadcast} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Judul Push Notification *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Pengingat Batas Akhir Upload LKH"
                  value={fcmTitle}
                  onChange={(e) => setFcmTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Isi Pesan Broadcast *
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="Tuliskan pesan lengkap yang akan tampil di status bar HP pegawai..."
                  value={fcmMessage}
                  onChange={(e) => setFcmMessage(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold shadow-md flex items-center justify-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  <span>Siarkan Push Notification FCM</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
