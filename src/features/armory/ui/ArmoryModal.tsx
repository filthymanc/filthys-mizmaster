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
import { useArmoryLibrary } from "../useArmory";
import { XIcon, TrashIcon } from "../../../shared/ui/Icons";
import SyntaxHighlighter from "../../../shared/ui/SyntaxHighlighter";
import { safeDate } from "../../../shared/utils/dateUtils";

interface ArmoryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ArmoryModal: React.FC<ArmoryModalProps> = ({ isOpen, onClose }) => {
  const { snippets, isLoading, removeSnippet } = useArmoryLibrary();
  const [search, setSearch] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const filteredSnippets = useMemo(() => {
    if (!search) return snippets;
    const lowerSearch = search.toLowerCase();
    return snippets.filter(
      (s) =>
        s.title.toLowerCase().includes(lowerSearch) ||
        s.language.toLowerCase().includes(lowerSearch) ||
        s.code.toLowerCase().includes(lowerSearch)
    );
  }, [snippets, search]);

  if (!isOpen) return null;

  const handleCopy = async (id: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error("Failed to copy", err);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-app-overlay/80 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-4xl h-[85vh] bg-app-frame border border-app-border rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-slideUp">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-app-border bg-app-surface/50">
          <div>
            <h2 className="text-xl font-bold tracking-widest text-app-primary flex items-center gap-3">
              THE ARMORY
              <span className="text-xs font-mono bg-app-brand/10 text-app-brand px-2 py-1 rounded border border-app-brand/20">
                SNIPPET LIBRARY
              </span>
            </h2>
            <p className="text-xs text-app-tertiary mt-1 font-mono uppercase tracking-wider">
              {snippets.length} TACTICAL ASSETS SECURED
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-app-tertiary hover:text-app-primary hover:bg-app-canvas rounded-full transition-colors"
          >
            <XIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-4 border-b border-app-border bg-app-canvas/30">
          <input
            type="text"
            placeholder="SEARCH ARMORY INTEL..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-app-surface border border-app-border rounded-xl px-4 py-3 text-sm text-app-primary placeholder-app-tertiary focus:outline-none focus:border-app-brand focus:ring-1 focus:ring-app-brand transition-all"
          />
        </div>

        {/* List Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-app-canvas">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-full text-app-tertiary animate-pulse gap-4">
              <div className="w-12 h-12 border-4 border-app-border border-t-app-brand rounded-full animate-spin"></div>
              <p className="font-mono text-xs tracking-widest">DECRYPTING ARCHIVES...</p>
            </div>
          ) : filteredSnippets.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-app-tertiary opacity-50">
              <p className="font-mono text-sm tracking-widest">NO INTEL FOUND</p>
            </div>
          ) : (
            filteredSnippets.map((snippet) => (
              <div
                key={snippet.id}
                className="group relative bg-app-surface border border-app-border rounded-xl overflow-hidden hover:border-app-brand/50 transition-colors shadow-sm hover:shadow-md"
              >
                {/* Snippet Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-app-border bg-app-frame/50">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-xs font-bold font-mono text-app-brand uppercase tracking-wider bg-app-brand/10 px-1.5 py-0.5 rounded border border-app-brand/20">
                      {snippet.language}
                    </span>
                    <h3 className="text-sm font-bold text-app-primary truncate">
                      {snippet.title}
                    </h3>
                  </div>
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleCopy(snippet.id, snippet.code)}
                      className="p-1.5 text-app-tertiary hover:text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition-colors"
                      title="Copy to Clipboard"
                    >
                      {copiedId === snippet.id ? (
                        <span className="text-xs font-bold text-emerald-500">COPIED</span>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      )}
                    </button>
                    <button
                      onClick={() => {
                        if (window.confirm("Delete this snippet permanently?")) {
                            removeSnippet(snippet.id);
                        }
                      }}
                      className="p-1.5 text-app-tertiary hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                      title="Delete Snippet"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Code Preview */}
                <div className="max-h-48 overflow-hidden relative">
                    <SyntaxHighlighter 
                        code={snippet.code} 
                        language={snippet.language} 
                        className="text-xs" 
                    />
                    {/* Fade Out Overlay */}
                    <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-app-surface to-transparent pointer-events-none" />
                </div>
                
                {/* Footer Metadata */}
                <div className="px-4 py-2 bg-app-canvas/30 border-t border-app-border text-[10px] text-app-tertiary font-mono flex justify-between">
                    <span>ID: {snippet.id.slice(0,8)}</span>
                    <span>{safeDate(snippet.createdAt).toLocaleDateString()} {safeDate(snippet.createdAt).toLocaleTimeString()}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default ArmoryModal;
