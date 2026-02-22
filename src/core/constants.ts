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

import { APP_VERSION, STORAGE_VERSION_TAG } from "./version";

// --- SYSTEM CONSTANTS ---

export interface ModelDefinition {
    id: string;
    label: string;
    shortLabel: string; // Added for mobile optimization
    description: string;
    isExperimental?: boolean;
}

/**
 * Verified Model Catalog: Gemini 3 Series
 */
export const AVAILABLE_MODELS: ModelDefinition[] = [
  { 
    id: "gemini-3-pro-preview", 
    label: "3 PRO (PREVIEW)", 
    shortLabel: "3 PRO",
    description: "Advanced intelligence. Best for complex MOOSE logic and architecture." 
  },
  { 
    id: "gemini-3-flash-preview", 
    label: "3 FLASH (PREVIEW)", 
    shortLabel: "3 FLASH",
    description: "Ultra-fast response. Ideal for DML attribute lookups and quick fixes." 
  }
];

// Default model for new users
export const DEFAULT_MODEL_ID = AVAILABLE_MODELS[0].id;

export const STORAGE_KEYS = {
  // Credentials & Settings
  API_KEY: "filthys-mizmaster-api-key",
  SETTINGS: "filthys-mizmaster-settings",
  ONBOARDED: "filthys-mizmaster-onboarded",

  // Data Indexing (Versioned)
  INDEX: `filthys-mizmaster-${STORAGE_VERSION_TAG}-index`,
  SESSION_PREFIX: "mission-session-",
  TREE_CACHE_PREFIX: "filthys-mizmaster-tree-",
};

// --- CHAT & CONTEXT LIMITS ---
export const CONTEXT_LIMITS = {
  MAX_MESSAGES: 20,         
  PROTECT_FIRST_MSG: true,  
};

export const WELCOME_MESSAGE_TEXT =
  "**FILTHY'S MIZMASTER ONLINE**\n\nSafety Protocols: **ACTIVE**\nReady to assist with MOOSE scripting and DML attribute configuration.\n\nPlease define your mission objective.";

export const SYSTEM_INSTRUCTION = `
ROLE: You are filthy's MizMaster, an expert Mission Building Assistant for DCS World.
VERSION: v${APP_VERSION}

SPECIALIZATION & PRIORITY HIERARCHY:
1. DML (Dynamic Mission Library) - [Source: GitHub csofranz/DML]
2. MOOSE (Mission Object Oriented Scripting Environment) - [Source: GitHub FlightControl-Master/MOOSE]
3. Simulator Scripting Engine (SSE) - [Target: Hard Deck]

YOUR GOAL: To assist the user in building error-free combat missions by analyzing RAW LUA SOURCE CODE.

---

### CORE GOVERNANCE: THE 6 IMMUTABLE LAWS
1. LAW of ENVIRONMENT: Sanitized default. No 'os', 'io', 'lfs'.
2. LAW of VERIFICATION: Fetch source via Librarian tools.
3. LAW of DISCOVERY: Use fuzzy search on file trees.
4. LAW of PROVENANCE: State source branch/version.
5. LAW of PERSISTENCE: Remind user to save .miz.
6. LAW of THE ASCII MANDATE: No emojis or special symbols.
`;

export const SUGGESTED_QUERIES = [
  "How do I add MOOSE or DML to my missions",
  "How do I use DML to clone units?",
  "How do I avoid script errors in loops?",
  "How do I check available Group functions?",
];
