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

import { useState, useEffect, useCallback } from "react";
import { validateApiKey } from "../librarian/geminiService";
import { STORAGE_KEYS } from "../../core/constants";
import * as crypto from "../../shared/services/cryptoService";

// In-memory master password storage (never persisted)
let memoryMasterPassword: string | null = null;

export const useAuth = () => {
  const [apiKey, setApiKey] = useState<string>("");
  const [hasApiKey, setHasApiKey] = useState(false);
  const [isVisitor, setIsVisitor] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isLocked, setIsLocked] = useState(false);

  // Initial Load
  const checkAuth = useCallback(async () => {
    const stored = localStorage.getItem(STORAGE_KEYS.API_KEY);

    if (stored) {
      if (crypto.isEncrypted(stored)) {
        if (memoryMasterPassword) {
          try {
            const decrypted = await crypto.decryptSecret(
              stored,
              memoryMasterPassword,
            );
            setApiKey(decrypted);
            setHasApiKey(true);
            setIsLocked(false);
          } catch {
            setApiKey("");
            setHasApiKey(false);
            setIsLocked(true);
          }
        } else {
          // Encrypted but no password in memory
          setApiKey("");
          setHasApiKey(false);
          setIsLocked(true);
        }
      } else {
        // Migration: Legacy Plaintext
        setApiKey(stored);
        setHasApiKey(true);
        setIsLocked(false);
      }
    } else {
      setApiKey("");
      setHasApiKey(false);
      setIsLocked(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const login = async (
    keyInput: string,
    masterPassword?: string,
  ): Promise<boolean> => {
    const key = keyInput.trim();
    if (!key) return false;

    setIsVerifying(true);
    setAuthError(null);

    try {
      const isValid = await validateApiKey(key);
      if (isValid) {
        if (masterPassword) {
          const encrypted = await crypto.encryptSecret(key, masterPassword);
          localStorage.setItem(STORAGE_KEYS.API_KEY, encrypted);
          memoryMasterPassword = masterPassword;
        } else {
          // Fallback if no password provided (not recommended but allowed for migration)
          localStorage.setItem(STORAGE_KEYS.API_KEY, key);
        }

        setApiKey(key);
        setHasApiKey(true);
        setIsVisitor(false);
        setIsLocked(false);
        setIsVerifying(false);
        return true;
      }
      return false;
    } catch (e: any) {
      if (e.message === "INVALID_KEY") {
        setAuthError(
          "Invalid API Key. Please verify your credentials in Google AI Studio.",
        );
      } else if (e.message === "TIMEOUT") {
        setAuthError(
          "Validation timed out. Please check your network connection.",
        );
      } else {
        setAuthError(
          "Connection failed. Please check your network or proxy settings.",
        );
      }
      setIsVerifying(false);
      return false;
    }
  };

  const loginAsVisitor = () => {
    setIsVisitor(true);
    setApiKey("");
    setHasApiKey(false);
    setIsLocked(false);
  };

  const unlock = async (password: string): Promise<boolean> => {
    const stored = localStorage.getItem(STORAGE_KEYS.API_KEY);
    if (!stored || !crypto.isEncrypted(stored)) return false;

    setIsVerifying(true);
    setAuthError(null);
    try {
      const decrypted = await crypto.decryptSecret(stored, password);

      // If we reach here, the password is correct (decryption succeeded)
      memoryMasterPassword = password;
      setApiKey(decrypted);
      setHasApiKey(true);
      setIsVisitor(false);
      setIsLocked(false);

      // Attempt to validate the key in the background
      try {
        await validateApiKey(decrypted);
      } catch (ve: any) {
        if (ve.message === "INVALID_KEY") {
          setAuthError(
            "API Key is invalid or cancelled. Please update it in Settings.",
          );
        } else {
          setAuthError(
            "API Validation failed. Check network status in the workspace.",
          );
        }
      }

      setIsVerifying(false);
      return true;
    } catch (e: any) {
      setIsVerifying(false);
      if (e.message === "INVALID_MASTER_PASSWORD") {
        setAuthError("Invalid Master Password.");
      } else {
        setAuthError("Vault decryption failed or corrupted.");
      }
      return false;
    }
  };

  const logout = () => {
    setApiKey("");
    setHasApiKey(false);
    setIsVisitor(false);
    memoryMasterPassword = null;
    localStorage.removeItem(STORAGE_KEYS.API_KEY);
    // Optional: Reload to clear memory states
    window.location.reload();
  };

  return {
    apiKey,
    hasApiKey,
    isVisitor,
    isAuthenticated: hasApiKey || isVisitor,
    isVerifying,
    authError,
    isLocked,
    login,
    loginAsVisitor,
    unlock,
    logout,
    checkAuth,
    getMasterPassword: () => memoryMasterPassword,
  };
};
