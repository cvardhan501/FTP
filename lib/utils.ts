import { clsx, type ClassValue } from "clsx";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB", "PB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
}

export function formatSpeed(bytesPerSec: number): string {
  if (bytesPerSec <= 0) return "0 MB/s";
  return `${formatBytes(bytesPerSec)}/s`;
}

export function formatDuration(seconds: number): string {
  if (!isFinite(seconds) || seconds <= 0) return "0s";
  if (seconds < 60) return `${Math.ceil(seconds)}s`;
  const mins = Math.floor(seconds / 60);
  const secs = Math.ceil(seconds % 60);
  if (mins < 60) return `${mins}m ${secs}s`;
  const hours = Math.floor(mins / 60);
  const remMins = mins % 60;
  return `${hours}h ${remMins}m`;
}

export function generateSessionCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export function detectOS(): 'windows' | 'mac' | 'linux' | 'android' | 'ios' | 'unknown' {
  if (typeof window === "undefined") return "unknown";
  const userAgent = window.navigator.userAgent.toLowerCase();
  if (userAgent.includes("win")) return "windows";
  if (userAgent.includes("mac")) return "mac";
  if (userAgent.includes("android")) return "android";
  if (userAgent.includes("iphone") || userAgent.includes("ipad") || userAgent.includes("ipod")) return "ios";
  if (userAgent.includes("linux")) return "linux";
  return "unknown";
}

export function detectBrowser(): string {
  if (typeof window === "undefined") return "Browser";
  const userAgent = window.navigator.userAgent;
  if (userAgent.includes("Chrome")) return "Chrome";
  if (userAgent.includes("Safari") && !userAgent.includes("Chrome")) return "Safari";
  if (userAgent.includes("Firefox")) return "Firefox";
  if (userAgent.includes("Edg")) return "Edge";
  return "Browser";
}

export function generateRandomDeviceName(): string {
  if (typeof window === "undefined") return "AirDropX Device";

  // Check if user saved a custom device name in settings
  const saved = localStorage.getItem("airdropx_device_name");
  if (saved && saved.trim()) return saved.trim();

  const ua = window.navigator.userAgent;
  const os = detectOS();
  const browser = detectBrowser();

  if (os === "ios") {
    if (ua.includes("iPad")) return "iPad";
    return "iPhone";
  }
  if (os === "mac") return "MacBook Pro";
  if (os === "android") {
    if (ua.includes("Samsung") || ua.includes("SM-")) return "Samsung Galaxy";
    if (ua.includes("Pixel")) return "Google Pixel";
    if (ua.includes("OnePlus")) return "OnePlus Phone";
    if (ua.includes("Xiaomi") || ua.includes("Redmi")) return "Xiaomi Phone";
    return "Android Phone";
  }
  if (os === "windows") {
    return `Windows PC (${browser})`;
  }
  if (os === "linux") return `Linux Workstation`;

  return `${browser} Device`;
}
