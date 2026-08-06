"use client";

import React from "react";
import { TransferProgressState } from "../../types";
import { Pause, Play, X, Activity, ArrowUpRight, ArrowDownLeft } from "lucide-react";
import { Button, Card, Badge } from "../ui";
import { formatBytes, formatDuration, formatSpeed } from "../../lib/utils";

interface ProgressOverlayProps {
  state: TransferProgressState | null;
  sendState?: TransferProgressState | null;
  receiveState?: TransferProgressState | null;
  onPause: () => void;
  onResume: () => void;
  onCancel: () => void;
}

export const ProgressOverlay: React.FC<ProgressOverlayProps> = ({
  state,
  sendState,
  receiveState,
  onPause,
  onResume,
  onCancel,
}) => {
  const activeSend = sendState && sendState.status !== "idle" && sendState.status !== "completed";
  const activeReceive = receiveState && receiveState.status !== "idle" && receiveState.status !== "completed";

  if (!activeSend && !activeReceive && (!state || state.status === "idle" || state.status === "completed")) {
    return null;
  }

  const renderProgressCard = (st: TransferProgressState) => {
    return (
      <div key={st.transferId} className="glass-panel w-full max-w-sm p-6 rounded-[32px] relative border border-blue-500/40 shadow-2xl space-y-5 text-center">
        {/* Header */}
        <div className="flex items-center justify-between">
          <span className="font-extrabold text-white text-sm flex items-center gap-1.5">
            {st.isSender ? (
              <span className="text-blue-400 flex items-center gap-1"><ArrowUpRight className="w-4 h-4" /> Sending File</span>
            ) : (
              <span className="text-purple-400 flex items-center gap-1"><ArrowDownLeft className="w-4 h-4" /> Receiving Stream</span>
            )}
          </span>
          <button onClick={onCancel} className="text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Circular Progress Gauge */}
        <div className="relative w-36 h-36 mx-auto flex items-center justify-center">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r="42"
              className="text-slate-900 stroke-current"
              strokeWidth="9"
              fill="transparent"
            />
            <circle
              cx="50"
              cy="50"
              r="42"
              className={`${st.isSender ? "text-blue-500" : "text-purple-500"} stroke-current transition-all duration-150 ease-out`}
              strokeWidth="9"
              strokeDasharray={264}
              strokeDashoffset={264 - (264 * st.percentage) / 100}
              strokeLinecap="round"
              fill="transparent"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl font-black font-mono text-white">{st.percentage}%</span>
          </div>
        </div>

        {/* File Name & Size */}
        <div className="space-y-1">
          <h3 className="font-extrabold text-white text-sm truncate px-2">{st.fileName}</h3>
          <p className="text-[11px] text-slate-400 font-mono">
            {formatBytes(st.transferredBytes)} / {formatBytes(st.fileSize)}
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-2 text-center text-xs">
          <div className="bg-slate-900/80 p-2.5 rounded-xl border border-white/5">
            <span className="font-mono font-bold text-blue-400 text-xs block truncate">
              {formatSpeed(st.speedBps).replace("/s", "")}
            </span>
            <span className="text-slate-500 text-[9px] uppercase block font-mono mt-0.5">Speed</span>
          </div>

          <div className="bg-slate-900/80 p-2.5 rounded-xl border border-white/5">
            <span className="font-mono font-bold text-purple-400 text-xs block truncate">
              {formatDuration(st.etaSeconds)}
            </span>
            <span className="text-slate-500 text-[9px] uppercase block font-mono mt-0.5">ETA</span>
          </div>

          <div className="bg-slate-900/80 p-2.5 rounded-xl border border-white/5">
            <span className="font-mono font-bold text-emerald-400 text-xs block truncate">
              {st.currentChunk}/{st.totalChunks}
            </span>
            <span className="text-slate-500 text-[9px] uppercase block font-mono mt-0.5">Chunks</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 pt-1">
          {st.status === "transferring" && (
            <button
              onClick={onPause}
              className="flex-1 py-2.5 rounded-xl bg-blue-600/20 border border-blue-500/40 text-blue-300 font-bold text-xs flex items-center justify-center gap-1.5 hover:bg-blue-600/30 transition-all"
            >
              <Pause className="w-3.5 h-3.5 fill-current" /> Pause
            </button>
          )}

          {st.status === "paused" && (
            <button
              onClick={onResume}
              className="flex-1 py-2.5 rounded-xl bg-blue-600 text-white font-bold text-xs flex items-center justify-center gap-1.5 hover:bg-blue-500 transition-all"
            >
              <Play className="w-3.5 h-3.5 fill-current" /> Resume
            </button>
          )}

          <button
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-xl bg-rose-600/20 border border-rose-500/40 text-rose-400 font-bold text-xs flex items-center justify-center gap-1.5 hover:bg-rose-600/30 transition-all"
          >
            <X className="w-3.5 h-3.5" /> Cancel
          </button>
        </div>
      </div>
    );
  };

  const cardsToRender: TransferProgressState[] = [];
  if (activeSend && sendState) cardsToRender.push(sendState);
  if (activeReceive && receiveState) cardsToRender.push(receiveState);
  if (cardsToRender.length === 0 && state && state.status !== "idle" && state.status !== "completed") {
    cardsToRender.push(state);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xl animate-fadeIn">
      <div className="flex flex-col md:flex-row gap-6 max-w-4xl max-h-[90vh] overflow-y-auto items-center justify-center w-full">
        {cardsToRender.map(renderProgressCard)}
      </div>
    </div>
  );
};
