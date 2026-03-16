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
 * Sanitized Logger Utility
 * Masks sensitive information like API keys and tokens from logs.
 */

const SENSITIVE_PATTERNS = [
  // Google AI API Key (Gemini)
  /AIzaSy[A-Za-z0-9_-]{33}/g,
  // GitHub Personal Access Token (Classic and Fine-Grained)
  /ghp_[A-Za-z0-9]{36}/g,
  /github_pat_[A-Za-z0-9_]{82}/g,
  // Generic secrets (Basic protection)
  /api[-_]?key=([A-Za-z0-9_-]{20,})/gi,
  /token=([A-Za-z0-9_-]{20,})/gi,
  /secret=([A-Za-z0-9_-]{20,})/gi,
];

const mask = (text: string): string => {
  let sanitized = text;
  SENSITIVE_PATTERNS.forEach((pattern) => {
    sanitized = sanitized.replace(pattern, (match) => {
      if (match.length > 8) {
        return match.slice(0, 4) + "..." + match.slice(-4);
      }
      return "[REDACTED]";
    });
  });
  return sanitized;
};

const formatArgs = (args: unknown[]): unknown[] => {
  return args.map((arg) => {
    if (typeof arg === "string") {
      return mask(arg);
    }
    if (typeof arg === "object" && arg !== null) {
      try {
        const str = JSON.stringify(arg);
        return JSON.parse(mask(str));
      } catch {
        return "[SECURE OBJECT]";
      }
    }
    return arg;
  });
};

export const logger = {
  info: (message: string, ...args: unknown[]) => {
    console.info(`[INFO] ${mask(message)}`, ...formatArgs(args));
  },
  warn: (message: string, ...args: unknown[]) => {
    console.warn(`[WARN] ${mask(message)}`, ...formatArgs(args));
  },
  error: (message: string, ...args: unknown[]) => {
    console.error(`[ERROR] ${mask(message)}`, ...formatArgs(args));
  },
  debug: (message: string, ...args: unknown[]) => {
    if (import.meta.env.DEV) {
      console.debug(`[DEBUG] ${mask(message)}`, ...formatArgs(args));
    }
  },
};
