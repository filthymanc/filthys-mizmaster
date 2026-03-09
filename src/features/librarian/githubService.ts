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

import { parseLuaSource } from "./luaParserService";
import {
  getCachedFile,
  cacheFile,
  pruneCache,
} from "../../shared/services/idbService";

// Service to fetch raw Lua source code via GitHub API
// Implements "Code-First Librarian" & "Semantic Architect" protocols (v2.3)

interface GitHubFile {
  path: string;
  mode: string;
  type: "blob" | "tree";
  sha: string;
  size?: number;
  url: string;
}

interface RepoConfig {
  owner: string;
  repo: string;
  branch: string;
}

const REPOS: Record<string, Record<string, RepoConfig>> = {
  MOOSE: {
    STABLE: { owner: "FlightControl-Master", repo: "MOOSE", branch: "master" },
    DEVELOP: {
      owner: "FlightControl-Master",
      repo: "MOOSE",
      branch: "develop",
    },
  },
  DML: {
    MAIN: { owner: "csofranz", repo: "DML", branch: "main" },
  },
};

const TREE_CACHE_PREFIX = "filthys-mizmaster-tree-";
const TREE_CACHE_TTL = 24 * 60 * 60 * 1000; // 24 Hours
const CONTENT_CACHE_TTL = 7 * 24 * 60 * 60 * 1000; // 7 Days (longer than tree)

/**
 * Helper to get authorization headers for GitHub API requests.
 * NOT for raw.githubusercontent.com (CORS restriction).
 */
const getApiHeaders = (token?: string): HeadersInit => {
  const headers: HeadersInit = {
    Accept: "application/vnd.github.v3+json",
  };
  if (token && token.trim() !== "") {
    headers["Authorization"] = `Bearer ${token.trim()}`;
  }
  return headers;
};

/**
 * Fetches the recursive file tree from GitHub API.
 */
const fetchRepoTree = async (
  config: RepoConfig,
  token?: string,
): Promise<GitHubFile[]> => {
  const cacheKey = `${TREE_CACHE_PREFIX}${config.owner}-${config.repo}-${config.branch}`;
  const cached = localStorage.getItem(cacheKey);

  if (cached) {
    try {
      const parsed = JSON.parse(cached);
      if (Date.now() - parsed.timestamp < TREE_CACHE_TTL) {
        console.log(`[Librarian] Loaded ${config.repo} tree from cache.`);
        return parsed.tree;
      }
    } catch {
      console.warn("Invalid cache, clearing...");
      localStorage.removeItem(cacheKey);
    }
  }

  console.log(
    `[Librarian] Fetching fresh tree for ${config.repo}/${config.branch}...`,
  );
  const url = `https://api.github.com/repos/${config.owner}/${config.repo}/git/trees/${config.branch}?recursive=1`;

  const response = await fetch(url, {
    headers: getApiHeaders(token),
  });

  if (response.status === 401) {
    throw new Error(
      "GitHub Token Invalid. Please check your token in Settings.",
    );
  }

  if (response.status === 403 || response.status === 429) {
    const isTokenUsed = token && token.trim() !== "";
    throw new Error(
      isTokenUsed
        ? "GitHub Rate Limit reached even with Token. Please wait a moment or check your token permissions in Settings."
        : "GitHub Rate Limit reached (60/hr). Add a free Personal Access Token in Settings to increase this to 5000/hr and continue deep-searching frameworks.",
    );
  }

  if (!response.ok) {
    throw new Error(
      `GitHub API Error: ${response.status} ${response.statusText}`,
    );
  }

  const data = await response.json();

  if (data.truncated) {
    console.warn(
      "[Librarian] Warning: Repository tree is truncated by GitHub (too large).",
    );
  }

  // Cache the result
  try {
    localStorage.setItem(
      cacheKey,
      JSON.stringify({
        timestamp: Date.now(),
        tree: data.tree,
      }),
    );
  } catch {
    console.warn("Failed to cache tree (Storage Quota).");
  }
  return data.tree;
};

/**
 * Fuzzy searches the file tree for a matching Lua file.
 */
const findFileInTree = (
  tree: GitHubFile[],
  query: string,
): GitHubFile | null => {
  const cleanQuery = query
    .toLowerCase()
    .trim()
    .replace(/\.lua$/, "");

  const exactMatch = tree.find((f) => {
    const fileName = f.path.split("/").pop()?.toLowerCase() || "";
    return fileName === `${cleanQuery}.lua` || fileName === cleanQuery;
  });
  if (exactMatch) return exactMatch;

  const suffixMatch = tree.find((f) =>
    f.path.toLowerCase().endsWith(`/${cleanQuery}.lua`),
  );
  if (suffixMatch) return suffixMatch;

  const fuzzyMatch = tree.find(
    (f) =>
      f.type === "blob" &&
      f.path.endsWith(".lua") &&
      f.path.toLowerCase().includes(cleanQuery),
  );

  return fuzzyMatch || null;
};

/**
 * Validates a GitHub Personal Access Token by pinging the rate_limit endpoint.
 */
export const validateGitHubToken = async (token: string): Promise<boolean> => {
  if (!token || token.trim() === "") return true;

  try {
    const response = await fetch("https://api.github.com/rate_limit", {
      headers: getApiHeaders(token),
    });
    return response.ok;
  } catch (error) {
    console.error("[Librarian] Token validation failed:", error);
    return false;
  }
};

/**
 * Main Tool Function
 */
export const getFrameworkDocs = async (
  framework: string,
  moduleName: string,
  branch: string = "DEVELOP",
  githubToken?: string, // Token passed from context
): Promise<string> => {
  try {
    // 1. Opportunistic Cleanup
    pruneCache(CONTENT_CACHE_TTL).catch((e) =>
      console.warn("[Librarian] Cache prune failed:", e),
    );

    const fwKey = framework.toUpperCase();
    let branchKey = branch.toUpperCase();

    if (fwKey === "DML") branchKey = "MAIN";

    const config = REPOS[fwKey]?.[branchKey];
    if (!config) {
      return `ERROR: Invalid Framework/Branch configuration: ${framework} [${branch}]`;
    }

    // 2. Fetch Tree (Fastest, usually cached in LocalStorage)
    let tree: GitHubFile[];
    try {
      tree = await fetchRepoTree(config, githubToken);
    } catch (e: unknown) {
      return `ERROR: ${(e as Error).message}`;
    }

    const file = findFileInTree(tree, moduleName);
    if (!file) {
      const suggestions = tree
        .filter(
          (f) =>
            f.path.includes(moduleName.slice(0, 3)) && f.path.endsWith(".lua"),
        )
        .slice(0, 5)
        .map((f) => f.path);
      return `ERROR: Module '${moduleName}' not found in ${config.repo}. Did you mean: ${suggestions.join(", ")}?`;
    }

    // 3. Resolve Content Source (CORS-Safe Strategy)
    // - No Token: Fetch directly from raw.githubusercontent.com (No headers, avoiding preflight)
    // - With Token: Fetch via api.github.com/contents/ (Proper CORS support for authenticated requests)
    let contentUrl: string;
    let fetchOptions: RequestInit = {};

    if (githubToken && githubToken.trim() !== "") {
      // Authenticated Fetch via API
      contentUrl = `https://api.github.com/repos/${config.owner}/${config.repo}/contents/${file.path}?ref=${config.branch}`;
      fetchOptions = {
        headers: {
          ...getApiHeaders(githubToken),
          Accept: "application/vnd.github.v3.raw", // Direct raw content from API
        },
      };
    } else {
      // Anonymous Fetch directly from Raw CDN
      contentUrl = `https://raw.githubusercontent.com/${config.owner}/${config.repo}/${config.branch}/${file.path}`;
      // No headers added to prevent CORS preflight blocks on the Raw CDN
    }

    // 4. Check Content Cache (IndexedDB)
    try {
      const cachedEntry = await getCachedFile(contentUrl);
      if (cachedEntry) {
        const ageHours =
          (Date.now() - cachedEntry.timestamp) / (1000 * 60 * 60);
        console.log(
          `[Librarian] Cache Hit: ${file.path} (Age: ${ageHours.toFixed(1)}h)`,
        );

        const metadata = `[Librarian Source Metadata]
Repo: ${config.owner}/${config.repo}
Branch: ${config.branch}
File: ${file.path}
Source: Local Cache (IDB)
URL: ${contentUrl}
--------------------------------------------------
`;
        return metadata + cachedEntry.content;
      }
    } catch (dbError) {
      console.warn("[Librarian] IDB Read Failed:", dbError);
    }

    // 5. Cache Miss -> Network Fetch
    console.log(`[Librarian] Fetching Raw Source: ${contentUrl}`);

    const response = await fetch(contentUrl, fetchOptions);
    if (!response.ok) {
      return `ERROR: Failed to download source file: ${contentUrl} (${response.status})`;
    }

    let content = await response.text();
    const fileSize = content.length;

    const COMPRESSION_THRESHOLD = 10000;

    if (file.path.endsWith(".lua") && fileSize > COMPRESSION_THRESHOLD) {
      console.log(
        `[Librarian] Compressing ${file.path} (${fileSize} bytes)...`,
      );
      content = parseLuaSource(content);
    }

    // 6. Write to Cache (Async)
    cacheFile(contentUrl, content).catch((e) =>
      console.warn("[Librarian] Failed to cache file:", e),
    );

    const metadata = `[Librarian Source Metadata]
Repo: ${config.owner}/${config.repo}
Branch: ${config.branch}
File: ${file.path}
Original Size: ${fileSize} bytes
URL: ${contentUrl}
--------------------------------------------------
`;

    return metadata + content;
  } catch (error: unknown) {
    return `ERROR: Librarian System Exception: ${(error as Error).message}`;
  }
};
