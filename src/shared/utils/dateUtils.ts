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
 * Safely converts a value to a Date object.
 * Useful when retrieving dates from storage (IndexedDB/LocalStorage) which may return strings.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const safeDate = (val: any): Date => {
  if (val instanceof Date) return val;
  if (typeof val === "string" || typeof val === "number") {
    const d = new Date(val);
    // Check if date is valid
    return isNaN(d.getTime()) ? new Date() : d;
  }
  return new Date();
};
