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

export interface Source {
  title: string;
  uri: string;
}

export interface TokenUsage {
  promptTokens: number;
  responseTokens: number;
  totalTokens: number;
}

export interface Message {
  id: string;
  role: "user" | "model";
  text: string;
  timestamp: Date;
  isStreaming?: boolean;
  sources?: Source[];
  modelUsed?: string; // The model requested by the UI
  verifiedModel?: string; // The model version reported by the API response
  tokenUsage?: TokenUsage; // Token counts reported by the API
  timingMs?: number; // Generation duration
  librarianStatus?: string; // Current status of the Librarian tool (e.g., "Fetching SPAWN...")
  errorType?:
    | "network"
    | "rate-limit"
    | "auth"
    | "timeout"
    | "safety"
    | "generic";
  retryAction?: () => void;
}

export interface ChatState {
  messages: Message[];
  isLoading: boolean;
  error: string | null;
}

export interface Session {
  id: string;
  name: string;
  createdAt: Date;
  lastModified: Date;
}

export interface Snippet {
  id: string;
  title: string;
  language: string;
  code: string;
  createdAt: Date;
  description?: string;
}

export interface ModelDefinition {
  id: string;
  label: string;
  shortLabel: string;
  description: string;
  isExperimental?: boolean;
  isLatest?: boolean;
  isLegacy?: boolean;
  inputTokenLimit?: number;
  outputTokenLimit?: number;
}

export type ModelType = string;

export type ApiStatus =
  | "idle"
  | "connecting"
  | "thinking"
  | "error"
  | "streaming"
  | "offline";

/**
 * THEME SYSTEM V2
 */

export type ThemeSet =
  | "mono"
  | "barley"
  | "desert"
  | "maritime"
  | "woodland"
  | "pru"
  | "mediterranean";
export type BrightnessLevel = "L1" | "L2" | "L3" | "L4" | "L5";
export type AccentRole =
  | "ready"
  | "nav"
  | "alert"
  | "danger"
  | "intel"
  | "gold"
  | "stealth";
export type AccentIntensity = "vivid" | "tactical";

export interface MissionProfile {
  id: string;
  label: string;
  themeSet: ThemeSet;
  brightness: BrightnessLevel;
  accent: AccentRole;
  intensity: AccentIntensity;
  isCustom?: boolean;
}

/**
 * @deprecated Legacy theme types maintained for migration logic
 */
export type ThemeMode =
  | "standard"
  | "carbon"
  | "oled"
  | "paper"
  | "green-camo"
  | "desert-camo"
  | "supercarrier";

/**
 * @deprecated Legacy accent types maintained for migration logic
 */
export type ThemeAccent = "emerald" | "cyan" | "amber" | "rose" | "violet";

export type MooseBranch = "STABLE" | "DEVELOP" | "LEGACY";

export interface AppSettings {
  model: ModelType;
  availableModels: ModelDefinition[];
  lastModelRefresh?: Date;
  isDesanitized: boolean;
  targetMooseBranch: MooseBranch;
  // Theme V2
  themeSet: ThemeSet;
  themeBrightness: BrightnessLevel;
  themeAccentRole: AccentRole;
  themeIntensity: AccentIntensity;
  missionProfile: string; // ID of the active profile or 'custom'
  // Legacy fields for backward compatibility during transition
  themeMode: ThemeMode;
  themeAccent: ThemeAccent;
  githubToken?: string;
}
