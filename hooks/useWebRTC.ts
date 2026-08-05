"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { P2PConnectionManager } from "../lib/webrtc";
import { IncomingFileMeta, TransferProgressState } from "../types";
import { Socket } from "socket.io-client";

export function useWebRTC(socket: Socket | null, sessionCode: string | null) {
  const p2pRef = useRef<P2PConnectionManager | null>(null);
  const [peerConnected, setPeerConnected] = useState(false);
  const [incomingMeta, setIncomingMeta] = useState<IncomingFileMeta | null>(null);
  const [progressState, setProgressState] = useState<TransferProgressState | null>(null);
  const [completedBlobUrl, setCompletedBlobUrl] = useState<string | null>(null);

  // Buffer map for assembling incoming file chunks
  const incomingChunksRef = useRef<Map<number, ArrayBuffer>>(new Map());
  const receivedChunksCountRef = useRef(0);

  // Initialize P2P connection
  const initP2P = useCallback(
    async (isInitiator: boolean) => {
      const manager = new P2PConnectionManager();
      p2pRef.current = manager;

      manager.onIceCandidate = (candidate) => {
        if (socket) {
          socket.emit("signal-ice", { candidate, sessionCode });
        }
      };

      manager.onDataChannelOpen = () => {
        setPeerConnected(true);
      };

      manager.onDataChannelClose = () => {
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

        // Trigger completion once all chunks are present
        if (count >= totalChunks) {
          assembleReceivedFile(totalChunks);
        }
      };

      await manager.initialize(isInitiator);
      return manager;
    },
    [socket, sessionCode]
  );

  // Socket signaling listeners
  useEffect(() => {
    if (!socket) return;

    socket.on("peer-joined", async ({ peerId }) => {
      const manager = await initP2P(true);
      const offer = await manager.createOffer();
      socket.emit("signal-offer", { targetId: peerId, offer, sessionCode });
    });

    socket.on("signal-offer", async ({ senderId, offer }) => {
      const manager = await initP2P(false);
      const answer = await manager.handleOffer(offer);
      socket.emit("signal-answer", { targetId: senderId, answer, sessionCode });
    });

    socket.on("signal-answer", async ({ answer }) => {
      if (p2pRef.current) {
        await p2pRef.current.handleAnswer(answer);
      }
    });

    socket.on("signal-ice", async ({ candidate }) => {
      if (p2pRef.current) {
        await p2pRef.current.addIceCandidate(candidate);
      }
    });

    socket.on("file-meta", ({ fileMeta }) => {
      setIncomingMeta(fileMeta);
    });

    socket.on("file-accept", async ({ transferId }) => {
      // Receiver accepted file, sender starts transmitting
      if (p2pRef.current && progressState?.status === "connecting") {
        setProgressState((prev) => (prev ? { ...prev, status: "transferring" } : null));
      }
    });

    socket.on("file-reject", () => {
      setProgressState((prev) =>
        prev ? { ...prev, status: "cancelled", errorMessage: "Transfer rejected by peer" } : null
      );
    });

    return () => {
      socket.off("peer-joined");
      socket.off("signal-offer");
      socket.off("signal-answer");
      socket.off("signal-ice");
      socket.off("file-meta");
      socket.off("file-accept");
      socket.off("file-reject");
    };
  }, [socket, sessionCode, initP2P, progressState]);

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
    if (!p2pRef.current) return;

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

    // Notify receiver
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

  const pauseTransfer = () => p2pRef.current?.pauseTransfer();
  const resumeTransfer = () => p2pRef.current?.resumeTransfer();
  const cancelTransfer = () => p2pRef.current?.cancelTransfer();

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
