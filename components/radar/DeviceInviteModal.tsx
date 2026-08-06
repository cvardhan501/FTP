"use client";

import React from "react";
import { DeviceInfo } from "../../types";
import { Radio, Wifi, Check, X, ShieldCheck, Smartphone, Laptop, Apple } from "lucide-react";
import { Button, Card, Badge } from "../ui";

interface DeviceInviteModalProps {
  invite: {
    senderId: string;
    sessionCode: string;
    senderDevice: DeviceInfo;
  } | null;
  onAccept: (senderId: string, sessionCode: string) => void;
  onDecline: () => void;
}

export const DeviceInviteModal: React.FC<DeviceInviteModalProps> = ({
  invite,
  onAccept,
  onDecline,
}) => {
  if (!invite) return null;

  const { senderDevice, senderId, sessionCode } = invite;

  const getOsIcon = (os: string) => {
    if (os === "ios" || os === "mac") return <Apple className="w-5 h-5" />;
    if (os === "windows") return <Laptop className="w-5 h-5" />;
    return <Smartphone className="w-5 h-5" />;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xl animate-fadeIn">
      <div className="glass-panel w-full max-w-sm p-6 sm:p-7 rounded-[36px] relative border border-purple-500/40 shadow-2xl space-y-6 text-center">
        {/* Pulsing Icon */}
        <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-purple-600 to-indigo-600 p-0.5 mx-auto shadow-2xl shadow-purple-500/40 flex items-center justify-center animate-bounce">
          <div className="w-full h-full bg-slate-950 rounded-full flex items-center justify-center text-purple-400">
            <Radio className="w-10 h-10 animate-pulse" />
          </div>
        </div>

        {/* Title */}
        <div className="space-y-1">
          <Badge variant="purple" className="mb-1">Nearby Discovery Pair Request</Badge>
          <h2 className="text-xl font-extrabold text-white">Incoming Connection</h2>
          <p className="text-xs text-slate-400">
            A nearby AirDropX device wants to pair and share files with you.
          </p>
        </div>

        {/* Device Information Card */}
        <div className="p-4 rounded-2xl bg-slate-900/80 border border-white/10 flex items-center justify-between text-left">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center border border-purple-500/20 font-bold">
              {getOsIcon(senderDevice.os)}
            </div>
            <div>
              <h3 className="font-bold text-white text-sm">{senderDevice.name || "AirDropX Peer"}</h3>
              <p className="text-[11px] text-slate-400 font-mono">
                {senderDevice.os.toUpperCase()} • {senderDevice.browser}
              </p>
            </div>
          </div>
          <Badge variant="green" className="text-[10px]">Ready</Badge>
        </div>

        {/* E2E Notice */}
        <div className="bg-slate-950/60 p-3 rounded-xl border border-white/10 text-xs text-slate-300 flex items-center justify-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400" /> WebCrypto E2E Encrypted Channel
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <Button variant="ghost" className="flex-1 py-3" onClick={onDecline}>
            <X className="w-4 h-4 mr-1 text-rose-400" /> Decline
          </Button>
          <Button
            variant="primary"
            className="flex-1 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 font-bold"
            onClick={() => onAccept(senderId, sessionCode)}
          >
            <Check className="w-4 h-4 mr-1 text-emerald-300" /> Accept & Pair
          </Button>
        </div>
      </div>
    </div>
  );
};
