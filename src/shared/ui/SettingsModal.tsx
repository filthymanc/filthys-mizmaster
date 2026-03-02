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
import { clearAllData } from "../services/storageService";
import { validateGitHubToken } from "../../features/librarian/githubService";
import {
  XIcon,
  GithubIcon,
  AlertIcon,
  RefreshIcon,
  UploadIcon,
  ExportIcon,
  LogoutIcon,
  SpinnerIcon,
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
  const { settings, updateSettings, refreshModels, isModelLoading } =
    useSettings();

  // Local state for complex interactions within the modal
  const [tempGithubToken, setTempGithubToken] = useState(
    settings.githubToken || "",
  );
  const [isValidatingToken, setIsValidatingToken] = useState(false);
  const [tokenError, setTokenError] = useState<string | null>(null);
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
                    id="shared-settings-close"
                    data-testid="shared-settings-close"
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
                            id={`shared-settings-tab-${category.toLowerCase().replace(/\s+/g, "-")}`}
                            data-testid={`shared-settings-tab-${category.toLowerCase().replace(/\s+/g, "-")}`}
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
                        ),
                      )}
                    </Tab.List>
                    <Tab.Panels className="mt-2 flex-1 focus:outline-none">
                      {/* ENGINE SETTINGS */}
                      <Tab.Panel className="focus:outline-none space-y-8 animate-fadeIn">
                        {/* Model Selection */}
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <h4 className="text-sm font-bold text-app-secondary uppercase tracking-wider">
                              Language Model
                            </h4>
                            <div className="flex items-center gap-2">
                              <button
                                id="shared-settings-refresh-models"
                                onClick={refreshModels}
                                disabled={isModelLoading}
                                className="flex items-center gap-1.5 px-2 py-1 rounded text-[10px] font-bold bg-app-surface text-app-tertiary hover:text-app-secondary transition-colors disabled:opacity-50"
                              >
                                {isModelLoading ? (
                                  <SpinnerIcon className="h-3 w-3" />
                                ) : (
                                  <RefreshIcon className="h-3 w-3" />
                                )}
                                REFRESH
                              </button>
                            </div>
                          </div>

                          <div className="flex flex-col gap-2 max-h-[400px] overflow-y-auto pr-1 custom-scrollbar">
                            {settings.availableModels.map((model) => (
                              <button
                                key={model.id}
                                id={`shared-settings-model-${model.id}`}
                                data-testid={`shared-settings-model-${model.id}`}
                                onClick={() =>
                                  updateSettings({ model: model.id })
                                }
                                className={`text-left p-2.5 rounded-lg border transition-all ${
                                  settings.model === model.id
                                    ? "bg-app-brand/10 border-app-brand"
                                    : "bg-app-surface border-app-border hover:border-app-highlight"
                                }`}
                              >
                                <div className="flex flex-col gap-1">
                                  <div
                                    className={`text-xs font-bold truncate ${
                                      settings.model === model.id
                                        ? "text-app-brand"
                                        : "text-app-primary"
                                    }`}
                                  >
                                    {model.shortLabel}
                                  </div>

                                  <div className="text-[10px] font-mono text-app-secondary truncate">
                                    {model.id}
                                  </div>

                                  {(model.inputTokenLimit ||
                                    model.outputTokenLimit) && (
                                    <div className="flex gap-2 items-center font-mono text-[8px] mt-0.5 whitespace-nowrap">
                                      <span className="text-app-tertiary uppercase tracking-tighter font-bold shrink-0">
                                        Tokens:
                                      </span>
                                      <span className="text-app-secondary font-bold">
                                        Input{" "}
                                        {model.inputTokenLimit?.toLocaleString() ||
                                          "N/A"}
                                      </span>
                                      <span className="text-app-secondary font-bold">
                                        Output{" "}
                                        {model.outputTokenLimit?.toLocaleString() ||
                                          "N/A"}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </button>
                            ))}
                          </div>
                          {settings.availableModels.length === 0 && (
                            <div className="p-8 text-center bg-app-surface rounded-xl border border-app-border border-dashed text-app-tertiary text-xs">
                              No models matching current filters.
                            </div>
                          )}
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
                              id="shared-settings-safety-toggle"
                              data-testid="shared-settings-safety-toggle"
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
                                id={`shared-settings-theme-${mode.id}`}
                                data-testid={`shared-settings-theme-${mode.id}`}
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
                                id={`shared-settings-accent-${accent.id}`}
                                data-testid={`shared-settings-accent-${accent.id}`}
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
                              Provide a Personal Access Token (PAT) to enable
                              the Librarian to read raw files directly from
                              GitHub repositories without hitting
                              unauthenticated rate limits.
                            </p>
                            <form
                              onSubmit={(e) => e.preventDefault()}
                              className="flex gap-2"
                            >
                              {/* Hidden username field for accessibility/password managers */}
                              <input
                                id="auth-settings-github-username-hidden"
                                data-testid="auth-settings-github-username-hidden"
                                type="text"
                                name="username"
                                defaultValue="GitHub PAT"
                                readOnly
                                autoComplete="username"
                                className="hidden"
                                aria-hidden="true"
                              />
                              <input
                                id="shared-settings-github-token-input"
                                data-testid="shared-settings-github-token-input"
                                name="github_token"
                                type="password"
                                autoComplete="current-password"
                                value={tempGithubToken}
                                onChange={(e) => {
                                  setTempGithubToken(e.target.value);
                                  setTokenError(null);
                                }}
                                placeholder="ghp_..."
                                className="flex-1 bg-app-canvas border border-app-border rounded p-2 text-sm font-mono focus:outline-none focus:border-app-brand"
                              />
                              <button
                                id="shared-settings-github-token-save"
                                data-testid="shared-settings-github-token-save"
                                type="button"
                                onClick={async () => {
                                  setTokenError(null);
                                  if (!tempGithubToken.trim()) {
                                    updateSettings({ githubToken: "" });
                                    return;
                                  }

                                  setIsValidatingToken(true);
                                  try {
                                    const isValid =
                                      await validateGitHubToken(
                                        tempGithubToken,
                                      );
                                    if (isValid) {
                                      updateSettings({
                                        githubToken: tempGithubToken,
                                      });
                                    } else {
                                      setTokenError(
                                        "Invalid GitHub token. Please check and try again.",
                                      );
                                    }
                                  } catch {
                                    setTokenError(
                                      "Validation failed. Check your connection.",
                                    );
                                  } finally {
                                    setIsValidatingToken(false);
                                  }
                                }}
                                disabled={isValidatingToken}
                                className="px-4 py-2 bg-app-brand text-white rounded font-bold text-sm hover:bg-app-brand/90 transition-colors disabled:opacity-50 flex items-center gap-2"
                              >
                                {isValidatingToken && (
                                  <SpinnerIcon className="h-4 w-4 animate-spin" />
                                )}
                                {isValidatingToken ? "Verifying..." : "Save"}
                              </button>
                            </form>
                            {tokenError && (
                              <p className="text-red-500 text-[10px] font-bold animate-pulse">
                                {tokenError}
                              </p>
                            )}
                            {settings.githubToken && !tokenError && (
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
                              id="shared-settings-import-trigger"
                              data-testid="shared-settings-import-trigger"
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
                              id="shared-settings-export-trigger"
                              data-testid="shared-settings-export-trigger"
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
                          <h4 className="text-sm font-bold text-red-500 uppercase tracking-wider flex justify-between items-center">
                            Danger Zone
                            <button
                              id="shared-settings-reload-trigger"
                              onClick={() => window.location.reload()}
                              className="flex items-center gap-1.5 px-2 py-1 rounded text-[10px] font-bold bg-app-surface text-app-tertiary hover:text-app-primary border border-app-border transition-colors uppercase"
                            >
                              <RefreshIcon className="h-3 w-3" />
                              Reload App
                            </button>
                          </h4>
                          <div className="space-y-3">
                            <button
                              id="shared-settings-disconnect-trigger"
                              data-testid="shared-settings-disconnect-trigger"
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
                              id="shared-settings-factory-reset-trigger"
                              data-testid="shared-settings-factory-reset-trigger"
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
