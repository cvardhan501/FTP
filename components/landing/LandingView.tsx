"use client";

import React, { useState } from "react";
import { AppMode } from "../../types";
import { Send, Download, ShieldCheck, Zap, WifiOff, QrCode, Cpu, Layers, ArrowRight, Lock, CheckCircle2, HelpCircle, ChevronDown } from "lucide-react";
import { Button, Card, Badge } from "../ui";

interface LandingViewProps {
  onSelectMode: (mode: AppMode) => void;
}

export const LandingView: React.FC<LandingViewProps> = ({ onSelectMode }) => {
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const features = [
    {
      icon: Zap,
      title: "Direct Peer-to-Peer",
      desc: "Blazing fast WebRTC transfers directly between devices over local Wi-Fi or LAN without cloud bandwidth limits.",
      color: "from-blue-500 to-cyan-400",
    },
    {
      icon: ShieldCheck,
      title: "End-to-End Encrypted",
      desc: "Protected with military-grade AES-256-GCM WebCrypto encryption. Keys are generated client-side and never stored.",
      color: "from-purple-500 to-indigo-400",
    },
    {
      icon: WifiOff,
      title: "100% Offline & Private",
      desc: "Files never hit a server. Your photos, videos, and large archives stay completely private on your local network.",
      color: "from-emerald-500 to-teal-400",
    },
    {
      icon: QrCode,
      title: "Instant QR Pairing",
      desc: "Pair mobile phones, tablets, MacBooks, and Windows PCs instantly by scanning a QR code or entering a 6-digit PIN.",
      color: "from-amber-500 to-orange-400",
    },
    {
      icon: Cpu,
      title: "AI-Powered Diagnostics",
      desc: "Predicts real-time transfer speeds, detects duplicate files before sending, and optimizes chunk streaming parameters.",
      color: "from-pink-500 to-rose-400",
    },
    {
      icon: Layers,
      title: "Unlimited File Size",
      desc: "Transfer 20GB+ movies, raw disk images, or entire folder trees effortlessly with zero file size restrictions.",
      color: "from-blue-600 to-purple-600",
    },
  ];

  const faqs = [
    {
      q: "Does AirDropX upload my files to any cloud server?",
      a: "No! Absolutely zero files or file chunks are uploaded to any server. Socket.IO is used strictly for initial signaling (handshake), and file data streams directly device-to-device over WebRTC RTCDataChannel.",
    },
    {
      q: "What devices and operating systems are supported?",
      a: "AirDropX works on Windows, macOS, Linux, Android, iOS (iPhone/iPad), and tablets using any modern browser (Chrome, Safari, Edge, Firefox).",
    },
    {
      q: "Is there any limit on file size?",
      a: "There are no artificial file size limits! Whether you are sending a 2MB document or a 50GB 4K video file, AirDropX streams it seamlessly in 64KB chunks.",
    },
    {
      q: "Do devices need to be on the same Wi-Fi network?",
      a: "AirDropX works best on the same local Wi-Fi or LAN network for maximum gigabit speed. However, it can also traverse networks via WebRTC STUN/TURN servers when P2P routing is available.",
    },
  ];

  return (
    <div className="relative min-h-[calc(100vh-4.5rem)] overflow-hidden pb-16">
      {/* Background Aurora Blobs */}
      <div className="aurora-bg">
        <div className="aurora-blob w-96 h-96 bg-blue-600/30 top-10 left-1/4 animate-pulse-glow" />
        <div className="aurora-blob w-[500px] h-[500px] bg-purple-600/25 top-60 right-10 animate-float-slow" />
        <div className="aurora-blob w-80 h-80 bg-pink-600/20 bottom-10 left-10 animate-pulse-glow" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 md:pt-20">
        {/* Hero Section */}
        <div className="text-center max-w-4xl mx-auto mb-16 space-y-6">
          <Badge variant="blue" className="px-4 py-1.5 text-xs font-semibold uppercase tracking-wider mb-2">
            <Lock className="w-3.5 h-3.5 mr-1 text-blue-400" /> Next-Gen P2P File Sharing Engine
          </Badge>

          <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight leading-none">
            Transfer Files Instantly. <br />
            <span className="bg-gradient-to-r from-blue-400 via-indigo-300 to-purple-400 bg-clip-text text-transparent">
              No Cloud. No Limits.
            </span>
          </h1>

          <p className="text-lg sm:text-xl text-slate-300 max-w-2xl mx-auto leading-relaxed">
            Secure peer-to-peer file sharing with blazing-fast offline transfers. Send photos, 4K videos, and 20GB+ folders directly between devices.
          </p>

          {/* Primary Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Button
              variant="primary"
              size="lg"
              glow
              onClick={() => onSelectMode("send")}
              className="w-full sm:w-auto text-lg px-8 py-4 rounded-2xl group"
            >
              <Send className="w-5 h-5 mr-2 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
              Send Files Now
            </Button>

            <Button
              variant="glass"
              size="lg"
              onClick={() => onSelectMode("receive")}
              className="w-full sm:w-auto text-lg px-8 py-4 rounded-2xl border-white/20"
            >
              <Download className="w-5 h-5 mr-2 text-indigo-400" />
              Receive Files
            </Button>
          </div>

          {/* Supported OS Badges */}
          <div className="pt-8 flex flex-wrap justify-center items-center gap-6 text-xs text-slate-400">
            <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> Windows</span>
            <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> macOS</span>
            <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> Linux</span>
            <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> Android</span>
            <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> iPhone & iPad</span>
          </div>
        </div>

        {/* Live Transfer Animation Showcase */}
        <div className="max-w-4xl mx-auto mb-24">
          <Card className="border-blue-500/30 p-8 glowing-border">
            <div className="flex flex-col md:flex-row items-center justify-between gap-8 relative">
              {/* Sender Device Node */}
              <div className="flex flex-col items-center text-center">
                <div className="w-20 h-20 rounded-2xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center shadow-xl shadow-blue-500/20 mb-3">
                  <span className="text-3xl">💻</span>
                </div>
                <span className="font-bold text-white text-sm">MacBook Pro</span>
                <span className="text-xs text-blue-400">Sender (192.168.1.12)</span>
              </div>

              {/* Transfer Beam Particle Stream */}
              <div className="flex-1 w-full flex flex-col items-center">
                <div className="text-xs font-mono text-purple-400 mb-2 animate-pulse flex items-center gap-2">
                  <Lock className="w-3.5 h-3.5" /> AES-256 E2E Stream • 78.4 MB/s
                </div>
                <div className="w-full h-3 bg-slate-900 rounded-full overflow-hidden border border-white/10 relative p-0.5">
                  <div className="w-full h-full bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 rounded-full animate-beam-fast" />
                </div>
                <span className="text-[11px] text-slate-400 mt-2 font-mono">4K_RAW_Footage.mov (4.8 GB)</span>
              </div>

              {/* Receiver Device Node */}
              <div className="flex flex-col items-center text-center">
                <div className="w-20 h-20 rounded-2xl bg-purple-600/20 border border-purple-500/40 flex items-center justify-center shadow-xl shadow-purple-500/20 mb-3">
                  <span className="text-3xl">📱</span>
                </div>
                <span className="font-bold text-white text-sm">iPhone 15 Pro</span>
                <span className="text-xs text-purple-400">Receiver (192.168.1.45)</span>
              </div>
            </div>
          </Card>
        </div>

        {/* Feature Cards Grid */}
        <div className="mb-24">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-extrabold text-white">Why AirDropX?</h2>
            <p className="text-slate-400 text-sm mt-2">Built for speed, extreme privacy, and zero configuration.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feat, idx) => {
              const Icon = feat.icon;
              return (
                <Card key={idx} className="group hover:border-blue-500/50">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-tr ${feat.color} p-3 text-white mb-4 shadow-lg group-hover:scale-110 transition-transform`}>
                    <Icon className="w-full h-full" />
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">{feat.title}</h3>
                  <p className="text-sm text-slate-400 leading-relaxed">{feat.desc}</p>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Live Statistics Section */}
        <div className="glass-panel rounded-3xl p-8 mb-24 border-white/10 text-center grid grid-cols-1 sm:grid-cols-3 gap-8">
          <div>
            <div className="text-4xl sm:text-5xl font-extrabold text-blue-400 font-mono">100%</div>
            <div className="text-sm text-slate-300 font-medium mt-1">Peer-to-Peer</div>
            <div className="text-xs text-slate-500">No middleman server</div>
          </div>
          <div>
            <div className="text-4xl sm:text-5xl font-extrabold text-purple-400 font-mono">0 Bytes</div>
            <div className="text-sm text-slate-300 font-medium mt-1">Cloud Data Stored</div>
            <div className="text-xs text-slate-500">Total data privacy</div>
          </div>
          <div>
            <div className="text-4xl sm:text-5xl font-extrabold text-emerald-400 font-mono">∞</div>
            <div className="text-sm text-slate-300 font-medium mt-1">File Size Limit</div>
            <div className="text-xs text-slate-500">Stream 50GB+ easily</div>
          </div>
        </div>

        {/* FAQ Accordion Section */}
        <div className="max-w-3xl mx-auto mb-20">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-extrabold text-white flex items-center justify-center gap-2">
              <HelpCircle className="w-8 h-8 text-blue-400" /> Frequently Asked Questions
            </h2>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, idx) => (
              <div
                key={idx}
                className="glass-card rounded-2xl overflow-hidden border border-white/10"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                  className="w-full px-6 py-4 text-left flex items-center justify-between text-white font-semibold text-base focus:outline-none"
                >
                  <span>{faq.q}</span>
                  <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform ${openFaq === idx ? "rotate-180 text-blue-400" : ""}`} />
                </button>
                {openFaq === idx && (
                  <div className="px-6 pb-4 text-sm text-slate-300 border-t border-white/5 pt-3 leading-relaxed">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <footer className="border-t border-white/10 pt-8 text-center text-xs text-slate-500">
          <p>© 2026 AirDropX Engine. World-Class Offline Peer-to-Peer File Transfer System.</p>
        </footer>
      </div>
    </div>
  );
};
