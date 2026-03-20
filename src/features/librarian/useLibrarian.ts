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

import { useState, useEffect, useRef, useCallback } from "react";
import { getManifest, saveManifest, FrameworkManifest } from "../../shared/services/idbService";

export interface LibrarianSuggestion {
  label: string;
  description: string;
  framework: "MOOSE" | "DML" | "DCS";
  type: "class" | "method";
  params?: string[];
}

export const useLibrarian = (input: string, activeBranch: string = "master-ng") => {
  const [suggestions, setSuggestions] = useState<LibrarianSuggestion[]>([]);
  const [isVisible, setIsVisible] = useState(false);
  const [manifests, setManifests] = useState<Record<string, FrameworkManifest>>({});
  const activeFramework = useRef<"MOOSE" | "DML">("MOOSE");

  // Load a specific manifest
  const loadManifest = useCallback(async (framework: "MOOSE" | "DML", branch: string) => {
    const manifestKey = `${framework}-${branch}`;
    if (manifests[manifestKey]) return manifests[manifestKey];

    try {
      let data = await getManifest(framework, branch);
      if (!data) {
        console.log(`[Librarian] Manifest miss for ${framework} (${branch}), fetching...`);
        // Use Vite base path explicitly if needed, but relative usually works if root is right.
        // Actually, let's use the absolute-from-base path.
        const url = framework === "MOOSE" ? `/filthys-mizmaster/manifests/moose-${branch}.json` : `/filthys-mizmaster/manifests/dml-master.json`;
        const response = await fetch(url);
        if (response.ok) {
          data = await response.json();
          if (data) {
            data.id = manifestKey; // Ensure v5 ID
            await saveManifest(data);
          }
        }
      }

      if (data) {
        setManifests(prev => ({ ...prev, [manifestKey]: data }));
        return data;
      }
    } catch (error) {
      console.error(`[Librarian] Failed to load ${framework} manifest:`, error);
    }
    return null;
  }, [manifests]);

  // 1. Initial Load
  useEffect(() => {
    loadManifest("MOOSE", activeBranch);
    loadManifest("DML", "master");
  }, [activeBranch, loadManifest]);

  // 2. Suggestion Logic
  useEffect(() => {
    if (!input || input.trim().length < 2) {
      setSuggestions([]);
      setIsVisible(false);
      return;
    }

    const words = input.split(/[\s\n(]+/);
    const lastWord = words[words.length - 1];

    if (lastWord.length < 2) {
      setSuggestions([]);
      setIsVisible(false);
      return;
    }

    // Determine Framework based on prefix
    // More robust detection: if it starts with cfx, dml, or includes . it's likely DML
    const lowerLast = lastWord.toLowerCase();
    if (lowerLast.startsWith("cfx") || lowerLast.startsWith("dml") || (lowerLast.includes(".") && !lowerLast.includes(":"))) {
      activeFramework.current = "DML";
    } else {
      activeFramework.current = "MOOSE";
    }

    const currentManifest = manifests[`${activeFramework.current}-${activeFramework.current === "MOOSE" ? activeBranch : "master"}`];
    
    if (!currentManifest) {
      console.warn(`[Librarian] No manifest for ${activeFramework.current} (${activeBranch})`);
      return;
    }

    let matches: LibrarianSuggestion[] = [];

    // Trigger Logic: Check for : or .
    const isMethodTrigger = lastWord.includes(":") || lastWord.includes(".");
    
    if (isMethodTrigger) {
      const parts = lastWord.split(/[:.]/);
      const rawClassName = parts[0];
      const methodPrefix = parts[1]?.toLowerCase() || "";

      // Case-insensitive class lookup
      const className = Object.keys(currentManifest.classes).find(
        k => k.toLowerCase() === rawClassName.toLowerCase()
      );

      const classData = className ? currentManifest.classes[className] : null;
      
      if (className && classData) {
        const availableMethods: Record<string, { params?: string[] }> = {};

        // Helper to collect methods from hierarchy
        const visited = new Set<string>();
        const collectMethods = (cls: string) => {
          if (visited.has(cls)) return;
          visited.add(cls);

          const data = currentManifest.classes[cls];
          if (!data) return;
          if (data.methods) {
            Object.entries(data.methods).forEach(([mName, mData]) => {
              if (!availableMethods[mName]) availableMethods[mName] = mData;
            });
          }
          if (data.parent) collectMethods(data.parent);
        };

        collectMethods(className);

        matches = Object.keys(availableMethods)
          .filter(name => name.toLowerCase().startsWith(methodPrefix))
          .sort((a, b) => a.localeCompare(b))
          .slice(0, 10)
          .map(name => ({
            label: `${className}${activeFramework.current === "DML" ? "." : ":"}${name}`,
            description: `Method of ${className}`,
            framework: activeFramework.current,
            type: "method",
            params: availableMethods[name].params
          }));
      }
    } else {
      // Standard Class Suggestion
      const searchPattern = lowerLast;
      const allClassNames = Object.keys(currentManifest.classes);
      
      // Filter and prioritize "Starts With" over "Includes"
      const startsWithMatches = allClassNames.filter(name => name.toLowerCase().startsWith(searchPattern));
      const includesMatches = allClassNames.filter(name => !name.toLowerCase().startsWith(searchPattern) && name.toLowerCase().includes(searchPattern));
      
      matches = [...startsWithMatches, ...includesMatches]
        .slice(0, 10)
        .map(name => ({
          label: name,
          description: currentManifest.classes[name].description || `${activeFramework.current} ${name} Class`,
          framework: activeFramework.current,
          type: "class"
        }));
    }

    setSuggestions(matches);
    setIsVisible(matches.length > 0);
  }, [input, manifests, activeBranch]);

  return { suggestions, isVisible };
};
