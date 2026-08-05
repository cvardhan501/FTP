"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { P2PConnectionManager } from "../lib/webrtc";
import { IncomingFileMeta, TransferProgressState } from "../types";
import { Socket } from "socket.io-client";

export function useWebRTC(socket: Socket | null, sessionCode: string | null) {
  const p2pRef = useRef<P2PConnectionManager | null>(null);
  const earlyIceCandidatesRef = useRef<RTCIceCandidateInit[]>([]);

  const [peerConnected, setPeerConnected] = useState(false);
  const [incomingMeta, setIncomingMeta] = useState<IncomingFileMeta | null>(null);
  const [progressState, setProgressState] = useState<TransferProgressState | null>(null);
  const [completedBlobUrl, setCompletedBlobUrl] = useState<string | null>(null);

  const progressStateRef = useRef<TransferProgressState | null>(null);
  progressStateRef.current = progressState;

  // Buffer map for assembling incoming file chunks
  const incomingChunksRef = useRef<Map<number, ArrayBuffer>>(new Map());
  const receivedChunksCountRef = useRef(0);

  // Initialize P2P connection manager
  const initP2P = useCallback(
    async (isInitiator: boolean) => {
      console.log(`[WebRTC] Initializing P2P connection (isInitiator=${isInitiator})`);
      const manager = new P2PConnectionManager();
      p2pRef.current = manager;

      manager.onIceCandidate = (candidate) => {
        if (socket) {
          console.log("[WebRTC] Sending ICE candidate to peer");
          socket.emit("signal-ice", { candidate, sessionCode });
        }
      };

      manager.onDataChannelOpen = () => {
        console.log("[WebRTC] ✅ Peer DataChannel Connected & Ready!");
        setPeerConnected(true);
      };

      manager.onDataChannelClose = () => {
        console.log("[WebRTC] ❌ Peer DataChannel Closed");
        setPeerConnected(false);
      };

      manager.onFileChunkReceived = (chunkIndex, totalChunks, data) => {
        if (!incomingChunksRef.current.has(chunkIndex)) {
          incomingChunksRef.current.set(chunkIndex, data);
          receivedChunksCountRef.current += 1;
        }

        const count = receivedChunksCountRef.current;
        const total = totalChunks;
        const pct = Math.min(100, Math.round((count / total) * 100));

        setProgressState((prev) => {
          if (!prev) return null;
          const transferred = (count / total) * prev.fileSize;
          return {
            ...prev,
            currentChunk: count,
            transferredBytes: transferred,
            percentage: pct,
            status: count >= total ? "completed" : "transferring",
          };
        });

        if (count >= totalChunks) {
          assembleReceivedFile(totalChunks);
        }
      };

      await manager.initialize(isInitiator);

      // Flush early ICE candidates that arrived before manager initialization
      while (earlyIceCandidatesRef.current.length > 0) {
        const cand = earlyIceCandidatesRef.current.shift();
        if (cand) {
          console.log("[WebRTC] Flushing buffered early ICE candidate");
          await manager.addIceCandidate(cand);
        }
      }

      return manager;
    },
    [socket, sessionCode]
  );

  // Socket signaling listeners (Stable useEffect without progressState tear-downs)
  useEffect(() => {
    if (!socket) return;

    console.log("[WebRTC] Setting up signaling listeners for room:", sessionCode);

    const handlePeerJoined = async ({ peerId }: { peerId: string }) => {
      console.log("[WebRTC] Peer joined room. Sender initiating offer to:", peerId);
      const manager = await initP2P(true);
      const offer = await manager.createOffer();
      socket.emit("signal-offer", { targetId: peerId, offer, sessionCode });
    };

    const handleSignalOffer = async ({ senderId, offer }: { senderId: string; offer: RTCSessionDescriptionInit }) => {
      console.log("[WebRTC] Offer received from sender:", senderId);
      const manager = await initP2P(false);
      const answer = await manager.handleOffer(offer);
      console.log("[WebRTC] Sending answer back to sender:", senderId);
      socket.emit("signal-answer", { targetId: senderId, answer, sessionCode });
    };

    const handleSignalAnswer = async ({ answer }: { answer: RTCSessionDescriptionInit }) => {
      console.log("[WebRTC] Answer received from receiver");
      if (p2pRef.current) {
        await p2pRef.current.handleAnswer(answer);
      }
    };

    const handleSignalIce = async ({ candidate }: { candidate: RTCIceCandidateInit }) => {
      if (p2pRef.current) {
        await p2pRef.current.addIceCandidate(candidate);
      } else {
        console.log("[WebRTC] Buffering early ICE candidate before P2P manager ready");
        earlyIceCandidatesRef.current.push(candidate);
      }
    };

    const handleFileMeta = ({ fileMeta }: { fileMeta: IncomingFileMeta }) => {
      console.log("[WebRTC] Received incoming file metadata:", fileMeta.name);
      setIncomingMeta(fileMeta);
    };

    const handleFileAccept = () => {
      console.log("[WebRTC] Receiver accepted file transfer offer");
      if (p2pRef.current && progressStateRef.current?.status === "connecting") {
        setProgressState((prev) => (prev ? { ...prev, status: "transferring" } : null));
      }
    };

    const handleFileReject = () => {
      console.log("[WebRTC] Receiver declined file transfer offer");
      setProgressState((prev) =>
        prev ? { ...prev, status: "cancelled", errorMessage: "Transfer rejected by peer" } : null
      );
    };

    socket.on("peer-joined", handlePeerJoined);
    socket.on("signal-offer", handleSignalOffer);
    socket.on("signal-answer", handleSignalAnswer);
    socket.on("signal-ice", handleSignalIce);
    socket.on("file-meta", handleFileMeta);
    socket.on("file-accept", handleFileAccept);
    socket.on("file-reject", handleFileReject);

    return () => {
      socket.off("peer-joined", handlePeerJoined);
      socket.off("signal-offer", handleSignalOffer);
      socket.off("signal-answer", handleSignalAnswer);
      socket.off("signal-ice", handleSignalIce);
      socket.off("file-meta", handleFileMeta);
      socket.off("file-accept", handleFileAccept);
      socket.off("file-reject", handleFileReject);
    };
  }, [socket, sessionCode, initP2P]);

  // Reassemble chunks into downloadable Blob
  const assembleReceivedFile = (totalChunks: number) => {
    const chunkArray: ArrayBuffer[] = [];
    for (let i = 0; i < totalChunks; i++) {
      const chunk = incomingChunksRef.current.get(i);
      if (chunk) chunkArray.push(chunk);
    }

    const mimeType = incomingMeta?.type || "application/octet-stream";
    const blob = new Blob(chunkArray, { type: mimeType });
    const url = URL.createObjectURL(blob);
    setCompletedBlobUrl(url);

    // Auto-trigger browser download
    const a = document.createElement("a");
    a.href = url;
    a.download = incomingMeta?.name || "transferred_file";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // Start sending file
  const sendFileP2P = async (file: File, chunkSizeKb: number = 64) => {
    if (!p2pRef.current) {
      console.error("[WebRTC] Cannot send file: P2P manager is not connected");
      return;
    }

    const fileMeta: IncomingFileMeta = {
      id: Date.now().toString(),
      name: file.name,
      size: file.size,
      type: file.type || "application/octet-stream",
      totalChunks: Math.ceil(file.size / (chunkSizeKb * 1024)),
      iv: "",
      salt: "",
      senderName: "Peer",
      senderId: socket?.id || "",
    };

    setProgressState({
      transferId: fileMeta.id,
      fileName: file.name,
      fileSize: file.size,
      transferredBytes: 0,
      currentChunk: 0,
      totalChunks: fileMeta.totalChunks,
      speedBps: 0,
      etaSeconds: 0,
      percentage: 0,
      status: "transferring",
      isSender: true,
    });

    if (socket) {
      socket.emit("file-meta", { sessionCode, fileMeta });
    }

    try {
      await p2pRef.current.sendFile(file, chunkSizeKb, (sent, total, speed) => {
        const pct = Math.min(100, Math.round((sent / total) * 100));
        const rem = total - sent;
        const eta = speed > 0 ? rem / speed : 0;

        setProgressState((prev) =>
          prev
            ? {
                ...prev,
                transferredBytes: sent,
                speedBps: speed,
                etaSeconds: eta,
                percentage: pct,
                status: sent >= total ? "completed" : "transferring",
              }
            : null
        );
      });
    } catch (err: any) {
      setProgressState((prev) =>
        prev
          ? {
              ...prev,
              status: "error",
              errorMessage: err.message || "Failed to transfer file",
            }
          : null
      );
    }
  };

  const acceptIncomingFile = () => {
    if (!incomingMeta) return;
    incomingChunksRef.current.clear();
    receivedChunksCountRef.current = 0;

    setProgressState({
      transferId: incomingMeta.id,
      fileName: incomingMeta.name,
      fileSize: incomingMeta.size,
      transferredBytes: 0,
      currentChunk: 0,
      totalChunks: incomingMeta.totalChunks,
      speedBps: 0,
      etaSeconds: 0,
      percentage: 0,
      status: "transferring",
      isSender: false,
    });

    if (socket) {
      socket.emit("file-accept", { targetId: incomingMeta.senderId, transferId: incomingMeta.id });
    }
  };

  const rejectIncomingFile = () => {
    if (!incomingMeta) return;
    if (socket) {
      socket.emit("file-reject", { targetId: incomingMeta.senderId, transferId: incomingMeta.id });
    }
    setIncomingMeta(null);
  };

  const pauseTransfer = () => {
    p2pRef.current?.pauseTransfer();
    setProgressState((prev) => (prev ? { ...prev, status: "paused" } : null));
  };

  const resumeTransfer = () => {
    p2pRef.current?.resumeTransfer();
    setProgressState((prev) => (prev ? { ...prev, status: "transferring" } : null));
  };

  const cancelTransfer = () => {
    p2pRef.current?.cancelTransfer();
    setProgressState(null);
    setIncomingMeta(null);
  };

  return {
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
  };
}
