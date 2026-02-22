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

import React, { useState, Fragment } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { GithubIcon, YoutubeIcon, DiscordIcon, GlobeIcon, XIcon } from "./Icons";
import { APP_VERSION } from "../../core/version";
import { MANUAL_CONTENT } from "../../data/manualContent";

interface FieldManualProps {
  isOpen: boolean;
  onClose: () => void;
}

type TabId =
  | "briefing"
  | "systems"
  | "controls"
  | "tactics"
  | "developer"
  | "intel"
  | "legal";

// Helper: Renders text with basic bolding (**text**) support
const renderText = (text: string) => {
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={i} className="font-bold text-inherit">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return <span key={i}>{part}</span>;
  });
};

// Helper: Shortcut Row
const ShortcutRow: React.FC<{ keys: string[]; description: string }> = ({
  keys,
  description,
}) => (
  <div className="flex items-center justify-between py-2 border-b border-app-border/50 last:border-0">
    <span className="text-sm text-app-secondary">{description}</span>
    <div className="flex gap-1">
      {keys.map((k, i) => (
        <React.Fragment key={k}>
          <kbd className="min-w-[24px] px-2 py-1 bg-app-surface border-b-2 border-app-border rounded text-xs font-mono font-bold text-app-tertiary flex items-center justify-center shadow-sm">
            {k}
          </kbd>
          {i < keys.length - 1 && (
            <span className="text-app-tertiary self-center font-bold text-xs">+</span>
          )}
        </React.Fragment>
      ))}
    </div>
  </div>
);

const FieldManual: React.FC<FieldManualProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<TabId>("briefing");

  const tabs: { id: TabId; label: string; shortLabel: string; icon: React.ReactNode }[] = [
    {
      id: "briefing",
      label: "Briefing",
      shortLabel: "Info",
      icon: (
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      ),
    },
    {
      id: "systems",
      label: "Systems",
      shortLabel: "Sys",
      icon: (
        <>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </>
      ),
    },
    {
      id: "controls",
      label: "Controls",
      shortLabel: "Keys",
      icon: (
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a1 1 0 011-1h12a1 1 0 011 1v10a1 1 0 01-1 1H4a1 1 0 01-1-1V5zm7 1a1 1 0 011 1v7a1 1 0 01-1 1h-2a1 1 0 01-1-1V7a1 1 0 011-1h2z" />
      ),
    },
    {
      id: "tactics",
      label: "Comms",
      shortLabel: "Comms",
      icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />,
    },
    {
      id: "developer",
      label: "Dev Log",
      shortLabel: "Dev",
      icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />,
    },
    {
      id: "intel",
      label: "Resources",
      shortLabel: "Links",
      icon: (
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
      ),
    },
    {
      id: "legal",
      label: "Legal",
      shortLabel: "Law",
      icon: (
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
      ),
    },
  ];

  const content = MANUAL_CONTENT;

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/80 backdrop-blur-md" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-hidden flex items-center justify-center p-0 md:p-6">
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0 scale-95 translate-y-4 md:translate-y-0"
            enterTo="opacity-100 scale-100 translate-y-0"
            leave="ease-in duration-200"
            leaveFrom="opacity-100 scale-100 translate-y-0"
            leaveTo="opacity-0 scale-95 translate-y-4 md:translate-y-0"
          >
            <Dialog.Panel className="w-full max-w-6xl h-[100dvh] md:h-[85vh] bg-app-frame md:rounded-2xl border-0 md:border border-app-border shadow-2xl flex flex-col md:flex-row overflow-hidden transform transition-all">
              
              {/* --- DESKTOP/TABLET SIDEBAR --- */}
              <div className="hidden md:flex w-64 bg-app-surface border-r border-app-border flex-col shrink-0">
                <div className="p-6 border-b border-app-border shrink-0">
                  <Dialog.Title as="h2" className="text-xl font-bold text-app-primary tracking-widest">
                    FIELD MANUAL
                  </Dialog.Title>
                  <p className="text-xs text-app-tertiary font-mono font-bold mt-1 tracking-wider">
                    v{APP_VERSION} Reference
                  </p>
                </div>

                <nav className="flex-1 p-3 space-y-1.5 overflow-y-auto custom-scrollbar">
                  {tabs.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all focus:outline-none focus:ring-2 focus:ring-app-brand ${
                        activeTab === tab.id
                          ? "bg-app-brand text-white shadow-lg shadow-app-brand/20"
                          : "text-app-secondary hover:text-app-primary hover:bg-app-canvas"
                      }`}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5 opacity-80"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        {tab.icon}
                      </svg>
                      {tab.label}
                    </button>
                  ))}
                </nav>

                <div className="p-4 border-t border-app-border shrink-0">
                  <button
                    onClick={onClose}
                    className="w-full py-2.5 bg-app-canvas border border-app-border hover:bg-app-highlight text-app-primary rounded-lg font-bold text-xs uppercase tracking-wider transition-colors focus:outline-none focus:ring-2 focus:ring-app-brand"
                  >
                    Close Manual
                  </button>
                </div>
              </div>

              {/* --- MOBILE HEADER & NAV --- */}
              <div className="md:hidden flex flex-col shrink-0 bg-app-surface border-b border-app-border z-10 shadow-sm">
                {/* Header Row */}
                <div className="flex items-center justify-between p-4 border-b border-app-border/50">
                  <div className="flex flex-col">
                    <Dialog.Title as="h2" className="text-base font-bold text-app-primary tracking-widest">
                      FIELD MANUAL
                    </Dialog.Title>
                    <p className="text-[10px] text-app-tertiary font-mono font-bold">
                      v{APP_VERSION}
                    </p>
                  </div>
                  <button
                    onClick={onClose}
                    className="p-2 text-app-tertiary hover:text-app-primary focus:outline-none focus:ring-2 focus:ring-app-brand rounded-full bg-app-canvas border border-app-border"
                  >
                    <XIcon className="h-5 w-5" />
                  </button>
                </div>

                {/* Horizontal Scrollable Tabs */}
                <nav className="flex overflow-x-auto no-scrollbar py-2 px-2 gap-2" aria-label="Manual Sections">
                  {tabs.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex flex-col items-center justify-center shrink-0 min-w-[72px] p-2 rounded-xl transition-all focus:outline-none focus:ring-2 focus:ring-app-brand ${
                        activeTab === tab.id
                          ? "bg-app-brand text-white shadow-md shadow-app-brand/20"
                          : "bg-app-canvas text-app-secondary border border-app-border hover:text-app-primary"
                      }`}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5 mb-1"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        {tab.icon}
                      </svg>
                      <span className="text-[10px] font-bold uppercase tracking-wider">{tab.shortLabel}</span>
                    </button>
                  ))}
                </nav>
              </div>

              {/* --- CONTENT AREA --- */}
              <div className="flex-1 overflow-y-auto bg-app-frame p-4 md:p-10 custom-scrollbar scroll-smooth relative">
                <div className="max-w-3xl mx-auto pb-12">
                  {/* --- TAB: BRIEFING (Brand Color) --- */}
                  {activeTab === "briefing" && (
                    <div className="space-y-8 animate-fadeIn">
                      <div>
                        <h3 className="text-app-brand font-bold text-xs uppercase tracking-widest mb-2">
                          {content.briefing.concept.subtitle}
                        </h3>
                        <h1 className="text-2xl md:text-3xl font-bold text-app-primary mb-4 leading-tight">
                          {content.briefing.concept.title}
                        </h1>
                        <p className="text-app-secondary leading-relaxed text-base md:text-lg">
                          {content.briefing.concept.text}
                        </p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                        {content.briefing.features.map((feature, idx) => (
                          <div
                            key={idx}
                            className="p-5 bg-app-canvas rounded-xl border border-app-border shadow-sm"
                          >
                            <h4 className="font-bold text-app-primary mb-2 flex items-center gap-2 text-sm uppercase tracking-wide">
                              {feature.iconType === "device" && (
                                <svg className="h-4 w-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                </svg>
                              )}
                              {feature.iconType === "lock" && (
                                <svg className="h-4 w-4 text-app-brand" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                </svg>
                              )}
                              {feature.title}
                            </h4>
                            <p className="text-sm text-app-secondary leading-relaxed">
                              {renderText(feature.text)}
                            </p>
                          </div>
                        ))}
                      </div>

                      <div className="p-6 bg-app-brand/5 border border-app-brand/20 rounded-xl">
                        <h3 className="text-app-brand font-bold text-xs uppercase tracking-widest mb-3">
                          {content.briefing.engine.subtitle}
                        </h3>
                        <p className="text-app-primary leading-relaxed text-sm">
                          {renderText(content.briefing.engine.text)}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* --- TAB: SYSTEMS (Blue) --- */}
                  {activeTab === "systems" && (
                    <div className="space-y-8 animate-fadeIn">
                      <div>
                        <h3 className="text-blue-500 font-bold text-xs uppercase tracking-widest mb-4">
                          {content.systems.interface.subtitle}
                        </h3>

                        <div className="space-y-6">
                          {content.systems.interface.sections.map((section, idx) => (
                            <div
                              key={idx}
                              className="bg-app-canvas border border-app-border rounded-xl overflow-hidden shadow-sm"
                            >
                              <div className="px-4 py-3 bg-app-surface/80 border-b border-app-border font-bold text-app-primary text-xs uppercase tracking-wider flex items-center gap-2">
                                <span className="flex-none w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center text-[10px]">
                                  {idx + 1}
                                </span>
                                {section.title}
                              </div>
                              <div className="divide-y divide-app-border/50">
                                {section.items.map((item, i) => (
                                  <div key={i} className="p-4 flex flex-col sm:flex-row gap-2 sm:gap-4">
                                    <span
                                      className={`font-mono text-${item.color}-400 text-xs w-28 shrink-0 font-bold bg-${item.color}-500/10 px-2 py-1 rounded w-max sm:w-24 text-center h-fit`}
                                    >
                                      {item.label}
                                    </span>
                                    <p className="text-app-secondary text-sm leading-relaxed flex-1 mt-1 sm:mt-0">
                                      {renderText(item.text)}
                                    </p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="mt-10">
                        <h3 className="text-blue-500 font-bold text-xs uppercase tracking-widest mb-4">
                          {content.systems.librarian.subtitle}
                        </h3>
                        <p className="text-app-primary leading-relaxed text-sm mb-6 bg-app-canvas p-4 rounded-xl border border-app-border">
                          {renderText(content.systems.librarian.text)}
                        </p>

                        <div className="p-5 md:p-6 bg-emerald-500/5 border border-emerald-500/20 rounded-xl">
                          <h4 className="font-bold text-app-primary mb-3 flex items-center gap-2 text-sm uppercase tracking-wider">
                            <svg className="h-5 w-5 text-emerald-500" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                            </svg>
                            {content.systems.librarian.auth.title}
                          </h4>
                          <p className="text-sm text-app-secondary leading-relaxed mb-5">
                            {renderText(content.systems.librarian.auth.text)}
                          </p>
                          <div className="space-y-2 bg-app-surface/50 p-4 rounded-lg border border-app-border/50">
                            {content.systems.librarian.auth.instructions.map((step, i) => (
                              <div key={i} className="flex gap-3">
                                <span className="text-emerald-500 font-mono text-xs">{i+1}.</span>
                                <p className="text-xs md:text-sm text-app-primary font-mono leading-relaxed">
                                  {step}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* --- TAB: CONTROLS (Yellow/Purple) --- */}
                  {activeTab === "controls" && (
                    <div className="animate-fadeIn">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
                        {/* Nav */}
                        <div className="bg-app-canvas p-5 rounded-xl border border-app-border">
                          <h3 className="text-xs font-bold text-app-brand uppercase tracking-widest mb-4 flex items-center gap-2">
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                            {content.controls.navigation.title}
                          </h3>
                          <div className="space-y-1">
                            {content.controls.navigation.items.map((item, idx) => (
                              <ShortcutRow
                                key={idx}
                                keys={item.keys}
                                description={item.description}
                              />
                            ))}
                          </div>
                        </div>

                        {/* Editor */}
                        <div className="bg-app-canvas p-5 rounded-xl border border-app-border">
                          <h3 className="text-xs font-bold text-blue-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                            {content.controls.editor.title}
                          </h3>
                          <div className="space-y-1">
                            {content.controls.editor.items.map((item, idx) => (
                              <ShortcutRow
                                key={idx}
                                keys={item.keys}
                                description={item.description}
                              />
                            ))}
                          </div>
                        </div>

                        {/* System */}
                        <div className="bg-app-canvas p-5 rounded-xl border border-app-border md:col-span-2">
                          <h3 className="text-xs font-bold text-red-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" /></svg>
                            {content.controls.system.title}
                          </h3>
                          <div className="space-y-1 grid grid-cols-1 md:grid-cols-2 gap-x-8">
                            {content.controls.system.items.map((item, idx) => (
                              <ShortcutRow
                                key={idx}
                                keys={item.keys}
                                description={item.description}
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* --- TAB: COMMS (Tactics) (Purple) --- */}
                  {activeTab === "tactics" && (
                    <div className="space-y-10 animate-fadeIn">
                      <div>
                        <h3 className="text-purple-500 font-bold text-xs uppercase tracking-widest mb-4">
                          {content.tactics.prompt.subtitle}
                        </h3>
                        <div className="space-y-4">
                          {content.tactics.prompt.cards.map((card, idx) => (
                            <div
                              key={idx}
                              className={`p-5 bg-app-canvas border border-app-border rounded-xl border-l-4 shadow-sm ${card.type === "trap" ? "border-l-red-500" : "border-l-app-brand"}`}
                            >
                              <strong
                                className={`${card.type === "trap" ? "text-red-400" : "text-app-brand"} text-xs uppercase tracking-wider block mb-2`}
                              >
                                {card.title}
                              </strong>
                              <div className="bg-app-surface p-3 rounded text-sm text-app-primary italic font-serif border border-app-border/50 mb-3">
                                {card.example}
                              </div>
                              <p className="text-sm text-app-secondary leading-relaxed">
                                <span className="font-bold text-app-primary">
                                  {card.explanationLabel}
                                </span>{" "}
                                {card.explanation}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="pt-6 border-t border-app-border">
                        <h3 className="text-purple-500 font-bold text-xs uppercase tracking-widest mb-4">
                          {content.tactics.errors.subtitle}
                        </h3>
                        <div className="space-y-4">
                          {content.tactics.errors.items.map((item, idx) => {
                            const styles = [
                              { border: "border-l-orange-500", bg: "bg-orange-500/10", title: "text-orange-400" },
                              { border: "border-l-blue-500", bg: "bg-blue-500/10", title: "text-blue-400" },
                              { border: "border-l-pink-500", bg: "bg-pink-500/10", title: "text-pink-400" },
                            ];
                            const style = styles[idx % styles.length];

                            return (
                              <div
                                key={idx}
                                className={`p-5 bg-app-canvas border border-app-border rounded-xl border-l-4 ${style.border} shadow-sm`}
                              >
                                <div className="flex items-center gap-3 mb-2">
                                  <span className={`flex-none w-6 h-6 rounded-full ${style.bg} ${style.title} flex items-center justify-center font-bold text-xs border border-current/20`}>
                                    !
                                  </span>
                                  <strong className={`${style.title} font-bold text-sm tracking-wide uppercase`}>
                                    {item.label}
                                  </strong>
                                </div>
                                <p className="text-sm text-app-secondary leading-relaxed pl-9">
                                  {renderText(item.text)}
                                </p>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* --- TAB: DEV (Slate) --- */}
                  {activeTab === "developer" && (
                    <div className="space-y-10 animate-fadeIn">
                      <div className="p-6 bg-app-canvas rounded-xl border border-app-border shadow-sm">
                        <h3 className="text-app-primary font-bold text-sm uppercase tracking-widest mb-3 flex items-center gap-2">
                           <svg className="h-5 w-5 text-app-brand" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                          {content.developer.intent.subtitle}
                        </h3>
                        <p className="text-app-secondary leading-relaxed text-sm md:text-base">
                          {renderText(content.developer.intent.text)}
                        </p>
                      </div>

                      <div>
                        <h3 className="text-app-tertiary font-bold text-xs uppercase tracking-widest mb-4">
                          {content.developer.inspiration.subtitle}
                        </h3>
                        <div className="relative p-6 md:p-8 bg-app-canvas border border-app-border rounded-xl text-app-secondary text-sm md:text-base leading-relaxed">
                          <svg className="absolute top-4 left-4 h-8 w-8 text-app-border opacity-50" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
                          </svg>
                          <div className="pl-8 italic">
                            {renderText(content.developer.inspiration.text)}
                          </div>
                          <div className="mt-6 flex items-center gap-3 pl-8">
                             <div className="h-px w-8 bg-app-brand"></div>
                             <span className="text-xs font-bold tracking-widest uppercase text-app-primary">
                              {content.developer.inspiration.author}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="p-6 bg-app-surface rounded-xl border border-app-border">
                        <h3 className="text-app-tertiary font-bold text-xs uppercase tracking-widest mb-4 flex items-center gap-2">
                           <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg>
                          {content.developer.stack.subtitle}
                        </h3>
                        <div className="flex flex-wrap gap-2">
                          {content.developer.stack.items.map((item, idx) => (
                            <span key={idx} className="px-3 py-1.5 bg-app-canvas border border-app-border rounded font-mono text-xs text-app-secondary">
                                {item}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* --- TAB: RESOURCES (Orange) --- */}
                  {activeTab === "intel" && (
                    <div className="space-y-6 animate-fadeIn">
                      <h3 className="text-orange-500 font-bold text-xs uppercase tracking-widest mb-4">
                        {content.intel.subtitle}
                      </h3>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {content.intel.links.map((link, idx) => {
                          interface LinkItem {
                            title: string;
                            url: string;
                            author: string;
                            description: string;
                            type?: "github" | "youtube" | "discord" | "web" | "default";
                          }
                          const linkItem = link as LinkItem;
                          const type = linkItem.type || "default";

                          return (
                            <a
                              key={idx}
                              href={link.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex flex-col p-5 bg-app-canvas border border-app-border hover:border-orange-500/50 hover:bg-app-surface hover:shadow-lg rounded-xl transition-all group border-l-4 border-l-orange-500"
                            >
                              <div className="flex items-start justify-between mb-3">
                                <div>
                                  <h4 className="font-bold text-app-primary group-hover:text-orange-400 transition-colors flex items-center gap-2 text-sm">
                                    {type === "github" && <GithubIcon className="h-4 w-4" />}
                                    {type === "youtube" && <YoutubeIcon className="h-4 w-4 text-red-500" />}
                                    {type === "discord" && <DiscordIcon className="h-4 w-4 text-[#5865F2]" />}
                                    {type === "web" && <GlobeIcon className="h-4 w-4" />}
                                    {type === "default" && <GlobeIcon className="h-4 w-4" />}
                                    {link.title}
                                  </h4>
                                  <p className="text-[10px] font-bold tracking-wider text-app-tertiary uppercase mt-1">
                                    {link.author}
                                  </p>
                                </div>
                                <svg className="h-4 w-4 text-app-border group-hover:text-orange-400 transition-colors transform group-hover:-translate-y-1 group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                </svg>
                              </div>
                              <p className="text-sm text-app-secondary leading-relaxed flex-1">
                                {link.description}
                              </p>
                            </a>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* --- TAB: LEGAL (Red) --- */}
                  {activeTab === "legal" && (
                    <div className="space-y-10 animate-fadeIn">
                      <div className="p-6 bg-red-500/5 border border-red-500/20 rounded-xl">
                        <h3 className="text-red-500 font-bold text-xs uppercase tracking-widest mb-4 flex items-center gap-2">
                          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                          {content.legal.sovereignty.subtitle}
                        </h3>
                        <div className="space-y-4">
                          {content.legal.sovereignty.items.map((item, idx) => (
                            <div key={idx} className="flex gap-4">
                              <span className="flex-none w-6 h-6 rounded-full bg-red-500/20 text-red-500 flex items-center justify-center font-bold text-xs border border-red-500/30">
                                {idx + 1}
                              </span>
                              <div>
                                <strong className="text-app-primary block mb-1 text-sm tracking-wide uppercase">
                                  {item.label}
                                </strong>
                                <p className="text-app-secondary text-sm leading-relaxed">
                                  {item.text}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div>
                        <h3 className="text-app-primary font-bold text-xs uppercase tracking-widest mb-4">
                          {content.legal.credits.subtitle}
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {content.legal.credits.items.map((credit, idx) => (
                            <div
                              key={idx}
                              className="p-4 bg-app-canvas border border-app-border rounded-xl border-l-4 border-l-app-border shadow-sm"
                            >
                              <div className="font-bold text-app-primary text-sm">
                                {credit.title}
                              </div>
                              <div className="text-xs font-bold tracking-widest text-app-tertiary mt-1 uppercase">
                                {credit.author}
                              </div>
                              <div className="text-[10px] text-app-tertiary font-mono mt-3 pt-3 border-t border-app-border/50">
                                {credit.license}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="bg-app-canvas border border-app-border rounded-xl overflow-hidden">
                        <div className="p-4 bg-app-surface border-b border-app-border">
                          <h3 className="text-app-tertiary font-bold text-xs uppercase tracking-widest flex items-center gap-2">
                             <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                            {content.legal.license.subtitle}
                          </h3>
                        </div>
                        <div className="p-5 overflow-auto h-64 custom-scrollbar bg-[#0d1117] text-[#c9d1d9]">
                          <pre className="text-[10px] font-mono whitespace-pre-wrap leading-relaxed">
                            {content.legal.license.text}
                          </pre>
                        </div>
                        <div className="p-4 bg-app-surface border-t border-app-border text-center">
                          <p className="text-[10px] text-app-tertiary italic">
                            {content.legal.license.disclaimer}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                </div>
              </div>
            </Dialog.Panel>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition>
  );
};

export default FieldManual;
