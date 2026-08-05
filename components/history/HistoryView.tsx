"use client";

import React, { useState } from "react";
import { HistoryRecord } from "../../types";
import { History, Search, Download, Trash2, ShieldCheck, ArrowUpRight, ArrowDownLeft, File } from "lucide-react";
import { Button, Card, Badge } from "../ui";
import { formatBytes, formatSpeed } from "../../lib/utils";

interface HistoryViewProps {
  records: HistoryRecord[];
  onClearHistory: () => void;
}

export const HistoryView: React.FC<HistoryViewProps> = ({ records, onClearHistory }) => {
  const [searchTerm, setSearchTerm] = useState("");

  const filtered = records.filter(
    (r) =>
      r.fileName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.peerName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const exportJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(records, null, 2));
    const a = document.createElement("a");
    a.href = dataStr;
    a.download = "airdropx_transfer_history.json";
    a.click();
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8 animate-fadeIn">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-white flex items-center gap-3">
            <History className="w-8 h-8 text-blue-400" /> Transfer History
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Local log of sent and received encrypted transfers.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="glass" size="sm" onClick={exportJSON}>
            <Download className="w-4 h-4 mr-1.5 text-blue-400" /> Export JSON
          </Button>
          <Button variant="danger" size="sm" onClick={onClearHistory}>
            <Trash2 className="w-4 h-4 mr-1.5" /> Clear History
          </Button>
        </div>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="w-5 h-5 absolute left-4 top-3.5 text-slate-500" />
        <input
          type="text"
          placeholder="Search by file name or peer..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-12 pr-4 py-3 bg-slate-900 border border-white/10 rounded-2xl text-white text-sm focus:outline-none focus:border-blue-500 placeholder-slate-600"
        />
      </div>

      {/* Table / List */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-slate-500 text-sm glass-card rounded-2xl">
          No transfer history found.
        </div>
      ) : (
        <Card className="p-0 overflow-hidden border-white/10">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 text-slate-400 uppercase font-mono border-b border-white/10">
                <tr>
                  <th className="px-6 py-4">File Name</th>
                  <th className="px-6 py-4">Direction</th>
                  <th className="px-6 py-4">Peer</th>
                  <th className="px-6 py-4">Size</th>
                  <th className="px-6 py-4">Speed</th>
                  <th className="px-6 py-4">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-slate-200">
                {filtered.map((item) => (
                  <tr key={item.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4 font-semibold text-white flex items-center gap-2">
                      <File className="w-4 h-4 text-blue-400" />
                      <span className="truncate max-w-xs">{item.fileName}</span>
                    </td>
                    <td className="px-6 py-4">
                      {item.direction === "sent" ? (
                        <span className="inline-flex items-center gap-1 text-blue-400 font-medium">
                          <ArrowUpRight className="w-4 h-4" /> Sent
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-emerald-400 font-medium">
                          <ArrowDownLeft className="w-4 h-4" /> Received
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 font-mono text-slate-400">{item.peerName}</td>
                    <td className="px-6 py-4 font-mono">{formatBytes(item.fileSize)}</td>
                    <td className="px-6 py-4 font-mono text-purple-400">{formatSpeed(item.avgSpeedBps)}</td>
                    <td className="px-6 py-4 text-slate-400 font-mono">
                      {new Date(item.timestamp).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
};
