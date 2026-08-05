"use client";

import React, { useRef, useState } from "react";
import { DeviceInfo, FileItem } from "../../types";
import { Upload, File, Image, Film, FileText, Music, Folder, X, QrCode, Sparkles, Send, ShieldCheck, Copy, Check, Radar, Monitor } from "lucide-react";
import { Button, Card, Badge } from "../ui";
import { formatBytes } from "../../lib/utils";
import { analyzeTransferAI } from "../../lib/ai-engine";

interface SendViewProps {
  files: FileItem[];
  onAddFiles: (newFiles: File[]) => void;
  onRemoveFile: (id: string) => void;
  sessionCode: string;
  onOpenQRModal: () => void;
  activeDevices: DeviceInfo[];
  peerConnected: boolean;
  onStartTransfer: (file: FileItem) => void;
}

export const SendView: React.FC<SendViewProps> = ({
  files,
  onAddFiles,
  onRemoveFile,
  sessionCode,
  onOpenQRModal,
  activeDevices,
  peerConnected,
  onStartTransfer,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);
  const [copiedCode, setCopiedCode] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const aiAnalysis = analyzeTransferAI(
    files.map((f) => ({ name: f.name, size: f.size, type: f.type })),
    []
  );

  const totalBytes = files.reduce((sum, f) => sum + f.size, 0);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const fileList = Array.from(e.dataTransfer.files);
      onAddFiles(fileList);
    }
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(sessionCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const getFileIcon = (type: string, name: string) => {
    if (type.startsWith("image/")) return <Image className="w-5 h-5 text-blue-400" />;
    if (type.startsWith("video/")) return <Film className="w-5 h-5 text-purple-400" />;
    if (type.startsWith("audio/")) return <Music className="w-5 h-5 text-pink-400" />;
    if (type.includes("pdf") || name.endsWith(".pdf")) return <FileText className="w-5 h-5 text-rose-400" />;
    if (name.endsWith(".zip") || name.endsWith(".tar") || name.endsWith(".rar"))
      return <Folder className="w-5 h-5 text-amber-400" />;
    return <File className="w-5 h-5 text-slate-400" />;
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8 animate-fadeIn">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-white flex items-center gap-3">
            <Send className="w-8 h-8 text-blue-400" /> Send Files Mode
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Drop files below and share your 6-digit session code or QR code with the receiver.
          </p>
        </div>

        {/* Pairing Code Card */}
        <div className="glass-panel px-5 py-3 rounded-2xl flex items-center gap-4 border-blue-500/30">
          <div>
            <span className="text-[10px] text-slate-400 uppercase tracking-widest block font-mono">Session Code</span>
            <span className="text-2xl font-mono font-bold text-blue-400 tracking-wider">{sessionCode}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Button variant="glass" size="sm" onClick={handleCopyCode} title="Copy Code">
              {copiedCode ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            </Button>
            <Button variant="secondary" size="sm" onClick={onOpenQRModal} title="Show QR Code">
              <QrCode className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: Drag & Drop Zone + File Queue */}
        <div className="lg:col-span-2 space-y-6">
          {/* Drag & Drop Upload Zone */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-3xl p-8 text-center transition-all cursor-pointer ${
              dragOver
                ? "border-blue-400 bg-blue-500/10 scale-[1.01]"
                : "border-white/20 bg-slate-900/50 hover:border-blue-500/40 hover:bg-slate-900/80"
            }`}
          >
            <input
              type="file"
              multiple
              ref={fileInputRef}
              className="hidden"
              onChange={(e) => e.target.files && onAddFiles(Array.from(e.target.files))}
            />
            <input
              type="file"
              //@ts-ignore
              webkitdirectory=""
              ref={folderInputRef}
              className="hidden"
              onChange={(e) => e.target.files && onAddFiles(Array.from(e.target.files))}
            />

            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 p-4 mx-auto mb-4 text-white shadow-xl shadow-blue-500/30">
              <Upload className="w-full h-full animate-bounce" />
            </div>

            <h3 className="text-xl font-bold text-white mb-1">Drag & Drop Files or Folders Here</h3>
            <p className="text-xs text-slate-400 mb-6">Supports images, 4K videos, PDFs, ZIPs, and folders of any size.</p>

            <div className="flex flex-wrap justify-center gap-3">
              <Button variant="primary" size="md" onClick={() => fileInputRef.current?.click()}>
                <File className="w-4 h-4 mr-2" /> Browse Files
              </Button>
              <Button variant="glass" size="md" onClick={() => folderInputRef.current?.click()}>
                <Folder className="w-4 h-4 mr-2 text-amber-400" /> Select Folder
              </Button>
            </div>
          </div>

          {/* AI Optimization Notice */}
          {files.length > 0 && (
            <div className="glass-panel p-4 rounded-2xl border-purple-500/30 flex items-start gap-3 bg-purple-950/20">
              <Sparkles className="w-5 h-5 text-purple-400 shrink-0 mt-0.5" />
              <div className="text-xs space-y-1">
                <span className="font-bold text-purple-300">AI Transfer Time Estimate:</span>{" "}
                <span className="text-white font-mono font-semibold">
                  ~{Math.ceil(aiAnalysis.estimatedDurationSeconds)} seconds
                </span>{" "}
                at ~{(aiAnalysis.estimatedSpeedBps / (1024 * 1024)).toFixed(1)} MB/s on P2P Wi-Fi.
                {aiAnalysis.duplicateWarning && (
                  <p className="text-amber-400 font-medium">{aiAnalysis.duplicateWarning}</p>
                )}
                {aiAnalysis.compressionTip && (
                  <p className="text-cyan-300 font-medium">{aiAnalysis.compressionTip}</p>
                )}
              </div>
            </div>
          )}

          {/* Selected File Queue */}
          {files.length > 0 && (
            <Card>
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-white text-base">Transfer Queue</h3>
                  <Badge variant="blue">{files.length} items</Badge>
                </div>
                <span className="text-xs font-mono text-slate-400">Total: {formatBytes(totalBytes)}</span>
              </div>

              <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                {files.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-3 rounded-xl bg-slate-900/60 border border-white/5 hover:border-blue-500/30 transition-colors"
                  >
                    <div className="flex items-center gap-3 overflow-hidden">
                      {item.previewUrl ? (
                        <img src={item.previewUrl} alt={item.name} className="w-10 h-10 object-cover rounded-lg shrink-0" />
                      ) : (
                        <div className="p-2.5 rounded-lg bg-slate-800 shrink-0">{getFileIcon(item.type, item.name)}</div>
                      )}
                      <div className="overflow-hidden">
                        <p className="text-sm font-semibold text-white truncate">{item.name}</p>
                        <p className="text-[11px] text-slate-400 font-mono">{formatBytes(item.size)}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => onStartTransfer(item)}
                        disabled={!peerConnected}
                        title={peerConnected ? "Transfer File" : "Waiting for receiver connection"}
                      >
                        <Send className="w-3.5 h-3.5 mr-1" /> Send
                      </Button>
                      <button
                        onClick={() => onRemoveFile(item.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-white/10 rounded-lg transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>

        {/* Right Col: Nearby Device Radar & Peer Connection Status */}
        <div className="space-y-6">
          <Card className="border-indigo-500/30">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-white/10">
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <Radar className="w-5 h-5 text-indigo-400 animate-spin" /> Local Network Devices
              </h3>
              <Badge variant={peerConnected ? "green" : "purple"}>
                {peerConnected ? "Peer Connected" : "Scanning..."}
              </Badge>
            </div>

            {activeDevices.length === 0 ? (
              <div className="text-center py-8 text-slate-400 space-y-3">
                <Monitor className="w-10 h-10 mx-auto text-slate-600" />
                <p className="text-xs">No nearby devices detected yet.</p>
                <p className="text-[11px] text-slate-500">
                  Open AirDropX on receiver device and enter code <span className="font-mono text-blue-400 font-bold">{sessionCode}</span>.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {activeDevices.map((device) => (
                  <div
                    key={device.id}
                    className={`p-3 rounded-xl border flex items-center justify-between transition-colors ${
                      device.isSelf
                        ? "bg-blue-500/10 border-blue-500/30"
                        : "bg-slate-900/60 border-white/10 hover:border-indigo-500/40"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 font-bold text-sm">
                        {device.os === "windows" ? "🪟" : device.os === "mac" || device.os === "ios" ? "🍎" : device.os === "android" ? "🤖" : "💻"}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-white">{device.name} {device.isSelf ? "(You)" : ""}</p>
                        <p className="text-[10px] text-slate-400 font-mono">
                          {device.os.toUpperCase()} • {device.browser} • {device.pingMs || 15}ms ping
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Security Banner */}
          <Card className="bg-gradient-to-br from-slate-900 to-blue-950/40 border-blue-500/20 text-xs text-slate-300 space-y-2">
            <div className="flex items-center gap-2 text-blue-400 font-bold text-sm">
              <ShieldCheck className="w-4 h-4" /> End-to-End Encrypted
            </div>
            <p className="leading-relaxed text-slate-400">
              WebCrypto AES-256 keys are negotiated peer-to-peer. Zero unencrypted packets ever leave your local device.
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
};
