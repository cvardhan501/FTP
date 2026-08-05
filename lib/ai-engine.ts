import { formatBytes, formatDuration } from "./utils";

export interface AIAnalysisResult {
  estimatedDurationSeconds: number;
  estimatedSpeedBps: number;
  duplicateWarning?: string;
  compressionTip?: string;
  networkQuality: 'ultra' | 'high' | 'medium' | 'low';
  recommendedChunkSizeKb: number;
}

export function analyzeTransferAI(
  files: { name: string; size: number; type: string }[],
  recentHistory: { fileName: string; fileSize: number }[],
  currentPingMs: number = 25
): AIAnalysisResult {
  const totalSizeBytes = files.reduce((acc, f) => acc + f.size, 0);

  // Network speed estimation based on WebRTC P2P Wi-Fi benchmarks
  // Ping latency factor: 10-30ms => ~40-80MB/s, 30-100ms => ~15-30MB/s, >100ms => ~5-10MB/s
  let baseSpeedMbps = 450; // 450 Mbps (~56 MB/s)
  if (currentPingMs > 100) baseSpeedMbps = 80;
  else if (currentPingMs > 50) baseSpeedMbps = 200;

  const estimatedSpeedBps = (baseSpeedMbps * 1024 * 1024) / 8;
  const estimatedDurationSeconds = Math.max(1, totalSizeBytes / estimatedSpeedBps);

  // Duplicate file detection
  let duplicateWarning: string | undefined = undefined;
  for (const file of files) {
    const match = recentHistory.find(
      (h) => h.fileName === file.name && h.fileSize === file.size
    );
    if (match) {
      duplicateWarning = `File "${file.name}" (${formatBytes(file.size)}) was already transferred recently.`;
      break;
    }
  }

  // Compression recommendation
  let compressionTip: string | undefined = undefined;
  const uncompressedMedia = files.filter(
    (f) =>
      f.size > 20 * 1024 * 1024 &&
      (f.type.includes("text") ||
        f.type.includes("json") ||
        f.type.includes("pdf") ||
        f.name.endsWith(".iso") ||
        f.name.endsWith(".tar") ||
        f.name.endsWith(".csv"))
  );

  if (uncompressedMedia.length > 0) {
    compressionTip = `Compressing large document/archive files could save ~35% transfer time.`;
  }

  // Network quality & Chunk size optimization
  let networkQuality: 'ultra' | 'high' | 'medium' | 'low' = 'ultra';
  let recommendedChunkSizeKb = 64;

  if (currentPingMs < 20) {
    networkQuality = 'ultra';
    recommendedChunkSizeKb = 128;
  } else if (currentPingMs < 50) {
    networkQuality = 'high';
    recommendedChunkSizeKb = 64;
  } else if (currentPingMs < 120) {
    networkQuality = 'medium';
    recommendedChunkSizeKb = 32;
  } else {
    networkQuality = 'low';
    recommendedChunkSizeKb = 16;
  }

  return {
    estimatedDurationSeconds,
    estimatedSpeedBps,
    duplicateWarning,
    compressionTip,
    networkQuality,
    recommendedChunkSizeKb,
  };
}
