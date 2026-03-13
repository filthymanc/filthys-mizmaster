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
  }, [code, language, wrap]);

  return (
    <div className={`relative group ${className}`}>
      <pre
        className={`!m-0 !p-5 !bg-transparent !text-sm font-mono leading-relaxed overflow-x-auto custom-scrollbar ${wrap ? "!whitespace-pre-wrap" : ""}`}
      >
        <code className={`language-${language}`}>{code}</code>
      </pre>

      {/* 
        Custom Prism Theme Overrides for "Mission Control" Aesthetic
        Injected via style tag to ensure specificity over Prism's defaults 
      */}
      <style>{`
        /* Token Colors - Theme Aware */
        code[class*="language-"],
        pre[class*="language-"] {
          color: oklch(var(--text-primary));
          text-shadow: none;
          font-family: "JetBrains Mono", monospace;
          direction: ltr;
          text-align: left;
          white-space: ${wrap ? "pre-wrap" : "pre"};
          word-spacing: normal;
          word-break: normal;
          line-height: 1.5;
          tab-size: 4;
          hyphens: none;
        }

        /* Comments - Muted via Tertiary Text Variable */
        .token.comment,
        .token.prolog,
        .token.doctype,
        .token.cdata {
          color: oklch(var(--text-tertiary));
          font-style: italic;
        }

        /* Punctuation - Muted via Secondary Text Variable */
        .token.punctuation {
          color: oklch(var(--text-secondary));
        }

        /* Properties / Attributes */
        .token.property,
        .token.tag,
        .token.boolean,
        .token.number,
        .token.constant,
        .token.symbol,
        .token.deleted {
          color: oklch(var(--color-status-danger)); /* danger - Remains vibrant */
        }

        /* Selectors / Strings */
        .token.selector,
        .token.attr-name,
        .token.string,
        .token.char,
        .token.builtin,
        .token.inserted {
          color: oklch(var(--color-status-ready)); /* ready - Matches default Brand */
        }

        /* Operators / Variables */
        .token.operator,
        .token.entity,
        .token.url,
        .language-css .token.string,
        .style .token.string {
          color: oklch(var(--text-secondary));
        }

        /* Functions / Keywords */
        .token.atrule,
        .token.attr-value,
        .token.keyword {
          color: oklch(var(--color-status-nav)); /* nav */
        }

        .token.function,
        .token.class-name {
          color: oklch(var(--color-status-gold)); /* gold */
        }

        .token.regex,
        .token.important,
        .token.variable {
          color: oklch(var(--color-status-alert)); /* alert */
        }
      `}</style>
    </div>
  );
};

export default SyntaxHighlighter;
