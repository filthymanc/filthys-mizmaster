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
import { Dialog, Transition, Tab, Switch } from "@headlessui/react";
import { useSettings } from "../../core/useSettings";
import {
  ThemeSet,
  BrightnessLevel,
  AccentRole,
  ThemeMode,
} from "../../core/types";
import { MISSION_PROFILES } from "../../core/constants";
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
  ShieldIcon,
} from "./Icons";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportData: () => void;
  onExportData: () => void;
  onDisconnect: () => void;
  initialTab?: number;
  onOpenFieldManual: (
    tab:
      | "briefing"
      | "systems"
      | "controls"
      | "tactics"
      | "developer"
      | "intel"
      | "legal",
  ) => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  onImportData,
  onExportData,
  onDisconnect,
  initialTab = 0,
  onOpenFieldManual,
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
  const [showAdvancedTheme, setShowAdvancedTheme] = useState(
    settings.missionProfile === "custom",
  );

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

  const themeSets: { id: ThemeSet; label: string; bias: string }[] = [
    { id: "mono", label: "Monochrome", bias: "Neutral" },
    { id: "soft", label: "Subtle", bias: "Slate Blue" },
    { id: "nvg", label: "Forest", bias: "NVG Green" },
    { id: "coyote", label: "Desert", bias: "Coyote Tan" },
    { id: "deck", label: "Naval", bias: "Steel Deck" },
  ];

  const brightnessLevels: { id: BrightnessLevel; label: string }[] = [
    { id: "L1", label: "OLED" },
    { id: "L2", label: "Dark" },
    { id: "L3", label: "Medium" },
    { id: "L4", label: "Light" },
    { id: "L5", label: "Paper" },
  ];

  const accentRoles: { id: AccentRole; label: string }[] = [
    { id: "ready", label: "Ready" },
    { id: "nav", label: "Nav" },
    { id: "alert", label: "Alert" },
    { id: "danger", label: "Danger" },
    { id: "intel", label: "Intel" },
    { id: "gold", label: "gold" },
    { id: "stealth", label: "Stealth" },
  ];

  const applyProfile = (profileId: string) => {
    const profile = MISSION_PROFILES.find((p) => p.id === profileId);
    if (profile) {
      updateSettings({
        missionProfile: profile.id,
        themeSet: profile.themeSet,
        themeBrightness: profile.brightness,
        themeAccentRole: profile.accent,
        themeIntensity: profile.intensity,
      });
    }
  };

  // Keep legacy definitions for transition
  const legacyModes: { id: ThemeMode; label: string }[] = [
    { id: "standard", label: "Standard" },
    { id: "carbon", label: "Carbon" },
    { id: "oled", label: "OLED Black" },
    { id: "paper", label: "Paper" },
    { id: "green-camo", label: "Green Camo" },
    { id: "desert-camo", label: "Desert Camo" },
    { id: "supercarrier", label: "Supercarrier" },
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
          <div className="fixed inset-0 bg-app-canvas/70 backdrop-blur-sm" />
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
                    className="text-app-icon-tertiary hover:text-app-icon-primary transition-colors focus:outline-none focus:ring-2 focus:ring-app-brand rounded-full p-1"
                  >
                    <XIcon className="h-6 w-6" />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 scroll-smooth custom-scrollbar">
                  <Tab.Group defaultIndex={initialTab}>
                    <Tab.List className="flex space-x-1 rounded-xl bg-app-canvas p-1 border border-app-border mb-6 shrink-0">
                      {["Engine", "Interface", "Data & Identity"].map(
                        (category) => (
                          <Tab
                            key={category}
                            id={`shared-settings-tab-${category.toLowerCase().replace(/\s+/g, "-")}`}
                            data-testid={`shared-settings-tab-${category.toLowerCase().replace(/\s+/g, "-")}`}
                            className={({ selected }) =>
                              `w-full rounded-lg py-2.5 text-sm font-bold leading-5 ring-app-brand/60 ring-offset-2 ring-offset-app-brand focus:outline-none focus:ring-2
                              ${
                                selected
                                  ? "bg-app-surface text-app-brand ring-1"
                                  : "text-app-tertiary hover:bg-app-surface/20 hover:text-app-secondary"
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
                                  <SpinnerIcon className="h-3 w-3 text-app-icon-tertiary animate-spin" />
                                ) : (
                                  <RefreshIcon className="h-3 w-3 text-app-icon-tertiary" />
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
                                      ? "bg-app-status-danger"
                                      : "bg-app-primary/20 border border-app-border"
                                  }
                                `}
                            >
                              <span
                                aria-hidden="true"
                                className={`
                                    pointer-events-none inline-block h-5 w-5 transform rounded-full bg-app-primary shadow ring-0 transition duration-200 ease-in-out
                                    ${
                                      settings.isDesanitized
                                        ? "translate-x-5"
                                        : "translate-x-0"
                                    }
                                  `}
                              />
                            </button>
                          </div>
                          {settings.isDesanitized ? (
                            <div className="p-3 bg-app-status-danger/10 border border-app-status-danger/30 text-app-status-danger rounded-lg text-xs flex gap-2 items-start">
                              <AlertIcon className="h-4 w-4 shrink-0 mt-0.5" />
                              <div className="flex flex-col gap-1">
                                <span className="font-bold uppercase tracking-widest text-[10px]">
                                  Dev Mode Active
                                </span>
                                <span>
                                  Experimental features and advanced scripting
                                  capabilities are enabled. The AI may generate
                                  responses that interact with the OS and bypass
                                  standard safety protocols for development.
                                  <strong>
                                    {" "}
                                    MOOSE Develop branch access is now UNLOCKED.
                                  </strong>
                                </span>
                              </div>
                            </div>
                          ) : (
                            <div className="p-3 bg-app-brand/5 border border-app-border rounded-lg text-[10px] text-app-tertiary flex gap-2 items-start">
                              <ShieldIcon className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                              <span>
                                Standard security protocols active. The MOOSE{" "}
                                <strong>DEVELOP</strong> branch is restricted.
                                Switch to Dev Mode to access experimental
                                framework documentation and advanced scripting
                                capabilities.
                              </span>
                            </div>
                          )}
                        </div>
                      </Tab.Panel>

                      {/* INTERFACE SETTINGS */}
                      <Tab.Panel className="focus:outline-none space-y-8 animate-fadeIn">
                        {/* Mission Profile Selection */}
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <h4 className="text-sm font-bold text-app-secondary uppercase tracking-wider">
                              Mission Profiles
                            </h4>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-bold text-app-tertiary uppercase tracking-widest">
                                Advanced Builder
                              </span>
                              <Switch
                                checked={showAdvancedTheme}
                                onChange={setShowAdvancedTheme}
                                className={`${
                                  showAdvancedTheme
                                    ? "bg-app-brand"
                                    : "bg-app-primary/20 border border-app-border"
                                } relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-app-brand focus:ring-offset-2`}
                              >
                                <span
                                  className={`${
                                    showAdvancedTheme
                                      ? "translate-x-4"
                                      : "translate-x-0"
                                  } pointer-events-none inline-block h-4 w-4 transform rounded-full bg-app-primary shadow ring-0 transition duration-200 ease-in-out`}
                                />
                              </Switch>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {MISSION_PROFILES.map((profile) => (
                              <button
                                key={profile.id}
                                id={`shared-settings-profile-${profile.id}`}
                                data-testid={`shared-settings-profile-${profile.id}`}
                                onClick={() => applyProfile(profile.id)}
                                className={`p-4 rounded-xl border text-left transition-all ${
                                  settings.missionProfile === profile.id
                                    ? "bg-app-brand/10 border-app-brand ring-1 ring-app-brand/30"
                                    : "bg-app-surface border-app-border hover:border-app-highlight"
                                }`}
                              >
                                <div
                                  className={`text-xs font-bold uppercase ${
                                    settings.missionProfile === profile.id
                                      ? "text-app-brand"
                                      : "text-app-primary"
                                  }`}
                                >
                                  {profile.label}
                                </div>
                                <div className="text-[9px] text-app-tertiary mt-1 font-mono uppercase tracking-tighter">
                                  {profile.themeSet} / {profile.brightness} /{" "}
                                  {profile.accent}
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Advanced Theme Builder */}
                        {showAdvancedTheme && (
                          <div className="space-y-6 pt-6 border-t border-app-border/50 animate-fadeIn">
                            <div className="flex items-center gap-2 text-app-brand">
                              <ShieldIcon className="h-4 w-4" />
                              <h4 className="text-[10px] font-bold uppercase tracking-widest">
                                Tactical Theme Builder (Custom)
                              </h4>
                            </div>

                            {/* Set Selection */}
                            <div className="space-y-3">
                              <label className="text-[10px] font-bold text-app-tertiary uppercase tracking-wider">
                                1. Environment Palette
                              </label>
                              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                                {themeSets.map((set) => (
                                  <button
                                    key={set.id}
                                    onClick={() =>
                                      updateSettings({
                                        themeSet: set.id,
                                        missionProfile: "custom",
                                      })
                                    }
                                    className={`p-2 rounded-lg border text-[10px] font-bold transition-all ${
                                      settings.themeSet === set.id
                                        ? "bg-app-brand text-app-canvas border-app-brand"
                                        : "bg-app-canvas border-app-border text-app-secondary hover:text-app-primary"
                                    }`}
                                  >
                                    {set.label}
                                  </button>
                                ))}
                              </div>
                            </div>

                            {/* Brightness Selection */}
                            <div className="space-y-3">
                              <label className="text-[10px] font-bold text-app-tertiary uppercase tracking-wider">
                                2. Luminance Level
                              </label>
                              <div className="grid grid-cols-5 gap-2">
                                {brightnessLevels.map((lvl) => (
                                  <button
                                    key={lvl.id}
                                    onClick={() =>
                                      updateSettings({
                                        themeBrightness: lvl.id,
                                        missionProfile: "custom",
                                      })
                                    }
                                    className={`p-2 rounded-lg border text-[10px] font-bold transition-all ${
                                      settings.themeBrightness === lvl.id
                                        ? "bg-app-brand text-app-canvas border-app-brand"
                                        : "bg-app-canvas border-app-border text-app-secondary hover:text-app-primary"
                                    }`}
                                  >
                                    {lvl.label}
                                  </button>
                                ))}
                              </div>
                            </div>

                            {/* Accent Selection */}
                            <div className="space-y-3">
                              <label className="text-[10px] font-bold text-app-tertiary uppercase tracking-wider">
                                3. Command Accent
                              </label>
                              <div className="flex flex-wrap gap-2">
                                {accentRoles.map((role) => (
                                  <button
                                    key={role.id}
                                    onClick={() =>
                                      updateSettings({
                                        themeAccentRole: role.id,
                                        missionProfile: "custom",
                                      })
                                    }
                                    className={`w-8 h-8 rounded-full border-2 transition-all ${
                                      settings.themeAccentRole === role.id
                                        ? "border-app-primary scale-110 shadow-lg"
                                        : "border-transparent opacity-60 hover:opacity-100"
                                    }`}
                                    style={{
                                      backgroundColor: `oklch(var(--color-status-${role.id}))`,
                                    }}
                                    title={role.label}
                                  />
                                ))}
                              </div>
                            </div>

                            {/* Intensity Toggle */}
                            <div className="p-4 rounded-xl border border-app-border bg-app-surface flex items-center justify-between">
                              <div>
                                <div className="text-xs font-bold text-app-primary">
                                  Accent Intensity
                                </div>
                                <div className="text-[10px] text-app-tertiary">
                                  Vivid (High Contrast) vs. Tactical (Matte)
                                </div>
                              </div>
                              <button
                                onClick={() =>
                                  updateSettings({
                                    themeIntensity:
                                      settings.themeIntensity === "vivid"
                                        ? "tactical"
                                        : "vivid",
                                    missionProfile: "custom",
                                  })
                                }
                                className={`px-3 py-1 rounded-lg border text-[10px] font-bold transition-all ${
                                  settings.themeIntensity === "vivid"
                                    ? "bg-app-status-alert/10 border-app-status-alert text-app-status-alert"
                                    : "bg-app-brand/10 border-app-brand text-app-brand"
                                }`}
                              >
                                {settings.themeIntensity.toUpperCase()}
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Legacy Settings (Hidden when advanced builder is active) */}
                        {!showAdvancedTheme && (
                          <div className="space-y-6 pt-6 border-t border-app-border/50 opacity-50 grayscale pointer-events-none">
                            <h4 className="text-[10px] font-bold uppercase tracking-widest">
                              Legacy Identifiers (Internal Only)
                            </h4>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                              {legacyModes.map((mode) => (
                                <button
                                  key={mode.id}
                                  className={`p-2 rounded-lg border text-[10px] font-bold ${
                                    settings.themeMode === mode.id
                                      ? "bg-app-surface border-app-brand"
                                      : "border-app-border"
                                  }`}
                                >
                                  {mode.label}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </Tab.Panel>

                      {/* DATA & IDENTITY SETTINGS */}
                      <Tab.Panel className="focus:outline-none space-y-8 animate-fadeIn">
                        {/* GitHub Integration */}
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <h4 className="text-sm font-bold text-app-secondary uppercase tracking-wider flex items-center gap-2">
                              <GithubIcon className="h-4 w-4" />
                              GitHub Integration
                            </h4>
                            <button
                              id="shared-settings-github-manual-link"
                              onClick={() => onOpenFieldManual("systems")}
                              className="text-[10px] font-bold text-app-brand hover:text-app-brand/80 underline tracking-widest uppercase"
                            >
                              Setup Guide
                            </button>
                          </div>
                          <div className="p-4 rounded-xl border border-app-border bg-app-surface space-y-3">
                            <p className="text-xs text-app-primary">
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
                                className="flex-1 bg-app-canvas border border-app-border rounded p-2 text-sm font-mono text-app-primary placeholder:text-app-tertiary focus:outline-none focus:border-app-brand"
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
                                className="px-4 py-2 bg-app-brand text-app-canvas rounded font-bold text-sm hover:bg-app-brand/90 transition-colors disabled:opacity-50 flex items-center gap-2"
                              >
                                {isValidatingToken && (
                                  <SpinnerIcon className="h-4 w-4 animate-spin" />
                                )}
                                {isValidatingToken ? "Verifying..." : "Save"}
                              </button>
                            </form>
                            {tokenError && (
                              <p className="text-app-status-danger text-[10px] font-bold animate-pulse">
                                {tokenError}
                              </p>
                            )}
                            {settings.githubToken && !tokenError && (
                              <p className="text-app-status-ready text-xs font-bold flex items-center gap-1">
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
                              className="p-4 bg-app-surface border border-app-border rounded-xl text-app-secondary hover:text-app-status-intel hover:border-app-status-intel/50 transition-colors flex flex-col items-center justify-center gap-2 group"
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
                        <div className="space-y-4 pt-4 border-t border-app-status-danger/20">
                          <h4 className="text-sm font-bold text-app-status-danger uppercase tracking-wider flex justify-between items-center">
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
                                      ? "bg-app-status-alert text-app-canvas border-app-status-alert animate-pulse"
                                      : "bg-app-surface border-app-border hover:border-app-status-alert/50 text-app-secondary hover:text-app-status-alert"
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
                                      ? "bg-app-status-danger text-app-canvas border-app-status-danger animate-pulse shadow-app-status-danger/50 shadow-lg"
                                      : "bg-app-surface border-app-border hover:border-app-status-danger/50 text-app-secondary hover:text-app-status-danger"
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
