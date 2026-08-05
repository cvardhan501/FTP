"use client";

import React, { useState } from "react";
import { IncomingFileMeta } from "../../types";
import { Download, Camera, KeyRound, Wifi, ShieldCheck, FileCheck, X, Check, ArrowRight } from "lucide-react";
import { Button, Card, Badge } from "../ui";
import { formatBytes } from "../../lib/utils";

interface ReceiveViewProps {
  onJoinRoom: (code: string) => Promise<{ success: boolean; error?: string }>;
  onOpenQRScanner: () => void;
  peerConnected: boolean;
  incomingMeta: IncomingFileMeta | null;
  onAcceptFile: () => void;
  onRejectFile: () => void;
  completedBlobUrl: string | null;
}

export const ReceiveView: React.FC<ReceiveViewProps> = ({
  onJoinRoom,
  onOpenQRScanner,
  peerConnected,
  incomingMeta,
  onAcceptFile,
  onRejectFile,
  completedBlobUrl,
}) => {
  const [sessionCodeInput, setSessionCodeInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleConnectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (sessionCodeInput.trim().length !== 6) return;

    setLoading(true);
    setErrorMessage(null);
    const res = await onJoinRoom(sessionCodeInput.trim());
    setLoading(false);

    if (!res.success) {
      setErrorMessage(res.error || "Failed to find session code.");
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 space-y-8 animate-fadeIn">
      <div className="text-center space-y-3">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-purple-600 to-pink-600 p-4 mx-auto text-white shadow-xl shadow-purple-500/30">
          <Download className="w-full h-full" />
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white">Receive Files</h1>
        <p className="text-slate-400 text-sm max-w-md mx-auto">
          Enter the 6-digit session code displayed on the sender&apos;s device or scan their QR Code.
        </p>
      </div>

      {/* Connection Card */}
      {!peerConnected && (
        <Card className="max-w-md mx-auto border-purple-500/30">
          <form onSubmit={handleConnectSubmit} className="space-y-6">
            <div>
              <label className="text-xs text-slate-400 font-mono uppercase tracking-wider block mb-2 text-center">
                Enter 6-Digit Session PIN
              </label>
              <input
                type="text"
                maxLength={6}
                placeholder="e.g. 748392"
                value={sessionCodeInput}
                onChange={(e) => setSessionCodeInput(e.target.value)}
                className="w-full px-4 py-3 bg-slate-950 border border-white/20 rounded-2xl text-center font-mono text-3xl font-bold tracking-widest text-purple-400 placeholder-slate-700 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20"
              />
            </div>

            {errorMessage && (
              <p className="text-xs text-rose-400 text-center font-medium">{errorMessage}</p>
            )}

            <Button
              variant="secondary"
              size="lg"
              type="submit"
              disabled={sessionCodeInput.length !== 6 || loading}
              className="w-full text-base py-3.5"
            >
              {loading ? "Connecting..." : "Connect to Sender"} <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </form>

          <div className="relative my-6 text-center">
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

      {/* Incoming File Offer Prompt Modal */}
      {incomingMeta && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="glass-panel w-full max-w-md p-6 rounded-3xl relative border border-blue-500/40 shadow-2xl space-y-6 text-center">
            <div className="w-16 h-16 rounded-2xl bg-blue-600/20 border border-blue-500/40 text-blue-400 mx-auto flex items-center justify-center">
              <FileCheck className="w-8 h-8" />
            </div>

            <div>
              <Badge variant="blue" className="mb-2">Incoming Encrypted File</Badge>
              <h2 className="text-xl font-bold text-white">{incomingMeta.name}</h2>
              <p className="text-xs text-slate-400 font-mono mt-1">
                Size: {formatBytes(incomingMeta.size)} • {incomingMeta.totalChunks} Chunks
              </p>
            </div>

            <div className="bg-slate-900/80 p-3 rounded-xl border border-white/10 text-xs text-slate-300 flex items-center justify-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" /> WebCrypto AES-256 E2E Encryption Active
            </div>

            <div className="flex gap-3">
              <Button variant="ghost" className="flex-1 py-3" onClick={onRejectFile}>
                <X className="w-4 h-4 mr-1 text-rose-400" /> Decline
              </Button>
              <Button variant="primary" className="flex-1 py-3" onClick={onAcceptFile}>
                <Check className="w-4 h-4 mr-1 text-emerald-300" /> Accept & Download
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Completed Download Banner */}
      {completedBlobUrl && (
        <Card className="max-w-md mx-auto border-blue-500/40 text-center space-y-3 bg-blue-950/30">
          <div className="w-12 h-12 rounded-full bg-blue-500/20 text-blue-400 mx-auto flex items-center justify-center">
            <FileCheck className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-white">Transfer Completed!</h3>
          <p className="text-xs text-slate-400">File assembled and saved automatically to your device.</p>
          <a
            href={completedBlobUrl}
            download={incomingMeta?.name}
            className="inline-flex items-center px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs gap-2"
          >
            <Download className="w-4 h-4" /> Download {incomingMeta?.name || "File"}
          </a>
        </Card>
      )}
    </div>
  );
};
