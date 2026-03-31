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
  type: "class" | "method" | "attribute" | "enum";
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
        const url = framework === "MOOSE" ? `/filthys-mizmaster/manifests/moose-${branch}.json` : `/filthys-mizmaster/manifests/dml-main.json`;
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
    loadManifest("DML", "main");
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
    const mooseManifest = manifests[`MOOSE-${activeBranch}`];
    const dmlManifest = manifests[`DML-main`];
    
    let matches: LibrarianSuggestion[] = [];
    const lowerLast = lastWord.toLowerCase();
    const isMethodTrigger = lastWord.includes(":") || lastWord.includes(".");
    let className: string | null = null;
    let methodPrefix = "";
    let framework: "MOOSE" | "DML" = "MOOSE";

    if (isMethodTrigger) {
      const parts = lastWord.split(/[:.]/);
      const rawClassName = parts[0];
      methodPrefix = parts.length > 1 ? parts[parts.length - 1].toLowerCase() : "";
      const rawPrefixPath = parts.slice(0, parts.length - 1).join(".");

      const findEnumMatches = (manifest: FrameworkManifest | undefined, frameworkName: "MOOSE" | "DML") => {
        if (!manifest?.enums) return [];
        const enumMatches: LibrarianSuggestion[] = [];
        const lowerPrefix = rawPrefixPath.toLowerCase();

        for (const [key, data] of Object.entries(manifest.enums)) {
          const lowerKey = key.toLowerCase();
          
          if (lowerKey === lowerPrefix) {
            const fields = data.fields || [];
            fields.forEach(f => {
              if (f.name.toLowerCase().startsWith(methodPrefix)) {
                enumMatches.push({
                  label: `${key}.${f.name}`,
                  description: f.description || `Constant: ${f.name} in ${key}`,
                  framework: frameworkName,
                  type: "enum" as const
                });
              }
            });
          } 
          else if (lowerKey.startsWith(lowerPrefix + ".")) {
            const relativeKey = key.substring(lowerPrefix.length + 1);
            const segments = relativeKey.split(".");
            const nextSegment = segments[0];

            if (nextSegment.toLowerCase().startsWith(methodPrefix)) {
               const fullLabel = `${rawPrefixPath}.${nextSegment}`;
               if (!enumMatches.find(m => m.label === fullLabel)) {
                 enumMatches.push({
                   label: fullLabel,
                   description: `Namespace: ${key}`,
                   framework: frameworkName,
                   type: "enum" as const
                 });
               }
            }
          }

          // Case 3: The user has typed the full namespace without the trailing dot ("world.event")
          // We should immediately suggest its fields so they don't have to manually type the dot.
          if (lowerKey === lowerLast) {
            const fields = data.fields || [];
            fields.forEach(f => {
              enumMatches.push({
                label: `${key}.${f.name}`,
                description: f.description || `Constant: ${f.name} in ${key}`,
                framework: frameworkName,
                type: "enum" as const
              });
            });
          }
        }
        return enumMatches;
      };

      const mooseEnumMatches = findEnumMatches(mooseManifest, "MOOSE");
      const dmlEnumMatches = findEnumMatches(dmlManifest, "DML");
      matches = [...mooseEnumMatches, ...dmlEnumMatches];

      // 2. Class Discovery
      const mooseClass = mooseManifest ? Object.keys(mooseManifest.classes).find(k => k.toLowerCase() === rawClassName.toLowerCase()) : null;
      const dmlClass = dmlManifest ? Object.keys(dmlManifest.classes).find(k => k.toLowerCase() === rawClassName.toLowerCase()) : null;

      if (mooseClass) {
        framework = "MOOSE";
        className = mooseClass;
      } else if (dmlClass) {
        framework = "DML";
        className = dmlClass;
      }

      activeFramework.current = framework;
      const currentManifest = framework === "MOOSE" ? mooseManifest : dmlManifest;

      let methodMatches: LibrarianSuggestion[] = [];
      let attrMatches: LibrarianSuggestion[] = [];

      if (currentManifest && className) {
        const classData = currentManifest.classes[className];
        if (classData) {
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

          methodMatches = Object.entries(availableMethods)
            .filter(([name]) => name.toLowerCase().startsWith(methodPrefix))
            .map(([name, data]) => ({
              label: `${className}${framework === "DML" ? "." : ":"}${name}(${data.params?.join(", ") || ""})`,
              description: data.description || `Method of ${className}`,
              framework: framework,
              type: "method" as const,
              params: data.params
            }));

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
        }
      }

      matches = [...matches, ...attrMatches, ...methodMatches]
        .sort((a, b) => {
          if (a.type !== b.type) {
            const typePriority = { enum: 0, attribute: 1, method: 2, class: 3 };
            return typePriority[a.type as keyof typeof typePriority] - typePriority[b.type as keyof typeof typePriority];
          }
          if (a.type === "attribute" && b.type === "attribute") {
            const attrPriority: Record<string, number> = { trigger: 1, condition: 2, property: 3 };
            const priorityA = attrPriority[a.attrType!] || 4;
            const priorityB = attrPriority[b.attrType!] || 4;
            return priorityA - priorityB;
          }
          return a.label.localeCompare(b.label);
        });
    } else {
      const searchPattern = lowerLast;

      // Determine Framework for Standard Search
      const isExplicitDml = lowerLast.startsWith("cfx") || lowerLast.startsWith("dml");
      if (isExplicitDml) {
        framework = "DML";
      } else {
        const mooseMatch = mooseManifest ? Object.keys(mooseManifest.classes).some(k => k.toLowerCase().startsWith(lowerLast)) : false;
        const dmlMatch = dmlManifest ? Object.keys(dmlManifest.classes).some(k => k.toLowerCase().startsWith(lowerLast)) : false;
        if (!mooseMatch && dmlMatch) {
          framework = "DML";
        }
      }

      activeFramework.current = framework;
      const currentManifest = framework === "MOOSE" ? mooseManifest : dmlManifest;

      if (currentManifest) {
        const allClassNames = Object.keys(currentManifest.classes);
        const allEnumNames = currentManifest.enums ? Object.keys(currentManifest.enums) : [];

        const classMatches = allClassNames
          .filter(name => name.toLowerCase().includes(searchPattern))
          .map(name => ({
            label: name,
            description: currentManifest.classes[name].description || `${framework} ${name} Class`,
            framework: framework,
            type: "class" as const
          }));

        const enumMatches = allEnumNames
          .filter(name => name.toLowerCase().startsWith(searchPattern))
          .map(name => ({
            label: name,
            description: `Namespace: ${name}`,
            framework: framework,
            type: "enum" as const
          }));

        matches = [...enumMatches, ...classMatches];
      }
    }

    setSuggestions(matches);
    setIsVisible(matches.length > 0);
  }, [input, manifests, activeBranch]);

  return { suggestions, isVisible };
};
