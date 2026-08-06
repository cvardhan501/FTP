"use client";

import React from "react";
import { TransferProgressState } from "../../types";
import { Pause, Play, X, Activity } from "lucide-react";
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
  if (!state || state.status === "idle" || state.status === "completed") return null;

  const isError = state.status === "error";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xl animate-fadeIn">
      <div className="glass-panel w-full max-w-sm p-6 sm:p-8 rounded-[36px] relative border border-blue-500/40 shadow-2xl space-y-6 text-center">
        {/* Top Header */}
        <div className="flex items-center justify-between">
          <button onClick={onCancel} className="text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
          <span className="font-bold text-white text-base">
            {state.isSender ? "Sending Files..." : "Receiving Stream..."}
          </span>
          <div className="w-5 h-5" />
        </div>

        {/* Circular Progress Gauge */}
        <div className="relative w-44 h-44 mx-auto flex items-center justify-center">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r="42"
              className="text-slate-900 stroke-current"
              strokeWidth="10"
              fill="transparent"
            />
            <circle
              cx="50"
              cy="50"
              r="42"
              className="text-blue-500 stroke-current transition-all duration-150 ease-out"
              strokeWidth="10"
              strokeDasharray={264}
              strokeDashoffset={264 - (264 * state.percentage) / 100}
              strokeLinecap="round"
              fill="transparent"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-4xl font-black font-mono text-white">{state.percentage}%</span>
          </div>
        </div>

        {/* File Name & Size */}
        <div className="space-y-1">
          <h3 className="font-extrabold text-white text-base truncate px-4">{state.fileName}</h3>
          <p className="text-xs text-slate-400 font-mono">
            {formatBytes(state.transferredBytes)} / {formatBytes(state.fileSize)}
          </p>
        </div>

        {/* Telemetry Stats Grid (Speed, Remaining, Chunks) */}
        <div className="grid grid-cols-3 gap-2 pt-2 text-center text-xs">
          <div className="bg-slate-900/80 p-3 rounded-2xl border border-white/5">
            <span className="font-mono font-bold text-blue-400 text-sm block">
              {formatSpeed(state.speedBps).replace("/s", "")}
            </span>
            <span className="text-slate-500 text-[10px] uppercase block font-mono mt-0.5">Speed</span>
          </div>

          <div className="bg-slate-900/80 p-3 rounded-2xl border border-white/5">
            <span className="font-mono font-bold text-purple-400 text-sm block">
              {formatDuration(state.etaSeconds)}
            </span>
            <span className="text-slate-500 text-[10px] uppercase block font-mono mt-0.5">Remaining</span>
          </div>

          <div className="bg-slate-900/80 p-3 rounded-2xl border border-white/5">
            <span className="font-mono font-bold text-emerald-400 text-sm block">
              {state.currentChunk}/{state.totalChunks}
            </span>
            <span className="text-slate-500 text-[10px] uppercase block font-mono mt-0.5">Chunks</span>
          </div>
        </div>

        {/* Action Buttons (Pause / Cancel) */}
        <div className="flex items-center gap-3 pt-2">
          {state.status === "transferring" && (
            <button
              onClick={onPause}
              className="flex-1 py-3.5 rounded-2xl bg-blue-600/20 border border-blue-500/40 text-blue-300 font-bold text-sm flex items-center justify-center gap-2 hover:bg-blue-600/30 active:scale-95 transition-all"
            >
              <Pause className="w-4 h-4 fill-current" /> Pause
            </button>
          )}

          {state.status === "paused" && (
            <button
              onClick={onResume}
              className="flex-1 py-3.5 rounded-2xl bg-blue-600 text-white font-bold text-sm flex items-center justify-center gap-2 hover:bg-blue-500 active:scale-95 transition-all"
            >
              <Play className="w-4 h-4 fill-current" /> Resume
            </button>
          )}

          <button
            onClick={onCancel}
            className="flex-1 py-3.5 rounded-2xl bg-rose-600/20 border border-rose-500/40 text-rose-400 font-bold text-sm flex items-center justify-center gap-2 hover:bg-rose-600/30 active:scale-95 transition-all"
          >
            <X className="w-4 h-4" /> Cancel
          </button>
        </div>

        {/* Live Indicator */}
        <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-400 font-mono pt-1">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span>Live WebRTC Connection</span>
        </div>
      </div>
    </div>
  );
};
