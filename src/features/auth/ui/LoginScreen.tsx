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
import { APP_VERSION, APP_NAME, AUTHOR_CREDIT } from "../../../core/version";
import {
  SpinnerIcon,
  BookIcon,
  AlertIcon,
  ShieldIcon,
  LockClosedIcon,
  KeyIcon,
  RefreshIcon,
} from "../../../shared/ui/Icons";
import SecurityBriefingModal from "./SecurityBriefingModal";

interface LoginScreenProps {
  onLogin: (apiKey: string, masterPassword?: string) => Promise<boolean>;
  onUnlock?: (password: string) => Promise<boolean>;
  onLoginAsVisitor: () => void;
  isVerifying: boolean;
  isLocked?: boolean;
  authError: string | null;
  onOpenFieldManual: () => void;
}

const LoginScreen: React.FC<LoginScreenProps> = ({
  onLogin,
  onUnlock,
  onLoginAsVisitor,
  isVerifying,
  isLocked = false,
  authError,
  onOpenFieldManual,
}) => {
  const [tempKey, setTempKey] = useState("");
  const [masterPassword, setMasterPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isBriefingOpen, setIsBriefingOpen] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLocked) {
      if (onUnlock) await onUnlock(masterPassword);
    } else {
      await onLogin(tempKey, masterPassword);
    }
  };

  const handleForceUpdate = () => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        for (let registration of registrations) {
          registration.unregister();
        }
        window.location.reload();
      });
    } else {
      window.location.reload();
    }
  };

  return (
    <>
      <div className="flex flex-col h-screen bg-app-canvas text-app-primary items-center justify-center p-6 select-none relative overflow-hidden">
        {/* Background Decor */}
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-app-brand opacity-20 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-app-status-nav/5 rounded-full blur-3xl pointer-events-none"></div>

        <div className="max-w-md w-full bg-app-frame/80 backdrop-blur-xl border border-app-border rounded-2xl overflow-hidden shadow-2xl relative z-10">
          {/* Banner Area */}
          <div className="w-full h-32 bg-app-canvas relative">
            <video
              src="filthysMizMaster.mp4"
              autoPlay
              loop
              muted
              playsInline
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-app-frame to-transparent"></div>
          </div>

          <div className="p-8">
            {/* Logo Area */}
            <div className="flex flex-col items-center mb-8 -mt-16 relative z-20">
              <div className="w-20 h-20 rounded-2xl bg-app-canvas border-2 border-app-brand p-1 shadow-xl mb-4 overflow-hidden">
                <img
                  src="filthysMM.png"
                  alt="MizMaster Logo"
                  className="w-full h-full object-contain"
                />
              </div>
              <h1 className="text-2xl font-bold text-app-primary tracking-tight">
                {isLocked ? "Vault Locked" : APP_NAME}
              </h1>
              <p className="text-app-tertiary text-sm mt-1 font-mono">
                {isLocked
                  ? "Enter Master Password"
                  : `Mission Building Intelligence v${APP_VERSION}`}
              </p>
            </div>

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Hidden username field for accessibility/password managers */}
              <input
                id="auth-login-username-hidden"
                data-testid="auth-login-username-hidden"
                type="text"
                name="username"
                defaultValue="MizMaster Vault"
                readOnly
                autoComplete="username"
                className="hidden"
                aria-hidden="true"
              />
              {!isLocked && (
                <div className="space-y-2">
                  <div className="flex justify-between items-center px-1">
                    <label
                      htmlFor="apiKey"
                      className="text-[10px] font-bold text-app-secondary uppercase tracking-wider"
                    >
                      Gemini API Key
                    </label>
                    <a
                      id="auth-login-api-key-link"
                      data-testid="auth-login-api-key-link"
                      href="https://aistudio.google.com/app/apikey"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[10px] text-app-brand hover:text-opacity-80 hover:underline flex items-center gap-1 font-bold"
                    >
                      GET FREE KEY
                    </a>
                  </div>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-app-tertiary group-focus-within:text-app-brand transition-colors">
                      <KeyIcon className="h-4 w-4 text-app-icon-tertiary group-focus-within:text-app-icon-brand" />
                    </div>
                    <input
                      id="apiKey"
                      data-testid="auth-login-api-key"
                      name="gemini_api_key"
                      autoComplete="current-password"
                      type="password"
                      placeholder="Paste your key here..."
                      className="w-full bg-app-canvas border border-app-highlight rounded-lg pl-10 pr-3 py-3 text-app-primary focus:outline-none focus:border-app-brand focus:ring-1 focus:ring-app-brand disabled:opacity-50 transition-all text-sm placeholder-app-tertiary font-mono"
                      value={tempKey}
                      onChange={(e) => setTempKey(e.target.value)}
                      required
                    />
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <label
                  htmlFor="masterPassword"
                  className="block text-[10px] font-bold text-app-secondary uppercase tracking-widest px-1"
                >
                  {isLocked ? "Unlock Password" : "Create Master Password"}
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-app-tertiary group-focus-within:text-app-brand transition-colors">
                    <LockClosedIcon className="h-4 w-4" />
                  </div>
                  <input
                    id="masterPassword"
                    data-testid="auth-master-password"
                    type={showPassword ? "text" : "password"}
                    value={masterPassword}
                    onChange={(e) => setMasterPassword(e.target.value)}
                    placeholder={
                      isLocked ? "Unlock vault..." : "Min. 8 characters..."
                    }
                    autoComplete={
                      isLocked ? "current-password" : "new-password"
                    }
                    className="block w-full pl-10 pr-10 py-3 bg-app-canvas border border-app-highlight rounded-lg text-app-primary placeholder-app-tertiary focus:outline-none focus:ring-1 focus:ring-app-brand focus:border-app-brand transition-all text-sm font-mono"
                    required
                    minLength={8}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-app-tertiary hover:text-app-secondary transition-colors"
                  >
                    <span className="text-[10px] font-bold uppercase">
                      {showPassword ? "Hide" : "Show"}
                    </span>
                  </button>
                </div>
                {!isLocked && (
                  <p className="text-[10px] text-app-tertiary leading-tight italic px-1">
                    Used to encrypt keys locally. <strong>Never</strong> stored
                    or sent to any server.
                  </p>
                )}
              </div>

              {authError && (
                <div className="flex items-center gap-2 text-app-status-danger text-xs bg-app-status-danger/10 p-2 rounded border border-app-status-danger/20 animate-fadeIn">
                  <AlertIcon className="h-4 w-4" />
                  {authError}
                </div>
              )}

              <div className="space-y-3">
                <button
                  id="auth-login-submit"
                  data-testid="auth-login-submit"
                  type="submit"
                  disabled={
                    isVerifying ||
                    (!isLocked && !tempKey.trim()) ||
                    !masterPassword
                  }
                  className="w-full py-3 bg-app-brand hover:bg-opacity-90 disabled:bg-app-surface disabled:text-app-tertiary text-app-canvas font-bold rounded-lg transition-all flex items-center justify-center gap-2 shadow-lg shadow-app-brand/20 disabled:shadow-none uppercase tracking-tighter"
                >
                  {isVerifying ? (
                    <>
                      <SpinnerIcon className="h-5 w-5 text-app-canvas animate-spin" />
                      {isLocked ? "Unlocking..." : "Initializing..."}
                    </>
                  ) : (
                    <>{isLocked ? "Unlock System" : "Start Secure Session"}</>
                  )}
                </button>

                {!isLocked && (
                  <button
                    id="auth-visitor-login"
                    data-testid="auth-visitor-login"
                    type="button"
                    onClick={onLoginAsVisitor}
                    className="w-full py-2 bg-app-canvas hover:bg-app-surface text-app-secondary hover:text-app-primary border border-app-border rounded-lg text-xs font-bold transition-all uppercase tracking-widest"
                  >
                    Continue as Visitor
                  </button>
                )}
              </div>
            </form>

            {/* Security Briefing Trigger */}
            <div className="mt-4 flex justify-center">
              <button
                id="auth-login-briefing-trigger"
                data-testid="auth-login-briefing-trigger"
                type="button"
                onClick={() => setIsBriefingOpen(true)}
                className="text-[10px] font-bold text-app-tertiary hover:text-app-brand flex items-center gap-1 transition-colors uppercase tracking-widest"
              >
                <ShieldIcon className="h-3.5 w-3.5 text-app-status-ready/70" />
                Security Briefing
              </button>
            </div>

            <div className="mt-6 pt-6 border-t border-app-border text-center flex flex-col gap-3">
              <button
                id="auth-login-manual-trigger"
                data-testid="auth-login-manual-trigger"
                onClick={onOpenFieldManual}
                className="px-4 py-2 bg-app-canvas hover:bg-app-surface text-app-secondary hover:text-app-primary rounded-lg text-[10px] font-bold transition-all border border-app-border hover:border-app-highlight flex items-center justify-center gap-2 mx-auto uppercase tracking-widest w-full sm:w-auto"
              >
                <BookIcon className="h-4 w-4" />
                READ FIELD MANUAL
              </button>

              <button
                id="auth-login-force-update"
                data-testid="auth-login-force-update"
                type="button"
                onClick={handleForceUpdate}
                className="text-[10px] font-bold text-app-tertiary hover:text-app-primary flex items-center justify-center gap-1 transition-colors uppercase tracking-widest mx-auto"
              >
                <RefreshIcon className="h-3 w-3" />
                Force PWA Update
              </button>
            </div>
          </div>
        </div>

        <div className="absolute bottom-4 text-[10px] text-app-tertiary font-mono text-center">
          <p className="font-bold text-app-secondary mb-1">{AUTHOR_CREDIT}</p>
          <p className="font-bold text- uppercase text-[8px]">
            AES-GCM (256-bit) Encrypted Vault • v{APP_VERSION}
          </p>
        </div>
      </div>

      <SecurityBriefingModal
        isOpen={isBriefingOpen}
        onClose={() => setIsBriefingOpen(false)}
      />
    </>
  );
};

export default LoginScreen;
