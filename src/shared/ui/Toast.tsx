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

import React, { useEffect, useState } from "react";
import { AlertIcon, CheckIcon, XIcon } from "./Icons";
import { registerToastListener, ToastEvent } from "../services/toastService";

export const ToastContainer: React.FC = () => {
  const [toasts, setToasts] = useState<(ToastEvent & { id: number })[]>([]);

  useEffect(() => {
    const handler = (event: ToastEvent) => {
      const id = Date.now();
      setToasts((prev) => [...prev, { ...event, id }]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 3000);
    };

    return registerToastListener(handler);
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-[60] flex flex-col gap-2 items-center w-full pointer-events-none">
      {toasts.map((t) => (
        <ToastItem key={t.id} {...t} onClose={() => setToasts((prev) => prev.filter((item) => item.id !== t.id))} />
      ))}
    </div>
  );
};

interface ToastItemProps extends ToastEvent {
  onClose: () => void;
}

const ToastItem: React.FC<ToastItemProps> = ({ message, type, onClose }) => {
  const bgColors = {
    success: "bg-app-brand/90 border-app-brand shadow-app-brand/20",
    error: "bg-red-600/90 border-red-500 shadow-red-900/20",
    info: "bg-app-surface/90 border-app-border shadow-app-overlay/20",
  };

  return (
    <div
      role="alert"
      className={`pointer-events-auto flex items-center gap-3 px-6 py-3 rounded-lg shadow-2xl backdrop-blur-sm border ${bgColors[type]} text-white animate-bounce`}
    >
      {type === "success" && <CheckIcon className="h-5 w-5" />}
      {type === "error" && <AlertIcon className="h-5 w-5" />}
      <span className="font-semibold text-sm">{message}</span>
      <button
        onClick={onClose}
        className="ml-2 opacity-70 hover:opacity-100"
        aria-label="Close Notification"
      >
        <XIcon className="h-4 w-4" />
      </button>
    </div>
  );
};

export default ToastItem;
