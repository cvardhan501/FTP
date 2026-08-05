"use client";

import React, { useEffect, useRef, useState } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";
import { X, Camera } from "lucide-react";
import { Button } from "../ui";

interface QRScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScanSuccess: (code: string) => void;
}

export const QRScannerModal: React.FC<QRScannerModalProps> = ({ isOpen, onClose, onScanSuccess }) => {
  const [manualCode, setManualCode] = useState("");
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    const scanner = new Html5QrcodeScanner(
      "qr-reader-region",
      { fps: 10, qrbox: { width: 250, height: 250 } },
      /* verbose= */ false
    );
    scannerRef.current = scanner;

    scanner.render(
      (decodedText) => {
        // Extract 6 digit code or URL search param
        let code = decodedText;
        if (decodedText.includes("code=")) {
          const match = decodedText.match(/code=(\d{6})/);
          if (match) code = match[1];
        }
        scanner.clear();
        onScanSuccess(code);
        onClose();
      },
      (error) => {
        // Ignore scan frame error
      }
    );

    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(() => {});
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="glass-panel w-full max-w-md p-6 rounded-3xl relative border border-white/20 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-full hover:bg-white/10 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 mb-4">
          <Camera className="w-6 h-6 text-purple-400" />
          <h2 className="text-xl font-bold text-white">Scan Session QR</h2>
        </div>

        <div id="qr-reader-region" className="w-full bg-slate-950 rounded-2xl overflow-hidden border border-white/10 mb-4"></div>

        <div className="text-center text-xs text-slate-400 mb-4">OR enter 6-digit code manually</div>

        <form onSubmit={handleManualSubmit} className="flex gap-2">
          <input
            type="text"
            maxLength={6}
            placeholder="e.g. 849201"
            value={manualCode}
            onChange={(e) => setManualCode(e.target.value)}
            className="flex-1 px-4 py-2 bg-slate-900 border border-white/10 rounded-xl text-center font-mono text-lg font-bold text-white placeholder-slate-600 focus:outline-none focus:border-purple-500"
          />
          <Button variant="secondary" type="submit" disabled={manualCode.length !== 6}>
            Connect
          </Button>
        </form>
      </div>
    </div>
  );
};
