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
import { SendIcon } from "../../shared/ui/Icons";

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
  placeholder = "Instruct the Architect... (Ctrl+Enter to send)",
}) => {
  const [input, setInput] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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
  };

  // Mobile/Tablet Keyboard Fix
  // When the textarea receives focus on a touch device, standard browsers 
  // try to scroll it into view, but sometimes fail with flex layouts.
  // This forces the window to scroll down, ensuring the input is visible.
  const handleFocus = () => {
    setTimeout(() => {
      window.scrollTo({
        top: document.body.scrollHeight,
        behavior: 'smooth'
      });
    }, 300); // 300ms delay to allow the virtual keyboard to fully animate up
  };

  return (
    <div className="max-w-4xl mx-auto relative px-2 sm:px-0">
      <div 
        className={`
            relative w-full bg-app-surface border rounded-2xl shadow-2xl transition-all duration-500 overflow-hidden
            ${isDesanitized 
                ? "border-red-500/50 ring-1 ring-red-500/20 shadow-red-900/10" 
                : "border-app-border focus-within:ring-1 focus-within:ring-app-brand focus-within:border-app-brand shadow-black/40"
            }
        `}
      >
        {isDesanitized && (
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-red-500/50 to-transparent animate-pulse" />
        )}

        <textarea
          ref={textareaRef}
          id="chat-input"
          name="chat-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={handleFocus}
          placeholder={isDesanitized ? "UNSAFE MODE ACTIVE: Instruct with caution..." : placeholder}
          disabled={isGenerating}
          className="w-full bg-transparent border-none focus:ring-0 focus:outline-none resize-none pl-5 pr-16 py-4 lg:pr-14 lg:py-4 text-base lg:text-sm custom-scrollbar disabled:opacity-50 disabled:cursor-not-allowed overflow-y-auto"
          rows={1}
          style={{ minHeight: "56px", maxHeight: "200px" }}
        />

        <div className="absolute right-3 bottom-3 flex items-center gap-2">
          {isGenerating ? (
            <button
              onClick={onStop}
              className="p-3 lg:p-2.5 bg-red-500/10 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all active:scale-[0.95]"
              title="Stop Generation"
            >
              <div className="w-5 h-5 lg:w-4 lg:h-4 rounded-sm bg-current" />
            </button>
          ) : (
            <button
              onClick={handleSend}
              disabled={!input.trim()}
              className={`
                p-3 lg:p-2.5 rounded-xl transition-all shadow-lg active:scale-[0.95]
                ${input.trim() 
                    ? "bg-app-brand text-white shadow-app-brand/20 hover:bg-opacity-90" 
                    : "bg-app-highlight text-app-tertiary cursor-not-allowed shadow-none"}
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
