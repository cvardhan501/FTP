"use client";

import React, { useEffect, useRef, useState } from "react";
import jsQR from "jsqr";
import { X, Camera, RefreshCw, AlertCircle, Scan, Upload, SwitchCamera, Check } from "lucide-react";
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
  const [availableDevices, setAvailableDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

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

  const getCameraDevices = async () => {
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter((d) => d.kind === "videoinput");
        setAvailableDevices(videoDevices);
      }
    } catch (e) {
      console.warn("[QRScanner] Failed to enumerate video devices:", e);
    }
  };

  const startCamera = async (overrideDeviceId?: string) => {
    setCameraError(null);
    setImageError(null);
    stopCamera();

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Camera API not supported on this browser.");
      }

      await getCameraDevices();

      let videoConstraint: boolean | MediaTrackConstraints = true;

      const devId = overrideDeviceId || selectedDeviceId;
      if (devId) {
        videoConstraint = { deviceId: { exact: devId } };
      } else {
        // Fallback strategy: Try rear camera ideal, else fallback to standard video
        videoConstraint = { facingMode: { ideal: "environment" }, width: { ideal: 1280 }, height: { ideal: 720 } };
      }

      let stream: MediaStream | null = null;
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: videoConstraint });
      } catch (err1) {
        console.warn("[QRScanner] First camera attempt failed, trying fallback to front/any camera:", err1);
        try {
          stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } });
        } catch (err2) {
          console.warn("[QRScanner] Second camera attempt failed, trying simple video: true", err2);
          stream = await navigator.mediaDevices.getUserMedia({ video: true });
        }
      }

      if (!stream) {
        throw new Error("Could not initialize video stream");
      }

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
          : "Webcam not detected or busy in another app. You can upload a QR image or enter PIN below."
      );
    }
  };

  const parseCodeFromText = (rawText: string): string | null => {
    if (!rawText) return null;
    const cleanText = rawText.trim();
    console.log("[QRScanner] Raw Decoded QR Text:", cleanText);

    // 1. Direct 6-character code
    if (/^[A-Za-z0-9]{6}$/.test(cleanText)) {
      return cleanText;
    }

    // 2. URL parameter code=XXXXXX
    const match = cleanText.match(/code=([A-Za-z0-9]{6})/i);
    if (match && match[1]) {
      return match[1];
    }

    // 3. Fallback: Any 6 digits/chars sequence
    const fallbackMatch = cleanText.match(/\b([A-Za-z0-9]{6})\b/);
    if (fallbackMatch && fallbackMatch[1]) {
      return fallbackMatch[1];
    }

    return null;
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
      inversionAttempts: "attemptBoth",
    });

    if (codeResult && codeResult.data) {
      const code = parseCodeFromText(codeResult.data);
      if (code) {
        stopCamera();
        onScanSuccess(code);
        onClose();
        return;
      }
    }

    animationFrameRef.current = requestAnimationFrame(scanFrame);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImageError(null);
    const reader = new FileReader();

    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = canvasRef.current || document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        if (!ctx) {
          setImageError("Could not process image context.");
          return;
        }

        ctx.drawImage(img, 0, 0, img.width, img.height);
        const imageData = ctx.getImageData(0, 0, img.width, img.height);
        const codeResult = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: "attemptBoth",
        });

        if (codeResult && codeResult.data) {
          const code = parseCodeFromText(codeResult.data);
          if (code) {
            stopCamera();
            onScanSuccess(code);
            onClose();
          } else {
            setImageError("QR code detected, but missing valid 6-digit session PIN.");
          }
        } else {
          setImageError("No valid AirDropX QR code found in the selected image.");
        }
      };
      img.src = event.target?.result as string;
    };

    reader.readAsDataURL(file);
  };

  const toggleCamera = () => {
    if (availableDevices.length < 2) return;
    const currentIndex = availableDevices.findIndex((d) => d.deviceId === selectedDeviceId);
    const nextIndex = (currentIndex + 1) % availableDevices.length;
    const nextDevId = availableDevices[nextIndex].deviceId;
    setSelectedDeviceId(nextDevId);
    startCamera(nextDevId);
  };

  useEffect(() => {
    if (isOpen) {
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

        {/* Hidden Canvas & File Input for QR Decoding */}
        <canvas ref={canvasRef} className="hidden" />
        <input
          type="file"
          accept="image/*"
          ref={fileInputRef}
          className="hidden"
          onChange={handleImageUpload}
        />

        {/* Camera Viewport Area (Perfect Square Shape) */}
        <div className="relative w-64 h-64 mx-auto bg-slate-950 rounded-[32px] overflow-hidden border-2 border-purple-500/40 shadow-2xl flex items-center justify-center">
          <video
            ref={videoRef}
            className="w-full h-full object-cover"
            playsInline
            muted
          />

          {/* Switch Camera Button (if multiple webcams) */}
          {availableDevices.length > 1 && isScanning && (
            <button
              onClick={toggleCamera}
              className="absolute top-3 right-3 p-2 bg-slate-900/80 hover:bg-purple-600 border border-white/20 rounded-full text-white text-xs flex items-center gap-1 backdrop-blur-md shadow-md transition-all"
              title="Switch Camera"
            >
              <SwitchCamera className="w-4 h-4" />
            </button>
          )}

          {/* Glowing Animated Target Corner Brackets & Scanner Line */}
          {isScanning && !cameraError && (
            <div className="absolute inset-0 pointer-events-none p-3 flex items-center justify-center">
              <div className="w-full h-full relative border-2 border-purple-400/50 rounded-2xl shadow-2xl">
                <div className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-purple-400 rounded-tl-xl" />
                <div className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-purple-400 rounded-tr-xl" />
                <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-purple-400 rounded-bl-xl" />
                <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-purple-400 rounded-br-xl" />

                <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-purple-400 to-transparent shadow-[0_0_15px_#a855f7] animate-[scanLaser_2s_ease-in-out_infinite]" />
              </div>
            </div>
          )}

          {/* Camera Error Message */}
          {cameraError && (
            <div className="absolute inset-0 p-5 bg-slate-950/95 flex flex-col items-center justify-center text-center space-y-3 text-xs text-rose-400 font-medium">
              <AlertCircle className="w-9 h-9" />
              <p className="text-[11px] leading-tight">{cameraError}</p>
              <Button variant="glass" size="sm" onClick={() => startCamera()} className="mt-1 py-1.5 px-3 text-xs">
                <RefreshCw className="w-3.5 h-3.5 mr-1" /> Retry Camera
              </Button>
            </div>
          )}
        </div>

        {/* Upload QR Image File Fallback */}
        <div className="flex flex-col gap-2">
          <Button
            variant="glass"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            className="w-full py-2 text-xs border-purple-500/30 text-purple-300 hover:bg-purple-500/10"
          >
            <Upload className="w-3.5 h-3.5 mr-1.5" /> Upload QR Screenshot / Photo
          </Button>

          {imageError && (
            <p className="text-[11px] text-rose-400 font-medium">{imageError}</p>
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

