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

import { useState, useRef, useEffect } from "react";
import { Chat, GenerateContentResponse } from "@google/genai";
import {
  Message,
  ApiStatus,
  TokenUsage,
  Source,
  ModelType,
} from "../../core/types";
import { startNewSession, sendMessageStream } from "../librarian/geminiService";
import { pruneHistoryByTokens } from "./tokenService";

interface ChatEngineProps {
  apiKey: string;
  model: ModelType;
  isDesanitized: boolean;
  githubToken?: string;
  messages: Message[];
  setMessages: (msgs: Message[]) => void;
  sessionId: string | null;
  isHistoryLoading: boolean;
  onActivity?: () => void;
}

const CONNECTION_TIMEOUT_MS = 30000; // 30 seconds to establish connection

export const useChatEngine = ({
  apiKey,
  model,
  isDesanitized,
  githubToken,
  messages,
  setMessages,
  sessionId,
  isHistoryLoading,
  onActivity,
}: ChatEngineProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [apiStatus, setApiStatus] = useState<ApiStatus>("idle");

  const chatSessionRef = useRef<Chat | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const sessionConfigRef = useRef<{
    model: string;
    safe: boolean;
    sessionId: string | null;
    messageCount: number;
  } | null>(null);

  useEffect(() => {
    if (!apiKey || isHistoryLoading) {
      chatSessionRef.current = null;
      return;
    }

    const needsRefresh =
      !chatSessionRef.current ||
      sessionConfigRef.current?.model !== model ||
      sessionConfigRef.current?.safe !== isDesanitized ||
      sessionConfigRef.current?.sessionId !== sessionId ||
      Math.abs((sessionConfigRef.current?.messageCount || 0) - messages.length) > 5;

    if (needsRefresh) {
      // Use the new token-aware pruning service
      const history = pruneHistoryByTokens(messages);
      try {
        chatSessionRef.current = startNewSession(
          apiKey,
          history,
          model,
          isDesanitized,
        );
        sessionConfigRef.current = { 
            model, 
            safe: isDesanitized, 
            sessionId,
            messageCount: messages.length
        };
      } catch {
        setApiStatus("error");
      }
    }
  }, [apiKey, model, isDesanitized, sessionId, isHistoryLoading, messages]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || isLoading || !apiKey) return;

    if (!navigator.onLine) {
      const offlineMsg: Message = {
        id: Date.now().toString(),
        role: "model",
        text: "**OFFLINE MODE:**\n\nI cannot contact the neural engine because your device is offline. Please check your internet connection.",
        timestamp: new Date(),
        isStreaming: false,
      };
      const userMsg: Message = {
        id: (Date.now() - 1).toString(),
        role: "user",
        text,
        timestamp: new Date(),
      };
      setMessages([...messages, userMsg, offlineMsg]);
      return;
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      text,
      timestamp: new Date(),
    };
    const modelMessageId = (Date.now() + 1).toString();
    const modelMessage: Message = {
      id: modelMessageId,
      role: "model",
      text: "",
      timestamp: new Date(),
      isStreaming: true,
      modelUsed: model,
    };

    const newHistory = [...messages, userMessage, modelMessage];
    setMessages(newHistory);
    if (onActivity) onActivity();

    setIsLoading(true);
    setApiStatus("connecting");
    
    // Create new abort controller for this specific request
    const controller = new AbortController();
    abortControllerRef.current = controller;

    // Set a timeout for the initial connection phase
    const timeoutId = setTimeout(() => {
      if (apiStatus === "connecting") {
        console.warn("[ChatEngine] Connection timed out.");
        controller.abort("CONNECTION_TIMEOUT");
      }
    }, CONNECTION_TIMEOUT_MS);

    let fullText = "";
    const startTime = Date.now();
    let currentLibrarianStatus = "";

    try {
      if (!chatSessionRef.current) {
        // Use the new token-aware pruning service
        const history = pruneHistoryByTokens(messages);
        chatSessionRef.current = startNewSession(
          apiKey,
          history,
          model,
          isDesanitized,
        );
      }

      const stream = await sendMessageStream(chatSessionRef.current, text, githubToken);
      
      // Clear connection timeout as we have established communication
      clearTimeout(timeoutId);
      setApiStatus("streaming");

      for await (const chunk of stream) {
        if (controller.signal.aborted) break;

        const contentResponse = chunk as GenerateContentResponse;
        const parts = contentResponse.candidates?.[0]?.content?.parts || [];
        const textContent = parts
          .filter((p) => p.text)
          .map((p) => p.text)
          .join("");

        fullText += textContent;

        const call = parts.find((p) => p.functionCall);
        if (call?.functionCall) {
          const module = call.functionCall.args?.["module_name"] || "Documentation";
          currentLibrarianStatus = `Librarian: Fetching ${module}...`;
        } else if (textContent && textContent.length > 5) {
          currentLibrarianStatus = "";
        }

        const verifiedModel = contentResponse.modelVersion;
        let tokenUsage: TokenUsage | undefined;
        if (contentResponse.usageMetadata) {
          tokenUsage = {
            promptTokens: contentResponse.usageMetadata.promptTokenCount || 0,
            responseTokens: contentResponse.usageMetadata.candidatesTokenCount || 0,
            totalTokens: contentResponse.usageMetadata.totalTokenCount || 0,
          };
        }

        const sourcesMap = new Map<string, string>();
        contentResponse.candidates?.[0]?.groundingMetadata?.groundingChunks?.forEach(
          (c: { web?: { uri?: string; title?: string } }) => {
            if (c.web?.uri && c.web?.title) sourcesMap.set(c.web.uri, c.web.title);
          },
        );
        const sources: Source[] = Array.from(sourcesMap.entries()).map(([uri, title]) => ({ uri, title }));

        setMessages(
          newHistory.map((msg) =>
            msg.id === modelMessageId
              ? {
                  ...msg,
                  text: fullText,
                  sources: sources.length > 0 ? sources : undefined,
                  verifiedModel,
                  tokenUsage,
                  librarianStatus: currentLibrarianStatus || undefined,
                  timingMs: Date.now() - startTime,
                }
              : msg,
          ),
        );
      }

      setMessages(
        newHistory.map((msg) =>
          msg.id === modelMessageId
            ? {
                ...msg,
                text: fullText,
                isStreaming: false,
                librarianStatus: undefined,
                timingMs: Date.now() - startTime,
              }
            : msg,
        ),
      );
      setApiStatus("idle");
    } catch (error: unknown) {
      clearTimeout(timeoutId);
      console.error("[ChatEngine] Error:", error);

      let cleanError = "An unexpected system error occurred.";
      const errString = String(error);
      const isAbortError = typeof error === 'object' && error !== null && 'name' in error && (error as Error).name === "AbortError";

      if (error === "CONNECTION_TIMEOUT" || (isAbortError && controller.signal.reason === "CONNECTION_TIMEOUT")) {
          cleanError = "**CONNECTION TIMEOUT**\n\nThe neural engine failed to respond within 30 seconds. This may be due to high server load or network congestion. Please try again.";
          setApiStatus("error");
      } else if (
        errString.includes("Failed to fetch") ||
        errString.includes("NetworkError")
      ) {
        cleanError = "**NETWORK ERROR**\n\nConnection lost during transmission. Please check your internet.";
        setApiStatus("offline");
      } else {
        const errorMsg = typeof error === 'object' && error !== null && 'message' in error ? (error as Error).message : errString;
        cleanError = "**SYSTEM ERROR**\n\n" + errorMsg;
        setApiStatus("error");
      }

      setMessages(
        newHistory.map((msg) =>
          msg.id === modelMessageId
            ? { ...msg, text: fullText + (fullText ? "\n\n" : "") + cleanError, isStreaming: false }
            : msg,
        ),
      );
    } finally {
      setIsLoading(false);
      if (abortControllerRef.current === controller) {
        abortControllerRef.current = null;
      }
    }
  };

  const stopGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort("USER_ABORTED");
      setMessages(
        messages.map((msg) =>
          msg.isStreaming
            ? {
                ...msg,
                isStreaming: false,
                text: msg.text + "\n\n**[GENERATION ABORTED]**",
              }
            : msg,
        ),
      );
    }
  };

  return { sendMessage, stopGeneration, isLoading, apiStatus };
};
