"use client";

import React, { useState } from "react";
import { AppSettings } from "../../types";
import {
  Settings,
  Lock,
  Volume2,
  Bell,
  Download,
  Sun,
  Moon,
  X,
  ShieldCheck,
  Zap,
  Smartphone,
  CheckCircle2,
  Trash2,
  RotateCcw,
  Sliders,
  VolumeX,
  Play,
  Monitor,
  Database,
  Radio,
} from "lucide-react";
import { Button, Card, Badge } from "../ui";
import { useAudioSFX } from "../../hooks/useAudioSFX";
import { DEFAULT_SETTINGS } from "../../lib/storage";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onUpdateSettings: (newSettings: Partial<AppSettings>) => void;
}

type TabType = "general" | "security" | "webrtc" | "audio" | "storage";

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>("general");
  const [testNotificationSent, setTestNotificationSent] = useState(false);
  const [storageCleared, setStorageCleared] = useState(false);

  const sfx = useAudioSFX(true);

  if (!isOpen) return null;

  const handleTestAudio = () => {
    sfx.playSuccess();
  };

  const handleTestNotification = async () => {
    if (typeof window !== "undefined" && "Notification" in window) {
      const perm = await Notification.requestPermission();
      if (perm === "granted") {
        new Notification("AirDropX Alert Test", {
          body: "Desktop notifications are active and ready for incoming transfers!",
          icon: "/favicon.ico",
        });
        setTestNotificationSent(true);
        setTimeout(() => setTestNotificationSent(false), 3000);
      }
    }
  };

  const handleClearHistoryAndCache = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("airdropx_transfer_history");
      setStorageCleared(true);
      setTimeout(() => setStorageCleared(false), 3000);
    }
  };

  const handleResetDefaults = () => {
    onUpdateSettings(DEFAULT_SETTINGS);
  };

  const tabs: { id: TabType; label: string; icon: React.FC<{ className?: string }> }[] = [
    { id: "general", label: "General & Device", icon: Smartphone },
    { id: "security", label: "Security & E2E", icon: Lock },
    { id: "webrtc", label: "WebRTC Engine", icon: Zap },
    { id: "audio", label: "Audio & Alerts", icon: Volume2 },
    { id: "storage", label: "Storage & Cache", icon: Database },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xl animate-fadeIn">
      <div className="glass-panel w-full max-w-2xl rounded-[32px] relative border border-white/20 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-6 border-b border-white/10 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-blue-600/20 border border-blue-500/40 text-blue-400">
              <Settings className="w-6 h-6 animate-spin-slow" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-white">AirDropX Settings Center</h2>
              <p className="text-xs text-slate-400">Configure P2P engine, encryption, audio, and device parameters.</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-full hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 2-Column Body Layout */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* Left Column: Category Tabs */}
          <div className="w-full md:w-56 p-3 bg-slate-950/80 border-r border-white/10 flex md:flex-col gap-1 overflow-x-auto md:overflow-y-auto shrink-0">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-left transition-all whitespace-nowrap md:whitespace-normal ${
                    active
                      ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/20 font-bold"
                      : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Right Column: Tab Settings Content */}
          <div className="flex-1 p-6 overflow-y-auto space-y-5 text-sm text-slate-200">
            {/* TAB 1: GENERAL & DEVICE */}
            {activeTab === "general" && (
              <div className="space-y-4 animate-fadeIn">
                <div className="space-y-1.5">
                  <label className="text-xs font-mono uppercase text-slate-400 block font-bold">
                    Device Nickname
                  </label>
                  <input
                    type="text"
                    value={settings.deviceName || "AirDropX Device"}
                    onChange={(e) => onUpdateSettings({ deviceName: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-900 border border-white/15 rounded-xl text-white text-sm focus:outline-none focus:border-blue-500"
                    placeholder="Enter device nickname"
                  />
                  <p className="text-[11px] text-slate-500">Visible to nearby devices on your Wi-Fi network.</p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-900/60 border border-white/10 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-bold text-white">App Color Theme</p>
                      <p className="text-xs text-slate-400">Toggle between Dark and Light mode</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant={settings.theme === "dark" ? "primary" : "glass"}
                        size="sm"
                        onClick={() => onUpdateSettings({ theme: "dark" })}
                        className="py-1 px-3 text-xs"
                      >
                        <Moon className="w-3.5 h-3.5 mr-1" /> Dark
                      </Button>
                      <Button
                        variant={settings.theme === "light" ? "primary" : "glass"}
                        size="sm"
                        onClick={() => onUpdateSettings({ theme: "light" })}
                        className="py-1 px-3 text-xs"
                      >
                        <Sun className="w-3.5 h-3.5 mr-1 text-amber-400" /> Light
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-900/60 border border-white/10">
                  <div>
                    <p className="font-bold text-white">Auto-Accept Incoming Offers</p>
                    <p className="text-xs text-slate-400">Automatically download files from verified session code</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.autoAcceptFiles || false}
                    onChange={(e) => onUpdateSettings({ autoAcceptFiles: e.target.checked })}
                    className="w-5 h-5 accent-blue-500 rounded cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-900/60 border border-white/10">
                  <div>
                    <p className="font-bold text-white">Auto-Save Completed Downloads</p>
                    <p className="text-xs text-slate-400">Save blob directly to browser downloads folder</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.autoSaveDownloads}
                    onChange={(e) => onUpdateSettings({ autoSaveDownloads: e.target.checked })}
                    className="w-5 h-5 accent-blue-500 rounded cursor-pointer"
                  />
                </div>
              </div>
            )}

            {/* TAB 2: SECURITY & E2E */}
            {activeTab === "security" && (
              <div className="space-y-4 animate-fadeIn">
                <div className="p-4 rounded-2xl bg-purple-950/20 border border-purple-500/30 flex items-start gap-3">
                  <ShieldCheck className="w-6 h-6 text-purple-400 shrink-0 mt-0.5" />
                  <div className="text-xs space-y-1">
                    <p className="font-bold text-purple-300">WebCrypto AES-256 GCM Engine</p>
                    <p className="text-slate-300 leading-relaxed">
                      Files are encrypted chunk-by-chunk using ephemeral browser keys. No server ever sees unencrypted bytes.
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-900/60 border border-white/10">
                  <div>
                    <p className="font-bold text-white">AES-256 Chunk Payload Encryption</p>
                    <p className="text-xs text-slate-400">Encrypt WebRTC DataChannel frames</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.encryptionEnabled}
                    onChange={(e) => onUpdateSettings({ encryptionEnabled: e.target.checked })}
                    className="w-5 h-5 accent-blue-500 rounded cursor-pointer"
                  />
                </div>

                <div className="p-4 rounded-2xl bg-slate-900/60 border border-white/10 space-y-2">
                  <label className="text-xs font-mono uppercase text-slate-400 block font-bold">
                    Optional Session Password Lock
                  </label>
                  <input
                    type="password"
                    value={settings.sessionPassword || ""}
                    onChange={(e) => onUpdateSettings({ sessionPassword: e.target.value })}
                    placeholder="Leave blank for open PIN room"
                    className="w-full px-4 py-2.5 bg-slate-950 border border-white/15 rounded-xl text-white text-sm focus:outline-none focus:border-blue-500"
                  />
                  <p className="text-[11px] text-slate-500">Requires receivers to supply password before accepting files.</p>
                </div>
              </div>
            )}

            {/* TAB 3: WEBRTC ENGINE */}
            {activeTab === "webrtc" && (
              <div className="space-y-4 animate-fadeIn">
                <div className="p-4 rounded-2xl bg-slate-900/60 border border-white/10 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-bold text-white">WebRTC DataChannel Chunk Size</p>
                      <p className="text-xs text-slate-400">Adjust packet size based on network quality</p>
                    </div>
                    <select
                      value={settings.chunkSizeKb}
                      onChange={(e) => onUpdateSettings({ chunkSizeKb: Number(e.target.value) })}
                      className="bg-slate-950 border border-white/20 rounded-xl px-3 py-2 text-xs text-blue-400 font-mono font-bold focus:outline-none"
                    >
                      <option value={32}>32 KB (Safe / Low Latency)</option>
                      <option value={64}>64 KB (Balanced Default)</option>
                      <option value={128}>128 KB (High Speed Local)</option>
                      <option value={256}>256 KB (Maximum Throughput)</option>
                    </select>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-900/60 border border-white/10 space-y-2 text-xs">
                  <div className="flex items-center gap-2 font-bold text-white">
                    <Zap className="w-4 h-4 text-amber-400" /> P2P DataChannel Backpressure Flow Control
                  </div>
                  <p className="text-slate-400 leading-relaxed">
                    AirDropX dynamically pauses chunk queuing when <code className="font-mono text-purple-300">bufferedAmount</code> exceeds threshold to prevent packet loss.
                  </p>
                </div>
              </div>
            )}

            {/* TAB 4: AUDIO & ALERTS */}
            {activeTab === "audio" && (
              <div className="space-y-4 animate-fadeIn">
                <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-900/60 border border-white/10">
                  <div>
                    <p className="font-bold text-white">Synthesized Web Audio Chimes</p>
                    <p className="text-xs text-slate-400">Play audio cues on transfer start, completion & error</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.soundEffects}
                    onChange={(e) => onUpdateSettings({ soundEffects: e.target.checked })}
                    className="w-5 h-5 accent-blue-500 rounded cursor-pointer"
                  />
                </div>

                <Button
                  variant="glass"
                  size="sm"
                  onClick={handleTestAudio}
                  className="w-full py-2.5 border-indigo-500/30 text-indigo-300 hover:bg-indigo-500/10"
                >
                  <Play className="w-4 h-4 mr-2" /> Test Synthesized Success Chime
                </Button>

                <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-900/60 border border-white/10">
                  <div>
                    <p className="font-bold text-white">Desktop System Notifications</p>
                    <p className="text-xs text-slate-400">Show native browser popups on incoming file offers</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.desktopNotifications}
                    onChange={(e) => onUpdateSettings({ desktopNotifications: e.target.checked })}
                    className="w-5 h-5 accent-blue-500 rounded cursor-pointer"
                  />
                </div>

                <Button
                  variant="glass"
                  size="sm"
                  onClick={handleTestNotification}
                  className="w-full py-2.5 border-amber-500/30 text-amber-300 hover:bg-amber-500/10"
                >
                  <Bell className="w-4 h-4 mr-2" />
                  {testNotificationSent ? "Test Alert Sent!" : "Test Desktop System Notification"}
                </Button>
              </div>
            )}

            {/* TAB 5: STORAGE & CACHE */}
            {activeTab === "storage" && (
              <div className="space-y-4 animate-fadeIn">
                <div className="p-4 rounded-2xl bg-slate-900/60 border border-white/10 space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-white">Local Storage & History Cache</span>
                    <Badge variant="blue">Active</Badge>
                  </div>
                  <p className="text-xs text-slate-400">
                    AirDropX stores transfer logs and configuration locally in your browser storage.
                  </p>

                  <div className="flex flex-col sm:flex-row gap-2 pt-2">
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={handleClearHistoryAndCache}
                      className="flex-1 py-2 text-xs"
                    >
                      <Trash2 className="w-3.5 h-3.5 mr-1" />
                      {storageCleared ? "Transfer History Cleared!" : "Clear Local Transfer History"}
                    </Button>

                    <Button
                      variant="glass"
                      size="sm"
                      onClick={handleResetDefaults}
                      className="flex-1 py-2 text-xs border-white/20 text-slate-300"
                    >
                      <RotateCcw className="w-3.5 h-3.5 mr-1" /> Reset Settings to Default
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/10 bg-slate-950/80 flex items-center justify-between">
          <span className="text-[11px] text-slate-500 font-mono">AirDropX v1.0.0 • E2E Encrypted</span>
          <Button variant="primary" className="px-6 py-2 text-xs font-bold" onClick={onClose}>
            Save & Close
          </Button>
        </div>
      </div>
    </div>
  );
};

