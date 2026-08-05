"use client";

import React, { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { X, Camera, AlertCircle } from "lucide-react";
import { Button } from "../ui";

interface QRScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScanSuccess: (code: string) => void;
}

export const QRScannerModal: React.FC<QRScannerModalProps> = ({ isOpen, onClose, onScanSuccess }) => {
  const [manualCode, setManualCode] = useState("");
  const [cameraError, setCameraError] = useState<string | null>(null);
  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    setCameraError(null);
    const regionId = "qr-reader-region";

    // Initialize Html5Qrcode engine directly
    const html5QrCode = new Html5Qrcode(regionId);
    html5QrCodeRef.current = html5QrCode;

    // Start back camera directly (facingMode: environment)
    html5QrCode
      .start(
        { facingMode: "environment" },
        { fps: 15, qrbox: { width: 220, height: 220 } },
        (decodedText) => {
          let code = decodedText.trim();
          if (decodedText.includes("code=")) {
            const match = decodedText.match(/code=(\d{6})/);
            if (match) code = match[1];
          }

          html5QrCode
            .stop()
            .then(() => {
              onScanSuccess(code);
              onClose();
            })
            .catch(() => {
              onScanSuccess(code);
              onClose();
            });
        },
        () => {
          // Ignore frame scan errors
        }
      )
      .catch((err) => {
        console.warn("[QR Scanner] Camera start error:", err);
        setCameraError("Camera access denied or unavailable. Please enter 6-digit code below.");
      });

    return () => {
      if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
        html5QrCodeRef.current.stop().catch(() => {});
      }
    };
  }, [isOpen, onClose, onScanSuccess]);

  if (!isOpen) return null;

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualCode.trim().length === 6) {
      onScanSuccess(manualCode.trim());
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xl animate-fadeIn">
      <div className="glass-panel w-full max-w-sm p-6 rounded-[32px] relative border border-purple-500/40 shadow-2xl space-y-5 text-center">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-full hover:bg-white/10 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Title */}
        <div className="flex items-center justify-center gap-2 text-purple-300 font-bold text-lg">
          <Camera className="w-5 h-5" />
          <span>Scan Session QR Code</span>
        </div>

        {/* Camera View Area */}
        <div className="relative w-full h-64 bg-slate-950 rounded-2xl overflow-hidden border border-white/15 shadow-inner flex items-center justify-center">
          <div id="qr-reader-region" className="w-full h-full object-cover"></div>

          {cameraError && (
            <div className="absolute inset-0 p-4 bg-slate-950/90 flex flex-col items-center justify-center text-center space-y-2 text-xs text-rose-400 font-medium">
              <AlertCircle className="w-8 h-8" />
              <p>{cameraError}</p>
            </div>
          )}
        </div>

        {/* Manual PIN Fallback */}
        <div className="space-y-3 pt-1">
          <div className="relative text-center">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/10" /></div>
            <span className="relative bg-slate-900 px-3 text-[11px] text-slate-500 font-mono uppercase">OR Enter PIN</span>
          </div>

          <form onSubmit={handleManualSubmit} className="flex gap-2">
            <input
              type="text"
              maxLength={6}
              placeholder="6-Digit PIN"
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value)}
              className="flex-1 px-4 py-2.5 bg-slate-900 border border-white/15 rounded-xl text-center font-mono text-lg font-bold text-white placeholder-slate-600 focus:outline-none focus:border-purple-500"
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
