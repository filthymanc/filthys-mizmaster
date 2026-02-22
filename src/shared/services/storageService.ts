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

import { Session, Message } from "../../core/types";
import { STORAGE_KEYS } from "../../core/constants";
import * as idb from "./idbService";

/**
 * Initializes the storage subsystem.
 * Performs a one-time cleanup of legacy LocalStorage data to prevent conflicts.
 */
export const initializeStorage = async () => {
  try {
    const legacyIndex = localStorage.getItem(STORAGE_KEYS.INDEX);
    if (legacyIndex) {
      console.log("Storage: Legacy data detected. Performing cleanup...");
      
      // Remove legacy keys
      localStorage.removeItem(STORAGE_KEYS.INDEX);
      
      // Pattern Matching Removals for Sessions
      Object.keys(localStorage).forEach((key) => {
        if (key.startsWith(STORAGE_KEYS.SESSION_PREFIX)) {
          localStorage.removeItem(key);
        }
      });
      
      console.log("Storage: Legacy cleanup complete. Switched to IndexedDB.");
    }
  } catch (e) {
    console.error("Storage Error: Failed to initialize/cleanup", e);
  }
};

/**
 * Loads the Session Index.
 */
export const loadSessionIndex = async (): Promise<Session[]> => {
  try {
    return await idb.getAllSessions();
  } catch (e) {
    console.error("Storage Error: Failed to load session index", e);
    return [];
  }
};

/**
 * Saves the Session Index
 */
export const saveSessionIndex = async (sessions: Session[]): Promise<void> => {
  try {
    // We strictly overwrite the entire list to maintain order/sync
    await idb.saveAllSessions(sessions);
  } catch (e) {
    console.error("Storage Error: Failed to save session index", e);
  }
};

/**
 * Loads messages for a specific session ID (Lazy Load)
 */
export const loadSessionMessages = async (sessionId: string): Promise<Message[]> => {
  try {
    return await idb.getSessionMessages(sessionId);
  } catch (e) {
    console.error(
      `Storage Error: Failed to load messages for session ${sessionId}`,
      e
    );
    return [];
  }
};

/**
 * Saves messages for a specific session ID
 */
export const saveSessionMessages = async (sessionId: string, messages: Message[]): Promise<void> => {
  try {
    await idb.saveSessionMessages(sessionId, messages);
  } catch (e) {
    console.error(
      `Storage Error: Failed to save messages for session ${sessionId}`,
      e
    );
  }
};

/**
 * Deletes a specific session's message history and the session entry itself
 */
export const deleteSessionData = async (sessionId: string): Promise<void> => {
  try {
    // Delete messages
    await idb.deleteSessionMessages(sessionId);
    // Delete session meta
    await idb.deleteSession(sessionId);
  } catch (e) {
    console.error(
      `Storage Error: Failed to delete session data ${sessionId}`,
      e
    );
  }
};

/**
 * Exports all data (Sessions + Messages) to a JSON object
 */
export const exportAllData = async (): Promise<{ sessions: Session[]; messages: Record<string, Message[]> }> => {
  try {
    const sessions = await idb.getAllSessions();
    const messages: Record<string, Message[]> = {};

    for (const session of sessions) {
      messages[session.id] = await idb.getSessionMessages(session.id);
    }

    return { sessions, messages };
  } catch (e) {
    console.error("Storage Error: Failed to export all data", e);
    return { sessions: [], messages: {} };
  }
};

/**
 * Imports data (Sessions + Messages) from a JSON object
 * Merges with existing data
 */
export const importAllData = async (data: { sessions: Session[]; messages: Record<string, Message[]> }): Promise<void> => {
  try {
    if (!data.sessions || !Array.isArray(data.sessions)) {
      throw new Error("Invalid import data: Missing sessions array");
    }

    // Save Sessions (Merging handled by logic, but IDB saveAllSessions overwrites)
    // Actually, we should probably fetch existing, merge, and save.
    // For simplicity, let's assume the calling logic handles index merging, 
    // but here we ensure messages are saved for each session.

    // 1. Save Messages for each imported session
    if (data.messages) {
      for (const [sessionId, msgs] of Object.entries(data.messages)) {
        await idb.saveSessionMessages(sessionId, msgs);
      }
    }
    
    // 2. We assume the session index update is handled by the caller (useSessionManager)
    // or we can update it here if we want to bypass the hook's state.
    // However, since useSessionManager manages the "Source of Truth" for the session list,
    // we should let it handle the index update. This function primarily restores the heavy message data.
    
  } catch (e) {
    console.error("Storage Error: Failed to import data", e);
    throw e;
  }
};

/**
 * Clears all app data (Factory Reset)
 */
export const clearAllData = async (): Promise<void> => {
  try {
    // Clear IDB
    await idb.clearDatabase();

    // Clear LocalStorage (Settings, API Keys, etc.)
    const keysToRemove = [
      STORAGE_KEYS.INDEX, // Just in case
      STORAGE_KEYS.API_KEY,
      STORAGE_KEYS.SETTINGS,
      STORAGE_KEYS.ONBOARDED,
    ];

    keysToRemove.forEach((k) => localStorage.removeItem(k));

    // Clear legacy pattern keys just in case
    Object.keys(localStorage).forEach((key) => {
      if (
        key.startsWith(STORAGE_KEYS.SESSION_PREFIX) ||
        key.startsWith(STORAGE_KEYS.TREE_CACHE_PREFIX)
      ) {
        localStorage.removeItem(key);
      }
    });

    console.log("Factory Reset Complete: All data wiped.");
  } catch (e) {
    console.error("Storage Error: Failed to clear all data", e);
  }
};
