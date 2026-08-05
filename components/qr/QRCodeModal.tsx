"use client";

import React, { useEffect, useState } from "react";
import QRCode from "qrcode";
import { X, Copy, Check, QrCode } from "lucide-react";
import { Button } from "../ui";

interface QRCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  sessionCode: string;
}

export const QRCodeModal: React.FC<QRCodeModalProps> = ({ isOpen, onClose, sessionCode }) => {
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!isOpen || !sessionCode) return;
    const shareUrl = typeof window !== "undefined" ? `${window.location.origin}?code=${sessionCode}` : sessionCode;

    QRCode.toDataURL(shareUrl, {
      width: 320,
      margin: 2,
      color: {
        dark: "#3b82f6",
        light: "#0f172a",
      },
    })
      .then((url) => setQrDataUrl(url))
      .catch((err) => console.error(err));
  }, [isOpen, sessionCode]);

  if (!isOpen) return null;

  const handleCopy = () => {
    const shareUrl = `${window.location.origin}?code=${sessionCode}`;
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fadeIn">
      <div className="glass-panel w-full max-w-md p-6 rounded-3xl relative border border-white/20 shadow-2xl text-center">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-full hover:bg-white/10 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center justify-center gap-2 mb-2">
          <QrCode className="w-6 h-6 text-blue-400" />
          <h2 className="text-xl font-bold text-white">Scan to Connect</h2>
        </div>
        <p className="text-xs text-slate-400 mb-6">
          Scan this QR Code using your mobile camera or another device running AirDropX.
        </p>

        {qrDataUrl && (
          <div className="inline-block p-4 bg-slate-900 rounded-2xl border border-blue-500/30 shadow-inner mb-6">
            <img src={qrDataUrl} alt="AirDropX Session QR" className="w-64 h-64 rounded-lg" />
          </div>
        )}

        <div className="bg-slate-950/60 p-3 rounded-xl border border-white/10 flex items-center justify-between gap-3 mb-4">
          <div className="text-left overflow-hidden">
            <span className="text-[10px] text-slate-500 uppercase tracking-widest block">Session Code</span>
            <span className="text-lg font-mono font-bold text-blue-400 tracking-wider">{sessionCode}</span>
          </div>
          <Button variant="glass" size="sm" onClick={handleCopy}>
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            {copied ? "Copied" : "Copy Link"}
          </Button>
        </div>

        <Button variant="primary" className="w-full" onClick={onClose}>
          Done
        </Button>
      </div>
    </div>
  );
};
