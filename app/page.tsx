"use client";

import React, { useEffect, useState } from "react";
import confetti from "canvas-confetti";
import { AppMode, ClipboardMessage, FileItem, HistoryRecord } from "../types";
import { useSocket } from "../hooks/useSocket";
import { useWebRTC } from "../hooks/useWebRTC";
import { useAudioSFX } from "../hooks/useAudioSFX";
import { usePWA } from "../hooks/usePWA";
import { generateSessionCode } from "../lib/utils";
import { addHistoryRecord, getStoredSettings, getTransferHistory, saveStoredSettings } from "../lib/storage";

// Components
import { Navbar } from "../components/navbar/Navbar";
import { BottomNav } from "../components/navbar/BottomNav";
import { LandingView } from "../components/landing/LandingView";
import { HomeView } from "../components/home/HomeView";
import { SendView } from "../components/send/SendView";
import { ReceiveView } from "../components/receive/ReceiveView";
import { NearbyDevicesView } from "../components/radar/NearbyDevicesView";
import { ClipboardSyncView } from "../components/clipboard/ClipboardSyncView";
import { HistoryView } from "../components/history/HistoryView";
import { QRCodeModal } from "../components/qr/QRCodeModal";
import { QRScannerModal } from "../components/qr/QRScannerModal";
import { ProgressOverlay } from "../components/transfer/ProgressOverlay";
import { TransferCompleteModal } from "../components/transfer/TransferCompleteModal";
import { IncomingFileModal } from "../components/receive/IncomingFileModal";
import { AIAssistantModal } from "../components/ai/AIAssistantModal";
import { SettingsModal } from "../components/settings/SettingsModal";
import { DeviceInviteModal } from "../components/radar/DeviceInviteModal";
import { Button, Badge } from "../components/ui";
import { Download, WifiOff } from "lucide-react";

export default function Home() {
  const [currentMode, setCurrentMode] = useState<AppMode>("home");
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [settings, setSettings] = useState(getStoredSettings());

  // PWA Hook
  const { isInstallable, isOffline, installPWA } = usePWA();

  // Modals state
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [qrScannerOpen, setQrScannerOpen] = useState(false);
  const [aiAssistantOpen, setAiAssistantOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [completionModalOpen, setCompletionModalOpen] = useState(false);

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
    updateDeviceName,
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
    if (isConnected && sessionCode && (currentMode === "send" || currentMode === "landing" || currentMode === "home")) {
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

  // Auto-accept incoming file offers if autoAcceptFiles setting is enabled
  useEffect(() => {
    if (incomingMeta && settings.autoAcceptFiles) {
      console.log("[Auto-Accept] Auto-accepting incoming file transfer offer:", incomingMeta.name);
      acceptIncomingFile();
    }
  }, [incomingMeta, settings.autoAcceptFiles, acceptIncomingFile]);

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
      setCompletionModalOpen(true);
      try {
        if (typeof confetti === "function") {
          confetti({
            particleCount: 60,
            spread: 70,
            origin: { y: 0.6 },
            ticks: 150,
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
    if (newSt.deviceName) {
      updateDeviceName(newSt.deviceName);
    }
  };

  const handleSelectMode = (mode: AppMode) => {
    if (mode === "settings") {
      setSettingsOpen(true);
    } else {
      setCurrentMode(mode);
    }
  };

  return (
    <div className="min-h-screen flex flex-col font-sans transition-colors bg-[#090d16] text-white selection:bg-blue-500 selection:text-white">
      <Navbar
        currentMode={currentMode}
        onSelectMode={handleSelectMode}
        isConnected={isConnected}
        theme={theme}
        onToggleTheme={toggleTheme}
        onOpenAIAssistant={() => setAiAssistantOpen(true)}
      />

      {/* Offline Warning Bar */}
      {isOffline && (
        <div className="bg-amber-500/20 border-b border-amber-500/30 px-4 py-2 text-center text-xs text-amber-300 flex items-center justify-center gap-2 font-medium">
          <WifiOff className="w-4 h-4" /> ⚡ Offline Mode Active – App cached via PWA. Sharing works on Local Wi-Fi & Hotspot!
        </div>
      )}

      {/* PWA Install Banner */}
      {isInstallable && (
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-4 py-2.5 text-white flex items-center justify-between text-xs font-semibold shadow-lg">
          <div className="flex items-center gap-2">
            <Download className="w-4 h-4 animate-bounce" />
            <span>Install AirDropX App for 1-Tap Offline File Sharing on your phone!</span>
          </div>
          <Button variant="secondary" size="sm" onClick={installPWA} className="py-1 px-3 text-xs">
            Install App
          </Button>
        </div>
      )}

      <main className="flex-1 pb-24">
        {currentMode === "landing" && <LandingView onSelectMode={handleSelectMode} />}

        {(currentMode === "home" || currentMode === "settings") && (
          <HomeView
            onSelectMode={handleSelectMode}
            activeDevices={activeDevices}
            historyRecords={historyRecords}
            onConnectDevice={(targetId) => sendDeviceInvite(targetId, sessionCode)}
          />
        )}

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
            fileName={progressState?.fileName}
          />
        )}

        {currentMode === "radar" && (
          <NearbyDevicesView
            activeDevices={activeDevices}
            onConnectDevice={(targetId) => sendDeviceInvite(targetId, sessionCode)}
            onBack={() => setCurrentMode("home")}
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
              localStorage.removeItem("airdropx_history");
              setHistoryRecords([]);
            }}
          />
        )}
      </main>

      {/* Floating Bottom Navigation Bar (Matches Mockup) */}
      <BottomNav currentMode={currentMode} onSelectMode={handleSelectMode} />

      {/* Active Transfer Progress Overlay (Matches Screen 6) */}
      <ProgressOverlay
        state={progressState}
        onPause={pauseTransfer}
        onResume={resumeTransfer}
        onCancel={cancelTransfer}
      />

      {/* Transfer Complete Modal (Matches Screen 7) */}
      <TransferCompleteModal
        isOpen={completionModalOpen}
        onClose={() => setCompletionModalOpen(false)}
        fileName={progressState?.fileName}
        fileSize={progressState?.fileSize}
        completedBlobUrl={completedBlobUrl}
      />

      {/* Incoming File Offer Prompt Modal (Matches Screen 11) */}
      <IncomingFileModal
        incomingMeta={incomingMeta}
        onAccept={acceptIncomingFile}
        onDecline={rejectIncomingFile}
      />

      {/* Modals */}
      <QRCodeModal
        isOpen={qrModalOpen}
        onClose={() => setQrModalOpen(false)}
        sessionCode={sessionCode}
      />

      <QRScannerModal
        isOpen={qrScannerOpen}
        onClose={() => setQrScannerOpen(false)}
        onScanSuccess={(code) => {
          setQrScannerOpen(false);
          handleJoinRoomByCode(code);
        }}
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

      {/* Device Discovery Pairing Request Modal */}
      <DeviceInviteModal
        invite={incomingInvite}
        onAccept={(senderId, sCode) => {
          setSessionCode(sCode);
          acceptDeviceInvite(senderId, sCode);
          setCurrentMode("receive");
        }}
        onDecline={declineDeviceInvite}
      />
    </div>
  );
}
