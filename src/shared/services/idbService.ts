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

import { openDB, DBSchema, IDBPDatabase } from "idb";
import { Session, Message, Snippet } from "../../core/types";

export interface LibrarianCacheEntry {
  url: string;
  content: string;
  timestamp: number;
}

export interface FrameworkManifest {
  id: string; // framework-branch (e.g. MOOSE-master-ng)
  version: string;
  framework: string;
  branch: string;
  classes: Record<
    string,
    {
      path: string;
      parent?: string | null;
      description?: string;
      methods?: Record<string, { params?: string[]; description?: string }>;
      attributes?: Record<string, { name: string; type: 'property' | 'trigger' | 'condition' }>;
    }
  >;
  enums: Record<string, { description?: string, fields: { name: string; description?: string }[] }>;
}

interface MissionArchitectDB extends DBSchema {
  sessions: {
    key: string;
    value: Session;
  };
  messages: {
    key: string; // sessionId
    value: { sessionId: string; messages: Message[] };
  };
  snippets: {
    key: string;
    value: Snippet;
  };
  librarian_cache: {
    key: string;
    value: LibrarianCacheEntry;
  };
  manifests: {
    key: string; // id: framework-branch
    value: FrameworkManifest;
  };
}

const DB_NAME = "filthys-mizmaster-db";
const DB_VERSION = 10; // Incremented to force flush for expanded regex manifest discovery

let dbPromise: Promise<IDBPDatabase<MissionArchitectDB>> | null = null;

const getDB = () => {
  if (!dbPromise) {
    dbPromise = openDB<MissionArchitectDB>(DB_NAME, DB_VERSION, {
      upgrade(db, oldVersion, _newVersion, _transaction) {
        console.log(`[IDB] Upgrading database from v${oldVersion} to v${DB_VERSION}`);
        // Create object stores if they don't exist
        if (!db.objectStoreNames.contains("sessions")) {
          db.createObjectStore("sessions", { keyPath: "id" });
        }
        if (!db.objectStoreNames.contains("messages")) {
          db.createObjectStore("messages", { keyPath: "sessionId" });
        }
        if (oldVersion < 2 && !db.objectStoreNames.contains("snippets")) {
          db.createObjectStore("snippets", { keyPath: "id" });
        }
        if (
          oldVersion < 3 &&
          !db.objectStoreNames.contains("librarian_cache")
        ) {
          db.createObjectStore("librarian_cache", { keyPath: "url" });
        }
        // Force manifest flush on Version 10 to ensure expanded class discovery is cached
        if (oldVersion < 10) {
          if (db.objectStoreNames.contains("manifests")) {
            db.deleteObjectStore("manifests");
          }
          db.createObjectStore("manifests", { keyPath: "id" });
        }
      },
      blocked() {
        console.warn("[IDB] Database upgrade blocked! Please close other tabs.");
      },
      blocking() {
        console.warn("[IDB] Database version change pending. Closing connection.");
        if (dbPromise) {
          dbPromise.then(db => db.close());
          dbPromise = null;
        }
      },
      terminated() {
        console.error("[IDB] Database connection terminated.");
        dbPromise = null;
      }
    });
  }
  return dbPromise;
};

// --- Sessions Operations ---

export const getAllSessions = async (): Promise<Session[]> => {
  const db = await getDB();
  return db.getAll("sessions");
};

export const saveSession = async (session: Session): Promise<void> => {
  const db = await getDB();
  await db.put("sessions", session);
};

export const saveAllSessions = async (sessions: Session[]): Promise<void> => {
  const db = await getDB();
  const tx = db.transaction("sessions", "readwrite");
  await Promise.all(sessions.map((s) => tx.store.put(s)));
  await tx.done;
};

export const deleteSession = async (id: string): Promise<void> => {
  const db = await getDB();
  await db.delete("sessions", id);
};

// --- Messages Operations ---

export const getSessionMessages = async (
  sessionId: string,
): Promise<Message[]> => {
  const db = await getDB();
  const entry = await db.get("messages", sessionId);
  return entry ? entry.messages : [];
};

export const saveSessionMessages = async (
  sessionId: string,
  messages: Message[],
): Promise<void> => {
  const db = await getDB();
  await db.put("messages", { sessionId, messages });
};

export const deleteSessionMessages = async (
  sessionId: string,
): Promise<void> => {
  const db = await getDB();
  await db.delete("messages", sessionId);
};

// --- Snippets Operations ---

export const getAllSnippets = async (): Promise<Snippet[]> => {
  const db = await getDB();
  return db.getAll("snippets");
};

export const saveSnippet = async (snippet: Snippet): Promise<void> => {
  const db = await getDB();
  await db.put("snippets", snippet);
};

export const deleteSnippet = async (id: string): Promise<void> => {
  const db = await getDB();
  await db.delete("snippets", id);
};

// --- Librarian Cache Operations ---

export const getCachedFile = async (
  url: string,
): Promise<LibrarianCacheEntry | undefined> => {
  const db = await getDB();
  return db.get("librarian_cache", url);
};

export const cacheFile = async (
  url: string,
  content: string,
): Promise<void> => {
  const db = await getDB();
  await db.put("librarian_cache", {
    url,
    content,
    timestamp: Date.now(),
  });
};

export const pruneCache = async (ttlMs: number): Promise<void> => {
  const db = await getDB();
  const tx = db.transaction("librarian_cache", "readwrite");
  const store = tx.objectStore("librarian_cache");
  const now = Date.now();

  let cursor = await store.openCursor();

  while (cursor) {
    if (now - cursor.value.timestamp > ttlMs) {
      await cursor.delete();
    }
    cursor = await cursor.continue();
  }

  await tx.done;
};

// --- Manifest Operations ---

export const getManifest = async (
  framework: string,
  branch: string,
): Promise<FrameworkManifest | undefined> => {
  const db = await getDB();
  return db.get("manifests", `${framework}-${branch}`);
};

export const saveManifest = async (
  manifest: FrameworkManifest,
): Promise<void> => {
  const db = await getDB();
  // Ensure ID is set for v5 schema
  if (!manifest.id) {
    manifest.id = `${manifest.framework}-${manifest.branch}`;
  }
  await db.put("manifests", manifest);
};

// --- System Operations ---

export const clearDatabase = async (): Promise<void> => {
  const db = await getDB();
  await db.clear("sessions");
  await db.clear("messages");
  await db.clear("snippets");
  await db.clear("librarian_cache");
};
