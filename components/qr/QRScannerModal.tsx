"use client";

import React, { useEffect, useRef, useState } from "react";
import jsQR from "jsqr";
import { X, Camera, RefreshCw, AlertCircle, Scan } from "lucide-react";
import { Button } from "../ui";

interface QRScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScanSuccess: (code: string) => void;
}

export const QRScannerModal: React.FC<QRScannerModalProps> = ({ isOpen, onClose, onScanSuccess }) => {
  const [manualCode, setManualCode] = useState("");
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const stopCamera = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsScanning(false);
  };

  const startCamera = async () => {
    setCameraError(null);
    stopCamera();

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Camera API not supported on this browser.");
      }

      // Enforce rear/back camera strictly (facingMode: environment)
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } },
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute("playsinline", "true");
        await videoRef.current.play();
        setIsScanning(true);
        scanFrame();
      }
    } catch (err: any) {
      console.warn("[QRScanner] Camera access error:", err);
      setCameraError(
        err.name === "NotAllowedError" || err.name === "PermissionDeniedError"
          ? "Camera permission denied. Please allow camera access in browser settings."
          : "Rear camera not available or active in another app."
      );
    }
  };

  const scanFrame = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (!video || !canvas || video.readyState !== video.HAVE_ENOUGH_DATA) {
      animationFrameRef.current = requestAnimationFrame(scanFrame);
      return;
    }

    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) {
      animationFrameRef.current = requestAnimationFrame(scanFrame);
      return;
    }

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const codeResult = jsQR(imageData.data, imageData.width, imageData.height, {
      inversionAttempts: "dontInvert",
    });

    if (codeResult && codeResult.data) {
      let rawText = codeResult.data.trim();
      console.log("[QRScanner] Decoded QR Text:", rawText);

      let code = rawText;
      if (rawText.includes("code=")) {
        const match = rawText.match(/code=(\d{6})/);
        if (match) code = match[1];
      }

      if (code.length === 6) {
        stopCamera();
        onScanSuccess(code);
        onClose();
        return;
      }
    }

    animationFrameRef.current = requestAnimationFrame(scanFrame);
  };

  useEffect(() => {
    if (isOpen) {
      // Delay camera start slightly to ensure DOM ref is mounted
      const timer = setTimeout(() => {
        startCamera();
      }, 100);
      return () => {
        clearTimeout(timer);
        stopCamera();
      };
    } else {
      stopCamera();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualCode.trim().length === 6) {
      stopCamera();
      onScanSuccess(manualCode.trim());
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xl animate-fadeIn">
      <div className="glass-panel w-full max-w-sm p-6 rounded-[36px] relative border border-purple-500/40 shadow-2xl space-y-5 text-center">
        {/* Close Button */}
        <button
          onClick={() => {
            stopCamera();
            onClose();
          }}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-full hover:bg-white/10 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Title */}
        <div className="flex items-center justify-center gap-2 text-purple-300 font-bold text-lg">
          <Scan className="w-5 h-5 animate-pulse" />
          <span>Scan Session QR Code</span>
        </div>

        {/* Hidden Canvas for Decoding */}
        <canvas ref={canvasRef} className="hidden" />

        {/* Camera Viewport Area (Perfect Square Shape) */}
        <div className="relative w-64 h-64 mx-auto bg-slate-950 rounded-[32px] overflow-hidden border-2 border-purple-500/40 shadow-2xl flex items-center justify-center">
          <video
            ref={videoRef}
            className="w-full h-full object-cover"
            playsInline
            muted
          />

          {/* Glowing Animated Target Corner Brackets & Scanner Line */}
          {isScanning && !cameraError && (
            <div className="absolute inset-0 pointer-events-none p-3 flex items-center justify-center">
              {/* Target Square */}
              <div className="w-full h-full relative border-2 border-purple-400/50 rounded-2xl shadow-2xl">
                {/* Corner Accents */}
                <div className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-purple-400 rounded-tl-xl" />
                <div className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-purple-400 rounded-tr-xl" />
                <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-purple-400 rounded-bl-xl" />
                <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-purple-400 rounded-br-xl" />

                {/* Moving Scanning Laser Line */}
                <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-purple-400 to-transparent shadow-[0_0_15px_#a855f7] animate-[scanLaser_2s_ease-in-out_infinite]" />
              </div>
            </div>
          )}

          {/* Camera Error Message */}
          {cameraError && (
            <div className="absolute inset-0 p-5 bg-slate-950/95 flex flex-col items-center justify-center text-center space-y-3 text-xs text-rose-400 font-medium">
              <AlertCircle className="w-9 h-9" />
              <p>{cameraError}</p>
              <Button variant="glass" size="sm" onClick={startCamera} className="mt-2 py-1.5 px-3 text-xs">
                <RefreshCw className="w-3.5 h-3.5 mr-1" /> Retry Camera
              </Button>
            </div>
          )}
        </div>

        {/* Manual Code Input Fallback */}
        <div className="space-y-3 pt-1">
          <div className="relative text-center">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/10" /></div>
            <span className="relative bg-slate-900 px-3 text-[10px] text-slate-500 font-mono uppercase">OR Enter PIN</span>
          </div>

          <form onSubmit={handleManualSubmit} className="flex gap-2">
            <input
              type="text"
              maxLength={6}
              placeholder="6-Digit PIN"
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value)}
              className="flex-1 px-4 py-2.5 bg-slate-900 border border-white/15 rounded-2xl text-center font-mono text-lg font-bold text-white placeholder-slate-600 focus:outline-none focus:border-purple-500"
            />
            <Button variant="secondary" type="submit" disabled={manualCode.length !== 6}>
              Connect
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};
