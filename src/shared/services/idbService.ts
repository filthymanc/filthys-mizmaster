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
}

const DB_NAME = "filthys-mizmaster-db";
const DB_VERSION = 2; // Incremented for Snippets

let dbPromise: Promise<IDBPDatabase<MissionArchitectDB>> | null = null;

const getDB = () => {
  if (!dbPromise) {
    dbPromise = openDB<MissionArchitectDB>(DB_NAME, DB_VERSION, {
      upgrade(db, oldVersion, _newVersion, _transaction) {
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
      },
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

export const deleteSessionMessages = async (sessionId: string): Promise<void> => {
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

// --- System Operations ---

export const clearDatabase = async (): Promise<void> => {
  const db = await getDB();
  await db.clear("sessions");
  await db.clear("messages");
  await db.clear("snippets");
};
