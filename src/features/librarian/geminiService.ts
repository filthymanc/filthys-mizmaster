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

import {
  GoogleGenAI,
  Chat,
  GenerateContentResponse,
  Content,
  Type,
  FunctionDeclaration,
  Tool,
  HarmCategory,
  HarmBlockThreshold,
  Part,
  FunctionCall,
} from "@google/genai";
import { SYSTEM_INSTRUCTION } from "../../core/systemInstruction";
import { DEFAULT_MODEL_ID } from "../../core/constants";
import { Message, ModelType, MooseBranch } from "../../core/types";
import { getFrameworkDocs } from "./githubService";
import { SSE_DEFINITIONS } from "../../data/sse-definitions";
import { logger } from "../../shared/utils/logger";
import { getManifest } from "../../shared/services/idbService";

// --- Type Definitions for Tool Arguments ---

interface FrameworkDocsArgs {
  framework: "MOOSE" | "DML";
  module_name: string;
  branch?: "STABLE" | "DEVELOP" | "LEGACY";
}

interface SseDocsArgs {
  category: string;
}

// -------------------------------------------

const mapMessagesToHistory = (messages: Message[]): Content[] => {
  return messages
    .filter((msg) => !msg.isStreaming && msg.text && msg.text.trim().length > 0)
    .map((msg) => ({
      role: msg.role,
      parts: [{ text: msg.text }],
    }));
};

const getApiSummaryTool = (
  targetMooseBranch: MooseBranch,
): FunctionDeclaration => ({
  name: "get_api_summary",
  description: `Fetches a lightweight summary of a MOOSE or DML class/module from the local framework manifest. Returns class descriptions, parent classes, method signatures, parameter lists, and attributes. NOTE: You are restricted to the '${targetMooseBranch}' branch for MOOSE, unless checking for retired classes in the 'LEGACY' branch. Use this as your first step for syntax checks and structural research to save tokens.`,
  parameters: {
    type: Type.OBJECT,
    properties: {
      framework: {
        type: Type.STRING,
        description: "Framework name ('MOOSE' or 'DML').",
        enum: ["MOOSE", "DML"],
      },
      module_name: {
        type: Type.STRING,
        description:
          "Name of the class or enum to search for (e.g., 'SPAWN', 'Group.Category').",
      },
      branch: {
        type: Type.STRING,
        description: `Required for MOOSE. Choose the branch matching your authorized configuration: '${targetMooseBranch}'.`,
        enum: ["STABLE", "DEVELOP", "LEGACY"],
      },
    },
    required: ["framework", "module_name"],
  },
});

const getFrameworkDocsTool = (
  targetMooseBranch: MooseBranch,
): FunctionDeclaration => ({
  name: "get_framework_docs",
  description: `Fetches RAW LUA SOURCE CODE from the official GitHub repositories (MOOSE or DML). Use this to analyze function definitions and header comments directly. NOTE: You are restricted to the '${targetMooseBranch}' branch for MOOSE, unless checking for retired classes in the 'LEGACY' branch.`,
  parameters: {
    type: Type.OBJECT,
    properties: {
      framework: {
        type: Type.STRING,
        description: "Framework name ('MOOSE' or 'DML').",
        enum: ["MOOSE", "DML"],
      },
      module_name: {
        type: Type.STRING,
        description:
          "Name of the module/class to search for (e.g., 'Airboss', 'cloneZones'). The system performs a fuzzy search on the file tree.",
      },
      branch: {
        type: Type.STRING,
        description: `Required for MOOSE. Choose the branch matching your authorized configuration: '${targetMooseBranch}'.`,
        enum: ["STABLE", "DEVELOP", "LEGACY"],
      },
    },
    required: ["framework", "module_name"],
  },
});

const sseDocsTool: FunctionDeclaration = {
  name: "get_sse_docs",
  description:
    "Fetches the Safe Standard Scripting Engine (SSE) Hard Deck Definitions. Use this when the user needs to use standard DCS classes like Group, Unit, Timer, or Trigger. Do not rely on training data for these classes.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      category: {
        type: Type.STRING,
        description: "The SSE Class category to retrieve.",
        enum: ["Group", "Unit", "trigger", "timer", "coalition", "All"],
      },
    },
    required: ["category"],
  },
};

/**
 * Validates the API key with a 10-second timeout.
 * Throws specific errors for better reporting.
 */
export const validateApiKey = async (apiKey: string): Promise<boolean> => {
  const ai = new GoogleGenAI({ apiKey });

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);

  try {
    await ai.models.generateContent({
      model: DEFAULT_MODEL_ID,
      contents: [{ parts: [{ text: "ping" }] }],
      config: { abortSignal: controller.signal },
    });

    clearTimeout(timeoutId);
    return true;
  } catch (error: unknown) {
    clearTimeout(timeoutId);
    const err = error as Error;
    logger.warn("API Validation failed or timed out:", err.message);

    // Attempt to detect invalid key vs network
    const msg = err.message.toLowerCase();
    if (
      msg.includes("api_key_invalid") ||
      msg.includes("invalid api key") ||
      msg.includes("400")
    ) {
      throw new Error("INVALID_KEY");
    }
    if (err.name === "AbortError" || msg.includes("timeout")) {
      throw new Error("TIMEOUT");
    }

    return false;
  }
};

export const startNewSession = (
  apiKey: string,
  historyMessages: Message[],
  model: ModelType = DEFAULT_MODEL_ID,
  isDesanitized: boolean = false,
  targetMooseBranch: MooseBranch = "STABLE",
): Chat => {
  const ai = new GoogleGenAI({ apiKey });
  const formattedHistory = mapMessagesToHistory(historyMessages);

  const envStatus = isDesanitized
    ? "ENVIRONMENT STATUS: DESANITIZED (DEV MODE ACTIVE)."
    : "ENVIRONMENT STATUS: SANITIZED (STANDARD MODE).";

  const effectiveSystemInstruction = `${SYSTEM_INSTRUCTION}

[SYSTEM CONFIGURATION]
CURRENT_MODEL_ID: ${model}
TARGET_MOOSE_BRANCH: ${targetMooseBranch}
${envStatus}`;

  const tools: Tool[] = [
    {
      functionDeclarations: [
        getApiSummaryTool(targetMooseBranch),
        getFrameworkDocsTool(targetMooseBranch),
        sseDocsTool,
      ],
    },
  ];

  return ai.chats.create({
    model: model,
    history: formattedHistory,
    config: {
      systemInstruction: effectiveSystemInstruction,
      temperature: 0.1,
      tools: tools,
      safetySettings: [
        {
          category: HarmCategory.HARM_CATEGORY_HARASSMENT,
          threshold: HarmBlockThreshold.BLOCK_NONE,
        },
        {
          category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
          threshold: HarmBlockThreshold.BLOCK_NONE,
        },
        {
          category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
          threshold: HarmBlockThreshold.BLOCK_NONE,
        },
        {
          category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
          threshold: HarmBlockThreshold.BLOCK_NONE,
        },
      ],
    },
  });
};

/**
 * Recursive Generator for Multi-Turn Tool Execution
 */
export async function* sendMessageStream(
  chatSession: Chat | null,
  message: string | Part[],
  githubToken?: string,
  isDesanitized: boolean = false, // Security context
  targetMooseBranch: MooseBranch = "STABLE",
): AsyncGenerator<GenerateContentResponse, void, unknown> {
  if (!chatSession) throw new Error("CHAT_NOT_INITIALIZED");

  let currentTurnMessage: string | Part[] = message;
  let turnCount = 0;
  const maxTurns = 10; // Increased from 5 to support complex multi-module queries

  const toolCallHistory = new Set<string>();

  while (turnCount < maxTurns) {
    turnCount++;

    let stream;
    try {
      stream = await chatSession.sendMessageStream({
        message: currentTurnMessage,
      });
    } catch (e: unknown) {
      logger.error(
        "Gemini API Stream Error:",
        e instanceof Error ? e.message : e,
      );

      let errorHint = "";
      const errStr = String(e);
      let detailedError = (e as Error).message || errStr;
      try {
        if ((e as Error).message && (e as Error).message.startsWith("{")) {
          const parsed = JSON.parse((e as Error).message);
          if (parsed.error && parsed.error.message) {
            detailedError = parsed.error.message;
          }
        }
      } catch {
        // ignore parsing error
      }

      if (errStr.includes("400") || errStr.includes("INVALID_ARGUMENT")) {
        errorHint = "The documentation might be too large (Payload Limit).";
      } else if (errStr.includes("413")) {
        errorHint = "The request payload was too large (413).";
      } else if (errStr.includes("429")) {
        errorHint = "You are sending requests too fast (Rate Limit).";
      } else if (errStr.includes("503")) {
        errorHint = "The AI model is currently overloaded.";
      }

      const errorMessage =
        `**LIBRARIAN ERROR:** The Librarian crashed while fetching data.\n\n` +
        `**Details:** ${detailedError}\n` +
        `**Hint:** ${errorHint || "Check your API connection."}`;

      const errorResponse: GenerateContentResponse = {
        candidates: [
          {
            content: {
              parts: [{ text: errorMessage }],
              role: "model",
            },
          },
        ],
        text: errorMessage,
        data: undefined,
        functionCalls: undefined,
        executableCode: undefined,
        codeExecutionResult: undefined,
      } as unknown as GenerateContentResponse;

      yield errorResponse;

      return;
    }

    const toolCalls: FunctionCall[] = [];

    for await (const chunk of stream) {
      yield chunk;

      // Aggregation Fix: Accumulate all function calls from the stream instead of overwriting with the last chunk.
      const calls = chunk.candidates?.[0]?.content?.parts
        ?.filter((p) => p.functionCall)
        .map((p) => p.functionCall as FunctionCall);

      if (calls && calls.length > 0) {
        toolCalls.push(...calls);
      }

      // Usage Transparency: Log metadata if provided in the chunk
      if (chunk.usageMetadata) {
        logger.info(
          `[Librarian] Turn ${turnCount} Usage: Prompt Tokens: ${chunk.usageMetadata.promptTokenCount}, Candidates: ${chunk.usageMetadata.candidatesTokenCount}, Total: ${chunk.usageMetadata.totalTokenCount}`,
        );
      }
    }

    if (toolCalls.length > 0) {
      // If we hit the turn limit but still have pending tool calls, it means the model is likely looping or needs too much data.
      if (turnCount >= maxTurns) {
        const timeoutMessage =
          `**LIBRARIAN TIMEOUT:** The model exceeded the maximum number of research steps (${maxTurns}).\n\n` +
          `This usually happens when a request is too broad (e.g., asking for multiple large frameworks at once). Try asking for a single module or feature first.`;

        const timeoutResponse: GenerateContentResponse = {
          candidates: [
            {
              content: {
                parts: [{ text: timeoutMessage }],
                role: "model",
              },
            },
          ],
          text: timeoutMessage,
        } as unknown as GenerateContentResponse;

        yield timeoutResponse;
        return;
      }

      logger.info(
        `[Librarian] executing ${toolCalls.length} tools in PARALLEL. Turn: ${turnCount}`,
      );

      // POWER TOOL UPGRADE: Execute all tool calls in parallel using Promise.all
      const responseParts = await Promise.all(
        toolCalls.map(async (call) => {
          let result = "";

          // HANDLER: API Summary (Phase 2)
          if (call.name === "get_api_summary") {
            const args = call.args as unknown as FrameworkDocsArgs;
            const { framework, module_name, branch } = args;

            const fwKey = framework.toUpperCase();
            // Branch mapping: For MOOSE, use provided branch or fallback to setting. For DML, force 'main'.
            let branchKey =
              branch || (fwKey === "MOOSE" ? targetMooseBranch : "main");
            if (fwKey === "DML") branchKey = "main";

            // Translate logical branch keys (STABLE/DEVELOP/LEGACY) to git branch names
            // that match how manifests are keyed in IDB by useLibrarian (MOOSE-master-ng, etc.)
            const mooseBranchMap: Record<string, string> = {
              STABLE: "master-ng",
              DEVELOP: "develop",
              LEGACY: "master",
            };
            if (fwKey === "MOOSE" && mooseBranchMap[branchKey]) {
              branchKey = mooseBranchMap[branchKey];
            }

            const fingerprint =
              `SUMMARY:${fwKey}:${module_name}:${branchKey}`.toUpperCase();

            if (toolCallHistory.has(fingerprint)) {
              result = `REFERENCE NOTICE: API Summary for '${module_name}' was already provided.`;
            } else {
              toolCallHistory.add(fingerprint);
              try {
                const manifest = await getManifest(fwKey, branchKey);
                if (manifest) {
                  // Case-insensitive lookup for Class
                  const className = Object.keys(manifest.classes).find(
                    (k) => k.toLowerCase() === module_name.toLowerCase(),
                  );
                  // Case-insensitive lookup for Enum
                  const enumName = Object.keys(manifest.enums).find(
                    (k) => k.toLowerCase() === module_name.toLowerCase(),
                  );

                  if (className) {
                    result = JSON.stringify(
                      {
                        type: "class",
                        name: className,
                        ...manifest.classes[className],
                      },
                      null,
                      2,
                    );
                  } else if (enumName) {
                    result = JSON.stringify(
                      {
                        type: "enum",
                        name: enumName,
                        ...manifest.enums[enumName],
                      },
                      null,
                      2,
                    );
                  } else {
                    result = `ERROR: '${module_name}' not found in ${fwKey} ${branchKey} manifest. Fallback to 'get_framework_docs' for a deeper file-tree search.`;
                  }
                } else {
                  result = `ERROR: Local manifest for ${fwKey} ${branchKey} not found. Ensure frameworks are synchronized.`;
                }
              } catch (e) {
                result = `ERROR: Failed to access local manifest: ${(e as Error).message}`;
              }
            }
          }
          // HANDLER: GitHub Docs
          else if (call.name === "get_framework_docs") {
            const args = call.args as unknown as FrameworkDocsArgs;
            const { framework, module_name, branch } = args;

            // Normalize Module Name (remove extension) for Fingerprinting
            const cleanModuleName = module_name
              .toUpperCase()
              .replace(/\.LUA$/, "");
            const fwKey = framework.toUpperCase();
            const branchKey =
              branch || (fwKey === "MOOSE" ? targetMooseBranch : "MAIN");
            const fingerprint =
              `${fwKey}:${cleanModuleName}:${branchKey}`.toUpperCase();

            if (toolCallHistory.has(fingerprint)) {
              logger.warn(
                `[Librarian] Duplicate tool call blocked: ${fingerprint}`,
              );
              result = `REFERENCE NOTICE: The source code for module '${module_name}' (${framework} branch ${branchKey}) was already successfully provided in a previous turn of this session. 

To prevent a context-bloating loop, the Librarian has not re-fetched the full file. Please scroll up and reference the existing '[Librarian Source Metadata]' block for '${module_name}'. 

If you believe the previous fetch was incomplete, proceed with the information you have or ask the user for specific logic.`;
            } else {
              toolCallHistory.add(fingerprint);
              result = await getFrameworkDocs(
                framework,
                module_name,
                branchKey,
                githubToken,
                isDesanitized,
                targetMooseBranch,
              );
            }
          }
          // HANDLER: SSE Hard Deck
          else if (call.name === "get_sse_docs") {
            const args = call.args as unknown as SseDocsArgs;
            const { category } = args;
            const fingerprint = `SSE:${category}`;

            if (toolCallHistory.has(fingerprint)) {
              result =
                "SYSTEM ALERT: SSE Definitions for this category are already in context.";
            } else {
              toolCallHistory.add(fingerprint);
              if (category === "All") {
                result = JSON.stringify(SSE_DEFINITIONS, null, 2);
              } else if (
                SSE_DEFINITIONS[category as keyof typeof SSE_DEFINITIONS]
              ) {
                result = JSON.stringify(
                  SSE_DEFINITIONS[category as keyof typeof SSE_DEFINITIONS],
                  null,
                  2,
                );
              } else {
                result =
                  "ERROR: Category not found in Hard Deck. Available: Group, Unit, timer, trigger, coalition.";
              }
            }
          }

          return {
            functionResponse: {
              id: call.id,
              name: call.name,
              response: { result: result },
            },
          } as Part;
        }),
      );

      if (responseParts.length > 0) {
        currentTurnMessage = responseParts;
        continue;
      }
    }

    break;
  }
}
