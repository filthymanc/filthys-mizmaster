/*
 * filthy's MizMaster
 * Copyright (C) 2026 the filthymanc
 *
 * This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

import React, { useEffect, useState, useCallback } from "react";
import Sidebar from "../features/mission/ui/Sidebar";
import MissionWorkspace from "../features/mission/ui/MissionWorkspace";
import { useSessionManager } from "../features/mission/useSessionManager";
import LoginScreen from "../features/auth/ui/LoginScreen";
import { useAuth } from "../features/auth/useAuth";
import { useSettings } from "./useSettings";
import { ToastContainer } from "../shared/ui/Toast";
import OnboardingModal from "../shared/ui/OnboardingModal";
import FieldManual from "../shared/ui/FieldManual";
import ErrorBoundary from "../shared/ui/ErrorBoundary";
import SettingsModal from "../shared/ui/SettingsModal";
import ArmoryModal from "../features/armory/ui/ArmoryModal";
import ReloadPrompt from "../shared/ui/ReloadPrompt";
import { useSwipeGesture } from "../shared/hooks/useSwipeGesture";
import * as storage from "../shared/services/storageService";
import { validateImportData } from "../shared/services/migrationService";

const App: React.FC = () => {
  const { settings, apiStatus, updateSettings } = useSettings();
  const {
    apiKey,
    isAuthenticated,
    isVerifying,
    isLocked,
    authError,
    login,
    unlock,
    logout,
    checkAuth,
  } = useAuth();
  const sessionManager = useSessionManager();

  // Modal States
  const [isManualOpen, setIsManualOpen] = useState(false);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [settingsTab, setSettingsTab] = useState(0);
  const [isArmoryOpen, setIsArmoryOpen] = useState(false);

  // Viewport Height Fix for Mobile Browsers
  const [appHeight, setAppHeight] = useState("100dvh");

  const handleOpenSettings = useCallback((tab: number = 0) => {
    setSettingsTab(tab);
    setIsSettingsOpen(true);
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    const updateHeight = () => {
      if (window.visualViewport) {
        setAppHeight(`${window.visualViewport.height}px`);
      } else {
        setAppHeight(`${window.innerHeight}px`);
      }
    };

    if ("ontouchstart" in window || navigator.maxTouchPoints > 0) {
      window.visualViewport?.addEventListener("resize", updateHeight);
      window.addEventListener("resize", updateHeight);
      updateHeight();
    }

    return () => {
      window.visualViewport?.removeEventListener("resize", updateHeight);
      window.removeEventListener("resize", updateHeight);
    };
  }, []);

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === ",") {
        e.preventDefault();
        if (isAuthenticated) {
          handleOpenSettings(0);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isAuthenticated, handleOpenSettings]);

  useSwipeGesture({
    onSwipeRight: () => {
      if (!isSidebarOpen && isAuthenticated) setIsSidebarOpen(true);
    },
    onSwipeLeft: () => {
      if (isSidebarOpen) setIsSidebarOpen(false);
    },
    edgeThreshold: 50,
    swipeThreshold: 80,
  });

  useEffect(() => {
    if (isAuthenticated) {
      const seen = localStorage.getItem("filthys-mizmaster-onboarding-seen");
      if (!seen) {
        setIsOnboardingOpen(true);
      }
    }
  }, [isAuthenticated]);

  const handleCloseOnboarding = () => {
    localStorage.setItem("filthys-mizmaster-onboarding-seen", "true");
    setIsOnboardingOpen(false);
  };

  const handleExportData = useCallback(async () => {
    const data = await sessionManager.exportData();
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `filthys-mizmaster-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [sessionManager]);

  const handleImportDataTrigger = useCallback(() => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      try {
        const text = await file.text();
        const rawData = JSON.parse(text);

        // 1. Validate the structure (Sessions + Messages)
        const { validSessions, validMessages } = validateImportData(rawData);

        if (validSessions.length === 0) {
          throw new Error("No valid sessions found in import file.");
        }

        // 2. Restore Messages to IndexedDB
        await storage.importAllData({
          sessions: validSessions,
          messages: validMessages,
        });

        // 3. Update Session Index in State (which triggers sync to IDB)
        sessionManager.importData(validSessions);
      } catch (err) {
        console.error("Import failed", err);
      }
    };
    input.click();
  }, [sessionManager]);

  if (!isAuthenticated || isLocked) {
    return (
      <>
        <LoginScreen
          onLogin={login}
          onUnlock={unlock}
          isVerifying={isVerifying}
          isLocked={isLocked}
          authError={authError}
          onOpenFieldManual={() => setIsManualOpen(true)}
        />
        {isManualOpen && (
          <FieldManual
            isOpen={isManualOpen}
            onClose={() => setIsManualOpen(false)}
          />
        )}
      </>
    );
  }

  return (
    <ErrorBoundary scope="app">
      <div
        className="flex bg-app-canvas text-app-primary overflow-hidden font-sans selection:bg-app-brand selection:text-white"
        style={{ height: appHeight }}
      >
        <ToastContainer />
        <ReloadPrompt />

        {isManualOpen && (
          <FieldManual
            isOpen={isManualOpen}
            onClose={() => setIsManualOpen(false)}
          />
        )}
        {isArmoryOpen && (
          <ArmoryModal
            isOpen={isArmoryOpen}
            onClose={() => setIsArmoryOpen(false)}
          />
        )}

        {isOnboardingOpen && (
          <OnboardingModal
            isOpen={isOnboardingOpen}
            onComplete={handleCloseOnboarding}
          />
        )}

        <SettingsModal
          isOpen={isSettingsOpen}
          initialTab={settingsTab}
          onClose={() => setIsSettingsOpen(false)}
          onImportData={handleImportDataTrigger}
          onExportData={handleExportData}
          onDisconnect={logout}
        />

        <Sidebar
          sessions={sessionManager.sessions}
          activeSessionId={sessionManager.activeSessionId}
          onSelectSession={(id) => {
            sessionManager.setActiveSessionId(id);
            setIsSidebarOpen(false);
          }}
          onCreateSession={() => {
            const id = sessionManager.createSession();
            setIsSidebarOpen(false);
            return id;
          }}
          onDeleteSession={sessionManager.deleteSession}
          onRenameSession={sessionManager.renameSession}
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          onOpenSettings={() => handleOpenSettings(0)}
          onOpenFieldManual={() => setIsManualOpen(true)}
          onOpenArmory={() => setIsArmoryOpen(true)}
          isLoading={!sessionManager.isReady}
        />

        <main className="flex-1 flex flex-col min-w-0 relative">
          <MissionWorkspace
            key={sessionManager.activeSessionId}
            settings={settings}
            apiStatus={apiStatus}
            sessions={sessionManager.sessions}
            activeSessionId={sessionManager.activeSessionId}
            onSelectSession={sessionManager.setActiveSessionId}
            onCreateSession={() => sessionManager.createSession()}
            onImportData={handleImportDataTrigger}
            onUpdateSettings={updateSettings}
            apiKey={apiKey}
            touchSession={sessionManager.touchSession}
            onOpenSidebar={() => setIsSidebarOpen(true)}
            onOpenSettings={handleOpenSettings}
            onDeleteSession={(id) => {
              sessionManager.deleteSession(id);
              // If the active session is deleted, sessionManager automatically handles setting a new active session
            }}
          />
        </main>
      </div>
    </ErrorBoundary>
  );
};

export default App;
