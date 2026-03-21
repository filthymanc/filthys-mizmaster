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
import { LIBRARIAN_SNIPPETS } from "./snippets";

export interface LibrarianSuggestion {
  label: string;
  description: string;
  framework: "MOOSE" | "DML" | "DCS";
  type: "class" | "method" | "attribute" | "snippet";
  params?: string[];
  attrType?: "property" | "trigger" | "condition";
  template?: string;
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
        const url = framework === "MOOSE" ? `/filthys-mizmaster/manifests/moose-${branch}.json` : `/filthys-mizmaster/manifests/dml-master.json`;
        const response = await fetch(url);
        if (response.ok) {
          data = await response.json();
          if (data) {
            data.id = manifestKey;
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

    // Trim trailing whitespace for word extraction but maintain the original input context
    const trimmedInput = input.trimEnd();
    const words = trimmedInput.split(/[\s\n(]+/);
    const lastWord = words[words.length - 1];

    if (!lastWord || lastWord.length < 2) {
      setSuggestions([]);
      setIsVisible(false);
      return;
    }

    // Determine Framework dynamically
    const lowerLast = lastWord.toLowerCase();
    const isMethodTrigger = lastWord.includes(":") || lastWord.includes(".");
    
    let framework: "MOOSE" | "DML" = "MOOSE"; // Default
    let className: string | undefined;
    let methodPrefix = "";

    const mooseManifest = manifests[`MOOSE-${activeBranch}`];
    const dmlManifest = manifests[`DML-master`];

    if (isMethodTrigger) {
      const parts = lastWord.split(/[:.]/);
      const rawClassName = parts[0];
      methodPrefix = parts[1]?.toLowerCase() || "";

      // Try to find class in MOOSE first, then DML
      const mooseClass = mooseManifest ? Object.keys(mooseManifest.classes).find(k => k.toLowerCase() === rawClassName.toLowerCase()) : null;
      const dmlClass = dmlManifest ? Object.keys(dmlManifest.classes).find(k => k.toLowerCase() === rawClassName.toLowerCase()) : null;

      if (mooseClass) {
        framework = "MOOSE";
        className = mooseClass;
      } else if (dmlClass) {
        framework = "DML";
        className = dmlClass;
      }
    } else {
      // Searching for classes/modules
      // Check if it looks like DML or MOOSE
      const isExplicitDml = lowerLast.startsWith("cfx") || lowerLast.startsWith("dml");
      if (isExplicitDml) {
        framework = "DML";
      } else {
        // Peek into DML manifest if MOOSE doesn't have it
        const mooseMatch = mooseManifest ? Object.keys(mooseManifest.classes).some(k => k.toLowerCase().startsWith(lowerLast)) : false;
        const dmlMatch = dmlManifest ? Object.keys(dmlManifest.classes).some(k => k.toLowerCase().startsWith(lowerLast)) : false;
        
        if (!mooseMatch && dmlMatch) {
          framework = "DML";
        }
      }
    }

    activeFramework.current = framework;
    const currentManifest = framework === "MOOSE" ? mooseManifest : dmlManifest;
    
    if (!currentManifest) return;

    let matches: LibrarianSuggestion[] = [];

    if (isMethodTrigger && className) {
      const classData = currentManifest.classes[className];
      if (classData) {
        // Collect Methods (with inheritance)
        const availableMethods: Record<string, { params?: string[]; description?: string }> = {};
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

        const methodMatches = Object.entries(availableMethods)
          .filter(([name]) => name.toLowerCase().startsWith(methodPrefix))
          .map(([name, data]) => ({
            label: `${className}${framework === "DML" ? "." : ":"}${name}(${data.params?.join(", ") || ""})`,
            description: data.description || `Method of ${className}`,
            framework: framework,
            type: "method" as const,
            params: data.params
          }));

        // Collect DML Attributes if applicable
        let attrMatches: LibrarianSuggestion[] = [];
        if (activeFramework.current === "DML" && classData.attributes) {
          attrMatches = Object.entries(classData.attributes)
            .filter(([name]) => name.toLowerCase().startsWith(methodPrefix))
            .map(([name, data]) => ({
              label: `${className}.${name}`,
              description: `DML ${data.type.toUpperCase()}: Configuration property for ${className}`,
              framework: "DML" as const,
              type: "attribute" as const,
              attrType: data.type
            }));
        }

        // Prioritize Attributes over Methods for better DML discovery
        // Within Attributes, strictly rank: Trigger -> Condition -> Property
        matches = [...attrMatches, ...methodMatches]
          .sort((a, b) => {
            if (a.type !== b.type) {
              if (a.type === "attribute") return -1;
              if (b.type === "attribute") return 1;
            }

            // Both are attributes, sort by sub-type priority
            if (a.type === "attribute" && b.type === "attribute") {
              const typePriority = { trigger: 1, condition: 2, property: 3 };
              const priorityA = typePriority[a.attrType as keyof typeof typePriority] || 4;
              const priorityB = typePriority[b.attrType as keyof typeof typePriority] || 4;
              if (priorityA !== priorityB) {
                return priorityA - priorityB;
              }
            }
            
            return a.label.localeCompare(b.label);
          });
      }
    } else {
      // Standard Class Suggestion
      const searchPattern = lowerLast;
      const allClassNames = Object.keys(currentManifest.classes);
      
      const startsWithMatches = allClassNames.filter(name => name.toLowerCase().startsWith(searchPattern));
      const includesMatches = allClassNames.filter(name => !name.toLowerCase().startsWith(searchPattern) && name.toLowerCase().includes(searchPattern));
      
      const classMatches = [...startsWithMatches, ...includesMatches]
        .map(name => ({
          label: name,
          description: currentManifest.classes[name].description || `${framework} ${name} Class`,
          framework: framework,
          type: "class" as const
        }));

      // Inject Snippets
      const snippetMatches = LIBRARIAN_SNIPPETS.filter(s => 
        s.label.toLowerCase().includes(searchPattern)
      );

      // Prioritize Snippets at the top
      matches = [...snippetMatches, ...classMatches];
    }

    setSuggestions(matches);
    setIsVisible(matches.length > 0);
  }, [input, manifests, activeBranch]);

  return { suggestions, isVisible };
};
