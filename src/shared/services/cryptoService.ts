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

/**
 * CryptoService implements the "Secure Secret Vault" protocol.
 * It uses the native Web Crypto API for zero-dependency, hardware-accelerated
 * encryption and decryption of sensitive application secrets.
 *
 * Pattern: AES-GCM (256-bit) with PBKDF2 (SHA-256) for key derivation.
 */

const ITERATIONS = 100000;
const SALT_SIZE = 16;
const IV_SIZE = 12;

/**
 * Derives a CryptoKey from a user-provided master password.
 */
export const deriveKey = async (
  password: string,
  salt: Uint8Array,
): Promise<CryptoKey> => {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    enc.encode(password),
    "PBKDF2",
    false,
    ["deriveKey"],
  );

  return await crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: new Uint8Array(salt), // Create a fresh, non-shared Uint8Array copy
      iterations: ITERATIONS,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
};

/**
 * Encrypts a plaintext string into a base64-encoded bundle containing salt, iv, and ciphertext.
 */
export const encryptSecret = async (
  plaintext: string,
  password: string,
): Promise<string> => {
  const enc = new TextEncoder();
  const salt = crypto.getRandomValues(new Uint8Array(SALT_SIZE));
  const iv = crypto.getRandomValues(new Uint8Array(IV_SIZE));
  const key = await deriveKey(password, salt);

  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    enc.encode(plaintext),
  );

  // Combine components into a single buffer for storage
  const combined = new Uint8Array(
    salt.length + iv.length + ciphertext.byteLength,
  );
  combined.set(salt, 0);
  combined.set(iv, salt.length);
  combined.set(new Uint8Array(ciphertext), salt.length + iv.length);

  // Return as Base64 string
  return btoa(String.fromCharCode(...combined));
};

/**
 * Decrypts a base64-encoded bundle using the provided master password.
 */
export const decryptSecret = async (
  bundleB64: string,
  password: string,
): Promise<string> => {
  const dec = new TextDecoder();
  const combined = new Uint8Array(
    atob(bundleB64)
      .split("")
      .map((c) => c.charCodeAt(0)),
  );

  const salt = combined.slice(0, SALT_SIZE);
  const iv = combined.slice(SALT_SIZE, SALT_SIZE + IV_SIZE);
  const ciphertext = combined.slice(SALT_SIZE + IV_SIZE);

  const key = await deriveKey(password, salt);

  try {
    const decrypted = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv },
      key,
      ciphertext,
    );
    return dec.decode(decrypted);
  } catch {
    throw new Error("INVALID_MASTER_PASSWORD");
  }
};

/**
 * Helper to check if a string appears to be an encrypted bundle (Base64 check).
 */
export const isEncrypted = (val: string): boolean => {
  if (!val) return false;
  // Simple heuristic: Encrypted bundles are larger than 28 bytes (salt + iv)
  // and are typically longer than raw keys.
  try {
    const decoded = atob(val);
    return decoded.length > SALT_SIZE + IV_SIZE;
  } catch {
    return false;
  }
};
