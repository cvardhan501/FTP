"use client";

import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import { DeviceInfo } from "../types";
import { detectBrowser, detectOS, generateRandomDeviceName } from "../lib/utils";

function getSignalingUrl(): string {
  if (process.env.NEXT_PUBLIC_SIGNALING_URL) {
    return process.env.NEXT_PUBLIC_SIGNALING_URL;
  }
  if (typeof window !== "undefined") {
    const hostname = window.location.hostname || "localhost";
    return `http://${hostname}:3001`;
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
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("[Socket] Connected with Socket ID:", socket.id);
      setIsConnected(true);
      selfInfo.id = socket.id || "local";
      setDeviceInfo(selfInfo);

      // Announce device presence for discovery radar
      socket.emit("announce-device", selfInfo);
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
    sendDeviceInvite,
    acceptDeviceInvite,
    declineDeviceInvite,
    createRoom,
    joinRoom,
  };
}
