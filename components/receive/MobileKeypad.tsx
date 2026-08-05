"use client";

import React from "react";
import { Delete, ArrowRight, RotateCcw } from "lucide-react";
import { Button } from "../ui";

interface MobileKeypadProps {
  value: string;
  onChange: (val: string) => void;
  onSubmit: (code: string) => void;
  loading?: boolean;
}

export const MobileKeypad: React.FC<MobileKeypadProps> = ({
  value,
  onChange,
  onSubmit,
  loading = false,
}) => {
  const handleDigit = (digit: string) => {
    if (value.length < 6) {
      const next = value + digit;
      onChange(next);
      if (next.length === 6) {
        onSubmit(next);
      }
    }
  };

  const handleBackspace = () => {
    if (value.length > 0) {
      onChange(value.slice(0, -1));
    }
  };

  const handleClear = () => {
    onChange("");
  };

  return (
    <div className="space-y-6 w-full max-w-xs mx-auto">
      {/* 6 Digit Box Display */}
      <div className="flex justify-center items-center gap-2">
        {[0, 1, 2, 3, 4, 5].map((idx) => {
          const char = value[idx] || "";
          const isCurrent = value.length === idx;
          return (
            <div
              key={idx}
              className={`w-11 h-13 rounded-2xl flex items-center justify-center font-mono text-2xl font-bold border transition-all shadow-md ${
                char
                  ? "bg-purple-600/20 border-purple-500 text-purple-300 scale-[1.05]"
                  : isCurrent
                  ? "border-blue-400 bg-slate-900 animate-pulse text-white"
                  : "border-white/10 bg-slate-950/60 text-slate-600"
              }`}
            >
              {char}
            </div>
          );
        })}
      </div>

      {/* On-Screen Mobile Number Pad */}
      <div className="grid grid-cols-3 gap-3">
        {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((num) => (
          <button
            key={num}
            type="button"
            onClick={() => handleDigit(num)}
            className="h-14 rounded-2xl bg-slate-900/80 border border-white/10 hover:border-purple-500/40 text-white font-mono text-2xl font-bold active:scale-95 transition-all shadow-md flex items-center justify-center hover:bg-purple-600/20"
          >
            {num}
          </button>
        ))}

        <button
          type="button"
          onClick={handleClear}
          className="h-14 rounded-2xl bg-slate-900/50 border border-white/10 text-slate-400 hover:text-white font-medium text-xs active:scale-95 transition-all flex items-center justify-center"
        >
          <RotateCcw className="w-4 h-4 mr-1" /> Clear
        </button>

        <button
          type="button"
          onClick={() => handleDigit("0")}
          className="h-14 rounded-2xl bg-slate-900/80 border border-white/10 hover:border-purple-500/40 text-white font-mono text-2xl font-bold active:scale-95 transition-all shadow-md flex items-center justify-center hover:bg-purple-600/20"
        >
          0
        </button>

        <button
          type="button"
          onClick={handleBackspace}
          className="h-14 rounded-2xl bg-slate-900/50 border border-white/10 text-slate-400 hover:text-rose-400 font-medium text-xs active:scale-95 transition-all flex items-center justify-center"
        >
          <Delete className="w-5 h-5" />
        </button>
      </div>

      <Button
        variant="secondary"
        size="lg"
        onClick={() => onSubmit(value)}
        disabled={value.length !== 6 || loading}
        className="w-full py-3.5 text-base font-bold shadow-lg shadow-purple-500/25"
      >
        {loading ? "Connecting..." : "Connect to Sender"} <ArrowRight className="w-4 h-4 ml-2" />
      </Button>
    </div>
  );
};
