"use client";

import React from "react";
import { cn } from "../../lib/utils";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "glass" | "outline" | "danger" | "ghost";
  size?: "sm" | "md" | "lg";
  glow?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", glow = false, children, ...props }, ref) => {
    const baseStyle =
      "inline-flex items-center justify-center font-medium rounded-xl transition-all duration-200 focus:outline-none disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98]";

    const sizeStyles = {
      sm: "px-3 py-1.5 text-xs gap-1.5",
      md: "px-4 py-2 text-sm gap-2",
      lg: "px-6 py-3 text-base gap-2.5 font-semibold",
    };

    const variantStyles = {
      primary: "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-lg shadow-blue-500/25",
      secondary: "bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white shadow-lg shadow-purple-500/25",
      glass: "glass-card text-white hover:bg-white/10 hover:border-blue-500/40",
      outline: "border border-white/20 hover:border-white/40 text-white hover:bg-white/5",
      danger: "bg-gradient-to-r from-red-600 to-rose-600 text-white hover:from-red-500 hover:to-rose-500 shadow-lg shadow-red-500/25",
      ghost: "text-slate-300 hover:text-white hover:bg-white/10",
    };

    return (
      <button
        ref={ref}
        className={cn(
          baseStyle,
          sizeStyles[size],
          variantStyles[variant],
          glow && "shadow-[0_0_20px_rgba(59,130,246,0.5)]",
          className
        )}
        {...props}
      >
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";

export const Card = ({ className, children }: { className?: string; children: React.ReactNode }) => {
  return (
    <div className={cn("glass-card rounded-2xl p-6 relative overflow-hidden", className)}>
      {children}
    </div>
  );
};

export const Badge = ({
  variant = "blue",
  children,
  className,
}: {
  variant?: "blue" | "purple" | "green" | "amber" | "rose";
  children: React.ReactNode;
  className?: string;
}) => {
  const variantStyles = {
    blue: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    purple: "bg-purple-500/10 text-purple-400 border-purple-500/20",
    green: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    amber: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    rose: "bg-rose-500/10 text-rose-400 border-rose-500/20",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border backdrop-blur-md",
        variantStyles[variant],
        className
      )}
    >
      {children}
    </span>
  );
};
