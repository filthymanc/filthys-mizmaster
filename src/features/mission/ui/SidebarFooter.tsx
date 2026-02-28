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
import { BookIcon, AlertIcon, GithubIcon, CogIcon } from "../../../shared/ui/Icons";
import { APP_VERSION, AUTHOR_CREDIT } from "../../../core/version";

interface SidebarFooterProps {
  onOpenFieldManual: () => void;
  onOpenSettings: () => void;
  onOpenArmory: () => void;
}

const SidebarFooter: React.FC<SidebarFooterProps> = ({
  onOpenFieldManual,
  onOpenSettings,
  onOpenArmory,
}) => {
  return (
    <div className="p-4 border-t border-app-border space-y-3 bg-app-frame flex flex-col justify-between shrink-0 h-48 lg:h-52">
      {/* Primary Actions Group */}
      <div className="space-y-2">
        <button
          onClick={onOpenSettings}
          className="w-full py-2.5 px-3 bg-app-brand/10 border border-app-brand/30 hover:bg-app-brand/20 hover:border-app-brand/50 text-app-brand rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2 shadow-sm shadow-app-brand/5"
          title="Open System Settings (Ctrl+,)"
        >
          <CogIcon className="h-5 w-5" />
          SYSTEM SETTINGS
        </button>

        <div className="flex gap-2">
            <button
            onClick={onOpenFieldManual}
            className="flex-1 py-2.5 px-3 bg-app-surface border border-app-border hover:bg-app-highlight hover:text-app-primary text-app-secondary rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-sm"
            title="Open Field Manual"
            >
            <BookIcon className="h-4 w-4" />
            MANUAL
            </button>
            <button
            onClick={onOpenArmory}
            className="flex-1 py-2.5 px-3 bg-app-surface border border-app-border hover:bg-app-highlight hover:text-app-primary text-app-secondary rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-sm"
            title="Open Armory (Snippet Library)"
            >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            ARMORY
            </button>
        </div>
      </div>

      {/* Secondary Actions / Info Group */}
      <div className="space-y-3 pt-2 border-t border-app-border/50">
        <div className="flex justify-center gap-6">
          <a
            href="https://github.com/filthymanc/filthys-mizmaster"
            target="_blank"
            rel="noopener noreferrer"
            className="text-app-tertiary hover:text-app-primary transition-colors hover:scale-110 transform"
            title="GitHub Repository"
          >
            <GithubIcon className="h-4 w-4" />
          </a>
          <a
            href="https://github.com/filthymanc/filthys-mizmaster/issues"
            target="_blank"
            rel="noopener noreferrer"
            className="text-app-tertiary hover:text-red-400 transition-colors hover:scale-110 transform"
            title="Report Issue / Contact Developer"
          >
            <AlertIcon className="h-4 w-4" />
          </a>
        </div>

        <div className="text-[10px] text-app-tertiary text-center flex flex-col items-center gap-1.5">
          <p className="font-mono tracking-wider text-app-secondary font-bold">
            v{APP_VERSION}
          </p>
          <p className="opacity-75">{AUTHOR_CREDIT}</p>
          <p className="opacity-40 text-[8px] leading-tight max-w-[200px]">
            DCS World is a trademark of Eagle Dynamics SA.
          </p>
        </div>
      </div>
    </div>
  );
};

export default SidebarFooter;
