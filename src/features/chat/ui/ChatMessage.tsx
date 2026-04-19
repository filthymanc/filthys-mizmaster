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

import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Message } from "../../../core/types";
import CodeBlock from "./CodeBlock";
import {
  WarningIcon,
  RefreshIcon,
  CogIcon,
  ShieldIcon,
} from "../../../shared/ui/Icons";

interface ChatMessageProps {
  message: Message;
}

const cleanStreamedContent = (text: string, isStreaming?: boolean) => {
  if (!isStreaming || !text) return text;
  const backticks = (text.match(/```/g) || []).length;
  return backticks % 2 !== 0 ? text + "\n```" : text;
};

const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const isModel = message.role === "model";

  const getModelBadge = (model?: string, verifiedModel?: string) => {
    if (!model) return null;

    // If it's verified, show the checkmark and the model name
    if (verifiedModel) {
      return (
        <span className="ml-2 px-1.5 py-0.5 rounded border border-app-brand/30 text-[10px] font-mono text-app-brand font-bold bg-app-brand/10 flex items-center whitespace-nowrap gap-1">
          <svg
            className="w-3 h-3"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2.5}
              d="M5 13l4 4L19 7"
            />
          </svg>
          {model}
        </span>
      );
    }

    // Unverified fallback
    return (
      <span className="ml-2 px-1.5 py-0.5 rounded border border-app-brand/30 text-[10px] font-mono text-app-brand font-bold bg-app-brand/10 flex items-center whitespace-nowrap">
        {model}
      </span>
    );
  };

  const markdownComponents = React.useMemo(
    () => ({
      // Handle the wrapping of code blocks (handled by CodeBlock.tsx)
      pre: ({ children }: { children: React.ReactNode }) => <>{children}</>,
      code({
        inline,
        className,
        children,
        ...props
      }: {
        inline?: boolean;
        className?: string;
        children: React.ReactNode;
      }) {
        return (
          <CodeBlock inline={inline} className={className} {...props}>
            {children}
          </CodeBlock>
        );
      },

      /**
       * PARAGRAPHS
       * mb-4: Bottom margin between paragraphs.
       * last:mb-0: Removes margin from the very last paragraph to keep bubble tight.
       * leading-relaxed: Line spacing (Options: leading-tight, leading-normal, leading-loose).
       */
      p: ({ children }: { children: React.ReactNode }) => (
        <p className="mb-4 last:mb-0 leading-relaxed">{children}</p>
      ),

      /**
       * UNORDERED LISTS (Bullets)
       * list-disc: Bullet style.
       * pl-6: Indentation from the left.
       * mb-4: Space after the list ends.
       */
      ul: ({ children }: { children: React.ReactNode }) => (
        <ul className="list-disc pl-6 mb-4">{children}</ul>
      ),

      /**
       * ORDERED LISTS (Numbers)
       * list-decimal: Numbering style.
       * pl-6: Indentation from the left.
       * mb-4: Space after the list ends.
       */
      ol: ({ children }: { children: React.ReactNode }) => (
        <ol className="list-decimal pl-6 mb-4">{children}</ol>
      ),

      /**
       * LIST ITEMS
       * mb-1: Subtle spacing between individual items in a list.
       */
      li: ({ children }: { children: React.ReactNode }) => (
        <li className="mb-1">{children}</li>
      ),

      /**
       * HEADERS (h1, h2, h3)
       * text-xl/lg/base: Font size.
       * font-bold: Weight.
       * text-app-brand: Uses your accent color (Emerald/Cyan/etc).
       * mt-6/5/4: Top margin to separate from previous text.
       */
      h1: ({ children }: { children: React.ReactNode }) => (
        <h1 className="text-xl font-bold text-app-brand mt-6 mb-2">
          {children}
        </h1>
      ),
      h2: ({ children }: { children: React.ReactNode }) => (
        <h2 className="text-lg font-bold text-app-brand mt-5 mb-2">
          {children}
        </h2>
      ),
      h3: ({ children }: { children: React.ReactNode }) => (
        <h3 className="text-base font-bold text-app-brand mt-4 mb-2">
          {children}
        </h3>
      ),

      /**
       * BOLD TEXT
       * text-app-brand: Makes bold text pop using the theme's accent color.
       * Remove 'text-app-brand' to use standard white/gray text for bold.
       */
      strong: ({ children }: { children: React.ReactNode }) => (
        <strong className="font-bold text-app-brand">{children}</strong>
      ),

      /**
       * LINKS
       * text-app-brand: Link color.
       * hover:underline: Underline link on hover.
       */
      a: ({ children, href }: { children: React.ReactNode; href?: string }) => (
        <a
          data-testid="chat-message-link"
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="text-app-brand hover:underline underline-offset-4 decoration-2"
        >
          {children}
        </a>
      ),

      /**
       * QUOTES
       * border-l-4: Tactical vertical line on the left.
       * border-app-brand/30: Line color with 30% transparency.
       * pl-4: Padding between the line and the text.
       * italic: Slanted text style.
       */
      blockquote: ({ children }: { children: React.ReactNode }) => (
        <blockquote className="border-l-4 border-app-brand/30 pl-4 italic my-4 text-app-secondary">
          {children}
        </blockquote>
      ),
    }),
    [],
  );

  const renderErrorCard = () => {
    if (!message.errorType) return null;

    const errorConfig = {
      network: {
        color: "text-app-status-alert",
        bg: "bg-app-status-alert/10",
        border: "border-app-status-alert/30",
        icon: WarningIcon,
        label: "Communication Interrupted",
      },
      "rate-limit": {
        color: "text-app-status-gold",
        bg: "bg-app-status-gold/10",
        border: "border-app-status-gold/30",
        icon: CogIcon,
        label: "API Quota Exhausted",
      },
      auth: {
        color: "text-app-status-danger",
        bg: "bg-app-status-danger/10",
        border: "border-app-status-danger/30",
        icon: WarningIcon,
        label: "Authentication Failed",
      },
      timeout: {
        color: "text-app-status-alert",
        bg: "bg-app-status-alert/10",
        border: "border-app-status-alert/30",
        icon: WarningIcon,
        label: "Connection Timeout",
      },
      safety: {
        color: "text-app-status-intel",
        bg: "bg-app-status-intel/10",
        border: "border-app-status-intel/30",
        icon: ShieldIcon,
        label: "AI Safety Protocol",
      },
      generic: {
        color: "text-app-status-danger",
        bg: "bg-app-status-danger/10",
        border: "border-app-status-danger/30",
        icon: WarningIcon,
        label: "System Exception",
      },
    }[message.errorType || "generic"];

    const Icon = errorConfig.icon;

    return (
      <div
        className={`mt-4 p-4 rounded-xl border ${errorConfig.bg} ${errorConfig.border} animate-fadeIn`}
      >
        <div className="flex items-center gap-3 mb-2">
          <Icon className={`h-5 w-5 ${errorConfig.color}`} />
          <span
            className={`text-xs font-bold uppercase tracking-widest ${errorConfig.color}`}
          >
            {errorConfig.label}
          </span>
        </div>
        <p className="text-sm text-app-secondary leading-relaxed mb-4">
          {message.text.split("**").pop()?.trim() || message.text}
        </p>
        {message.retryAction && (
          <button
            onClick={message.retryAction}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-xs transition-all bg-app-canvas border ${errorConfig.border} ${errorConfig.color} hover:bg-app-surface shadow-sm`}
          >
            <RefreshIcon className="h-3.5 w-3.5" />
            RETRY MISSION REQUEST
          </button>
        )}
      </div>
    );
  };

  return (
    <div
      className={`flex w-full mb-6 ${isModel ? "justify-start" : "justify-end"}`}
    >
      <div
        className={`max-w-[95%] md:max-w-[85%] lg:max-w-[85%] rounded-2xl p-4 lg:p-5 shadow-lg select-text transition-colors duration-300 break-words overflow-hidden ${isModel ? "bg-app-surface border border-app-border text-app-primary" : "bg-app-brand text-app-canvas rounded-br-sm"}`}
      >
        <div className="flex flex-wrap items-center gap-2 mb-3 opacity-50 text-xs font-bold tracking-wider uppercase select-none">
          {isModel ? (
            <>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-app-brand animate-pulse"></span>
                DCS MizMaster
              </div>
              {getModelBadge(message.modelUsed, message.verifiedModel)}
            </>
          ) : (
            "Operator"
          )}
        </div>

        {/* Librarian Status Badge */}
        {isModel && message.librarianStatus && (
          <div className="mb-4 flex items-center gap-2 px-3 py-2 bg-app-canvas border border-app-border rounded-lg animate-pulse">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4 text-app-brand"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
              />
            </svg>
            <span className="text-xs font-mono font-bold text-app-brand">
              {message.librarianStatus}
            </span>
          </div>
        )}

        <div
          className={`text-sm md:text-base leading-relaxed ${!isModel ? "whitespace-pre-wrap" : ""}`}
        >
          {!message.errorType ? (
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={
                markdownComponents as React.ComponentProps<
                  typeof ReactMarkdown
                >["components"]
              }
            >
              {cleanStreamedContent(message.text, message.isStreaming)}
            </ReactMarkdown>
          ) : (
            renderErrorCard()
          )}
        </div>

        {isModel && message.sources && message.sources.length > 0 && (
          <div className="mt-4 pt-3 border-t border-app-border/50">
            <p className="text-[10px] uppercase text-app-tertiary font-bold mb-2 tracking-widest">
              Librarian Verified Sources
            </p>
            <div className="flex flex-wrap gap-2">
              {message.sources.map((source, idx) => (
                <a
                  key={idx}
                  id={`chat-msg-${message.id}-source-${idx}`}
                  data-testid="chat-msg-source"
                  href={source.uri}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-2 py-1 bg-app-canvas rounded border border-app-border hover:border-app-brand text-xs truncate max-w-[200px] text-app-secondary hover:border-app-brand transition-colors"
                >
                  <span className="truncate">
                    {source.title || new URL(source.uri).hostname}
                  </span>
                </a>
              ))}
            </div>
          </div>
        )}

        {isModel &&
          !message.isStreaming &&
          (message.tokenUsage || message.timingMs) && (
            <div className="mt-4 pt-2 border-t border-app-border/30 flex items-center justify-between text-[10px] text-app-tertiary font-mono select-none">
              <div className="flex gap-3">
                {message.tokenUsage && (
                  <span>Tokens: {message.tokenUsage.totalTokens}</span>
                )}
              </div>
              {message.timingMs && (
                <span>{(message.timingMs / 1000).toFixed(2)}s</span>
              )}
            </div>
          )}

        {isModel && message.isStreaming && !message.librarianStatus && (
          <div className="mt-2 flex gap-1 h-4 items-center">
            <span className="w-1.5 h-1.5 bg-app-brand/50 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
            <span className="w-1.5 h-1.5 bg-app-brand/50 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
            <span className="w-1.5 h-1.5 bg-app-brand/50 rounded-full animate-bounce"></span>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatMessage;
