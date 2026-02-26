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

import React, { useEffect } from "react";
import Prism from "prismjs";
import "prismjs/components/prism-lua";
import "prismjs/components/prism-json";
import "prismjs/components/prism-bash";

interface SyntaxHighlighterProps {
  code: string;
  language?: string;
  className?: string;
  wrap?: boolean;
}

const SyntaxHighlighter: React.FC<SyntaxHighlighterProps> = ({
  code,
  language = "lua",
  className = "",
  wrap = false,
}) => {
  useEffect(() => {
    Prism.highlightAll();
  }, [code, language]);

  return (
    <div className={`relative group ${className}`}>
      <pre 
        className={`!m-0 !p-4 !bg-transparent !text-sm font-mono leading-relaxed overflow-x-auto custom-scrollbar ${wrap ? '!whitespace-pre-wrap' : ''}`}
      >
        <code className={`language-${language}`}>{code}</code>
      </pre>

      {/* 
        Custom Prism Theme Overrides for "Mission Control" Aesthetic
        Injected via style tag to ensure specificity over Prism's defaults 
      */}
      <style>{`
        /* Token Colors - Optimized for Dark Mode */
        code[class*="language-"],
        pre[class*="language-"] {
          color: #e2e8f0; /* slate-200 */
          text-shadow: none;
          font-family: "JetBrains Mono", monospace;
          direction: ltr;
          text-align: left;
          white-space: ${wrap ? 'pre-wrap' : 'pre'};
          word-spacing: normal;
          word-break: normal;
          line-height: 1.5;
          tab-size: 4;
          hyphens: none;
        }

        /* Comments */
        .token.comment,
        .token.prolog,
        .token.doctype,
        .token.cdata {
          color: #64748b; /* slate-500 */
          font-style: italic;
        }

        /* Punctuation */
        .token.punctuation {
          color: #94a3b8; /* slate-400 */
        }

        /* Properties / Attributes */
        .token.property,
        .token.tag,
        .token.boolean,
        .token.number,
        .token.constant,
        .token.symbol,
        .token.deleted {
          color: #f472b6; /* pink-400 */
        }

        /* Selectors / Strings */
        .token.selector,
        .token.attr-name,
        .token.string,
        .token.char,
        .token.builtin,
        .token.inserted {
          color: #34d399; /* emerald-400 */
        }

        /* Operators / Variables */
        .token.operator,
        .token.entity,
        .token.url,
        .language-css .token.string,
        .style .token.string {
          color: #a78bfa; /* violet-400 */
        }

        /* Functions / Keywords */
        .token.atrule,
        .token.attr-value,
        .token.keyword {
          color: #60a5fa; /* blue-400 */
        }
        
        .token.function,
        .token.class-name {
          color: #fbbf24; /* amber-400 */
        }

        .token.regex,
        .token.important,
        .token.variable {
          color: #fb923c; /* orange-400 */
        }
      `}</style>
    </div>
  );
};

export default SyntaxHighlighter;
