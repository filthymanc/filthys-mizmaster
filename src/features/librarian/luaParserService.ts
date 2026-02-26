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

/**
 * Lua Parser Service
 *
 * Analyzes raw Lua source code and "compresses" it for AI consumption.
 * - Retains: Documentation (LDoc), Class Definitions, Function Signatures.
 * - Strips: Function Implementation Bodies.
 * - Goal: Reduce token usage by >80%.
 */

export interface LuaValidationResult {
  isValid: boolean;
  error?: string;
  line?: number;
}

const PROHIBITED_LUA_LIBS = [
  "os.",
  "io.",
  "lfs.",
  "require",
  "package.",
  "debug.",
];

export const validateLuaSyntax = (code: string): LuaValidationResult => {
  if (!code || !code.trim()) return { isValid: true };

  const lines = code.split("\n");

  // 1. Prohibited Libraries Check
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    // Ignore simple comments for this check to avoid false positives in documentation
    if (line.trim().startsWith("--")) continue;

    const lowerLine = line.toLowerCase();
    
    for (const lib of PROHIBITED_LUA_LIBS) {
      if (lowerLine.includes(lib)) {
        return {
          isValid: false,
          error: `Restricted Library Detected: '${lib}'`,
          line: i + 1,
        };
      }
    }
  }

  // 2. Structural Integrity (Brackets)
  // We need to strip comments and strings to accurately check bracket balance
  let cleanCode = code.replace(/--.*$/gm, ""); // Remove single line comments
  // Remove long comments/strings (simplified regex)
  cleanCode = cleanCode.replace(/\[(=*)\[[\s\S]*?\]\1\]/g, ""); 
  // Remove string literals
  cleanCode = cleanCode.replace(/"[^"\\]*(?:\\.[^"\\]*)*"/g, ""); 
  cleanCode = cleanCode.replace(/'[^'\\]*(?:\\.[^'\\]*)*'/g, ""); 

  const stack: string[] = [];
  const pairs: Record<string, string> = { "(": ")", "{": "}", "[": "]" };

  for (const char of cleanCode) {
    if ("({[".includes(char)) {
      stack.push(char);
    } else if (")]}".includes(char)) {
      const last = stack.pop();
      if (!last || pairs[last] !== char) {
        return { 
          isValid: false, 
          error: `Unmatched bracket: '${char}'` 
        };
      }
    }
  }

  if (stack.length > 0) {
    return { 
      isValid: false, 
      error: `Unclosed bracket: '${stack[stack.length - 1]}'` 
    };
  }

  // 3. Block Balancing (Heuristic)
  // This is a naive check for "end" matching "function/if/do/for"
  // It is not a full parser, so we treat it as a warning heuristic
  const tokens = cleanCode.match(/\b(function|if|for|while|repeat|do|end|until)\b/g) || [];
  let blockDepth = 0;
  
  for (const token of tokens) {
    if (["function", "if", "for", "while", "do"].includes(token)) {
      blockDepth++;
    } else if (token === "end") {
      blockDepth--;
    } else if (token === "repeat") {
        // Repeat ... until is special, handled separately or ignored in this simple counter
        // For now, ignoring repeats in this counter to avoid complexity
    }
  }

  if (blockDepth !== 0) {
     // We don't fail validation for this because the regex tokenizer is fragile
     // But we could return a warning if we had a warning field.
     // For now, we trust the bracket checker more.
  }

  return { isValid: true };
};

export const parseLuaSource = (raw: string): string => {
  if (!raw) return "";

  const lines = raw.split("\n");
  const output: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // 1. HEADER & DOCUMENTATION PRESERVATION
    // Keep lines that look like documentation
    if (trimmed.startsWith("---") || trimmed.startsWith("--")) {
      // Check if it's a "separator" line (e.g., -----------------) -> Skip to save tokens?
      // Actually, separators often denote sections. Let's keep them but maybe compact them?
      if (trimmed.match(/^-{10,}$/)) {
        // It's just a separator line. Skip it to save tokens.
        continue;
      }
      output.push(line);
      continue;
    }

    // 2. CLASS DEFINITIONS
    // Matches: Class = BASE:Inherit(...) or Class = {}
    if (/^[A-Z_0-9]+\s*=\s*[A-Z_0-9.:]+/.test(trimmed)) {
      output.push(line);
      continue;
    }

    // 3. FUNCTION SIGNATURES
    // Matches: function Class:Method(args)
    if (trimmed.startsWith("function")) {
      // Check for one-liners
      if (trimmed.endsWith("end")) {
        output.push(line);
      } else {
        // It's a multi-line function. We want the signature, but not the body.
        // We append a comment indicating hidden logic.
        output.push(`${line} -- [Implementation Hidden by Semantic Architect]`);
        output.push("end"); // Close the block immediately
      }
      continue;
    }

    // 4. PRESERVE SPECIFIC KEYWORDS (Safety Check)
    // Sometimes critical enums are defined at the top level
    if (trimmed.startsWith("local") || /^[A-Z_]+\s*=/.test(trimmed)) {
      // Heuristic: If it's short, keep it.
      if (trimmed.length < 100) {
        output.push(line);
      }
      continue;
    }
  }

  // Post-Processing: Join and Add Metadata
  const compressed = output.join("\n");
  const ratio = ((1 - compressed.length / raw.length) * 100).toFixed(1);

  return `--- [SEMANTIC COMPRESSION ACTIVE]
--- Original Size: ${raw.length} chars
--- Compressed Size: ${compressed.length} chars
--- Compression Ratio: ${ratio}%
--- NOTE: Implementation logic has been stripped. Function signatures are accurate.
--------------------------------------------------------------------------------

${compressed}`;
};
