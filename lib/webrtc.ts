import { decryptChunk, encryptChunk, exportKeyRaw, generateAESKey, generateRandomIV, importKeyRaw } from "./crypto";

export interface WebRTCConfig {
  iceServers?: RTCIceServer[];
}

const DEFAULT_ICE_SERVERS: RTCIceServer[] = [
  { urls: "stun:stun.l.google.com:19302" },
  { urls: "stun:stun1.l.google.com:19302" },
  { urls: "stun:stun2.l.google.com:19302" },
  { urls: "stun:stun3.l.google.com:19302" },
  { urls: "stun:stun4.l.google.com:19302" },
  { urls: "stun:stun.services.mozilla.com" },
  { urls: "stun:global.stun.twilio.com:3478" },
];

export class P2PConnectionManager {
  peerConnection: RTCPeerConnection | null = null;
  dataChannel: RTCDataChannel | null = null;
  cryptoKey: CryptoKey | null = null;
  cryptoKeyHex: string | null = null;

  onIceCandidate?: (candidate: RTCIceCandidate) => void;
  onDataChannelOpen?: () => void;
  onDataChannelClose?: () => void;
  onFileChunkReceived?: (chunkIndex: number, totalChunks: number, data: ArrayBuffer) => void;
  onTransferProgress?: (transferredBytes: number, totalBytes: number, speedBps: number) => void;

  private isPaused = false;
  private isCancelled = false;
  private pendingIceCandidates: RTCIceCandidateInit[] = [];

  constructor() {}

  async initialize(isInitiator: boolean): Promise<void> {
    this.peerConnection = new RTCPeerConnection({
      iceServers: DEFAULT_ICE_SERVERS,
      iceCandidatePoolSize: 10,
    });

    this.pendingIceCandidates = [];

    // Generate AES key for session encryption
    this.cryptoKey = await generateAESKey();
    this.cryptoKeyHex = await exportKeyRaw(this.cryptoKey);

    this.peerConnection.onicecandidate = (event) => {
      if (event.candidate && this.onIceCandidate) {
        this.onIceCandidate(event.candidate);
      }
    };

    if (isInitiator) {
      this.dataChannel = this.peerConnection.createDataChannel("airdropx-transfer", {
        ordered: true,
      });
      this.setupDataChannel(this.dataChannel);
    } else {
      this.peerConnection.ondatachannel = (event) => {
        this.dataChannel = event.channel;
        this.setupDataChannel(this.dataChannel);
      };
    }
  }

  setCryptoKeyHex(hexKey: string): Promise<void> {
    this.cryptoKeyHex = hexKey;
    return importKeyRaw(hexKey).then((key) => {
      this.cryptoKey = key;
    });
  }

  private setupDataChannel(channel: RTCDataChannel) {
    channel.binaryType = "arraybuffer";

    channel.onopen = () => {
      console.log("[P2P] DataChannel opened!");
      if (this.onDataChannelOpen) this.onDataChannelOpen();
    };

    channel.onclose = () => {
      console.log("[P2P] DataChannel closed!");
      if (this.onDataChannelClose) this.onDataChannelClose();
    };

    channel.onmessage = async (event) => {
      if (typeof event.data === "string") {
        try {
          const msg = JSON.parse(event.data);
          if (msg.type === "KEY_EXCHANGE") {
            await this.setCryptoKeyHex(msg.keyHex);
          }
        } catch (e) {}
      } else if (event.data instanceof ArrayBuffer) {
        const buffer = event.data;
        const iv = new Uint8Array(buffer.slice(0, 12));
        const encryptedBody = buffer.slice(12);

        let chunkData: ArrayBuffer = encryptedBody;
        if (this.cryptoKey) {
          try {
            chunkData = await decryptChunk(this.cryptoKey, encryptedBody, iv);
          } catch (err) {
            console.error("[P2P] Chunk decryption error, fallback to raw", err);
          }
        }

        if (this.onFileChunkReceived) {
          const view = new DataView(chunkData);
          const chunkIndex = view.getUint32(0);
          const totalChunks = view.getUint32(4);
          const actualChunkBytes = chunkData.slice(8);
          this.onFileChunkReceived(chunkIndex, totalChunks, actualChunkBytes);
        }
      }
    };
  }

  async createOffer(): Promise<RTCSessionDescriptionInit> {
    if (!this.peerConnection) throw new Error("PeerConnection not initialized");
    const offer = await this.peerConnection.createOffer();
    await this.peerConnection.setLocalDescription(offer);
    return offer;
  }

  async handleOffer(offer: RTCSessionDescriptionInit): Promise<RTCSessionDescriptionInit> {
    if (!this.peerConnection) throw new Error("PeerConnection not initialized");
    await this.peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
    await this.flushPendingIceCandidates();
    const answer = await this.peerConnection.createAnswer();
    await this.peerConnection.setLocalDescription(answer);
    return answer;
  }

  async handleAnswer(answer: RTCSessionDescriptionInit): Promise<void> {
    if (!this.peerConnection) throw new Error("PeerConnection not initialized");
    await this.peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
    await this.flushPendingIceCandidates();
  }

  async addIceCandidate(candidate: RTCIceCandidateInit): Promise<void> {
    if (!this.peerConnection || !this.peerConnection.remoteDescription) {
      this.pendingIceCandidates.push(candidate);
      return;
    }
    try {
      await this.peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
    } catch (e) {
      console.warn("[P2P] Failed to add ICE candidate:", e);
    }
  }

  private async flushPendingIceCandidates() {
    if (!this.peerConnection || !this.peerConnection.remoteDescription) return;
    while (this.pendingIceCandidates.length > 0) {
      const candidate = this.pendingIceCandidates.shift();
      if (candidate) {
        try {
          await this.peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (e) {
          console.warn("[P2P] Failed to flush ICE candidate:", e);
        }
      }
    }
  }

  sendKeyExchange() {
    if (this.dataChannel && this.dataChannel.readyState === "open" && this.cryptoKeyHex) {
      this.dataChannel.send(
        JSON.stringify({ type: "KEY_EXCHANGE", keyHex: this.cryptoKeyHex })
      );
    }
  }

  async sendFile(
    file: File,
    chunkSizeKb: number = 64,
    onProgress?: (sentBytes: number, totalBytes: number, speedBps: number) => void
  ): Promise<void> {
    if (!this.dataChannel || this.dataChannel.readyState !== "open") {
      throw new Error("DataChannel is not open");
    }

    this.isPaused = false;
    this.isCancelled = false;

    const chunkSize = chunkSizeKb * 1024;
    const totalSize = file.size;
    const totalChunks = Math.ceil(totalSize / chunkSize);

    let sentBytes = 0;
    let startTime = Date.now();
    let lastTime = startTime;
    let bytesSinceLast = 0;

    this.sendKeyExchange();

    // High performance paced chunk streaming loop
    for (let i = 0; i < totalChunks; i++) {
      if (this.isCancelled) {
        console.log("[P2P] Transfer cancelled by user");
        return;
      }

      while (this.isPaused) {
        await new Promise((res) => setTimeout(res, 100));
      }

      const start = i * chunkSize;
      const end = Math.min(start + chunkSize, totalSize);
      const fileSlice = file.slice(start, end);
      const rawBuffer = await fileSlice.arrayBuffer();

      const header = new ArrayBuffer(8);
      const headerView = new DataView(header);
      headerView.setUint32(0, i);
      headerView.setUint32(4, totalChunks);

      const combined = new Uint8Array(header.byteLength + rawBuffer.byteLength);
      combined.set(new Uint8Array(header), 0);
      combined.set(new Uint8Array(rawBuffer), header.byteLength);

      let payloadBuffer: ArrayBuffer = combined.buffer;
      const iv = generateRandomIV();

      if (this.cryptoKey) {
        const encrypted = await encryptChunk(this.cryptoKey, combined.buffer, iv);
        const finalBuffer = new Uint8Array(12 + encrypted.byteLength);
        finalBuffer.set(iv, 0);
        finalBuffer.set(new Uint8Array(encrypted), 12);
        payloadBuffer = finalBuffer.buffer;
      }

      // Smart Pacing: Keep bufferedAmount under 256KB to avoid WebRTC queue chokes
      while (this.dataChannel && this.dataChannel.bufferedAmount > 256 * 1024) {
        if (this.isCancelled) return;
        await new Promise((res) => setTimeout(res, 4));
      }

      // Safe Send with Retry Recovery
      let sentSuccess = false;
      let retries = 0;
      while (!sentSuccess && retries < 5) {
        try {
          if (!this.dataChannel || this.dataChannel.readyState !== "open") {
            throw new Error("DataChannel connection closed during send");
          }
          this.dataChannel.send(payloadBuffer);
          sentSuccess = true;
        } catch (err) {
          retries++;
          console.warn(`[P2P] Buffer pressure on chunk ${i}, retrying (${retries}/5)...`);
          await new Promise((res) => setTimeout(res, 15));
        }
      }

      sentBytes += end - start;
      bytesSinceLast += end - start;

      const now = Date.now();
      const timeDiff = (now - lastTime) / 1000;
      if (timeDiff >= 0.05 || i === totalChunks - 1) {
        const speedBps = bytesSinceLast / (timeDiff || 0.001);
        if (onProgress) onProgress(sentBytes, totalSize, speedBps);
        lastTime = now;
        bytesSinceLast = 0;
      }
    }
  }

  pauseTransfer() {
    this.isPaused = true;
  }

  resumeTransfer() {
    this.isPaused = false;
  }

  cancelTransfer() {
    this.isCancelled = true;
  }

  close() {
    if (this.dataChannel) {
      this.dataChannel.close();
      this.dataChannel = null;
    }
    if (this.peerConnection) {
      this.peerConnection.close();
      this.peerConnection = null;
    }
  }
}
