"use client";

import React from "react";
import { AppSettings } from "../../types";
import { Settings, Lock, Volume2, Bell, Download, Sun, Moon, X, ShieldCheck } from "lucide-react";
import { Button, Card, Badge } from "../ui";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onUpdateSettings: (newSettings: Partial<AppSettings>) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="glass-panel w-full max-w-lg p-6 rounded-3xl relative border border-white/20 shadow-2xl space-y-6">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-full hover:bg-white/10 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-blue-600/20 border border-blue-500/40 text-blue-400">
            <Settings className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">AirDropX Settings</h2>
            <p className="text-xs text-slate-400">Customize security, audio, and transfer behavior.</p>
          </div>
        </div>

        <div className="space-y-4 text-sm text-slate-200">
          {/* E2E Encryption */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900/60 border border-white/10">
            <div className="flex items-center gap-3">
              <Lock className="w-5 h-5 text-purple-400" />
              <div>
                <p className="font-semibold text-white">AES-256 E2E Encryption</p>
                <p className="text-xs text-slate-400">Encrypt chunk payloads using WebCrypto API</p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={settings.encryptionEnabled}
              onChange={(e) => onUpdateSettings({ encryptionEnabled: e.target.checked })}
              className="w-5 h-5 accent-blue-500 rounded cursor-pointer"
            />
          </div>

          {/* Sound Effects */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900/60 border border-white/10">
            <div className="flex items-center gap-3">
              <Volume2 className="w-5 h-5 text-indigo-400" />
              <div>
                <p className="font-semibold text-white">Synthesized Audio Cues</p>
                <p className="text-xs text-slate-400">Play chimes on transfer start & completion</p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={settings.soundEffects}
              onChange={(e) => onUpdateSettings({ soundEffects: e.target.checked })}
              className="w-5 h-5 accent-blue-500 rounded cursor-pointer"
            />
          </div>

          {/* Web Notifications */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900/60 border border-white/10">
            <div className="flex items-center gap-3">
              <Bell className="w-5 h-5 text-amber-400" />
              <div>
                <p className="font-semibold text-white">Desktop Notifications</p>
                <p className="text-xs text-slate-400">Show browser alerts on incoming file offers</p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={settings.desktopNotifications}
              onChange={(e) => onUpdateSettings({ desktopNotifications: e.target.checked })}
              className="w-5 h-5 accent-blue-500 rounded cursor-pointer"
            />
          </div>

          {/* Chunk Size Selector */}
          <div className="p-3 rounded-xl bg-slate-900/60 border border-white/10 flex items-center justify-between">
            <span className="font-semibold text-white">WebRTC Chunk Buffer</span>
            <select
              value={settings.chunkSizeKb}
              onChange={(e) => onUpdateSettings({ chunkSizeKb: Number(e.target.value) })}
              className="bg-slate-950 border border-white/20 rounded-lg px-3 py-1.5 text-xs text-blue-400 font-mono focus:outline-none"
            >
              <option value={32}>32 KB (Safe)</option>
              <option value={64}>64 KB (Balanced)</option>
              <option value={128}>128 KB (High Speed)</option>
            </select>
          </div>
        </div>

        <Button variant="primary" className="w-full py-3" onClick={onClose}>
          Save & Close
        </Button>
      </div>
    </div>
  );
};
