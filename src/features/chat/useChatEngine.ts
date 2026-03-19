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

import { useState, useRef, useEffect, useCallback } from "react";
import { Chat, GenerateContentResponse } from "@google/genai";
import {
  Message,
  ApiStatus,
  TokenUsage,
  Source,
  ModelType,
  MooseBranch,
} from "../../core/types";
import { startNewSession, sendMessageStream } from "../librarian/geminiService";
import { pruneHistoryByTokens } from "./tokenService";
import { logger } from "../../shared/utils/logger";

interface ChatEngineProps {
  apiKey: string;
  isVisitor?: boolean;
  model: ModelType;
  isDesanitized: boolean;
  targetMooseBranch: MooseBranch;
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
  isVisitor = false,
  model,
  isDesanitized,
  targetMooseBranch,
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
    mooseBranch: MooseBranch;
    sessionId: string | null;
    messageCount: number;
  } | null>(null);

  useEffect(() => {
    if (!apiKey || isHistoryLoading || isVisitor) {
      chatSessionRef.current = null;
      return;
    }

    const needsRefresh =
      !chatSessionRef.current ||
      sessionConfigRef.current?.model !== model ||
      sessionConfigRef.current?.safe !== isDesanitized ||
      sessionConfigRef.current?.mooseBranch !== targetMooseBranch ||
      sessionConfigRef.current?.sessionId !== sessionId ||
      Math.abs(
        (sessionConfigRef.current?.messageCount || 0) - messages.length,
      ) > 5;

    if (needsRefresh) {
      // Use the new token-aware pruning service
      const history = pruneHistoryByTokens(messages);
      try {
        chatSessionRef.current = startNewSession(
          apiKey,
          history,
          model,
          isDesanitized,
          targetMooseBranch,
        );
        sessionConfigRef.current = {
          model,
          safe: isDesanitized,
          mooseBranch: targetMooseBranch,
          sessionId,
          messageCount: messages.length,
        };
      } catch {
        setApiStatus("error");
      }
    }
  }, [
    apiKey,
    model,
    isDesanitized,
    targetMooseBranch,
    sessionId,
    isHistoryLoading,
    messages,
    isVisitor,
  ]);

  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim() || isLoading) return;
      if (!apiKey && !isVisitor) return;

      if (isVisitor) {
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
          text: "**VISITOR MODE ACTIVE**\n\nYou are currently exploring MizMaster in Visitor Mode. To fully utilize the neural engine and autonomous mission building capabilities, you must provide your own Gemini API Key.\n\n**Why do I need a key?**\nMizMaster is a client-side PWA that connects directly to Google's Gemini models. Using your own key ensures your data remains private and you benefit from your own API quotas.\n\n**How do I get one?**\n1. Visit [Google AI Studio](https://aistudio.google.com/app/apikey).\n2. Create a free API Key.\n3. Return here, Logout, and 'Start Secure Session' with your key.\n\nYour current session data will be saved locally in this browser.",
          timestamp: new Date(),
          isStreaming: false,
        };

        setMessages([...messages, userMessage, modelMessage]);
        if (onActivity) onActivity();
        return;
      }

      if (!navigator.onLine) {
        const offlineMsg: Message = {
          id: Date.now().toString(),
          role: "model",
          text: "**OFFLINE MODE:**\n\nI cannot contact the neural engine because your device is offline. Please check your internet connection.",
          timestamp: new Date(),
          isStreaming: false,
          errorType: "network",
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
          logger.warn("[ChatEngine] Connection timed out.");
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
            targetMooseBranch,
          );
        }

        const stream = await sendMessageStream(
          chatSessionRef.current,
          text,
          githubToken,
          isDesanitized,
          targetMooseBranch,
        );

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
            const module =
              call.functionCall.args?.["module_name"] || "Documentation";
            currentLibrarianStatus = `Librarian: Fetching ${module}...`;
          } else if (textContent && textContent.length > 5) {
            currentLibrarianStatus = "";
          }

          const verifiedModel = contentResponse.modelVersion;
          let tokenUsage: TokenUsage | undefined;
          if (contentResponse.usageMetadata) {
            tokenUsage = {
              promptTokens: contentResponse.usageMetadata.promptTokenCount || 0,
              responseTokens:
                contentResponse.usageMetadata.candidatesTokenCount || 0,
              totalTokens: contentResponse.usageMetadata.totalTokenCount || 0,
            };
          }

          const sourcesMap = new Map<string, string>();
          contentResponse.candidates?.[0]?.groundingMetadata?.groundingChunks?.forEach(
            (c: { web?: { uri?: string; title?: string } }) => {
              if (c.web?.uri && c.web?.title)
                sourcesMap.set(c.web.uri, c.web.title);
            },
          );
          const sources: Source[] = Array.from(sourcesMap.entries()).map(
            ([uri, title]) => ({ uri, title }),
          );

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

        // --- SILENT FAILURE DETECTION ---
        // If the stream ended but fullText is empty, it means the model failed to generate any visible text.
        // This can happen if safety filters triggered silently or if the context window was overwhelmed.
        if (!fullText.trim() && !controller.signal.aborted) {
          fullText =
            "**SYSTEM ERROR: SILENT FAILURE**\n\nThe neural engine finished the request but returned no text content. This often occurs if the context window is overwhelmed by large Librarian results or if the model's internal safety protocols blocked the final synthesis. Try rephrasing with a smaller scope.";
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
        logger.error(
          "[ChatEngine] Error:",
          error instanceof Error ? error.message : error,
        );

        let cleanError = "An unexpected system error occurred.";
        let errorType: Message["errorType"] = "generic";
        const errString = String(error);
        const isAbortError =
          typeof error === "object" &&
          error !== null &&
          "name" in error &&
          (error as Error).name === "AbortError";

        if (
          error === "CONNECTION_TIMEOUT" ||
          (isAbortError && controller.signal.reason === "CONNECTION_TIMEOUT")
        ) {
          cleanError =
            "**CONNECTION TIMEOUT**\n\nThe neural engine failed to respond within 30 seconds. This may be due to high server load or network congestion.";
          errorType = "timeout";
          setApiStatus("error");
        } else if (
          errString.includes("Failed to fetch") ||
          errString.includes("NetworkError")
        ) {
          cleanError =
            "**NETWORK ERROR**\n\nConnection lost during transmission. Please check your internet.";
          errorType = "network";
          setApiStatus("offline");
        } else if (
          errString.includes("429") ||
          errString.includes("Too Many Requests") ||
          errString.includes("quota")
        ) {
          cleanError =
            "**RATE LIMIT EXCEEDED**\n\nYou've reached the API quota for your current key. Please wait a moment or consider using a different model.";
          errorType = "rate-limit";
          setApiStatus("error");
        } else if (
          errString.includes("401") ||
          errString.includes("403") ||
          errString.includes("API_KEY_INVALID")
        ) {
          cleanError =
            "**AUTHENTICATION ERROR**\n\nYour Gemini API Key appears to be invalid or restricted. Please check your settings.";
          errorType = "auth";
          setApiStatus("error");
        } else if (errString.includes("SAFETY")) {
          cleanError =
            "**SAFETY RESTRICTION**\n\nThe AI model blocked this response due to its safety filters. Try rephrasing your request to focus on DCS mission logic.";
          errorType = "safety";
          setApiStatus("error");
        } else {
          const errorMsg =
            typeof error === "object" && error !== null && "message" in error
              ? (error as Error).message
              : errString;
          cleanError = "**SYSTEM ERROR**\n\n" + errorMsg;
          setApiStatus("error");
        }

        setMessages(
          newHistory.map((msg) =>
            msg.id === modelMessageId
              ? {
                  ...msg,
                  text: fullText + (fullText ? "\n\n" : "") + cleanError,
                  isStreaming: false,
                  errorType,
                  retryAction:
                    errorType !== "auth" ? () => sendMessage(text) : undefined,
                }
              : msg,
          ),
        );
      } finally {
        setIsLoading(false);
        if (abortControllerRef.current === controller) {
          abortControllerRef.current = null;
        }
      }
    },
    [
      apiKey,
      isVisitor,
      model,
      isDesanitized,
      targetMooseBranch,
      messages,
      setMessages,
      onActivity,
      apiStatus,
      githubToken,
      isLoading,
    ],
  );

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
