"use client";

import React from "react";
import { AppMode, DeviceInfo, HistoryRecord } from "../../types";
import { Send, Download, Search, Crown, Smartphone, FileText, FolderArchive, Video, ChevronRight, User } from "lucide-react";
import { Card, Badge, Button } from "../ui";
import { formatBytes } from "../../lib/utils";

interface HomeViewProps {
  onSelectMode: (mode: AppMode) => void;
  activeDevices: DeviceInfo[];
  historyRecords: HistoryRecord[];
  onConnectDevice?: (deviceId: string) => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  onSelectMode,
  activeDevices,
  historyRecords,
  onConnectDevice,
}) => {
  return (
    <div className="max-w-md mx-auto px-4 pt-4 pb-28 space-y-6 animate-fadeIn">
      {/* Top Profile Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-purple-600 p-0.5 shadow-lg shadow-blue-500/20">
            <div className="w-full h-full bg-slate-900 rounded-[10px] flex items-center justify-center font-bold text-blue-400">
              <User className="w-5 h-5" />
            </div>
          </div>
          <div>
            <h2 className="text-lg font-black tracking-tight text-white flex items-center gap-1.5">
              AirDropX <Crown className="w-4 h-4 text-amber-400 fill-amber-400" />
            </h2>
            <p className="text-[11px] text-slate-400">Offline P2P Engine</p>
          </div>
        </div>

        <button
          onClick={() => onSelectMode("settings")}
          className="w-9 h-9 rounded-full bg-slate-900 border border-white/10 flex items-center justify-center text-slate-300 hover:text-white"
        >
          <User className="w-4 h-4" />
        </button>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder="Search files or devices..."
          className="w-full pl-10 pr-4 py-2.5 bg-slate-900/90 border border-white/10 rounded-2xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/50"
        />
      </div>

      {/* Big Action Cards (Send & Receive) */}
      <div className="grid grid-cols-2 gap-3.5">
        {/* Send Files Card */}
        <button
          onClick={() => onSelectMode("send")}
          className="p-5 rounded-3xl bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 border border-blue-400/30 text-left space-y-3 shadow-xl shadow-blue-600/25 active:scale-95 hover:scale-[1.02] transition-all relative overflow-hidden group"
        >
          <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center text-white shadow-inner">
            <Send className="w-6 h-6 transform group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-white">Send Files</h3>
            <p className="text-[11px] text-blue-200/80">Send to nearby devices</p>
          </div>
        </button>

        {/* Receive Files Card */}
        <button
          onClick={() => onSelectMode("receive")}
          className="p-5 rounded-3xl bg-gradient-to-br from-purple-600 via-purple-700 to-pink-800 border border-purple-400/30 text-left space-y-3 shadow-xl shadow-purple-600/25 active:scale-95 hover:scale-[1.02] transition-all relative overflow-hidden group"
        >
          <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center text-white shadow-inner">
            <Download className="w-6 h-6 transform group-hover:translate-y-1 transition-transform" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-white">Receive Files</h3>
            <p className="text-[11px] text-purple-200/80">Receive from devices</p>
          </div>
        </button>
      </div>

      {/* Recent Transfers Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-white">Recent Transfers</h3>
          <button
            onClick={() => onSelectMode("history")}
            className="text-xs text-blue-400 hover:text-blue-300 font-medium flex items-center gap-0.5"
          >
            See All <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="space-y-2">
          {historyRecords.slice(0, 3).map((rec) => (
            <div
              key={rec.id}
              className="p-3 rounded-2xl bg-slate-900/60 border border-white/5 flex items-center justify-between text-xs"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center font-bold">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-semibold text-white truncate max-w-[160px]">{rec.fileName}</p>
                  <p className="text-[10px] text-slate-400 font-mono">
                    {formatBytes(rec.fileSize)} • {rec.direction === "sent" ? "Sent" : "Received"}
                  </p>
                </div>
              </div>
              <span className="text-[10px] text-slate-500">Just now</span>
            </div>
          ))}

          {historyRecords.length === 0 && (
            <div className="p-4 text-center text-xs text-slate-500 bg-slate-900/40 rounded-2xl border border-white/5">
              No recent transfers yet. Tap Send Files to start!
            </div>
          )}
        </div>
      </div>

      {/* Nearby Devices Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-white">Nearby Devices</h3>
          <Badge variant="blue" className="text-[10px]">
            {activeDevices.length} Active
          </Badge>
        </div>

        <div className="space-y-2">
          {activeDevices.map((dev) => (
            <div
              key={dev.id}
              className="p-3 rounded-2xl bg-slate-900/80 border border-white/10 flex items-center justify-between text-xs hover:border-blue-500/40 transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center">
                  <Smartphone className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-bold text-white">{dev.name}</p>
                  <p className="text-[10px] text-slate-400">Tap to connect</p>
                </div>
              </div>

              <Button
                variant="secondary"
                size="sm"
                onClick={() => onConnectDevice && onConnectDevice(dev.id)}
                className="py-1 px-3 text-xs"
              >
                Connect
              </Button>
            </div>
          ))}

          {activeDevices.length === 0 && (
            <div className="p-4 text-center text-xs text-slate-500 bg-slate-900/40 rounded-2xl border border-white/5">
              Searching for devices on local network...
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
