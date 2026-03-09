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

import { Message } from "../../core/types";
import { CONTEXT_LIMITS } from "../../core/constants";

/**
 * Estimates token count based on character length.
 * Heuristic: ~4 characters per token for English text/code.
 * This is a client-side approximation to avoid API calls for counting.
 */
export const estimateTokenCount = (text: string): number => {
  if (!text) return 0;
  return Math.ceil(text.length / 4);
};

export const getMessageTokenCount = (message: Message): number => {
  // We count the text content plus a small overhead for role/metadata
  return estimateTokenCount(message.text) + 5;
};

/**
 * Prunes the message history to fit within the defined Token Budget.
 * Always preserves the most recent messages.
 * Optionally protects the first USER message (Initial Briefing).
 */
export const pruneHistoryByTokens = (messages: Message[]): Message[] => {
  // 1. Filter out ephemeral streaming messages
  const stableMessages = messages.filter((m) => !m.isStreaming);

  if (stableMessages.length === 0) return [];

  const maxTokens = CONTEXT_LIMITS.MAX_TOKENS || 30000;
  const maxMessages = CONTEXT_LIMITS.MAX_MESSAGES || 50;

  // 2. Identify Protected Message (First User Message / Initial Briefing)
  let protectedMsg: Message | null = null;
  let protectedTokens = 0;
  const candidatePool = [...stableMessages];

  if (CONTEXT_LIMITS.PROTECT_FIRST_MSG) {
    // Find the first message with role "user"
    const firstUserMsgIndex = candidatePool.findIndex((m) => m.role === "user");

    if (firstUserMsgIndex !== -1) {
      protectedMsg = candidatePool[firstUserMsgIndex];
      protectedTokens = getMessageTokenCount(protectedMsg);
      // Remove it from the candidate pool to avoid double-counting
      candidatePool.splice(firstUserMsgIndex, 1);
    }
  }

  // 3. Reverse iterate to accumulate most recent messages first
  let currentTokens = protectedTokens;
  const keptMessages: Message[] = [];

  // Iterate from end (most recent) to start
  for (let i = candidatePool.length - 1; i >= 0; i--) {
    const msg = candidatePool[i];
    const tokens = getMessageTokenCount(msg);

    // Check Budget
    if (currentTokens + tokens > maxTokens) {
      console.log(
        `[TokenService] Pruning message ${msg.id} (Tokens: ${tokens}). Budget Exceeded.`,
      );
      break;
    }

    // Check Count Limit
    if (keptMessages.length >= maxMessages - (protectedMsg ? 1 : 0)) {
      console.log(
        `[TokenService] Pruning message ${msg.id}. Message Count Limit Exceeded.`,
      );
      break;
    }

    currentTokens += tokens;
    keptMessages.unshift(msg); // Add to front of "kept" array to maintain order
  }

  // 4. Reassemble
  if (protectedMsg) {
    // We need to find the correct insertion point or just put it at the start
    // Usually, the first user message is the second message (after Welcome),
    // but for context-first logic, we put it at the very top of the pruned list.
    return [protectedMsg, ...keptMessages];
  }

  return keptMessages;
};
