import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { SyncProvider } from './context/SyncContext';
import { Navbar } from './components/Navbar';
import { Sidebar, TabType } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { ComplianceMonitoring } from './components/ComplianceMonitoring';
import { ArchiveHistory } from './components/ArchiveHistory';
import { ActiveInactiveArchives } from './components/ActiveInactiveArchives';
import { CalendarView } from './components/CalendarView';
import { AnalyticsView } from './components/AnalyticsView';
import { EmployeeList } from './components/EmployeeList';
import { SettingsView } from './components/SettingsView';
import { UploadModal } from './components/UploadModal';
import { LoginModal } from './components/LoginModal';
import { ProfileModal } from './components/ProfileModal';
import { LoginPage } from './components/LoginPage';
import { NotificationDrawer } from './components/NotificationDrawer';
import { Footer } from './components/Footer';

import { ArchiveDocument } from './types';

const MainAppContent: React.FC = () => {
  const { currentUser, isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Modals
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [reuploadTargetDoc, setReuploadTargetDoc] = useState<ArchiveDocument | null>(null);
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [notifDrawerOpen, setNotifDrawerOpen] = useState(false);

  const handleOpenUploadModal = (reuploadDoc?: ArchiveDocument | null) => {
    setReuploadTargetDoc(reuploadDoc || null);
    setUploadModalOpen(true);
  };

  // Mandatory Authentication Gate: Block all internal views if user is not logged in
  if (!currentUser) {
    return <LoginPage />;
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans antialiased transition-colors duration-200 pb-12">
      {/* Header */}
      <Navbar
        onOpenNotifications={() => setNotifDrawerOpen(true)}
        onOpenLoginModal={() => setLoginModalOpen(true)}
        onOpenProfileModal={() => setProfileModalOpen(true)}
        onToggleMobileSidebar={() => setMobileSidebarOpen(!mobileSidebarOpen)}
      />

      {/* Body Layout */}
      <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 flex gap-6">
        {/* Sidebar */}
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          mobileOpen={mobileSidebarOpen}
          setMobileOpen={setMobileSidebarOpen}
          onOpenUploadModal={() => handleOpenUploadModal()}
        />

        {/* Main Content Area */}
        <main className="flex-1 min-w-0">
          {activeTab === 'dashboard' && (
            <Dashboard
              onNavigateTab={setActiveTab}
              onOpenUploadModal={handleOpenUploadModal}
            />
          )}

          {activeTab === 'monitoring' && <ComplianceMonitoring />}

          {activeTab === 'archive' && (
            <ArchiveHistory onOpenUploadModal={handleOpenUploadModal} />
          )}

          {activeTab === 'special_archives' && <ActiveInactiveArchives />}

          {activeTab === 'calendar' && <CalendarView />}

          {activeTab === 'analytics' && <AnalyticsView />}

          {activeTab === 'employees' && <EmployeeList />}

          {activeTab === 'settings' && (
            isAdmin ? <SettingsView /> : <Dashboard onNavigateTab={setActiveTab} onOpenUploadModal={handleOpenUploadModal} />
          )}
        </main>
      </div>

      {/* Global Locked Bottom Footer with Running Ticker */}
      <Footer />

      {/* Global Modals */}
      <UploadModal
        isOpen={uploadModalOpen}
        onClose={() => {
          setUploadModalOpen(false);
          setReuploadTargetDoc(null);
        }}
        reuploadDoc={reuploadTargetDoc}
      />

      <LoginModal
        isOpen={loginModalOpen}
        onClose={() => setLoginModalOpen(false)}
      />

      <ProfileModal
        isOpen={profileModalOpen}
        onClose={() => setProfileModalOpen(false)}
      />

      <NotificationDrawer
        isOpen={notifDrawerOpen}
        onClose={() => setNotifDrawerOpen(false)}
      />
    </div>
  );
};

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <SyncProvider>
          <MainAppContent />
        </SyncProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
