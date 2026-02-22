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

import React, { useState, Fragment } from "react";
import { Dialog, Transition, Tab } from "@headlessui/react";
import { useSettings } from "../../core/useSettings";
import { ThemeMode, ThemeAccent } from "../../core/types";
import { AVAILABLE_MODELS } from "../../core/constants";
import { clearAllData } from "../services/storageService";
import {
  XIcon,
  GithubIcon,
  AlertIcon,
  RefreshIcon,
  UploadIcon,
  ExportIcon,
  LogoutIcon,
} from "./Icons";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportData: () => void;
  onExportData: () => void;
  onDisconnect: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  onImportData,
  onExportData,
  onDisconnect,
}) => {
  const { settings, updateSettings } = useSettings();

  // Local state for complex interactions within the modal
  const [tempGithubToken, setTempGithubToken] = useState(
    settings.githubToken || ""
  );
  const [isResetConfirming, setIsResetConfirming] = useState(false);
  const [isDisconnectConfirming, setIsDisconnectConfirming] = useState(false);

  const handleFactoryReset = async () => {
    if (isResetConfirming) {
      await clearAllData();
      window.location.reload();
    } else {
      setIsResetConfirming(true);
      setTimeout(() => setIsResetConfirming(false), 3000);
    }
  };

  const handleDisconnect = () => {
    if (isDisconnectConfirming) {
      onDisconnect();
      onClose();
    } else {
      setIsDisconnectConfirming(true);
      setTimeout(() => setIsDisconnectConfirming(false), 3000);
    }
  };

  const modes: { id: ThemeMode; label: string }[] = [
    { id: "standard", label: "Standard" },
    { id: "carbon", label: "Carbon" },
    { id: "oled", label: "OLED Black" },
    { id: "paper", label: "Paper" },
    { id: "green-camo", label: "Green Camo" },
    { id: "desert-camo", label: "Desert Camo" },
    { id: "supercarrier", label: "Supercarrier" },
  ];

  const accents: { id: ThemeAccent; color: string }[] = [
    { id: "emerald", color: "#10b981" },
    { id: "cyan", color: "#06b6d4" },
    { id: "amber", color: "#f59e0b" },
    { id: "rose", color: "#f43f5e" },
    { id: "violet", color: "#8b5cf6" },
  ];

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-app-overlay border border-app-border text-left align-middle shadow-xl transition-all flex flex-col max-h-[90vh]">
                <div className="flex justify-between items-center p-6 border-b border-app-border shrink-0">
                  <Dialog.Title
                    as="h3"
                    className="text-lg font-bold leading-6 text-app-primary"
                  >
                    System Configuration
                  </Dialog.Title>
                  <button
                    onClick={onClose}
                    className="text-app-tertiary hover:text-app-primary transition-colors focus:outline-none focus:ring-2 focus:ring-app-brand rounded-full p-1"
                  >
                    <XIcon className="h-6 w-6" />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 scroll-smooth custom-scrollbar">
                  <Tab.Group>
                    <Tab.List className="flex space-x-1 rounded-xl bg-app-canvas p-1 border border-app-border mb-6 shrink-0">
                      {["Engine", "Interface", "Data & Identity"].map(
                        (category) => (
                          <Tab
                            key={category}
                            className={({ selected }) =>
                              `w-full rounded-lg py-2.5 text-sm font-bold leading-5 ring-white/60 ring-offset-2 ring-offset-app-brand focus:outline-none focus:ring-2
                              ${
                                selected
                                  ? "bg-app-surface text-app-brand shadow"
                                  : "text-app-tertiary hover:bg-white/[0.05] hover:text-app-secondary"
                              }`
                            }
                          >
                            {category}
                          </Tab>
                        )
                      )}
                    </Tab.List>
                    <Tab.Panels className="mt-2 flex-1 focus:outline-none">
                      {/* ENGINE SETTINGS */}
                      <Tab.Panel className="focus:outline-none space-y-8 animate-fadeIn">
                        {/* Model Selection */}
                        <div className="space-y-4">
                          <h4 className="text-sm font-bold text-app-secondary uppercase tracking-wider">
                            Language Model
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {AVAILABLE_MODELS.map((model) => (
                              <button
                                key={model.id}
                                onClick={() =>
                                  updateSettings({ model: model.id })
                                }
                                className={`text-left p-4 rounded-xl border transition-all ${
                                  settings.model === model.id
                                    ? "bg-app-brand/10 border-app-brand text-app-brand"
                                    : "bg-app-surface border-app-border hover:border-app-highlight text-app-primary"
                                }`}
                              >
                                <div className="font-bold flex items-center justify-between">
                                  {model.label}
                                  {model.isExperimental && (
                                    <span className="text-[10px] bg-app-brand/20 text-app-brand px-2 py-0.5 rounded">
                                      BETA
                                    </span>
                                  )}
                                </div>
                                <div className="text-xs mt-1 text-app-tertiary">
                                  {model.description}
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Safety Toggle */}
                        <div className="space-y-4">
                          <h4 className="text-sm font-bold text-app-secondary uppercase tracking-wider">
                            Safety Protocols
                          </h4>
                          <div className="p-4 rounded-xl border border-app-border bg-app-surface flex items-start sm:items-center justify-between flex-col sm:flex-row gap-4">
                            <div>
                              <div className="font-bold text-app-primary">
                                Sanitize Environment
                              </div>
                              <div className="text-xs text-app-tertiary mt-1 max-w-md">
                                When disabled, the AI will ignore system
                                instructions designed to limit output formats
                                and security. Use only for debugging complex Lua
                                problems.
                              </div>
                            </div>
                            <button
                              onClick={() =>
                                updateSettings({
                                  isDesanitized: !settings.isDesanitized,
                                })
                              }
                              className={`
                                  relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-app-brand focus:ring-offset-2
                                  ${
                                    settings.isDesanitized
                                      ? "bg-red-500"
                                      : "bg-app-canvas border border-app-border"
                                  }
                                `}
                            >
                              <span
                                aria-hidden="true"
                                className={`
                                    pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out
                                    ${
                                      settings.isDesanitized
                                        ? "translate-x-5"
                                        : "translate-x-0"
                                    }
                                  `}
                              />
                            </button>
                          </div>
                          {settings.isDesanitized && (
                            <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-500 rounded-lg text-xs flex gap-2 items-start">
                              <AlertIcon className="h-4 w-4 shrink-0 mt-0.5" />
                              <span>
                                <strong>Warning:</strong> Desanitized mode is
                                active. The AI may generate unconstrained
                                responses and ignore standard protocols.
                              </span>
                            </div>
                          )}
                        </div>
                      </Tab.Panel>

                      {/* INTERFACE SETTINGS */}
                      <Tab.Panel className="focus:outline-none space-y-8 animate-fadeIn">
                        {/* Theme Mode */}
                        <div className="space-y-4">
                          <h4 className="text-sm font-bold text-app-secondary uppercase tracking-wider">
                            Color Theme
                          </h4>
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                            {modes.map((mode) => (
                              <button
                                key={mode.id}
                                onClick={() =>
                                  updateSettings({ themeMode: mode.id })
                                }
                                className={`p-4 rounded-xl border text-xs font-bold uppercase transition-all flex items-center justify-center text-center ${
                                  settings.themeMode === mode.id
                                    ? "bg-app-brand/10 border-app-brand text-app-brand"
                                    : "bg-app-surface border-app-border text-app-tertiary hover:text-app-primary hover:border-app-highlight"
                                }`}
                              >
                                {mode.label}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Theme Accent */}
                        <div className="space-y-4">
                          <h4 className="text-sm font-bold text-app-secondary uppercase tracking-wider">
                            Command Accent
                          </h4>
                          <div className="flex gap-4 p-4 bg-app-surface rounded-xl border border-app-border">
                            {accents.map((accent) => (
                              <button
                                key={accent.id}
                                onClick={() =>
                                  updateSettings({ themeAccent: accent.id })
                                }
                                className={`w-10 h-10 rounded-full transition-transform border-4 border-app-canvas ${
                                  settings.themeAccent === accent.id
                                    ? "scale-110 shadow-lg"
                                    : "hover:scale-105 opacity-80"
                                }`}
                                style={{ backgroundColor: accent.color }}
                                aria-label={`Set Accent ${accent.id}`}
                              />
                            ))}
                          </div>
                        </div>
                      </Tab.Panel>

                      {/* DATA & IDENTITY SETTINGS */}
                      <Tab.Panel className="focus:outline-none space-y-8 animate-fadeIn">
                        {/* GitHub Integration */}
                        <div className="space-y-4">
                          <h4 className="text-sm font-bold text-app-secondary uppercase tracking-wider flex items-center gap-2">
                            <GithubIcon className="h-4 w-4" />
                            GitHub Integration
                          </h4>
                          <div className="p-4 rounded-xl border border-app-border bg-app-surface space-y-3">
                            <p className="text-xs text-app-tertiary">
                              Provide a Personal Access Token (PAT) to enable the
                              Librarian to read raw files directly from GitHub
                              repositories without hitting unauthenticated rate
                              limits.
                            </p>
                            <div className="flex gap-2">
                              <input
                                type="password"
                                value={tempGithubToken}
                                onChange={(e) =>
                                  setTempGithubToken(e.target.value)
                                }
                                placeholder="ghp_..."
                                className="flex-1 bg-app-canvas border border-app-border rounded p-2 text-sm font-mono focus:outline-none focus:border-app-brand"
                              />
                              <button
                                onClick={() =>
                                  updateSettings({
                                    githubToken: tempGithubToken,
                                  })
                                }
                                className="px-4 py-2 bg-app-brand text-white rounded font-bold text-sm hover:bg-app-brand/90 transition-colors"
                              >
                                Save
                              </button>
                            </div>
                            {settings.githubToken && (
                              <p className="text-emerald-500 text-xs font-bold flex items-center gap-1">
                                ✓ Token Active
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Data Management */}
                        <div className="space-y-4">
                          <h4 className="text-sm font-bold text-app-secondary uppercase tracking-wider">
                            Database Management
                          </h4>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <button
                              onClick={() => {
                                onImportData();
                                onClose();
                              }}
                              className="p-4 bg-app-surface border border-app-border rounded-xl text-app-secondary hover:text-purple-400 hover:border-purple-500/50 transition-colors flex flex-col items-center justify-center gap-2 group"
                            >
                              <UploadIcon className="h-6 w-6 group-hover:scale-110 transition-transform" />
                              <span className="font-bold text-sm">
                                Import Backup
                              </span>
                            </button>
                            <button
                              onClick={() => {
                                onExportData();
                                onClose();
                              }}
                              className="p-4 bg-app-surface border border-app-border rounded-xl text-app-secondary hover:text-app-brand hover:border-app-brand/50 transition-colors flex flex-col items-center justify-center gap-2 group"
                            >
                              <ExportIcon className="h-6 w-6 group-hover:scale-110 transition-transform" />
                              <span className="font-bold text-sm">
                                Export Database
                              </span>
                            </button>
                          </div>
                        </div>

                        {/* Danger Zone */}
                        <div className="space-y-4 pt-4 border-t border-red-500/20">
                          <h4 className="text-sm font-bold text-red-500 uppercase tracking-wider">
                            Danger Zone
                          </h4>
                          <div className="space-y-3">
                            <button
                              onClick={handleDisconnect}
                              className={`
                                  w-full p-3 border rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2
                                  ${
                                    isDisconnectConfirming
                                      ? "bg-orange-600 text-white border-orange-500 animate-pulse"
                                      : "bg-app-surface border-app-border hover:border-orange-500/50 text-app-secondary hover:text-orange-500"
                                  }
                              `}
                            >
                              {isDisconnectConfirming ? (
                                <>
                                  <AlertIcon className="h-4 w-4" />
                                  Confirm Exit?
                                </>
                              ) : (
                                <>
                                  <LogoutIcon className="h-4 w-4" />
                                  Disconnect API Key
                                </>
                              )}
                            </button>

                            <button
                              onClick={handleFactoryReset}
                              className={`
                                  w-full p-3 border rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2
                                  ${
                                    isResetConfirming
                                      ? "bg-red-600 text-white border-red-500 animate-pulse shadow-red-900/50 shadow-lg"
                                      : "bg-app-surface border-app-border hover:border-red-500/50 text-app-secondary hover:text-red-500"
                                  }
                              `}
                            >
                              {isResetConfirming ? (
                                <>
                                  <AlertIcon className="h-4 w-4" />
                                  Confirm Wipe?
                                </>
                              ) : (
                                <>
                                  <RefreshIcon className="h-4 w-4" />
                                  Factory Reset
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      </Tab.Panel>
                    </Tab.Panels>
                  </Tab.Group>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

export default SettingsModal;
