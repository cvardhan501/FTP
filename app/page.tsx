"use client";

import React, { useEffect, useState } from "react";
import confetti from "canvas-confetti";
import { AppMode, ClipboardMessage, FileItem, HistoryRecord } from "../types";
import { useSocket } from "../hooks/useSocket";
import { useWebRTC } from "../hooks/useWebRTC";
import { useAudioSFX } from "../hooks/useAudioSFX";
import { generateSessionCode } from "../lib/utils";
import { addHistoryRecord, getStoredSettings, getTransferHistory, saveStoredSettings } from "../lib/storage";

// Components
import { Navbar } from "../components/navbar/Navbar";
import { LandingView } from "../components/landing/LandingView";
import { SendView } from "../components/send/SendView";
import { ReceiveView } from "../components/receive/ReceiveView";
import { ClipboardSyncView } from "../components/clipboard/ClipboardSyncView";
import { HistoryView } from "../components/history/HistoryView";
import { QRCodeModal } from "../components/qr/QRCodeModal";
import { QRScannerModal } from "../components/qr/QRScannerModal";
import { ProgressOverlay } from "../components/transfer/ProgressOverlay";
import { AIAssistantModal } from "../components/ai/AIAssistantModal";
import { SettingsModal } from "../components/settings/SettingsModal";
import { Button, Badge } from "../components/ui";
import { Wifi, Check, X, ShieldCheck } from "lucide-react";

export default function Home() {
  const [currentMode, setCurrentMode] = useState<AppMode>("landing");
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [settings, setSettings] = useState(getStoredSettings());

  // Modals state
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [qrScannerOpen, setQrScannerOpen] = useState(false);
  const [aiAssistantOpen, setAiAssistantOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  // Files & Clipboard
  const [selectedFiles, setSelectedFiles] = useState<FileItem[]>([]);
  const [clipboardMessages, setClipboardMessages] = useState<ClipboardMessage[]>([]);
  const [historyRecords, setHistoryRecords] = useState<HistoryRecord[]>(getTransferHistory());

  // Socket & WebRTC Hooks
  const {
    socket,
    isConnected,
    activeDevices,
    incomingInvite,
    sendDeviceInvite,
    acceptDeviceInvite,
    declineDeviceInvite,
    createRoom,
    joinRoom,
  } = useSocket();

  const [sessionCode, setSessionCode] = useState(() => generateSessionCode());

  const {
    peerConnected,
    incomingMeta,
    progressState,
    completedBlobUrl,
    sendFileP2P,
    acceptIncomingFile,
    rejectIncomingFile,
    pauseTransfer,
    resumeTransfer,
    cancelTransfer,
  } = useWebRTC(socket, sessionCode);

  const sfx = useAudioSFX(settings.soundEffects);

  // Initialize room on creation or URL query search param
  useEffect(() => {
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      const codeFromUrl = urlParams.get("code");
      if (codeFromUrl && codeFromUrl.length === 6) {
        setSessionCode(codeFromUrl);
        setCurrentMode("receive");
      }
    }
  }, []);

  useEffect(() => {
    if (isConnected && sessionCode && (currentMode === "send" || currentMode === "landing")) {
      createRoom(sessionCode);
    }
  }, [isConnected, sessionCode, currentMode, createRoom]);

  // Socket clipboard listener
  useEffect(() => {
    if (!socket) return;
    socket.on("clipboard-sync", (msg: ClipboardMessage) => {
      setClipboardMessages((prev) => [msg, ...prev]);
      sfx.playClick();
    });
    return () => {
      socket.off("clipboard-sync");
    };
  }, [socket, sfx]);

  const hasTriggeredCompletionRef = React.useRef<string | null>(null);

  // Audio & Confetti on transfer completion (Once per transfer)
  useEffect(() => {
    if (
      progressState?.status === "completed" &&
      progressState.transferId &&
      hasTriggeredCompletionRef.current !== progressState.transferId
    ) {
      hasTriggeredCompletionRef.current = progressState.transferId;
      sfx.playSuccess();
      try {
        if (typeof confetti === "function") {
          confetti({
            particleCount: 50,
            spread: 60,
            origin: { y: 0.6 },
            ticks: 120,
            disableForReducedMotion: true,
          });
        }
      } catch (e) {}

      // Log into history
      const record: HistoryRecord = {
        id: Date.now().toString(),
        fileName: progressState.fileName,
        fileSize: progressState.fileSize,
        fileType: "application/octet-stream",
        direction: progressState.isSender ? "sent" : "received",
        peerName: "WebRTC Peer",
        timestamp: Date.now(),
        durationMs: 1000,
        avgSpeedBps: progressState.speedBps || 1024 * 1024 * 35,
        encrypted: true,
      };
      addHistoryRecord(record);
      setHistoryRecords(getTransferHistory());
    } else if (progressState?.status === "transferring" && progressState.percentage === 1) {
      sfx.playStart();
    } else if (progressState?.status === "error") {
      sfx.playError();
    }
  }, [progressState?.status, progressState?.transferId, sfx]);

  const handleAddFiles = (newFiles: File[]) => {
    const items: FileItem[] = newFiles.map((file) => ({
      id: Math.random().toString(36).substring(2, 9),
      file,
      name: file.name,
      size: file.size,
      type: file.type || "application/octet-stream",
      previewUrl: file.type.startsWith("image/") ? URL.createObjectURL(file) : undefined,
    }));
    setSelectedFiles((prev) => [...prev, ...items]);
  };

  const handleRemoveFile = (id: string) => {
    setSelectedFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const handleStartTransfer = (fileItem: FileItem) => {
    sendFileP2P(fileItem.file, settings.chunkSizeKb);
  };

  const handleJoinRoomByCode = async (code: string) => {
    setSessionCode(code);
    const res = await joinRoom(code);
    return res;
  };

  const handleSendTextSnippet = (text: string) => {
    if (!socket) return;
    const msg: ClipboardMessage = {
      id: Date.now().toString(),
      text,
      senderName: "You",
      timestamp: Date.now(),
    };
    setClipboardMessages((prev) => [msg, ...prev]);
    socket.emit("clipboard-sync", { sessionCode, text, senderName: "Peer" });
  };

  const handleAcceptInvite = () => {
    if (incomingInvite) {
      setSessionCode(incomingInvite.sessionCode);
      joinRoom(incomingInvite.sessionCode);
      acceptDeviceInvite(incomingInvite.senderId, incomingInvite.sessionCode);
    }
  };

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    if (next === "light") {
      document.documentElement.classList.remove("dark");
      document.documentElement.classList.add("light");
    } else {
      document.documentElement.classList.remove("light");
      document.documentElement.classList.add("dark");
    }
  };

  const handleUpdateSettings = (newSt: Partial<typeof settings>) => {
    const updated = { ...settings, ...newSt };
    setSettings(updated);
    saveStoredSettings(updated);
  };

  return (
    <div className="min-h-screen flex flex-col font-sans transition-colors">
      <Navbar
        currentMode={currentMode}
        onSelectMode={(m) => {
          if (m === "settings") setSettingsOpen(true);
          else setCurrentMode(m);
        }}
        isConnected={isConnected}
        theme={theme}
        onToggleTheme={toggleTheme}
        onOpenAIAssistant={() => setAiAssistantOpen(true)}
      />

      <main className="flex-1">
        {currentMode === "landing" && <LandingView onSelectMode={setCurrentMode} />}

        {currentMode === "send" && (
          <SendView
            files={selectedFiles}
            onAddFiles={handleAddFiles}
            onRemoveFile={handleRemoveFile}
            sessionCode={sessionCode}
            onOpenQRModal={() => setQrModalOpen(true)}
            activeDevices={activeDevices}
            peerConnected={peerConnected}
            onStartTransfer={handleStartTransfer}
            onSendDeviceInvite={(targetId) => sendDeviceInvite(targetId, sessionCode)}
          />
        )}

        {currentMode === "receive" && (
          <ReceiveView
            onJoinRoom={handleJoinRoomByCode}
            onOpenQRScanner={() => setQrScannerOpen(true)}
            peerConnected={peerConnected}
            incomingMeta={incomingMeta}
            onAcceptFile={acceptIncomingFile}
            onRejectFile={rejectIncomingFile}
            completedBlobUrl={completedBlobUrl}
          />
        )}

        {currentMode === "clipboard" && (
          <ClipboardSyncView
            messages={clipboardMessages}
            onSendText={handleSendTextSnippet}
            peerConnected={peerConnected}
          />
        )}

        {currentMode === "history" && (
          <HistoryView
            records={historyRecords}
            onClearHistory={() => {
              localStorage.removeItem("airdropx_transfer_history");
              setHistoryRecords([]);
            }}
          />
        )}
      </main>

      {/* Instant Device Invite Popup Modal */}
      {incomingInvite && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="glass-panel w-full max-w-md p-6 rounded-3xl relative border border-indigo-500/50 shadow-2xl space-y-6 text-center">
            <div className="w-16 h-16 rounded-2xl bg-indigo-600/20 border border-indigo-500/40 text-indigo-400 mx-auto flex items-center justify-center">
              <Wifi className="w-8 h-8 animate-pulse" />
            </div>

            <div>
              <Badge variant="purple" className="mb-2">Nearby Device Pairing</Badge>
              <h2 className="text-xl font-bold text-white">
                {incomingInvite.senderDevice.name}
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Wants to connect with your device for encrypted peer-to-peer file transfer.
              </p>
            </div>

            <div className="bg-slate-900/80 p-3 rounded-xl border border-white/10 text-xs text-slate-300 flex items-center justify-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" /> Session PIN:{" "}
              <span className="font-mono text-blue-400 font-bold">{incomingInvite.sessionCode}</span>
            </div>

            <div className="flex gap-3">
              <Button variant="ghost" className="flex-1 py-3" onClick={declineDeviceInvite}>
                <X className="w-4 h-4 mr-1 text-rose-400" /> Decline
              </Button>
              <Button variant="secondary" className="flex-1 py-3" onClick={handleAcceptInvite}>
                <Check className="w-4 h-4 mr-1 text-emerald-300" /> Accept & Pair
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modals & Overlays */}
      <QRCodeModal
        isOpen={qrModalOpen}
        onClose={() => setQrModalOpen(false)}
        sessionCode={sessionCode}
      />

      <QRScannerModal
        isOpen={qrScannerOpen}
        onClose={() => setQrScannerOpen(false)}
        onScanSuccess={(code) => {
          handleJoinRoomByCode(code);
        }}
      />

      <ProgressOverlay
        state={progressState}
        onPause={pauseTransfer}
        onResume={resumeTransfer}
        onCancel={cancelTransfer}
      />

      <AIAssistantModal
        isOpen={aiAssistantOpen}
        onClose={() => setAiAssistantOpen(false)}
      />

      <SettingsModal
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        settings={settings}
        onUpdateSettings={handleUpdateSettings}
      />
    </div>
  );
}
