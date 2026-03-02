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

import React, { useState, useEffect, useCallback } from "react";
import { ApiStatus, AppSettings, ModelDefinition } from "./types";
import { STORAGE_KEYS, DEFAULT_MODEL_ID, AVAILABLE_MODELS } from "./constants";
import { SettingsContext } from "./SettingsContextDefinition";
import * as crypto from "../shared/services/cryptoService";
import { useAuth } from "../features/auth/useAuth";

interface GeminiApiModel {
  name: string;
  displayName: string;
  description: string;
  supportedGenerationMethods: string[];
  inputTokenLimit?: number;
  outputTokenLimit?: number;
}

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { getMasterPassword } = useAuth();
  const [apiStatus, setApiStatus] = useState<ApiStatus>("idle");
  const [isModelLoading, setIsModelLoading] = useState(false);

  const [settings, setSettings] = useState<AppSettings>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    const initialSettings: AppSettings = {
      model: DEFAULT_MODEL_ID,
      availableModels: AVAILABLE_MODELS,
      isDesanitized: false,
      themeMode: "standard",
      themeAccent: "emerald",
      githubToken: "",
    };

    if (saved) {
      try {
        const parsed = JSON.parse(saved);

        // Map date if it exists
        const lastRefresh = parsed.lastModelRefresh
          ? new Date(parsed.lastModelRefresh)
          : undefined;

        return {
          model: parsed.model || DEFAULT_MODEL_ID,
          availableModels: parsed.availableModels || AVAILABLE_MODELS,
          lastModelRefresh: lastRefresh,
          isDesanitized: parsed.isDesanitized || false,
          themeMode: parsed.themeMode || "standard",
          themeAccent: parsed.themeAccent || "emerald",
          githubToken: parsed.githubToken || "",
        };
      } catch (e) {
        console.error("Failed to parse settings", e);
      }
    }

    return initialSettings;
  });

  // Handle Token Decryption when master password becomes available
  useEffect(() => {
    const pw = getMasterPassword();
    if (
      pw &&
      settings.githubToken &&
      crypto.isEncrypted(settings.githubToken)
    ) {
      crypto
        .decryptSecret(settings.githubToken, pw)
        .then((decrypted) => {
          setSettings((prev) => ({ ...prev, githubToken: decrypted }));
        })
        .catch(() => {
          console.error("Failed to decrypt GitHub token with master password.");
        });
    }
  }, [getMasterPassword, settings.githubToken]);

  const refreshModels = useCallback(async () => {
    const apiKey = localStorage.getItem(STORAGE_KEYS.API_KEY);
    if (!apiKey) return;

    let effectiveKey = apiKey;
    const pw = getMasterPassword();

    // If encrypted, decrypt for the fetch
    if (crypto.isEncrypted(apiKey) && pw) {
      try {
        effectiveKey = await crypto.decryptSecret(apiKey, pw);
      } catch {
        console.error("Discovery: Decryption failed.");
        return;
      }
    } else if (crypto.isEncrypted(apiKey)) {
      // Locked
      return;
    }

    setIsModelLoading(true);
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models`,
        {
          headers: {
            "x-goog-api-key": effectiveKey,
          },
        },
      );

      if (!response.ok) throw new Error("Failed to fetch models");

      const data = await response.json();
      const rawModels: GeminiApiModel[] = data.models || [];

      // 1. Filter and Map based on documentation
      const allDiscovered = rawModels
        .filter((m: GeminiApiModel) => {
          const name = m.name.toLowerCase();
          const hasGeneration =
            m.supportedGenerationMethods.includes("generateContent");

          // Core Tiers ONLY
          const isPro = name.includes("pro");
          const isFlash = name.includes("flash");
          const isThink = name.includes("think") || name.includes("research");

          // Target modern series (2.5, 3.x)
          const isModern =
            name.includes("gemini-3") || name.includes("gemini-2.5");

          // Strict Exclusion List: Exclude everything that isn't a core text model
          const isIrrelevant =
            name.includes("image") ||
            name.includes("banana") ||
            name.includes("veo") ||
            name.includes("lyria") ||
            name.includes("robotics") ||
            name.includes("computer-use") ||
            name.includes("vision") ||
            name.includes("aqa") ||
            name.includes("embedding") ||
            name.includes("text-") ||
            name.includes("chat-") ||
            name.includes("-tts"); // Exclude speech models

          return (
            hasGeneration &&
            (isPro || isFlash || isThink) &&
            !isIrrelevant &&
            isModern
          );
        })
        .map((m: GeminiApiModel) => {
          const name = m.name.toLowerCase();
          const isExperimental =
            name.includes("experimental") ||
            name.includes("preview") ||
            name.includes("thinking") ||
            name.includes("research");

          // Target 3.x and 2.5 for Latest status
          const isLatest =
            name.includes("gemini-3.") || name.includes("gemini-2.5");
          const isLegacy =
            name.includes("gemini-2.0") || name.includes("gemini-1.5");

          let shortName = m.displayName
            .replace(/Gemini /g, "")
            .replace(/ \(Experimental\)/g, "")
            .replace(/ \(Thinking\)/g, "")
            .toUpperCase();

          // Clean up redundancies in labels
          shortName = shortName.replace(/ LATEST/g, "").replace(/ STABLE/g, "");

          // Standardize (PREVIEW) format
          if (shortName.includes(" PREVIEW")) {
            shortName = shortName.replace(" PREVIEW", " (PREVIEW)");
          }

          // Custom description for Research models
          let description = m.description;
          if (name.includes("research") || name.includes("think")) {
            description =
              "Specialized for autonomous research and complex multi-step debugging.";
          }

          return {
            id: m.name.replace("models/", ""),
            label: m.displayName.toUpperCase(),
            shortLabel: shortName,
            description,
            isExperimental,
            isLatest,
            isLegacy,
            inputTokenLimit: m.inputTokenLimit,
            outputTokenLimit: m.outputTokenLimit,
          };
        });

      // 2. Deduplicate: Group by shortLabel and pick the "best" one
      const uniqueModelsMap = new Map<string, ModelDefinition>();

      allDiscovered.forEach((model) => {
        const existing = uniqueModelsMap.get(model.shortLabel);
        if (!existing) {
          uniqueModelsMap.set(model.shortLabel, model);
          return;
        }

        // Preference Logic for versions of the same tier:
        // - Specific versions (e.g. 2.5-pro) beat generic ones (pro)
        // - latest alias beats specific versions
        const isNewer =
          model.id.includes("latest") ||
          (!model.id.match(/\d{3}/) && existing.id.match(/\d{3}/));

        if (isNewer) {
          uniqueModelsMap.set(model.shortLabel, model);
        }
      });

      const discoveredModels = Array.from(uniqueModelsMap.values()).sort(
        (a: ModelDefinition, b: ModelDefinition) => {
          // Strict ID sort: Highest (newest) at the top as requested
          return b.id.localeCompare(a.id);
        },
      );

      if (discoveredModels.length > 0) {
        setSettings((prev) => {
          return {
            ...prev,
            availableModels: discoveredModels,
            lastModelRefresh: new Date(),
          };
        });
      }
    } catch (error) {
      console.error("Discovery Error:", error);
    } finally {
      setIsModelLoading(false);
    }
  }, [getMasterPassword]);

  // Sync settings to localStorage (with encryption for PAT)
  useEffect(() => {
    const sync = async () => {
      const pw = getMasterPassword();
      const settingsToSave = { ...settings };

      if (
        pw &&
        settings.githubToken &&
        !crypto.isEncrypted(settings.githubToken)
      ) {
        const encrypted = await crypto.encryptSecret(settings.githubToken, pw);
        settingsToSave.githubToken = encrypted;
      }

      localStorage.setItem(
        STORAGE_KEYS.SETTINGS,
        JSON.stringify(settingsToSave),
      );

      if (typeof document !== "undefined" && document.body) {
        document.body.className = `mode-${settings.themeMode} accent-${settings.themeAccent}`;
      }
    };

    sync();
  }, [settings, getMasterPassword]);

  // Initial Discovery and Refresh on API Key change
  useEffect(() => {
    const apiKey = localStorage.getItem(STORAGE_KEYS.API_KEY);
    if (apiKey) {
      // Refresh if never refreshed or older than 24 hours
      // We check raw localStorage here to avoid stale state issues on mount
      const saved = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      let lastRefreshTime = 0;

      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (parsed.lastModelRefresh) {
            lastRefreshTime = new Date(parsed.lastModelRefresh).getTime();
          }
        } catch (e) {
          console.error("Failed to check last refresh", e);
        }
      }

      const shouldRefresh =
        lastRefreshTime === 0 ||
        new Date().getTime() - lastRefreshTime > 24 * 60 * 60 * 1000;

      if (shouldRefresh) {
        refreshModels();
      }
    }
  }, [refreshModels]);

  return (
    <SettingsContext.Provider
      value={{
        settings,
        apiStatus,
        isModelLoading,
        updateSettings: (u) => {
          setSettings((prev) => ({ ...prev, ...u }));
        },
        setApiStatus,
        refreshModels,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
};
