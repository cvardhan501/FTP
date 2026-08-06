"use client";

import React from "react";
import { DeviceInfo } from "../../types";
import { Radio, Smartphone, Laptop, Apple, ArrowLeft, RefreshCw } from "lucide-react";
import { Button, Card, Badge } from "../ui";

interface NearbyDevicesViewProps {
  activeDevices: DeviceInfo[];
  onConnectDevice: (deviceId: string) => void;
  onBack: () => void;
}

export const NearbyDevicesView: React.FC<NearbyDevicesViewProps> = ({
  activeDevices,
  onConnectDevice,
  onBack,
}) => {
  return (
    <div className="max-w-md mx-auto px-4 pt-4 pb-28 space-y-6 animate-fadeIn">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="w-9 h-9 rounded-full bg-slate-900 border border-white/10 flex items-center justify-center text-slate-300 hover:text-white"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <h1 className="text-base font-bold text-white">Nearby Devices</h1>
        <div className="w-9 h-9" />
      </div>

      {/* Radar Animation Area */}
      <div className="relative py-8 flex flex-col items-center justify-center">
        <div className="relative w-48 h-48 rounded-full border border-blue-500/20 flex items-center justify-center">
          <div className="absolute inset-4 rounded-full border border-blue-500/30" />
          <div className="absolute inset-10 rounded-full border border-blue-500/40" />
          <div className="absolute inset-16 rounded-full border border-blue-500/50" />

          {/* Rotating Radar Sweep */}
          <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-blue-500/20 via-transparent to-transparent animate-spin opacity-80" />

          {/* Center Glowing Logo */}
          <div className="w-14 h-14 rounded-full bg-blue-600 shadow-xl shadow-blue-500/50 flex items-center justify-center text-white z-10 animate-pulse">
            <Radio className="w-7 h-7" />
          </div>
        </div>

        <p className="text-xs font-mono text-blue-400 mt-4 animate-pulse">Scanning nearby devices...</p>
      </div>

      {/* Device List */}
      <div className="space-y-3">
        {activeDevices
          .filter((dev) => !dev.isSelf)
          .map((dev) => (
            <div
              key={dev.id}
              className="p-4 rounded-2xl bg-slate-900/80 border border-white/10 flex items-center justify-between hover:border-blue-500/40 transition-all shadow-md"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center font-bold border border-purple-500/20">
                  {dev.os === "ios" || dev.os === "mac" ? (
                    <Apple className="w-5 h-5 text-slate-200" />
                  ) : dev.os === "windows" ? (
                    <Laptop className="w-5 h-5 text-blue-400" />
                  ) : (
                    <Smartphone className="w-5 h-5 text-purple-400" />
                  )}
                </div>
                <div>
                  <h3 className="font-bold text-white text-sm">{dev.name}</h3>
                  <p className="text-[11px] text-slate-400 font-mono">
                    {dev.os.toUpperCase()} • {dev.browser || "AirDropX"} • Ready
                  </p>
                </div>
              </div>

              <Button
                variant="secondary"
                size="sm"
                onClick={() => onConnectDevice(dev.id)}
                className="py-1.5 px-4 text-xs font-bold bg-blue-600/20 hover:bg-blue-600 text-blue-300 hover:text-white border-blue-500/40"
              >
                Connect
              </Button>
            </div>
          ))}

        {activeDevices.filter((dev) => !dev.isSelf).length === 0 && (
          <Card className="text-center py-6 space-y-2 border-white/5">
            <p className="text-xs text-slate-400">Scanning Wi-Fi network for nearby devices...</p>
            <p className="text-[11px] text-slate-500">Open AirDropX on recipient device to discover automatically.</p>
          </Card>
        )}
      </div>
    </div>
  );
};
