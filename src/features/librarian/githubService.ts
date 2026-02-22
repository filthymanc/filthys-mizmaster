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

const CACHE_PREFIX = "filthys-mizmaster-tree-";
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 Hours

/**
 * Helper to get authorization headers if a token is provided
 */
const getAuthHeaders = (token?: string): HeadersInit => {
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
  const cacheKey = `${CACHE_PREFIX}${config.owner}-${config.repo}-${config.branch}`;
  const cached = localStorage.getItem(cacheKey);

  if (cached) {
    try {
      const parsed = JSON.parse(cached);
      if (Date.now() - parsed.timestamp < CACHE_TTL) {
        console.log(`[Librarian] Loaded ${config.repo} tree from cache.`);
        return parsed.tree;
      }
    } catch (e) {
      console.warn("Invalid cache, clearing...");
      localStorage.removeItem(cacheKey);
    }
  }

  console.log(
    `[Librarian] Fetching fresh tree for ${config.repo}/${config.branch}...`,
  );
  const url = `https://api.github.com/repos/${config.owner}/${config.repo}/git/trees/${config.branch}?recursive=1`;

  const response = await fetch(url, {
    headers: getAuthHeaders(token),
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
        ? "GitHub API Rate Limit Exceeded even with Token. This shouldn't happen often."
        : "GitHub API Rate Limit Exceeded (60/hr). Add a Personal Access Token in Settings to increase this to 5000/hr.",
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
  } catch (e) {
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
 * Main Tool Function
 */
export const getFrameworkDocs = async (
  framework: string,
  moduleName: string,
  branch: string = "DEVELOP",
  githubToken?: string, // Token passed from context
): Promise<string> => {
  try {
    const fwKey = framework.toUpperCase();
    let branchKey = branch.toUpperCase();

    if (fwKey === "DML") branchKey = "MAIN";

    const config = REPOS[fwKey]?.[branchKey];
    if (!config) {
      return `ERROR: Invalid Framework/Branch configuration: ${framework} [${branch}]`;
    }

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

    const rawUrl = `https://raw.githubusercontent.com/${config.owner}/${config.repo}/${config.branch}/${file.path}`;
    console.log(`[Librarian] Fetching Raw Source: ${rawUrl}`);

    const response = await fetch(rawUrl, {
      headers: getAuthHeaders(githubToken),
    });
    if (!response.ok) {
      return `ERROR: Failed to download source file: ${rawUrl}`;
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

    const metadata = `[Librarian Source Metadata]
Repo: ${config.owner}/${config.repo}
Branch: ${config.branch}
File: ${file.path}
Original Size: ${fileSize} bytes
Raw URL: ${rawUrl}
--------------------------------------------------
`;

    return metadata + content;
  } catch (error: unknown) {
    return `ERROR: Librarian System Exception: ${(error as Error).message}`;
  }
};
