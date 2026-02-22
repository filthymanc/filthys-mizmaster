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

import React, { useState, useEffect } from "react";
import { ApiStatus, AppSettings } from "./types";
import { STORAGE_KEYS, DEFAULT_MODEL_ID, AVAILABLE_MODELS } from "./constants";
import { SettingsContext } from "./SettingsContextDefinition";

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [settings, setSettings] = useState<AppSettings>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    let initialSettings: AppSettings = {
      model: DEFAULT_MODEL_ID,
      isDesanitized: false,
      themeMode: "standard",
      themeAccent: "emerald",
      githubToken: "",
    };

    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        
        // Resilience Check: Ensure the saved model still exists in our catalog
        const isModelValid = AVAILABLE_MODELS.some(m => m.id === parsed.model);
        const modelId = isModelValid ? parsed.model : DEFAULT_MODEL_ID;

        initialSettings = {
          model: modelId,
          isDesanitized: parsed.isDesanitized || false,
          themeMode: parsed.themeMode || "standard",
          themeAccent: parsed.themeAccent || "emerald",
          githubToken: parsed.githubToken || "",
        };
      } catch (e) {
        console.error("Failed to parse settings", e);
      }
    }

    if (typeof document !== "undefined" && document.body) {
      document.body.className = `mode-${initialSettings.themeMode} accent-${initialSettings.themeAccent}`;
    }

    return initialSettings;
  });

  const [apiStatus, setApiStatus] = useState<ApiStatus>("idle");

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
    if (typeof document !== "undefined" && document.body) {
      document.body.className = `mode-${settings.themeMode} accent-${settings.themeAccent}`;
    }
  }, [settings]);

  return (
    <SettingsContext.Provider
      value={{
        settings,
        apiStatus,
        updateSettings: (u) => {
            setSettings((prev) => ({ ...prev, ...u }));
        },
        setApiStatus,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
};
