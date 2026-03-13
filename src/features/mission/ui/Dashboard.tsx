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
import { AppSettings, ApiStatus, Session } from "../../../core/types";
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

  const getStatusColor = () => {
    if (apiStatus === "error")
      return "bg-app-status-danger/15 text-app-status-danger border-app-status-danger/25";
    if (apiStatus === "offline")
      return "bg-app-surface text-app-tertiary border-app-border";
    return "bg-app-status-ready/15 text-app-status-ready border-app-status-ready/25";
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
      <div className="w-full h-40 md:h-48 rounded-2xl overflow-hidden border border-app-border bg-app-canvas relative mb-2 shadow-lg">
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

      {/* 1. HEADER */}
      <div className="mb-2 flex justify-between items-end">
        <div>
          <h2 className="text-lg md:text-xl font-bold text-app-primary tracking-widest uppercase">
            Mission Control
          </h2>
          <p className="text-[10px] md:text-xs text-app-tertiary font-mono mt-1">
            Awaiting objective definition. Systems online.
          </p>
        </div>
        <div className="text-[10px] font-mono text-app-tertiary uppercase tracking-tighter">
          v{settings.availableModels.length > 0 ? APP_VERSION : "LINKING..."}
        </div>
      </div>

      {/* 2. SYSTEM STATUS PANEL */}
      <div
        className="grid grid-cols-1 md:grid-cols-3 gap-4"
        role="region"
        aria-label="System Status"
      >
        <div
          className={`p-4 rounded-xl flex items-center gap-4 shadow-sm border ${getStatusColor()}`}
        >
          <div className="p-2.5 rounded-lg bg-app-canvas shadow-sm">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"
              />
            </svg>
          </div>
          <div>
            <h3 className="text-[10px] font-bold opacity-70 uppercase tracking-widest text-app-primary">
              Connection
            </h3>
            <p
              className={`font-mono font-bold text-sm tracking-wider ${getStatusTextColor()}`}
            >
              {apiStatus === "idle" ? "ONLINE" : apiStatus.toUpperCase()}
            </p>
          </div>
        </div>

        <div
          className={`p-4 rounded-xl flex items-center gap-4 shadow-sm border ${settings.isDesanitized ? "bg-app-status-danger/15 text-app-status-danger border-app-status-danger/25" : "bg-app-status-nav/15 text-app-status-nav border-app-status-nav/25"}`}
        >
          <div className="p-2.5 rounded-lg bg-app-canvas shadow-sm">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
              />
            </svg>
          </div>
          <div>
            <h3 className="text-[10px] font-bold opacity-70 uppercase tracking-widest">
              Environment
            </h3>
            <p className="font-mono font-bold text-sm tracking-wider">
              {settings.isDesanitized ? "UNSAFE" : "SANITIZED"}
            </p>
          </div>
        </div>

        <div className="p-4 rounded-xl flex items-center gap-4 shadow-sm border bg-app-status-intel/30 text-app-status-intel border-app-status-intel/50">
          <div className="p-2.5 rounded-lg bg-app-canvas shadow-sm">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
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
          </div>
          <div className="min-w-0">
            <h3 className="text-[10px] font-bold opacity-85 uppercase tracking-widest truncate">
              Gemini Model
            </h3>
            <p className="font-mono font-bold text-sm tracking-wider truncate">
              {currentModel?.shortLabel || settings.model}
            </p>
          </div>
        </div>
      </div>

      {/* 3. MAIN LAYOUT GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT COLUMN: Actions & Suggestions */}
        <div className="lg:col-span-2 flex flex-col gap-6">
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
                className="p-4 bg-app-canvas border border-app-border hover:border-app-brand/50 hover:shadow-md hover:shadow-app-brand/10 rounded-xl transition-all text-left group"
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
                  Initialize a blank workspace with standard safety protocols.
                </p>
              </button>

              <button
                id="dashboard-import-backup"
                data-testid="dashboard-import-backup"
                onClick={onImportData}
                className="p-4 bg-app-canvas border border-app-border hover:border-app-status-intel/50 hover:shadow-md hover:shadow-app-status-intel/10 rounded-xl transition-all text-left group"
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
                  className="p-4 text-left text-sm bg-app-canvas border border-app-border hover:border-app-brand/50 hover:shadow-sm rounded-xl text-app-secondary hover:text-app-primary transition-all flex items-center justify-between group"
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
          <div className="bg-app-surface border border-app-border rounded-xl p-5 md:p-6 shadow-sm">
            <h2 className="text-xs font-bold text-app-secondary uppercase tracking-widest mb-4 flex items-center gap-2">
              <GithubIcon className="h-4 w-4 text-app-secondary" />
              Librarian Link
            </h2>
            <div className="bg-app-canvas border border-app-border rounded-lg p-4 transition-all duration-300">
              <div className="flex items-center gap-3 mb-3">
                <div
                  className={`w-2 h-2 rounded-full ${settings.githubToken ? "bg-app-status-ready animate-pulse" : "bg-app-tertiary"}`}
                />
                <h3 className="text-xs font-bold text-app-primary uppercase tracking-wider">
                  {settings.githubToken ? "Authorized" : "Guest Mode"}
                </h3>
              </div>
              <p className="text-[10px] text-app-tertiary mb-4 leading-relaxed font-mono">
                {settings.githubToken
                  ? "Authentication active. Rate limit: 5000/hr. Full repository read access granted."
                  : "Anonymous access. Rate limit: 60/hr. Search operations may fail under load."}
              </p>

              <button
                id="dashboard-github-token-trigger"
                data-testid="dashboard-github-token-trigger"
                onClick={() => onOpenSettings(2)}
                className="w-full py-2 bg-app-surface border border-app-border hover:border-app-highlight hover:text-app-primary text-app-secondary rounded text-xs font-bold transition-colors"
              >
                {settings.githubToken ? "UPDATE TOKEN" : "CONFIGURE TOKEN"}
              </button>
            </div>
          </div>

          {/* Discord Community */}
          <div className="bg-app-status-nav/15 border border-app-status-nav/25 rounded-xl p-5 md:p-6 shadow-sm">
            <h2 className="text-xs font-bold text-app-status-nav uppercase tracking-widest mb-4 flex items-center gap-2">
              <DiscordIcon className="h-4 w-4" />
              Community Hub
            </h2>
            <div className="bg-app-canvas border border-app-border rounded-lg p-4 transition-all duration-300">
              <p className="text-[10px] text-app-tertiary mb-4 leading-relaxed font-mono">
                Join the official Discord to share missions, get support, and
                collab with other DCS designers.
              </p>

              <a
                id="dashboard-discord-link"
                data-testid="dashboard-discord-link"
                href={DISCORD_LINKS.COMMUNITY}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2 bg-app-status-nav hover:bg-opacity-90 text-app-canvas rounded text-xs font-bold transition-colors flex items-center justify-center gap-2 shadow-lg shadow-app-status-nav/20"
              >
                JOIN THE DISCORD
              </a>
            </div>
          </div>

          {/* Recent Files */}
          <div className="bg-app-surface border border-app-border rounded-xl p-5 md:p-6 shadow-sm flex-1 flex flex-col">
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
                    <div className="font-bold text-sm text-app-secondary group-hover:text-app-primary truncate mb-1">
                      {session.name}
                    </div>
                    <div className="text-[10px] text-app-tertiary font-mono">
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
                <p className="text-xs font-mono">No recent missions</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
