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

export type ToastType = "success" | "error" | "info";

export interface ToastEvent {
  message: string;
  type: ToastType;
}

export type ToastListener = (event: ToastEvent) => void;

const listeners: ToastListener[] = [];

export const toast = {
  success: (message: string) => emit({ message, type: "success" }),
  error: (message: string) => emit({ message, type: "error" }),
  info: (message: string) => emit({ message, type: "info" }),
};

const emit = (event: ToastEvent) => {
  listeners.forEach((listener) => listener(event));
};

export const registerToastListener = (listener: ToastListener) => {
  listeners.push(listener);
  return () => {
    const index = listeners.indexOf(listener);
    if (index > -1) listeners.splice(index, 1);
  };
};
