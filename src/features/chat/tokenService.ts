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
 * Optionally protects the very first message (if it contains critical context).
 */
export const pruneHistoryByTokens = (messages: Message[]): Message[] => {
  // 1. Filter out ephemeral streaming messages
  const stableMessages = messages.filter((m) => !m.isStreaming);
  
  if (stableMessages.length === 0) return [];

  const maxTokens = CONTEXT_LIMITS.MAX_TOKENS || 30000;
  const maxMessages = CONTEXT_LIMITS.MAX_MESSAGES || 50;

  // 2. Identify Protected Message (First User Message)
  let protectedMsg: Message | null = null;
  let protectedTokens = 0;
  let candidates = [...stableMessages];

  if (CONTEXT_LIMITS.PROTECT_FIRST_MSG && candidates.length > 0) {
    protectedMsg = candidates[0];
    protectedTokens = getMessageTokenCount(protectedMsg);
    // Remove it from the candidate pool for now
    candidates.shift();
  }

  // 3. Reverse iterate to accumulate most recent messages first
  let currentTokens = protectedTokens;
  const keptMessages: Message[] = [];

  // Iterate from end (most recent) to start
  for (let i = candidates.length - 1; i >= 0; i--) {
    const msg = candidates[i];
    const tokens = getMessageTokenCount(msg);

    // Check Budget
    if (currentTokens + tokens > maxTokens) {
      console.log(`[TokenService] Pruning message ${msg.id} (Tokens: ${tokens}). Budget Exceeded.`);
      break; 
    }

    // Check Count Limit
    if (keptMessages.length >= maxMessages - (protectedMsg ? 1 : 0)) {
        console.log(`[TokenService] Pruning message ${msg.id}. Message Count Limit Exceeded.`);
        break;
    }

    currentTokens += tokens;
    keptMessages.unshift(msg); // Add to front of "kept" array to maintain order
  }

  // 4. Reassemble
  if (protectedMsg) {
    return [protectedMsg, ...keptMessages];
  }
  
  return keptMessages;
};
