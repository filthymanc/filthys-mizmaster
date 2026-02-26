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

import { useState, useEffect } from "react";

export interface LibrarianSuggestion {
  label: string;
  description: string;
  framework: "MOOSE" | "DML" | "DCS";
}

// Static Knowledge Base for Phase 3 MVP
// Eventually this could be populated from the IDB Cache analysis
const KNOWLEDGE_BASE: LibrarianSuggestion[] = [
  // MOOSE Core
  { label: "SPAWN", description: "Dynamic Spawning Engine", framework: "MOOSE" },
  { label: "ZONE", description: "Zone Management & Polymorphism", framework: "MOOSE" },
  { label: "GROUP", description: "Group Wrapper & Manipulation", framework: "MOOSE" },
  { label: "UNIT", description: "Unit Wrapper & Manipulation", framework: "MOOSE" },
  { label: "COORDINATE", description: "3D Space & Navigation", framework: "MOOSE" },
  { label: "SCHEDULER", description: "Time-based Execution", framework: "MOOSE" },
  
  // MOOSE Functional
  { label: "AIRBOSS", description: "Carrier Air Wing Operations", framework: "MOOSE" },
  { label: "RAT", description: "Random Air Traffic", framework: "MOOSE" },
  { label: "WAREHOUSE", description: "Logistics & Supply Chain", framework: "MOOSE" },
  { label: "RESCUEHELO", description: "CSAR Operations", framework: "MOOSE" },
  { label: "MISSILETRAINER", description: "Evasion Training", framework: "MOOSE" },
  { label: "DESIGNATE", description: "Laser/Smoke Designation", framework: "MOOSE" },
  
  // DML Modules
  { label: "cfxZones", description: "Zone Logic & Triggers", framework: "DML" },
  { label: "cfxMX", description: "Mission Data Access", framework: "DML" },
  { label: "pulse", description: "Heartbeat & Timing", framework: "DML" },
  
  // DCS World API (Common)
  { label: "trigger.action", description: "Mission Editor Actions", framework: "DCS" },
  { label: "env.mission", description: "Mission Environment Data", framework: "DCS" },
  { label: "timer.scheduleFunction", description: "Low-level Scheduling", framework: "DCS" },
];

export const useLibrarian = (input: string) => {
  const [suggestions, setSuggestions] = useState<LibrarianSuggestion[]>([]);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (!input || input.trim().length < 2) {
      setSuggestions([]);
      setIsVisible(false);
      return;
    }

    // Extract the last word being typed
    const words = input.split(/[\s\n]+/);
    const lastWord = words[words.length - 1];

    if (lastWord.length < 2) {
      setSuggestions([]);
      setIsVisible(false);
      return;
    }

    const lowerLast = lastWord.toLowerCase();
    
    // Fuzzy match against Knowledge Base
    const matches = KNOWLEDGE_BASE.filter(item => 
      item.label.toLowerCase().includes(lowerLast)
    ).slice(0, 3); // Limit to top 3

    setSuggestions(matches);
    setIsVisible(matches.length > 0);

  }, [input]);

  return { suggestions, isVisible };
};
