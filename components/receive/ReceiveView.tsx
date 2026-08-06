"use client";

import React, { useState } from "react";
import { IncomingFileMeta } from "../../types";
import { Download, Camera, Wifi, ShieldCheck, FileCheck, X, Check } from "lucide-react";
import { Button, Card, Badge } from "../ui";
import { formatBytes } from "../../lib/utils";
import { MobileKeypad } from "./MobileKeypad";

interface ReceiveViewProps {
  onJoinRoom: (code: string) => Promise<{ success: boolean; error?: string }>;
  onOpenQRScanner: () => void;
  peerConnected: boolean;
  incomingMeta: IncomingFileMeta | null;
  onAcceptFile: () => void;
  onRejectFile: () => void;
  completedBlobUrl: string | null;
  fileName?: string;
}

export const ReceiveView: React.FC<ReceiveViewProps> = ({
  onJoinRoom,
  onOpenQRScanner,
  peerConnected,
  incomingMeta,
  onAcceptFile,
  onRejectFile,
  completedBlobUrl,
  fileName,
}) => {
  const [sessionCodeInput, setSessionCodeInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const activeFileName = incomingMeta?.name || fileName || "File";

  const handleConnectCode = async (code: string) => {
    if (code.trim().length !== 6) return;

    setLoading(true);
    setErrorMessage(null);
    const res = await onJoinRoom(code.trim());
    setLoading(false);

    if (!res.success) {
      setErrorMessage(res.error || "Failed to find session code.");
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8 animate-fadeIn">
      <div className="text-center space-y-3">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-purple-600 to-pink-600 p-4 mx-auto text-white shadow-xl shadow-purple-500/30">
          <Download className="w-full h-full" />
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white">Receive Files</h1>
        <p className="text-slate-400 text-sm max-w-md mx-auto">
          Enter the 6-digit session code using the mobile keypad or scan the QR Code.
        </p>
      </div>

      {/* Connection Card */}
      {!peerConnected && (
        <Card className="max-w-md mx-auto border-purple-500/30 space-y-6">
          <div className="text-center space-y-1">
            <span className="text-xs text-slate-400 font-mono uppercase tracking-wider">
              6-Digit Session PIN
            </span>
          </div>

          <MobileKeypad
            value={sessionCodeInput}
            onChange={(val) => setSessionCodeInput(val)}
            onSubmit={(code) => handleConnectCode(code)}
            loading={loading}
          />

          {errorMessage && (
            <p className="text-xs text-rose-400 text-center font-medium">{errorMessage}</p>
          )}

          <div className="relative my-4 text-center">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/10" /></div>
            <span className="relative bg-slate-900 px-3 text-xs text-slate-500">OR</span>
          </div>

          <Button
            variant="glass"
            size="md"
            onClick={onOpenQRScanner}
            className="w-full py-3 border-white/20 text-slate-200"
          >
            <Camera className="w-4 h-4 mr-2 text-purple-400" /> Scan QR Code with Camera
          </Button>
        </Card>
      )}

      {/* Peer Connected Indicator */}
      {peerConnected && (
        <Card className="max-w-md mx-auto border-emerald-500/40 text-center space-y-4 bg-emerald-950/20">
          <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 mx-auto flex items-center justify-center">
            <Wifi className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Peer Connected!</h3>
            <p className="text-xs text-slate-400">Waiting for sender to select files...</p>
          </div>
        </Card>
      )}

      {/* Completed Download Banner */}
      {completedBlobUrl && (
        <Card className="max-w-md mx-auto border-blue-500/40 text-center space-y-3 bg-blue-950/30">
          <div className="w-12 h-12 rounded-full bg-blue-500/20 text-blue-400 mx-auto flex items-center justify-center">
            <FileCheck className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-white">Transfer Completed!</h3>
          <p className="text-xs text-slate-400">File assembled and ready for download on your device.</p>
          <a
            href={completedBlobUrl}
            download={activeFileName}
            className="inline-flex items-center px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs gap-2"
          >
            <Download className="w-4 h-4" /> Download {activeFileName}
          </a>
        </Card>
      )}
    </div>
  );
};
