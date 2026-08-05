"use client";

import React from "react";
import { AppMode } from "../../types";
import { Home, Radio, Send, History, Settings } from "lucide-react";

interface BottomNavProps {
  currentMode: AppMode;
  onSelectMode: (mode: AppMode) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ currentMode, onSelectMode }) => {
  return (
    <nav className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 w-[92%] max-w-md bg-slate-950/80 backdrop-blur-xl border border-white/10 rounded-full px-4 py-2.5 shadow-2xl flex items-center justify-between">
      <button
        onClick={() => onSelectMode("home")}
        className={`flex flex-col items-center gap-1 transition-all ${
          currentMode === "home" || currentMode === "landing"
            ? "text-blue-400 font-bold scale-105"
            : "text-slate-400 hover:text-slate-200"
        }`}
      >
        <Home className="w-5 h-5" />
        <span className="text-[10px]">Home</span>
      </button>

      <button
        onClick={() => onSelectMode("radar")}
        className={`flex flex-col items-center gap-1 transition-all ${
          currentMode === "radar"
            ? "text-blue-400 font-bold scale-105"
            : "text-slate-400 hover:text-slate-200"
        }`}
      >
        <Radio className="w-5 h-5" />
        <span className="text-[10px]">Devices</span>
      </button>

      {/* Central Glowing Action Button */}
      <button
        onClick={() => onSelectMode(currentMode === "send" ? "receive" : "send")}
        className="w-12 h-12 -mt-6 rounded-full bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 border-2 border-slate-900 shadow-xl shadow-blue-500/40 flex items-center justify-center text-white active:scale-90 hover:scale-110 transition-all"
        title="Quick Transfer"
      >
        <Send className="w-5 h-5" />
      </button>

      <button
        onClick={() => onSelectMode("history")}
        className={`flex flex-col items-center gap-1 transition-all ${
          currentMode === "history"
            ? "text-blue-400 font-bold scale-105"
            : "text-slate-400 hover:text-slate-200"
        }`}
      >
        <History className="w-5 h-5" />
        <span className="text-[10px]">History</span>
      </button>

      <button
        onClick={() => onSelectMode("settings")}
        className={`flex flex-col items-center gap-1 transition-all ${
          currentMode === "settings"
            ? "text-blue-400 font-bold scale-105"
            : "text-slate-400 hover:text-slate-200"
        }`}
      >
        <Settings className="w-5 h-5" />
        <span className="text-[10px]">Settings</span>
      </button>
    </nav>
  );
};
