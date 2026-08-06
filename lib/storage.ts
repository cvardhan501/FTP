import { AppSettings, HistoryRecord } from "../types";

const HISTORY_KEY = "airdropx_transfer_history";
const SETTINGS_KEY = "airdropx_app_settings";
const FAVORITES_KEY = "airdropx_favorite_devices";

export const DEFAULT_SETTINGS: AppSettings = {
  theme: "dark",
  encryptionEnabled: true,
  soundEffects: true,
  desktopNotifications: true,
  autoSaveDownloads: true,
  autoAcceptFiles: false,
  chunkSizeKb: 256,
  deviceName: "AirDropX Device",
};

export function getStoredSettings(): AppSettings {
  if (typeof window === "undefined") return DEFAULT_SETTINGS;
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch (e) {
    return DEFAULT_SETTINGS;
  }
}

export function saveStoredSettings(settings: AppSettings): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (e) {
    console.error("Failed to save settings to localStorage", e);
  }
}

export function getTransferHistory(): HistoryRecord[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

export function addHistoryRecord(record: HistoryRecord): void {
  if (typeof window === "undefined") return;
  try {
    const current = getTransferHistory();
    const updated = [record, ...current].slice(0, 100); // keep last 100
    localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error("Failed to record history", e);
  }
}

export function clearTransferHistory(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(HISTORY_KEY);
  } catch (e) {}
}
