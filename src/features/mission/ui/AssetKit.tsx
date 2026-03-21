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

import React, { useState } from "react";
import { AppSettings, MooseBranch } from "../../../core/types";
import { GithubIcon, AlertIcon, ShieldIcon, PlusIcon } from "../../../shared/ui/Icons";

interface AssetKitProps {
  settings: AppSettings;
}

const AssetKit: React.FC<AssetKitProps> = ({ settings }) => {
  const [showCopySuccess, setShowCopySuccess] = useState(false);

  const getMooseDownloadUrl = (branch: MooseBranch) => {
    switch (branch) {
      case "STABLE":
        return "https://github.com/FlightControl-Master/MOOSE/releases";
      case "LEGACY":
        return "https://github.com/FlightControl-Master/MOOSE/tree/master";
      case "DEVELOP":
        return "https://github.com/FlightControl-Master/MOOSE/tree/develop";
      default:
        return "https://github.com/FlightControl-Master/MOOSE";
    }
  };

  const dynamicLoaderSnippet = `--- MOOSE DYNAMIC LOADER SNIPPET ---
-- Point this to your local MOOSE repository path
MOOSE_DEVELOPMENT_FOLDER = "C:/Users/YourName/Saved Games/DCS/Scripts/MOOSE"
assert(loadfile(MOOSE_DEVELOPMENT_FOLDER .. "/Moose Setup/Moose Templates/Moose_Dynamic_Loader.lua"))()`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(dynamicLoaderSnippet);
    setShowCopySuccess(true);
    setTimeout(() => setShowCopySuccess(false), 2000);
  };

  return (
    <div className="flex-1 flex flex-col gap-5 p-4 animate-fadeIn overflow-y-auto custom-scrollbar select-none">
      
      {/* 1. FRAMEWORK STATUS */}
      <section className="space-y-3">
        <h3 className="text-[10px] font-bold text-app-tertiary uppercase tracking-widest flex items-center gap-2">
          <ShieldIcon className="h-3 w-3" />
          Active Framework Loadout
        </h3>
        <div className="bg-app-canvas border border-app-border rounded-xl p-4 space-y-3 shadow-sm transition-all duration-300">
           <div className="flex justify-between items-start">
              <div>
                 <p className="text-xs font-bold text-app-primary">MOOSE / {settings.targetMooseBranch}</p>
                 <p className="text-[9px] text-app-tertiary font-mono mt-1 uppercase">
                   {settings.targetMooseBranch === "STABLE" ? "Production Stable (master-ng)" : 
                    settings.targetMooseBranch === "DEVELOP" ? "Experimental Testing (develop)" : 
                    "Legacy Support (master)"}
                 </p>
              </div>
              <div className={`px-1.5 py-0.5 rounded text-[8px] font-bold border ${settings.isDesanitized ? 'bg-app-status-danger/10 border-app-status-danger text-app-status-danger' : 'bg-app-status-ready/10 border-app-status-ready text-app-status-ready'}`}>
                 {settings.isDesanitized ? "DEV MODE" : "SANITIZED"}
              </div>
           </div>

           <a 
            href={getMooseDownloadUrl(settings.targetMooseBranch)}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center justify-center gap-2 py-2.5 bg-app-surface border border-app-border hover:border-app-brand/50 hover:text-app-primary text-app-secondary rounded-lg text-[10px] font-bold transition-all uppercase tracking-widest group"
           >
             <GithubIcon className="h-4 w-4 group-hover:scale-110 transition-transform" />
             {settings.targetMooseBranch === "DEVELOP" ? "View Develop Source" : "Download Moose.lua"}
           </a>
        </div>
      </section>

      {/* 2. DEVELOPER TOOLS (Conditional) */}
      {settings.isDesanitized && (
        <section className="space-y-3 animate-slideDown">
          <h3 className="text-[10px] font-bold text-app-status-danger uppercase tracking-widest flex items-center gap-2">
            <AlertIcon className="h-3 w-3" />
            Hot-Testing / Loader
          </h3>
          <div className="bg-app-status-danger/5 border border-app-status-danger/20 rounded-xl p-4 space-y-3">
             <p className="text-[9px] text-app-secondary leading-relaxed font-mono">
               Active in **Dev Mode**. Use this snippet to load MOOSE source directly from your local drive for any branch.
             </p>
             <div className="relative group">
                <pre className="p-2.5 bg-app-canvas border border-app-border rounded-lg text-[9px] font-mono text-app-tertiary overflow-x-auto select-all whitespace-pre-wrap">
                  {dynamicLoaderSnippet}
                </pre>
                <button 
                  onClick={copyToClipboard}
                  className="absolute top-2 right-2 p-1.5 bg-app-surface border border-app-border rounded shadow-sm opacity-0 group-hover:opacity-100 transition-opacity hover:text-app-brand"
                >
                  {showCopySuccess ? "✓" : <PlusIcon className="h-3 w-3" />}
                </button>
             </div>
             <p className="text-[8px] text-app-status-danger/70 font-bold uppercase tracking-tighter">
               Requires Desanitized Mission Scripting environment.
             </p>
          </div>
        </section>
      )}

      {/* 3. DML QUICK LINK */}
      <section className="space-y-3">
        <h3 className="text-[10px] font-bold text-app-tertiary uppercase tracking-widest flex items-center gap-2">
          DML Framework
        </h3>
        <div className="bg-app-canvas border border-app-border rounded-xl p-4 flex justify-between items-center shadow-sm">
           <div className="min-w-0">
              <p className="text-xs font-bold text-app-primary">Dynamic Mission Library</p>
              <p className="text-[9px] text-app-tertiary font-mono truncate">Source: GitHub csofranz/DML</p>
           </div>
           <a 
            href="https://github.com/csofranz/DML"
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 bg-app-surface border border-app-border hover:border-app-brand rounded-lg text-app-tertiary hover:text-app-primary transition-all"
           >
             <GithubIcon className="h-4 w-4" />
           </a>
        </div>
      </section>

      {/* 4. MISSION START BRIEFING */}
      <section className="mt-auto space-y-3">
        <div className="p-4 rounded-xl border border-app-border bg-app-surface/40">
           <h4 className="text-[10px] font-bold text-app-secondary uppercase tracking-widest mb-3 border-b border-app-border/50 pb-2">
             Mission Startup Briefing
           </h4>
           <div className="space-y-3">
              {[
                { step: "01", text: "Download and save Moose.lua to your mission folder." },
                { step: "02", text: "In DCS ME, create a 'MISSION START' trigger." },
                { step: "03", text: "Add Action: 'DO SCRIPT FILE' and select Moose.lua." },
                { step: "04", text: "Load your generated mission scripts after Moose." }
              ].map((item, i) => (
                <div key={i} className="flex gap-3 items-start">
                   <span className="text-[9px] font-mono font-bold text-app-brand mt-0.5">{item.step}</span>
                   <span className="text-[10px] text-app-secondary leading-tight">{item.text}</span>
                </div>
              ))}
           </div>
        </div>
      </section>

    </div>
  );
};

export default AssetKit;
