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

import React, { useState, useRef, useEffect } from "react";
import { SendIcon } from "../../../shared/ui/Icons";
import {
  useLibrarian,
  LibrarianSuggestion,
} from "../../librarian/useLibrarian";
import { useSettings } from "../../../core/useSettings";

interface ChatInputProps {
  onSend: (message: string) => void;
  onStop: () => void;
  isGenerating: boolean;
  isDesanitized?: boolean;
  placeholder?: string;
}

const ChatInput: React.FC<ChatInputProps> = ({
  onSend,
  onStop,
  isGenerating,
  isDesanitized = false,
  placeholder = "Instruct the MizMaster... (Ctrl+Enter to send)",
}) => {
  const [input, setInput] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  const { settings } = useSettings();
  const getBranchName = (target: string) => {
    switch (target) {
      case "LEGACY": return "master";
      case "DEVELOP": return "develop";
      case "STABLE":
      default: return "master-ng";
    }
  };
  const activeBranch = getBranchName(settings.targetMooseBranch);
  
  const { suggestions, isVisible } = useLibrarian(input, activeBranch);

  useEffect(() => {
    const handleStop = () => {
      if (isGenerating) {
        onStop();
      }
    };
    window.addEventListener("stop-generation", handleStop);
    return () => window.removeEventListener("stop-generation", handleStop);
  }, [isGenerating, onStop]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [input]);

  const handleSend = () => {
    if (!input.trim()) return;
    onSend(input);
    setInput("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && e.ctrlKey) {
      handleSend();
    }
    // Simple Tab completion for the first suggestion
    if (e.key === "Tab" && isVisible && suggestions.length > 0) {
      e.preventDefault();
      handleSuggestionClick(suggestions[0]);
    }
  };

  const handleSuggestionClick = (suggestion: LibrarianSuggestion) => {
    // 1. Precise Boundary Detection: Find the true active word regardless of trailing spaces
    const match = input.match(/([\w.:]+)\s*$/);
    const startIndex = match ? match.index! : input.length;

    // 2. Prepare Insertion Text
    const insertText = suggestion.label;
    // 3. Smart Path Replacement:
    // We replace from the start of the current word/path segment.
    let newInput = input.substring(0, startIndex) + insertText;

    // 4. Space Suppression for Namespaces (Classes and Enum Groups)
    // We don't add a space to allow users to immediately type a dot or colon.
    const isNamespace = 
      suggestion.type === "class" || 
      (suggestion.type === "enum" && (suggestion.description?.startsWith("Namespace:") || !suggestion.label.includes(".")));
    
    // Exception: If it's a "leaf" enum (uppercase constants like S_EVENT), it's a completion
    const isLeafEnum = suggestion.type === "enum" && /[A-Z_]{3,}/.test(suggestion.label.split(".").pop() || "");
    
    if (!isNamespace || isLeafEnum) {
      newInput += " ";
    }

    setInput(newInput);
    if (textareaRef.current) textareaRef.current.focus();
  };

  // Mobile/Tablet Keyboard Fix
  const handleFocus = () => {
    setTimeout(() => {
      window.scrollTo({
        top: document.body.scrollHeight,
        behavior: "smooth",
      });
    }, 300);
  };

  return (
    <div className="max-w-6xl mx-auto relative px-2 sm:px-0">
      {/* Librarian Intelligence Overlay */}
      {isVisible && !isGenerating && (
        <div className="absolute bottom-full left-0 mb-4 ml-4 flex flex-col gap-1 z-50 animate-scaleIn origin-bottom-left max-h-[60vh] overflow-y-auto custom-scrollbar pr-3 pb-2 transition-all">
          <div className="sticky top-0 bg-app-canvas/95 backdrop-blur-sm py-1 z-10 border-b border-app-border/30 mb-1">
            <div className="text-[10px] font-bold text-app-tertiary uppercase tracking-wider pl-1">
              Librarian Intelligence (v2.17.0)
            </div>
          </div>
          {suggestions.map((s, idx) => (
            <button
              key={idx}
              id={`chat-input-suggestion-${idx}`}
              data-testid={`chat-input-suggestion-${idx}`}
              onClick={() => handleSuggestionClick(s)}
              className="group flex items-center gap-3 bg-app-frame border border-app-border hover:border-app-brand px-3 py-2 rounded-lg shadow-lg hover:bg-app-surface transition-all text-left max-w-md"
            >
              <div
                className={`
                w-1.5 h-8 rounded-full shrink-0
                \${
                  s.type === "snippet"
                    ? "bg-app-brand"
                    : s.type === "enum"
                    ? "bg-app-status-alert"
                    : s.type === "attribute"
                    ? s.attrType === "trigger" ? "bg-app-status-danger" : s.attrType === "condition" ? "bg-app-status-alert" : "bg-app-status-nav"
                    : s.framework === "MOOSE"
                      ? "bg-app-status-intel"
                      : "bg-app-status-ready"
                }
              `}
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <div className="font-mono text-xs font-bold text-app-primary group-hover:text-app-brand transition-colors truncate">
                    {s.label}
                  </div>
                  {s.type === "attribute" && (
                    <span className={`
                      text-[9px] px-1 rounded uppercase font-bold border
                      ${
                        s.attrType === "trigger"
                          ? "border-app-status-danger text-app-status-danger bg-app-status-danger/10"
                          : s.attrType === "condition"
                            ? "border-app-status-alert text-app-status-alert bg-app-status-alert/10"
                            : "border-app-status-nav text-app-status-nav bg-app-status-nav/10"
                      }
                    `}>
                      {s.attrType}
                    </span>
                  )}
                  {s.type === "enum" && (
                    <span className="text-[9px] px-1 rounded uppercase font-bold border border-app-status-alert text-app-status-alert bg-app-status-alert/10">
                      ENUM
                    </span>
                  )}
                </div>
                <div className="text-[10px] text-app-tertiary truncate max-w-[300px]">
                  {s.description}
                </div>
              </div>
              {idx === 0 && (
                <div className="hidden sm:block ml-auto text-[9px] font-mono text-app-tertiary opacity-50 border border-app-border px-1 rounded">
                  TAB
                </div>
              )}
            </button>
          ))}
        </div>
      )}

      <div
        className={`
            relative w-full bg-app-surface border rounded-2xl shadow-2xl transition-all duration-500 overflow-hidden
            ${
              isDesanitized
                ? "border-app-status-danger/50 ring-1 ring-app-status-danger/20 shadow-app-status-danger/10"
                : "border-app-border focus-within:ring-1 focus-within:ring-app-brand focus-within:border-app-brand shadow-app-overlay/40"
            }
        `}
      >
        {isDesanitized && (
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-app-status-danger/50 to-transparent animate-pulse" />
        )}

        <textarea
          ref={textareaRef}
          id="chat-input-textarea"
          data-testid="chat-input-textarea"
          name="chat-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={handleFocus}
          placeholder={
            isDesanitized
              ? "Desanitised mode is active... (Ctrl+Enter to send)"
              : placeholder
          }
          disabled={isGenerating}
          className="w-full bg-transparent border-none focus:ring-0 focus:outline-none resize-none pl-5 pr-16 py-4 lg:pr-14 lg:py-4 text-base lg:text-sm custom-scrollbar disabled:opacity-50 disabled:cursor-not-allowed overflow-y-auto"
          rows={1}
          style={{ minHeight: "56px", maxHeight: "200px" }}
        />

        <div className="absolute right-3 bottom-3 flex items-center gap-2">
          {isGenerating ? (
            <button
              id="chat-input-stop"
              data-testid="chat-input-stop"
              onClick={onStop}
              className="p-3 lg:p-2.5 bg-app-status-danger/10 text-app-status-danger rounded-xl hover:bg-app-status-danger hover:text-app-canvas transition-all active:scale-[0.95]"
              title="Stop Generation"
            >
              <div className="w-5 h-5 lg:w-4 lg:h-4 rounded-sm bg-current" />
            </button>
          ) : (
            <button
              id="chat-input-send"
              data-testid="chat-input-send"
              onClick={handleSend}
              disabled={!input.trim()}
              className={`
                p-3 lg:p-2.5 rounded-xl transition-all shadow-lg active:scale-[0.95]
                ${
                  input.trim()
                    ? "bg-app-brand text-app-icon-contrast shadow-app-brand/20 hover:bg-opacity-90"
                    : "bg-app-highlight text-app-tertiary cursor-not-allowed shadow-none"
                }
              `}
            >
              <SendIcon className="h-5 w-5 lg:h-4 lg:w-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatInput;
