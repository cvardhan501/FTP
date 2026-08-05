"use client";

import React from "react";
import { TransferProgressState } from "../../types";
import { Pause, Play, X, ShieldCheck, Zap, Activity } from "lucide-react";
import { Button, Card, Badge } from "../ui";
import { formatBytes, formatDuration, formatSpeed } from "../../lib/utils";

interface ProgressOverlayProps {
  state: TransferProgressState | null;
  onPause: () => void;
  onResume: () => void;
  onCancel: () => void;
}

export const ProgressOverlay: React.FC<ProgressOverlayProps> = ({
  state,
  onPause,
  onResume,
  onCancel,
}) => {
  if (!state || state.status === "idle") return null;

  const isCompleted = state.status === "completed";
  const isError = state.status === "error";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-lg animate-fadeIn">
      <div className="glass-panel w-full max-w-lg p-6 sm:p-8 rounded-3xl relative border border-blue-500/40 shadow-2xl space-y-6">
        {/* Top Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-blue-400 animate-spin" />
            <span className="font-bold text-white text-base">
              {state.isSender ? "Sending Encrypted File..." : "Receiving Stream..."}
            </span>
          </div>
          <Badge variant={isCompleted ? "green" : isError ? "rose" : "blue"}>
            {state.status.toUpperCase()}
          </Badge>
        </div>

        {/* Circular / Large Percentage display */}
        <div className="text-center py-4 space-y-2">
          <div className="text-5xl sm:text-6xl font-extrabold font-mono text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-300 to-purple-400">
            {state.percentage}%
          </div>
          <p className="text-base font-bold text-white truncate px-4">{state.fileName}</p>
          <p className="text-xs text-slate-400 font-mono">
            {formatBytes(state.transferredBytes)} / {formatBytes(state.fileSize)}
          </p>
        </div>

        {/* Linear Progress Bar */}
        <div className="space-y-2">
          <div className="w-full h-3.5 bg-slate-950 rounded-full overflow-hidden border border-white/10 p-0.5 relative">
            <div
              className="h-full bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 rounded-full transition-all duration-150 ease-out shadow-lg shadow-blue-500/50"
              style={{ width: `${state.percentage}%` }}
            />
          </div>
        </div>

        {/* Live Telemetry Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2 text-center text-xs">
          <div className="bg-slate-900/60 p-3 rounded-xl border border-white/5">
            <span className="text-slate-400 text-[10px] block font-mono">CURRENT SPEED</span>
            <span className="font-mono font-bold text-blue-400 text-sm">{formatSpeed(state.speedBps)}</span>
          </div>

          <div className="bg-slate-900/60 p-3 rounded-xl border border-white/5">
            <span className="text-slate-400 text-[10px] block font-mono">REMAINING TIME</span>
            <span className="font-mono font-bold text-purple-400 text-sm">
              {formatDuration(state.etaSeconds)}
            </span>
          </div>

          <div className="col-span-2 sm:col-span-1 bg-slate-900/60 p-3 rounded-xl border border-white/5">
            <span className="text-slate-400 text-[10px] block font-mono">CHUNKS</span>
            <span className="font-mono font-bold text-emerald-400 text-sm">
              {state.currentChunk} / {state.totalChunks}
            </span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3 pt-2">
          {state.status === "transferring" && (
            <Button variant="glass" className="flex-1 py-3" onClick={onPause}>
              <Pause className="w-4 h-4 mr-1 text-amber-400" /> Pause
            </Button>
          )}

          {state.status === "paused" && (
            <Button variant="primary" className="flex-1 py-3" onClick={onResume}>
              <Play className="w-4 h-4 mr-1" /> Resume
            </Button>
          )}

          <Button variant="danger" className="flex-1 py-3" onClick={onCancel}>
            <X className="w-4 h-4 mr-1" /> {isCompleted ? "Close" : "Cancel"}
          </Button>
        </div>
      </div>
    </div>
  );
};
