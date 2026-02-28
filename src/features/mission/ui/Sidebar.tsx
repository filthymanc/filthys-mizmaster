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

import React, { useState, useMemo } from "react";
import { Session } from "../../../core/types";
import { SpinnerIcon, PlusIcon, XIcon } from "../../../shared/ui/Icons";
import SidebarSessionItem from "./SidebarSessionItem";
import SidebarFooter from "./SidebarFooter";
import { safeDate } from "../../../shared/utils/dateUtils";

interface SidebarProps {
  sessions: Session[];
  activeSessionId: string | null;
  onSelectSession: (id: string) => void;
  onCreateSession: () => string;
  onDeleteSession: (id: string) => void;
  onRenameSession: (id: string, newName: string) => void;
  isOpen: boolean;
  onClose: () => void;
  onOpenSettings: () => void;
  onOpenFieldManual: () => void;
  onOpenArmory: () => void;
  isLoading: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({
  sessions,
  activeSessionId,
  onSelectSession,
  onCreateSession,
  onDeleteSession,
  onRenameSession,
  isOpen,
  onClose,
  onOpenSettings,
  onOpenFieldManual,
  onOpenArmory,
  isLoading,
}) => {
  // Logic for List Management is still orchestrated here to ensure mutual exclusivity
  // (e.g., only one row can be edited or deleted at a time)
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const filteredSessions = useMemo(() => {
    if (!searchTerm) return sessions;
    const lowerTerm = searchTerm.toLowerCase();
    return sessions.filter(
        (s) => s.name.toLowerCase().includes(lowerTerm) || 
               safeDate(s.lastModified).toLocaleDateString().includes(lowerTerm)
    );
  }, [sessions, searchTerm]);

  const handleStartEdit = (id: string) => {
    setEditingId(id);
    setDeleteConfirmId(null);
  };

  const handleConfirmEdit = (id: string, newName: string) => {
    if (newName.trim()) {
      onRenameSession(id, newName.trim());
    }
    setEditingId(null);
  };

  const handleStartDelete = (id: string) => {
    setDeleteConfirmId(id);
    setEditingId(null);
  };

  return (
    <>
      {/* Mobile Overlay (Z-30) */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-app-overlay/60 z-30 lg:hidden backdrop-blur-sm"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar Container (Z-40) */}
      <aside
        className={`
          fixed lg:static top-0 left-0 z-40 h-[100dvh] w-72 pt-[env(safe-area-inset-top)]
          bg-app-frame border-r border-app-border flex flex-col select-none
          transition-transform duration-300 ease-in-out lg:translate-x-0 overflow-hidden
          ${isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        `}
      >
        {/* Header */}
        <div className="p-4 border-b border-app-border flex items-center justify-between shrink-0 h-16">
          <h2 className="font-bold text-app-primary tracking-widest text-sm">
            MISSIONS
          </h2>
          <button
            onClick={onClose}
            className="lg:hidden p-3 -mr-2 text-app-secondary hover:text-app-primary active:bg-app-surface/50 rounded-full"
            aria-label="Close Sidebar"
          >
            <XIcon className="h-6 w-6" />
          </button>
        </div>

        {/* New Mission Button */}
        <div className="p-4 pb-2 shrink-0 space-y-3">
          <button
            onClick={() => {
              if (!isLoading) {
                const newId = onCreateSession();
                setEditingId(newId);
                // We do NOT call onClose() here, so the user can see the edit input immediately
              }
            }}
            disabled={isLoading}
            className={`
                    w-full flex items-center justify-center gap-2 
                    py-3 rounded-lg font-bold text-sm transition-all shadow-lg 
                    active:scale-[0.98]
                    ${
                      isLoading
                        ? "bg-app-surface text-app-tertiary cursor-not-allowed shadow-none"
                        : "bg-app-brand hover:bg-opacity-90 text-white shadow-app-brand/20"
                    }
                `}
            aria-label="Create New Mission"
            aria-busy={isLoading}
          >
            {isLoading ? (
              <SpinnerIcon className="h-4 w-4 text-app-tertiary" />
            ) : (
              <PlusIcon className="h-4 w-4" />
            )}
            {isLoading ? "GENERATING..." : "NEW MISSION"}
          </button>

          {/* Search Input */}
          <div className="relative">
             <input 
                type="text" 
                placeholder="Find Mission..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-app-canvas border border-app-border rounded-lg px-3 py-2 pl-9 text-xs text-app-primary placeholder-app-tertiary focus:outline-none focus:border-app-brand focus:ring-1 focus:ring-app-brand transition-all"
             />
             <svg xmlns="http://www.w3.org/2000/svg" className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-app-tertiary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
             </svg>
             {searchTerm && (
                 <button 
                    onClick={() => setSearchTerm("")}
                    className="absolute right-2 top-2 text-app-tertiary hover:text-app-primary"
                 >
                     <XIcon className="h-4 w-4" />
                 </button>
             )}
          </div>
        </div>

        {/* Session List */}
        <div
          className={`flex-1 overflow-y-auto px-2 pb-4 space-y-1 custom-scrollbar transition-opacity duration-300 ${isLoading ? "opacity-40 pointer-events-none select-none" : "opacity-100"}`}
        >
          {filteredSessions.length === 0 && !isLoading ? (
              <div className="text-center py-8 opacity-50 text-xs font-mono tracking-widest text-app-tertiary">
                  NO MISSIONS FOUND
              </div>
          ) : (
            filteredSessions.map((session) => (
                <SidebarSessionItem
                key={session.id}
                session={session}
                isActive={activeSessionId === session.id}
                isEditing={editingId === session.id}
                isDeleteConfirming={deleteConfirmId === session.id}
                isLoading={isLoading}
                onSelect={(id) => {
                    onSelectSession(id);
                    onClose();
                }}
                onStartEdit={handleStartEdit}
                onConfirmEdit={handleConfirmEdit}
                onCancelEdit={() => setEditingId(null)}
                onStartDelete={handleStartDelete}
                onConfirmDelete={(id) => {
                    onDeleteSession(id);
                    setDeleteConfirmId(null);
                }}
                onCancelDelete={() => setDeleteConfirmId(null)}
                />
            ))
          )}
        </div>

        {/* Footer info & Actions */}
        <SidebarFooter
          onOpenSettings={onOpenSettings}
          onOpenFieldManual={onOpenFieldManual}
          onOpenArmory={onOpenArmory}
        />
      </aside>
    </>
  );
};

export default Sidebar;
