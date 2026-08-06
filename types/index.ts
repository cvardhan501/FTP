export type AppMode = 'landing' | 'home' | 'send' | 'receive' | 'radar' | 'clipboard' | 'history' | 'settings';

export interface DeviceInfo {
  id: string;
  name: string;
  os: 'windows' | 'mac' | 'linux' | 'android' | 'ios' | 'unknown';
  browser: string;
  isSelf?: boolean;
  pingMs?: number;
  signalStrength?: 'excellent' | 'good' | 'fair';
}

export interface FileItem {
  id: string;
  file: File;
  name: string;
  size: number;
  type: string;
  previewUrl?: string;
  isFolder?: boolean;
  relativePath?: string;
}

export interface IncomingFileMeta {
  id: string;
  name: string;
  size: number;
  type: string;
  lastModified?: number;
  totalChunks: number;
  iv: string; // Base64 or hex for AES-GCM
  salt: string;
  checksum?: string;
  senderName: string;
  senderId: string;
}

export interface TransferProgressState {
  transferId: string;
  fileName: string;
  fileSize: number;
  transferredBytes: number;
  currentChunk: number;
  totalChunks: number;
  speedBps: number;
  etaSeconds: number;
  percentage: number;
  status: 'idle' | 'encrypting' | 'connecting' | 'transferring' | 'paused' | 'completed' | 'cancelled' | 'error';
  errorMessage?: string;
  isSender: boolean;
}

export interface HistoryRecord {
  id: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  direction: 'sent' | 'received';
  peerName: string;
  timestamp: number;
  durationMs: number;
  avgSpeedBps: number;
  encrypted: boolean;
}

export interface AppSettings {
  theme: 'dark' | 'light';
  encryptionEnabled: boolean;
  sessionPassword?: string;
  soundEffects: boolean;
  desktopNotifications: boolean;
  autoSaveDownloads: boolean;
  autoAcceptFiles?: boolean;
  chunkSizeKb: number; // e.g. 64 KB
  deviceName?: string;
}

export interface ClipboardMessage {
  id: string;
  text: string;
  senderName: string;
  timestamp: number;
}
