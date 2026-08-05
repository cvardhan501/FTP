"use client";

import React from "react";
import { CheckCircle2, Folder, RefreshCw, X } from "lucide-react";
import { formatBytes } from "../../lib/utils";

interface TransferCompleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  fileName?: string;
  fileSize?: number;
  completedBlobUrl?: string | null;
}

export const TransferCompleteModal: React.FC<TransferCompleteModalProps> = ({
  isOpen,
  onClose,
  fileName,
  fileSize,
  completedBlobUrl,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xl animate-fadeIn">
      <div className="glass-panel w-full max-w-sm p-6 sm:p-8 rounded-[36px] relative border border-emerald-500/40 shadow-2xl space-y-6 text-center">
        {/* Big Green Checkmark Icon */}
        <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-emerald-500 to-green-400 p-0.5 mx-auto shadow-2xl shadow-emerald-500/40 flex items-center justify-center animate-bounce">
          <div className="w-full h-full bg-slate-950 rounded-full flex items-center justify-center text-emerald-400">
            <CheckCircle2 className="w-14 h-14 stroke-[2.5]" />
          </div>
        </div>

        {/* Header Title */}
        <div className="space-y-1.5">
          <h2 className="text-2xl font-black text-white">Transfer Complete!</h2>
          <p className="text-xs text-slate-400">All files transferred successfully</p>
        </div>

        {/* Summary Card */}
        <div className="grid grid-cols-2 gap-3 pt-2">
          <div className="bg-slate-900/80 p-3.5 rounded-2xl border border-white/10 text-center">
            <span className="text-[10px] font-mono uppercase text-slate-400 block">TOTAL FILES</span>
            <span className="text-lg font-bold text-white font-mono">1</span>
          </div>

          <div className="bg-slate-900/80 p-3.5 rounded-2xl border border-white/10 text-center">
            <span className="text-[10px] font-mono uppercase text-slate-400 block">TOTAL SIZE</span>
            <span className="text-lg font-bold text-emerald-400 font-mono">
              {fileSize ? formatBytes(fileSize) : "2.4 MB"}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3 pt-2">
          {completedBlobUrl ? (
            <a
              href={completedBlobUrl}
              download={fileName || "file"}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-extrabold text-base shadow-xl shadow-blue-500/30 active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <Folder className="w-5 h-5" /> Open File
            </a>
          ) : (
            <button
              onClick={onClose}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-extrabold text-base shadow-xl shadow-blue-500/30 active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <Folder className="w-5 h-5" /> Done
            </button>
          )}

          <button
            onClick={onClose}
            className="w-full py-3.5 rounded-2xl bg-slate-900 border border-white/10 hover:bg-slate-800 text-slate-300 font-bold text-sm active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            <RefreshCw className="w-4 h-4" /> Share Again
          </button>
        </div>
      </div>
    </div>
  );
};
