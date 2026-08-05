"use client";

import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import { DeviceInfo } from "../types";
import { detectBrowser, detectOS, generateRandomDeviceName } from "../lib/utils";

const SIGNALING_URL = process.env.NEXT_PUBLIC_SIGNALING_URL || "http://localhost:3001";

export function useSocket() {
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [activeDevices, setActiveDevices] = useState<DeviceInfo[]>([]);
  const [currentSessionCode, setCurrentSessionCode] = useState<string | null>(null);
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo | null>(null);

  useEffect(() => {
    // Generate self device info
    const selfInfo: DeviceInfo = {
      id: "pending",
      name: generateRandomDeviceName(),
      os: detectOS(),
      browser: detectBrowser(),
      isSelf: true,
      signalStrength: "excellent",
      pingMs: 12,
    };

    const socket = io(SIGNALING_URL, {
      reconnectionAttempts: 10,
      transports: ["websocket", "polling"],
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("[Socket] Connected to signaling server with ID:", socket.id);
      setIsConnected(true);
      selfInfo.id = socket.id || "local";
      setDeviceInfo(selfInfo);

      // Announce device presence
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

    return () => {
      socket.disconnect();
    };
  }, []);

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
    createRoom,
    joinRoom,
  };
}
