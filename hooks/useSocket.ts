"use client";

import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import { DeviceInfo } from "../types";
import { detectBrowser, detectOS, generateRandomDeviceName } from "../lib/utils";

function getSignalingUrl(): string {
  // If explicitly configured via environment variable
  if (process.env.NEXT_PUBLIC_SIGNALING_URL) {
    let url = process.env.NEXT_PUBLIC_SIGNALING_URL.trim();
    if (typeof window !== "undefined" && window.location.protocol === "https:" && url.startsWith("http://")) {
      url = url.replace("http://", "https://");
    }
    return url;
  }

  if (typeof window !== "undefined") {
    const isHttps = window.location.protocol === "https:";
    const protocol = isHttps ? "https" : "http";
    const hostname = window.location.hostname || "localhost";

    // Local development or local Wi-Fi IP (192.168.x.x, 10.x.x.x, 172.x.x.x)
    if (
      hostname === "localhost" ||
      hostname === "127.0.0.1" ||
      hostname.startsWith("192.168.") ||
      hostname.startsWith("10.") ||
      hostname.startsWith("172.")
    ) {
      return `${protocol}://${hostname}:3001`;
    }

    // Production / Deployed environment (e.g. Vercel)
    // Connect to live Render signaling server
    return "https://ftp-sff3.onrender.com";
  }

  return "http://localhost:3001";
}

export function useSocket() {
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [activeDevices, setActiveDevices] = useState<DeviceInfo[]>([]);
  const [currentSessionCode, setCurrentSessionCode] = useState<string | null>(null);
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo | null>(null);
  const [incomingInvite, setIncomingInvite] = useState<{ senderId: string; sessionCode: string; senderDevice: DeviceInfo } | null>(null);

  useEffect(() => {
    const selfInfo: DeviceInfo = {
      id: "pending",
      name: generateRandomDeviceName(),
      os: detectOS(),
      browser: detectBrowser(),
      isSelf: true,
      signalStrength: "excellent",
      pingMs: 12,
    };

    const signalingUrl = getSignalingUrl();
    console.log("[Socket] Connecting to signaling server at:", signalingUrl);

    const socket = io(signalingUrl, {
      reconnectionAttempts: 10,
      transports: ["websocket", "polling"],
      secure: typeof window !== "undefined" && window.location.protocol === "https:",
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("[Socket] Connected to signaling server with ID:", socket.id);
      setIsConnected(true);
      selfInfo.id = socket.id || "local";
      setDeviceInfo(selfInfo);

      // Announce device presence for discovery radar
      socket.emit("announce-device", selfInfo);
    });

    socket.on("connect_error", (err) => {
      console.error("[Socket] Connection error:", err.message);
    });

    socket.on("disconnect", () => {
      console.log("[Socket] Disconnected from signaling server");
      setIsConnected(false);
    });

    socket.on("discovery-update", (devices: DeviceInfo[]) => {
      setActiveDevices(
        devices.map((d) => ({
          ...d,
          isSelf: d.id === socket.id,
        }))
      );
    });

    socket.on("device-invite", (invite) => {
      console.log("[Socket] Incoming device invite:", invite);
      setIncomingInvite(invite);
    });

    socket.on("device-invite-accepted", ({ sessionCode }: { sessionCode: string }) => {
      console.log("[Socket] Sender received invite accepted notification. Auto joining room:", sessionCode);
      if (socketRef.current) {
        socketRef.current.emit("join-room", { sessionCode });
      }
    });

    // Heartbeat every 5 seconds to stay active in radar
    const heartbeatTimer = setInterval(() => {
      if (socket.connected) {
        socket.emit("heartbeat");
      }
    }, 5000);

    return () => {
      clearInterval(heartbeatTimer);
      socket.disconnect();
    };
  }, []);

  const updateDeviceName = (newName: string) => {
    if (!newName.trim()) return;
    setDeviceInfo((prev) => {
      if (!prev) return null;
      const updated = { ...prev, name: newName.trim() };
      if (socketRef.current && socketRef.current.connected) {
        socketRef.current.emit("announce-device", updated);
      }
      return updated;
    });
  };

  const sendDeviceInvite = (targetId: string, sessionCode: string) => {
    if (socketRef.current && deviceInfo) {
      console.log("[Socket] Sending direct invite to device:", targetId);
      socketRef.current.emit("device-invite", {
        targetId,
        sessionCode,
        senderDevice: deviceInfo,
      });
    }
  };

  const acceptDeviceInvite = (senderId: string, sessionCode: string) => {
    if (socketRef.current) {
      console.log("[Socket] Accepting device invite from:", senderId);
      socketRef.current.emit("device-invite-accept", { senderId, sessionCode });
      socketRef.current.emit("join-room", { sessionCode, deviceData: deviceInfo });
      setIncomingInvite(null);
    }
  };

  const declineDeviceInvite = () => {
    setIncomingInvite(null);
  };

  const createRoom = (sessionCode: string): Promise<{ success: boolean }> => {
    return new Promise((resolve) => {
      if (!socketRef.current) return resolve({ success: false });
      setCurrentSessionCode(sessionCode);
      socketRef.current.emit(
        "create-room",
        { sessionCode, deviceData: deviceInfo },
        (res: { success: boolean }) => resolve(res)
      );
    });
  };

  const joinRoom = (sessionCode: string): Promise<{ success: boolean; hostId?: string; error?: string }> => {
    return new Promise((resolve) => {
      if (!socketRef.current) return resolve({ success: false, error: "Socket not connected" });
      setCurrentSessionCode(sessionCode);
      socketRef.current.emit(
        "join-room",
        { sessionCode, deviceData: deviceInfo },
        (res: { success: boolean; hostId?: string; error?: string }) => resolve(res)
      );
    });
  };

  return {
    socket: socketRef.current,
    isConnected,
    deviceInfo,
    activeDevices,
    currentSessionCode,
    incomingInvite,
    updateDeviceName,
    sendDeviceInvite,
    acceptDeviceInvite,
    declineDeviceInvite,
    createRoom,
    joinRoom,
  };
}
