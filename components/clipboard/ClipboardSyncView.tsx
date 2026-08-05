"use client";

import React, { useState } from "react";
import { ClipboardMessage } from "../../types";
import { Clipboard, Send, Copy, Check, User, Sparkles } from "lucide-react";
import { Button, Card, Badge } from "../ui";

interface ClipboardSyncViewProps {
  messages: ClipboardMessage[];
  onSendText: (text: string) => void;
  peerConnected: boolean;
}

export const ClipboardSyncView: React.FC<ClipboardSyncViewProps> = ({
  messages,
  onSendText,
  peerConnected,
}) => {
  const [inputText, setInputText] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    onSendText(inputText.trim());
    setInputText("");
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8 animate-fadeIn">
      <div>
        <h1 className="text-3xl font-extrabold text-white flex items-center gap-3">
          <Clipboard className="w-8 h-8 text-indigo-400" /> Instant Text & Clipboard Sync
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Share links, code snippets, or clipboard text directly to connected peers in real time.
        </p>
      </div>

      <Card className="border-indigo-500/30">
        <form onSubmit={handleSubmit} className="space-y-4">
          <textarea
            rows={4}
            placeholder="Type or paste text, links, or code snippets here..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            className="w-full p-4 bg-slate-950 border border-white/10 rounded-2xl text-white text-sm focus:outline-none focus:border-indigo-500 placeholder-slate-600 resize-none font-mono"
          />

          <div className="flex items-center justify-between">
            <Badge variant={peerConnected ? "green" : "amber"}>
              {peerConnected ? "Connected to Peer" : "Local Mode"}
            </Badge>

            <Button
              variant="secondary"
              type="submit"
              disabled={!inputText.trim()}
              className="px-6 py-2.5"
            >
              <Send className="w-4 h-4 mr-2" /> Broadcast Snippet
            </Button>
          </div>
        </form>
      </Card>

      <div className="space-y-4">
        <h3 className="font-bold text-white text-lg flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-purple-400" /> Shared Snippets
        </h3>

        {messages.length === 0 ? (
          <div className="text-center py-12 text-slate-500 text-sm glass-card rounded-2xl">
            No snippets shared yet. Type something above to send to peers.
          </div>
        ) : (
          <div className="space-y-3">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className="p-4 rounded-2xl bg-slate-900/60 border border-white/10 flex items-start justify-between gap-4 hover:border-indigo-500/30 transition-colors"
              >
                <div className="space-y-2 overflow-hidden flex-1">
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <User className="w-3.5 h-3.5 text-indigo-400" />
                    <span className="font-semibold text-white">{msg.senderName}</span>
                    <span>• {new Date(msg.timestamp).toLocaleTimeString()}</span>
                  </div>
                  <pre className="text-sm font-mono text-slate-200 bg-slate-950 p-3 rounded-xl overflow-x-auto whitespace-pre-wrap">
                    {msg.text}
                  </pre>
                </div>

                <Button
                  variant="glass"
                  size="sm"
                  onClick={() => handleCopy(msg.id, msg.text)}
                  className="shrink-0"
                >
                  {copiedId === msg.id ? (
                    <Check className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
