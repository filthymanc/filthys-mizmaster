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

import React, { useState, useEffect, useRef } from "react";
import { useSettings } from "../core/useSettings";
import {
  ThemeSet,
  BrightnessLevel,
  AccentRole,
  AccentIntensity,
  Message,
  AppSettings,
} from "../core/types";
import Dashboard from "../features/mission/ui/Dashboard";
import ArmoryModal from "../features/armory/ui/ArmoryModal";
import LoginScreen from "../features/auth/ui/LoginScreen";
import SettingsModal from "../shared/ui/SettingsModal";
import ChatMessage from "../features/chat/ui/ChatMessage";
import CodeBlock from "../features/chat/ui/CodeBlock";

interface RoleMetadata {
  role: string;
  variable: string;
  description: string;
  usage: string[];
  type: "bg" | "text" | "border";
}

interface RogueColor {
  file: string;
  style: string;
}

const Swatchboard: React.FC = () => {
  const { settings, updateSettings } = useSettings();
  const [showArmory, setShowArmory] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const syncChannelRef = useRef<BroadcastChannel | null>(null);

  // Initialize Broadcast Channel for Theme Syncing
  useEffect(() => {
    syncChannelRef.current = new BroadcastChannel("mizmaster-theme-sync");
    return () => syncChannelRef.current?.close();
  }, []);

  // Wrap updateSettings to also broadcast
  const broadcastUpdate = (u: Partial<AppSettings>) => {
    updateSettings(u);
    syncChannelRef.current?.postMessage({
      type: "UPDATE_THEME",
      payload: u,
    });
  };

  const themeSets: ThemeSet[] = ["mono", "barley", "woodland", "desert", "maritime", "pru", "mediterranean"];
  const brightnessLevels: BrightnessLevel[] = ["L1", "L2", "L3", "L4", "L5"];
  const accentRoles: AccentRole[] = [
    "ready",
    "nav",
    "alert",
    "danger",
    "intel",
    "gold",
    "stealth",
  ];
  const intensities: AccentIntensity[] = ["vivid", "tactical"];

  const colorMetadata: RoleMetadata[] = [
    {
      role: "bg-app-canvas",
      variable: "--bg-canvas",
      type: "bg",
      description: "The absolute baseline background layer.",
      usage: [
        "App.tsx",
        "LoginScreen.tsx",
        "Dashboard.tsx",
        "ChatMessage.tsx",
        "DetailPane.tsx",
        "MissionWorkspace.tsx",
      ],
    },
    {
      role: "bg-app-frame",
      variable: "--bg-frame",
      type: "bg",
      description: "Structural container layer for major panels.",
      usage: [
        "Sidebar.tsx",
        "SidebarFooter.tsx",
        "ChatInput.tsx",
        "ArmoryModal.tsx",
        "SecurityBriefingModal.tsx",
      ],
    },
    {
      role: "bg-app-surface",
      variable: "--bg-surface",
      type: "bg",
      description: "Interactive or nested layer for cards and inputs.",
      usage: [
        "Dashboard.tsx",
        "ChatMessage.tsx",
        "ChatInput.tsx",
        "ArmoryModal.tsx",
        "SettingsModal.tsx",
      ],
    },
    {
      role: "bg-app-overlay",
      variable: "--bg-overlay",
      type: "bg",
      description: "The top-most layer for modals and dropdowns.",
      usage: [
        "ArmoryModal.tsx",
        "SettingsModal.tsx",
        "CodeBlock.tsx (Expanded)",
      ],
    },
    {
      role: "text-app-primary",
      variable: "--text-primary",
      type: "text",
      description: "Primary readability color for standard content.",
      usage: [
        "Global",
        "App.tsx",
        "ChatMessage.tsx",
        "Dashboard.tsx",
        "Sidebar.tsx",
      ],
    },
    {
      role: "text-app-secondary",
      variable: "--text-secondary",
      type: "text",
      description: "Lower contrast text for metadata and descriptions.",
      usage: [
        "Dashboard.tsx",
        "ChatMessage.tsx",
        "SidebarSessionItem.tsx",
        "LoginScreen.tsx",
      ],
    },
    {
      role: "text-app-tertiary",
      variable: "--text-tertiary",
      type: "text",
      description: "The lowest contrast text for utility labels.",
      usage: [
        "SidebarFooter.tsx",
        "ChatInput.tsx",
        "ChatMessage.tsx",
        "Dashboard.tsx",
        "FieldManual.tsx",
      ],
    },
    {
      role: "border-app-border",
      variable: "--border-base",
      type: "border",
      description: "Structural separator for panel edges.",
      usage: [
        "Sidebar.tsx",
        "Dashboard.tsx",
        "ArmoryModal.tsx",
        "ChatInput.tsx",
        "DetailPane.tsx",
      ],
    },
    {
      role: "border-app-highlight",
      variable: "--border-highlight",
      type: "border",
      description: "Emphasis border for active states.",
      usage: ["LoginScreen.tsx", "Dashboard.tsx", "ChatInput.tsx"],
    },
    {
      role: "bg-app-brand",
      variable: "--color-brand",
      type: "bg",
      description: "Primary identity color for keys and branding.",
      usage: [
        "App.tsx",
        "Dashboard.tsx",
        "ChatInput.tsx",
        "ArmoryModal.tsx",
        "LoginScreen.tsx",
      ],
    },
  ];

  const rogueColors: RogueColor[] = [
    { file: "App.tsx", style: "text-white (Cleanup Target)" },
    { file: "ChatInput.tsx", style: "text-white, bg-transparent" },
    { file: "Sidebar.tsx", style: "text-white" },
    { file: "SidebarSessionItem.tsx", style: "text-white, bg-transparent" },
    { file: "ErrorBoundary.tsx", style: "text-white" },
  ];

  const mockUserMessage: Message = {
    id: "user-1",
    role: "user",
    text: "Can you help me set up a spawning script for a BLUE coalition CAP flight in MOOSE?",
    timestamp: new Date(),
  };

  const mockModelMessage: Message = {
    id: "model-1",
    role: "model",
    text: "Affirmative. To create a CAP flight using the MOOSE framework, you'll want to use the `SPAWN` class combined with `AI_CAP_ZONE`. \n\nHere is a tactical template for your script:",
    timestamp: new Date(),
    modelUsed: "Gemini 2.0 Flash",
    verifiedModel: "gemini-2.0-flash",
  };

  const mockLuaCode = `--- MOOSE SPAWN CAP TEMPLATE ---
local CAP_Spawn = SPAWN:New("Blue_CAP_Flight")
  :InitLimit(2, 10)
  :InitRepeatOnLanding()
  :SpawnScheduled(300, 0.5)

local CAP_Zone = ZONE:New("CAP_Area_Alpha")
local CAP_Logic = AI_CAP_ZONE:New(CAP_Zone, 15000, 25000, 350, 450)
CAP_Logic:SetControllable(CAP_Spawn:Spawn())
CAP_Logic:Start()`;

  // Sync body classes with local state for the swatchboard
  useEffect(() => {
    const body = document.body;
    body.className = `set-${settings.themeSet} brightness-${settings.themeBrightness} accent-role-${settings.themeAccentRole} intensity-${settings.themeIntensity}`;
  }, [settings]);

  // Render the swatch based on its intended type
  const renderSwatch = (meta: RoleMetadata) => {
    const colorValue = `oklch(var(${meta.variable}))`;

    if (meta.type === "bg") {
      return (
        <div
          style={{ backgroundColor: colorValue }}
          className="w-20 h-20 rounded-xl border border-app-border flex items-center justify-center flex-shrink-0 shadow-sm relative overflow-hidden"
        >
          <span className="text-[8px] font-mono text-white mix-blend-difference opacity-50 uppercase tracking-tighter">
            Surface Fill
          </span>
        </div>
      );
    }

    if (meta.type === "text") {
      return (
        <div className="w-20 h-20 rounded-xl border border-app-border bg-app-surface flex items-center justify-center flex-shrink-0 shadow-sm relative overflow-hidden">
          <span
            style={{ color: colorValue }}
            className="text-3xl font-bold select-none"
          >
            Aa
          </span>
          <div className="absolute inset-0 flex items-end justify-center pb-1">
            <span className="text-[8px] font-mono text-app-tertiary opacity-50 uppercase tracking-tighter">
              Text Color
            </span>
          </div>
        </div>
      );
    }

    if (meta.type === "border") {
      return (
        <div
          style={{ borderColor: colorValue, borderWidth: "3px" }}
          className="w-20 h-20 rounded-xl bg-app-surface flex items-center justify-center flex-shrink-0 shadow-sm relative overflow-hidden"
        >
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-[8px] font-mono text-app-tertiary opacity-50 uppercase tracking-tighter">
              Border Edge
            </span>
          </div>
        </div>
      );
    }
  };

  return (
    <div className="min-h-screen bg-app-canvas text-app-primary p-8 font-sans overflow-y-auto">
      {/* HEADER & THEME CONTROLS - STICKY */}
      <header className="sticky top-0 z-50 -mx-8 -mt-8 mb-12 border-b border-app-border bg-app-canvas/80 backdrop-blur-md p-8 shadow-xl">
        <h1 className="text-4xl font-bold mb-6 tracking-tighter flex items-center gap-4">
          SWATCHBOARD
          <span className="text-xs font-mono bg-app-brand/20 text-app-brand px-2 py-1 rounded border border-app-brand/30 uppercase tracking-widest">
            Tactical Design System v2.3
          </span>
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 bg-app-frame/50 p-6 rounded-2xl border border-app-border">
          {/* Sets */}
          <div>
            <label className="text-xs font-mono text-app-tertiary uppercase mb-2 block">
              Theme Set
            </label>
            <div className="flex flex-wrap gap-2">
              {themeSets.map((s) => (
                <button
                  key={s}
                  onClick={() => broadcastUpdate({ themeSet: s })}
                  className={`px-3 py-1 rounded-md text-xs font-mono border transition-all ${settings.themeSet === s ? "bg-app-brand text-app-canvas border-app-brand" : "border-app-border hover:border-app-highlight"}`}
                >
                  {s.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          {/* Brightness */}
          <div>
            <label className="text-xs font-mono text-app-tertiary uppercase mb-2 block">
              Brightness Level
            </label>
            <div className="flex flex-wrap gap-2">
              {brightnessLevels.map((l) => (
                <button
                  key={l}
                  onClick={() => broadcastUpdate({ themeBrightness: l })}
                  className={`px-3 py-1 rounded-md text-xs font-mono border transition-all ${settings.themeBrightness === l ? "bg-app-brand text-app-canvas border-app-brand" : "border-app-border hover:border-app-highlight"}`}
                >
                  {l}
                </button>
              ))}
            </div>
          </div>

          {/* Accent */}
          <div>
            <label className="text-xs font-mono text-app-tertiary uppercase mb-2 block">
              Accent Role
            </label>
            <div className="flex flex-wrap gap-2">
              {accentRoles.map((a) => (
                <button
                  key={a}
                  onClick={() => broadcastUpdate({ themeAccentRole: a })}
                  className={`px-3 py-1 rounded-md text-xs font-mono border transition-all ${settings.themeAccentRole === a ? "bg-app-brand text-app-canvas border-app-brand" : "border-app-border hover:border-app-highlight"}`}
                >
                  {a.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          {/* Intensity */}
          <div>
            <label className="text-xs font-mono text-app-tertiary uppercase mb-2 block">
              Intensity
            </label>
            <div className="flex flex-wrap gap-2">
              {intensities.map((i) => (
                <button
                  key={i}
                  onClick={() => broadcastUpdate({ themeIntensity: i })}
                  className={`px-3 py-1 rounded-md text-xs font-mono border transition-all ${settings.themeIntensity === i ? "bg-app-brand text-app-canvas border-app-brand" : "border-app-border hover:border-app-highlight"}`}
                >
                  {i.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-12 max-w-[1920px] mx-auto">
        {/* LEFT COLUMN: ATOMS */}
        <section className="space-y-12">
          {/* COLOR PALETTE & USAGE INDEX */}
          <div>
            <h2 className="text-sm font-mono text-app-brand uppercase tracking-widest mb-4 border-b border-app-brand/20 pb-2 flex justify-between items-center">
              Functional Color Roles & Usage Index
              <span className="text-[10px] lowercase italic text-app-tertiary">
                Real-time Codebase Deployment Mapping
              </span>
            </h2>
            <div className="grid grid-cols-1 gap-4">
              {colorMetadata.map((meta) => (
                <div
                  key={meta.role}
                  className="group p-4 bg-app-frame rounded-2xl border border-app-border flex gap-6 items-start transition-all hover:border-app-brand/50 shadow-sm"
                >
                  {renderSwatch(meta)}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex flex-col">
                        <span className="text-xs font-bold font-mono text-app-primary uppercase tracking-wider">
                          {meta.role}
                        </span>
                        <span className="text-[10px] font-mono text-app-brand">
                          {meta.variable}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1 justify-end max-w-[250px]">
                        {meta.usage.map((file) => (
                          <span
                            key={file}
                            className="text-[9px] font-mono bg-app-surface text-app-secondary px-1.5 py-0.5 rounded border border-app-border"
                          >
                            {file}
                          </span>
                        ))}
                      </div>
                    </div>
                    <p className="text-xs text-app-secondary leading-relaxed border-t border-app-border/50 pt-2 mt-2 italic">
                      {meta.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Updated ROGUE COLOR AUDIT */}
          <div>
            <h2 className="text-sm font-mono text-app-status-ready uppercase tracking-widest mb-4 border-b border-app-status-ready/20 pb-2 flex justify-between items-center">
              Remaining Cleanup Targets (Scan v2)
              <span className="text-[10px] lowercase italic text-app-tertiary">
                Progress: 80% System Unified
              </span>
            </h2>
            <div className="bg-app-frame rounded-2xl border border-app-status-ready/30 overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-app-status-ready/5 border-b border-app-status-ready/20">
                    <th className="p-4 text-[10px] font-mono text-app-status-ready uppercase tracking-widest">
                      File Location
                    </th>
                    <th className="p-4 text-[10px] font-mono text-app-status-ready uppercase tracking-widest">
                      Hardcoded Styles
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-app-border/50">
                  {rogueColors.map((rogue) => (
                    <tr
                      key={rogue.file}
                      className="hover:bg-app-surface/50 transition-colors"
                    >
                      <td className="p-4">
                        <span className="text-xs font-bold font-mono text-app-primary">
                          {rogue.file}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex flex-wrap gap-2">
                          {rogue.style.split(", ").map((s) => (
                            <span
                              key={s}
                              className="text-[10px] font-mono bg-app-status-nav/10 text-app-status-nav px-2 py-0.5 rounded border border-app-status-nav/20"
                            >
                              {s}
                            </span>
                          ))}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="p-4 bg-app-status-ready/5 text-[11px] text-app-status-ready italic text-center">
                Major refactor successful. No raw hex codes detected in
                production source.
              </div>
            </div>
          </div>

          {/* TYPOGRAPHY COMPREHENSIVE */}
          <div>
            <h2 className="text-sm font-mono text-app-brand uppercase tracking-widest mb-4 border-b border-app-brand/20 pb-2">
              Typography Stack & Variables
            </h2>
            <div className="bg-app-frame p-8 rounded-2xl border border-app-border space-y-10">
              <div className="space-y-4">
                <h3 className="text-[10px] font-mono text-app-tertiary uppercase tracking-widest border-b border-app-border pb-1 mb-4">
                  Headings & Titles
                </h3>
                <div>
                  <h1 className="text-4xl font-bold tracking-tighter text-app-primary mb-1">
                    Display Title
                  </h1>
                  <p className="text-[10px] font-mono text-app-brand uppercase tracking-wider">
                    Class:{" "}
                    <span className="text-app-primary">
                      text-4xl font-bold tracking-tighter
                    </span>{" "}
                    | Var:{" "}
                    <span className="text-app-primary">--text-primary</span>
                  </p>
                </div>
                <div>
                  <h2 className="text-2xl font-bold tracking-tight text-app-primary mb-1">
                    Section Header
                  </h2>
                  <p className="text-[10px] font-mono text-app-brand uppercase tracking-wider">
                    Class:{" "}
                    <span className="text-app-primary">
                      text-2xl font-bold tracking-tight
                    </span>{" "}
                    | Var:{" "}
                    <span className="text-app-primary">--text-primary</span>
                  </p>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-app-primary mb-1">
                    Feature Title
                  </h3>
                  <p className="text-[10px] font-mono text-app-brand uppercase tracking-wider">
                    Class:{" "}
                    <span className="text-app-primary">
                      text-xl font-semibold
                    </span>{" "}
                    | Var:{" "}
                    <span className="text-app-primary">--text-primary</span>
                  </p>
                </div>
              </div>
              <div className="space-y-6">
                <h3 className="text-[10px] font-mono text-app-tertiary uppercase tracking-widest border-b border-app-border pb-1 mb-4">
                  Content & Metadata
                </h3>
                <div>
                  <p className="text-base text-app-primary font-normal mb-1">
                    Primary Body: Standard content block text.
                  </p>
                  <p className="text-[10px] font-mono text-app-brand uppercase tracking-wider">
                    Class:{" "}
                    <span className="text-app-primary">
                      text-base text-app-primary
                    </span>{" "}
                    | Var:{" "}
                    <span className="text-app-primary">--text-primary</span>
                  </p>
                </div>
                <div>
                  <p className="text-sm text-app-secondary font-normal mb-1">
                    Secondary Body: Supporting text and descriptions.
                  </p>
                  <p className="text-[10px] font-mono text-app-brand uppercase tracking-wider">
                    Class:{" "}
                    <span className="text-app-secondary">
                      text-sm text-app-secondary
                    </span>{" "}
                    | Var:{" "}
                    <span className="text-app-secondary">--text-secondary</span>
                  </p>
                </div>
                <div>
                  <p className="text-xs text-app-tertiary font-medium uppercase tracking-wider mb-1">
                    Tertiary Label: Metadata and utility info.
                  </p>
                  <p className="text-[10px] font-mono text-app-brand uppercase tracking-wider">
                    Class:{" "}
                    <span className="text-app-tertiary">
                      text-xs text-app-tertiary uppercase
                    </span>{" "}
                    | Var:{" "}
                    <span className="text-app-tertiary">--text-tertiary</span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* RIGHT COLUMN: ORGANISMS */}
        <section className="space-y-12">
          {/* COMMS AUDIT */}
          <div>
            <h2 className="text-sm font-mono text-app-brand uppercase tracking-widest mb-4 border-b border-app-brand/20 pb-2">
              Comms & Messaging Audit
            </h2>
            <div className="space-y-8 bg-app-frame p-8 rounded-2xl border border-app-border">
              <div className="max-w-2xl">
                <ChatMessage message={mockUserMessage} />
              </div>
              <div className="max-w-3xl">
                <ChatMessage message={mockModelMessage} />
              </div>
              <div className="max-w-3xl">
                <CodeBlock className="language-lua">{mockLuaCode}</CodeBlock>
              </div>
            </div>
          </div>

          {/* DASHBOARD PREVIEW */}
          <div>
            <h2 className="text-sm font-mono text-app-brand uppercase tracking-widest mb-4 border-b border-app-brand/20 pb-2">
              Dashboard (Embedded)
            </h2>
            <div className="border border-app-border rounded-2xl overflow-hidden shadow-2xl h-[800px] relative origin-top">
              <Dashboard
                settings={settings}
                apiStatus="idle"
                sessions={[]}
                activeSessionId={null}
                onSelectSession={() => {}}
                onCreateSession={() => {}}
                onImportData={() => {}}
                onPrompt={() => {}}
                onUpdateSettings={() => {}}
                onOpenSettings={() => {}}
              />
            </div>
          </div>

          {/* LOGIN PREVIEW */}
          <div>
            <h2 className="text-sm font-mono text-app-brand uppercase tracking-widest mb-4 border-b border-app-brand/20 pb-2">
              Login Screen (Embedded)
            </h2>
            <div className="border border-app-border rounded-2xl overflow-hidden shadow-2xl h-[700px] relative origin-top">
              <LoginScreen
                onLogin={async () => true}
                onLoginAsVisitor={() => {}}
                isVerifying={false}
                authError={null}
                onOpenFieldManual={() => {}}
              />
            </div>
          </div>
        </section>
      </div>

      <ArmoryModal isOpen={showArmory} onClose={() => setShowArmory(false)} />
      <SettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        onImportData={() => {}}
        onExportData={() => {}}
        onDisconnect={() => {}}
        onOpenFieldManual={() => {}}
      />
    </div>
  );
};

export default Swatchboard;
