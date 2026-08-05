"use client";

import React, { useState } from "react";
import { IncomingFileMeta } from "../../types";
import { Check, X, ShieldCheck, Folder } from "lucide-react";
import { formatBytes } from "../../lib/utils";

interface IncomingFileModalProps {
  incomingMeta: IncomingFileMeta | null;
  onAccept: () => void;
  onDecline: () => void;
}

export const IncomingFileModal: React.FC<IncomingFileModalProps> = ({
  incomingMeta,
  onAccept,
  onDecline,
}) => {
  const [trustDevice, setTrustDevice] = useState(false);

  if (!incomingMeta) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xl animate-fadeIn">
      <div className="glass-panel w-full max-w-sm p-6 sm:p-8 rounded-[36px] relative border border-blue-500/40 shadow-2xl space-y-6 text-center">
        {/* Glowing Folder Header Graphic */}
        <div className="w-24 h-24 rounded-3xl bg-gradient-to-tr from-amber-500 via-orange-500 to-blue-600 p-0.5 mx-auto shadow-2xl shadow-orange-500/30">
          <div className="w-full h-full bg-slate-950 rounded-[22px] flex items-center justify-center text-orange-400">
            <Folder className="w-12 h-12 stroke-[1.5]" />
          </div>
        </div>

        {/* Sender & File Description */}
        <div className="space-y-1.5">
          <h2 className="text-xl font-black text-white">{incomingMeta.senderName || "Nearby Device"}</h2>
          <p className="text-xs text-slate-300 font-medium">
            wants to send you <span className="text-blue-400 font-bold">{incomingMeta.name}</span>
          </p>
          <p className="text-[11px] text-slate-400 font-mono">
            Size: {formatBytes(incomingMeta.size)} • {incomingMeta.totalChunks} Chunks
          </p>
        </div>

        {/* Security Badge */}
        <div className="bg-slate-900/80 p-3 rounded-2xl border border-white/10 text-[11px] text-slate-300 flex items-center justify-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400" /> WebCrypto AES-256 E2E Encryption
        </div>

        {/* Big Action Buttons (Accept / Decline) */}
        <div className="space-y-3 pt-2">
          <button
            onClick={onAccept}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-white font-extrabold text-base shadow-xl shadow-emerald-600/30 active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            <Check className="w-5 h-5 stroke-[3]" /> Accept
          </button>

          <button
            onClick={onDecline}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-extrabold text-base shadow-xl shadow-rose-600/30 active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            <X className="w-5 h-5 stroke-[3]" /> Decline
          </button>
        </div>

        {/* Checkbox: Always trust this device */}
        <label className="flex items-center justify-center gap-2 text-xs text-slate-400 cursor-pointer pt-1">
          <input
            type="checkbox"
            checked={trustDevice}
            onChange={(e) => setTrustDevice(e.target.checked)}
            className="w-4 h-4 rounded border-white/20 bg-slate-900 text-blue-500 focus:ring-0"
          />
          <span>Always trust this device</span>
        </label>
      </div>
    </div>
  );
};
