"use client";

import React from "react";
import { AppMode } from "../../types";
import { Send, Download, Clipboard, History, Settings, Sparkles, Sun, Moon, ShieldCheck, Wifi } from "lucide-react";
import { cn } from "../../lib/utils";

interface NavbarProps {
  currentMode: AppMode;
  onSelectMode: (mode: AppMode) => void;
  isConnected: boolean;
  theme: "dark" | "light";
  onToggleTheme: () => void;
  onOpenAIAssistant: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentMode,
  onSelectMode,
  isConnected,
  theme,
  onToggleTheme,
  onOpenAIAssistant,
}) => {
  const navItems = [
    { id: "send", label: "Send Files", icon: Send },
    { id: "receive", label: "Receive", icon: Download },
    { id: "clipboard", label: "Text Sync", icon: Clipboard },
    { id: "history", label: "History", icon: History },
  ];

  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-xl border-b border-white/10 bg-slate-950/60 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
        {/* Brand Logo */}
        <div
          onClick={() => onSelectMode("landing")}
          className="flex items-center gap-3 cursor-pointer group"
        >
          <div className="relative w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-500 to-purple-500 p-0.5 shadow-lg shadow-blue-500/30 group-hover:scale-105 transition-transform">
            <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-blue-400 group-hover:rotate-12 transition-transform" />
            </div>
          </div>
          <div className="flex flex-col">
            <span className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-100 to-blue-300 bg-clip-text text-transparent">
              AirDrop<span className="text-blue-500">X</span>
            </span>
            <span className="text-[10px] text-blue-400 font-mono tracking-widest uppercase -mt-1">P2P Offline</span>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="hidden md:flex items-center gap-1 bg-slate-900/80 p-1.5 rounded-2xl border border-white/10 shadow-inner">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = currentMode === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectMode(item.id as AppMode)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200",
                  active
                    ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/25 scale-[1.02]"
                    : "text-slate-400 hover:text-white hover:bg-white/5"
                )}
              >
                <Icon className="w-4 h-4" />
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Right Actions */}
        <div className="flex items-center gap-3">
          {/* AI Speed & Diagnostics Button */}
          <button
            onClick={onOpenAIAssistant}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-300 hover:bg-purple-500/20 text-xs font-semibold backdrop-blur-md transition-all hover:scale-105"
          >
            <Sparkles className="w-4 h-4 text-purple-400 animate-pulse" />
            <span className="hidden sm:inline">AI Optimization</span>
          </button>

          {/* Connection Status Pill */}
          <div
            className={cn(
              "hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-medium backdrop-blur-md",
              isConnected
                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                : "bg-rose-500/10 text-rose-400 border-rose-500/30"
            )}
          >
            <span
              className={cn(
                "w-2 h-2 rounded-full animate-ping",
                isConnected ? "bg-emerald-400" : "bg-rose-400"
              )}
            />
            <Wifi className="w-3.5 h-3.5" />
            <span>{isConnected ? "Ready" : "Offline"}</span>
          </div>

          {/* Settings & Theme */}
          <button
            onClick={() => onSelectMode("settings")}
            className="p-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 border border-white/10 transition-colors"
          >
            <Settings className="w-4 h-4" />
          </button>

          <button
            onClick={onToggleTheme}
            className="p-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 border border-white/10 transition-colors"
          >
            {theme === "dark" ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-400" />}
          </button>
        </div>
      </div>
    </header>
  );
};
