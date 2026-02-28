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
import { toast } from "../../../shared/services/toastService";
import SyntaxHighlighter from "../../../shared/ui/SyntaxHighlighter";
import { useSnippetSaver } from "../../armory/useArmory";
import { validateLuaSyntax } from "../../librarian/luaParserService";

interface CodeBlockProps {
  className?: string;
  children?: React.ReactNode;
  inline?: boolean;
}

const CodeBlock: React.FC<CodeBlockProps> = ({
  className,
  children,
  inline,
}) => {
  const [copied, setCopied] = useState(false);
  const [isSoftWrap, setIsSoftWrap] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [saveTitle, setSaveTitle] = useState("");

  const { saveToArmory } = useSnippetSaver();

  // Extract language from className (format: "language-lua")
  const match = /language-(\w+)/.exec(className || "");
  const language = match ? match[1] : "lua";

  // Robustly extract text from children
  const extractText = (source: React.ReactNode): string => {
    if (typeof source === "string") return source;
    if (typeof source === "number") return String(source);
    if (Array.isArray(source)) return source.map(extractText).join("");
    if (React.isValidElement(source) && source.props) {
      // @ts-expect-error: accessing children on generic props
      return extractText(source.props.children);
    }
    return "";
  };

  const codeText = extractText(children).replace(/\n$/, "");

  // Real-Time Syntax Validation Logic
  const validation = useMemo(() => {
    if (language !== "lua") return { safe: true, message: "" };
    
    const result = validateLuaSyntax(codeText);

    if (result.isValid) {
      return { safe: true, message: "DCS COMPLIANT" };
    } else {
      return { 
        safe: false, 
        message: result.error || "SYNTAX ERROR" 
      };
    }
  }, [codeText, language]);

  const isInline =
    inline || (!match && !codeText.includes("\n") && codeText.length < 100);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(codeText);
      setCopied(true);
      toast.success("Code copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy text: ", err);
      toast.error("Failed to copy code");
    }
  };

  const handleDownload = () => {
    const blob = new Blob([codeText], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const ext = language === "lua" ? "lua" : "txt";
    a.download = `mission_script_${Date.now()}.${ext}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.info(`Script saved as .${ext}`);
  };

  const handleSaveToArmory = () => {
    if (!saveTitle) {
      setSaveTitle(`Snippet ${new Date().toLocaleTimeString()}`);
    }
    setShowSaveDialog(true);
  };

  const confirmSave = async () => {
    const success = await saveToArmory(codeText, language, saveTitle);
    if (success) {
      setShowSaveDialog(false);
      setSaveTitle("");
    }
  };

  if (isInline) {
    return (
      <code className="text-app-brand font-bold font-mono text-[calc(1em-1px)] bg-app-highlight/30 px-1 rounded">
        {codeText || children}
      </code>
    );
  }

  if (!codeText) return null;

  // Main Render (Normal or Expanded)
  const renderContent = (isModal: boolean) => (
    <div
      className={`
            relative rounded-xl overflow-hidden border border-app-border bg-app-frame shadow-xl not-prose
            ${isModal ? "fixed inset-4 z-[100] flex flex-col m-0 max-h-none animate-scaleIn" : "my-4"}
        `}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-app-canvas/50 border-b border-app-border backdrop-blur-sm shrink-0">
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-mono text-app-tertiary uppercase tracking-[0.2em] font-bold">
            {language}
          </span>
          {language === "lua" && (
            <div
              className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                validation.safe
                  ? "bg-emerald-500/10 text-emerald-500"
                  : "bg-red-500/10 text-red-500"
              }`}
              title={validation.message}
            >
              <div
                className={`w-1.5 h-1.5 rounded-full ${
                  validation.safe ? "bg-emerald-500 animate-pulse" : "bg-red-500"
                }`}
              />
              {validation.message}
            </div>
          )}
        </div>

        <div className="flex items-center gap-1">
          {/* Save Button */}
          <button
            onClick={handleSaveToArmory}
            className="p-2 text-app-tertiary hover:text-amber-400 hover:bg-amber-500/10 rounded-lg transition-colors"
            title="Save to Armory"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
              />
            </svg>
          </button>

          {/* Wrap Toggle */}
          <button
            onClick={() => setIsSoftWrap(!isSoftWrap)}
            className={`p-2 rounded-lg transition-colors ${
              isSoftWrap
                ? "bg-app-brand/20 text-app-brand"
                : "text-app-tertiary hover:text-app-primary hover:bg-app-surface"
            }`}
            title="Toggle Soft Wrap"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h10M4 18h16"
              />
            </svg>
          </button>

          {/* Expand/Collapse */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-2 text-app-tertiary hover:text-app-primary hover:bg-app-surface rounded-lg transition-colors"
            title={isModal ? "Collapse View" : "Expand View"}
          >
            {isModal ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"
                />
              </svg>
            )}
          </button>

          {/* Download */}
          <button
            onClick={handleDownload}
            className="p-2 text-app-tertiary hover:text-app-primary hover:bg-app-surface rounded-lg transition-colors"
            title="Download Script"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
              />
            </svg>
          </button>

          {/* Copy */}
          <button
            onClick={handleCopy}
            className="p-2 text-app-tertiary hover:text-app-primary hover:bg-app-surface rounded-lg transition-colors"
            title="Copy Code"
          >
            {copied ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4 text-emerald-500"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Code Body */}
      <div className={`overflow-auto custom-scrollbar ${isModal ? "flex-1" : "max-h-[500px]"}`}>
        <SyntaxHighlighter
          code={codeText}
          language={language}
          wrap={isSoftWrap}
          className="h-full"
        />
      </div>

      {/* Save Modal (Internal) */}
      {showSaveDialog && (
        <div className="absolute inset-0 z-[110] bg-app-overlay/90 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
            <div className="w-full max-w-sm bg-app-frame border border-app-border rounded-xl shadow-2xl p-4 space-y-4 animate-scaleIn">
                <h3 className="text-sm font-bold text-app-primary uppercase tracking-wider">Save to Armory</h3>
                <input 
                    type="text" 
                    value={saveTitle}
                    onChange={(e) => setSaveTitle(e.target.value)}
                    placeholder="Snippet Name..."
                    className="w-full bg-app-surface border border-app-border rounded px-3 py-2 text-sm text-app-primary focus:outline-none focus:border-app-brand"
                    autoFocus
                />
                <div className="flex gap-2 justify-end">
                    <button 
                        onClick={() => setShowSaveDialog(false)}
                        className="px-3 py-1.5 text-xs font-bold text-app-tertiary hover:text-app-primary transition-colors"
                    >
                        CANCEL
                    </button>
                    <button 
                        onClick={confirmSave}
                        disabled={!saveTitle.trim()}
                        className="px-3 py-1.5 bg-app-brand text-white text-xs font-bold rounded hover:bg-opacity-90 transition-colors disabled:opacity-50"
                    >
                        CONFIRM SAVE
                    </button>
                </div>
            </div>
        </div>
      )}
    </div>
  );

  return (
    <>
      {renderContent(false)}
      {isExpanded && (
        <div className="fixed inset-0 z-[90] bg-app-overlay/80 backdrop-blur-md flex items-center justify-center animate-fadeIn">
          {renderContent(true)}
        </div>
      )}
    </>
  );
};

export default CodeBlock;
