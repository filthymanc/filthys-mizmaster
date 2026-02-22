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

import React, { Fragment } from "react";
import { AppSettings, ApiStatus, Session } from "../../core/types";
import { useSessionData } from "./useSessionData";
import { useChatEngine } from "../chat/useChatEngine";
import { useScrollManager } from "../chat/useScrollManager";
import Dashboard from "./Dashboard";
import ChatInput from "../chat/ChatInput";
import ChatMessage from "../chat/ChatMessage";
import ErrorBoundary from "../../shared/ui/ErrorBoundary";
import { TrashIcon, MenuIcon, EllipsisVerticalIcon } from "../../shared/ui/Icons";
import { AVAILABLE_MODELS } from "../../core/constants";
import { APP_VERSION } from "../../core/version";
import { Menu, Transition } from "@headlessui/react";

interface MissionWorkspaceProps {
  settings: AppSettings;
  apiStatus: ApiStatus;
  sessions: Session[];
  activeSessionId: string | null;
  onSelectSession: (id: string) => void;
  onCreateSession: () => void;
  onImportData: () => void;
  onUpdateSettings: (updates: Partial<AppSettings>) => void;
  apiKey: string;
  touchSession: (id: string) => void;
  onOpenSidebar: () => void;
  onDeleteSession: (id: string) => void;
}

const MissionWorkspace: React.FC<MissionWorkspaceProps> = ({
  settings,
  apiStatus,
  sessions,
  activeSessionId,
  onSelectSession,
  onCreateSession,
  onImportData,
  onUpdateSettings,
  apiKey,
  touchSession,
  onOpenSidebar,
  onDeleteSession,
}) => {
  const { messages, setMessages, clearMessages, isLoadingData } =
    useSessionData(activeSessionId);

  const {
    sendMessage,
    stopGeneration,
    isLoading: isGenerating,
    apiStatus: chatApiStatus,
  } = useChatEngine({
    apiKey,
    model: settings.model,
    isDesanitized: settings.isDesanitized,
    githubToken: settings.githubToken,
    messages,
    setMessages,
    sessionId: activeSessionId,
    isHistoryLoading: isLoadingData,
    onActivity: () => activeSessionId && touchSession(activeSessionId),
  });

  const { messagesEndRef, scrollContainerRef, handleScroll, scrollToBottom } =
    useScrollManager(messages, isGenerating);

  const handleSendMessage = (text: string) => {
    sendMessage(text);
    scrollToBottom();
  };

  const isInitialState = 
    messages.length === 0 || 
    (messages.length === 1 && messages[0].role === "model" && !isLoadingData);

  const currentSessionName = sessions.find((s) => s.id === activeSessionId)?.name || "MizMaster";

  return (
    <div className="flex-1 flex flex-col min-w-0 relative h-full bg-app-canvas">
      {/* Workspace Header */}
      <header className="h-16 border-b border-app-border bg-app-frame/95 backdrop-blur-sm flex items-center justify-between px-4 z-20 shrink-0">
        <div className="flex items-center gap-4 min-w-0">
          <button
            onClick={onOpenSidebar}
            className="lg:hidden p-2 text-app-secondary hover:text-app-primary -ml-2 transition-colors flex-shrink-0 focus:outline-none focus:ring-2 focus:ring-app-brand rounded-full"
            aria-label="Toggle Mission List"
          >
            <MenuIcon className="h-6 w-6" />
          </button>
          <div className="flex flex-col min-w-0">
            <h2 className="font-bold text-base truncate max-w-[150px] sm:max-w-xs md:max-w-md text-app-primary tracking-wide">
              {currentSessionName}
            </h2>
            <div className="flex items-center gap-2 text-[10px] font-mono font-bold tracking-widest mt-0.5">
              <span
                className={
                  chatApiStatus === "error" || chatApiStatus === "offline"
                    ? "text-red-500"
                    : "text-app-brand"
                }
              >
                {(chatApiStatus === "idle" ? "READY" : chatApiStatus.toUpperCase())}
              </span>
              {isGenerating && (
                <span className="text-app-tertiary animate-pulse">| PROCESSING</span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center">
          {/* Mission Actions Menu */}
          <Menu as="div" className="relative inline-block text-left">
            <div>
              <Menu.Button 
                disabled={isGenerating}
                className="p-2 text-app-tertiary hover:text-app-primary focus:outline-none focus:ring-2 focus:ring-app-brand rounded-full disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                aria-label="Mission Actions"
              >
                <EllipsisVerticalIcon className="h-5 w-5" />
              </Menu.Button>
            </div>
            <Transition
              as={Fragment}
              enter="transition ease-out duration-100"
              enterFrom="transform opacity-0 scale-95"
              enterTo="transform opacity-100 scale-100"
              leave="transition ease-in duration-75"
              leaveFrom="transform opacity-100 scale-100"
              leaveTo="transform opacity-0 scale-95"
            >
              <Menu.Items className="absolute right-0 mt-2 w-56 origin-top-right rounded-xl bg-app-overlay border border-app-border shadow-2xl focus:outline-none z-50 overflow-hidden backdrop-blur-md">
                <div className="py-1">
                  <Menu.Item>
                    {({ active }) => (
                      <button
                        onClick={() => clearMessages()}
                        className={`${
                          active ? "bg-app-highlight text-app-primary" : "text-app-secondary"
                        } group flex w-full items-center px-4 py-3 text-sm font-bold transition-colors`}
                      >
                        <TrashIcon className="mr-3 h-4 w-4 text-app-tertiary group-hover:text-red-400 transition-colors" />
                        Clear Chat History
                      </button>
                    )}
                  </Menu.Item>
                  <div className="border-t border-app-border/50 my-1"></div>
                  <Menu.Item>
                    {({ active }) => (
                      <button
                        onClick={() => {
                          if (activeSessionId) onDeleteSession(activeSessionId);
                        }}
                        className={`${
                          active ? "bg-red-500/10 text-red-500" : "text-app-tertiary"
                        } group flex w-full items-center px-4 py-3 text-sm font-bold transition-colors`}
                      >
                        <TrashIcon className="mr-3 h-4 w-4 opacity-70 group-hover:opacity-100" />
                        Delete Mission
                      </button>
                    )}
                  </Menu.Item>
                </div>
              </Menu.Items>
            </Transition>
          </Menu>
        </div>
      </header>

      {/* Main Content Area */}
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-4 md:p-6 scroll-smooth custom-scrollbar"
      >
        <div className="max-w-4xl mx-auto min-h-full flex flex-col">
          {isInitialState ? (
            <Dashboard
              settings={settings}
              apiStatus={apiStatus}
              sessions={sessions}
              activeSessionId={activeSessionId}
              onSelectSession={onSelectSession}
              onCreateSession={onCreateSession}
              onImportData={onImportData}
              onPrompt={handleSendMessage}
              onUpdateSettings={onUpdateSettings}
            />
          ) : (
            <>
              {messages.map((msg) => (
                <ErrorBoundary key={msg.id} scope="message">
                  <ChatMessage message={msg} />
                </ErrorBoundary>
              ))}
              <div ref={messagesEndRef} className="h-4" />
            </>
          )}
        </div>
      </div>

      {/* Input Area */}
      <div className="p-4 bg-app-frame border-t border-app-border shrink-0 z-20">
        <ChatInput
          onSend={handleSendMessage}
          onStop={stopGeneration}
          isGenerating={isGenerating}
          isDesanitized={settings.isDesanitized}
        />
        <div className="max-w-4xl mx-auto mt-2 flex justify-center text-[10px] text-app-tertiary font-mono tracking-widest gap-4 opacity-50">
          <span>{AVAILABLE_MODELS.find(m => m.id === settings.model)?.shortLabel || settings.model}</span>
          <span>•</span>
          <span>v{APP_VERSION}</span>
        </div>
      </div>
    </div>
  );
};

export default MissionWorkspace;
