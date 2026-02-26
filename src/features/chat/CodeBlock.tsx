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
import { toast } from "../../shared/services/toastService";
import SyntaxHighlighter from "../../shared/ui/SyntaxHighlighter";

interface CodeBlockProps {
  className?: string;
  children?: React.ReactNode;
  inline?: boolean;
}

const PROHIBITED_LUA_LIBS = ["os.", "io.", "lfs.", "require", "package.", "debug."];

const CodeBlock: React.FC<CodeBlockProps> = ({
  className,
  children,
  inline,
}) => {
  const [copied, setCopied] = useState(false);
  const [isSoftWrap, setIsSoftWrap] = useState(false);

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

  // Pre-Flight Validation Logic
  const validation = useMemo(() => {
    if (language !== "lua") return { safe: true, reasons: [] };
    const violations = PROHIBITED_LUA_LIBS.filter(lib => codeText.toLowerCase().includes(lib.toLowerCase()));
    return {
      safe: violations.length === 0,
      reasons: violations
    };
  }, [codeText, language]);

  const isInline = inline || (!match && !codeText.includes("\n") && codeText.length < 100);

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

  if (isInline) {
    return (
      <code className="text-app-brand font-bold font-mono text-[calc(1em-1px)] bg-app-highlight/30 px-1 rounded">
        {codeText || children}
      </code>
    );
  }

  if (!codeText) return null;

  return (
    <div className="my-4 rounded-xl overflow-hidden border border-app-border bg-app-frame shadow-xl not-prose">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-app-canvas/50 border-b border-app-border backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-mono text-app-tertiary uppercase tracking-[0.2em] font-bold">
            {language}
          </span>
          {language === "lua" && (
            <div 
                className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${validation.safe ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}
                title={validation.safe ? "Code uses standard DCS sandbox libraries" : `Restricted Libraries Detected: ${validation.reasons.join(', ')}`}
            >
                <div className={`w-1.5 h-1.5 rounded-full ${validation.safe ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
                {validation.safe ? "DCS COMPLIANT" : "RESTRICTED"}
            </div>
          )}
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setIsSoftWrap(!isSoftWrap)}
            className={`p-2 rounded-lg transition-colors ${isSoftWrap ? 'bg-app-brand/20 text-app-brand' : 'text-app-tertiary hover:text-app-primary hover:bg-app-surface'}`}
            title="Toggle Soft Wrap"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h10M4 18h16" />
            </svg>
          </button>
          <button
            onClick={handleDownload}
            className="p-2 text-app-tertiary hover:text-app-primary hover:bg-app-surface rounded-lg transition-colors"
            title="Download Script"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
          </button>
          <button
            onClick={handleCopy}
            className="p-2 text-app-tertiary hover:text-app-primary hover:bg-app-surface rounded-lg transition-colors"
            title="Copy Code"
          >
            {copied ? (
               <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-emerald-500" viewBox="0 0 20 20" fill="currentColor">
               <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
             </svg>
            ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
            )}
          </button>
        </div>
      </div>

      {/* Code Body - Now using PrismJS Highlighting */}
      <SyntaxHighlighter 
        code={codeText} 
        language={language}
        wrap={isSoftWrap}
      />
    </div>
  );
};

export default CodeBlock;
