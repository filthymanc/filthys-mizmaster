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

import React from "react";
import { AppSettings, ApiStatus, Session, MooseBranch } from "../../../core/types";
import {
  SUGGESTED_QUERIES,
  AVAILABLE_MODELS,
  DISCORD_LINKS,
} from "../../../core/constants";
import {
  GithubIcon,
  PlusIcon,
  UploadIcon,
  DiscordIcon,
  ShieldIcon,
  AlertIcon,
} from "../../../shared/ui/Icons";
import { safeDate } from "../../../shared/utils/dateUtils";
import { APP_VERSION } from "../../../core/version";

interface DashboardProps {
  settings: AppSettings;
  apiStatus: ApiStatus;
  sessions: Session[];
  activeSessionId: string | null;
  onSelectSession: (id: string) => void;
  onCreateSession: () => void;
  onImportData: () => void;
  onPrompt: (text: string) => void;
  onUpdateSettings: (updates: Partial<AppSettings>) => void;
  onOpenSettings: (tab?: number) => void;
}

const Dashboard: React.FC<DashboardProps> = ({
  settings,
  apiStatus,
  sessions,
  activeSessionId,
  onSelectSession,
  onCreateSession,
  onImportData,
  onPrompt,
  onUpdateSettings,
  onOpenSettings,
}) => {
  const recentSessions = sessions
    .filter((s) => s.id !== activeSessionId)
    .sort(
      (a, b) =>
        safeDate(b.lastModified).getTime() - safeDate(a.lastModified).getTime(),
    )
    .slice(0, 4);

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(safeDate(date));
  };

  const getStatusTextColor = () => {
    if (apiStatus === "error") return "text-app-status-danger";
    if (apiStatus === "offline") return "text-app-tertiary";
    return "text-app-status-ready";
  };

  const currentModel = (
    settings.availableModels.length > 0
      ? settings.availableModels
      : AVAILABLE_MODELS
  ).find((m) => m.id === settings.model);

  return (
    <div className="flex-1 flex flex-col gap-6 max-w-5xl mx-auto py-4 md:py-8 animate-fadeIn select-none">
      {/* 0. BANNER */}
      <div className="w-full h-32 md:h-40 rounded-2xl overflow-hidden border border-app-border bg-app-canvas relative mb-2 shadow-lg">
        <video
          src="filthysMizMaster.mp4"
          autoPlay
          loop
          muted
          playsInline
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-app-canvas/80 via-transparent to-transparent"></div>
      </div>

      {/* 1. HEADER & STATUS BAR */}
      <div className="flex flex-col gap-3 mb-2">
        <div className="flex justify-between items-end">
          <div>
            <h2 className="text-lg md:text-xl font-bold text-app-primary tracking-widest uppercase">
              Mission Control
            </h2>
            <p className="text-[10px] md:text-xs text-app-tertiary font-mono mt-1">
              Awaiting objective definition.
            </p>
          </div>
          <div className="text-[10px] font-mono text-app-tertiary uppercase tracking-tighter">
            v{settings.availableModels.length > 0 ? APP_VERSION : "LINKING..."}
          </div>
        </div>

        {/* 2. STREAMLINED STATUS BAR */}
        <div className="flex flex-wrap items-center gap-3 md:gap-6 p-3 rounded-xl border border-app-border bg-app-surface/40 shadow-sm text-[10px] md:text-xs font-bold uppercase tracking-widest font-mono">
          <div className={`flex items-center gap-2 ${getStatusTextColor()}`}>
            <div className={`w-2 h-2 rounded-full ${apiStatus === 'idle' ? 'bg-app-status-ready animate-pulse shadow-[0_0_8px_var(--color-status-ready)]' : apiStatus === 'error' ? 'bg-app-status-danger' : 'bg-app-tertiary'}`}></div>
            API: {apiStatus === "idle" ? "ONLINE" : apiStatus}
          </div>
          <div className="text-app-border">|</div>
          
          <div className={`flex items-center gap-2 ${settings.isDesanitized ? "text-app-status-danger" : "text-app-status-nav"}`}>
             ENV: {settings.isDesanitized ? "DEV MODE" : "SANITIZED"}
          </div>
          <div className="text-app-border">|</div>

          <div className="flex items-center gap-2 text-app-status-intel">
            MODEL: {currentModel?.shortLabel || settings.model}
          </div>
        </div>
      </div>

      {/* 3. MAIN LAYOUT GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT COLUMN: Configuration, Actions & Suggestions */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          
          {/* PRE-FLIGHT CONFIGURATION */}
          <div className="bg-app-surface border border-app-border rounded-xl p-5 md:p-6 shadow-sm">
             <h2 className="text-xs font-bold text-app-secondary uppercase tracking-widest mb-4 flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-app-status-nav" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
              </svg>
              Pre-Flight Parameters
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              
              {/* MOOSE Target */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-bold text-app-tertiary uppercase tracking-wider">
                    MOOSE Target
                  </label>
                </div>
                <div className="grid grid-cols-3 gap-1 bg-app-canvas p-1 rounded-lg border border-app-border">
                  {(["STABLE", "DEVELOP", "LEGACY"] as MooseBranch[]).map((b) => (
                    <button
                      key={b}
                      onClick={() => onUpdateSettings({ targetMooseBranch: b })}
                      className={`py-1.5 text-[9px] md:text-[10px] font-bold rounded transition-all ${
                        settings.targetMooseBranch === b
                          ? "bg-app-brand text-app-canvas shadow-sm"
                          : "text-app-tertiary hover:text-app-secondary hover:bg-app-surface"
                      }`}
                    >
                      {b}
                    </button>
                  ))}
                </div>
                <p className="text-[9px] text-app-tertiary font-mono px-1">
                  {settings.targetMooseBranch === "STABLE" && "Vanilla scripts (master-ng)"}
                  {settings.targetMooseBranch === "DEVELOP" && "Experimental/Testing (develop)"}
                  {settings.targetMooseBranch === "LEGACY" && "Retired classes (master)"}
                </p>
              </div>

              {/* Environment Mode */}
              <div className="space-y-2">
                 <label className="text-[10px] font-bold text-app-tertiary uppercase tracking-wider flex justify-between">
                    Security Context
                 </label>
                 <button
                    onClick={() => onUpdateSettings({ isDesanitized: !settings.isDesanitized })}
                    className={`w-full flex items-center justify-between p-2 rounded-lg border transition-all ${
                      settings.isDesanitized 
                        ? "bg-app-status-danger/10 border-app-status-danger text-app-status-danger" 
                        : "bg-app-canvas border-app-border hover:border-app-highlight text-app-secondary"
                    }`}
                 >
                    <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider">
                      {settings.isDesanitized ? <AlertIcon className="h-4 w-4" /> : <ShieldIcon className="h-4 w-4" />}
                      {settings.isDesanitized ? "Dev Mode Active" : "Sanitized"}
                    </div>
                    <div className={`relative inline-flex h-4 w-8 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${settings.isDesanitized ? "bg-app-status-danger" : "bg-app-primary/20"}`}>
                      <span aria-hidden="true" className={`pointer-events-none inline-block h-3 w-3 transform rounded-full bg-app-primary shadow ring-0 transition duration-200 ease-in-out ${settings.isDesanitized ? "translate-x-4" : "translate-x-0"}`} />
                    </div>
                 </button>
                 <p className={`text-[9px] font-mono px-1 ${settings.isDesanitized ? "text-app-status-danger/80" : "text-app-tertiary"}`}>
                   {settings.isDesanitized ? "OS-level libraries unlocked." : "Standard constraints active."}
                 </p>
              </div>

            </div>
          </div>

          {/* Command Deck */}
          <div className="bg-app-surface border border-app-border rounded-xl p-5 md:p-6 shadow-sm">
            <h2 className="text-xs font-bold text-app-secondary uppercase tracking-widest mb-4 flex items-center gap-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4 text-app-brand"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
                />
              </svg>
              Command Deck
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button
                id="dashboard-new-mission"
                data-testid="dashboard-new-mission"
                onClick={onCreateSession}
                className="p-4 bg-app-canvas border border-app-border hover:border-app-brand/50 hover:shadow-md hover:shadow-app-brand/10 rounded-xl transition-all text-left group flex flex-col"
                aria-label="Create New Mission"
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-app-brand/10 rounded-lg text-app-brand group-hover:bg-app-brand group-hover:text-app-canvas transition-colors">
                    <PlusIcon className="h-5 w-5" />
                  </div>
                  <span className="font-bold text-app-primary uppercase tracking-wide">
                    New Mission
                  </span>
                </div>
                <p className="text-xs text-app-tertiary leading-relaxed pl-12">
                  Initialize a workspace with current pre-flight parameters.
                </p>
              </button>

              <button
                id="dashboard-import-backup"
                data-testid="dashboard-import-backup"
                onClick={onImportData}
                className="p-4 bg-app-canvas border border-app-border hover:border-app-status-intel/50 hover:shadow-md hover:shadow-app-status-intel/10 rounded-xl transition-all text-left group flex flex-col"
                aria-label="Import Backup File"
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-app-status-intel/10 rounded-lg text-app-status-intel group-hover:bg-app-status-intel group-hover:text-app-canvas transition-colors">
                    <UploadIcon className="h-5 w-5" />
                  </div>
                  <span className="font-bold text-app-primary uppercase tracking-wide">
                    Import Backup
                  </span>
                </div>
                <p className="text-xs text-app-tertiary leading-relaxed pl-12">
                  Restore a previous mission database from a JSON file.
                </p>
              </button>
            </div>
          </div>

          {/* Suggested Parameters */}
          <div className="bg-app-surface border border-app-border rounded-xl p-5 md:p-6 shadow-sm">
            <h2 className="text-xs font-bold text-app-secondary uppercase tracking-widest mb-4 flex items-center gap-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4 text-app-highlight"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
              Suggested Parameters
            </h2>
            <div className="grid grid-cols-1 gap-2 md:gap-3" role="list">
              {SUGGESTED_QUERIES.map((query, idx) => (
                <button
                  key={idx}
                  id={`dashboard-query-${idx}`}
                  data-testid="dashboard-query"
                  onClick={() => onPrompt(query)}
                  className="p-3 md:p-4 text-left text-[11px] md:text-sm bg-app-canvas border border-app-border hover:border-app-brand/50 hover:shadow-sm rounded-xl text-app-secondary hover:text-app-primary transition-all flex items-center justify-between group"
                  role="listitem"
                >
                  <span className="truncate pr-4 font-mono">{query}</span>
                  <div className="p-1 bg-app-surface rounded opacity-0 group-hover:opacity-100 transition-opacity">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4 text-app-brand"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M14 5l7 7m0 0l-7 7m7-7H3"
                      />
                    </svg>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Librarian & History */}
        <div className="lg:col-span-1 flex flex-col gap-6">
          {/* GitHub Token (Librarian) */}
          <div className="bg-app-surface border border-app-border rounded-xl p-5 shadow-sm">
            <h2 className="text-xs font-bold text-app-secondary uppercase tracking-widest mb-4 flex items-center gap-2">
              <GithubIcon className="h-4 w-4 text-app-secondary" />
              Librarian Link
            </h2>
            <div className="bg-app-canvas border border-app-border rounded-lg p-4 transition-all duration-300">
              <div className="flex items-center gap-3 mb-3">
                <div
                  className={`w-2 h-2 rounded-full ${settings.githubToken ? "bg-app-status-ready animate-pulse" : "bg-app-tertiary"}`}
                />
                <h3 className="text-[10px] font-bold text-app-primary uppercase tracking-wider">
                  {settings.githubToken ? "Authorized" : "Guest Mode"}
                </h3>
              </div>
              <p className="text-[9px] md:text-[10px] text-app-tertiary mb-4 leading-relaxed font-mono">
                {settings.githubToken
                  ? "Authentication active. Rate limit: 5000/hr. Full repository read access granted."
                  : "Anonymous access. Rate limit: 60/hr. Search operations may fail under load."}
              </p>

              <button
                id="dashboard-github-token-trigger"
                data-testid="dashboard-github-token-trigger"
                onClick={() => onOpenSettings(2)}
                className="w-full py-2 bg-app-surface border border-app-border hover:border-app-highlight hover:text-app-primary text-app-secondary rounded text-[10px] font-bold transition-colors uppercase tracking-widest"
              >
                {settings.githubToken ? "UPDATE TOKEN" : "CONFIGURE TOKEN"}
              </button>
            </div>
          </div>

          {/* Discord Community */}
          <div className="bg-app-status-nav/10 border border-app-status-nav/20 rounded-xl p-5 shadow-sm">
            <h2 className="text-xs font-bold text-app-status-nav uppercase tracking-widest mb-4 flex items-center gap-2">
              <DiscordIcon className="h-4 w-4" />
              Community Hub
            </h2>
            <div className="bg-app-canvas/80 border border-app-border rounded-lg p-4 transition-all duration-300">
              <p className="text-[9px] md:text-[10px] text-app-tertiary mb-4 leading-relaxed font-mono">
                Join the official Discord to share missions, get support, and
                collab with other DCS designers.
              </p>

              <a
                id="dashboard-discord-link"
                data-testid="dashboard-discord-link"
                href={DISCORD_LINKS.COMMUNITY}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2 bg-app-status-nav/90 hover:bg-app-status-nav text-app-canvas rounded text-[10px] font-bold transition-colors flex items-center justify-center gap-2 shadow-sm"
              >
                JOIN THE DISCORD
              </a>
            </div>
          </div>

          {/* Recent Files */}
          <div className="bg-app-surface border border-app-border rounded-xl p-5 shadow-sm flex-1 flex flex-col">
            <h2 className="text-xs font-bold text-app-secondary uppercase tracking-widest mb-4 flex items-center gap-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4 text-app-secondary"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              Recent History
            </h2>

            {recentSessions.length > 0 ? (
              <div className="space-y-2">
                {recentSessions.map((session) => (
                  <button
                    key={session.id}
                    id={`dashboard-recent-session-${session.id}`}
                    data-testid="dashboard-recent-session"
                    onClick={() => onSelectSession(session.id)}
                    className="w-full text-left p-3 rounded-lg bg-app-canvas border border-app-border hover:border-app-highlight hover:bg-app-surface transition-all group"
                  >
                    <div className="font-bold text-xs text-app-secondary group-hover:text-app-primary truncate mb-1">
                      {session.name}
                    </div>
                    <div className="text-[9px] text-app-tertiary font-mono">
                      {formatDate(session.lastModified)}
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-app-tertiary space-y-3 opacity-80 min-h-[150px] bg-app-canvas rounded-lg border border-dashed border-app-border/50">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-8 w-8"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2 2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                  />
                </svg>
                <p className="text-[10px] font-mono">No recent missions</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
