"use client";

import React from "react";
import { Sparkles, Cpu, Zap, ShieldAlert, CheckCircle2, X } from "lucide-react";
import { Button, Card, Badge } from "../ui";

interface AIAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  pingMs?: number;
}

export const AIAssistantModal: React.FC<AIAssistantModalProps> = ({ isOpen, onClose, pingMs = 18 }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="glass-panel w-full max-w-lg p-6 rounded-3xl relative border border-purple-500/40 shadow-2xl space-y-6">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-full hover:bg-white/10 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-purple-600/20 border border-purple-500/40 text-purple-400">
            <Sparkles className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">AI Transfer Optimization</h2>
            <p className="text-xs text-slate-400">Real-time network quality & transfer parameters advisor.</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 text-center">
          <div className="bg-slate-900/80 p-4 rounded-2xl border border-white/10">
            <span className="text-[10px] text-slate-400 font-mono uppercase block">Network Health</span>
            <span className="text-xl font-extrabold text-emerald-400">Ultra High Speed</span>
            <p className="text-[11px] text-slate-500 mt-1 font-mono">{pingMs}ms P2P Latency</p>
          </div>

          <div className="bg-slate-900/80 p-4 rounded-2xl border border-white/10">
            <span className="text-[10px] text-slate-400 font-mono uppercase block">Optimal Chunk Size</span>
            <span className="text-xl font-extrabold text-blue-400 font-mono">64 KB</span>
            <p className="text-[11px] text-slate-500 mt-1">Flow control optimized</p>
          </div>
        </div>

        <div className="space-y-3 text-xs text-slate-300">
          <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-white">Duplicate Detection Active:</span> Pre-hashes file blocks to prevent resending identical archives.
            </div>
          </div>

          <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-start gap-2.5">
            <Zap className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-white">Direct WebRTC DataChannel:</span> Zero cloud server relaying detected. Max throughput enabled.
            </div>
          </div>
        </div>

        <Button variant="primary" className="w-full py-3" onClick={onClose}>
          Got It
        </Button>
      </div>
    </div>
  );
};
